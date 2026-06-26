import { requireCreator, getCurrentUser } from '@/lib/auth/guards';
import { db } from '@/db';
import { courses, enrollments, payments } from '@/db/schema';
import { eq, count, sum, desc } from 'drizzle-orm';
import { BookOpen, Users, DollarSign, TrendingUp, PlusCircle } from 'lucide-react';
import Link from 'next/link';

export default async function CreatorDashboard() {
  const session = await requireCreator();
  const user = await getCurrentUser();

  // Dashboard stats
  const [courseStats] = await db
    .select({ total: count() })
    .from(courses)
    .where(eq(courses.creatorId, session.userId));

  const [studentStats] = await db
    .select({ total: count() })
    .from(enrollments)
    .innerJoin(courses, eq(enrollments.courseId, courses.id))
    .where(eq(courses.creatorId, session.userId));

  const [revenueStats] = await db
    .select({ total: sum(payments.amount) })
    .from(payments)
    .innerJoin(courses, eq(payments.courseId, courses.id))
    .where(eq(courses.creatorId, session.userId));

  const recentCourses = await db.query.courses.findMany({
    where: eq(courses.creatorId, session.userId),
    orderBy: desc(courses.updatedAt),
    limit: 5,
  });

  const stats = [
    { label: 'Total Courses', value: courseStats?.total ?? 0, icon: BookOpen, color: 'bg-blue-500' },
    { label: 'Total Students', value: (studentStats?.total ?? 0).toLocaleString(), icon: Users, color: 'bg-green-500' },
    { label: 'Total Revenue', value: `₹${(Number(revenueStats?.total ?? 0)).toLocaleString()}`, icon: DollarSign, color: 'bg-purple-500' },
    { label: 'Avg. Rating', value: '4.5', icon: TrendingUp, color: 'bg-orange-500' },
  ];

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user?.name?.split(' ')[0]}!</h1>
          <p className="text-gray-500 mt-1">Here&apos;s what&apos;s happening with your courses.</p>
        </div>
        <Link
          href="/creator-studio/courses/new"
          className="flex items-center gap-2 bg-[#a435f0] hover:bg-[#8710d8] text-white font-bold px-5 py-3 transition-colors"
        >
          <PlusCircle className="w-4 h-4" /> New Course
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {stats.map(stat => (
          <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-6 flex items-center gap-4">
            <div className={`${stat.color} w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0`}>
              <stat.icon className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-sm text-gray-500">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Courses */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-bold text-lg text-gray-900">Your Courses</h2>
          <Link href="/creator-studio/courses" className="text-[#5624d0] text-sm font-bold hover:underline">
            View all →
          </Link>
        </div>
        {recentCourses.length === 0 ? (
          <div className="py-16 text-center">
            <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="font-bold text-gray-600 mb-2">No courses yet</h3>
            <p className="text-gray-400 text-sm mb-6">Create your first course and start teaching!</p>
            <Link href="/creator-studio/courses/new" className="bg-[#a435f0] text-white font-bold px-6 py-3 hover:bg-[#8710d8] transition-colors">
              Create Course
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {recentCourses.map(course => (
              <div key={course.id} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors">
                <div className="w-16 h-12 bg-gray-200 rounded overflow-hidden flex-shrink-0">
                  {course.thumbnailUrl && (
                    <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-cover" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900 truncate">{course.title}</p>
                  <p className="text-xs text-gray-400">{course.totalStudents} students • ₹{course.price}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-bold px-2 py-1 rounded ${course.status === 'PUBLISHED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {course.status}
                  </span>
                  <Link href={`/creator-studio/courses/${course.id}/edit`} className="text-[#5624d0] text-sm font-bold hover:underline">
                    Edit
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
