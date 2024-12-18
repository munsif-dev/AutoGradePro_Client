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
      .delete(`/api/module/${id}/`)
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
      <div className="min-h-screen border-l-2 ml-2 p-6 flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-dark-1">
            Manage <strong className="text-light-2">Modules</strong>
          </h1>
          <button
            onClick={() => router.push("/module/create")}
            className="flex items-center gap-2 px-4 py-2 bg-light-2 hover:bg-light-1 text-white rounded-full"
          >
            <Plus className="w-5 h-5" />
            Create Module
          </button>
        </div>

        {/* Module List */}
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-xl font-semibold text-dark-1 mb-4">
            Modules List
          </h2>
          {modules.length === 0 ? (
            <p className="text-gray-500">No modules found. Create one above!</p>
          ) : (
            <ul className="divide-y divide-gray-200">
              {modules.map((module) => (
                <li
                  key={module.id}
                  className="flex items-center justify-between py-4"
                  onClick={() => router.push(`/module/${module.id}`)} // Redirect to module details page
                >
                  <div>
                    <h3 className="text-lg font-semibold text-dark-1">
                      {module.name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      <strong>Code:</strong> {module.code}
                    </p>
                    {module.description && (
                      <p className="text-sm text-gray-500">
                        {module.description}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => deleteModule(module.id)}
                    className="bg-red-500 hover:bg-red-600 text-white py-1 px-3 rounded-full text-sm"
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
