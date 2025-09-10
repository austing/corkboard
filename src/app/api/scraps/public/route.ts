import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { scraps, users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(_request: NextRequest) {
  try {
    // Public endpoint - no authentication required, shows only visible scraps
    const allScraps = await db
      .select({
        id: scraps.id,
        code: scraps.code,
        content: scraps.content,
        x: scraps.x,
        y: scraps.y,
        visible: scraps.visible,
        userId: scraps.userId,
        userName: users.name,
        userEmail: users.email,
        createdAt: scraps.createdAt,
        updatedAt: scraps.updatedAt,
      })
      .from(scraps)
      .leftJoin(users, eq(scraps.userId, users.id))
      .where(eq(scraps.visible, true));

    return NextResponse.json({ scraps: allScraps });
  } catch (error: unknown) {
    console.error('Error fetching public scraps:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}