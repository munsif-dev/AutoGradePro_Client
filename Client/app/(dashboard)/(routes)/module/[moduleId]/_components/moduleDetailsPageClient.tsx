"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Plus, 
  Book, 
  Search, 
  Loader2, 
  Trash2, 
  Edit, 
  BookOpen, 
  Calendar, 
  FileText,
  SortAsc,
  SortDesc,
  Filter,
  X,
  Grid,
  List,
  Clock,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  AlertCircle,
  Info,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import api from "@/lib/api";
import ProtectedRoute from "@/app/_components/ProtectedRoutes";
import BackButton from "@/app/(dashboard)/_components/BackButton";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { motion, AnimatePresence } from "framer-motion";

interface Assignment {
  id: number;
  title: string;
  description?: string;
  due_date: string;
  created_at?: string;
}

interface ModuleDetails {
  id: number;
  name: string;
  code: string;
  description?: string;
  lecturer: {
    id: number;
  };
}

const ModuleDetailsPageClient = ({ moduleId }: { moduleId: string }) => {
  // State variables
  const [module, setModule] = useState<ModuleDetails | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filteredAssignments, setFilteredAssignments] = useState<Assignment[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<"title" | "due_date" | "created_at">("due_date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  const [showModuleDetails, setShowModuleDetails] = useState(true);

  const router = useRouter();

  // Fetch data on component mount
  useEffect(() => {
    fetchModuleDetails();
    fetchAssignments();
  }, [moduleId]);

  // Apply filters and sorting when dependencies change
  useEffect(() => {
    if (searchTerm || sortField || sortDirection || selectedFilter) {
      let result = [...assignments];
      
      // Apply search filter
      if (searchTerm) {
        result = result.filter(
          (assignment) =>
            assignment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (assignment.description &&
              assignment.description.toLowerCase().includes(searchTerm.toLowerCase()))
        );
      }
      
      // Apply status filter
      if (selectedFilter) {
        const now = new Date();
        
        if (selectedFilter === "upcoming") {
          result = result.filter(assignment => new Date(assignment.due_date) > now);
        } else if (selectedFilter === "past") {
          result = result.filter(assignment => new Date(assignment.due_date) < now);
        } else if (selectedFilter === "today") {
          const today = new Date(now.setHours(0, 0, 0, 0));
          const tomorrow = new Date(today);
          tomorrow.setDate(tomorrow.getDate() + 1);
          
          result = result.filter(assignment => {
            const dueDate = new Date(assignment.due_date);
            return dueDate >= today && dueDate < tomorrow;
          });
        }
      }
      
      // Apply sorting
      result = sortAssignments(result);
      
      setFilteredAssignments(result);
    } else {
      setFilteredAssignments(sortAssignments([...assignments]));
    }
  }, [searchTerm, assignments, sortField, sortDirection, selectedFilter]);

  // Fetch module details from API
  const fetchModuleDetails = () => {
    setIsLoading(true);
    api
      .get(`/api/module/${moduleId}/`)
      .then((res) => {
        setModule(res.data);
        setIsLoading(false);
      })
      .catch((err) => {
        toast.error("Failed to fetch module details: " + err);
        setIsLoading(false);
      });
  };

  // Fetch assignments from API
  const fetchAssignments = () => {
    setIsLoading(true);
    api
      .get(`/api/assignment/list/`, { params: { module_id: moduleId } })
      .then((res) => {
        setAssignments(res.data);
        setFilteredAssignments(sortAssignments(res.data));
        setIsLoading(false);
      })
      .catch((err) => {
        toast.error("Failed to fetch assignments: " + err);
        setIsLoading(false);
      });
  };

  // Sort assignments based on field and direction
  const sortAssignments = (assignmentsToSort: Assignment[]) => {
    return [...assignmentsToSort].sort((a, b) => {
      let comparison = 0;
      
      switch (sortField) {
        case "title":
          comparison = a.title.localeCompare(b.title);
          break;
        case "due_date":
          comparison = new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
          break;
        case "created_at":
          comparison = new Date(a.created_at || "").getTime() - new Date(b.created_at || "").getTime();
          break;
        default:
          comparison = new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      }
      
      return sortDirection === "asc" ? comparison : -comparison;
    });
  };

  // Handle sort column click
  const handleSort = (field: "title" | "due_date" | "created_at") => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Delete an assignment
  const deleteAssignment = (id: number) => {
    const isConfirmed = window.confirm(
      "Are you sure you want to delete this assignment?"
    );

    if (isConfirmed) {
      setIsDeleting(id);
      api
        .delete(`/api/assignment/delete/${id}/`)
        .then((res) => {
          if (res.status === 204) {
            toast.success("Assignment deleted successfully!");
            fetchAssignments();
          } else {
            toast.error("Failed to delete assignment.");
          }
        })
        .catch((err) => {
          toast.error("Error deleting assignment: " + err);
        })
        .finally(() => {
          setIsDeleting(null);
        });
    }
  };

  // Navigate to create assignment page
  const handleCreateAssignment = () => {
    router.push(`/module/${moduleId}/create-assignment`);
  };

  // Navigate to edit assignment page
  const handleEditAssignment = (id: number) => {
    router.push(`/module/${moduleId}/edit-assignment/${id}`);
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "short",
      day: "numeric"
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Format time for display
  const formatTime = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      hour: "2-digit",
      minute: "2-digit"
    };
    return new Date(dateString).toLocaleTimeString(undefined, options);
  };

  // Get due date status (overdue, due soon, upcoming)
  const getDueDateStatus = (dueDate: string) => {
    const now = new Date();
    const due = new Date(dueDate);
    const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return { label: "Overdue", class: "bg-red-100 text-red-700", icon: <AlertCircle className="w-3 h-3 mr-1" /> };
    if (diffDays === 0) return { label: "Due today", class: "bg-orange-100 text-orange-700", icon: <Clock className="w-3 h-3 mr-1" /> };
    if (diffDays <= 3) return { label: `Due in ${diffDays} day${diffDays > 1 ? 's' : ''}`, class: "bg-yellow-100 text-yellow-700", icon: <Calendar className="w-3 h-3 mr-1" /> };
    return { label: "Upcoming", class: "bg-green-100 text-green-800", icon: <CalendarDays className="w-3 h-3 mr-1" /> };
  };

  // Get sort indicator icon
  const getSortIcon = (field: "title" | "due_date" | "created_at") => {
    if (sortField !== field) return null;
    return sortDirection === "asc" ? (
      <SortAsc className="w-4 h-4 ml-1" />
    ) : (
      <SortDesc className="w-4 h-4 ml-1" />
    );
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm("");
    setSelectedFilter(null);
    setSortField("due_date");
    setSortDirection("asc");
  };

  // Get active filter count
  const getActiveFilterCount = () => {
    let count = 0;
    if (searchTerm) count++;
    if (selectedFilter) count++;
    if (sortField !== "due_date" || sortDirection !== "asc") count++;
    return count;
  };

  // Function to create skeleton loaders for loading state
  const renderSkeletons = () => {
    return Array(3)
      .fill(0)
      .map((_, idx) => (
        <div key={idx} className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-gray-200"></div>
            <div className="flex-1">
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-3"></div>
              <div className="h-3 bg-gray-200 rounded w-full mb-1"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </div>
            <div className="flex gap-2">
              <div className="w-16 h-8 bg-gray-200 rounded-full"></div>
              <div className="w-16 h-8 bg-gray-200 rounded-full"></div>
              <div className="w-16 h-8 bg-gray-200 rounded-full"></div>
            </div>
          </div>
        </div>
      ));
  };

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen flex-col bg-purple-100">
        {/* Top Navigation Bar */}
        <div className="sticky top-0 z-10 bg-white shadow-md p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <BackButton />
            <h1 className="text-2xl pl-6 font-bold text-dark-1 hidden md:block">
              {module?.name || "Module Details"}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Search Box */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search assignments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-9 py-2 border border-gray-300 rounded-full w-48 md:w-60 focus:outline-none focus:ring-2 focus:ring-light-2 focus:border-transparent"
              />
              <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Filter Button */}
            <div className="relative">
              <button
                onClick={() => setFilterMenuOpen(!filterMenuOpen)}
                className={`p-2.5 rounded-full ${
                  getActiveFilterCount() > 0
                    ? "bg-light-2 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                } transition-colors relative`}
                aria-label="Filter options"
              >
                <Filter className="w-5 h-5" />
                {getActiveFilterCount() > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 flex items-center justify-center rounded-full">
                    {getActiveFilterCount()}
                  </span>
                )}
              </button>

              {/* Filter Dropdown */}
              <AnimatePresence>
                {filterMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 mt-2 w-60 bg-white rounded-lg shadow-lg p-2 z-20 border border-gray-200"
                  >
                    <div className="p-2 border-b border-gray-100">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-gray-700">Sort by</h3>
                        <button 
                          onClick={clearFilters}
                          className="text-xs text-purple-600 hover:text-purple-800"
                        >
                          Reset all
                        </button>
                      </div>
                    </div>
                    <div className="p-2 space-y-1">
                      <button
                        onClick={() => handleSort("title")}
                        className={`flex items-center justify-between w-full p-2 rounded-md text-sm ${
                          sortField === "title" ? "bg-purple-50 text-purple-600" : "hover:bg-gray-50 text-gray-700"
                        }`}
                      >
                        <span>Assignment title</span>
                        {sortField === "title" && (
                          <span>{sortDirection === "asc" ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}</span>
                        )}
                      </button>
                      <button
                        onClick={() => handleSort("due_date")}
                        className={`flex items-center justify-between w-full p-2 rounded-md text-sm ${
                          sortField === "due_date" ? "bg-purple-50 text-purple-600" : "hover:bg-gray-50 text-gray-700"
                        }`}
                      >
                        <span>Due date</span>
                        {sortField === "due_date" && (
                          <span>{sortDirection === "asc" ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}</span>
                        )}
                      </button>
                      <button
                        onClick={() => handleSort("created_at")}
                        className={`flex items-center justify-between w-full p-2 rounded-md text-sm ${
                          sortField === "created_at" ? "bg-purple-50 text-purple-600" : "hover:bg-gray-50 text-gray-700"
                        }`}
                      >
                        <span>Date created</span>
                        {sortField === "created_at" && (
                          <span>{sortDirection === "asc" ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}</span>
                        )}
                      </button>
                    </div>
                    <div className="p-2 border-t border-gray-100">
                      <h3 className="font-medium text-gray-700 mb-1">Status filter</h3>
                      <div className="space-y-1">
                        <button
                          onClick={() => setSelectedFilter(selectedFilter === "upcoming" ? null : "upcoming")}
                          className={`flex items-center justify-between w-full p-2 rounded-md text-sm ${
                            selectedFilter === "upcoming" ? "bg-purple-50 text-purple-600" : "hover:bg-gray-50 text-gray-700"
                          }`}
                        >
                          <span>Upcoming assignments</span>
                          {selectedFilter === "upcoming" && (
                            <CheckCircle2 className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => setSelectedFilter(selectedFilter === "past" ? null : "past")}
                          className={`flex items-center justify-between w-full p-2 rounded-md text-sm ${
                            selectedFilter === "past" ? "bg-purple-50 text-purple-600" : "hover:bg-gray-50 text-gray-700"
                          }`}
                        >
                          <span>Past due date</span>
                          {selectedFilter === "past" && (
                            <CheckCircle2 className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => setSelectedFilter(selectedFilter === "today" ? null : "today")}
                          className={`flex items-center justify-between w-full p-2 rounded-md text-sm ${
                            selectedFilter === "today" ? "bg-purple-50 text-purple-600" : "hover:bg-gray-50 text-gray-700"
                          }`}
                        >
                          <span>Due today</span>
                          {selectedFilter === "today" && (
                            <CheckCircle2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                    
                    {/* View options */}
                    <div className="p-2 border-t border-gray-100">
                      <h3 className="font-medium text-gray-700 mb-1">View</h3>
                      <div className="flex justify-between">
                        <button
                          onClick={() => setViewMode("list")}
                          className={`flex items-center justify-center p-2 rounded-md text-sm flex-1 ${
                            viewMode === "list" ? "bg-purple-50 text-purple-600" : "hover:bg-gray-50 text-gray-700"
                          }`}
                        >
                          <List className="w-4 h-4 mr-1" />
                          <span>List</span>
                        </button>
                        <button
                          onClick={() => setViewMode("grid")}
                          className={`flex items-center justify-center p-2 rounded-md text-sm flex-1 ${
                            viewMode === "grid" ? "bg-purple-50 text-purple-600" : "hover:bg-gray-50 text-gray-700"
                          }`}
                        >
                          <Grid className="w-4 h-4 mr-1" />
                          <span>Grid</span>
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* View Mode Toggle - For Larger Screens */}
            <div className="hidden md:flex items-center gap-1 bg-gray-100 p-1 rounded-md">
              <button
                onClick={() => setViewMode("list")}
                className={`p-1.5 rounded ${
                  viewMode === "list" ? "bg-white shadow-sm" : "text-gray-600 hover:bg-gray-200"
                }`}
                aria-label="List view"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded ${
                  viewMode === "grid" ? "bg-white shadow-sm" : "text-gray-600 hover:bg-gray-200"
                }`}
                aria-label="Grid view"
              >
                <Grid className="w-4 h-4" />
              </button>
            </div>

            {/* Create Assignment Button */}
            <button
              onClick={handleCreateAssignment}
              className="flex items-center gap-2 px-5 py-2 bg-light-2 text-white rounded-full shadow-md hover:bg-light-1 transition ease-in-out duration-300 transform hover:scale-105"
            >
              <Plus className="w-5 h-5" />
              <span className="hidden md:inline">Create Assignment</span>
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-grow container mx-auto p-6 md:p-8">
          {/* Header for Mobile */}
          <div className="flex justify-between items-center mb-6 md:hidden">
            <h1 className="text-2xl font-bold text-dark-1">
              {module?.name || "Module"} <span className="text-light-2">Details</span>
            </h1>
            
            {/* Active Filters Pills */}
            {getActiveFilterCount() > 0 && (
              <button
                onClick={clearFilters}
                className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full flex items-center"
              >
                Clear filters
                <X className="w-3 h-3 ml-1" />
              </button>
            )}
          </div>

          {/* Module Info with Toggle */}
          {module && (
            <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-light-2 mb-8">
              <div className="flex justify-between items-start mb-2">
                <h2 className="text-xl font-semibold text-dark-1">Module Information</h2>
                <button 
                  onClick={() => setShowModuleDetails(!showModuleDetails)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  {showModuleDetails ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </button>
              </div>
              
              <AnimatePresence>
                {showModuleDetails && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="flex flex-col md:flex-row justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <div className="p-2 bg-purple-100 rounded-lg">
                            <Book className="w-5 h-5 text-light-2" />
                          </div>
                          <span className="px-3 py-1 bg-gray-100 rounded-full text-sm font-medium text-gray-700">
                            {module.code}
                          </span>
                        </div>
                        {module.description && (
                          <p className="text-base text-gray-500 mt-4 max-w-2xl">
                            {module.description}
                          </p>
                        )}
                      </div>
                      <div className="mt-4 md:mt-0 flex items-center">
                        <div className="p-3 bg-purple-100 rounded-full">
                          <BookOpen className="w-8 h-8 text-light-2" />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Active Filters Section - Desktop */}
          {getActiveFilterCount() > 0 && (
            <div className="hidden md:flex items-center mb-4 bg-purple-50 rounded-lg p-2 border border-purple-100">
              <span className="text-sm text-gray-600 font-medium mr-2">Active filters:</span>
              
              {searchTerm && (
                <span className="bg-white text-purple-700 text-xs px-3 py-1 rounded-full border border-purple-200 flex items-center mr-2">
                  Search: "{searchTerm}"
                  <button onClick={() => setSearchTerm("")} className="ml-1 text-gray-400 hover:text-gray-600">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              
              {selectedFilter && (
                <span className="bg-white text-purple-700 text-xs px-3 py-1 rounded-full border border-purple-200 flex items-center mr-2">
                  {selectedFilter === "upcoming" 
                    ? "Upcoming assignments" 
                    : selectedFilter === "past" 
                    ? "Past due date" 
                    : "Due today"}
                  <button onClick={() => setSelectedFilter(null)} className="ml-1 text-gray-400 hover:text-gray-600">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              
              {(sortField !== "due_date" || sortDirection !== "asc") && (
                <span className="bg-white text-purple-700 text-xs px-3 py-1 rounded-full border border-purple-200 flex items-center mr-2">
                  Sort: {sortField === "title" ? "Title" : sortField === "due_date" ? "Due date" : "Date created"} ({sortDirection === "asc" ? "A-Z" : "Z-A"})
                  <button 
                    onClick={() => {
                      setSortField("due_date");
                      setSortDirection("asc");
                    }} 
                    className="ml-1 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              
              <button
                onClick={clearFilters}
                className="ml-auto text-xs px-3 py-1 text-purple-700 hover:bg-white hover:shadow-sm rounded-md transition-all"
              >
                Clear all filters
              </button>
            </div>
          )}

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-light-2 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Total Assignments</p>
                  <h3 className="text-2xl font-bold text-dark-1">
                    {assignments.length}
                  </h3>
                  {!isLoading && (
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-500">
                        {filteredAssignments.length !== assignments.length && 
                          `Showing ${filteredAssignments.length} of ${assignments.length}`
                        }
                      </span>
                    </div>
                  )}
                </div>
                <div className="p-3 bg-purple-100 rounded-full">
                  <FileText className="w-6 h-6 text-light-2" />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-purple-300 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Next Due Date</p>
                  <h3 className="text-xl font-bold text-dark-1">
                    {assignments.length > 0
                      ? (() => {
                          const now = new Date();
                          const upcomingAssignments = assignments
                            .filter(a => new Date(a.due_date) >= now)
                            .sort((a, b) => 
                              new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
                            );
                          
                          if (upcomingAssignments.length > 0) {
                            return formatDate(upcomingAssignments[0].due_date);
                          } else {
                            return "No upcoming deadlines";
                          }
                        })()
                      : "No assignments"}
                  </h3>
                  {assignments.length > 0 && (
                    <div className="flex items-center mt-1">
                      <span className="text-xs text-gray-500">
                        {(() => {
                          const now = new Date();
                          const upcomingAssignments = assignments
                            .filter(a => new Date(a.due_date) >= now)
                            .sort((a, b) => 
                              new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
                            );
                          
                          if (upcomingAssignments.length > 0) {
                            const dueTime = formatTime(upcomingAssignments[0].due_date);
                            return dueTime;
                          }
                          return "";
                        })()}
                      </span>
                    </div>
                  )}
                </div>
                <div className="p-3 bg-purple-50 rounded-full">
                  <Calendar className="w-6 h-6 text-light-2" />
                </div>
              </div>
            </div>
          </div>

          {/* Assignments Section */}
          <div className="bg-white shadow-md rounded-xl p-6 md:p-8">
            {/* Header with Title and Sort Options */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-dark-1 flex items-center gap-3">
                <FileText className="w-6 h-6 text-light-2" />
                Assignments List
                <span className="text-sm font-normal text-gray-500">
                  ({filteredAssignments.length} of {assignments.length})
                </span>
              </h2>
              
              {/* Sort Buttons - Desktop */}
              <div className="hidden md:flex items-center gap-2 text-sm">
                <span className="text-gray-500">Sort by:</span>
                <button
                  onClick={() => handleSort("title")}
                  className={`flex items-center px-2 py-1 rounded hover:bg-purple-50 ${
                    sortField === "title" ? "text-purple-600 font-medium" : "text-gray-600"
                  }`}
                >
                  Title {getSortIcon("title")}
                </button>
                <button
                  onClick={() => handleSort("due_date")}
                  className={`flex items-center px-2 py-1 rounded hover:bg-purple-50 ${
                    sortField === "due_date" ? "text-purple-600 font-medium" : "text-gray-600"
                  }`}
                >
                  Due date {getSortIcon("due_date")}
                </button>
              </div>
            </div>

            {/* Loading State */}
            {isLoading ? (
              <div className="space-y-4">
                {renderSkeletons()}
              </div>
            ) : filteredAssignments.length === 0 ? (
              <div className="text-center py-16 bg-purple-50 rounded-xl border border-dashed border-purple-200">
                {searchTerm || selectedFilter ? (
                  <>
                    <div className="mx-auto w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                      <Search className="w-8 h-8 text-light-2" />
                    </div>
                    <p className="text-gray-500 text-lg mb-2">
                      No assignments match your search or filters
                    </p>
                    <p className="text-gray-400">
                      Try different keywords or clear your filters
                    </p>
                    <button
                      onClick={clearFilters}
                      className="mt-4 px-4 py-2 text-light-2 border border-light-2 rounded-full text-sm hover:bg-purple-50 transition-colors"
                    >
                      Clear Search & Filters
                    </button>
                  </>
                ) : (
                  <>
                    <div className="mx-auto w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                      <FileText className="w-8 h-8 text-light-2" />
                    </div>
                    <p className="text-gray-500 text-lg mb-2">
                      No assignments found
                    </p>
                    <p className="text-gray-400 mb-4">
                      Create your first assignment to get started
                    </p>
                    <button
                      onClick={handleCreateAssignment}
                      className="px-5 py-2 bg-light-2 text-white rounded-full text-sm shadow-md hover:bg-light-1 transition-all"
                    >
                      <Plus className="w-4 h-4 inline mr-2" />
                      Create Assignment
                    </button>
                  </>
                )}
              </div>
            ) : (
              <>
                {/* Grid/List View Toggle */}
                {viewMode === "grid" ? (
                  // Grid View
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredAssignments.map((assignment) => {
                      const status = getDueDateStatus(assignment.due_date);
                      
                      return (
                        <motion.div
                          key={assignment.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3 }}
                          className="bg-white border border-gray-200 hover:border-light-2 rounded-xl shadow-sm hover:shadow-md transition-all overflow-hidden group h-full"
                        >
                          <div 
                            className="p-5 cursor-pointer h-full flex flex-col"
                            onClick={() => router.push(`/module/${moduleId}/${assignment.id}`)}
                          >
                            <div className="flex items-center gap-3 mb-3">
                              <div className="p-3 bg-purple-100 rounded-lg">
                                <FileText className="w-5 h-5 text-light-2" />
                              </div>
                              <div className={`px-3 py-1 rounded-full text-xs font-medium flex items-center ${status.class}`}>
                                {status.icon}
                                {status.label}
                              </div>
                            </div>
                            
                            <h3 className="text-lg font-semibold text-dark-1 group-hover:text-light-2 transition-colors mb-2">
                              {assignment.title}
                            </h3>
                            
                            {assignment.description && (
                              <p className="text-sm text-gray-500 flex-grow mb-4">
                                {assignment.description.length > 100
                                  ? `${assignment.description.substring(0, 100)}...`
                                  : assignment.description}
                              </p>
                            )}
                            
                            <div className="flex justify-between items-center mt-auto pt-3 border-t border-gray-100">
                              <span className="text-xs text-gray-500">
                                Due: {formatDate(assignment.due_date)}
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(`/module/${moduleId}/${assignment.id}`);
                                }}
                                className="text-xs text-light-2 hover:text-light-1 flex items-center"
                              >
                                View 
                                <ArrowRight className="w-3 h-3 ml-1" />
                              </button>
                            </div>
                          </div>
                          
                          <div className="flex bg-gray-50 p-2 border-t border-gray-200 justify-center gap-3">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditAssignment(assignment.id);
                              }}
                              className="flex items-center gap-1 px-3 py-1 border border-light-2 text-light-2 hover:bg-light-2 hover:text-white rounded-full text-xs transition-colors"
                              title="Edit assignment"
                            >
                              <Edit className="w-3 h-3" />
                              <span>Edit</span>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteAssignment(assignment.id);
                              }}
                              className="flex items-center gap-1 px-3 py-1 border border-red-500 text-red-500 hover:bg-red-500 hover:text-white rounded-full text-xs transition-colors"
                              title="Delete assignment"
                              disabled={isDeleting === assignment.id}
                            >
                              {isDeleting === assignment.id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <Trash2 className="w-3 h-3" />
                              )}
                              <span>Delete</span>
                            </button>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                ) : (
                  // List View
                  <div className="space-y-4">
                    {filteredAssignments.map((assignment) => {
                      const status = getDueDateStatus(assignment.due_date);
                      
                      return (
                        <motion.div
                          key={assignment.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2 }}
                          className="bg-white border border-gray-200 hover:border-light-2 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden group"
                        >
                          <div
                            className="flex flex-col md:flex-row justify-between items-start md:items-center p-5 cursor-pointer"
                            onClick={() => router.push(`/module/${moduleId}/${assignment.id}`)}
                          >
                            <div className="flex items-center gap-4 mb-4 md:mb-0">
                              <div className="p-3 bg-purple-100 rounded-full">
                                <FileText className="w-6 h-6 text-light-2" />
                              </div>
                              <div>
                                <h3 className="text-xl font-semibold text-dark-1 group-hover:text-light-2 transition-colors">
                                  {assignment.title}
                                </h3>
                                <div className="flex flex-wrap items-center gap-3 mt-1">
                                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${status.class}`}>
                                    {status.icon}
                                    {status.label}
                                  </span>
                                  <span className="inline-block px-3 py-1 bg-gray-100 rounded-full text-xs font-medium text-gray-700 flex items-center">
                                    <Calendar className="w-3 h-3 mr-1" />
                                    {formatDate(assignment.due_date)}
                                  </span>
                                  {assignment.description && (
                                    <p className="text-sm text-gray-500 hidden md:block">
                                      {assignment.description.length > 60
                                        ? `${assignment.description.substring(0, 60)}...`
                                        : assignment.description}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 self-end md:self-auto">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditAssignment(assignment.id);
                                }}
                                className="flex items-center gap-1 px-4 py-2 border border-light-2 text-light-2 hover:bg-light-2 hover:text-white rounded-full text-sm transition-colors"
                                title="Edit assignment"
                              >
                                <Edit className="w-4 h-4" />
                                <span className="hidden md:inline">Edit</span>
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteAssignment(assignment.id);
                                }}
                                className="flex items-center gap-1 px-4 py-2 border border-red-500 text-red-500 hover:bg-red-500 hover:text-white rounded-full text-sm transition-colors"
                                title="Delete assignment"
                                disabled={isDeleting === assignment.id}
                              >
                                {isDeleting === assignment.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Trash2 className="w-4 h-4" />
                                )}
                                <span className="hidden md:inline">Delete</span>
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(`/module/${moduleId}/${assignment.id}`);
                                }}
                                className="flex items-center gap-1 px-4 py-2 bg-light-2 text-white hover:bg-light-1 rounded-full text-sm transition-colors"
                                title="View assignment details"
                              >
                                <span className="hidden md:inline">View</span>
                                <span className="md:hidden">→</span>
                              </button>
                            </div>
                          </div>

                          {/* Mobile description */}
                          {assignment.description && (
                            <div className="px-5 pb-4 md:hidden">
                              <p className="text-sm text-gray-500">
                                {assignment.description.length > 100
                                  ? `${assignment.description.substring(0, 100)}...`
                                  : assignment.description}
                              </p>
                            </div>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Toast Container */}
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
    </ProtectedRoute>
  );
};

export default ModuleDetailsPageClient;