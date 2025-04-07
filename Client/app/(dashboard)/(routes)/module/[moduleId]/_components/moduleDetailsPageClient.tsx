"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import ProtectedRoute from "@/app/_components/ProtectedRoutes";
import { Plus, Book, Search, Loader2, Trash2, Edit, BookOpen, Calendar, FileText } from "lucide-react";
import BackButton from "@/app/(dashboard)/_components/BackButton";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

interface Assignment {
  id: number;
  title: string;
  description?: string;
  due_date: string;
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
  const [module, setModule] = useState<ModuleDetails | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filteredAssignments, setFilteredAssignments] = useState<Assignment[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  const router = useRouter();

  useEffect(() => {
    fetchModuleDetails();
    fetchAssignments();
  }, [moduleId]);

  useEffect(() => {
    if (searchTerm) {
      const filtered = assignments.filter(
        (assignment) =>
          assignment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (assignment.description &&
            assignment.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredAssignments(filtered);
    } else {
      setFilteredAssignments(assignments);
    }
  }, [searchTerm, assignments]);

  const fetchModuleDetails = () => {
    setIsLoading(true);
    api
      .get(`/api/module/${moduleId}/`) // Fetch module details
      .then((res) => {
        setModule(res.data);
        setIsLoading(false);
      })
      .catch((err) => {
        toast.error("Failed to fetch module details: " + err);
        setIsLoading(false);
      });
  };

  const fetchAssignments = () => {
    setIsLoading(true);
    api
      .get(`/api/assignment/list/`, { params: { module_id: moduleId } }) // Filter assignments by module_id
      .then((res) => {
        setAssignments(res.data);
        setFilteredAssignments(res.data);
        setIsLoading(false);
      })
      .catch((err) => {
        toast.error("Failed to fetch assignments: " + err);
        setIsLoading(false);
      });
  };

  const deleteAssignment = (id: number) => {
    // Show a confirmation dialog before deleting
    const isConfirmed = window.confirm(
      "Are you sure you want to delete this assignment?"
    );

    if (isConfirmed) {
      setIsLoading(true);
      api
        .delete(`/api/assignment/delete/${id}/`)
        .then((res) => {
          if (res.status === 204) {
            toast.success("Assignment deleted successfully!");
            fetchAssignments(); // Refresh the assignments after deleting
          } else {
            toast.error("Failed to delete assignment.");
            setIsLoading(false);
          }
        })
        .catch((err) => {
          toast.error("Error deleting assignment: " + err);
          setIsLoading(false);
        });
    }
  };

  const handleCreateAssignment = () => {
    // Navigate to the assignment creation page
    router.push(`/module/${moduleId}/create-assignment`);
  };

  const handleEditAssignment = (id: number) => {
    // Navigate to the assignment edit page
    router.push(`/module/${moduleId}/edit-assignment/${id}`);
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

          <div className="flex items-center gap-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search assignments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-full w-48 md:w-64 focus:outline-none focus:ring-2 focus:ring-light-2 focus:border-transparent"
              />
              <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
            </div>

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
          <div className="flex justify-between items-center mb-8 md:hidden">
            <h1 className="text-3xl font-extrabold text-dark-1 tracking-wide">
              {module?.name || "Module"} <span className="text-light-2">Details</span>
            </h1>
          </div>

          {/* Module Info */}
          {module && (
            <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-light-2 mb-8">
              <div className="flex flex-col md:flex-row justify-between">
                <div>
                  <p className="text-lg text-gray-600 mt-2">{module.code}</p>
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
            </div>
          )}

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-light-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Total Assignments</p>
                  <h3 className="text-2xl font-bold text-dark-1">
                    {assignments.length}
                  </h3>
                </div>
                <div className="p-3 bg-purple-100 rounded-full">
                  <FileText className="w-6 h-6 text-light-2" />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-purple-300">
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
                            return new Date(upcomingAssignments[0].due_date).toLocaleDateString();
                          } else {
                            return "No upcoming deadlines";
                          }
                        })()
                      : "No assignments"}
                  </h3>
                </div>
                <div className="p-3 bg-purple-50 rounded-full">
                  <Calendar className="w-6 h-6 text-light-2" />
                </div>
              </div>
            </div>
          </div>

          {/* Assignments List Section */}
          <div className="bg-white shadow-md rounded-xl p-6 md:p-8">
            <h2 className="text-2xl font-semibold text-dark-1 mb-6 flex items-center gap-3">
              <FileText className="w-6 h-6 text-light-2" />
              Assignments List
            </h2>

            {isLoading ? (
              <div className="flex justify-center items-center py-20">
                <Loader2 className="w-8 h-8 text-light-2 animate-spin" />
                <span className="ml-4 text-gray-600">Loading assignments...</span>
              </div>
            ) : filteredAssignments.length === 0 ? (
              <div className="text-center py-16 bg-purple-50 rounded-xl border border-dashed border-purple-200">
                {searchTerm ? (
                  <>
                    <div className="mx-auto w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                      <Search className="w-8 h-8 text-light-2" />
                    </div>
                    <p className="text-gray-500 text-lg mb-2">
                      No assignments match your search
                    </p>
                    <p className="text-gray-400">
                      Try different keywords or clear your search
                    </p>
                    <button
                      onClick={() => setSearchTerm("")}
                      className="mt-4 px-4 py-2 text-light-2 border border-light-2 rounded-full text-sm hover:bg-purple-50 transition-colors"
                    >
                      Clear Search
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
              <div className="grid grid-cols-1 gap-6">
                {filteredAssignments.map((assignment) => (
                  <div
                    key={assignment.id}
                    className="bg-white border border-gray-200 hover:border-light-2 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden group"
                  >
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-5">
                      <div className="flex items-center gap-4 mb-4 md:mb-0">
                        <div className="p-3 bg-purple-100 rounded-full">
                          <FileText className="w-6 h-6 text-light-2" />
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-dark-1 group-hover:text-light-2 transition-colors">
                            {assignment.title}
                          </h3>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="inline-block px-3 py-1 bg-gray-100 rounded-full text-xs font-medium text-gray-700">
                              Due: {new Date(assignment.due_date).toLocaleString()}
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
                        >
                          <Trash2 className="w-4 h-4" />
                          <span className="hidden md:inline">Delete</span>
                        </button>
                        <button
                          onClick={() => router.push(`/module/${moduleId}/${assignment.id}`)}
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
                  </div>
                ))}
              </div>
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
