import { NextRequest } from 'next/server';
import { db } from '@/db';
import { courses, topics, subcategories, categories, users } from '@/db/schema';
import { eq, and, gte, lte, ilike, desc, asc, sql } from 'drizzle-orm';
import { courseCache } from '@/lib/cache';
import { cached, cacheKey } from '@/lib/cache/cached';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const categorySlug = searchParams.get('category');
    const subcategorySlug = searchParams.get('subcategory');
    const topicSlug = searchParams.get('topic');
    const search = searchParams.get('q');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const level = searchParams.get('level');
    const sort = searchParams.get('sort') ?? 'popular';
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'));
    const limit = Math.min(20, parseInt(searchParams.get('limit') ?? '12'));
    const offset = (page - 1) * limit;

    const key = cacheKey('courses:list', categorySlug, subcategorySlug, topicSlug, search, minPrice, maxPrice, level, sort, page);

    const data = await cached(courseCache, key, async () => {
      const filters: ReturnType<typeof and>[] = [eq(courses.status, 'PUBLISHED')];

      if (search) filters.push(ilike(courses.title, `%${search}%`));
      if (minPrice) filters.push(gte(courses.price, parseFloat(minPrice)));
      if (maxPrice) filters.push(lte(courses.price, parseFloat(maxPrice)));
      if (level) filters.push(eq(courses.level, level));

      // Taxonomy filters
      if (topicSlug) {
        const [topic] = await db.select({ id: topics.id }).from(topics).where(eq(topics.slug, topicSlug)).limit(1);
        if (topic) filters.push(eq(courses.topicId, topic.id));
      } else if (subcategorySlug) {
        const [subcat] = await db.select({ id: subcategories.id }).from(subcategories).where(eq(subcategories.slug, subcategorySlug)).limit(1);
        if (subcat) {
          const topicIds = await db.select({ id: topics.id }).from(topics).where(eq(topics.subcategoryId, subcat.id));
          if (topicIds.length > 0) {
            filters.push(sql`${courses.topicId} IN (${sql.join(topicIds.map(t => sql`${t.id}`), sql`, `)})`);
          }
        }
      } else if (categorySlug) {
        const [cat] = await db.select({ id: categories.id }).from(categories).where(eq(categories.slug, categorySlug)).limit(1);
        if (cat) {
          const subcats = await db.select({ id: subcategories.id }).from(subcategories).where(eq(subcategories.categoryId, cat.id));
          if (subcats.length > 0) {
            const subIds = subcats.map(s => s.id);
            const topicIds = await db.select({ id: topics.id }).from(topics).where(sql`${topics.subcategoryId} IN (${sql.join(subIds.map(id => sql`${id}`), sql`, `)})`);
            if (topicIds.length > 0) {
              filters.push(sql`${courses.topicId} IN (${sql.join(topicIds.map(t => sql`${t.id}`), sql`, `)})`);
            }
          }
        }
      }

      const orderBy = sort === 'newest' ? desc(courses.createdAt)
        : sort === 'price-asc' ? asc(courses.price)
        : sort === 'price-desc' ? desc(courses.price)
        : sort === 'rating' ? desc(courses.rating)
        : desc(courses.totalStudents); // popular

      const results = await db.query.courses.findMany({
        where: and(...filters),
        with: { creator: { columns: { id: true, name: true, avatarUrl: true } }, topic: true },
        orderBy,
        limit,
        offset,
      });

      const [{ total }] = await db
        .select({ total: sql<number>`count(*)` })
        .from(courses)
        .where(and(...filters));

      return { courses: results, total, page, limit, totalPages: Math.ceil(total / limit) };
    });

    return Response.json(data);
  } catch (error) {
    console.error('Courses API error:', error);
    return Response.json({ error: 'Failed to fetch courses' }, { status: 500 });
  }
}
