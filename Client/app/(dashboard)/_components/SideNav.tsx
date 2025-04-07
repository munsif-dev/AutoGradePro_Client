"use client";
import React from "react";
import {
  Home,
  Book,
  FileText,
  Settings,
  LogOut,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";

interface SideNavProps {
  isCollapsed?: boolean;
  isMobile?: boolean;
  closeMobileMenu?: () => void;
}

const SideNav = ({ isCollapsed = false, isMobile = false, closeMobileMenu }: SideNavProps) => {
  const router = useRouter();
  const pathname = usePathname();
  
  const menuItems = [
    { id: 1, name: "Dashboard", icon: Home, link: "/dashboard" },
    { id: 2, name: "My Modules", icon: Book, link: "/module" },
    { id: 3, name: "Assignments", icon: FileText, link: "/assignment" },
    { id: 4, name: "Settings", icon: Settings, link: "/settings" },
  ];

  // Determine active menu item based on current path
  const getIsActive = (path: string) => {
    if (path === '/dashboard' && pathname === '/dashboard') return true;
    // Check if path is included in pathname (for nested routes)
    if (path !== '/dashboard' && pathname?.includes(path)) return true;
    return false;
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    router.push("/sign-in");
  };

  return (
    <div className="flex flex-col h-full bg-purple-200 shadow-md">
      {/* Logo Header */}
      <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} py-4 px-4 border-b border-gray-300`}>
        <Link href="/" className={`flex items-center gap-2 ${isCollapsed ? 'justify-center' : ''}`}>
          <div className="relative flex-shrink-0">
            <Image 
              src="/Logo.png" 
              alt="Logo" 
              width={isCollapsed ? 32 : 28} 
              height={isCollapsed ? 32 : 28} 
              className="object-contain"
            />
          </div>
          {!isCollapsed && (
            <span className="text-base font-semibold text-[#894799] tracking-wide">
              AutoGradePro
            </span>
          )}
        </Link>
        
        {/* Mobile close button */}
        {isMobile && (
          <button 
            onClick={closeMobileMenu} 
            className="p-1 rounded-full hover:bg-purple-50 text-gray-500 transition-colors"
          >
            <X size={18} />
          </button>
        )}
      </div>
      
      {/* Navigation Menu */}
      <div className="flex flex-col flex-grow py-6 overflow-y-auto scrollbar-thin px-3">
        <div className="space-y-1.5">
          {menuItems.map((item) => {
            const isActive = getIsActive(item.link);
            
            return (
              <Link
                key={item.id}
                href={item.link}
                onClick={isMobile && closeMobileMenu ? closeMobileMenu : undefined}
                className={`flex items-center ${
                  isCollapsed ? 'justify-center' : 'justify-between'
                } py-2 px-3 rounded-lg transition-all duration-200 group ${
                  isActive
                    ? "bg-purple-50 text-light-2"
                    : "text-gray-600 hover:bg-purple-50 hover:text-light-2"
                }`}
              >
                <div className={`flex items-center ${isCollapsed ? '' : 'gap-3'}`}>
                  <div className={`
                    ${isActive ? "text-light-2" : "text-gray-500 group-hover:text-light-2"}
                    ${isCollapsed ? 'p-1' : ''}
                    transition-colors
                  `}>
                    <item.icon className={`${isCollapsed ? 'w-5 h-5' : 'w-4.5 h-4.5'}`} />
                  </div>
                  
                  {!isCollapsed && (
                    <span className={`font-medium text-sm ${isActive ? "text-light-2" : "text-gray-600 group-hover:text-light-2"}`}>
                      {item.name}
                    </span>
                  )}
                </div>
                
                {!isCollapsed && isActive && (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-1 h-5 rounded-full bg-light-2"
                  />
                )}
              </Link>
            );
          })}
        </div>
        
        {/* Bottom Logout Button */}
        <div className="mt-auto pt-6 border-t border-gray-100 mx-1">
          <button
            onClick={handleLogout}
            className={`flex items-center ${
              isCollapsed ? 'justify-center' : ''
            } w-full py-2 px-3 text-red-500 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors`}
          >
            <LogOut className={`${isCollapsed ? 'w-5 h-5' : 'w-4.5 h-4.5'}`} />
            {!isCollapsed && <span className="ml-3 font-medium text-sm">Logout</span>}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SideNav;