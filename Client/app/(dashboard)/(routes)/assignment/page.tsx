"use client";
import ProtectedRoute from "@/app/_components/ProtectedRoutes";
import React, { useState, useEffect } from "react";
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
} from "lucide-react";
import { useRouter } from "next/navigation";

const Page = () => {
  interface Module {
    id: string;
    name: string;
    description: string;
  }

  interface Assignment {
    id: string;
    title: string;
    description: string;
    created_at: string;
    due_date?: string;
    module: Module;
  }

  const [modules, setModules] = useState<Module[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState("asc");
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Fetch assignments
  useEffect(() => {
    fetchAssignments();
  }, [searchQuery, sortBy, sortOrder]);

  const fetchAssignments = async () => {
    setIsLoading(true);
    try {
      const response = await api.get("/api/assigment-list-page", {
        params: {
          search: searchQuery,
          sort_by: sortBy,
          sort_order: sortOrder,
        },
      });
      setAssignments(response.data);
    } catch (error) {
      console.error("Error fetching assignments:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSortChange = (field: string) => {
    if (sortBy === field) {
      // Toggle sort order if clicking the same field
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      // Set new sort field and default to ascending
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const navigateToAssignment = (id: string) => {
    router.push(`/assignment/${id}`);
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen p-6 flex-col max-w-7xl mx-auto">
        {/* Header with title and search */}
        <div className="mb-8">
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

        {/* Filters and Sorting */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex flex-wrap gap-4 justify-between items-center">
            <div className="text-sm font-medium text-gray-700">
              {assignments.length}{" "}
              {assignments.length === 1 ? "Assignment" : "Assignments"} found
            </div>

            <div className="flex gap-4 items-center">
              <div className="flex items-center">
                <span className="text-sm text-gray-600 mr-2">Sort by:</span>
                <button
                  onClick={() => handleSortChange("created_at")}
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    sortBy === "created_at"
                      ? "bg-purple-100 text-light-2"
                      : "hover:bg-gray-100"
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
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    sortBy === "title"
                      ? "bg-purple-100 text-light-2"
                      : "hover:bg-gray-100"
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
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="w-8 h-8 text-light-2 animate-spin" />
            <span className="ml-2 text-gray-600">Loading assignments...</span>
          </div>
        ) : (
          <>
            {/* Assignments List */}
            {assignments.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {assignments.map((assignment) => (
                  <div
                    key={assignment.id}
                    onClick={() => navigateToAssignment(assignment.id)}
                    className="bg-white border border-gray-200 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 cursor-pointer hover:border-purple-200 transform hover:-translate-y-1 transition-transform"
                  >
                    <div className="h-2 bg-light-2"></div>
                    <div className="p-5">
                      <h2 className="text-xl font-bold text-dark-1 mb-2 line-clamp-1">
                        {assignment.title}
                      </h2>

                      <p className="text-gray-600 mb-4 text-sm line-clamp-2">
                        {assignment.description || "No description provided"}
                      </p>

                      <div className="flex items-center text-xs text-gray-500 mb-4">
                        <Calendar className="w-4 h-4 mr-1" />
                        <span>
                          Created: {formatDate(assignment.created_at)}
                        </span>
                      </div>

                      {/* Module Badge */}
                      <div className="flex items-center mb-2">
                        <div className="bg-purple-100 text-light-2 text-xs font-medium px-2.5 py-1 rounded flex items-center">
                          <BookOpen className="w-3 h-3 mr-1" />
                          {assignment.module.name}
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
                ))}
              </div>
            ) : (
              <div className="bg-white border border-gray-200 rounded-lg shadow p-8 text-center">
                <div className="mx-auto w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                  <FileText className="w-8 h-8 text-light-2" />
                </div>
                <h3 className="text-xl font-semibold text-dark-1 mb-2">
                  No assignments found
                </h3>
                <p className="text-gray-600 mb-6">
                  Try adjusting your search or create a new assignment
                </p>
                <button
                  onClick={() => router.push("/assignment/create")}
                  className="px-4 py-2 bg-light-2 text-white rounded-md shadow hover:bg-opacity-90 transition-colors"
                >
                  Create Assignment
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </ProtectedRoute>
  );
};

export default Page;
