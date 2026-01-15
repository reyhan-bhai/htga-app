"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MobileLayoutWrapper } from "@/app/layout-wrapper";

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    position: "",
    specialties: "", // Input string, nanti di convert ke array
    password: "",
    confirmPassword: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    const payload = {
       name: formData.name,
       email: formData.email,
       phone: formData.phone,
       company: formData.company,
       position: formData.position,
       specialties: formData.specialties.split(",").map(s => s.trim()), // Convert string to array
      
    };

    try {
      console.log("Registering:", payload);
      setTimeout(() => {
        setLoading(false);
        router.push("/"); 
      }, 1500);
    } catch (err) {
      setError("Failed to register. Please try again.");
      setLoading(false);
      console.log("Register error:", err);
    }
  };

  return (
    <MobileLayoutWrapper>
      <div className="min-h-screen bg-gradient-1 flex flex-col px-6 py-12">
        {/* Header */}
        <div className="mb-8 pt-4">
          <Link href="/" className="text-white flex items-center gap-2 mb-4 hover:opacity-80">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            Back to Login
          </Link>
          <h1 className="text-white text-3xl font-bold">Create Account</h1>
          <p className="text-white/80 mt-2 text-sm">Join HTGA as an evaluator</p>
        </div>

        {/* Register Form */}
        <div className="bg-white rounded-3xl shadow-xl px-6 py-8 flex-1">
          <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
            
            <InputGroup name="name" label="Full Name" value={formData.name} onChange={handleChange} placeholder="Your Name" />
            <InputGroup name="email" type="email" label="Email" value={formData.email} onChange={handleChange} placeholder="Your Email" />
            <InputGroup name="phone" type="tel" label="Phone Number" value={formData.phone} onChange={handleChange} placeholder="Your Phone Number" />
            
            <div className="grid grid-cols-2 gap-4">
              <InputGroup name="company" label="Company" value={formData.company} onChange={handleChange} placeholder="Your Company" />
              <InputGroup name="position" label="Position" value={formData.position} onChange={handleChange} placeholder="Your Position" />
            </div>

            <InputGroup name="specialties" label="Specialties" value={formData.specialties} onChange={handleChange} placeholder="Your Specialty" />
            
            {error && <p className="text-red-500 text-center text-sm">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#FFA200] hover:bg-[#FF9500] text-white font-bold py-4 rounded-xl shadow-lg mt-4 disabled:opacity-50"
            >
              {loading ? "Creating Account..." : "Register"}
            </button>
          </form>
        </div>
      </div>
    </MobileLayoutWrapper>
  );
}

// Reusable Input Component agar code lebih bersih
const InputGroup = ({ label, name, type = "text", value, onChange, placeholder }: any) => (
  <div>
    <label className="block text-gray-600 text-xs font-bold mb-1 ml-1">{label}</label>
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full bg-gray-50 border border-gray-200 text-gray-800 text-sm rounded-xl focus:ring-2 focus:ring-[#FFA200] focus:border-transparent p-3 outline-none"
      required
    />
  </div>
);