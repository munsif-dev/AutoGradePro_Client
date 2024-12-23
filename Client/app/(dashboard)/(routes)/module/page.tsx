"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import api from "@/lib/api";
import ProtectedRoute from "@/app/_components/ProtectedRoutes";

interface Module {
  id: number;
  name: string;
  code: string;
  description?: string;
}

const ModulePage = () => {
  const [modules, setModules] = useState<Module[]>([]);
  const router = useRouter();

  useEffect(() => {
    fetchModules();
  }, []);

  const fetchModules = () => {
    api
      .get("/api/module/list/")
      .then((res) => setModules(res.data))
      .catch((err) => alert("Failed to fetch modules: " + err));
  };

  const deleteModule = (id: number) => {
    api
      .delete(`/api/module/delete/${id}/`)
      .then((res) => {
        if (res.status === 204) {
          alert("Module deleted successfully!");
          fetchModules();
        } else {
          alert("Failed to delete module.");
        }
      })
      .catch((err) => alert("Error deleting module: " + err));
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-r p-8 flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-extrabold text-dark-1 tracking-wide">
            Manage <span className="text-light-2">Modules</span>
          </h1>
          <button
            onClick={() => router.push("/module/create")}
            className="flex items-center gap-3 px-6 py-3 bg-light-2 text-white rounded-full shadow-md hover:bg-light-1 transition ease-in-out duration-300 transform hover:scale-105"
          >
            <Plus className="w-6 h-6" />
            Create Module
          </button>
        </div>

        {/* Module List */}
        <div className="bg-white shadow-lg rounded-2xl p-8">
          <h2 className="text-2xl font-semibold text-dark-1 mb-6">
            Modules List
          </h2>
          {modules.length === 0 ? (
            <p className="text-gray-500 text-lg">
              No modules found. Create one above!
            </p>
          ) : (
            <ul className="space-y-6">
              {modules.map((module) => (
                <li
                  key={module.id}
                  className="flex justify-between items-center p-4 bg-gray-50 hover:bg-gray-100 rounded-lg shadow-md cursor-pointer transform transition-transform hover:scale-105"
                  onClick={() => router.push(`/module/${module.id}`)} // Redirect to module details page
                >
                  <div>
                    <h3 className="text-xl font-semibold text-dark-1">
                      {module.name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      <strong>Code:</strong> {module.code}
                    </p>
                    {module.description && (
                      <p className="text-sm text-gray-500 mt-2">
                        {module.description}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent triggering the click event on the list item
                      deleteModule(module.id);
                    }}
                    className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-full text-sm shadow-md transition-all duration-300 transform hover:scale-105"
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default ModulePage;
