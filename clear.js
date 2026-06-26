import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

async function run() {
  const sql = neon(process.env.DATABASE_URL);
  await sql`DELETE FROM lecture_progress`;
  await sql`DELETE FROM enrollments`;
  console.log('Deleted');
  process.exit(0);
}
run();
