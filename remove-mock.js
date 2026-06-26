import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

async function run() {
  const sql = neon(process.env.DATABASE_URL);
  
  const mockSlugs = [
    'complete-react-developer-2025',
    'machine-learning-az-2025',
    'complete-data-analyst-bootcamp',
    'ios-18-swift-10-bootcamp'
  ];

  await sql`DELETE FROM courses WHERE slug = ANY(${mockSlugs})`;
  
  console.log('Deleted mock courses successfully.');
  process.exit(0);
}
run();
