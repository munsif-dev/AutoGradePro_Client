"use client";
import { AlignJustify, Bell, User } from "lucide-react";
import React from "react";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@radix-ui/react-dropdown-menu";

const TopHeader = () => {
  const router = useRouter();
  const [profilePicture, setProfilePicture] = useState(null);

  // Fetch profile picture on component mount
  useEffect(() => {
    api
      .get("/api/lecturer/details/") // This should be the endpoint where you fetch the lecturer details
      .then((response) => {
        setProfilePicture(response.data.profile_picture); // Assuming the profile picture URL is part of the response
        console.log("Profile picture fetched successfully");
      })
      .catch((err) => {
        console.error("Failed to fetch profile picture:", err);
      });
  }, []);

  // Logout function to clear tokens and redirect to the login page
  const handleLogout = () => {
    localStorage.removeItem("ACCESS_TOKEN");
    localStorage.removeItem("REFRESH_TOKEN");
    router.push("/sign-in");
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50 md:ml-[256px] bg-purple-200   ">
      <div className="flex p-4 border-b justify-between items-center md:justify-end">
        {/* Sidebar Toggle (Visible on Mobile) */}
        <AlignJustify className="md:hidden text-dark-1 cursor-pointer hover:text-light-2" />

        {/* Logo (Visible on Mobile) */}
        <div className="md:hidden flex items-center">
          <Image
            src="/Logo.png"
            alt="Logo"
            width={48}
            height={48}
            className="mr-2"
          />
          <div className="text-[#894799] text-lg font-extrabold font-['Montserrat']">
            AutoGradePro
          </div>
        </div>

        <div className="flex items-center gap-6">
          {/* Notification Icon */}

          {/* Profile Icon with Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger>
              <div className="w-10 h-10 bg-light-2 rounded-full flex items-center justify-center cursor-pointer shadow-md hover:shadow-lg transition-transform transform hover:scale-105">
                {profilePicture ? (
                  <Image
                    src={profilePicture}
                    alt="Profile"
                    width={40}
                    height={40}
                    className="rounded-full object-cover"
                  />
                ) : (
                  <User className="w-6 h-6 text-white" />
                )}
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="bg-white rounded-md shadow-lg py-2 w-40"
            >
              <DropdownMenuItem
                onClick={() => router.push("/settings")}
                className="px-4 py-2 text-sm text-gray-700 hover:bg-light-2 hover:text-white rounded transition"
              >
                Account
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleLogout}
                className="px-4 py-2 text-sm text-gray-700 hover:bg-light-2 hover:text-white rounded transition"
              >
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
};

export default TopHeader;
