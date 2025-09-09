import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { scraps, users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { requirePermission } from '@/lib/permissions';
import { randomUUID } from 'crypto';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const onlyMine = url.searchParams.get('onlyMine') === 'true';

    await requirePermission(session.user.id, 'scraps', 'read');

    const baseQuery = db
      .select({
        id: scraps.id,
        code: scraps.code,
        content: scraps.content,
        x: scraps.x,
        y: scraps.y,
        userId: scraps.userId,
        userName: users.name,
        userEmail: users.email,
        createdAt: scraps.createdAt,
        updatedAt: scraps.updatedAt,
      })
      .from(scraps)
      .leftJoin(users, eq(scraps.userId, users.id));

    // Filter to only user's own scraps if requested
    const allScraps = onlyMine 
      ? await baseQuery.where(eq(scraps.userId, session.user.id))
      : await baseQuery;

    return NextResponse.json({ scraps: allScraps });
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

    const { content, x, y, userId } = await request.json();

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
      userId: targetUserId,
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