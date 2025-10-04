import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { scraps, users } from '@/lib/db/schema';
import { eq, isNull, count } from 'drizzle-orm';

export async function GET(_request: NextRequest) {
  try {
    // Public endpoint - no authentication required, shows ALL top-level scraps with redacted content
    const allScraps = await db
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
      .where(isNull(scraps.nestedWithin));

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

    // Redact all scraps for unauthenticated users (show position, ID, and dates only)
    const scrapsWithCounts = allScraps.map(scrap => ({
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
      createdAt: scrap.createdAt,
      updatedAt: scrap.updatedAt,
      nestedCount: nestedCounts.find(nc => nc.scrapId === scrap.id)?.count || 0
    }));

    return NextResponse.json({ scraps: scrapsWithCounts });
  } catch (error: unknown) {
    console.error('Error fetching public scraps:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}