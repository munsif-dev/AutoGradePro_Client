"use client";

import React, { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import api from "@/lib/api";

const CreateAssignmentPage = () => {
  const [newAssignment, setNewAssignment] = useState({
    title: "",
    description: "",
    due_date: "",
  });

  const router = useRouter();
  const { moduleId } = useParams(); // Get the moduleId from the router params

  console.log(moduleId); // This should log the moduleId to the console

  const handleCreateAssignment = (e: React.FormEvent) => {
    e.preventDefault();

    const assignmentData = {
      title: newAssignment.title,
      description: newAssignment.description,
      due_date: newAssignment.due_date || null,
      module_id: moduleId, // Using moduleId directly from the router
    };

    api
      .post(`/api/assignment/`, assignmentData)
      .then((res) => {
        if (res.status === 201) {
          alert("Assignment created successfully!");
          router.push(`/module/${moduleId}`); // Redirect to the module details page after successful creation
        }
      })
      .catch((err) => alert("Error creating assignment: " + err));
  };

  return (
    <div className="min-h-screen p-6">
      <h1 className="text-3xl font-bold mb-4">Create New Assignment</h1>
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
          <label className="text-sm font-medium text-gray-700">Due Date</label>
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
    </div>
  );
};

export default CreateAssignmentPage;
