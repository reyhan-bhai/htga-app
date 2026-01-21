import React from "react";

interface RecommendationBannerProps {
  onOpen: () => void;
}

export default function RecommendationBanner({
  onOpen,
}: RecommendationBannerProps) {
  return (
    <div className="mb-8">
      <div className="bg-[#1B1B1B] rounded-3xl p-5 shadow-lg shadow-gray-300/50 flex items-center justify-between relative overflow-hidden">
        {/* Decorative background element */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10 blur-xl"></div>

        <div className="relative z-10">
          <h4 className="text-white font-bold text-lg mb-1">
            Know a hidden gem?
          </h4>
          <p className="text-gray-400 text-xs mb-3 max-w-[200px]">
            Recommend a restaurant for us to evaluate and expand our list.
          </p>
          <button
            onClick={onOpen}
            className="bg-[#FFA200] text-[#1B1B1B] text-xs font-bold px-4 py-2 rounded-xl hover:bg-[#ffb333] transition-colors flex items-center gap-1"
          >
            Recommend Place
            <svg
              className="w-3 h-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M14 5l7 7m0 0l-7 7m7-7H3"
              />
            </svg>
          </button>
        </div>
        <div className="relative z-10 bg-white/10 p-3 rounded-2xl">
          <span className="text-2xl">🍽️</span>
        </div>
      </div>
    </div>
  );
}