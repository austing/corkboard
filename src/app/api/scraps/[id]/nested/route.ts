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

    // First, verify the parent scrap exists
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

    // Process scraps: hide content/author/date for invisible scraps from non-authors
    const processedScraps = nestedScraps.map(scrap => {
      const isOwner = userId && scrap.userId === userId;
      const isInvisible = !scrap.visible;
      const nestedCount = nestedCounts.find(nc => nc.scrapId === scrap.id)?.count || 0;

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
          nestedCount
        };
      }

      return {
        ...scrap,
        nestedCount
      };
    });

    return NextResponse.json({
      parentScrap: parentScrap[0],
      nestedScraps: processedScraps
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