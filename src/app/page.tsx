"use client";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { MobileLayoutWrapper } from "./layout-wrapper";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const { login, isAuthenticated, loading, user } = useAuth();

  const getRedirectPath = useCallback((): string => {
    const role = user?.role;
    if (role === "superadmin") return "/superadmin";
    if (role === "admin") return "/admin";
    return "/user/dashboard";
  }, [user?.role]);

  useEffect(() => {
    if (!loading && isAuthenticated && user?.role) {
      router.replace(getRedirectPath());
    }
  }, [getRedirectPath, isAuthenticated, loading, router, user?.role]);

  // Helper function to translate Firebase errors
  const getFriendlyErrorMessage = (errorCode: string | undefined): string => {
    if (!errorCode) {
      return "An unexpected error occurred. Please try again.";
    }
    const code = String(errorCode).toLowerCase();

    if (
      code.includes("auth/invalid-credential") ||
      code.includes("auth/user-not-found") ||
      code.includes("auth/wrong-password")
    ) {
      return "Incorrect email or password. Please try again.";
    }
    if (code.includes("auth/too-many-requests")) {
      return "Too many failed login attempts. Please reset your password or try again later.";
    }
    if (code.includes("auth/network-request-failed")) {
      return "Network error. Please check your internet connection.";
    }

    return "An unexpected error occurred. Please try again.";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const result = await login(username, password, true);

    if (!result.success) {
      const friendlyMsg = getFriendlyErrorMessage(result.error);
      setError(friendlyMsg);
    }
    // On success, the useEffect watching isAuthenticated + user.role
    // will redirect once the role is fully resolved from the database.
  };

  if (loading || isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-1 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <MobileLayoutWrapper>
      <div className="min-h-screen bg-gradient-1 flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center px-6 pt-12">
          {/* Logo/Title */}
          <div className="text-center mb-10 animate-fade-in-down">
            <h1 className="text-white text-3xl font-bold leading-tight drop-shadow-md">
              HalalTrip
              <br />
              Gastronomy Award
              <br />
              (HTGA) App
            </h1>
          </div>

          {/* Login Form Card */}
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl px-8 pt-10 pb-8 flex flex-col">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Welcome Back</h2>
              <p className="text-gray-500 text-sm">
                Please sign in to continue
              </p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col space-y-5">
              {/* Email Input */}
              <div className="relative group">
                <input
                  type="email"
                  placeholder="Email Address"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 text-gray-800 text-sm rounded-xl focus:ring-2 focus:ring-[#FFA200] focus:border-transparent block p-4 pl-4 transition-all outline-none"
                  required
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-gray-400">
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
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
              </div>

              {/* Password Input */}
              <div className="relative group">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 text-gray-800 text-sm rounded-xl focus:ring-2 focus:ring-[#FFA200] focus:border-transparent block p-4 pl-4 transition-all outline-none"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? (
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
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  ) : (
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
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                      />
                    </svg>
                  )}
                </button>
              </div>

              {/* Forgot Password Link */}
              <div className="flex justify-end">
                <Link
                  href="/user/forgot-password"
                  className="text-sm font-medium text-[#FFA200] hover:text-[#e59100] transition-colors"
                >
                  Forgot Password?
                </Link>
              </div>

              {/* Error Display (Pulse Removed) */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg text-center flex items-center justify-center gap-2">
                  <svg
                    className="w-4 h-4 flex-shrink-0"
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
                  {error}
                </div>
              )}

              {/* Login Button */}
              <button
                type="submit"
                className="w-full bg-[#FFA200] hover:bg-[#FF9500] text-white font-bold py-4 rounded-xl shadow-lg transform active:scale-95 transition-all duration-200"
              >
                LOGIN
              </button>
            </form>

            {/* Register Link */}
            <div className="mt-8 text-center">
              <p className="text-gray-500 text-sm">
                Dont have an account?{" "}
                <Link
                  href="/user/register"
                  className="font-bold text-[#FFA200] hover:underline"
                >
                  Register Now
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </MobileLayoutWrapper>
  );
}
