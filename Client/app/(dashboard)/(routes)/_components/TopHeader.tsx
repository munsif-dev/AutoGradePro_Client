import { AlignJustify, User } from "lucide-react";
import React from "react";
import Image from "next/image";

const TopHeader = () => {
  return (
    <div className="flex p-[21px] border-b justify-between items-center  md:justify-end">
      <AlignJustify className="md:hidden" onClick={() => {}} />
      <div className="md:hidden flex items-center justify-center">
        <Image
          src="/Logo.png"
          alt="Logo"
          width={56} // corresponds to "w-14" in Tailwind (14 * 4 = 56)
          height={56} // corresponds to "h-14" in Tailwind (14 * 4 = 56)
        />
        <div className="w-auto  text-[#894799] text-lg font-extrabold font-['Montserrat']">
          AutoGradePro
        </div>
      </div>
      <div className="m-0 p-0"></div>
    </div>
  );
};

export default TopHeader;
