import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '../../../../lib/db';
import { scraps, users } from '../../../../lib/db/schema';
import { eq, isNull, sql } from 'drizzle-orm';

export interface TreeNode {
  scrap: {
    id: string;
    code: string;
    content: string;
    x: number;
    y: number;
    visible: boolean;
    userId: string;
    nestedWithin: string | null;
    createdAt: Date;
    updatedAt: Date;
    userName: string | null;
    userEmail: string | null;
  };
  children: TreeNode[];
  depth: number;
}

/**
 * GET /api/scraps/tree
 * Returns all scraps organized in a tree structure from root to nested children
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    // Fetch all scraps with user information
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
        createdAt: scraps.createdAt,
        updatedAt: scraps.updatedAt,
        userName: users.name,
        userEmail: users.email,
      })
      .from(scraps)
      .leftJoin(users, eq(scraps.userId, users.id));

    // Filter and redact based on visibility and ownership
    const processedScraps = allScraps.map(scrap => {
      const isOwner = userId === scrap.userId;
      const isVisible = scrap.visible;

      // Redact content for invisible scraps that user doesn't own
      if (!isVisible && !isOwner) {
        return {
          ...scrap,
          content: '',
          userName: null,
          userEmail: null,
        };
      }

      // Redact user info for unauthenticated users viewing invisible scraps
      if (!isVisible && !userId) {
        return {
          ...scrap,
          content: '',
          userName: null,
          userEmail: null,
        };
      }

      return scrap;
    });

    // Build tree structure
    const scrapMap = new Map(processedScraps.map(s => [s.id, s]));
    const rootNodes: TreeNode[] = [];

    // Helper function to build tree recursively
    function buildTree(parentId: string | null, depth: number): TreeNode[] {
      const children = processedScraps.filter(s => s.nestedWithin === parentId);

      return children.map(scrap => ({
        scrap,
        children: buildTree(scrap.id, depth + 1),
        depth,
      }));
    }

    // Build trees starting from root scraps (nestedWithin === null)
    const rootScraps = processedScraps.filter(s => s.nestedWithin === null);
    rootScraps.forEach(scrap => {
      rootNodes.push({
        scrap,
        children: buildTree(scrap.id, 1),
        depth: 0,
      });
    });

    return NextResponse.json({ tree: rootNodes }, { status: 200 });
  } catch (error) {
    console.error('Error fetching tree:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tree data' },
      { status: 500 }
    );
  }
}
