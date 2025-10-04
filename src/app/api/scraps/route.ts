import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { scraps, users } from '@/lib/db/schema';
import { eq, isNull, count } from 'drizzle-orm';
import { requirePermission } from '@/lib/permissions';
import { randomUUID } from 'crypto';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    // No authentication required for GET - but check permissions if logged in
    if (userId) {
      try {
        await requirePermission(userId, 'scraps', 'read');
      } catch (permissionError) {
        console.error('Permission check failed for user:', userId, 'Error:', permissionError);
        throw permissionError;
      }
    }

    const url = new URL(request.url);
    const onlyMine = url.searchParams.get('onlyMine') === 'true';

    const baseQuery = db
      .select({
        id: scraps.id,
        code: scraps.code,
        content: scraps.content,
        x: scraps.x,
        y: scraps.y,
        visible: scraps.visible,
        userId: scraps.userId,
        nestedWithin: scraps.nestedWithin,
        userName: users.name,
        userEmail: users.email,
        createdAt: scraps.createdAt,
        updatedAt: scraps.updatedAt,
      })
      .from(scraps)
      .leftJoin(users, eq(scraps.userId, users.id));

    // Filter scraps based on visibility and ownership
    // IMPORTANT: Only show scraps that are NOT nested (nestedWithin is null)
    let allScraps;
    if (onlyMine && userId) {
      // Show all scraps owned by the user (visible and invisible) but only top-level scraps
      allScraps = await baseQuery.where(
        eq(scraps.userId, userId)
      ).where(isNull(scraps.nestedWithin));
    } else {
      // Show all top-level scraps
      allScraps = await baseQuery.where(isNull(scraps.nestedWithin));
    }

    // Get nested scrap counts for each scrap
    const scrapIds = allScraps.map(scrap => scrap.id);
    const nestedCounts = await Promise.all(
      scrapIds.map(async (scrapId) => {
        const result = await db
          .select({ count: count() })
          .from(scraps)
          .where(eq(scraps.nestedWithin, scrapId));
        return { scrapId, count: result[0]?.count || 0 };
      })
    );

    // Process scraps: hide content/author/date based on auth status and ownership
    const scrapsWithCounts = allScraps.map(scrap => {
      const isOwner = userId && scrap.userId === userId;
      const isInvisible = !scrap.visible;
      const isLoggedOut = !userId;

      // If user is not logged in, redact ALL scraps (show only position and ID)
      if (isLoggedOut) {
        return {
          id: scrap.id,
          code: scrap.code,
          content: '', // Redacted
          x: scrap.x,
          y: scrap.y,
          visible: scrap.visible,
          userId: null, // Redacted
          nestedWithin: scrap.nestedWithin,
          userName: null, // Redacted
          userEmail: null, // Redacted
          createdAt: null, // Redacted
          updatedAt: null, // Redacted
          nestedCount: nestedCounts.find(nc => nc.scrapId === scrap.id)?.count || 0
        };
      }

      // If scrap is invisible and user is not the owner, redact sensitive data
      if (isInvisible && !isOwner) {
        return {
          id: scrap.id,
          code: scrap.code,
          content: '', // Redacted
          x: scrap.x,
          y: scrap.y,
          visible: scrap.visible,
          userId: null, // Redacted
          nestedWithin: scrap.nestedWithin,
          userName: null, // Redacted
          userEmail: null, // Redacted
          createdAt: null, // Redacted
          updatedAt: null, // Redacted
          nestedCount: nestedCounts.find(nc => nc.scrapId === scrap.id)?.count || 0
        };
      }

      return {
        ...scrap,
        nestedCount: nestedCounts.find(nc => nc.scrapId === scrap.id)?.count || 0
      };
    });

    return NextResponse.json({ scraps: scrapsWithCounts });
  } catch (error: unknown) {
    console.error('Error fetching scraps:', error);
    if (error instanceof Error && error.message?.includes('Access denied')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await requirePermission(session.user.id, 'scraps', 'create');

    const { content, x, y, visible, userId, nestedWithin } = await request.json();

    if (!content || x === undefined || y === undefined) {
      return NextResponse.json(
        { error: 'Content, x, and y coordinates are required' },
        { status: 400 }
      );
    }

    // Use provided userId or default to current user
    const targetUserId = userId || session.user.id;

    // If trying to create for another user, check if current user has permission
    if (targetUserId !== session.user.id) {
      await requirePermission(session.user.id, 'scraps', 'create_for_others');
    }

    const scrapId = randomUUID();
    
    // Generate unique 9-character code
    const generateScrapCode = (): string => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let result = '';
      for (let i = 0; i < 9; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return result;
    };

    await db.insert(scraps).values({
      id: scrapId,
      code: generateScrapCode(),
      content,
      x: parseInt(x),
      y: parseInt(y),
      visible: visible !== undefined ? visible : true,
      userId: targetUserId,
      nestedWithin: nestedWithin || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return NextResponse.json({ message: 'Scrap created successfully', scrapId });
  } catch (error: unknown) {
    console.error('Error creating scrap:', error);
    if (error instanceof Error && error.message?.includes('Access denied')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}