"use client";
import React, { useState } from "react";
import {
  CircleFadingArrowUp,
  Package,
  MonitorUp,
  ChartSpline,
  Settings,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const SideNav = () => {
  const menuList = [
    { id: 1, name: "Dashboard", icon: CircleFadingArrowUp, link: "/dashboard" },
    { id: 2, name: "My Modules", icon: Package, link: "/module" },
    { id: 3, name: "Assignments", icon: MonitorUp, link: "/assignment" },
    { id: 4, name: "Analytics", icon: ChartSpline, link: "/analytic" },
    { id: 5, name: "Settings", icon: Settings, link: "/settings" },
  ];

  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <div className="">
      <div className="p-[10px] border-b flex justify-center items-center rounded-lg mb-3">
        <Link href="/" className="flex items-center justify-center">
          <Image
            src="/Logo.png"
            alt="Logo"
            width={56} // corresponds to "w-14" in Tailwind (14 * 4 = 56)
            height={56} // corresponds to "h-14" in Tailwind (14 * 4 = 56)
          />
          <div className="w-auto text-[#894799] text-lg font-extrabold font-['Montserrat']">
            AutoGradePro
          </div>
        </Link>
      </div>
      <div className="flex flex-col float-left w-full">
        {menuList.map((item, index) => (
          <Link
            href={item.link}
            key={item.id}
            className={`flex gap-4 p-3 pl-8 rounded-r-xl hover:bg-light-3 w-full ${
              activeIndex === index ? "bg-light-3 text-dark-1" : "text-gray-500"
            } hover:text-dark-1`}
            onClick={() => setActiveIndex(index)}
          >
            <item.icon />
            <h2>{item.name}</h2>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default SideNav;
