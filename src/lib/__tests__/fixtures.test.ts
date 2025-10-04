/**
 * Fixture Generation and Import Tests
 *
 * Tests for offline sync functionality:
 * 1. Mirror Fixture - Full snapshot excluding passwords and invisible content
 * 2. Update Fixture - Local changes to sync back to server
 */

import { describe, it, expect, beforeEach } from '@jest/globals';

// Mock data setup
interface User {
  id: string;
  email: string;
  name: string;
  password?: string;
}

interface Scrap {
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

interface MirrorFixture {
  users: User[];
  scraps: Scrap[];
}

interface UpdateFixture {
  scraps: Scrap[];
}

interface UpdateResult {
  updated: Scrap[];
  skipped: Array<{ scrap: Scrap; reason: 'not_owner' | 'newer_on_server' }>;
  created: Scrap[];
  parentCreated: Array<{ parentId: string; childId: string }>;
}

// Fixture utility functions to be implemented
class FixtureGenerator {
  /**
   * Generate Mirror Fixture
   * - Includes all viewable scraps (public + user's own)
   * - Replaces all other users with single dummy user
   * - Excludes passwords
   * - Excludes content of invisible scraps
   */
  static generateMirrorFixture(currentUserId: string, allUsers: User[], allScraps: Scrap[]): MirrorFixture {
    // Create dummy user for others
    const dummyUser: User = {
      id: 'dummy-user-id',
      email: 'dummy@example.com',
      name: 'Other Users',
    };

    // Create "me" user (current user without password)
    const currentUser = allUsers.find(u => u.id === currentUserId)!;
    const meUser: User = {
      id: currentUser.id,
      email: currentUser.email,
      name: currentUser.name,
    };

    // Transform all scraps (include everything, even other users' private scraps)
    const mirrorScraps = allScraps.map(scrap => {
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
   * - Only includes scraps created/modified by current user since last sync
   * - Preserves original IDs for server matching
   */
  static generateUpdateFixture(currentUserId: string, scraps: Scrap[], since?: Date): UpdateFixture {
    const updateScraps = scraps.filter(scrap => {
      // Only include user's own scraps
      if (scrap.userId !== currentUserId) return false;

      // If since date provided, only include updated after that
      if (since && scrap.updatedAt <= since) return false;

      return true;
    });

    return {
      scraps: updateScraps,
    };
  }

  /**
   * Import Mirror Fixture
   * - Wipes all existing scraps
   * - Imports all users and scraps from fixture
   */
  static async importMirrorFixture(fixture: MirrorFixture, db: any): Promise<void> {
    // Delete all scraps
    await db.scraps.deleteAll();

    // Import users (skip if already exist)
    for (const user of fixture.users) {
      await db.users.upsert(user);
    }

    // Import scraps
    for (const scrap of fixture.scraps) {
      await db.scraps.create(scrap);
    }
  }

  /**
   * Import Update Fixture
   * - Updates scraps if: owned by current user AND server version older
   * - Creates new scraps if they don't exist
   * - Creates placeholder parent scraps if needed
   * - Returns results including skipped scraps with reasons
   */
  static async importUpdateFixture(
    fixture: UpdateFixture,
    currentUserId: string,
    db: any
  ): Promise<UpdateResult> {
    const result: UpdateResult = {
      updated: [],
      skipped: [],
      created: [],
      parentCreated: [],
    };

    for (const incomingScrap of fixture.scraps) {
      const existingScrap = await db.scraps.findById(incomingScrap.id);

      // Check if parent exists (if nested)
      if (incomingScrap.nestedWithin) {
        const parentExists = await db.scraps.findById(incomingScrap.nestedWithin);
        if (!parentExists) {
          // Create placeholder parent
          await db.scraps.create({
            id: incomingScrap.nestedWithin,
            code: `PLACEHOLDER-${incomingScrap.nestedWithin.slice(0, 8)}`,
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
        await db.scraps.create(incomingScrap);
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
          await db.scraps.update(incomingScrap.id, incomingScrap);
          result.updated.push(incomingScrap);
        }
      }
    }

    return result;
  }
}

describe('Mirror Fixture Generation', () => {
  let users: User[];
  let scraps: Scrap[];
  const currentUserId = 'user-1';
  const otherUserId1 = 'user-2';
  const otherUserId2 = 'user-3';

  beforeEach(() => {
    users = [
      {
        id: currentUserId,
        email: 'me@example.com',
        name: 'Me',
        password: 'secret-password',
      },
      {
        id: otherUserId1,
        email: 'other1@example.com',
        name: 'Other User 1',
        password: 'their-password',
      },
      {
        id: otherUserId2,
        email: 'other2@example.com',
        name: 'Other User 2',
        password: 'another-password',
      },
    ];

    scraps = [
      // My visible scrap
      {
        id: 'scrap-1',
        code: 'ABC123',
        content: 'My public content',
        userId: currentUserId,
        visible: true,
        x: 100,
        y: 100,
        nestedWithin: null,
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-01'),
      },
      // My invisible scrap
      {
        id: 'scrap-2',
        code: 'DEF456',
        content: 'My private content',
        userId: currentUserId,
        visible: false,
        x: 200,
        y: 200,
        nestedWithin: null,
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-01'),
      },
      // Other user's visible scrap
      {
        id: 'scrap-3',
        code: 'GHI789',
        content: 'Other user public content',
        userId: otherUserId1,
        visible: true,
        x: 300,
        y: 300,
        nestedWithin: null,
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-01'),
      },
      // Other user's invisible scrap (should not be included)
      {
        id: 'scrap-4',
        code: 'JKL012',
        content: 'Other user private content',
        userId: otherUserId1,
        visible: false,
        x: 400,
        y: 400,
        nestedWithin: null,
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-01'),
      },
      // Another user's visible scrap
      {
        id: 'scrap-5',
        code: 'MNO345',
        content: 'Another user public content',
        userId: otherUserId2,
        visible: true,
        x: 500,
        y: 500,
        nestedWithin: null,
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-01'),
      },
    ];
  });

  it('should include all scraps (including invisible ones)', () => {
    const fixture = FixtureGenerator.generateMirrorFixture(currentUserId, users, scraps);

    // Should have all 5 scraps (including other users' invisible scraps)
    expect(fixture.scraps).toHaveLength(5);

    // Should include other user's invisible scrap
    const invisibleOtherScrap = fixture.scraps.find(s => s.id === 'scrap-4');
    expect(invisibleOtherScrap).toBeDefined();
  });

  it('should replace all other users with dummy user', () => {
    const fixture = FixtureGenerator.generateMirrorFixture(currentUserId, users, scraps);

    // Should have exactly 2 users: dummy and me
    expect(fixture.users).toHaveLength(2);

    const dummyUser = fixture.users.find(u => u.id === 'dummy-user-id');
    const meUser = fixture.users.find(u => u.id === currentUserId);

    expect(dummyUser).toBeDefined();
    expect(meUser).toBeDefined();
    expect(meUser?.email).toBe('me@example.com');
  });

  it('should not include passwords', () => {
    const fixture = FixtureGenerator.generateMirrorFixture(currentUserId, users, scraps);

    fixture.users.forEach(user => {
      expect(user.password).toBeUndefined();
    });
  });

  it('should map other users scraps to dummy user', () => {
    const fixture = FixtureGenerator.generateMirrorFixture(currentUserId, users, scraps);

    const otherUserScrap = fixture.scraps.find(s => s.id === 'scrap-3');
    expect(otherUserScrap?.userId).toBe('dummy-user-id');

    const anotherUserScrap = fixture.scraps.find(s => s.id === 'scrap-5');
    expect(anotherUserScrap?.userId).toBe('dummy-user-id');
  });

  it('should preserve my user ID for my scraps', () => {
    const fixture = FixtureGenerator.generateMirrorFixture(currentUserId, users, scraps);

    const myScrap1 = fixture.scraps.find(s => s.id === 'scrap-1');
    const myScrap2 = fixture.scraps.find(s => s.id === 'scrap-2');

    expect(myScrap1?.userId).toBe(currentUserId);
    expect(myScrap2?.userId).toBe(currentUserId);
  });

  it('should preserve content for my invisible scraps', () => {
    const fixture = FixtureGenerator.generateMirrorFixture(currentUserId, users, scraps);

    const myInvisibleScrap = fixture.scraps.find(s => s.id === 'scrap-2');
    expect(myInvisibleScrap?.content).toBe('My private content');
  });

  it('should preserve content for visible scraps', () => {
    const fixture = FixtureGenerator.generateMirrorFixture(currentUserId, users, scraps);

    const visibleScraps = fixture.scraps.filter(s => s.visible);
    visibleScraps.forEach(scrap => {
      expect(scrap.content).not.toBe('');
    });
  });

  it('should hide content for other users invisible scraps', () => {
    const fixture = FixtureGenerator.generateMirrorFixture(currentUserId, users, scraps);

    const otherUserInvisibleScrap = fixture.scraps.find(s => s.id === 'scrap-4');
    expect(otherUserInvisibleScrap).toBeDefined();
    expect(otherUserInvisibleScrap?.content).toBe('');
    expect(otherUserInvisibleScrap?.userId).toBe('dummy-user-id');
  });
});

describe('Update Fixture Generation', () => {
  const currentUserId = 'user-1';
  const otherUserId = 'user-2';
  const baseDate = new Date('2025-01-01');
  const recentDate = new Date('2025-01-05');

  let scraps: Scrap[];

  beforeEach(() => {
    scraps = [
      {
        id: 'scrap-1',
        code: 'ABC123',
        content: 'My old content',
        userId: currentUserId,
        visible: true,
        x: 100,
        y: 100,
        nestedWithin: null,
        createdAt: baseDate,
        updatedAt: baseDate,
      },
      {
        id: 'scrap-2',
        code: 'DEF456',
        content: 'My recent content',
        userId: currentUserId,
        visible: true,
        x: 200,
        y: 200,
        nestedWithin: null,
        createdAt: recentDate,
        updatedAt: recentDate,
      },
      {
        id: 'scrap-3',
        code: 'GHI789',
        content: 'Other user content',
        userId: otherUserId,
        visible: true,
        x: 300,
        y: 300,
        nestedWithin: null,
        createdAt: recentDate,
        updatedAt: recentDate,
      },
    ];
  });

  it('should only include current user scraps', () => {
    const fixture = FixtureGenerator.generateUpdateFixture(currentUserId, scraps);

    expect(fixture.scraps).toHaveLength(2);
    fixture.scraps.forEach(scrap => {
      expect(scrap.userId).toBe(currentUserId);
    });
  });

  it('should filter by since date when provided', () => {
    const sinceDate = new Date('2025-01-03');
    const fixture = FixtureGenerator.generateUpdateFixture(currentUserId, scraps, sinceDate);

    // Only scrap-2 updated after since date
    expect(fixture.scraps).toHaveLength(1);
    expect(fixture.scraps[0].id).toBe('scrap-2');
  });

  it('should include all user scraps when no since date', () => {
    const fixture = FixtureGenerator.generateUpdateFixture(currentUserId, scraps);

    expect(fixture.scraps).toHaveLength(2);
  });

  it('should preserve original IDs for server matching', () => {
    const fixture = FixtureGenerator.generateUpdateFixture(currentUserId, scraps);

    const originalIds = scraps
      .filter(s => s.userId === currentUserId)
      .map(s => s.id);

    const fixtureIds = fixture.scraps.map(s => s.id);

    expect(fixtureIds.sort()).toEqual(originalIds.sort());
  });
});

describe('Mirror Fixture Import', () => {
  let mockDb: any;

  beforeEach(() => {
    const scrapsStore = new Map();
    const usersStore = new Map();

    mockDb = {
      scraps: {
        deleteAll: async () => {
          scrapsStore.clear();
        },
        create: async (scrap: Scrap) => {
          scrapsStore.set(scrap.id, scrap);
          return scrap;
        },
        findAll: async () => Array.from(scrapsStore.values()),
      },
      users: {
        upsert: async (user: User) => {
          usersStore.set(user.id, user);
          return user;
        },
        findAll: async () => Array.from(usersStore.values()),
      },
    };
  });

  it('should wipe all existing scraps before import', async () => {
    // Add existing scraps
    await mockDb.scraps.create({
      id: 'existing-1',
      code: 'OLD123',
      content: 'Old content',
      userId: 'user-1',
      visible: true,
      x: 0,
      y: 0,
      nestedWithin: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const fixture: MirrorFixture = {
      users: [
        { id: 'user-1', email: 'me@example.com', name: 'Me' },
      ],
      scraps: [
        {
          id: 'new-1',
          code: 'NEW123',
          content: 'New content',
          userId: 'user-1',
          visible: true,
          x: 100,
          y: 100,
          nestedWithin: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
    };

    await FixtureGenerator.importMirrorFixture(fixture, mockDb);

    const allScraps = await mockDb.scraps.findAll();
    expect(allScraps).toHaveLength(1);
    expect(allScraps[0].id).toBe('new-1');
  });

  it('should import all users from fixture', async () => {
    const fixture: MirrorFixture = {
      users: [
        { id: 'dummy-user-id', email: 'dummy@example.com', name: 'Other Users' },
        { id: 'user-1', email: 'me@example.com', name: 'Me' },
      ],
      scraps: [],
    };

    await FixtureGenerator.importMirrorFixture(fixture, mockDb);

    const allUsers = await mockDb.users.findAll();
    expect(allUsers).toHaveLength(2);
  });

  it('should import all scraps from fixture', async () => {
    const fixture: MirrorFixture = {
      users: [{ id: 'user-1', email: 'me@example.com', name: 'Me' }],
      scraps: [
        {
          id: 'scrap-1',
          code: 'ABC123',
          content: 'Content 1',
          userId: 'user-1',
          visible: true,
          x: 100,
          y: 100,
          nestedWithin: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'scrap-2',
          code: 'DEF456',
          content: 'Content 2',
          userId: 'user-1',
          visible: true,
          x: 200,
          y: 200,
          nestedWithin: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
    };

    await FixtureGenerator.importMirrorFixture(fixture, mockDb);

    const allScraps = await mockDb.scraps.findAll();
    expect(allScraps).toHaveLength(2);
  });
});

describe('Update Fixture Import', () => {
  let mockDb: any;
  const currentUserId = 'user-1';
  const otherUserId = 'user-2';

  beforeEach(() => {
    const scrapsStore = new Map();

    mockDb = {
      scraps: {
        findById: async (id: string) => scrapsStore.get(id),
        create: async (scrap: Scrap) => {
          scrapsStore.set(scrap.id, scrap);
          return scrap;
        },
        update: async (id: string, data: Scrap) => {
          scrapsStore.set(id, data);
          return data;
        },
        findAll: async () => Array.from(scrapsStore.values()),
      },
    };
  });

  it('should create new scraps that do not exist', async () => {
    const fixture: UpdateFixture = {
      scraps: [
        {
          id: 'new-scrap-1',
          code: 'NEW123',
          content: 'New content',
          userId: currentUserId,
          visible: true,
          x: 100,
          y: 100,
          nestedWithin: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
    };

    const result = await FixtureGenerator.importUpdateFixture(fixture, currentUserId, mockDb);

    expect(result.created).toHaveLength(1);
    expect(result.created[0].id).toBe('new-scrap-1');
  });

  it('should update existing scraps owned by current user with older date', async () => {
    const oldDate = new Date('2025-01-01');
    const newDate = new Date('2025-01-05');

    // Add existing scrap
    await mockDb.scraps.create({
      id: 'scrap-1',
      code: 'ABC123',
      content: 'Old content',
      userId: currentUserId,
      visible: true,
      x: 100,
      y: 100,
      nestedWithin: null,
      createdAt: oldDate,
      updatedAt: oldDate,
    });

    const fixture: UpdateFixture = {
      scraps: [
        {
          id: 'scrap-1',
          code: 'ABC123',
          content: 'Updated content',
          userId: currentUserId,
          visible: true,
          x: 100,
          y: 100,
          nestedWithin: null,
          createdAt: oldDate,
          updatedAt: newDate,
        },
      ],
    };

    const result = await FixtureGenerator.importUpdateFixture(fixture, currentUserId, mockDb);

    expect(result.updated).toHaveLength(1);
    expect(result.updated[0].content).toBe('Updated content');
  });

  it('should skip scraps not owned by current user', async () => {
    // Add existing scrap owned by another user
    await mockDb.scraps.create({
      id: 'scrap-1',
      code: 'ABC123',
      content: 'Other user content',
      userId: otherUserId,
      visible: true,
      x: 100,
      y: 100,
      nestedWithin: null,
      createdAt: new Date('2025-01-01'),
      updatedAt: new Date('2025-01-01'),
    });

    const fixture: UpdateFixture = {
      scraps: [
        {
          id: 'scrap-1',
          code: 'ABC123',
          content: 'Attempted update',
          userId: currentUserId,
          visible: true,
          x: 100,
          y: 100,
          nestedWithin: null,
          createdAt: new Date('2025-01-01'),
          updatedAt: new Date('2025-01-05'),
        },
      ],
    };

    const result = await FixtureGenerator.importUpdateFixture(fixture, currentUserId, mockDb);

    expect(result.skipped).toHaveLength(1);
    expect(result.skipped[0].reason).toBe('not_owner');
  });

  it('should skip scraps with newer server version', async () => {
    const oldDate = new Date('2025-01-01');
    const newDate = new Date('2025-01-05');

    // Add existing scrap with newer date
    await mockDb.scraps.create({
      id: 'scrap-1',
      code: 'ABC123',
      content: 'Newer server content',
      userId: currentUserId,
      visible: true,
      x: 100,
      y: 100,
      nestedWithin: null,
      createdAt: oldDate,
      updatedAt: newDate,
    });

    const fixture: UpdateFixture = {
      scraps: [
        {
          id: 'scrap-1',
          code: 'ABC123',
          content: 'Older local content',
          userId: currentUserId,
          visible: true,
          x: 100,
          y: 100,
          nestedWithin: null,
          createdAt: oldDate,
          updatedAt: oldDate,
        },
      ],
    };

    const result = await FixtureGenerator.importUpdateFixture(fixture, currentUserId, mockDb);

    expect(result.skipped).toHaveLength(1);
    expect(result.skipped[0].reason).toBe('newer_on_server');
  });

  it('should create placeholder parent when nesting reference is missing', async () => {
    const fixture: UpdateFixture = {
      scraps: [
        {
          id: 'child-scrap',
          code: 'CHILD123',
          content: 'Child content',
          userId: currentUserId,
          visible: true,
          x: 100,
          y: 100,
          nestedWithin: 'missing-parent-id',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
    };

    const result = await FixtureGenerator.importUpdateFixture(fixture, currentUserId, mockDb);

    expect(result.parentCreated).toHaveLength(1);
    expect(result.parentCreated[0].parentId).toBe('missing-parent-id');
    expect(result.parentCreated[0].childId).toBe('child-scrap');

    // Verify placeholder was created
    const placeholder = await mockDb.scraps.findById('missing-parent-id');
    expect(placeholder).toBeDefined();
    expect(placeholder.content).toBe('');
    expect(placeholder.userId).toBe(currentUserId);
  });

  it('should not create placeholder if parent exists', async () => {
    // Add parent scrap
    await mockDb.scraps.create({
      id: 'parent-id',
      code: 'PARENT123',
      content: 'Parent content',
      userId: currentUserId,
      visible: true,
      x: 0,
      y: 0,
      nestedWithin: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const fixture: UpdateFixture = {
      scraps: [
        {
          id: 'child-scrap',
          code: 'CHILD123',
          content: 'Child content',
          userId: currentUserId,
          visible: true,
          x: 100,
          y: 100,
          nestedWithin: 'parent-id',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
    };

    const result = await FixtureGenerator.importUpdateFixture(fixture, currentUserId, mockDb);

    expect(result.parentCreated).toHaveLength(0);
  });

  it('should handle mixed results correctly', async () => {
    const oldDate = new Date('2025-01-01');
    const newDate = new Date('2025-01-05');

    // Existing scrap to update
    await mockDb.scraps.create({
      id: 'scrap-1',
      code: 'UPDATE123',
      content: 'Old content',
      userId: currentUserId,
      visible: true,
      x: 100,
      y: 100,
      nestedWithin: null,
      createdAt: oldDate,
      updatedAt: oldDate,
    });

    // Existing scrap owned by other user
    await mockDb.scraps.create({
      id: 'scrap-2',
      code: 'SKIP123',
      content: 'Other user content',
      userId: otherUserId,
      visible: true,
      x: 200,
      y: 200,
      nestedWithin: null,
      createdAt: oldDate,
      updatedAt: oldDate,
    });

    const fixture: UpdateFixture = {
      scraps: [
        // Should update
        {
          id: 'scrap-1',
          code: 'UPDATE123',
          content: 'Updated content',
          userId: currentUserId,
          visible: true,
          x: 100,
          y: 100,
          nestedWithin: null,
          createdAt: oldDate,
          updatedAt: newDate,
        },
        // Should skip (not owner)
        {
          id: 'scrap-2',
          code: 'SKIP123',
          content: 'Attempted update',
          userId: currentUserId,
          visible: true,
          x: 200,
          y: 200,
          nestedWithin: null,
          createdAt: oldDate,
          updatedAt: newDate,
        },
        // Should create new
        {
          id: 'scrap-3',
          code: 'NEW123',
          content: 'New content',
          userId: currentUserId,
          visible: true,
          x: 300,
          y: 300,
          nestedWithin: null,
          createdAt: newDate,
          updatedAt: newDate,
        },
      ],
    };

    const result = await FixtureGenerator.importUpdateFixture(fixture, currentUserId, mockDb);

    expect(result.updated).toHaveLength(1);
    expect(result.skipped).toHaveLength(1);
    expect(result.created).toHaveLength(1);
  });
});
