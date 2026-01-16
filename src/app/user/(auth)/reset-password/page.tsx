"use client";
import { MobileLayoutWrapper } from "@/app/layout-wrapper";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const email = searchParams.get("email");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [errorMsg, setErrorMsg] = useState("");

  // 1. Real-time validation logic
  const doPasswordsMatch = password === confirmPassword;
  const isPasswordValid = password.length >= 6;
  // Only show error if user has started typing confirm password
  const showMatchError = confirmPassword.length > 0 && !doPasswordsMatch;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Double check on submit (redundant safety)
    if (!doPasswordsMatch) {
      setStatus("error");
      setErrorMsg("Passwords do not match");
      return;
    }

    if (!isPasswordValid) {
      setStatus("error");
      setErrorMsg("Password must be at least 6 characters");
      return;
    }

    setStatus("loading");

    try {
      const res = await fetch("/api/user/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token, newPassword: password }),
      });

      const data = await res.json();

      if (res.ok) {
        setStatus("success");
        setTimeout(() => router.push("/login"), 3000);
      } else {
        setStatus("error");
        setErrorMsg(data.error || "Failed to reset password");
      }
    } catch (err) {
      setStatus("error");
      setErrorMsg("Something went wrong");
      console.error("Reset Password Error:", err);
    }
  };

  if (!token || !email) {
    return (
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl px-8 py-10 text-center">
        <h3 className="text-xl font-bold text-red-500 mb-2">Invalid Link</h3>
        <p className="text-gray-500 text-sm mb-6">
          This password reset link is invalid or incomplete.
        </p>
        <Link href="/user/forgot-password" className="text-[#FFA200] font-bold">
          Request a new one
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md bg-white rounded-3xl shadow-xl px-8 py-10">
      {status === "success" ? (
        <div className="text-center">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-6 h-6 text-green-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">
            Password Reset!
          </h3>
          <p className="text-gray-500 text-sm mb-6">
            Your password has been updated successfully. Redirecting to login...
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            Set New Password
          </h2>

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2 ml-1">
              New Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 text-gray-800 rounded-xl focus:ring-2 focus:ring-[#FFA200] focus:border-transparent p-4 outline-none"
              required
            />
            {/* Helper text for password length */}
            {password.length > 0 && !isPasswordValid && (
               <p className="text-xs text-red-500 mt-1 ml-1">Must be at least 6 characters</p>
            )}
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2 ml-1">
              Confirm Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              // 2. Conditional styling: Red border if error, Normal if match
              className={`w-full border text-gray-800 rounded-xl focus:ring-2 focus:border-transparent p-4 outline-none transition-colors ${
                showMatchError 
                  ? "bg-red-50 border-red-500 focus:ring-red-200" 
                  : "bg-gray-50 border-gray-200 focus:ring-[#FFA200]"
              }`}
              required
            />
            
            {/* 3. Real-time Error Message */}
            {showMatchError && (
              <p className="text-red-500 text-xs mt-2 ml-1 flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Passwords do not match
              </p>
            )}
            
            {/* Optional: Success indicator when they DO match */}
            {confirmPassword.length > 0 && doPasswordsMatch && (
               <p className="text-green-600 text-xs mt-2 ml-1 flex items-center gap-1">
                 <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                 Passwords match
               </p>
            )}
          </div>

          {status === "error" && !showMatchError && (
            <p className="text-red-500 text-sm text-center mb-4">{errorMsg}</p>
          )}

          <button
            type="submit"
            // 4. Disable button if mismatch or invalid length
            disabled={status === "loading" || showMatchError || !isPasswordValid || !doPasswordsMatch}
            className="w-full bg-[#FFA200] hover:bg-[#FF9500] text-white font-bold py-4 rounded-xl shadow-lg transition-all mb-4 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {status === "loading" ? "Updating..." : "Update Password"}
          </button>
        </form>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <MobileLayoutWrapper>
      <div className="min-h-screen bg-gradient-1 flex flex-col items-center px-6 pt-20">
        <div className="w-full max-w-md mb-8 text-center">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
        </div>
        <Suspense fallback={<div className="text-white">Loading...</div>}>
          <ResetPasswordContent />
        </Suspense>
      </div>
    </MobileLayoutWrapper>
  );
}