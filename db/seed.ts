import { config } from 'dotenv';
config({ path: '.env.local' });

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';
import bcrypt from 'bcryptjs';

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

async function seed() {
  console.log('🌱 Seeding database...');

  // ─── Categories ───────────────────────────────────────────────────────────
  console.log('  Creating categories...');
  const [dev, business, design, itSoftware] = await db
    .insert(schema.categories)
    .values([
      { name: 'Development', slug: 'development', description: 'Web, Mobile, Data Science & more', iconName: 'Code' },
      { name: 'Business', slug: 'business', description: 'Finance, Entrepreneurship & Analytics', iconName: 'Briefcase' },
      { name: 'Design', slug: 'design', description: 'UI/UX, Graphic Design & more', iconName: 'Palette' },
      { name: 'IT & Software', slug: 'it-software', description: 'Cloud, DevOps, Databases & Security', iconName: 'Server' },
    ])
    .onConflictDoNothing()
    .returning();

  if (!dev) {
    console.log('  Categories already seeded, skipping...');
    return;
  }

  // ─── Subcategories ────────────────────────────────────────────────────────
  console.log('  Creating subcategories...');
  const subcats = await db
    .insert(schema.subcategories)
    .values([
      { name: 'Web Development', slug: 'web-development', categoryId: dev.id },
      { name: 'Mobile Development', slug: 'mobile-development', categoryId: dev.id },
      { name: 'Data Science', slug: 'data-science', categoryId: dev.id },
      { name: 'Business Analytics', slug: 'business-analytics', categoryId: business.id },
      { name: 'Marketing', slug: 'marketing', categoryId: business.id },
      { name: 'UI/UX Design', slug: 'ui-ux-design', categoryId: design.id },
      { name: 'Graphic Design', slug: 'graphic-design', categoryId: design.id },
      { name: 'DevOps', slug: 'devops', categoryId: itSoftware.id },
      { name: 'Databases', slug: 'databases', categoryId: itSoftware.id },
    ])
    .returning();

  const [webDev, mobileDev, dataSci, bizAnalytics, marketing, uiux, graphicDesign, devops, databases] = subcats;

  // ─── Topics ───────────────────────────────────────────────────────────────
  console.log('  Creating topics...');
  const topicRows = await db
    .insert(schema.topics)
    .values([
      { name: 'React', slug: 'react', subcategoryId: webDev.id },
      { name: 'Next.js', slug: 'nextjs', subcategoryId: webDev.id },
      { name: 'Node.js', slug: 'nodejs', subcategoryId: webDev.id },
      { name: 'Flutter', slug: 'flutter', subcategoryId: mobileDev.id },
      { name: 'React Native', slug: 'react-native', subcategoryId: mobileDev.id },
      { name: 'Python for Data Science', slug: 'python-data-science', subcategoryId: dataSci.id },
      { name: 'Machine Learning', slug: 'machine-learning', subcategoryId: dataSci.id },
      { name: 'Data Analysis', slug: 'data-analysis', subcategoryId: bizAnalytics.id },
      { name: 'Excel', slug: 'excel', subcategoryId: bizAnalytics.id },
      { name: 'Digital Marketing', slug: 'digital-marketing', subcategoryId: marketing.id },
      { name: 'SEO', slug: 'seo', subcategoryId: marketing.id },
      { name: 'Figma', slug: 'figma', subcategoryId: uiux.id },
      { name: 'Adobe XD', slug: 'adobe-xd', subcategoryId: uiux.id },
      { name: 'Photoshop', slug: 'photoshop', subcategoryId: graphicDesign.id },
      { name: 'Docker', slug: 'docker', subcategoryId: devops.id },
      { name: 'Kubernetes', slug: 'kubernetes', subcategoryId: devops.id },
      { name: 'AWS', slug: 'aws', subcategoryId: devops.id },
      { name: 'PostgreSQL', slug: 'postgresql', subcategoryId: databases.id },
      { name: 'MongoDB', slug: 'mongodb', subcategoryId: databases.id },
    ])
    .returning();

  // ─── Demo Creator User ─────────────────────────────────────────────────────
  console.log('  Creating demo users...');
  const passwordHash = await bcrypt.hash('Password123!', 10);

  const [creatorUser] = await db
    .insert(schema.users)
    .values({
      name: 'Krish Naik',
      email: 'creator@demo.com',
      passwordHash,
      role: 'CREATOR',
      bio: 'Chief Data Scientist & ML educator with 500K+ students worldwide.',
    })
    .onConflictDoNothing()
    .returning();

  await db
    .insert(schema.users)
    .values({
      name: 'Taraksh Goyal',
      email: 'user@demo.com',
      passwordHash,
      role: 'USER',
    })
    .onConflictDoNothing();

  if (!creatorUser) {
    console.log('  Users already seeded, skipping courses...');
    return;
  }

  const reactTopic = topicRows.find(t => t.slug === 'react')!;
  const mlTopic = topicRows.find(t => t.slug === 'machine-learning')!;
  const dataAnalysisTopic = topicRows.find(t => t.slug === 'data-analysis')!;
  const nextjsTopic = topicRows.find(t => t.slug === 'nextjs')!;

  // ─── Sample Courses ───────────────────────────────────────────────────────
  console.log('  Creating sample courses...');
  const courseRows = await db
    .insert(schema.courses)
    .values([
      {
        title: 'Complete React Developer Course 2025',
        slug: 'complete-react-developer-2025',
        description: 'Master React from scratch including Hooks, Redux, Context API, and Next.js. Build real-world projects.',
        whatYouLearn: ['Build React components', 'Use React Hooks effectively', 'State management with Redux', 'Deploy React apps'],
        requirements: ['Basic JavaScript knowledge', 'HTML & CSS fundamentals'],
        price: 399,
        originalPrice: 3299,
        status: 'PUBLISHED',
        level: 'Beginner to Advanced',
        creatorId: creatorUser.id,
        topicId: reactTopic.id,
        rating: 4.7,
        totalReviews: 36717,
        totalStudents: 150432,
        totalLectures: 48,
        totalDuration: 320,
        thumbnailUrl: 'https://images.unsplash.com/photo-1555949963-aa79dcee57d5?w=480&q=80',
      },
      {
        title: 'Machine Learning A-Z [2025]: ML, DL & AI with Python',
        slug: 'machine-learning-az-2025',
        description: 'Learn Machine Learning, Deep Learning & AI. Hands-on exercises in Python. No coding experience required.',
        whatYouLearn: ['Build ML models', 'Deep Learning with TensorFlow', 'Natural Language Processing', 'Deploy ML models'],
        requirements: ['High school mathematics', 'Basic Python (optional)'],
        price: 399,
        originalPrice: 3549,
        status: 'PUBLISHED',
        level: 'All Levels',
        creatorId: creatorUser.id,
        topicId: mlTopic.id,
        rating: 4.5,
        totalReviews: 204742,
        totalStudents: 892340,
        totalLectures: 120,
        totalDuration: 890,
        thumbnailUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=480&q=80',
      },
      {
        title: 'Complete Data Analyst Bootcamp From Basics to Advanced',
        slug: 'complete-data-analyst-bootcamp',
        description: 'Master Data Analysis: Python, Stats, Gen AI, EDA, AWS, SQL, Excel, Power BI, Tableau, ETL & Feature Engineering.',
        whatYouLearn: ['Data manipulation with Python', 'SQL for data analysis', 'Build Power BI dashboards', 'Exploratory Data Analysis'],
        requirements: ['No prior experience needed'],
        price: 399,
        originalPrice: 3169,
        status: 'PUBLISHED',
        level: 'All Levels',
        creatorId: creatorUser.id,
        topicId: dataAnalysisTopic.id,
        rating: 4.5,
        totalReviews: 19519,
        totalStudents: 102207,
        totalLectures: 89,
        totalDuration: 542,
        thumbnailUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=480&q=80',
      },
      {
        title: 'Next.js 15 Complete Guide — App Router & Server Actions',
        slug: 'nextjs-15-complete-guide',
        description: 'Build full-stack Next.js apps with the App Router, Server Actions, Prisma, and deployment to Vercel.',
        whatYouLearn: ['Next.js App Router', 'Server & Client Components', 'Data fetching & caching', 'Full-stack with Prisma'],
        requirements: ['React fundamentals', 'Basic TypeScript'],
        price: 499,
        originalPrice: 3999,
        status: 'PUBLISHED',
        level: 'Intermediate',
        creatorId: creatorUser.id,
        topicId: nextjsTopic.id,
        rating: 4.8,
        totalReviews: 8420,
        totalStudents: 43120,
        totalLectures: 62,
        totalDuration: 410,
        thumbnailUrl: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=480&q=80',
      },
    ])
    .returning();

  // ─── Sample Sections & Lectures ───────────────────────────────────────────
  console.log('  Creating sample sections and lectures...');
  const firstCourse = courseRows[0];
  const [sec1, sec2] = await db
    .insert(schema.sections)
    .values([
      { courseId: firstCourse.id, title: 'Introduction to React', order: 1 },
      { courseId: firstCourse.id, title: 'React Hooks Deep Dive', order: 2 },
    ])
    .returning();

  const demoVideo = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
  await db.insert(schema.lectures).values([
    { sectionId: sec1.id, title: 'Welcome & Course Overview', duration: 5, order: 1, isFree: true, videoUrl: demoVideo },
    { sectionId: sec1.id, title: 'Setting Up Your Environment', duration: 12, order: 2, isFree: true, videoUrl: demoVideo },
    { sectionId: sec1.id, title: 'Your First React Component', duration: 18, order: 3, isFree: false, videoUrl: demoVideo },
    { sectionId: sec2.id, title: 'useState Hook Explained', duration: 22, order: 1, isFree: false, videoUrl: demoVideo },
    { sectionId: sec2.id, title: 'useEffect Hook Deep Dive', duration: 28, order: 2, isFree: false, videoUrl: demoVideo },
    { sectionId: sec2.id, title: 'Custom Hooks', duration: 20, order: 3, isFree: false, videoUrl: demoVideo },
  ]);

  console.log('✅ Seeding complete!');
  console.log('  Demo credentials:');
  console.log('    Creator: creator@demo.com / Password123!');
  console.log('    User:    user@demo.com / Password123!');
}

seed().catch(console.error).finally(() => process.exit(0));
