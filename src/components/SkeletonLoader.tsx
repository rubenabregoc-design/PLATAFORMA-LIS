import React from 'react';

export const SkeletonLoader: React.FC = () => {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Executive Header Skeleton */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-3 w-full max-w-xl">
          <div className="h-4 bg-slate-800 rounded-lg w-48"></div>
          <div className="h-8 bg-slate-800 rounded-xl w-3/4"></div>
          <div className="h-4 bg-slate-800/80 rounded-lg w-full"></div>
        </div>
        <div className="h-16 bg-slate-800 rounded-2xl w-48 shrink-0"></div>
      </div>

      {/* Role Context Bar Skeleton */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center justify-between gap-4">
        <div className="h-4 bg-slate-800 rounded-lg w-72"></div>
        <div className="h-4 bg-slate-800 rounded-lg w-36"></div>
      </div>

      {/* Bento Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-5">
        {/* Skeleton Card 1 (4 cols) */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-800/80 pb-3">
            <div className="h-5 bg-slate-800 rounded-lg w-32"></div>
            <div className="h-4 bg-slate-800 rounded-full w-16"></div>
          </div>
          <div className="space-y-3 pt-2">
            <div className="h-12 bg-slate-800/80 rounded-xl w-full"></div>
            <div className="h-12 bg-slate-800/80 rounded-xl w-full"></div>
            <div className="h-12 bg-slate-800/80 rounded-xl w-full"></div>
          </div>
          <div className="h-10 bg-teal-500/20 rounded-2xl w-full mt-4"></div>
        </div>

        {/* Skeleton Card 2 (8 cols) */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5">
          <div className="flex justify-between items-center border-b border-slate-800/80 pb-3">
            <div className="h-5 bg-slate-800 rounded-lg w-48"></div>
            <div className="h-4 bg-slate-800 rounded-full w-24"></div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <div className="h-4 bg-slate-800 rounded w-16"></div>
                  <div className="h-3 bg-slate-800 rounded-full w-12"></div>
                </div>
                <div className="h-4 bg-slate-800/80 rounded w-28"></div>
                <div className="h-3 bg-slate-800/60 rounded w-20"></div>
              </div>
            ))}
          </div>

          <div className="h-20 bg-slate-950/80 border border-slate-800 rounded-2xl w-full"></div>
        </div>
      </div>
    </div>
  );
};
