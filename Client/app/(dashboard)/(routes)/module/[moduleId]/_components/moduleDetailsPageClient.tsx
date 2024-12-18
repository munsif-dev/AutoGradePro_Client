"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import ProtectedRoute from "@/app/_components/ProtectedRoutes";

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
  const [newAssignment, setNewAssignment] = useState({
    title: "",
    description: "",
    due_date: "",
  });

  const router = useRouter();

  useEffect(() => {
    fetchModuleDetails();
    fetchAssignments();
  }, [moduleId]);

  const fetchModuleDetails = () => {
    api
      .get(`/api/module/`) // Updated to fetch details for the specific module
      .then((res) => setModule(res.data))
      .catch((err) => alert("Failed to fetch module details: " + err));
  };

  const fetchAssignments = () => {
    api
      .get(`/api/assignment/list/`, { params: { module_id: moduleId } }) // Added query param to filter by module_id
      .then((res) => setAssignments(res.data))
      .catch((err) => alert("Failed to fetch assignments: " + err));
  };

  const handleCreateAssignment = (e: React.FormEvent) => {
    e.preventDefault();

    const assignmentData = {
      title: newAssignment.title,
      description: newAssignment.description,
      due_date: newAssignment.due_date || null,
      module_id: moduleId,
    };

    api
      .post(`/api/assignment/`, assignmentData)
      .then((res) => {
        if (res.status === 201) {
          alert("Assignment created successfully!");
          setNewAssignment({ title: "", description: "", due_date: "" });
          fetchAssignments(); // Refresh the assignments after creating a new one
        }
      })
      .catch((err) => alert("Error creating assignment: " + err));
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

  return (
    <ProtectedRoute>
      <div className="min-h-screen p-6">
        {module && (
          <>
            <h1 className="text-3xl font-bold">{module.name}</h1>
            <p className="text-sm text-gray-500">{module.code}</p>
            <p className="mt-4">{module.description}</p>

            <div className="mt-8">
              <h2 className="text-xl font-semibold mb-4">Assignments</h2>
              <form onSubmit={handleCreateAssignment} className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Assignment Title
                  </label>
                  <input
                    type="text"
                    className="w-full border-gray-300 p-2 rounded-md"
                    value={newAssignment.title}
                    onChange={(e) =>
                      setNewAssignment({
                        ...newAssignment,
                        title: e.target.value,
                      })
                    }
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <textarea
                    className="w-full border-gray-300 p-2 rounded-md"
                    value={newAssignment.description}
                    onChange={(e) =>
                      setNewAssignment({
                        ...newAssignment,
                        description: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Due Date
                  </label>
                  <input
                    type="datetime-local"
                    className="w-full border-gray-300 p-2 rounded-md"
                    value={newAssignment.due_date}
                    onChange={(e) =>
                      setNewAssignment({
                        ...newAssignment,
                        due_date: e.target.value,
                      })
                    }
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="mt-4 px-4 py-2 bg-light-2 text-white rounded-full"
                >
                  Create Assignment
                </button>
              </form>

              <ul className="mt-6 divide-y divide-gray-200">
                {assignments.length > 0 ? (
                  assignments.map((assignment) => (
                    <li
                      key={assignment.id}
                      className="flex justify-between items-center py-3"
                    >
                      <div>
                        <h3 className="font-semibold">{assignment.title}</h3>
                        {assignment.description && (
                          <p className="text-sm text-gray-500">
                            {assignment.description}
                          </p>
                        )}
                        <p className="text-sm text-gray-400">
                          Due: {new Date(assignment.due_date).toLocaleString()}
                        </p>
                      </div>
                      <button
                        onClick={() => deleteAssignment(assignment.id)}
                        className="bg-red-500 hover:bg-red-600 text-white py-1 px-3 rounded-full text-sm"
                      >
                        Delete
                      </button>
                    </li>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No assignments found.</p>
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
