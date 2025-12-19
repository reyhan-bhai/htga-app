interface User {
  name?: string;
  username?: string;
  email?: string;
  role?: string;
  phone?: string;
}

interface ProfileDetailsProps {
  user: User | null;
}

export const ProfileDetails: React.FC<ProfileDetailsProps> = ({ user }) => {
  return (
    <>
      
      {/* Profile Details Form */}
    <div className="w-full max-w-xs space-y-4 font-poppins">
      {/* Username Field */}
      <div>
        <label className="block text-sm text-[#A0A0A0] mb-2">Username</label>
        <input
        type="text"
        value={user?.username || "username"}
        readOnly
        className="w-full px-4 py-3 border border-[#E0E0E0] rounded-lg text-[#1B1B1B] bg-white focus:outline-none focus:ring-2 focus:ring-[#FFA200]"
        />
      </div>

      {/* Email Field */}
      <div>
        <label className="block text-sm text-[#A0A0A0] mb-2">Email</label>
        <input
        type="email"
        value={user?.email || ""}
        readOnly
        className="w-full px-4 py-3 border border-[#E0E0E0] rounded-lg text-[#1B1B1B] bg-white focus:outline-none focus:ring-2 focus:ring-[#FFA200]"
        />
      </div>

      {/* Full Name Field */}
      <div>
        <label className="block text-sm text-[#A0A0A0] mb-2">Full Name</label>
        <input
        type="text"
        value={user?.name || ""}
        readOnly
        className="w-full px-4 py-3 border border-[#E0E0E0] rounded-lg text-[#1B1B1B] bg-white focus:outline-none focus:ring-2 focus:ring-[#FFA200]"
        />
      </div>

      {/* Contact Field */}
      <div>
        <label className="block text-sm text-[#A0A0A0] mb-2">Contact</label>
        <input
        type="tel"
        value={user?.phone || "+62 86798015476"}
        readOnly
        className="w-full px-4 py-3 border border-[#E0E0E0] rounded-lg text-[#1B1B1B] bg-white focus:outline-none focus:ring-2 focus:ring-[#FFA200]"
        />
      </div>
    </div>
    </>
  );
};
