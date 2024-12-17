"use client";
import { AlignJustify } from "lucide-react";
import React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

const TopHeader = () => {
  const router = useRouter();

  // Logout function to clear tokens and redirect to the login page
  const handleLogout = () => {
    localStorage.removeItem("ACCESS_TOKEN");
    localStorage.removeItem("REFRESH_TOKEN");
    router.push("/sign-in");
  };

  return (
    <div className="flex p-[21px] border-b justify-between items-center md:justify-end">
      <AlignJustify className="md:hidden" onClick={() => {}} />
      <div className="md:hidden flex items-center justify-center">
        <Image
          src="/Logo.png"
          alt="Logo"
          width={56} // corresponds to "w-14" in Tailwind (14 * 4 = 56)
          height={56} // corresponds to "h-14" in Tailwind (14 * 4 = 56)
        />
        <div className="w-auto text-[#894799] text-lg font-extrabold font-['Montserrat']">
          AutoGradePro
        </div>
      </div>

      {/* Logout Button */}
      <button
        onClick={handleLogout}
        className="hidden md:block px-4 py-2 bg-light-2 hover:bg-light-1 text-white rounded-full"
      >
        Logout
      </button>
    </div>
  );
};

export default TopHeader;
