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
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await requirePermission(session.user.id, 'scraps', 'read');

    // First, verify the parent scrap exists and user can access it
    const parentScrap = await db
      .select({
        id: scraps.id,
        code: scraps.code,
        visible: scraps.visible,
        userId: scraps.userId,
      })
      .from(scraps)
      .where(eq(scraps.id, id))
      .limit(1);

    if (!parentScrap[0]) {
      return NextResponse.json({ error: 'Parent scrap not found' }, { status: 404 });
    }

    // Check if user can view this parent scrap
    if (parentScrap[0].userId !== session.user.id && !parentScrap[0].visible) {
      try {
        await requirePermission(session.user.id, 'scraps', 'read_others');
      } catch (_err) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }

    // Get all scraps nested within this parent scrap
    const nestedScraps = await db
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
      .where(eq(scraps.nestedWithin, id));

    // Get nested scrap counts for each nested scrap
    const scrapIds = nestedScraps.map(scrap => scrap.id);
    const nestedCounts = await Promise.all(
      scrapIds.map(async (scrapId) => {
        const result = await db
          .select({ count: count() })
          .from(scraps)
          .where(eq(scraps.nestedWithin, scrapId));
        return { scrapId, count: result[0]?.count || 0 };
      })
    );

    // Add nested counts to scrap data and filter based on visibility and ownership
    const scrapsWithCounts = nestedScraps.map(scrap => ({
      ...scrap,
      nestedCount: nestedCounts.find(nc => nc.scrapId === scrap.id)?.count || 0
    }));

    const filteredScraps = scrapsWithCounts.filter(scrap => {
      // Always show user's own scraps (visible or not)
      if (scrap.userId === session.user.id) {
        return true;
      }
      // Show visible scraps from other users
      return scrap.visible;
    });

    return NextResponse.json({
      parentScrap: parentScrap[0],
      nestedScraps: filteredScraps
    });
  } catch (error: unknown) {
    console.error('Error fetching nested scraps:', error);
    if (error instanceof Error && error.message?.includes('Access denied')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}