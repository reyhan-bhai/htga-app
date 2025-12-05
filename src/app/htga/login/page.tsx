"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../htga-app/context/AuthContext";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const { login } = useAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const success = login(username, password);
    if (success) {
      router.push("/htga/nda");
    } else {
      setError("Invalid username or password");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-1 flex flex-col">
      {/* Status Bar */}
      <div className="pt-3 px-6 flex justify-between items-center text-white text-sm">
        <span>9:41</span>
        <div className="flex gap-1 items-center">
          <div className="w-4 h-3 border border-white rounded-sm"></div>
          <div className="w-3 h-3 border border-white rounded-sm"></div>
          <div className="w-2 h-3 border border-white rounded-sm"></div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-start px-6 pt-12">
        {/* Logo/Title */}
        <div className="text-center mb-16">
          <h1 className="text-white text-3xl font-bold leading-tight">
            HalalTrip
            <br />
            Gastronomy Award
            <br />
            (HTGA) App
          </h1>
        </div>

        {/* Login Form Card */}
        <div className="w-full max-w-md bg-white rounded-t-3xl px-6 pt-8 pb-6 flex-1">
          <form onSubmit={handleSubmit} className="flex flex-col">
            {/* Username Input */}
            <div className="relative mb-4">
              <input
                type="text"
                placeholder="Type your username here"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="text-black w-full htga-input pr-12"
                required
              />
              <svg
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5"
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

            {/* Password Input */}
            <div className="relative mb-4">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Type your password here"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="text-black w-full htga-input pr-12"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                )}
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 text-red-600 text-sm text-center">
                {error}
              </div>
            )}

            {/* Remember Me & Forgot Password */}
            <div className="flex justify-between items-center mb-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 accent-[#FFA200]"
                />
                <span className="text-sm text-gray-700">Remember me</span>
              </label>
              <button
                type="button"
                className="text-sm text-blue-600 hover:underline"
              >
                Forgot Password
              </button>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              className="w-full bg-[#FFA200] hover:bg-[#FF9500] text-white font-semibold py-4 rounded-full htga-button mb-6"
            >
              Login
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 mb-6">
              <div className="flex-1 h-px bg-gray-300"></div>
              <span className="text-sm text-gray-500">or</span>
              <div className="flex-1 h-px bg-gray-300"></div>
            </div>

            {/* Social Login */}
            <div className="flex justify-center gap-6">
              <button
                type="button"
                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
              >
                <span className="text-2xl text-red-500">G</span>
              </button>
              <button
                type="button"
                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
              >
                <span className="text-2xl text-blue-600">f</span>
              </button>
              <button
                type="button"
                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
              >
                <span className="text-2xl text-blue-700">in</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Helper Text */}
      <div className="text-center py-4 text-xs text-white">
        Demo: username: <strong>evaluator</strong>, password: <strong>123456</strong>
      </div>
    </div>
  );
}
