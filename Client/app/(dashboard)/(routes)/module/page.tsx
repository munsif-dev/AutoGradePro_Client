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
  Code,
  ChevronDown,
  ChevronUp,
  Calendar,
  Filter,
  List,
  Grid,
  SortAsc,
  SortDesc,
  X,
  ArrowRight,
  CheckCircle2,
  Info,
} from "lucide-react";
import api from "@/lib/api";
import ProtectedRoute from "@/app/_components/ProtectedRoutes";
import BackButton from "../../_components/BackButton";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { motion, AnimatePresence } from "framer-motion";

interface Module {
  id: number;
  name: string;
  code: string;
  description?: string;
  created_at?: string;
}

const ModulePage = () => {
  // State variables
  const [modules, setModules] = useState<Module[]>([]);
  const [filteredModules, setFilteredModules] = useState<Module[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [sortField, setSortField] = useState<string>("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  
  const router = useRouter();

  // Fetch modules on component mount
  useEffect(() => {
    fetchModules();
  }, []);

  // Filter modules when search term or sort options change
  useEffect(() => {
    let result = [...modules];
    
    // Apply search filter
    if (searchTerm) {
      result = result.filter(
        (module) =>
          module.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          module.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (module.description &&
            module.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    // Apply category filter
    if (selectedFilter) {
      // This is just an example. You might need to adjust based on your data structure.
      if (selectedFilter === "recent") {
        // Sort by created_at in descending order to get most recent
        result = [...result].sort((a, b) => 
          new Date(b.created_at || "").getTime() - new Date(a.created_at || "").getTime()
        ).slice(0, 5);
      }
      // Add more filter options as needed
    }
    
    // Apply sorting
    result = sortModules(result, sortField, sortDirection);
    
    setFilteredModules(result);
  }, [searchTerm, modules, sortField, sortDirection, selectedFilter]);

  // Fetch modules from API
  const fetchModules = () => {
    setIsLoading(true);
    api
      .get("/api/module/list/")
      .then((res) => {
        setModules(res.data);
        setFilteredModules(res.data);
        setIsLoading(false);
      })
      .catch((err) => {
        toast.error("Failed to fetch modules: " + err);
        setIsLoading(false);
      });
  };

  // Sort modules based on field and direction
  const sortModules = (modulesToSort: Module[], field: string, direction: "asc" | "desc") => {
    return [...modulesToSort].sort((a, b) => {
      let comparison = 0;
      switch (field) {
        case "name":
          comparison = a.name.localeCompare(b.name);
          break;
        case "code":
          comparison = a.code.localeCompare(b.code);
          break;
        case "date":
          comparison = new Date(b.created_at || "").getTime() - new Date(a.created_at || "").getTime();
          break;
        default:
          comparison = a.name.localeCompare(b.name);
      }
      return direction === "asc" ? comparison : -comparison;
    });
  };

  // Handle sort column click
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Delete a module
  const deleteModule = (id: number) => {
    // Show a confirmation dialog before deleting
    const isConfirmed = window.confirm(
      "Are you sure you want to delete this module?"
    );

    if (isConfirmed) {
      setIsDeleting(id);
      api
        .delete(`/api/module/delete/${id}/`)
        .then((res) => {
          if (res.status === 204) {
            toast.success("Module deleted successfully!");
            fetchModules(); // Reload the module list
          } else {
            toast.error("Failed to delete module.");
          }
        })
        .catch((err) => {
          toast.error("Error deleting module: " + err);
        })
        .finally(() => {
          setIsDeleting(null);
        });
    }
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm("");
    setSelectedFilter(null);
    setSortField("name");
    setSortDirection("asc");
  };

  // Format date for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };

  // Get sort indicator icon
  const getSortIcon = (field: string) => {
    if (sortField !== field) return null;
    return sortDirection === "asc" ? (
      <SortAsc className="w-4 h-4 ml-1" />
    ) : (
      <SortDesc className="w-4 h-4 ml-1" />
    );
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

  // Get active filter counts
  const getActiveFilterCount = () => {
    let count = 0;
    if (searchTerm) count++;
    if (selectedFilter) count++;
    if (sortField !== "name" || sortDirection !== "asc") count++;
    return count;
  };

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen flex-col bg-purple-100">
        {/* Top Navigation Bar */}
        <div className="sticky top-0 z-10 bg-white shadow-md p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl pl-6 font-bold text-dark-1 hidden md:block">
              Modules Management
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Search Box */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search modules..."
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
                    className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg p-2 z-20 border border-gray-200"
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
                        onClick={() => handleSort("name")}
                        className={`flex items-center justify-between w-full p-2 rounded-md text-sm ${
                          sortField === "name" ? "bg-purple-50 text-purple-600" : "hover:bg-gray-50 text-gray-700"
                        }`}
                      >
                        <span>Module name</span>
                        {sortField === "name" && (
                          <span>{sortDirection === "asc" ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}</span>
                        )}
                      </button>
                      <button
                        onClick={() => handleSort("code")}
                        className={`flex items-center justify-between w-full p-2 rounded-md text-sm ${
                          sortField === "code" ? "bg-purple-50 text-purple-600" : "hover:bg-gray-50 text-gray-700"
                        }`}
                      >
                        <span>Module code</span>
                        {sortField === "code" && (
                          <span>{sortDirection === "asc" ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}</span>
                        )}
                      </button>
                      <button
                        onClick={() => handleSort("date")}
                        className={`flex items-center justify-between w-full p-2 rounded-md text-sm ${
                          sortField === "date" ? "bg-purple-50 text-purple-600" : "hover:bg-gray-50 text-gray-700"
                        }`}
                      >
                        <span>Date created</span>
                        {sortField === "date" && (
                          <span>{sortDirection === "asc" ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}</span>
                        )}
                      </button>
                    </div>
                    <div className="p-2 border-t border-gray-100">
                      <h3 className="font-medium text-gray-700 mb-1">Quick filters</h3>
                      <div className="space-y-1">
                        <button
                          onClick={() => setSelectedFilter(selectedFilter === "recent" ? null : "recent")}
                          className={`flex items-center justify-between w-full p-2 rounded-md text-sm ${
                            selectedFilter === "recent" ? "bg-purple-50 text-purple-600" : "hover:bg-gray-50 text-gray-700"
                          }`}
                        >
                          <span>Recently created</span>
                          {selectedFilter === "recent" && (
                            <CheckCircle2 className="w-4 h-4" />
                          )}
                        </button>
                        {/* Add more filter options as needed */}
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

            {/* Create Module Button */}
            <button
              onClick={() => router.push("/module/create")}
              className="flex items-center gap-2 px-5 py-2 bg-light-2 text-white rounded-full shadow-md hover:bg-light-1 transition ease-in-out duration-300 transform hover:scale-105"
            >
              <Plus className="w-5 h-5" />
              <span className="hidden md:inline">Create Module</span>
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-grow container mx-auto p-6 md:p-8">
          {/* Header for Mobile */}
          <div className="flex justify-between items-center mb-6 md:hidden">
            <h1 className="text-2xl font-bold text-dark-1">
              Manage <span className="text-light-2">Modules</span>
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

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-light-2 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Total Modules</p>
                  <h3 className="text-2xl font-bold text-dark-1">
                    {modules.length}
                  </h3>
                </div>
                <div className="p-3 bg-purple-100 rounded-full">
                  <BookOpen className="w-6 h-6 text-light-2" />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-purple-300 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Active Modules</p>
                  <h3 className="text-2xl font-bold text-dark-1">
                    {modules.length}
                  </h3>
                </div>
                <div className="p-3 bg-purple-50 rounded-full">
                  <Book className="w-6 h-6 text-light-2" />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-purple-200 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Last Updated</p>
                  <h3 className="text-lg font-medium text-dark-1">
                    {new Date().toLocaleDateString()}
                  </h3>
                </div>
                <div className="p-3 bg-purple-50 rounded-full">
                  <Code className="w-6 h-6 text-light-3" />
                </div>
              </div>
            </div>
          </div>

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
                  {selectedFilter === "recent" ? "Recently created" : selectedFilter}
                  <button onClick={() => setSelectedFilter(null)} className="ml-1 text-gray-400 hover:text-gray-600">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              
              {(sortField !== "name" || sortDirection !== "asc") && (
                <span className="bg-white text-purple-700 text-xs px-3 py-1 rounded-full border border-purple-200 flex items-center mr-2">
                  Sort: {sortField === "name" ? "Name" : sortField === "code" ? "Code" : "Date"} ({sortDirection === "asc" ? "A-Z" : "Z-A"})
                  <button 
                    onClick={() => {
                      setSortField("name");
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

          {/* Module List Section */}
          <div className="bg-white shadow-md rounded-xl p-6 md:p-8">
            {/* Header with Title and View Toggle */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-dark-1 flex items-center gap-3">
                <Book className="w-6 h-6 text-light-2" />
                Modules List
                <span className="text-sm font-normal text-gray-500">
                  ({filteredModules.length} of {modules.length})
                </span>
              </h2>
              
              {/* Sort Buttons - Desktop */}
              <div className="hidden md:flex items-center gap-2 text-sm">
                <span className="text-gray-500">Sort by:</span>
                <button
                  onClick={() => handleSort("name")}
                  className={`flex items-center px-2 py-1 rounded hover:bg-purple-50 ${
                    sortField === "name" ? "text-purple-600 font-medium" : "text-gray-600"
                  }`}
                >
                  Name {getSortIcon("name")}
                </button>
                <button
                  onClick={() => handleSort("code")}
                  className={`flex items-center px-2 py-1 rounded hover:bg-purple-50 ${
                    sortField === "code" ? "text-purple-600 font-medium" : "text-gray-600"
                  }`}
                >
                  Code {getSortIcon("code")}
                </button>
                <button
                  onClick={() => handleSort("date")}
                  className={`flex items-center px-2 py-1 rounded hover:bg-purple-50 ${
                    sortField === "date" ? "text-purple-600 font-medium" : "text-gray-600"
                  }`}
                >
                  Date {getSortIcon("date")}
                </button>
              </div>
            </div>

            {/* Loading State */}
            {isLoading ? (
              <div className="space-y-4">
                {renderSkeletons()}
              </div>
            ) : filteredModules.length === 0 ? (
              <div className="text-center py-16 bg-purple-50 rounded-xl border border-dashed border-purple-200">
                {searchTerm || selectedFilter ? (
                  <>
                    <div className="mx-auto w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                      <Search className="w-8 h-8 text-light-2" />
                    </div>
                    <p className="text-gray-500 text-lg mb-2">
                      No modules match your filters
                    </p>
                    <p className="text-gray-400 mb-4">
                      Try different search terms or clear your filters
                    </p>
                    <button
                      onClick={clearFilters}
                      className="mt-2 px-4 py-2 text-light-2 border border-light-2 rounded-full text-sm hover:bg-purple-50 transition-colors"
                    >
                      Clear All Filters
                    </button>
                  </>
                ) : (
                  <>
                    <div className="mx-auto w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                      <Book className="w-8 h-8 text-light-2" />
                    </div>
                    <p className="text-gray-500 text-lg mb-2">
                      No modules found
                    </p>
                    <p className="text-gray-400 mb-4">
                      Create your first module to get started
                    </p>
                    <button
                      onClick={() => router.push("/module/create")}
                      className="px-5 py-2 bg-light-2 text-white rounded-full text-sm shadow-md hover:bg-light-1 transition-all"
                    >
                      <Plus className="w-4 h-4 inline mr-2" />
                      Create Module
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
                    {filteredModules.map((module) => (
                      <motion.div
                        key={module.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className="bg-white border border-gray-200 hover:border-light-2 rounded-xl shadow-sm hover:shadow-md transition-all overflow-hidden group h-full"
                      >
                        <div 
                          className="p-5 cursor-pointer h-full flex flex-col"
                          onClick={() => router.push(`/module/${module.id}`)}
                        >
                          <div className="flex items-center gap-3 mb-3">
                            <div className="p-3 bg-purple-100 rounded-lg">
                              <Book className="w-5 h-5 text-light-2" />
                            </div>
                            <div>
                              <span className="inline-block px-3 py-1 bg-gray-100 rounded-full text-xs font-medium text-gray-700">
                                {module.code}
                              </span>
                            </div>
                          </div>
                          
                          <h3 className="text-lg font-semibold text-dark-1 group-hover:text-light-2 transition-colors mb-2">
                            {module.name}
                          </h3>
                          
                          {module.description && (
                            <p className="text-sm text-gray-500 flex-grow mb-4">
                              {module.description.length > 100
                                ? `${module.description.substring(0, 100)}...`
                                : module.description}
                            </p>
                          )}
                          
                          <div className="flex justify-between items-center mt-auto pt-3 border-t border-gray-100">
                            <span className="text-xs text-gray-500 flex items-center">
                              <Calendar className="w-3 h-3 mr-1" />
                              {formatDate(module.created_at)}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/module/${module.id}`);
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
                              router.push(`/module/edit/${module.id}`);
                            }}
                            className="flex items-center gap-1 px-3 py-1 border border-light-2 text-light-2 hover:bg-light-2 hover:text-white rounded-full text-xs transition-colors"
                            title="Edit module"
                          >
                            <Edit className="w-3 h-3" />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteModule(module.id);
                            }}
                            className="flex items-center gap-1 px-3 py-1 border border-red-500 text-red-500 hover:bg-red-500 hover:text-white rounded-full text-xs transition-colors"
                            title="Delete module"
                          >
                            {isDeleting === module.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Trash2 className="w-3 h-3" />
                            )}
                            <span>Delete</span>
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  // List View
                  <div className="space-y-4">
                    {filteredModules.map((module) => (
                      <motion.div
                        key={module.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                        className="bg-white border border-gray-200 hover:border-light-2 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden group"
                      >
                        <div
                          className="flex flex-col md:flex-row justify-between items-start md:items-center p-5 cursor-pointer"
                          onClick={() => router.push(`/module/${module.id}`)}
                        >
                          <div className="flex items-start md:items-center gap-4 mb-4 md:mb-0">
                            <div className="p-3 bg-purple-100 rounded-full">
                              <Book className="w-6 h-6 text-light-2" />
                            </div>
                            <div>
                              <h3 className="text-xl font-semibold text-dark-1 group-hover:text-light-2 transition-colors">
                                {module.name}
                              </h3>
                              <div className="flex flex-wrap items-center gap-3 mt-1">
                                <span className="inline-block px-3 py-1 bg-gray-100 rounded-full text-xs font-medium text-gray-700">
                                  {module.code}
                                </span>
                                {module.created_at && (
                                  <span className="text-xs text-gray-500 flex items-center">
                                    <Calendar className="w-3 h-3 mr-1" />
                                    Created: {formatDate(module.created_at)}
                                  </span>
                                )}
                                {module.description && (
                                  <p className="text-sm text-gray-500 hidden md:block">
                                    {module.description.length > 60
                                      ? `${module.description.substring(0, 60)}...`
                                      : module.description}
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
                                router.push(`/module/edit/${module.id}`);
                              }}
                              className="flex items-center gap-1 px-4 py-2 border border-light-2 text-light-2 hover:bg-light-2 hover:text-white rounded-full text-sm transition-colors"
                              title="Edit module"
                            >
                              <Edit className="w-4 h-4" />
                              <span className="hidden md:inline">Edit</span>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteModule(module.id);
                              }}
                              className="flex items-center gap-1 px-4 py-2 border border-red-500 text-red-500 hover:bg-red-500 hover:text-white rounded-full text-sm transition-colors"
                              title="Delete module"
                              disabled={isDeleting === module.id}
                            >
                              {isDeleting === module.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                              <span className="hidden md:inline">Delete</span>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/module/${module.id}`);
                              }}
                              className="flex items-center gap-1 px-4 py-2 bg-light-2 text-white hover:bg-light-1 rounded-full text-sm transition-colors"
                              title="View module details"
                            >
                              <span className="hidden md:inline">View</span>
                              <span className="md:hidden">→</span>
                            </button>
                          </div>
                        </div>

                        {/* Mobile description */}
                        {module.description && (
                          <div className="px-5 pb-4 md:hidden">
                            <p className="text-sm text-gray-500">
                              {module.description.length > 100
                                ? `${module.description.substring(0, 100)}...`
                                : module.description}
                            </p>
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                )}
                
                {/* No Results Indicator */}
                {filteredModules.length === 0 && !isLoading && (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Info className="w-12 h-12 text-gray-300 mb-2" />
                    <p className="text-gray-500">No modules found</p>
                    <p className="text-gray-400 text-sm">
                      Try adjusting your filters or create a new module
                    </p>
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

export default ModulePage;