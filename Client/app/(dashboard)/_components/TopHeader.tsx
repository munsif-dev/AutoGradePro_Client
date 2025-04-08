"use client";
import React, { useState, useEffect, useRef } from "react";
import { 
  AlignLeft, 
  Bell, 
  User, 
  ChevronDown, 
  Settings, 
  LogOut, 
  Search,
  Menu,
  X,
  ChevronLeft,
  UserCircle,
  HelpCircle
} from "lucide-react";
import api from "@/lib/api";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

interface TopHeaderProps {
  toggleSidebar: () => void;
  toggleMobileMenu: () => void;
  isSidebarOpen: boolean;
  isMobile: boolean;
}

const TopHeader = ({ 
  toggleSidebar, 
  toggleMobileMenu, 
  isSidebarOpen, 
  isMobile 
}: TopHeaderProps) => {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [helpModalOpen, setHelpModalOpen] = useState(false);
  const [notificationCount, setNotificationCount] = useState(2);
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>("");
  const [userEmail, setUserEmail] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  
  const router = useRouter();
  const pathname = usePathname();

  // Get page title based on current route
  const getPageTitle = () => {
    if (pathname === '/dashboard') return 'Dashboard';
    if (pathname === '/module' || pathname?.startsWith('/module/')) return 'Modules';
    if (pathname === '/assignment' || pathname?.startsWith('/assignment/')) return 'Assignments';
    if (pathname === '/settings') return 'Settings';
    return 'AutoGradePro';
  };

  // Fetch user profile data
  useEffect(() => {
    setIsLoading(true);
    api.get("/api/lecturer/details/")
      .then((response) => {
        const data = response.data;
        setProfilePicture(data.profile_picture ? 
          (data.profile_picture.startsWith('http') ? 
            data.profile_picture : 
            `${process.env.NEXT_PUBLIC_DJANGO_API_URL}${data.profile_picture}`) 
          : null);
        if (data.user) {
          const { first_name, last_name, email } = data.user;
          setUserName(`${first_name || ''} ${last_name || ''}`);
          setUserEmail(email || '');
        }
      })
      .catch((err) => {
        console.error("Failed to fetch profile details:", err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  // Add help modal ref
  const helpModalRef = useRef<HTMLDivElement>(null);
  
  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
      if (helpModalRef.current && !helpModalRef.current.contains(event.target as Node)) {
        setHelpModalOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    router.push("/sign-in");
  };

  // Sample notifications
  const notifications = [
    {
      id: 1,
      title: "New Submissions",
      message: "3 new submissions for Database Systems assignment",
      time: "10 minutes ago",
      unread: true
    },
    {
      id: 2,
      title: "Grading Complete",
      message: "All submissions for Algorithm Design have been graded",
      time: "2 hours ago",
      unread: true
    },
    {
      id: 3,
      title: "Module Added",
      message: "Successfully created Data Structures module",
      time: "Yesterday",
      unread: false
    }
  ];

  return (
    <header className="fixed top-0 right-0 left-0 z-30 bg-purple-100 shadow-sm border-b border-gray-200 h-16 transition-all duration-300"
      style={{ 
        left: isMobile ? '0' : (isSidebarOpen ? '16rem' : '5rem') 
      }}
    >
      <div className="flex h-full px-4 justify-between items-center">
        {/* Left section with toggle and title */}
        <div className="flex items-center gap-3">
          {isMobile ? (
            <button 
              onClick={toggleMobileMenu}
              className="p-2 rounded-lg text-gray-500 hover:bg-purple-100 hover:text-light-2 transition-colors"
            >
              <Menu size={24} />
            </button>
          ) : (
            <button 
              onClick={toggleSidebar}
              className="p-2 rounded-lg text-gray-500 hover:bg-purple-100 hover:text-light-2 transition-colors"
              title={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
            >
              {isSidebarOpen ? <ChevronLeft size={22} /> : <AlignLeft size={22} />}
            </button>
          )}
          
          <h1 className="text-xl font-semibold text-gray-800 ml-1">
            {getPageTitle()}
          </h1>
        </div>

        {/* Right section with notifications and profile */}
        <div className="flex items-center gap-1 md:gap-3">
          {/* Help Button with Information */}
          <div className="relative">
            <button 
              onClick={() => setHelpModalOpen(!helpModalOpen)}
              className="p-2 rounded-lg text-gray-500 hover:bg-purple-100 hover:text-light-2 transition-colors"
              aria-label="Help"
            >
              <HelpCircle size={22} />
            </button>
            
            {/* Help Modal/Tooltip */}
            <AnimatePresence>
              {helpModalOpen && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg z-50 border border-gray-200 p-4"
                >
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-semibold text-gray-800">Help & Information</h3>
                    <button 
                      onClick={() => setHelpModalOpen(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X size={16} />
                    </button>
                  </div>
                  
                  <div className="text-sm text-gray-600 space-y-3">
                    <p className="font-medium text-light-2">Quick Tips:</p>
                    <ul className="space-y-2 list-disc pl-5">
                      <li>Create modules for your courses from the Modules page</li>
                      <li>Set up assignments for each module with the + button</li>
                      <li>Upload answer scripts for auto-grading</li>
                      <li>View detailed reports and analytics from each assignment</li>
                      <li>Configure marking schemes to customize the grading process</li>
                    </ul>
                    
                    <p className="pt-2 border-t border-gray-100 mt-3">
                      Need more help? Contact support at <span className="text-light-2 font-medium">support@autogradepro.com</span>
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          {/* Notifications */}
          <div className="relative" ref={notificationsRef}>
            {/* <button 
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className="relative p-2 rounded-lg text-gray-500 hover:bg-purple-100 hover:text-light-2 transition-colors"
            >
              <Bell size={22} />
              {notificationCount > 0 && (
                <span className="absolute top-1 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white">
                  {notificationCount}
                </span>
              )}
            </button> */}
            
            {/* Notifications Dropdown */}
            {/* <AnimatePresence>
              {notificationsOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg py-2 z-50 border border-gray-200"
                >
                  <div className="px-4 py-2 border-b border-gray-100">
                    <div className="flex justify-between items-center">
                      <h3 className="font-semibold text-gray-700">Notifications</h3>
                      <button className="text-xs text-purple-600 hover:text-purple-800 font-medium">
                        Mark all as read
                      </button>
                    </div>
                  </div>
                  
                  <div className="max-h-[320px] overflow-y-auto">
                    {notifications.length > 0 ? (
                      notifications.map((notification) => (
                        <div 
                          key={notification.id}
                          className={`px-4 py-3 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors ${
                            notification.unread ? 'bg-purple-50' : ''
                          }`}
                        >
                          <div className="flex items-start">
                            <div className={`flex-shrink-0 w-2 h-2 mt-2 rounded-full ${
                              notification.unread ? 'bg-purple-500' : 'bg-gray-300'
                            }`} />
                            <div className="ml-3">
                              <p className="text-sm font-medium text-gray-800">{notification.title}</p>
                              <p className="text-xs text-gray-500 mt-1">{notification.message}</p>
                              <p className="text-xs text-gray-400 mt-1">{notification.time}</p>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="px-4 py-6 text-center">
                        <p className="text-gray-500 text-sm">No notifications</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="px-4 py-2 border-t border-gray-100">
                    <button className="w-full text-center text-sm text-purple-600 hover:text-purple-800 font-medium">
                      View all notifications
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence> */}
          </div>
          
          {/* User Profile Menu */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 ml-1 p-1.5 rounded-lg hover:bg-purple-100 transition-colors"
              aria-expanded={userMenuOpen}
            >
              <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center border-2 border-light-3">
                {isLoading ? (
                  <div className="animate-pulse bg-gray-300 w-full h-full" />
                ) : profilePicture ? (
                  <Image
                    src={profilePicture}
                    alt="Profile"
                    width={32}
                    height={32}
                    className="object-cover"
                  />
                ) : (
                  <UserCircle className="w-6 h-6 text-gray-500" />
                )}
              </div>
              <span className="hidden md:block text-sm font-medium text-gray-700 max-w-[100px] truncate">
                {userName || 'User'}
              </span>
              <ChevronDown className="w-4 h-4 text-gray-500" />
            </button>
            
            {/* User Menu Dropdown */}
            <AnimatePresence>
              {userMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg py-2 z-50 border border-gray-200"
                >
                  {/* User Info */}
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-sm font-semibold text-gray-800">{userName || 'User'}</p>
                    <p className="text-xs text-gray-500 mt-1 truncate">{userEmail || 'user@example.com'}</p>
                  </div>
                  
                  {/* Menu Items */}
                  <div className="py-1">
                    <button
                      onClick={() => {
                        router.push('/settings');
                        setUserMenuOpen(false);
                      }}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-purple-50 hover:text-light-2"
                    >
                      <Settings className="w-4 h-4 mr-3" />
                      Account Settings
                    </button>
                    
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <LogOut className="w-4 h-4 mr-3" />
                      Logout
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
};

export default TopHeader;