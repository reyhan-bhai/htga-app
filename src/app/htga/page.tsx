"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function HTGAIndexPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to login page
    router.push("/htga/login");
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-1 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-white text-3xl font-bold mb-4">
          HalalTrip Gastronomy Award
        </h1>
        <p className="text-white">Loading...</p>
      </div>
    </div>
  );
}
