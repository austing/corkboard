/**
 * Generate Update Fixture API Route
 *
 * POST /api/fixtures/update/generate?since=YYYY-MM-DD
 * Generates an update fixture containing user's changes.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { generateUpdateFixture } from '@/lib/fixtures';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get optional since parameter
    const searchParams = request.nextUrl.searchParams;
    const sinceParam = searchParams.get('since');
    const since = sinceParam ? new Date(sinceParam) : undefined;

    const fixture = await generateUpdateFixture(session.user.id, since);

    return NextResponse.json(fixture);
  } catch (error) {
    console.error('Error generating update fixture:', error);
    return NextResponse.json(
      { error: 'Failed to generate update fixture' },
      { status: 500 }
    );
  }
}
