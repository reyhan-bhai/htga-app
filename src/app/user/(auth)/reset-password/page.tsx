"use client";
import { MobileLayoutWrapper } from "@/app/layout-wrapper";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const email = searchParams.get("email");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error" | "verifying"
  >("verifying");
  const [errorMsg, setErrorMsg] = useState("");
  const [isTokenValid, setIsTokenValid] = useState<boolean | null>(null);

  // Check token validity on mount
  useEffect(() => {
    async function verifyToken() {
      if (!token || !email) {
        setStatus("error");
        setErrorMsg("Invalid or missing reset token.");
        setIsTokenValid(false);
        return;
      }

      try {
        const res = await fetch(
          `/api/user/reset-password?token=${token}&email=${email}`,
        );
        if (!res.ok) {
          const data = await res.json();
          setStatus("error");
          setErrorMsg(data.error || "This link is invalid or has expired.");
          setIsTokenValid(false);
        } else {
          setStatus("idle");
          setIsTokenValid(true);
        }
      } catch (err) {
        setStatus("error");
        setErrorMsg("Failed to verify reset link.");
        setIsTokenValid(false);
        console.error("Verification Error:", err);
      }
    }

    verifyToken();
  }, [token, email]);

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
        setTimeout(() => router.push("/"), 3000);
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

  if (status === "verifying") {
    return (
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl px-8 py-10 text-center">
        <div className="w-12 h-12 border-4 border-[#FFA200] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-500">Verifying reset link...</p>
      </div>
    );
  }

  if (status === "error" && isTokenValid === false) {
    return (
      <div className="w-full max-w-md">
        {/* Animated Icon */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="w-24 h-24 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center shadow-2xl animate-bounce-slow">
              <svg
                className="w-12 h-12 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            {/* Pulse effect */}
            {/* <div className="absolute inset-0 w-24 h-24 bg-red-500 rounded-full animate-ping opacity-20"></div> */}
          </div>
        </div>

        {/* Card Content */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-red-500 to-red-600 px-8 py-6 text-center">
            <h2 className="text-white text-3xl font-bold mb-1">
              Invalid Request
            </h2>
            <p className="text-red-100 text-sm">Your reset link has expired</p>
          </div>

          {/* Body */}
          <div className="px-8 py-10 text-center">
            <div className="mb-8">
              <h3 className="text-gray-800 font-bold text-xl mb-3">
                Security Link Expired
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                For your security, password reset links are only valid for{" "}
                <span className="font-semibold text-red-600">1 hour</span> and
                can only be used once.
              </p>
            </div>

            {/* Info Box */}
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-5 border-l-4 border-amber-500 mb-8 text-left">
              <div className="flex items-start gap-3">
                <svg
                  className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div>
                  <p className="text-amber-900 text-sm font-medium mb-1">
                    Why did this happen?
                  </p>
                  <p className="text-amber-800 text-xs leading-relaxed">
                    This link may have expired, already been used, or a newer
                    reset link was requested for this account.
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Link
                href="/user/forgot-password"
                className="block w-full bg-gradient-to-r from-[#FFA200] to-[#FF9500] hover:from-[#FF9500] hover:to-[#FF8800] text-white font-bold py-4 rounded-xl shadow-lg transition-all transform hover:scale-[1.02] active:scale-[0.98]"
              >
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  Request New Reset Link
                </span>
              </Link>

              <Link
                href="/"
                className="block w-full text-gray-600 hover:text-gray-800 text-sm font-medium py-3 transition-colors"
              >
                ← Back to Login
              </Link>
            </div>
          </div>
        </div>
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
              <p className="text-xs text-red-500 mt-1 ml-1">
                Must be at least 6 characters
              </p>
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
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Passwords do not match
              </p>
            )}

            {/* Optional: Success indicator when they DO match */}
            {confirmPassword.length > 0 && doPasswordsMatch && (
              <p className="text-green-600 text-xs mt-2 ml-1 flex items-center gap-1">
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
                    d="M5 13l4 4L19 7"
                  />
                </svg>
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
            disabled={
              status === "loading" ||
              showMatchError ||
              !isPasswordValid ||
              !doPasswordsMatch
            }
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
      <div className="min-h-screen bg-gradient-1 flex flex-col items-center justify-center px-6 py-12">
        <Suspense
          fallback={
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mb-3"></div>
              <p className="text-white">Loading...</p>
            </div>
          }
        >
          <ResetPasswordContent />
        </Suspense>
      </div>
    </MobileLayoutWrapper>
  );
}
