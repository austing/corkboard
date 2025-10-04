/**
 * Fixture Generation and Import Utilities
 *
 * Provides offline sync functionality for Corkboard:
 * - Mirror Fixture: Full snapshot for offline work (excludes passwords, invisible content)
 * - Update Fixture: Local changes to sync back to server
 */

import { db } from './db';
import { scraps, users } from './db/schema';
import { eq } from 'drizzle-orm';

export interface User {
  id: string;
  email: string;
  name: string;
  password?: string;
}

export interface Scrap {
  id: string;
  code: string;
  content: string;
  userId: string;
  visible: boolean;
  x: number;
  y: number;
  nestedWithin: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface MirrorFixture {
  users: User[];
  scraps: Scrap[];
}

export interface UpdateFixture {
  scraps: Scrap[];
}

export interface UpdateResult {
  updated: Scrap[];
  skipped: Array<{ scrap: Scrap; reason: 'not_owner' | 'newer_on_server' }>;
  created: Scrap[];
  parentCreated: Array<{ parentId: string; childId: string }>;
}

/**
 * Generate Mirror Fixture
 *
 * Creates a snapshot of all viewable data for offline work:
 * - Includes all public scraps and user's own private scraps
 * - Replaces all other users with single dummy user
 * - Excludes passwords for security
 * - Hides content of other users' invisible scraps
 *
 * @param currentUserId - ID of user generating the fixture
 * @returns Mirror fixture ready for download
 */
export async function generateMirrorFixture(currentUserId: string): Promise<MirrorFixture> {
  // Fetch all users
  const allUsers = await db.select().from(users);

  // Fetch all scraps
  const allScraps = await db.select().from(scraps);

  // Create dummy user for others
  const dummyUser: User = {
    id: 'dummy-user-id',
    email: 'dummy@example.com',
    name: 'Other Users',
  };

  // Create "me" user (current user without password)
  const currentUser = allUsers.find(u => u.id === currentUserId);
  if (!currentUser) {
    throw new Error('Current user not found');
  }

  const meUser: User = {
    id: currentUser.id,
    email: currentUser.email,
    name: currentUser.name || '',
  };

  // Filter and transform scraps
  const mirrorScraps = allScraps
    .filter(scrap => {
      // Include if: owned by me OR visible to everyone
      return scrap.userId === currentUserId || scrap.visible === true;
    })
    .map(scrap => {
      // Replace other users' IDs with dummy
      const userId = scrap.userId === currentUserId ? currentUserId : dummyUser.id;

      // Hide content if invisible and not mine
      const content = (scrap.visible === false && scrap.userId !== currentUserId)
        ? ''
        : scrap.content;

      return {
        ...scrap,
        userId,
        content,
      };
    });

  return {
    users: [dummyUser, meUser],
    scraps: mirrorScraps,
  };
}

/**
 * Generate Update Fixture
 *
 * Creates a fixture of local changes to sync back to server:
 * - Only includes current user's scraps
 * - Optionally filters by date (changes since last sync)
 * - Preserves original IDs for server matching
 *
 * @param currentUserId - ID of user generating the fixture
 * @param since - Optional date to filter changes after
 * @returns Update fixture ready for upload
 */
export async function generateUpdateFixture(
  currentUserId: string,
  since?: Date
): Promise<UpdateFixture> {
  // Fetch user's scraps
  const userScraps = await db.select().from(scraps).where(eq(scraps.userId, currentUserId));

  // Filter by date if provided
  const updateScraps = since
    ? userScraps.filter(scrap => scrap.updatedAt > since)
    : userScraps;

  return {
    scraps: updateScraps,
  };
}

/**
 * Import Mirror Fixture
 *
 * Imports a complete snapshot, replacing all local scraps:
 * - WIPES all existing scraps (destructive!)
 * - Imports all users from fixture
 * - Imports all scraps from fixture
 *
 * ⚠️ WARNING: This will delete all existing scraps!
 *
 * @param fixture - Mirror fixture to import
 */
export async function importMirrorFixture(fixture: MirrorFixture): Promise<void> {
  // Delete all scraps
  await db.delete(scraps);

  // Import users (upsert to avoid duplicates)
  for (const user of fixture.users) {
    await db
      .insert(users)
      .values({
        id: user.id,
        email: user.email,
        name: user.name,
        password: user.password || null,
      })
      .onConflictDoUpdate({
        target: users.id,
        set: {
          email: user.email,
          name: user.name,
        },
      });
  }

  // Import scraps
  for (const scrap of fixture.scraps) {
    await db.insert(scraps).values({
      id: scrap.id,
      code: scrap.code,
      content: scrap.content,
      userId: scrap.userId,
      visible: scrap.visible,
      x: scrap.x,
      y: scrap.y,
      nestedWithin: scrap.nestedWithin,
      createdAt: scrap.createdAt,
      updatedAt: scrap.updatedAt,
    });
  }
}

/**
 * Import Update Fixture
 *
 * Imports local changes, with conflict resolution:
 * - Updates scraps if: owned by current user AND server version older
 * - Creates new scraps if they don't exist
 * - Creates placeholder parents if nested reference missing
 * - Skips scraps that are not owned or have newer server version
 *
 * @param fixture - Update fixture to import
 * @param currentUserId - ID of user importing (for ownership check)
 * @returns Results showing updated, skipped, and created scraps
 */
export async function importUpdateFixture(
  fixture: UpdateFixture,
  currentUserId: string
): Promise<UpdateResult> {
  const result: UpdateResult = {
    updated: [],
    skipped: [],
    created: [],
    parentCreated: [],
  };

  for (const incomingScrap of fixture.scraps) {
    // Check if scrap exists
    const existingScrapResults = await db
      .select()
      .from(scraps)
      .where(eq(scraps.id, incomingScrap.id));

    const existingScrap = existingScrapResults[0];

    // Check if parent exists (if nested)
    if (incomingScrap.nestedWithin) {
      const parentResults = await db
        .select()
        .from(scraps)
        .where(eq(scraps.id, incomingScrap.nestedWithin));

      if (parentResults.length === 0) {
        // Create placeholder parent
        const placeholderCode = `PLACEHOLDER-${incomingScrap.nestedWithin.slice(0, 8)}`;
        await db.insert(scraps).values({
          id: incomingScrap.nestedWithin,
          code: placeholderCode,
          content: '',
          userId: currentUserId,
          visible: true,
          x: 0,
          y: 0,
          nestedWithin: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        result.parentCreated.push({
          parentId: incomingScrap.nestedWithin,
          childId: incomingScrap.id,
        });
      }
    }

    if (!existingScrap) {
      // New scrap - create it
      await db.insert(scraps).values({
        id: incomingScrap.id,
        code: incomingScrap.code,
        content: incomingScrap.content,
        userId: incomingScrap.userId,
        visible: incomingScrap.visible,
        x: incomingScrap.x,
        y: incomingScrap.y,
        nestedWithin: incomingScrap.nestedWithin,
        createdAt: incomingScrap.createdAt,
        updatedAt: incomingScrap.updatedAt,
      });

      result.created.push(incomingScrap);
    } else {
      // Existing scrap - check ownership and date
      if (existingScrap.userId !== currentUserId) {
        result.skipped.push({
          scrap: incomingScrap,
          reason: 'not_owner',
        });
      } else if (existingScrap.updatedAt > incomingScrap.updatedAt) {
        result.skipped.push({
          scrap: incomingScrap,
          reason: 'newer_on_server',
        });
      } else {
        // Update allowed
        await db
          .update(scraps)
          .set({
            code: incomingScrap.code,
            content: incomingScrap.content,
            visible: incomingScrap.visible,
            x: incomingScrap.x,
            y: incomingScrap.y,
            nestedWithin: incomingScrap.nestedWithin,
            updatedAt: incomingScrap.updatedAt,
          })
          .where(eq(scraps.id, incomingScrap.id));

        result.updated.push(incomingScrap);
      }
    }
  }

  return result;
}

/**
 * Serialize fixture to JSON string
 * @param fixture - Fixture to serialize
 * @returns JSON string ready for download
 */
export function serializeFixture(fixture: MirrorFixture | UpdateFixture): string {
  return JSON.stringify(fixture, null, 2);
}

/**
 * Parse fixture from JSON string
 * @param json - JSON string to parse
 * @returns Parsed fixture
 */
export function parseFixture(json: string): MirrorFixture | UpdateFixture {
  const parsed = JSON.parse(json);

  // Convert date strings back to Date objects
  if (parsed.scraps) {
    parsed.scraps = parsed.scraps.map((scrap: Scrap) => ({
      ...scrap,
      createdAt: new Date(scrap.createdAt),
      updatedAt: new Date(scrap.updatedAt),
    }));
  }

  return parsed;
}
