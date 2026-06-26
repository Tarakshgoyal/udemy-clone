'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, Circle, ChevronDown, ChevronRight, PlayCircle } from 'lucide-react';
import { markLectureComplete, updateWatchTime } from '@/app/actions/progress';

type Lecture = { id: string; title: string; duration: number; order: number; isFree: boolean; videoUrl: string | null; };
type Section = { id: string; title: string; order: number; lectures: Lecture[]; };
type Course = { id: string; title: string; sections: Section[]; };
type Enrollment = { id: string; progress: number; };

interface Props {
  course: Course;
  enrollment: Enrollment;
  activeLecture: Lecture | null;
  completedLectureIds: string[];
}

export default function LecturePlayer({ course, enrollment, activeLecture, completedLectureIds }: Props) {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [completed, setCompleted] = useState(new Set(completedLectureIds));
  const [currentLecture, setCurrentLecture] = useState(activeLecture);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(course.sections.map(s => s.id)));
  const saveTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const allLectures = course.sections.flatMap(s => s.lectures);
  const totalLectures = allLectures.length;
  const completedCount = completed.size;
  const progress = totalLectures > 0 ? Math.round((completedCount / totalLectures) * 100) : 0;

  const handleSelectLecture = (lecture: Lecture) => {
    setCurrentLecture(lecture);
    router.replace(`?lecture=${lecture.id}`, { scroll: false });
  };

  const handleMarkComplete = async () => {
    if (!currentLecture) return;
    await markLectureComplete(enrollment.id, currentLecture.id);
    setCompleted(prev => new Set([...prev, currentLecture.id]));

    // Auto-advance to next lecture
    const currentIdx = allLectures.findIndex(l => l.id === currentLecture.id);
    if (currentIdx < allLectures.length - 1) {
      handleSelectLecture(allLectures[currentIdx + 1]);
    }
  };

  const handleVideoTimeUpdate = useCallback(() => {
    if (!videoRef.current || !currentLecture) return;
    // Save progress every 10 seconds
    if (!saveTimer.current) {
      saveTimer.current = setInterval(async () => {
        if (videoRef.current && currentLecture) {
          await updateWatchTime(enrollment.id, currentLecture.id, videoRef.current.currentTime);
        }
      }, 10000);
    }
  }, [currentLecture, enrollment.id]);

  const handleVideoEnded = async () => {
    if (!currentLecture) return;
    await markLectureComplete(enrollment.id, currentLecture.id);
    setCompleted(prev => new Set([...prev, currentLecture.id]));
  };

  return (
    <div className="flex h-[calc(100vh-65px)] bg-[#1c1d1f]">
      {/* Video Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Video Player */}
        <div className="bg-black flex-1 flex items-center justify-center relative">
          {currentLecture?.videoUrl ? (
            <video
              ref={videoRef}
              key={currentLecture.id}
              src={currentLecture.videoUrl}
              controls
              className="w-full h-full max-h-full object-contain"
              onTimeUpdate={handleVideoTimeUpdate}
              onEnded={handleVideoEnded}
            />
          ) : (
            <div className="text-center text-white">
              <PlayCircle className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p className="text-gray-400">
                {currentLecture ? 'No video uploaded for this lecture yet.' : 'Select a lecture to start learning.'}
              </p>
            </div>
          )}
        </div>

        {/* Lecture Info Bar */}
        {currentLecture && (
          <div className="bg-[#1c1d1f] border-t border-gray-700 px-6 py-4 flex items-center justify-between">
            <div>
              <h2 className="text-white font-bold text-lg">{currentLecture.title}</h2>
              <p className="text-gray-400 text-sm">{course.title}</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-gray-400 text-sm">
                {completedCount}/{totalLectures} lectures • {progress}% complete
              </div>
              {currentLecture && !completed.has(currentLecture.id) && (
                <button
                  onClick={handleMarkComplete}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold px-4 py-2 text-sm transition-colors"
                >
                  <CheckCircle className="w-4 h-4" /> Mark Complete
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Sidebar — Course Content */}
      <div className="w-80 bg-[#1c1d1f] border-l border-gray-700 flex flex-col flex-shrink-0">
        <div className="px-4 py-4 border-b border-gray-700">
          <h3 className="text-white font-bold text-sm">Course Content</h3>
          <div className="mt-2 bg-gray-700 h-1.5 rounded-full overflow-hidden">
            <div className="bg-green-500 h-full transition-all" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-gray-400 text-xs mt-1">{completedCount}/{totalLectures} completed</p>
        </div>

        <div className="flex-1 overflow-y-auto">
          {course.sections.map(section => {
            const sectionCompleted = section.lectures.filter(l => completed.has(l.id)).length;
            const isExpanded = expandedSections.has(section.id);

            return (
              <div key={section.id}>
                <button
                  onClick={() => setExpandedSections(prev => {
                    const next = new Set(prev);
                    next.has(section.id) ? next.delete(section.id) : next.add(section.id);
                    return next;
                  })}
                  className="w-full flex items-center justify-between px-4 py-3 bg-gray-800 hover:bg-gray-750 border-b border-gray-700 text-left"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {isExpanded ? <ChevronDown className="w-3 h-3 text-gray-400 flex-shrink-0" /> : <ChevronRight className="w-3 h-3 text-gray-400 flex-shrink-0" />}
                    <span className="text-white text-xs font-bold truncate">{section.title}</span>
                  </div>
                  <span className="text-gray-400 text-xs ml-2 flex-shrink-0">{sectionCompleted}/{section.lectures.length}</span>
                </button>

                {isExpanded && section.lectures.map(lecture => {
                  const isActive = currentLecture?.id === lecture.id;
                  const isDone = completed.has(lecture.id);

                  return (
                    <button
                      key={lecture.id}
                      onClick={() => handleSelectLecture(lecture)}
                      className={`w-full flex items-start gap-3 px-4 py-3 text-left border-b border-gray-800 transition-colors ${
                        isActive ? 'bg-gray-700' : 'hover:bg-gray-800'
                      }`}
                    >
                      <div className="mt-0.5 flex-shrink-0">
                        {isDone ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <Circle className={`w-4 h-4 ${isActive ? 'text-[#a435f0]' : 'text-gray-600'}`} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs leading-snug ${isActive ? 'text-white font-bold' : 'text-gray-300'}`}>
                          {lecture.title}
                        </p>
                        {lecture.duration > 0 && (
                          <p className="text-gray-500 text-xs mt-0.5">{lecture.duration} min</p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
