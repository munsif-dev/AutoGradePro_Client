"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import ProtectedRoute from "@/app/_components/ProtectedRoutes";
import { Plus } from "lucide-react";

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

  const router = useRouter();

  useEffect(() => {
    fetchModuleDetails();
    fetchAssignments();
  }, [moduleId]);

  const fetchModuleDetails = () => {
    api
      .get(`/api/module/${moduleId}/`) // Fetch module details
      .then((res) => setModule(res.data))
      .catch((err) => alert("Failed to fetch module details: " + err));
  };

  const fetchAssignments = () => {
    api
      .get(`/api/assignment/list/`, { params: { module_id: moduleId } }) // Filter assignments by module_id
      .then((res) => setAssignments(res.data))
      .catch((err) => alert("Failed to fetch assignments: " + err));
  };

  const deleteAssignment = (id: number) => {
    api
      .delete(`/api/assignment/${id}/`)
      .then((res) => {
        if (res.status === 204) {
          alert("Assignment deleted successfully!");
          fetchAssignments(); // Refresh the assignments after deleting
        }
      })
      .catch((err) => alert("Error deleting assignment: " + err));
  };

  const handleCreateAssignment = () => {
    // Navigate to the assignment creation page
    router.push(`/module/${moduleId}/create-assignment`);
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen p-6">
        {/* Module Header */}
        {module && (
          <>
            <div className="relative mb-8">
              <h1 className="text-4xl font-bold text-dark-1">{module.name}</h1>
              <p className="text-lg text-gray-600 mt-2">{module.code}</p>
              {module.description && (
                <p className="text-base text-gray-500 mt-4">
                  {module.description}
                </p>
              )}

              {/* Button to Add Assignment, positioned at the top right */}
              <button
                onClick={handleCreateAssignment}
                className="absolute top-0 right-0 mt-4 mr-3 w-[auto] px-3 py-2 bg-light-2 text-white rounded-full shadow-lg hover:bg-light-1 transition flex items-center space-x-2"
              >
                <Plus className="w-5 h-5" />
                <span>Add Assignment</span>
              </button>
            </div>

            {/* Assignments List */}
            <div className="bg-white shadow-md rounded-lg p-6">
              <h2 className="text-2xl font-semibold text-dark-1 mb-4">
                Assignments
              </h2>
              <ul className="divide-y divide-gray-200">
                {assignments.length > 0 ? (
                  assignments.map((assignment) => (
                    <li
                      key={assignment.id}
                      className="flex justify-between items-center py-4 hover:bg-gray-100 rounded-lg transition cursor-pointer"
                      onClick={() =>
                        router.push(`/module/${moduleId}/${assignment.id}`)
                      } // Navigate to specific assignment page
                    >
                      <div>
                        <h3 className="font-semibold text-dark-1">
                          {assignment.title}
                        </h3>
                        {assignment.description && (
                          <p className="text-sm text-gray-500 mt-1">
                            {assignment.description}
                          </p>
                        )}
                        <p className="text-sm text-gray-400 mt-1">
                          Due: {new Date(assignment.due_date).toLocaleString()}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent triggering the parent click event
                          deleteAssignment(assignment.id);
                        }}
                        className="bg-red-500 hover:bg-red-600 text-white py-1 px-4 rounded-full text-sm transition"
                      >
                        Delete
                      </button>
                    </li>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No assignments found.
                  </p>
                )}
              </ul>
            </div>
          </>
        )}
      </div>
    </ProtectedRoute>
  );
};

export default ModuleDetailsPageClient;
