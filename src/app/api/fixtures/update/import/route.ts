/**
 * Import Update Fixture API Route
 *
 * POST /api/fixtures/update/import
 * Imports an update fixture with conflict resolution.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { importUpdateFixture, parseFixture, type UpdateFixture } from '@/lib/fixtures';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const fixture = parseFixture(JSON.stringify(body)) as UpdateFixture;

    // Validate fixture structure
    if (!fixture.scraps) {
      return NextResponse.json(
        { error: 'Invalid fixture format' },
        { status: 400 }
      );
    }

    const result = await importUpdateFixture(fixture, session.user.id);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error importing update fixture:', error);
    return NextResponse.json(
      { error: 'Failed to import update fixture' },
      { status: 500 }
    );
  }
}
