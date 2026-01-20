"use client";
import { MobileLayoutWrapper } from "@/app/layout-wrapper";
import { db } from "@/lib/firebase";
import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@nextui-org/react"; // 1. Import Modal components
import { onValue, ref } from "firebase/database";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactElement } from "react";
import { useEffect, useRef, useState } from "react";
import { PhoneInput } from "react-international-phone";
import "react-international-phone/style.css";

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    city: "",
    company: "",
    position: "",
    specialties: "",
  });
  const [specialtiesOptions, setSpecialtiesOptions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // 2. Add state for success modal
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    const categoryRef = ref(db, "dropdown/category");
    const unsubscribe = onValue(categoryRef, (snapshot) => {
      if (snapshot.exists()) {
        const val = snapshot.val();
        const list: string[] = [];

        Object.values(val).forEach((value) => {
          list.push(String(value));
        });

        // Unique values and sort
        setSpecialtiesOptions(Array.from(new Set(list)).sort());
      } else {
        setSpecialtiesOptions([]);
      }
    });

    return () => unsubscribe();
  }, []);

  // Handle Text Inputs biasa
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ): void => {
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
      city: formData.city,
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
      // 3. Show success modal instead of redirecting immediately
      setShowSuccessModal(true);
      
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to register.";
      setError(message);
      setLoading(false);
      console.log("Registration error:", err);
    }
  };

  // Function to handle modal close / redirect
  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    router.push("/");
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

            <InputGroup
              name="city"
              label="City"
              value={formData.city}
              onChange={handleChange}
              placeholder="Your City"
            />

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

            <SelectGroup
              name="specialties"
              label="Specialties"
              value={formData.specialties}
              onChange={handleChange}
              options={specialtiesOptions}
              placeholder="Select Specialty"
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

      {/* 4. Success Modal */}
      <Modal 
        isOpen={showSuccessModal} 
        onOpenChange={handleSuccessModalClose}
        isDismissable={false}
        hideCloseButton={true}
        placement="center"
        className="mx-4"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1 items-center text-center pt-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-2">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-xl font-bold text-gray-800">Account Created!</span>
              </ModalHeader>
              <ModalBody className="text-center px-6">
                <p className="text-gray-600 text-sm">
                  Your account has been successfully registered. Please check your email for login credentials or wait for admin approval.
                </p>
              </ModalBody>
              <ModalFooter className="pb-8 pt-4 justify-center">
                <Button 
                  className="bg-[#FFA200] text-white font-bold w-full max-w-[200px]" 
                  onPress={handleSuccessModalClose}
                >
                  Go to Login
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

    </MobileLayoutWrapper>
  );
}

// ... InputGroup and SelectGroup components remain unchanged below ...
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

interface SelectGroupProps {
  label: string;
  name: string;
  value: string;
  onChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  options: string[];
  placeholder?: string;
  disabled?: boolean;
}

const SelectGroup = ({
  label,
  name,
  value,
  onChange,
  options,
  placeholder = "Select an option",
  disabled,
}: SelectGroupProps): ReactElement => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearchTerm("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const filteredOptions = options.filter((option) =>
    option.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleSelect = (option: string) => {
    const event = {
      target: {
        name,
        value: option,
      },
    } as unknown as React.ChangeEvent<HTMLSelectElement>;
    onChange(event);
    setIsOpen(false);
    setSearchTerm("");
  };

  const onDeleteOption = undefined;
  const inputValue = isOpen ? searchTerm : value;

  return (
    <div ref={containerRef}>
      <label className="block text-gray-600 text-xs font-bold mb-1 ml-1">
        {label}
      </label>
      <div className="relative">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onClick={() => {
            if (!isOpen) {
              setIsOpen(true);
              setSearchTerm("");
            }
          }}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full bg-gray-50 border border-gray-200 text-gray-800 text-sm rounded-xl focus:ring-2 focus:ring-[#FFA200] focus:border-transparent p-3 outline-none h-[46px]"
          autoComplete="off"
        />

        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
          <svg
            className={`h-4 w-4 transition-transform duration-200 ${
              isOpen ? "rotate-180" : ""
            }`}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </div>

        {isOpen && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
            <div className="overflow-auto flex-1 max-h-48 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((option) => (
                  <div
                    key={option}
                    className={`cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-orange-50 transition-colors ${
                      value === option
                        ? "text-orange-600 bg-orange-50 font-medium"
                        : "text-gray-900"
                    }`}
                    onClick={() => handleSelect(option)}
                  >
                    <span className="block truncate">{option}</span>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-2">
                      {value === option && !onDeleteOption && (
                        <span className="flex items-center text-orange-600 mr-2">
                          <svg
                            className="h-5 w-5"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-3 px-3 text-gray-400 text-sm text-center italic">
                  {searchTerm ? "No matches found" : "No options available"}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};