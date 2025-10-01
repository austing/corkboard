import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { scraps, users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { requirePermission } from '@/lib/permissions';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
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
      .where(eq(scraps.code, code))
      .limit(1);

    if (!scrap[0]) {
      return NextResponse.json({ error: 'Scrap not found' }, { status: 404 });
    }

    // Check if user can view this scrap (own scrap or visible scrap)
    if (scrap[0].userId !== session.user.id && !scrap[0].visible) {
      try {
        await requirePermission(session.user.id, 'scraps', 'read_others');
      } catch (_err) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }

    return NextResponse.json({ scrap: scrap[0] });
  } catch (error: unknown) {
    console.error('Error fetching scrap by code:', error);
    if (error instanceof Error && error.message?.includes('Access denied')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}