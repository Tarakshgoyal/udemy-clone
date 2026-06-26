/**
 * Custom Task Queue — Kafka-like in-process queue with priority levels,
 * retry logic, and concurrency control. No third-party dependencies.
 */

export type TaskPriority = 'high' | 'normal' | 'low';
export type TaskStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface Task<P = unknown> {
  id: string;
  type: string;
  payload: P;
  priority: TaskPriority;
  retries: number;
  maxRetries: number;
  createdAt: number;
  processAt: number; // Timestamp for delayed/retry tasks
  status: TaskStatus;
  error?: string;
  completedAt?: number;
}

export type TaskHandler<P = unknown> = (payload: P) => Promise<void>;

interface QueueOptions {
  concurrency?: number;
  defaultMaxRetries?: number;
  retryDelayMs?: number;
}

class TaskQueue {
  private queues: {
    high: Task[];
    normal: Task[];
    low: Task[];
  } = { high: [], normal: [], low: [] };

  private completedTasks: Map<string, Task> = new Map();
  private handlers: Map<string, TaskHandler> = new Map();
  private activeWorkers = 0;
  private concurrency: number;
  private defaultMaxRetries: number;
  private retryDelayMs: number;
  private stats = { processed: 0, failed: 0, completed: 0 };
  private processingInterval: ReturnType<typeof setInterval> | null = null;

  constructor(options: QueueOptions = {}) {
    this.concurrency = options.concurrency ?? 3;
    this.defaultMaxRetries = options.defaultMaxRetries ?? 3;
    this.retryDelayMs = options.retryDelayMs ?? 2000;

    // Poll for pending tasks every 500ms (handles delayed/retry tasks)
    if (typeof setInterval !== 'undefined') {
      this.processingInterval = setInterval(() => this.processNext(), 500);
    }
  }

  /** Register a handler for a task type */
  register<P>(taskType: string, handler: TaskHandler<P>): void {
    this.handlers.set(taskType, handler as TaskHandler);
  }

  /** Enqueue a new task, returns the task ID */
  enqueue<P>(options: {
    type: string;
    payload: P;
    priority?: TaskPriority;
    maxRetries?: number;
    delayMs?: number;
  }): string {
    const task: Task<P> = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      type: options.type,
      payload: options.payload,
      priority: options.priority ?? 'normal',
      retries: 0,
      maxRetries: options.maxRetries ?? this.defaultMaxRetries,
      createdAt: Date.now(),
      processAt: Date.now() + (options.delayMs ?? 0),
      status: 'pending',
    };

    this.queues[task.priority].push(task as Task);
    this.processNext(); // Attempt immediate processing
    return task.id;
  }

  getStatus(taskId: string): Task | null {
    // Check active/pending queues
    for (const queue of Object.values(this.queues)) {
      const task = queue.find(t => t.id === taskId);
      if (task) return task;
    }
    // Check completed tasks
    return this.completedTasks.get(taskId) ?? null;
  }

  getQueueStats() {
    return {
      pending: this.queues.high.length + this.queues.normal.length + this.queues.low.length,
      processing: this.activeWorkers,
      completed: this.stats.completed,
      failed: this.stats.failed,
      totalProcessed: this.stats.processed,
    };
  }

  private getNextTask(): Task | null {
    const now = Date.now();
    // Priority order: high > normal > low
    for (const priority of ['high', 'normal', 'low'] as TaskPriority[]) {
      const queue = this.queues[priority];
      const idx = queue.findIndex(t => t.processAt <= now && t.status === 'pending');
      if (idx !== -1) {
        return queue.splice(idx, 1)[0];
      }
    }
    return null;
  }

  private async processNext(): Promise<void> {
    if (this.activeWorkers >= this.concurrency) return;

    const task = this.getNextTask();
    if (!task) return;

    this.activeWorkers++;
    task.status = 'processing';
    this.stats.processed++;

    const handler = this.handlers.get(task.type);
    if (!handler) {
      console.warn(`[Queue] No handler registered for task type: ${task.type}`);
      task.status = 'failed';
      task.error = `No handler for task type: ${task.type}`;
      this.completedTasks.set(task.id, task);
      this.activeWorkers--;
      return;
    }

    try {
      await handler(task.payload);
      task.status = 'completed';
      task.completedAt = Date.now();
      this.stats.completed++;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      task.error = message;
      task.retries++;

      if (task.retries < task.maxRetries) {
        // Exponential backoff retry
        const delay = this.retryDelayMs * Math.pow(2, task.retries - 1);
        task.status = 'pending';
        task.processAt = Date.now() + delay;
        this.queues[task.priority].push(task);
        console.warn(`[Queue] Task ${task.id} (${task.type}) failed, retry ${task.retries}/${task.maxRetries} in ${delay}ms`);
      } else {
        task.status = 'failed';
        task.completedAt = Date.now();
        this.stats.failed++;
        console.error(`[Queue] Task ${task.id} (${task.type}) permanently failed after ${task.retries} retries:`, message);
      }
    } finally {
      if (task.status !== 'pending') {
        this.completedTasks.set(task.id, task);
        // Limit completed tasks history to 500 entries
        if (this.completedTasks.size > 500) {
          const firstKey = this.completedTasks.keys().next().value;
          if (firstKey) this.completedTasks.delete(firstKey);
        }
      }
      this.activeWorkers--;
      // Process next task immediately if more are waiting
      this.processNext();
    }
  }

  destroy(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
    }
  }
}

// ─── Singleton Queue Instance ─────────────────────────────────────────────────
declare global {
  // eslint-disable-next-line no-var
  var __taskQueue: TaskQueue | undefined;
}

export const taskQueue: TaskQueue =
  globalThis.__taskQueue ?? (globalThis.__taskQueue = new TaskQueue({ concurrency: 3 }));

export { TaskQueue };
