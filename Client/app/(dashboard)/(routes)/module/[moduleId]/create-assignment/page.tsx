"use client";

import React, { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { FileText, Calendar, AlignLeft, Plus } from "lucide-react";
import api from "@/lib/api";
import BackButton from "@/app/(dashboard)/_components/BackButton";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ProtectedRoute from "@/app/_components/ProtectedRoutes";

const CreateAssignmentPage = () => {
  const [newAssignment, setNewAssignment] = useState({
    title: "",
    description: "",
    due_date: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const router = useRouter();
  const { moduleId } = useParams();

  const handleCreateAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

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
          toast.success("Assignment created successfully!");
          setTimeout(() => {
            router.push(`/module/${moduleId}`);
          }, 1500);
        }
      })
      .catch((err) => {
        toast.error(`Error creating assignment: ${err.response?.data?.detail || err.message}`);
        setIsSubmitting(false);
      });
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-purple-50 p-4 md:p-8">
        <div className="flex items-center gap-4 mb-6">
          <BackButton />
          <h1 className="text-2xl md:text-3xl font-bold text-dark-1 flex items-center">
            <FileText className="w-6 h-6 mr-3 text-light-2" />
            Create New Assignment
          </h1>
        </div>

        <div className="max-w-2xl mx-auto bg-white shadow-md rounded-xl p-6 md:p-8">
          <form onSubmit={handleCreateAssignment} className="space-y-6">
            <div>
              <label 
                htmlFor="assignment-title" 
                className="block text-sm font-medium text-gray-700 mb-2 flex items-center"
              >
                <FileText className="w-4 h-4 mr-2 text-light-2" />
                Assignment Title
              </label>
              <input
                id="assignment-title"
                type="text"
                className="w-full border border-gray-300 p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-light-2 transition-all duration-300"
                value={newAssignment.title}
                onChange={(e) =>
                  setNewAssignment({
                    ...newAssignment,
                    title: e.target.value,
                  })
                }
                placeholder="Enter assignment title"
                required
              />
            </div>
            
            <div>
              <label 
                htmlFor="assignment-description" 
                className="block text-sm font-medium text-gray-700 mb-2 flex items-center"
              >
                <AlignLeft className="w-4 h-4 mr-2 text-light-2" />
                Description
              </label>
              <textarea
                id="assignment-description"
                className="w-full border border-gray-300 p-3 rounded-md min-h-[120px] focus:outline-none focus:ring-2 focus:ring-light-2 transition-all duration-300"
                value={newAssignment.description}
                onChange={(e) =>
                  setNewAssignment({
                    ...newAssignment,
                    description: e.target.value,
                  })
                }
                placeholder="Provide a brief description of the assignment (optional)"
              />
            </div>
            
            <div>
              <label 
                htmlFor="due-date" 
                className="block text-sm font-medium text-gray-700 mb-2 flex items-center"
              >
                <Calendar className="w-4 h-4 mr-2 text-light-2" />
                Due Date
              </label>
              <input
                id="due-date"
                type="datetime-local"
                className="w-full border border-gray-300 p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-light-2 transition-all duration-300"
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
            
            <div className="pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full flex items-center justify-center gap-2 px-6 py-3 bg-light-2 text-white rounded-full shadow-md transition-all duration-300 
                  ${isSubmitting ? 'cursor-not-allowed opacity-50' : 'hover:bg-light-1 hover:shadow-lg transform hover:scale-105'}`}
              >
                <Plus className="w-5 h-5" />
                {isSubmitting ? 'Creating Assignment...' : 'Create Assignment'}
              </button>
            </div>
          </form>
        </div>
        
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="colored"
        />
      </div>
    </ProtectedRoute>
  );
};

export default CreateAssignmentPage;