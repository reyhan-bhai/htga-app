"use client";
import { MobileLayoutWrapper } from "@/app/layout-wrapper";
import { useAuth } from "@/context/AuthContext";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  
  // Edit Mode State
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
  });

  // REAL-TIME SYNC: This will run whenever 'user' updates in AuthContext
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        company: user.company || "",
      });
    }
  }, [user]);

  // Password Modal State
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passForm, setPassForm] = useState({ old: "", new: "", confirm: "" });
  const [passStatus, setPassStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [passMsg, setPassMsg] = useState("");

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  const handleSaveProfile = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/user/update-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setIsEditing(false);
      } else {
        alert("Failed to update profile");
      }
    } catch (error) {
      console.error("Save error:", error);
      alert("An error occurred while saving");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleEdit = () => {
    if (isEditing) {
      handleSaveProfile();
    } else {
      setIsEditing(true);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passForm.new !== passForm.confirm) {
        setPassStatus("error");
        setPassMsg("New passwords do not match");
        return;
    }

    setPassStatus("loading");
    try {
        const res = await fetch("/api/user/change-password", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                email: user?.email, 
                oldPassword: passForm.old, 
                newPassword: passForm.new 
            }),
        });
        
        const data = await res.json();
        
        if (res.ok) {
            setPassStatus("success");
            setTimeout(() => {
                setShowPasswordModal(false);
                setPassStatus("idle");
                setPassForm({ old: "", new: "", confirm: "" });
            }, 1500);
        } else {
            setPassStatus("error");
            setPassMsg(data.error || "Failed to update password");
        }
    } catch (err) {
        setPassStatus("error");
        setPassMsg("Network error");
        console.log("Change Password Error:", err);
    }
  };

  // Helper for input styling
  // REVISI: Menggunakan bg-gray-50 saat view mode agar kontras dengan container putih
  const getInputClass = (editing: boolean) => 
    `w-full p-3 rounded-xl border transition-all outline-none text-sm font-medium ${
      editing 
        ? "border-[#FFA200] bg-white text-gray-900 shadow-sm ring-4 ring-[#FFA200]/10" // Edit: Highlighted
        : "border-transparent bg-gray-100 text-gray-600"
    }`;

  return (
    <MobileLayoutWrapper>
      <div className="min-h-screen bg-gradient-1 flex flex-col items-center">
        
        {/* Header Section */}
        <div className="w-full px-6 pt-8 pb-4 flex items-center justify-between sticky top-0 z-10 backdrop-blur-sm">
          <Link href="/" className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
          <h1 className="text-xl font-bold text-white">My Profile</h1>
          <button 
            onClick={toggleEdit}
            disabled={isLoading}
            className={`text-sm font-bold px-4 py-2 rounded-full transition-colors shadow-lg ${
                isEditing 
                ? "bg-green-500 text-white hover:bg-green-600" 
                : "bg-white text-[#FFA200] hover:bg-gray-50"
            }`}
          >
            {isLoading ? "Saving..." : (isEditing ? "Save" : "Edit")}
          </button>
        </div>

        {/* Content Card */}
        <div className="w-full flex-1 bg-gray-50 rounded-t-[2.5rem] px-6 pt-8 pb-24 mt-4 shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
            
            <div className="space-y-6">
                
                {/* Personal Details Card */}
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                    <h2 className="text-sm font-bold text-[#FFA200] uppercase tracking-wider mb-4 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                        Personal Details
                    </h2>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs text-gray-400 font-bold ml-1 uppercase mb-1 block">Full Name</label>
                            <input 
                                type="text" 
                                disabled={!isEditing}
                                value={formData.name}
                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                                className={getInputClass(isEditing)}
                            />
                        </div>
                        <div>
                            <label className="text-xs text-gray-400 font-bold ml-1 uppercase mb-1 block">Email Address</label>
                            <input 
                                type="email" 
                                disabled={true} 
                                value={formData.email}
                                className="w-full p-3 rounded-xl border border-transparent bg-gray-50 text-gray-400 cursor-not-allowed outline-none text-sm font-medium"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-gray-400 font-bold ml-1 uppercase mb-1 block">Phone Number</label>
                            <input 
                                type="tel" 
                                disabled={!isEditing}
                                value={formData.phone}
                                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                placeholder={isEditing ? "Enter phone number" : "Not set"}
                                className={getInputClass(isEditing)}
                            />
                        </div>
                        <div>
                            <label className="text-xs text-gray-400 font-bold ml-1 uppercase mb-1 block">Company</label>
                            <input 
                                type="text" 
                                disabled={!isEditing}
                                value={formData.company}
                                onChange={(e) => setFormData({...formData, company: e.target.value})}
                                placeholder={isEditing ? "Enter company name" : "Not set"}
                                className={getInputClass(isEditing)}
                            />
                        </div>
                    </div>
                </div>

                {/* Security Section */}
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                    <h2 className="text-sm font-bold text-[#FFA200] uppercase tracking-wider mb-4 flex items-center gap-2">
                         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                        Security
                    </h2>
                    <button 
                        onClick={() => setShowPasswordModal(true)}
                        className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all group border border-transparent hover:border-gray-200"
                    >
                        <div className="flex items-center gap-3">
                            <span className="font-semibold text-gray-700">Change Password</span>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-white border border-gray-100 flex items-center justify-center text-[#FFA200] group-hover:bg-[#FFA200] group-hover:text-white transition-colors shadow-sm">
                             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                        </div>
                    </button>
                </div>

                {/* Logout Button */}
                <button 
                    onClick={handleLogout}
                    className="w-full py-4 text-red-500 font-bold bg-white border border-red-100 rounded-2xl shadow-sm hover:bg-red-50 hover:border-red-200 transition-colors flex items-center justify-center gap-2"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                    Log Out
                </button>
            </div>
        </div>

        {/* Change Password Modal */}
        {showPasswordModal && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom-10 duration-300">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-gray-800">Change Password</h3>
                        <button onClick={() => setShowPasswordModal(false)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200">
                            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>

                    {passStatus === "success" ? (
                        <div className="text-center py-6">
                            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                            </div>
                            <p className="text-green-600 font-medium">Password updated successfully!</p>
                        </div>
                    ) : (
                        <form onSubmit={handleChangePassword} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1 ml-1">Current Password</label>
                                <input 
                                    type="password" 
                                    required
                                    value={passForm.old}
                                    onChange={e => setPassForm({...passForm, old: e.target.value})}
                                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#FFA200] outline-none text-gray-900"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1 ml-1">New Password</label>
                                <input 
                                    type="password" 
                                    required
                                    value={passForm.new}
                                    onChange={e => setPassForm({...passForm, new: e.target.value})}
                                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#FFA200] outline-none text-gray-900"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1 ml-1">Confirm New Password</label>
                                <input 
                                    type="password" 
                                    required
                                    value={passForm.confirm}
                                    onChange={e => setPassForm({...passForm, confirm: e.target.value})}
                                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#FFA200] outline-none text-gray-900"
                                />
                            </div>

                            {passStatus === "error" && (
                                <p className="text-red-500 text-sm text-center bg-red-50 p-2 rounded-lg">{passMsg}</p>
                            )}

                            <button 
                                type="submit" 
                                disabled={passStatus === "loading"}
                                className="w-full bg-[#FFA200] hover:bg-[#FF9500] text-white font-bold py-3.5 rounded-xl shadow-lg mt-2 transition-all"
                            >
                                {passStatus === "loading" ? "Updating..." : "Update Password"}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        )}
      </div>
    </MobileLayoutWrapper>
  );
}