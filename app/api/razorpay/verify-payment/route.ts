import { NextRequest } from 'next/server';
import crypto from 'crypto';
import { getSession } from '@/lib/auth/session';
import { db } from '@/db';
import { payments, enrollments, courses, users } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { taskQueue } from '@/lib/queue';
import '@/lib/queue/workers'; // Register handlers

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await request.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return Response.json({ error: 'Missing payment details' }, { status: 400 });
    }

    // Verify HMAC signature
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return Response.json({ error: 'Invalid payment signature' }, { status: 400 });
    }

    // Find the pending payment record
    const [payment] = await db
      .select()
      .from(payments)
      .where(and(eq(payments.razorpayOrderId, razorpay_order_id), eq(payments.userId, session.userId)))
      .limit(1);

    if (!payment) return Response.json({ error: 'Payment record not found' }, { status: 404 });
    if (payment.status === 'SUCCESS') return Response.json({ success: true, message: 'Already processed' });

    // Mark payment as success
    await db
      .update(payments)
      .set({ status: 'SUCCESS', razorpayPaymentId: razorpay_payment_id })
      .where(eq(payments.id, payment.id));

    // Create enrollment
    const [enrollment] = await db
      .insert(enrollments)
      .values({ userId: session.userId, courseId: payment.courseId, paymentId: payment.id })
      .onConflictDoNothing()
      .returning();

    // Get course + user info for background tasks
    const [course] = await db.select({ title: courses.title }).from(courses).where(eq(courses.id, payment.courseId)).limit(1);
    const [user] = await db.select({ name: users.name }).from(users).where(eq(users.id, session.userId)).limit(1);

    // Enqueue background tasks
    taskQueue.enqueue({
      type: 'enrollment-confirmation',
      payload: {
        userId: session.userId,
        courseId: payment.courseId,
        courseTitle: course?.title ?? '',
        userName: user?.name ?? '',
      },
      priority: 'high',
    });

    taskQueue.enqueue({
      type: 'update-course-stats',
      payload: { courseId: payment.courseId },
      priority: 'normal',
      delayMs: 5000,
    });

    taskQueue.enqueue({
      type: 'log-analytics',
      payload: { event: 'course_purchased', userId: session.userId, courseId: payment.courseId },
      priority: 'low',
    });

    return Response.json({ success: true, enrollmentId: enrollment?.id });
  } catch (error) {
    console.error('Payment verification error:', error);
    return Response.json({ error: 'Payment verification failed' }, { status: 500 });
  }
}
