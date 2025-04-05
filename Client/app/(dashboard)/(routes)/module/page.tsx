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
} from "lucide-react";
import api from "@/lib/api";
import ProtectedRoute from "@/app/_components/ProtectedRoutes";
import BackButton from "../../_components/BackButton";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

interface Module {
  id: number;
  name: string;
  code: string;
  description?: string;
}

const ModulePage = () => {
  const [modules, setModules] = useState<Module[]>([]);
  const [filteredModules, setFilteredModules] = useState<Module[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchModules();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = modules.filter(
        (module) =>
          module.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          module.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (module.description &&
            module.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredModules(filtered);
    } else {
      setFilteredModules(modules);
    }
  }, [searchTerm, modules]);

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

  const deleteModule = (id: number) => {
    // Show a confirmation dialog before deleting
    const isConfirmed = window.confirm(
      "Are you sure you want to delete this module?"
    );

    if (isConfirmed) {
      setIsLoading(true);
      api
        .delete(`/api/module/delete/${id}/`)
        .then((res) => {
          if (res.status === 204) {
            toast.success("Module deleted successfully!");
            fetchModules(); // Reload the module list
          } else {
            toast.error("Failed to delete module.");
            setIsLoading(false);
          }
        })
        .catch((err) => {
          toast.error("Error deleting module: " + err);
          setIsLoading(false);
        });
    }
  };

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen flex-col bg-purple-100">
        {/* Top Navigation Bar */}
        <div className="sticky top-0 z-10 bg-white shadow-sm p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl pl-6 font-bold text-dark-1 hidden md:block">
              Modules Management
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search modules..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-full w-48 md:w-64 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-transparent"
              />
              <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
            </div>

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
          <div className="flex justify-between items-center mb-8 md:hidden">
            <h1 className="text-3xl font-extrabold text-dark-1 tracking-wide">
              Manage <span className="text-light-2">Modules</span>
            </h1>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-purple-400">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Total Modules</p>
                  <h3 className="text-2xl font-bold text-dark-1">
                    {modules.length}
                  </h3>
                </div>
                <div className="p-3 bg-purple-100 rounded-full">
                  <BookOpen className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-blue-400">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Active Modules</p>
                  <h3 className="text-2xl font-bold text-dark-1">
                    {modules.length}
                  </h3>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <Book className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-green-400">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Last Updated</p>
                  <h3 className="text-lg font-medium text-dark-1">
                    {new Date().toLocaleDateString()}
                  </h3>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <Code className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Module List Section */}
          <div className="bg-purple-50 shadow-lg rounded-2xl p-6 md:p-8">
            <h2 className="text-2xl font-semibold text-dark-1 mb-6 flex items-center gap-3">
              <Book className="w-6 h-6 text-light-2" />
              Modules List
            </h2>

            {isLoading ? (
              <div className="flex justify-center items-center py-20">
                <Loader2 className="w-8 h-8 text-light-2 animate-spin" />
                <span className="ml-4 text-gray-600">Loading modules...</span>
              </div>
            ) : filteredModules.length === 0 ? (
              <div className="text-center py-16 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                {searchTerm ? (
                  <>
                    <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                      <Search className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500 text-lg mb-2">
                      No modules match your search
                    </p>
                    <p className="text-gray-400">
                      Try different keywords or clear your search
                    </p>
                    <button
                      onClick={() => setSearchTerm("")}
                      className="mt-4 px-4 py-2 text-purple-600 border border-purple-600 rounded-full text-sm hover:bg-purple-50 transition-colors"
                    >
                      Clear Search
                    </button>
                  </>
                ) : (
                  <>
                    <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                      <Book className="w-8 h-8 text-gray-400" />
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
              <div className="grid grid-cols-1 gap-6">
                {filteredModules.map((module) => (
                  <div
                    key={module.id}
                    className="bg-white border border-gray-200 hover:border-purple-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden group"
                  >
                    <div
                      className="flex flex-col md:flex-row justify-between items-start md:items-center p-5 cursor-pointer"
                      onClick={() => router.push(`/module/${module.id}`)}
                    >
                      <div className="flex items-center gap-4 mb-4 md:mb-0">
                        <div className="p-3 bg-purple-100 rounded-full">
                          <Book className="w-6 h-6 text-purple-600" />
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-dark-1 group-hover:text-light-2 transition-colors">
                            {module.name}
                          </h3>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="inline-block px-3 py-1 bg-gray-100 rounded-full text-xs font-medium text-gray-700">
                              {module.code}
                            </span>
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
                          className="flex items-center gap-1 px-4 py-2 border border-purple-500 text-purple-500 hover:bg-purple-500 hover:text-white rounded-full text-sm transition-colors"
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
                        >
                          <Trash2 className="w-4 h-4" />
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

export default ModulePage;
