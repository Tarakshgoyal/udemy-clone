import { requireAuth } from '@/lib/auth/guards';
import { db } from '@/db';
import { enrollments } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import Link from 'next/link';
import { PlayCircle } from 'lucide-react';

export default async function MyLearningPage() {
  const session = await requireAuth();

  const myEnrollments = await db.query.enrollments.findMany({
    where: eq(enrollments.userId, session.userId),
    orderBy: desc(enrollments.purchasedAt),
    with: {
      course: {
        with: {
          creator: { columns: { name: true } },
        }
      }
    }
  });

  return (
    <div className="bg-white min-h-[calc(100vh-65px)]">
      {/* Dark Header */}
      <div className="bg-[#1c1d1f] text-white py-12 px-8">
        <h1 className="text-4xl font-bold font-serif mb-6">My learning</h1>
        <div className="flex gap-4">
          <button className="text-white font-bold pb-2 border-b-2 border-white">
            All courses
          </button>
          <button className="text-gray-400 hover:text-gray-200 font-bold pb-2">
            My Lists
          </button>
          <button className="text-gray-400 hover:text-gray-200 font-bold pb-2">
            Wishlist
          </button>
          <button className="text-gray-400 hover:text-gray-200 font-bold pb-2">
            Archived
          </button>
        </div>
      </div>

      <div className="p-8 max-w-[1340px] mx-auto">
        {myEnrollments.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <h2 className="text-xl font-bold text-gray-900 mb-2">You aren&apos;t enrolled in any courses yet.</h2>
            <p className="mb-6">Start learning today!</p>
            <Link href="/" className="bg-[#5624d0] hover:bg-[#401b9c] text-white font-bold px-6 py-3 transition-colors">
              Browse Courses
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {myEnrollments.map((enr) => (
              <div key={enr.id} className="group flex flex-col h-full border border-gray-200 hover:shadow-md transition-shadow">
                <Link href={`/course/${enr.courseId}/learn`} className="block relative overflow-hidden aspect-video bg-gray-100 flex-shrink-0">
                  {enr.course.thumbnailUrl && (
                    <img
                      src={enr.course.thumbnailUrl}
                      alt={enr.course.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  )}
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <PlayCircle className="w-12 h-12 text-white" />
                  </div>
                </Link>
                
                <div className="p-4 flex flex-col flex-1">
                  <h3 className="font-bold text-gray-900 line-clamp-2 leading-tight mb-1 group-hover:text-[#5624d0]">
                    <Link href={`/course/${enr.courseId}/learn`}>
                      {enr.course.title}
                    </Link>
                  </h3>
                  <p className="text-xs text-gray-500 mb-3">{enr.course.creator.name}</p>
                  
                  <div className="mt-auto">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-gray-500">{enr.progress}% complete</span>
                    </div>
                    <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-[#5624d0] h-full transition-all duration-500"
                        style={{ width: `${enr.progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
