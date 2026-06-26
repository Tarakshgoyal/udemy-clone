'use client';

import { useState, useEffect } from 'react';

interface Topic { id: string; name: string; slug: string; }
interface Subcategory { id: string; name: string; slug: string; topics: Topic[]; }
interface Category { id: string; name: string; slug: string; subcategories: Subcategory[]; }

export default function TaxonomySelector() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState('');
  const [selectedTopicId, setSelectedTopicId] = useState('');

  const selectedCategory = categories.find(c => c.id === selectedCategoryId);
  const selectedSubcategory = selectedCategory?.subcategories.find(s => s.id === selectedSubcategoryId);

  useEffect(() => {
    fetch('/api/categories')
      .then(r => r.json())
      .then(data => setCategories(data.categories ?? []));
  }, []);

  return (
    <div className="grid grid-cols-3 gap-4">
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-1">Category</label>
        <select
          className="w-full border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:border-gray-900"
          value={selectedCategoryId}
          onChange={e => { setSelectedCategoryId(e.target.value); setSelectedSubcategoryId(''); setSelectedTopicId(''); }}
        >
          <option value="">Select category</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-1">Subcategory</label>
        <select
          className="w-full border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:border-gray-900"
          value={selectedSubcategoryId}
          onChange={e => { setSelectedSubcategoryId(e.target.value); setSelectedTopicId(''); }}
          disabled={!selectedCategoryId}
        >
          <option value="">Select subcategory</option>
          {selectedCategory?.subcategories.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-1">Topic</label>
        <select
          name="topicId"
          className="w-full border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:border-gray-900"
          value={selectedTopicId}
          onChange={e => setSelectedTopicId(e.target.value)}
          disabled={!selectedSubcategoryId}
        >
          <option value="">Select topic</option>
          {selectedSubcategory?.topics.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </div>
    </div>
  );
}
