import React from 'react';

const Skeleton = () => {
  return (
    <div className="min-h-screen bg-gray-50 pb-12 font-sans animate-pulse">
      {/* Header Skeleton */}
      <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <div className="h-8 w-32 bg-gray-200 rounded-lg"></div>
          <div className="h-6 w-20 bg-gray-100 rounded-full hidden sm:block"></div>
        </div>
        <div className="flex gap-2">
          <div className="h-10 w-10 bg-gray-100 rounded-full"></div>
          <div className="h-10 w-10 bg-gray-100 rounded-full"></div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Alert Skeleton */}
        <div className="h-14 bg-gray-200 rounded-2xl w-full"></div>

        {/* Stats Grid Skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white p-4 rounded-2xl border border-gray-100 h-32 flex flex-col items-center justify-center space-y-3">
              <div className="h-10 w-10 bg-gray-100 rounded-xl"></div>
              <div className="h-3 w-16 bg-gray-50 rounded"></div>
              <div className="h-6 w-20 bg-gray-100 rounded"></div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chart Skeleton */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 h-[450px] p-6 space-y-4">
            <div className="flex justify-between">
              <div className="h-5 w-32 bg-gray-100 rounded"></div>
              <div className="flex gap-2">
                {[1, 2, 3, 4].map(i => <div key={i} className="h-6 w-12 bg-gray-50 rounded"></div>)}
              </div>
            </div>
            <div className="h-full w-full bg-gray-50 rounded-xl"></div>
          </div>

          {/* Controls Skeleton */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 h-[450px] space-y-6">
            <div className="h-6 w-32 bg-gray-100 rounded"></div>
            <div className="space-y-4">
              <div className="h-20 bg-gray-50 rounded-2xl"></div>
              <div className="h-20 bg-gray-50 rounded-2xl"></div>
              <div className="h-20 bg-gray-50 rounded-2xl"></div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Skeleton;
