import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { scraps, users } from '@/lib/db/schema';
import { eq, count } from 'drizzle-orm';
import { requirePermission } from '@/lib/permissions';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    // No authentication required for GET - but check permissions if logged in
    if (userId) {
      await requirePermission(userId, 'scraps', 'read');
    }

    const scrap = await db
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
      .leftJoin(users, eq(scraps.userId, users.id))
      .where(eq(scraps.id, id))
      .limit(1);

    if (!scrap[0]) {
      return NextResponse.json({ error: 'Scrap not found' }, { status: 404 });
    }

    // Get nested scrap count for this scrap
    const nestedCountResult = await db
      .select({ count: count() })
      .from(scraps)
      .where(eq(scraps.nestedWithin, id));

    const isOwner = userId && scrap[0].userId === userId;
    const isInvisible = !scrap[0].visible;
    const isLoggedOut = !userId;

    // If user is not logged in, redact ALL scraps (show only position and ID)
    // OR if scrap is invisible and user is not the owner, redact sensitive data
    let scrapWithCount;
    if (isLoggedOut || (isInvisible && !isOwner)) {
      scrapWithCount = {
        id: scrap[0].id,
        code: scrap[0].code,
        content: '', // Redacted
        x: scrap[0].x,
        y: scrap[0].y,
        visible: scrap[0].visible,
        userId: null, // Redacted
        nestedWithin: scrap[0].nestedWithin,
        userName: null, // Redacted
        userEmail: null, // Redacted
        createdAt: null, // Redacted
        updatedAt: null, // Redacted
        nestedCount: nestedCountResult[0]?.count || 0
      };
    } else {
      scrapWithCount = {
        ...scrap[0],
        nestedCount: nestedCountResult[0]?.count || 0
      };
    }

    return NextResponse.json({ scrap: scrapWithCount });
  } catch (error: unknown) {
    console.error('Error fetching scrap:', error);
    if (error instanceof Error && error.message?.includes('Access denied')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await requirePermission(session.user.id, 'scraps', 'update');

    const { content, x, y, visible, userId, nestedWithin } = await request.json();

    if (!content || x === undefined || y === undefined) {
      return NextResponse.json(
        { error: 'Content, x, and y coordinates are required' },
        { status: 400 }
      );
    }

    // Check if scrap exists and get current owner
    const existingScrap = await db
      .select()
      .from(scraps)
      .where(eq(scraps.id, id))
      .limit(1);

    if (!existingScrap[0]) {
      return NextResponse.json({ error: 'Scrap not found' }, { status: 404 });
    }

    // If changing ownership or not the current owner, check additional permissions
    if (userId && userId !== existingScrap[0].userId) {
      await requirePermission(session.user.id, 'scraps', 'change_owner');
    } else if (existingScrap[0].userId !== session.user.id) {
      await requirePermission(session.user.id, 'scraps', 'update_others');
    }

    const updateData: { content: string; x: number; y: number; visible?: boolean; updatedAt: Date; userId?: string; nestedWithin?: string | null } = {
      content,
      x: parseInt(x),
      y: parseInt(y),
      updatedAt: new Date(),
    };

    if (visible !== undefined) {
      updateData.visible = visible;
    }

    if (userId) {
      updateData.userId = userId;
    }

    if (nestedWithin !== undefined) {
      updateData.nestedWithin = nestedWithin || null;
    }

    await db
      .update(scraps)
      .set(updateData)
      .where(eq(scraps.id, id));

    return NextResponse.json({ message: 'Scrap updated successfully' });
  } catch (error: unknown) {
    console.error('Error updating scrap:', error);
    if (error instanceof Error && error.message?.includes('Access denied')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await requirePermission(session.user.id, 'scraps', 'delete');

    // Check if scrap exists and get current owner
    const existingScrap = await db
      .select()
      .from(scraps)
      .where(eq(scraps.id, id))
      .limit(1);

    if (!existingScrap[0]) {
      return NextResponse.json({ error: 'Scrap not found' }, { status: 404 });
    }

    // If not the owner, check permission to delete others' scraps
    if (existingScrap[0].userId !== session.user.id) {
      await requirePermission(session.user.id, 'scraps', 'delete_others');
    }

    await db.delete(scraps).where(eq(scraps.id, id));

    return NextResponse.json({ message: 'Scrap deleted successfully' });
  } catch (error: unknown) {
    console.error('Error deleting scrap:', error);
    if (error instanceof Error && error.message?.includes('Access denied')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}