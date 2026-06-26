import { NextRequest } from 'next/server';
import Razorpay from 'razorpay';
import { getSession } from '@/lib/auth/session';
import { db } from '@/db';
import { courses, payments, enrollments } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { courseId } = await request.json();
    if (!courseId) return Response.json({ error: 'courseId is required' }, { status: 400 });

    // Check if already enrolled
    const [existing] = await db
      .select({ id: enrollments.id })
      .from(enrollments)
      .where(and(eq(enrollments.userId, session.userId), eq(enrollments.courseId, courseId)))
      .limit(1);

    if (existing) return Response.json({ error: 'Already enrolled' }, { status: 400 });

    // Get course price
    const [course] = await db
      .select({ price: courses.price, title: courses.title, status: courses.status })
      .from(courses)
      .where(eq(courses.id, courseId))
      .limit(1);

    if (!course) return Response.json({ error: 'Course not found' }, { status: 404 });
    if (course.status !== 'PUBLISHED') return Response.json({ error: 'Course not available' }, { status: 400 });

    const amountInPaise = Math.round(course.price * 100);

    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      notes: { courseId, userId: session.userId, courseTitle: course.title },
    });

    // Create a pending payment record
    await db.insert(payments).values({
      userId: session.userId,
      courseId,
      razorpayOrderId: order.id,
      amount: course.price,
      status: 'PENDING',
    });

    return Response.json({
      orderId: order.id,
      amount: amountInPaise,
      currency: 'INR',
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      courseTitle: course.title,
    });
  } catch (error) {
    console.error('Create order error:', error);
    return Response.json({ error: 'Failed to create order' }, { status: 500 });
  }
}
