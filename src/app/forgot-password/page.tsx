"use client";
import { useState } from "react";
import Link from "next/link";
import { MobileLayoutWrapper } from "../layout-wrapper";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    
    // Simulasi API call
    setTimeout(() => {
      setStatus("success");
    }, 2000);
  };

  return (
    <MobileLayoutWrapper>
      <div className="min-h-screen bg-gradient-1 flex flex-col items-center px-6 pt-20">
        
        {/* Header */}
        <div className="w-full max-w-md mb-8 text-center">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
            </div>
            <h1 className="text-white text-3xl font-bold mb-2">Forgot Password?</h1>
            <p className="text-white/80 text-sm">Enter your registered email address and we will send you a link to reset your password.</p>
        </div>

        {/* Card */}
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl px-8 py-10">
          {status === "success" ? (
             <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">Check your mail</h3>
                <p className="text-gray-500 text-sm mb-6">We have sent a password recover instructions to your email.</p>
                <Link href="/login" className="block w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-3 rounded-xl transition-colors">
                    Back to Login
                </Link>
             </div>
          ) : (
            <form onSubmit={handleSubmit}>
                <div className="mb-6">
                    <label className="block text-gray-700 text-sm font-bold mb-2 ml-1">Email Address</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 text-gray-800 rounded-xl focus:ring-2 focus:ring-[#FFA200] focus:border-transparent p-4 outline-none"
                        placeholder="example@upi.edu"
                        required
                    />
                </div>

                <button
                    type="submit"
                    disabled={status === "loading"}
                    className="w-full bg-[#FFA200] hover:bg-[#FF9500] text-white font-bold py-4 rounded-xl shadow-lg transition-all mb-4"
                >
                    {status === "loading" ? "Sending..." : "Reset Password"}
                </button>

                <Link href="/login" className="block text-center text-gray-500 text-sm hover:text-gray-800 font-medium">
                    Cancel & Back to Login
                </Link>
            </form>
          )}
        </div>

      </div>
    </MobileLayoutWrapper>
  );
}