"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import { FaGoogle, FaFacebook, FaLinkedin } from "react-icons/fa";
import {
  AiOutlineUser,
  AiOutlineEyeInvisible,
  AiOutlineEye,
} from "react-icons/ai";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const result = await login(username, password);
    if (result.success) {
      router.push("/htga/nda");
    } else {
      setError(result.error || "Invalid email or password");
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
            {/* Email Input */}
            <div className="relative mb-4">
              <input
                type="email"
                placeholder="Type your email here"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full htga-input pr-12"
                required
              />
              <AiOutlineUser className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl" />
            </div>

            {/* Password Input */}
            <div className="relative mb-4">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Type your password here"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full htga-input pr-12"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl"
              >
                {showPassword ? <AiOutlineEye /> : <AiOutlineEyeInvisible />}
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
                <FaGoogle className="text-2xl text-red-500" />
              </button>
              <button
                type="button"
                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
              >
                <FaFacebook className="text-2xl text-blue-600" />
              </button>
              <button
                type="button"
                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
              >
                <FaLinkedin className="text-2xl text-blue-700" />
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Helper Text */}
      <div className="text-center py-4 text-xs text-gray-500">
        Use your email and password sent by admin to login
      </div>
    </div>
  );
}
