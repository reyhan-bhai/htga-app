"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { MdAdd, MdClose, MdKeyboardArrowDown, MdSearch } from "react-icons/md";

interface AdminSearchableSelectProps {
  name: string;
  label: string;
  value: string;
  onChange: (e: { target: { name: string; value: string } }) => void;
  options?: string[];
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  onDeleteOption?: (option: string) => void;
}

export default function AdminSearchableSelect({
  name,
  label,
  value,
  onChange,
  options = [],
  placeholder,
  disabled = false,
  required = false,
  onDeleteOption,
}: AdminSearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter options based on search term
  const filteredOptions = useMemo(() => {
    return (options || []).filter((option) =>
      option.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [options, searchTerm]);

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // When dropdown opens, focus search input
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSelect = (option: string) => {
    onChange({ target: { name, value: option } });
    setIsOpen(false);
    setSearchTerm("");
  };

  const handleAddNew = () => {
    if (searchTerm.trim()) {
      onChange({ target: { name, value: searchTerm.trim() } });
      setIsOpen(false);
      setSearchTerm("");
    } else {
      // If no search term, maybe focus input
      inputRef.current?.focus();
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>

      {/* Trigger Button */}
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full px-3 py-2 border rounded-md bg-white text-left flex items-center justify-between cursor-pointer ${
          disabled
            ? "bg-gray-100 text-gray-600 cursor-not-allowed"
            : "cursor-pointer focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
        } ${value ? "text-gray-900" : "text-gray-500"} border-gray-300`}
      >
        <span className="block truncate">
          {value || placeholder || `Select ${label}`}
        </span>
        <MdKeyboardArrowDown className="h-5 w-5 text-gray-500" />
      </div>

      {/* Hidden input for native form validation compatibility */}
      <input
        type="hidden"
        name={name}
        value={value || ""}
        required={required}
      />

      {/* Dropdown */}
      {isOpen && !disabled && (
        <div className="absolute z-50 mt-1 w-full bg-white shadow-xl max-h-80 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-hidden flex flex-col">
          {/* Search Header */}
          <div className="p-2 border-b border-gray-100 flex items-center bg-white sticky top-0 z-10">
            <MdSearch className="text-gray-400 mr-2 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              className="w-full outline-none text-sm text-gray-700 placeholder-gray-400 bg-transparent"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoComplete="off"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (filteredOptions.length === 1) {
                    handleSelect(filteredOptions[0]);
                  } else if (
                    filteredOptions.length === 0 &&
                    searchTerm.trim()
                  ) {
                    handleAddNew();
                  }
                }
              }}
            />
          </div>

          {/* Options List */}
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
                    {onDeleteOption && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          onDeleteOption(option);
                        }}
                        className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors z-20"
                        title="Delete option"
                      >
                        <MdClose size={18} />
                      </button>
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

          {/* Sticky Add Button */}
          <div className="border-t border-gray-100 p-2 bg-gray-50 flex-none z-10">
            <button
              type="button"
              onClick={handleAddNew}
              className="flex items-center justify-center w-full px-3 py-2 text-sm font-medium text-white bg-orange-500 rounded-md hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors shadow-sm"
            >
              <MdAdd className="mr-1 h-5 w-5" />
              Add {searchTerm ? `"${searchTerm}"` : "New Item"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
