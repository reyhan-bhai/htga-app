"use client";
import { MobileLayoutWrapper } from "@/app/layout-wrapper";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactElement } from "react";
import { useState } from "react";
import { PhoneInput } from "react-international-phone";
import "react-international-phone/style.css";

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    position: "",
    specialties: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Handle Text Inputs biasa
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handle Phone Input (Library mengembalikan string langsung)
  const handlePhoneChange = (phone: string): void => {
    setFormData({ ...formData, phone: phone });
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setError("");

    setLoading(true);

    const payload = {
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      company: formData.company,
      position: formData.position,
      specialties: formData.specialties.split(",").map((s) => s.trim()),
    };

    try {
      const response = await fetch("/api/user/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error || "Registration failed");
      }

      setLoading(false);
      router.push("/");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to register.";
      setError(message);
      setLoading(false);
      console.log("Registration error:", err);
    }
  };

  return (
    <MobileLayoutWrapper>
      <div className="min-h-screen bg-gradient-1 flex flex-col px-6 py-12">
        {/* Header */}
        <div className="mb-8 pt-4">
          <Link
            href="/"
            className="text-white flex items-center gap-2 mb-4 hover:opacity-80"
          >
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
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Login
          </Link>
          <h1 className="text-white text-3xl font-bold">Create Account</h1>
          <p className="text-white/80 mt-2 text-sm">
            Join HTGA as an evaluator
          </p>
        </div>

        {/* Register Form */}
        <div className="bg-white rounded-3xl shadow-xl px-6 py-8 flex-1">
          <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
            <InputGroup
              name="name"
              label="Full Name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Your Name"
            />
            <InputGroup
              name="email"
              type="email"
              label="Email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Your Email"
            />

            <div>
              <label className="block text-gray-600 text-xs font-bold mb-1 ml-1">
                Phone Number
              </label>
              <div className="phone-input-container">
                <PhoneInput
                  defaultCountry="id"
                  value={formData.phone}
                  onChange={handlePhoneChange}
                  placeholder="812-3456-7890"
                  style={{
                    display: "flex",
                    gap: "12px", // Jarak antara bendera dan input
                  }}
                  inputClassName="!w-full !bg-gray-50 !border !border-gray-200 !text-gray-800 !text-sm !rounded-xl !h-[46px] focus:!ring-2 focus:!ring-[#FFA200] focus:!border-transparent !outline-none !px-4"
                  countrySelectorStyleProps={{
                    buttonClassName:
                      "!bg-gray-50 !border !border-gray-200 !rounded-xl !h-[46px] !w-[70px] flex justify-center items-center hover:!bg-gray-100 !pr-1",
                    dropdownStyleProps: {
                      className:
                        "!bg-white !text-gray-800 !rounded-xl !shadow-xl !border-gray-100 !mt-2",
                    },
                  }}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <InputGroup
                name="company"
                label="Company"
                value={formData.company}
                onChange={handleChange}
                placeholder="Your Company"
              />
              <InputGroup
                name="position"
                label="Position"
                value={formData.position}
                onChange={handleChange}
                placeholder="Your Position"
              />
            </div>

            <InputGroup
              name="specialties"
              label="Specialties"
              value={formData.specialties}
              onChange={handleChange}
              placeholder="Bakery, Asian Cuisine..."
            />

            {error && (
              <p className="text-red-500 text-center text-sm bg-red-50 p-2 rounded">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#FFA200] hover:bg-[#FF9500] text-white font-bold py-4 rounded-xl shadow-lg mt-4 disabled:opacity-50 transition-all"
            >
              {loading ? "Creating Account..." : "Register"}
            </button>
          </form>
        </div>
      </div>
    </MobileLayoutWrapper>
  );
}

interface InputGroupProps {
  label: string;
  name: string;
  type?: string;
  value: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
}

const InputGroup = ({
  label,
  name,
  type = "text",
  value,
  onChange,
  placeholder,
}: InputGroupProps): ReactElement => (
  <div>
    <label className="block text-gray-600 text-xs font-bold mb-1 ml-1">
      {label}
    </label>
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full bg-gray-50 border border-gray-200 text-gray-800 text-sm rounded-xl focus:ring-2 focus:ring-[#FFA200] focus:border-transparent p-3 outline-none h-[46px]"
      required
    />
  </div>
);
