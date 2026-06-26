'use client';

import { useActionState, useState } from 'react';
import { createCourse } from '@/app/actions/courses';
import { UploadButton } from '@/lib/uploadthing';
import { ImageIcon, ArrowLeft, Plus, X } from 'lucide-react';
import Link from 'next/link';
import TaxonomySelector from '../../_components/TaxonomySelector';

export default function NewCoursePage() {
  const [state, action, pending] = useActionState(createCourse, undefined);
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [whatYouLearn, setWhatYouLearn] = useState(['']);
  const [requirements, setRequirements] = useState(['']);

  const addItem = (setter: React.Dispatch<React.SetStateAction<string[]>>) =>
    setter(prev => [...prev, '']);

  const removeItem = (setter: React.Dispatch<React.SetStateAction<string[]>>, idx: number) =>
    setter(prev => prev.filter((_, i) => i !== idx));

  const updateItem = (setter: React.Dispatch<React.SetStateAction<string[]>>, idx: number, val: string) =>
    setter(prev => prev.map((item, i) => (i === idx ? val : item)));

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/creator-studio/courses" className="text-gray-400 hover:text-gray-700 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Create New Course</h1>
          <p className="text-gray-500 mt-1">Fill in the details to create your course</p>
        </div>
      </div>

      <form action={action} className="space-y-8">
        {/* Hidden thumbnail URL */}
        <input type="hidden" name="thumbnailUrl" value={thumbnailUrl} />

        {/* Basic Info */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
          <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-3">Course Information</h2>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Course Title *</label>
            <input
              name="title"
              required
              placeholder="e.g. Complete React Developer Course 2025"
              className="w-full border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
            />
            {state?.errors?.title && <p className="text-red-600 text-xs mt-1">{state.errors.title[0]}</p>}
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Description *</label>
            <textarea
              name="description"
              required
              rows={5}
              placeholder="Describe what students will learn in this course..."
              className="w-full border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 resize-none"
            />
            {state?.errors?.description && <p className="text-red-600 text-xs mt-1">{state.errors.description[0]}</p>}
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Price (₹) *</label>
              <input
                name="price"
                type="number"
                required
                min={0}
                placeholder="399"
                className="w-full border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Original Price (₹)</label>
              <input
                name="originalPrice"
                type="number"
                min={0}
                placeholder="3299"
                className="w-full border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Level</label>
              <select name="level" className="w-full border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:border-gray-900">
                <option value="All Levels">All Levels</option>
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Language</label>
              <select name="language" className="w-full border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:border-gray-900">
                <option value="English">English</option>
                <option value="Hindi">Hindi</option>
                <option value="Hinglish">Hinglish</option>
              </select>
            </div>
          </div>
        </div>

        {/* Taxonomy */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-3 mb-5">Category</h2>
          <TaxonomySelector />
        </div>

        {/* Thumbnail */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-3 mb-5">Course Thumbnail</h2>
          <div className="flex items-start gap-6">
            <div className="w-48 h-28 bg-gray-100 border-2 border-dashed border-gray-300 rounded flex items-center justify-center flex-shrink-0 overflow-hidden">
              {thumbnailUrl ? (
                <img src={thumbnailUrl} alt="Thumbnail preview" className="w-full h-full object-cover" />
              ) : (
                <ImageIcon className="w-8 h-8 text-gray-300" />
              )}
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-3">Upload a high-quality image (16:9 ratio, max 4MB)</p>
              <UploadButton
                endpoint="courseThumbnail"
                onClientUploadComplete={(res) => {
                  if (res[0]) setThumbnailUrl(res[0].ufsUrl);
                }}
                onUploadError={(err) => alert(`Upload failed: ${err.message}`)}
              />
            </div>
          </div>
        </div>

        {/* What You'll Learn */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-3 mb-5">What students will learn</h2>
          <div className="space-y-3">
            {whatYouLearn.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  name="whatYouLearn"
                  value={item}
                  onChange={e => updateItem(setWhatYouLearn, idx, e.target.value)}
                  placeholder={`Learning outcome ${idx + 1}`}
                  className="flex-1 border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:border-gray-900"
                />
                {whatYouLearn.length > 1 && (
                  <button type="button" onClick={() => removeItem(setWhatYouLearn, idx)} className="text-gray-400 hover:text-red-500">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
            <button type="button" onClick={() => addItem(setWhatYouLearn)} className="flex items-center gap-1 text-[#5624d0] text-sm font-bold hover:underline">
              <Plus className="w-4 h-4" /> Add item
            </button>
          </div>
        </div>

        {/* Requirements */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-3 mb-5">Requirements</h2>
          <div className="space-y-3">
            {requirements.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  name="requirements"
                  value={item}
                  onChange={e => updateItem(setRequirements, idx, e.target.value)}
                  placeholder={`Requirement ${idx + 1}`}
                  className="flex-1 border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:border-gray-900"
                />
                {requirements.length > 1 && (
                  <button type="button" onClick={() => removeItem(setRequirements, idx)} className="text-gray-400 hover:text-red-500">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
            <button type="button" onClick={() => addItem(setRequirements)} className="flex items-center gap-1 text-[#5624d0] text-sm font-bold hover:underline">
              <Plus className="w-4 h-4" /> Add requirement
            </button>
          </div>
        </div>

        {state?.message && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">{state.message}</div>
        )}

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={pending}
            className="bg-[#a435f0] hover:bg-[#8710d8] text-white font-bold px-8 py-3 transition-colors disabled:opacity-60 flex items-center gap-2"
          >
            {pending && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            {pending ? 'Creating...' : 'Create Course'}
          </button>
          <Link href="/creator-studio/courses" className="px-8 py-3 border border-gray-300 text-gray-700 font-bold hover:bg-gray-50 transition-colors">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
