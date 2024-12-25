"use client";
import ProtectedRoute from "@/app/_components/ProtectedRoutes";
import React, { useState, useEffect } from "react";
import api from "@/lib/api";

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
    module: Module; // Include module details in the assignment
  }

  const [module, setModule] = useState<Module[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState("asc");

  // Fetch assignments
  useEffect(() => {
    fetchAssignments();
  }, [searchQuery, sortBy, sortOrder]);

  const fetchAssignments = async () => {
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
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen border-l-2 ml-2 p-6 flex-col">
        <h1 className="text-3xl font-bold mb-6 text-center text-dark-1">
          Your <strong className="text-light-2">Assignments</strong>
        </h1>

        {/* Search and Sorting */}
        <div className="flex flex-wrap gap-4 justify-between items-center mb-6">
          <input
            type="text"
            placeholder="Search assignments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border rounded px-4 py-2 w-full sm:w-1/3"
          />

          <div className="flex gap-2 items-center">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="border rounded px-4 py-2"
            >
              <option value="created_at">Date Created</option>
              <option value="title">Title</option>
            </select>

            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="border rounded px-4 py-2"
            >
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </select>
          </div>
        </div>

        {/* Assignments List */}
        <div className="space-y-4">
          {assignments.length > 0 ? (
            assignments.map((assignment) => (
              <div
                key={assignment.id}
                className="bg-white border rounded-lg shadow p-4"
              >
                <h2 className="text-xl font-semibold text-dark-1">
                  {assignment.title}
                </h2>

                <p className="text-sm text-gray-600">
                  {assignment.description}
                </p>

                {/* Module Info */}
                <div className="mt-4 p-2 bg-gray-100 rounded-lg">
                  <h3 className="font-semibold text-lg text-dark-2">Module</h3>
                  <p className="text-sm text-gray-600">
                    <strong>Name:</strong> {assignment.module.name}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Description:</strong>{" "}
                    {assignment.module.description}
                  </p>
                </div>

                <p className="text-xs text-gray-400 mt-2">
                  Created on: {new Date(assignment.created_at).toLocaleString()}
                </p>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-600">No assignments found.</p>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default Page;
