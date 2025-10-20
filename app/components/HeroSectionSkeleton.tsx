import React from "react";
import { Skeleton } from "./ui/skeleton";

const HeroSectionSkeleton = () => {
  return (
    <div className="h-[95vh] w-[100vw] mt-[-100px] pt-[100px] sm:mb-[120px] md:pt-[50px] bg-gradient-to-b from-[#0B0F24] via-[#121738] from-[#0B0F24]">
      {/* Currency Ticker Skeleton */}
      <div className="w-full h-10 mb-4">
        <Skeleton className="w-full h-full bg-slate-800/50" />
      </div>

      <div className="flex flex-col lg:flex-row justify-between lg:gap-8 px-4 lg:py-0 items-center rounded-2xl relative mt-[40px] mt-0">
        {/* Left Content Skeleton */}
        <div className="flex flex-col gap-4 w-full lg:w-[40%]">
          {/* Title Skeleton */}
          <Skeleton className="h-12 md:h-16 2xl:h-24 w-full bg-slate-800/50" />
          <Skeleton className="h-12 md:h-16 2xl:h-24 w-4/5 bg-slate-800/50" />
          
          {/* Subtitle Skeleton */}
          <Skeleton className="h-6 md:h-8 w-3/4 bg-slate-800/50 mt-2" />
          
          {/* CTA Buttons Skeleton */}
          <div className="flex flex-row items-center gap-4 w-full mt-4">
            <Skeleton className="h-12 sm:h-16 w-48 sm:w-64 rounded-xl bg-slate-800/50" />
            <Skeleton className="h-12 sm:h-16 w-12 sm:w-16 rounded-xl bg-slate-800/50" />
          </div>
          
          {/* Flags Skeleton */}
          <div className="flex flex-wrap gap-2 mt-4">
            {[...Array(7)].map((_, i) => (
              <Skeleton key={i} className="h-8 w-20 rounded-lg bg-slate-800/50" />
            ))}
          </div>
        </div>

        {/* Right Image Skeleton */}
        <div className="flex w-[100%] md:w-[60%] items-center gap-4 lg:py-0 my-auto mt-8 lg:mt-0">
          <div className="relative w-full md:w-[85%] xl:w-[80%]">
            <Skeleton className="w-full h-64 md:h-80 lg:h-96 rounded-3xl bg-slate-800/50" />
          </div>
        </div>
      </div>

      {/* Mini App CTA Skeleton */}
      <div className="relative w-full items-center justify-between mt-4 md:mt-0">
        <div className="shadow-2xl mx-auto md:mx-0">
          <div className="pl-4 flex flex-col items-start justify-between flex-wrap relative z-10">
            <div className="flex items-center gap-5 justify-center pl-2 mx-auto">
              <Skeleton className="h-6 w-64 bg-slate-800/50" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSectionSkeleton;
