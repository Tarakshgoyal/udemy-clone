"use client";

import React, { useCallback } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import CourseCard, { CourseCardProps } from './CourseCard';

interface CourseCarouselProps {
  courses: CourseCardProps[];
}

export default function CourseCarousel({ courses }: CourseCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'start',
    slidesToScroll: 2,
    dragFree: true,
  });

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  return (
    <div className="relative group">
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex -ml-4">
          {courses.map((course, index) => (
            <div 
              key={index} 
              className="pl-4 min-w-[80vw] sm:min-w-[45vw] md:min-w-[30vw] lg:min-w-[20vw] shrink-0"
            >
              <CourseCard {...course} />
            </div>
          ))}
        </div>
      </div>
      
      <button 
        onClick={scrollPrev}
        className="absolute left-0 top-1/2 -translate-y-1/2 -ml-4 w-10 h-10 bg-black text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-0 z-10 shadow-lg"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>
      
      <button 
        onClick={scrollNext}
        className="absolute right-0 top-1/2 -translate-y-1/2 -mr-4 w-10 h-10 bg-black text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-0 z-10 shadow-lg"
      >
        <ChevronRight className="w-6 h-6" />
      </button>
    </div>
  );
}
