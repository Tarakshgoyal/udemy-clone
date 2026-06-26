import { requireCreator } from '@/lib/auth/guards';
import { db } from '@/db';
import { courses } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import Link from 'next/link';
import { PlusCircle, Edit, Eye, EyeOff, Trash2 } from 'lucide-react';
import { publishCourse, unpublishCourse } from '@/app/actions/courses';

export default async function CreatorCoursesPage() {
  const session = await requireCreator();

  const myCourses = await db.query.courses.findMany({
    where: eq(courses.creatorId, session.userId),
    orderBy: desc(courses.updatedAt),
  });

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Courses</h1>
          <p className="text-gray-500 mt-1">{myCourses.length} course{myCourses.length !== 1 ? 's' : ''}</p>
        </div>
        <Link
          href="/creator-studio/courses/new"
          className="flex items-center gap-2 bg-[#a435f0] hover:bg-[#8710d8] text-white font-bold px-5 py-3 transition-colors"
        >
          <PlusCircle className="w-4 h-4" /> New Course
        </Link>
      </div>

      {myCourses.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 py-20 text-center">
          <p className="text-gray-400 text-lg mb-4">You haven&apos;t created any courses yet.</p>
          <Link href="/creator-studio/courses/new" className="bg-[#a435f0] text-white font-bold px-6 py-3 hover:bg-[#8710d8]">
            Create your first course
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-bold text-gray-500 uppercase">Course</th>
                <th className="text-left px-6 py-3 text-xs font-bold text-gray-500 uppercase">Status</th>
                <th className="text-left px-6 py-3 text-xs font-bold text-gray-500 uppercase">Students</th>
                <th className="text-left px-6 py-3 text-xs font-bold text-gray-500 uppercase">Price</th>
                <th className="text-left px-6 py-3 text-xs font-bold text-gray-500 uppercase">Rating</th>
                <th className="text-left px-6 py-3 text-xs font-bold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {myCourses.map(course => (
                <tr key={course.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-20 h-12 bg-gray-200 rounded overflow-hidden flex-shrink-0">
                        {course.thumbnailUrl && (
                          <img src={course.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-sm line-clamp-2 max-w-xs">{course.title}</p>
                        <p className="text-xs text-gray-400">{course.level}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-bold px-2 py-1 rounded ${course.status === 'PUBLISHED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {course.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{course.totalStudents.toLocaleString()}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">₹{course.price}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{course.rating > 0 ? `⭐ ${course.rating.toFixed(1)}` : '—'}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Link href={`/creator-studio/courses/${course.id}/edit`} className="text-gray-600 hover:text-[#5624d0] transition-colors" title="Edit">
                        <Edit className="w-4 h-4" />
                      </Link>
                      <form action={course.status === 'PUBLISHED'
                        ? unpublishCourse.bind(null, course.id)
                        : publishCourse.bind(null, course.id)
                      }>
                        <button type="submit" className={`${course.status === 'PUBLISHED' ? 'text-orange-500 hover:text-orange-700' : 'text-green-500 hover:text-green-700'} transition-colors`} title={course.status === 'PUBLISHED' ? 'Unpublish' : 'Publish'}>
                          {course.status === 'PUBLISHED' ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
