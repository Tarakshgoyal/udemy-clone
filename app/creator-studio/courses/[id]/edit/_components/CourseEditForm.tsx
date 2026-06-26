'use client';

import { useState, useActionState } from 'react';
import { updateCourse, addSection, addLecture, deleteLecture, deleteSection, updateLectureVideo, publishCourse } from '@/app/actions/courses';
import { UploadButton, UploadDropzone } from '@/lib/uploadthing';
import { ImageIcon, Plus, Trash2, Video, Check, ChevronDown, ChevronRight, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';

type Lecture = { id: string; title: string; duration: number; order: number; isFree: boolean; videoUrl: string | null; };
type Section = { id: string; title: string; order: number; lectures: Lecture[]; };
type Course = { id: string; title: string; description: string; price: number; originalPrice: number | null; level: string; language: string; thumbnailUrl: string | null; previewVideoUrl: string | null; status: string; whatYouLearn: string[]; requirements: string[]; topicId: string | null; sections: Section[]; };

export default function CourseEditForm({ course }: { course: Course }) {
  const [thumbnailUrl, setThumbnailUrl] = useState(course.thumbnailUrl ?? '');
  const [previewVideoUrl, setPreviewVideoUrl] = useState(course.previewVideoUrl ?? '');
  const [sections, setSections] = useState<Section[]>(course.sections);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [uploadingLecture, setUploadingLecture] = useState<string | null>(null);
  const [saveMsg, setSaveMsg] = useState('');

  const updateAction = updateCourse.bind(null, course.id);
  const [state, formAction, pending] = useActionState(updateAction, undefined);



  const toggleSection = (id: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleAddSection = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set('courseId', course.id);
    const result = await addSection(undefined, fd) as any;
    if (result?.data) {
      setSections(prev => [...prev, { ...result.data, lectures: [] }]);
      (e.target as HTMLFormElement).reset();
    }
  };

  const handleAddLecture = async (sectionId: string, e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set('sectionId', sectionId);
    const result = await addLecture(undefined, fd) as any;
    if (result?.data) {
      setSections(prev => prev.map(s =>
        s.id === sectionId ? { ...s, lectures: [...s.lectures, result.data] } : s
      ));
      (e.target as HTMLFormElement).reset();
    }
  };

  const handleDeleteSection = async (sectionId: string) => {
    if (!confirm('Delete this section and all its lectures?')) return;
    await deleteSection(sectionId);
    setSections(prev => prev.filter(s => s.id !== sectionId));
  };

  const handleDeleteLecture = async (sectionId: string, lectureId: string) => {
    await deleteLecture(lectureId);
    setSections(prev => prev.map(s =>
      s.id === sectionId ? { ...s, lectures: s.lectures.filter(l => l.id !== lectureId) } : s
    ));
  };

  const handlePublishToggle = async () => {
    if (course.status === 'PUBLISHED') {
      const { unpublishCourse } = await import('@/app/actions/courses');
      await unpublishCourse(course.id);
    } else {
      await publishCourse(course.id);
    }
    window.location.reload();
  };

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <Link href="/creator-studio/courses" className="text-gray-400 hover:text-gray-700 text-sm mb-2 block">← Back to Courses</Link>
          <h1 className="text-2xl font-bold text-gray-900 line-clamp-1">{course.title}</h1>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handlePublishToggle}
            className={`flex items-center gap-2 px-4 py-2 font-bold text-sm transition-colors ${
              course.status === 'PUBLISHED'
                ? 'bg-orange-100 text-orange-700 hover:bg-orange-200 border border-orange-200'
                : 'bg-green-100 text-green-700 hover:bg-green-200 border border-green-200'
            }`}
          >
            {course.status === 'PUBLISHED' ? <><EyeOff className="w-4 h-4" /> Unpublish</> : <><Eye className="w-4 h-4" /> Publish</>}
          </button>
          <Link href={`/course/${course.id}`} target="_blank" className="flex items-center gap-2 border border-gray-300 text-gray-700 px-4 py-2 font-bold text-sm hover:bg-gray-50">
            Preview
          </Link>
        </div>
      </div>

      <form action={formAction} className="space-y-6">
        <input type="hidden" name="thumbnailUrl" value={thumbnailUrl} />
        <input type="hidden" name="previewVideoUrl" value={previewVideoUrl} />

        {/* Basic Info */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="font-bold text-gray-900">Basic Information</h2>
          <div>
            <label className="text-sm font-bold text-gray-700 block mb-1">Title</label>
            <input name="title" defaultValue={course.title} required className="w-full border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:border-gray-900" />
          </div>
          <div>
            <label className="text-sm font-bold text-gray-700 block mb-1">Description</label>
            <textarea name="description" defaultValue={course.description} required rows={4} className="w-full border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:border-gray-900 resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-bold text-gray-700 block mb-1">Price (₹)</label>
              <input name="price" type="number" defaultValue={course.price} className="w-full border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:border-gray-900" />
            </div>
            <div>
              <label className="text-sm font-bold text-gray-700 block mb-1">Original Price (₹)</label>
              <input name="originalPrice" type="number" defaultValue={course.originalPrice ?? ''} className="w-full border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:border-gray-900" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-bold text-gray-700 block mb-1">Level</label>
              <select name="level" defaultValue={course.level} className="w-full border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:border-gray-900">
                {['All Levels', 'Beginner', 'Intermediate', 'Advanced'].map(l => <option key={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-bold text-gray-700 block mb-1">Language</label>
              <select name="language" defaultValue={course.language} className="w-full border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:border-gray-900">
                {['English', 'Hindi', 'Hinglish'].map(l => <option key={l}>{l}</option>)}
              </select>
            </div>
          </div>
          <button type="submit" disabled={pending} className="bg-[#a435f0] hover:bg-[#8710d8] text-white font-bold px-6 py-2.5 text-sm transition-colors disabled:opacity-60">
            {pending ? 'Saving...' : 'Save Changes'}
          </button>
          {state?.message && <p className="text-green-600 text-sm font-medium">{state.message}</p>}
        </div>
      </form>

      {/* Thumbnail */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mt-6">
        <h2 className="font-bold text-gray-900 mb-4">Thumbnail</h2>
        <div className="flex items-start gap-6">
          <div className="w-48 h-28 bg-gray-100 border border-gray-200 rounded overflow-hidden flex-shrink-0">
            {thumbnailUrl ? (
              <img src={thumbnailUrl} alt="Thumbnail" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center"><ImageIcon className="w-8 h-8 text-gray-300" /></div>
            )}
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-3">Recommended: 1280×720px (16:9), max 4MB</p>
            <UploadButton endpoint="courseThumbnail" onClientUploadComplete={res => { if (res[0]) setThumbnailUrl(res[0].ufsUrl); }} onUploadError={err => alert(err.message)} />
          </div>
        </div>
      </div>

      {/* Course Content Builder */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mt-6">
        <h2 className="font-bold text-gray-900 mb-6">Course Content</h2>

        <div className="space-y-4">
          {sections.map(section => (
            <div key={section.id} className="border border-gray-200 rounded-lg overflow-hidden">
              {/* Section Header */}
              <div className="flex items-center gap-3 p-4 bg-gray-50 cursor-pointer" onClick={() => toggleSection(section.id)}>
                {expandedSections.has(section.id) ? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronRight className="w-4 h-4 text-gray-500" />}
                <span className="font-bold text-gray-900 flex-1">{section.title}</span>
                <span className="text-xs text-gray-400">{section.lectures.length} lectures</span>
                <button type="button" onClick={e => { e.stopPropagation(); handleDeleteSection(section.id); }} className="text-gray-400 hover:text-red-500 ml-2">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Section Content */}
              {expandedSections.has(section.id) && (
                <div className="p-4 space-y-3">
                  {section.lectures.map(lecture => (
                    <div key={lecture.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded border border-gray-100">
                      <Video className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{lecture.title}</p>
                        <p className="text-xs text-gray-400">{lecture.duration > 0 ? `${lecture.duration} min` : 'No duration'} {lecture.isFree ? '• Free preview' : ''}</p>
                      </div>
                      {lecture.videoUrl ? (
                        <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                      ) : (
                        <div onClick={e => e.stopPropagation()}>
                          <UploadButton
                            endpoint="lectureVideo"
                            onClientUploadComplete={async res => {
                              if (res[0]) {
                                await updateLectureVideo(lecture.id, res[0].ufsUrl);
                                setSections(prev => prev.map(s => s.id === section.id
                                  ? { ...s, lectures: s.lectures.map(l => l.id === lecture.id ? { ...l, videoUrl: res[0].ufsUrl } : l) }
                                  : s
                                ));
                              }
                            }}
                            onUploadError={err => alert(err.message)}
                          />
                        </div>
                      )}
                      <button type="button" onClick={() => handleDeleteLecture(section.id, lecture.id)} className="text-gray-300 hover:text-red-500">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}

                  {/* Add Lecture Form */}
                  <form onSubmit={e => handleAddLecture(section.id, e)} className="flex items-center gap-2 mt-2">
                    <input name="title" required placeholder="New lecture title..." className="flex-1 border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-gray-900" />
                    <select name="isFree" className="border border-gray-200 px-2 py-2 text-sm">
                      <option value="false">Paid</option>
                      <option value="true">Free</option>
                    </select>
                    <button type="submit" className="bg-[#5624d0] text-white px-3 py-2 text-sm font-bold hover:bg-[#401b9c]">
                      <Plus className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Add Section Form */}
        <form onSubmit={handleAddSection} className="flex items-center gap-2 mt-6 pt-6 border-t border-gray-100">
          <input name="title" required placeholder="New section title..." className="flex-1 border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:border-gray-900" />
          <button type="submit" className="flex items-center gap-2 bg-[#1c1d1f] hover:bg-gray-700 text-white font-bold px-4 py-2.5 text-sm transition-colors">
            <Plus className="w-4 h-4" /> Add Section
          </button>
        </form>
      </div>
    </div>
  );
}
