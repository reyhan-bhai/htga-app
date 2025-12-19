"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../htga-app/context/AuthContext";
import { MobileLayoutWrapper } from "../layout-wrapper";

export default function NDAPage() {
  const [agreed, setAgreed] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const router = useRouter();
  const { user, signNDA } = useAuth();

  const handleSignatureNow = () => {
    if (!agreed) {
      alert("Please agree to terms & condition first");
      return;
    }

    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const hasContent = imageData.data.some((channel) => channel !== 0);

        if (!hasContent) {
          alert("Please draw your signature");
          return;
        }
      }
    }

    signNDA();
    router.push("/dashboard");
  };

  const startDrawing = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        const rect = canvas.getBoundingClientRect();
        const x =
          "touches" in e
            ? e.touches[0].clientX - rect.left
            : e.clientX - rect.left;
        const y =
          "touches" in e
            ? e.touches[0].clientY - rect.top
            : e.clientY - rect.top;
        ctx.beginPath();
        ctx.moveTo(x, y);
      }
    }
  };

  const draw = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        const rect = canvas.getBoundingClientRect();
        const x =
          "touches" in e
            ? e.touches[0].clientX - rect.left
            : e.clientX - rect.left;
        const y =
          "touches" in e
            ? e.touches[0].clientY - rect.top
            : e.clientY - rect.top;
        ctx.lineTo(x, y);
        ctx.strokeStyle = "#1B1B1B";
        ctx.lineWidth = 2;
        ctx.lineCap = "round";
        ctx.stroke();
      }
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
  };

  return (
    <MobileLayoutWrapper>
      <div className="min-h-screen bg-cream">
        {/* Header */}
        <div className="bg-cream pt-12 pb-4 px-6">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h2 className="text-2xl font-bold text-[#1B1B1B]">
                Good Morning,
              </h2>
              <h2 className="text-2xl font-bold text-[#1B1B1B]">
                {user?.name || "Evaluator Name"}!
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
        <div className="px-6 pb-20">
          {/* Warning Banner */}
          <div className="bg-[#FFA200] rounded-2xl p-4 mb-6 flex items-center gap-3">
            <svg
              className="w-6 h-6 text-white flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-white font-medium text-sm">
              3 days left to fill out the NDA
            </span>
          </div>

          {/* NDA Document/Signature Area */}
          <div className="htga-card p-6 mb-6 min-h-[350px] flex flex-col">
            <h3 className="text-lg font-bold text-[#1B1B1B] mb-4">
              Non-Disclosure Agreement (NDA)
            </h3>

            <div className="flex-1 bg-gray-50 rounded-xl p-4 mb-4 overflow-y-auto max-h-64">
              <p className="text-sm text-gray-700 leading-relaxed mb-3">
                This Non-Disclosure Agreement (&quot;Agreement&quot;) is entered
                into by and between HalalTrip Gastronomy Award (HTGA) and the
                undersigned Evaluator.
              </p>
              <p className="text-sm text-gray-700 leading-relaxed mb-3">
                The Evaluator agrees to maintain confidentiality of all
                information, data, and materials related to restaurant
                evaluations, including but not limited to:
              </p>
              <ul className="list-disc list-inside text-sm text-gray-700 mb-3 space-y-1">
                <li>Restaurant details and locations</li>
                <li>Evaluation criteria and scoring methods</li>
                <li>Internal communications and discussions</li>
                <li>Other evaluators&#39; assessments and feedback</li>
              </ul>
              <p className="text-sm text-gray-700 leading-relaxed">
                The Evaluator shall not disclose, publish, or share any
                confidential information without prior written consent from
                HTGA.
              </p>
            </div>

            {/* Signature Canvas */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-[#1B1B1B] mb-2">
                Your Signature:
              </label>
              <div className="relative border-2 border-dashed border-gray-300 rounded-xl overflow-hidden bg-white">
                <canvas
                  ref={canvasRef}
                  width={320}
                  height={150}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  className="w-full cursor-crosshair touch-none"
                />
                <button
                  type="button"
                  onClick={clearSignature}
                  className="absolute top-2 right-2 text-xs text-red-600 bg-white px-3 py-1 rounded-full border border-red-300 hover:bg-red-50"
                >
                  Clear
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Draw your signature above
              </p>
            </div>
          </div>

          {/* Agreement Checkbox */}
          <label className="flex items-start gap-3 mb-6 cursor-pointer">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-1 w-5 h-5 accent-[#FFA200]"
            />
            <span className="text-sm text-[#1B1B1B]">
              I agree with term & condition
            </span>
          </label>

          {/* Signature Button */}
          <button
            onClick={handleSignatureNow}
            disabled={!agreed}
            className={`w-full py-4 rounded-full text-white font-semibold htga-button ${
              agreed
                ? "bg-[#FFA200] hover:bg-[#FF9500]"
                : "bg-gray-400 cursor-not-allowed"
            }`}
          >
            SIGNATURE NOW
          </button>
        </div>

        {/* Bottom Navigation Bar */}
        <div className="fixed bottom-0 left-0 right-0 h-1 bg-black"></div>
      </div>
    </MobileLayoutWrapper>
  );
}
