import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { scraps, users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { requirePermission } from '@/lib/permissions';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await requirePermission(session.user.id, 'scraps', 'read');

    const scrap = await db
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
      .leftJoin(users, eq(scraps.userId, users.id))
      .where(eq(scraps.id, id))
      .limit(1);

    if (!scrap[0]) {
      return NextResponse.json({ error: 'Scrap not found' }, { status: 404 });
    }

    // Check if user can view this scrap (own scrap or has permission to view others)
    if (scrap[0].userId !== session.user.id) {
      try {
        await requirePermission(session.user.id, 'scraps', 'read_others');
      } catch (_err) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }

    return NextResponse.json({ scrap: scrap[0] });
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

    const { content, x, y, userId } = await request.json();

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

    const updateData: { content: string; x: number; y: number; updatedAt: Date; userId?: string } = {
      content,
      x: parseInt(x),
      y: parseInt(y),
      updatedAt: new Date(),
    };

    if (userId) {
      updateData.userId = userId;
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