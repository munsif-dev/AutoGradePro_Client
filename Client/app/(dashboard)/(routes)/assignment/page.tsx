"use client";
import ProtectedRoute from "@/app/_components/ProtectedRoutes";
import React, { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import {
  Search,
  Calendar,
  FileText,
  ArrowUp,
  ArrowDown,
  Loader2,
  BookOpen,
  Clock,
  Filter,
  AlertCircle,
  CheckCircle,
  X,
  Download,
  Plus,
  ChevronLeft,
  ChevronRight,
  List,
  Grid,
  Bell,
  Clock3,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import useDebounce from "@/hooks/useDebounce"; // You'll need to create this hook

const AssignmentsPage = () => {
  interface Module {
    id: string;
    name: string;
    description: string;
    code?: string;
  }

  interface Assignment {
    id: string;
    title: string;
    description: string;
    created_at: string;
    due_date?: string;
    module: Module;
  }

  // State management
  const [modules, setModules] = useState<Module[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [filteredAssignments, setFilteredAssignments] = useState<Assignment[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState("desc"); // Default newest first
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedModule, setSelectedModule] = useState<string>("all");
  const [timeFilter, setTimeFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const router = useRouter();
  
  // For optimized search - prevents API calls on every keystroke
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  // Fetch assignments with parameters
  const fetchAssignments = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fixed URL spelling from "assigment" to "assignment"
      const response = await api.get("/api/assignment-list-page", {
        params: {
          search: debouncedSearchQuery,
          sort_by: sortBy,
          sort_order: sortOrder,
          module: selectedModule !== "all" ? selectedModule : undefined,
          page: currentPage,
          limit: 12, // Number of items per page
        },
      });
      
      setAssignments(response.data.results || response.data);
      if (response.data.total_pages) {
        setTotalPages(response.data.total_pages);
      }
      
      // Apply client-side filtering for time-based filters
      applyTimeFilter(response.data.results || response.data);
    } catch (error) {
      console.error("Error fetching assignments:", error);
      toast.error("Failed to load assignments. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearchQuery, sortBy, sortOrder, selectedModule, currentPage]);

  // Fetch modules for filter dropdown
  const fetchModules = useCallback(async () => {
    try {
      const response = await api.get("/api/module/list/");
      setModules(response.data);
    } catch (error) {
      console.error("Error fetching modules:", error);
    }
  }, []);

  // Apply time-based filtering (client-side)
  const applyTimeFilter = (assignments: Assignment[]) => {
    if (timeFilter === "all") {
      setFilteredAssignments(assignments);
      return;
    }

    const now = new Date();
    let filtered;

    switch (timeFilter) {
      case "upcoming":
        // Due date in the future
        filtered = assignments.filter(
          (a) => a.due_date && new Date(a.due_date) > now
        );
        break;
      case "today":
        // Due today
        filtered = assignments.filter((a) => {
          if (!a.due_date) return false;
          const dueDate = new Date(a.due_date);
          return (
            dueDate.getDate() === now.getDate() &&
            dueDate.getMonth() === now.getMonth() &&
            dueDate.getFullYear() === now.getFullYear()
          );
        });
        break;
      case "overdue":
        // Past due date
        filtered = assignments.filter(
          (a) => a.due_date && new Date(a.due_date) < now
        );
        break;
      default:
        filtered = assignments;
    }

    setFilteredAssignments(filtered);
  };

  // Initial data loading
  useEffect(() => {
    fetchModules();
  }, []);

  // Fetch assignments when dependencies change
  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  // Sort handlers
  const handleSortChange = (field: string) => {
    if (sortBy === field) {
      // Toggle sort order if clicking the same field
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      // Set new sort field and default to ascending
      setSortBy(field);
      setSortOrder("asc");
    }
    // Reset to first page when sort changes
    setCurrentPage(1);
  };

  // Filter handlers
  const handleModuleFilterChange = (moduleId: string) => {
    setSelectedModule(moduleId);
    setCurrentPage(1); // Reset to first page
  };

  const handleTimeFilterChange = (filter: string) => {
    setTimeFilter(filter);
    // No page reset needed for client-side filtering
  };

  // Navigation
  const navigateToAssignment = (assignment: Assignment) => {
    // Navigate to the correct URL structure that includes both module ID and assignment ID
    router.push(`/module/${assignment.module.id}/${assignment.id}`);
  };

  // Pagination handlers
  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // UI helpers
  const formatDate = (dateString: string) => {
    if (!dateString) return "No date set";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusBadge = (dueDate?: string) => {
    if (!dueDate) return null;
    
    const now = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return (
        <div className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-1 rounded flex items-center">
          <AlertCircle className="w-3 h-3 mr-1" />
          Overdue
        </div>
      );
    } else if (diffDays === 0) {
      return (
        <div className="bg-orange-100 text-orange-800 text-xs font-medium px-2.5 py-1 rounded flex items-center">
          <Clock3 className="w-3 h-3 mr-1" />
          Due today
        </div>
      );
    } else if (diffDays <= 3) {
      return (
        <div className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-1 rounded flex items-center">
          <Bell className="w-3 h-3 mr-1" />
          Due soon
        </div>
      );
    } else {
      return (
        <div className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-1 rounded flex items-center">
          <Calendar className="w-3 h-3 mr-1" />
          Upcoming
        </div>
      );
    }
  };

  // Calculate quick statistics
  const getQuickStats = () => {
    const now = new Date();
    const totalAssignments = assignments.length;
    const overdueCount = assignments.filter(
      (a) => a.due_date && new Date(a.due_date) < now
    ).length;
    const upcomingCount = assignments.filter(
      (a) => a.due_date && new Date(a.due_date) > now
    ).length;
    const todayCount = assignments.filter((a) => {
      if (!a.due_date) return false;
      const dueDate = new Date(a.due_date);
      return (
        dueDate.getDate() === now.getDate() &&
        dueDate.getMonth() === now.getMonth() &&
        dueDate.getFullYear() === now.getFullYear()
      );
    }).length;

    return { totalAssignments, overdueCount, upcomingCount, todayCount };
  };

  const stats = getQuickStats();

  // Generate assignment grid or list items
  const renderAssignmentItems = () => {
    if (filteredAssignments.length === 0) {
      return (
        <div className="bg-white border border-gray-200 rounded-lg shadow p-8 text-center col-span-full">
          <div className="mx-auto w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
            <FileText className="w-8 h-8 text-light-2" />
          </div>
          <h3 className="text-xl font-semibold text-dark-1 mb-2">
            No assignments found
          </h3>
          <p className="text-gray-600 mb-6">
            {searchQuery
              ? "Try adjusting your search or filters"
              : "Create a new assignment to get started"}
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedModule("all");
                setTimeFilter("all");
              }}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md shadow hover:bg-gray-300 transition-colors"
            >
              Clear Filters
            </button>
            <button
              onClick={() => router.push("/assignment/create")}
              className="px-4 py-2 bg-light-2 text-white rounded-md shadow hover:bg-opacity-90 transition-colors"
            >
              Create Assignment
            </button>
          </div>
        </div>
      );
    }

    if (viewMode === "grid") {
      return filteredAssignments.map((assignment) => (
        <div
          key={assignment.id}
          className="bg-white border border-gray-200 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 cursor-pointer hover:border-purple-200 transform hover:-translate-y-1 transition-transform group"
          onClick={() => navigateToAssignment(assignment)}
        >
          <div className="h-2 bg-light-2"></div>
          <div className="p-5">
            <div className="flex justify-between items-start">
              <h2 className="text-xl font-bold text-dark-1 mb-2 line-clamp-1 group-hover:text-light-2 transition-colors">
                {assignment.title}
              </h2>
              {assignment.due_date && getStatusBadge(assignment.due_date)}
            </div>

            <p className="text-gray-600 mb-4 text-sm line-clamp-2">
              {assignment.description || "No description provided"}
            </p>

            <div className="flex flex-col sm:flex-row sm:justify-between gap-2 text-xs text-gray-500 mb-4">
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-1" />
                <span>Created: {formatDate(assignment.created_at)}</span>
              </div>
              {assignment.due_date && (
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  <span>Due: {formatDate(assignment.due_date)}</span>
                </div>
              )}
            </div>

            {/* Module Badge */}
            <div className="flex items-center mb-2">
              <div className="bg-purple-100 text-light-2 text-xs font-medium px-2.5 py-1 rounded flex items-center">
                <BookOpen className="w-3 h-3 mr-1" />
                {assignment.module.name}
                {assignment.module.code && ` (${assignment.module.code})`}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-100">
              <button className="text-xs bg-purple-100 hover:bg-purple-200 text-light-2 font-medium rounded-full px-3 py-1 transition-colors">
                View Details
              </button>
              <button className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-full px-3 py-1 transition-colors">
                Grade Submissions
              </button>
            </div>
          </div>
        </div>
      ));
    } else {
      // List view
      return (
        <div className="bg-white rounded-lg shadow-md overflow-hidden w-full col-span-full">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assignment
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Module
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Due Date
                </th>
                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAssignments.map((assignment) => (
                <tr 
                  key={assignment.id} 
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => navigateToAssignment(assignment)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-md bg-purple-100">
                        <FileText className="h-5 w-5 text-light-2" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{assignment.title}</div>
                        <div className="text-xs text-gray-500 line-clamp-1">{assignment.description || "No description"}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{assignment.module.name}</div>
                    <div className="text-xs text-gray-500">{assignment.module.code || "No code"}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(assignment.created_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {assignment.due_date ? formatDate(assignment.due_date) : "No due date"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    {assignment.due_date ? getStatusBadge(assignment.due_date) : (
                      <div className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-1 rounded inline-flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        No deadline
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2" onClick={(e) => e.stopPropagation()}>
                      <button className="text-purple-600 hover:text-purple-900 p-1">
                        View
                      </button>
                      <button className="text-green-600 hover:text-green-900 p-1">
                        Grade
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen p-4 md:p-6 flex-col max-w-7xl mx-auto">
        {/* Header with title and search */}
        <div className="mb-6">
          <h1 className="text-4xl font-extrabold mb-2 text-center text-dark-1">
            Your <span className="text-light-2">Assignments</span>
          </h1>
          <p className="text-center text-gray-600 mb-6">
            Manage and track all your assignments in one place
          </p>

          {/* Search Bar */}
          <div className="relative max-w-2xl mx-auto">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search className="w-5 h-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search by title or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-transparent"
            />
          </div>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-purple-500">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-500 mb-1">Total Assignments</p>
                <p className="text-2xl font-bold text-gray-800">{stats.totalAssignments}</p>
              </div>
              <div className="p-2 bg-purple-100 rounded-full">
                <FileText className="w-5 h-5 text-light-2" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-yellow-500">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-500 mb-1">Due Today</p>
                <p className="text-2xl font-bold text-gray-800">{stats.todayCount}</p>
              </div>
              <div className="p-2 bg-yellow-100 rounded-full">
                <Clock3 className="w-5 h-5 text-yellow-500" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-green-500">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-500 mb-1">Upcoming</p>
                <p className="text-2xl font-bold text-gray-800">{stats.upcomingCount}</p>
              </div>
              <div className="p-2 bg-green-100 rounded-full">
                <Calendar className="w-5 h-5 text-green-500" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-red-500">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-500 mb-1">Overdue</p>
                <p className="text-2xl font-bold text-gray-800">{stats.overdueCount}</p>
              </div>
              <div className="p-2 bg-red-100 rounded-full">
                <AlertCircle className="w-5 h-5 text-red-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Sorting */}
        <div className="flex flex-col md:flex-row gap-4 justify-between mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative">
              <button 
                onClick={() => setIsFiltersOpen(!isFiltersOpen)}
                className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-gray-300 shadow-sm hover:bg-gray-50 transition-colors"
              >
                <Filter className="w-4 h-4" />
                <span>Filters</span>
                <span className="ml-1 text-xs bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded-full">
                  {(selectedModule !== "all" ? 1 : 0) + (timeFilter !== "all" ? 1 : 0)}
                </span>
              </button>
              
              {isFiltersOpen && (
                <div className="absolute z-10 mt-2 w-64 bg-white rounded-lg shadow-lg p-4 border border-gray-200">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-medium text-gray-700">Filters</h3>
                    <button 
                      onClick={() => {
                        setSelectedModule("all");
                        setTimeFilter("all");
                      }}
                      className="text-xs text-purple-600 hover:text-purple-800"
                    >
                      Reset all
                    </button>
                  </div>
                  
                  {/* Module filter */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Module
                    </label>
                    <select
                      value={selectedModule}
                      onChange={(e) => handleModuleFilterChange(e.target.value)}
                      className="block w-full bg-white border border-gray-300 rounded-md py-1.5 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500 text-sm"
                    >
                      <option value="all">All modules</option>
                      {modules.map((module) => (
                        <option key={module.id} value={module.id}>
                          {module.name} {module.code ? `(${module.code})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Time filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Due Date
                    </label>
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <input
                          type="radio"
                          id="all"
                          name="timeFilter"
                          value="all"
                          checked={timeFilter === "all"}
                          onChange={() => handleTimeFilterChange("all")}
                          className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                        />
                        <label htmlFor="all" className="ml-2 text-sm text-gray-700">
                          All
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="radio"
                          id="upcoming"
                          name="timeFilter"
                          value="upcoming"
                          checked={timeFilter === "upcoming"}
                          onChange={() => handleTimeFilterChange("upcoming")}
                          className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                        />
                        <label htmlFor="upcoming" className="ml-2 text-sm text-gray-700">
                          Upcoming
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="radio"
                          id="today"
                          name="timeFilter"
                          value="today"
                          checked={timeFilter === "today"}
                          onChange={() => handleTimeFilterChange("today")}
                          className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                        />
                        <label htmlFor="today" className="ml-2 text-sm text-gray-700">
                          Due today
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="radio"
                          id="overdue"
                          name="timeFilter"
                          value="overdue"
                          checked={timeFilter === "overdue"}
                          onChange={() => handleTimeFilterChange("overdue")}
                          className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                        />
                        <label htmlFor="overdue" className="ml-2 text-sm text-gray-700">
                          Overdue
                        </label>
                      </div>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => setIsFiltersOpen(false)}
                    className="mt-4 w-full bg-purple-600 text-white py-1.5 rounded-md hover:bg-purple-700 transition-colors text-sm font-medium"
                  >
                    Apply filters
                  </button>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-2 bg-white rounded-lg border border-gray-300 shadow-sm overflow-hidden">
              <button
                onClick={() => setViewMode("grid")}
                className={`px-3 py-2 flex items-center gap-1 ${
                  viewMode === "grid"
                    ? "bg-purple-100 text-purple-700"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <Grid className="w-4 h-4" />
                <span className="text-sm">Grid</span>
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`px-3 py-2 flex items-center gap-1 ${
                  viewMode === "list"
                    ? "bg-purple-100 text-purple-700"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <List className="w-4 h-4" />
                <span className="text-sm">List</span>
              </button>
            </div>
          </div>
          
          <div className="flex gap-2">
            <div className="flex items-center gap-1 bg-white rounded-lg border border-gray-300 shadow-sm">
              <button
                onClick={() => handleSortChange("created_at")}
                className={`px-3 py-2 flex items-center text-sm ${
                  sortBy === "created_at"
                    ? "bg-purple-100 text-purple-700"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <Clock className="w-4 h-4 mr-1" />
                Date
                {sortBy === "created_at" && (
                  <span className="ml-1">
                    {sortOrder === "asc" ? (
                      <ArrowUp className="w-3 h-3" />
                    ) : (
                      <ArrowDown className="w-3 h-3" />
                    )}
                  </span>
                )}
              </button>

              <button
                onClick={() => handleSortChange("title")}
                className={`px-3 py-2 flex items-center text-sm ${
                  sortBy === "title"
                    ? "bg-purple-100 text-purple-700"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <FileText className="w-4 h-4 mr-1" />
                Title
                {sortBy === "title" && (
                  <span className="ml-1">
                    {sortOrder === "asc" ? (
                      <ArrowUp className="w-3 h-3" />
                    ) : (
                      <ArrowDown className="w-3 h-3" />
                    )}
                  </span>
                )}
              </button>
            </div>
            
            <button
              onClick={() => router.push("/assignment/create")}
              className="flex items-center gap-1 px-3 py-2 bg-light-2 text-white rounded-lg hover:bg-opacity-90 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span className="text-sm">New</span>
            </button>
          </div>
        </div>

        {/* Applied filters tags */}
        {(selectedModule !== "all" || timeFilter !== "all") && (
          <div className="flex flex-wrap gap-2 mb-4">
            {selectedModule !== "all" && (
              <div className="flex items-center bg-purple-100 text-purple-800 text-xs font-medium px-2.5 py-1 rounded">
                Module: {modules.find(m => m.id === selectedModule)?.name || selectedModule}
                <button 
                  onClick={() => setSelectedModule("all")}
                  className="ml-1.5 hover:text-purple-900"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
            {timeFilter !== "all" && (
              <div className="flex items-center bg-purple-100 text-purple-800 text-xs font-medium px-2.5 py-1 rounded">
                Due: {timeFilter.charAt(0).toUpperCase() + timeFilter.slice(1)}
                <button 
                  onClick={() => setTimeFilter("all")}
                  className="ml-1.5 hover:text-purple-900"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
            <button 
              onClick={() => {
                setSelectedModule("all");
                setTimeFilter("all");
              }}
              className="text-xs text-gray-600 hover:text-gray-900 px-2 py-1"
            >
              Clear all
            </button>
          </div>
        )}

        {/* Results count & indicators */}
        <div className="flex justify-between items-center mb-4">
          <div className="text-sm text-gray-600">
            Showing {filteredAssignments.length} assignment{filteredAssignments.length !== 1 ? 's' : ''}
            {searchQuery && ` for "${searchQuery}"`}
          </div>
          
          {/* Export button */}
          <button 
            className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            title="Export assignments data"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="w-8 h-8 text-light-2 animate-spin" />
            <span className="ml-2 text-gray-600">Loading assignments...</span>
          </div>
        ) : (
          <>
            {/* Grid view of assignments */}
            <div className={`grid ${viewMode === "grid" ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" : ""} gap-6 mb-6`}>
              {renderAssignmentItems()}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center space-x-4 mt-8">
                <button
                  onClick={goToPreviousPage}
                  disabled={currentPage === 1}
                  className={`p-2 rounded-md ${
                    currentPage === 1
                      ? "text-gray-400 cursor-not-allowed"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="text-sm text-gray-700">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages}
                  className={`p-2 rounded-md ${
                    currentPage === totalPages
                      ? "text-gray-400 cursor-not-allowed"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </ProtectedRoute>
  );
};

// Create a custom hook for debouncing
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default AssignmentsPage;