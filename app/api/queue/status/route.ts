import { requireCreator } from '@/lib/auth/guards';
import { taskQueue } from '@/lib/queue';

export async function GET() {
  await requireCreator();
  const stats = taskQueue.getQueueStats();
  return Response.json({ queue: stats, timestamp: new Date().toISOString() });
}
