"use client";
import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import api from "@/lib/api";
import ProtectedRoute from "@/app/_components/ProtectedRoutes";
import BackButton from "@/app/(dashboard)/_components/BackButton";
import { Loader2 } from "lucide-react";

const AssignmentEditPage = () => {
  const { moduleId, id } = useParams();
  const [assignment, setAssignment] = useState({
    title: "",
    description: "",
    due_date: "",
    module_id: moduleId,
  });
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchAssignment();
  }, []);

  const fetchAssignment = () => {
    setIsLoading(true);
    api
      .get(`/api/assignment/${id}/`)
      .then((res) => {
        // Format the due_date to match input datetime-local format (YYYY-MM-DDThh:mm)
        const dueDate = new Date(res.data.due_date);
        const formattedDueDate = dueDate.toISOString().slice(0, 16);
        
        setAssignment({
          ...res.data,
          due_date: formattedDueDate,
          module_id: moduleId,
        });
        setIsLoading(false);
      })
      .catch((err) => {
        toast.error("Failed to fetch assignment: " + err);
        setIsLoading(false);
      });
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setAssignment({ ...assignment, [name]: value });
  };

  const updateAssignment = () => {
    setIsLoading(true);
    api
      .put(`/api/assignment/edit/${id}/`, assignment)
      .then((res) => {
        toast.success("Assignment updated successfully!");
        setTimeout(() => {
          router.push(`/module/${moduleId}`); // Redirect after a brief delay
        }, 2000); // Delay to allow toast to be visible
      })
      .catch((err) => {
        toast.error("Error updating assignment: " + err);
        setIsLoading(false);
      });
  };

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen flex-col bg-purple-100">
        {/* Top Navigation Bar */}
        <div className="sticky top-0 z-10 bg-white shadow-md p-4 flex items-center">
          <div className="flex items-center gap-4">
            <BackButton />
            <h1 className="text-2xl pl-6 font-bold text-dark-1">
              Edit Assignment
            </h1>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-grow container mx-auto p-6 md:p-8">
          <div className="bg-white shadow-lg rounded-2xl p-8">
            {isLoading ? (
              <div className="flex justify-center items-center py-20">
                <Loader2 className="w-8 h-8 text-light-2 animate-spin" />
                <span className="ml-4 text-gray-600">Loading assignment details...</span>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  updateAssignment();
                }}
                className="space-y-6"
              >
                <div className="mb-4">
                  <label className="block text-gray-700 font-medium mb-2">Assignment Title</label>
                  <input
                    type="text"
                    name="title"
                    value={assignment.title}
                    onChange={handleChange}
                    className="mt-1 p-3 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-light-2"
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-gray-700 font-medium mb-2">Description</label>
                  <textarea
                    name="description"
                    value={assignment.description}
                    onChange={handleChange}
                    rows={4}
                    className="mt-1 p-3 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-light-2"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-gray-700 font-medium mb-2">Due Date</label>
                  <input
                    type="datetime-local"
                    name="due_date"
                    value={assignment.due_date}
                    onChange={handleChange}
                    className="mt-1 p-3 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-light-2"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-6 py-3 bg-light-2 text-white rounded-full shadow-md hover:bg-light-1 transition ease-in-out duration-300 transform hover:scale-105 disabled:opacity-70 disabled:transform-none"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 inline animate-spin" />
                      Updating...
                    </>
                  ) : (
                    "Update Assignment"
                  )}
                </button>
              </form>
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

export default AssignmentEditPage;
