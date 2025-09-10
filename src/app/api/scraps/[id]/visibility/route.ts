import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { scraps } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { requirePermission } from '@/lib/permissions';

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

    const { visible } = await request.json();

    if (visible === undefined) {
      return NextResponse.json(
        { error: 'Visible field is required' },
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

    // Check if user owns this scrap or has permission to update others
    if (existingScrap[0].userId !== session.user.id) {
      await requirePermission(session.user.id, 'scraps', 'update_others');
    }

    await db
      .update(scraps)
      .set({
        visible: visible,
        updatedAt: new Date(),
      })
      .where(eq(scraps.id, id));

    return NextResponse.json({ message: 'Scrap visibility updated successfully' });
  } catch (error: unknown) {
    console.error('Error updating scrap visibility:', error);
    if (error instanceof Error && error.message?.includes('Access denied')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}