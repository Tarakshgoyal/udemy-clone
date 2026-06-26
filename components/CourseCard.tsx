import Image from 'next/image';
import { Star } from 'lucide-react';

import Link from 'next/link';

export interface CourseCardProps {
  id?: string;
  imageSrc: string;
  title: string;
  authors: string;
  rating: number;
  reviews: number;
  price: number;
  originalPrice?: number;
  badges?: string[];
}

export default function CourseCard({
  id = "complete-data-analyst",
  imageSrc,
  title,
  authors,
  rating,
  reviews,
  price,
  originalPrice,
  badges,
}: CourseCardProps) {
  return (
    <Link href={`/course/${id}`} className="flex flex-col group/card cursor-pointer w-full h-full">
      <div className="relative w-full aspect-video overflow-hidden border border-gray-200 mb-2">
        <div className="absolute inset-0 bg-gray-200" />
        {/* We use a placeholder div color if no real image is loaded, but next/image works if src provided */}
        <div 
          className="absolute inset-0 bg-cover bg-center transition-transform duration-300 group-hover/card:scale-105"
          style={{ backgroundImage: `url(${imageSrc})` }}
        />
      </div>
      
      <h3 className="font-bold text-gray-900 leading-tight mb-1 line-clamp-2">
        {title}
      </h3>
      
      <p className="text-xs text-gray-500 mb-1 line-clamp-1">{authors}</p>
      
      <div className="flex items-center text-sm mb-1">
        <span className="font-bold text-[#b4690e] mr-1">{rating.toFixed(1)}</span>
        <div className="flex text-[#b4690e]">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className={`w-3.5 h-3.5 ${i < Math.floor(rating) ? 'fill-current' : 'text-gray-300'}`} />
          ))}
        </div>
        <span className="text-xs text-gray-500 ml-1">({reviews.toLocaleString()})</span>
      </div>
      
      <div className="flex items-center space-x-2 mb-2">
        <span className="font-bold text-gray-900">₹{price.toFixed(2)}</span>
        {originalPrice && (
          <span className="text-sm text-gray-500 line-through">₹{originalPrice.toFixed(2)}</span>
        )}
      </div>

      {badges && badges.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-auto">
          {badges.map((badge, idx) => (
            <span 
              key={idx} 
              className={`text-xs font-bold px-2 py-0.5 ${
                badge === 'Bestseller' ? 'bg-[#eceb98] text-[#3d3c0a]' : 
                badge === 'Premium' ? 'bg-purple-600 text-white' : 
                'bg-gray-200 text-gray-800'
              }`}
            >
              {badge}
            </span>
          ))}
        </div>
      )}
    </Link>
  );
}
