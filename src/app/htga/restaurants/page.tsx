"use client";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../htga-app/context/AuthContext";
import { dummyEstablishments } from "../../../htga-app/data/dummyData";

export default function RestaurantsPage() {
  const router = useRouter();
  const { user } = useAuth();

  const handleRestaurantClick = (id: string) => {
    router.push(`/htga/dashboard/${id}`);
  };

  const handleDownloadGuide = () => {
    alert("Download Guide functionality - Coming Soon!");
  };

  const handleNext = () => {
    router.push("/htga/dashboard");
  };

  return (
    <div className="min-h-screen bg-cream pb-24">
      {/* Header */}
      <div className="bg-cream pt-12 pb-6 px-6">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h2 className="text-2xl font-bold text-[#1B1B1B]">
              Choose Your
            </h2>
            <h2 className="text-2xl font-bold text-[#1B1B1B]">
              Restaurant Now!
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative">
              <svg
                className="w-6 h-6 text-[#1B1B1B]"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
              </svg>
            </button>
            <div className="w-10 h-10 rounded-full bg-gradient-2 flex items-center justify-center text-white font-semibold">
              {user?.name?.charAt(0) || "E"}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-6">
        {/* Section Title */}
        <h3 className="text-lg font-bold text-[#1B1B1B] mb-4">
          Restaurant List
        </h3>

        {/* Restaurant List */}
        <div className="space-y-3 mb-6">
          {dummyEstablishments.map((restaurant) => (
            <button
              key={restaurant.id}
              onClick={() => handleRestaurantClick(restaurant.id)}
              className="w-full bg-[#FFA200] hover:bg-[#FF9500] rounded-full p-4 flex items-center justify-between transition-all htga-button"
            >
              <span className="text-white font-semibold text-left">
                {restaurant.name}
              </span>
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </button>
          ))}
        </div>

        {/* Download Guide Button */}
        <button
          onClick={handleDownloadGuide}
          className="w-full bg-[#FFEDCC] hover:bg-[#FFE5B4] rounded-full py-3 px-4 flex items-center justify-center gap-2 mb-4 transition-all"
        >
          <svg
            className="w-5 h-5 text-[#1B1B1B]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
          <span className="text-[#1B1B1B] font-medium">
            Download the Guide
          </span>
        </button>

        {/* Next Button */}
        <button
          onClick={handleNext}
          className="ml-auto block bg-[#FFA200] hover:bg-[#FF9500] text-white font-semibold py-3 px-12 rounded-full htga-button"
        >
          Next
        </button>
      </div>

      {/* Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 h-1 bg-black"></div>
    </div>
  );
}
