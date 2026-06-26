import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

async function run() {
  const sql = neon(process.env.DATABASE_URL);
  await sql`UPDATE lectures SET video_url = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4' WHERE video_url IS NULL`;
  console.log('Updated lectures with demo video');
  process.exit(0);
}
run();
