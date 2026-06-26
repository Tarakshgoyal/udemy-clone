import { db } from '@/db';
import { categories, subcategories, topics } from '@/db/schema';
import { taxonomyCache } from '@/lib/cache';
import { cached } from '@/lib/cache/cached';

export async function GET() {
  try {
    const data = await cached(
      taxonomyCache,
      'taxonomy:full',
      async () => {
        const cats = await db.query.categories.findMany({
          with: {
            subcategories: {
              with: { topics: true },
            },
          },
        });
        return cats;
      },
      60 * 60 * 1000 // 1 hour TTL
    );

    return Response.json({ categories: data });
  } catch (error) {
    console.error('Failed to fetch categories:', error);
    return Response.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}
