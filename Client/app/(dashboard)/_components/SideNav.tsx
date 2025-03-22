"use client";
import React, { useState } from "react";
import {
  CircleFadingArrowUp,
  Package,
  MonitorUp,
  Settings,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const SideNav = () => {
  const menuList = [
    { id: 1, name: "Dashboard", icon: CircleFadingArrowUp, link: "/dashboard" },
    { id: 2, name: "My Modules", icon: Package, link: "/module" },
    { id: 3, name: "Assignments", icon: MonitorUp, link: "/assignment" },
    { id: 4, name: "Settings", icon: Settings, link: "/settings" },
  ];

  const [activeIndex, setActiveIndex] = useState<number | null>(0);

  return (
    <div className="bg-white h-full border-r shadow-sm">
      <div className="p-3 border-b bg-purple-200 flex items-center justify-center">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/Logo.png" alt="Logo" width={48} height={46} />
          <span className="text-xl font-bold text-[#894799] font-montserrat tracking-wide">
            AutoGradePro
          </span>
        </Link>
      </div>
      <div className="flex flex-col mt-4">
        {menuList.map((item, index) => (
          <Link
            key={item.id}
            href={item.link}
            className={`flex items-center gap-3 py-3 px-6 mx-2 rounded-xl mb-1 transition-all ${
              activeIndex === index
                ? "bg-purple-100 text-purple-700 font-semibold shadow-sm"
                : "text-gray-600 hover:bg-gray-100 hover:text-purple-600"
            }`}
            onClick={() => setActiveIndex(index)}
          >
            <item.icon className="w-5 h-5" />
            <span>{item.name}</span>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default SideNav;
