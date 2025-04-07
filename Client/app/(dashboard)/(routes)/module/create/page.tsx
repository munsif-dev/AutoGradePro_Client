"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { BookOpen, Loader2, AlignLeft, Tag } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ProtectedRoute from "@/app/_components/ProtectedRoutes";
import BackButton from "../../../_components/BackButton";

const CreateModule = () => {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleCreateModule = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Validate module code format (optional, can be customized)
    const formattedCode = code.trim().toUpperCase();

    api
      .post("/api/module/", { 
        name: name.trim(), 
        code: formattedCode, 
        description: description.trim() 
      })
      .then((res) => {
        if (res.status === 201) {
          toast.success("Module created successfully!");
          // Slight delay to show toast
          setTimeout(() => {
            router.push("/module");
          }, 1500);
        } else {
          toast.error("Failed to create module.");
          setIsSubmitting(false);
        }
      })
      .catch((err) => {
        const errorMessage = err.response?.data?.detail || err.message || "An unexpected error occurred";
        toast.error(`Error creating module: ${errorMessage}`);
        setIsSubmitting(false);
      });
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-purple-50 p-4 md:p-8">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <BackButton />
            <h1 className="text-2xl md:text-3xl font-bold text-dark-1 flex items-center">
              <BookOpen className="w-6 h-6 mr-3 text-light-2" />
              Create New Module
            </h1>
          </div>
          
          <div className="bg-white shadow-md rounded-xl p-6 md:p-8 w-full">
            <form onSubmit={handleCreateModule} className="space-y-6">
              <div>
                <label 
                  htmlFor="name" 
                  className=" text-sm font-medium text-gray-700 mb-2 flex items-center"
                >
                  <BookOpen className="w-4 h-4 mr-2 text-light-2" />
                  Module Name
                </label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-gray-300 p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-light-2 transition-all duration-300"
                  placeholder="Enter module name"
                  required
                />
              </div>
              
              <div>
                <label 
                  htmlFor="code" 
                  className=" text-sm font-medium text-gray-700 mb-2 flex items-center"
                >
                  <Tag className="w-4 h-4 mr-2 text-light-2" />
                  Module Code
                </label>
                <input
                  type="text"
                  id="code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full border border-gray-300 p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-light-2 transition-all duration-300"
                  placeholder="Enter module code (e.g., CS101)"
                  required
                />
              </div>
              
              <div>
                <label 
                  htmlFor="description" 
                  className=" text-sm font-medium text-gray-700 mb-2 flex items-center"
                >
                  <AlignLeft className="w-4 h-4 mr-2 text-light-2" />
                  Description
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full border border-gray-300 p-3 rounded-md min-h-[120px] focus:outline-none focus:ring-2 focus:ring-light-2 transition-all duration-300"
                  placeholder="Provide a brief description of the module (optional)"
                ></textarea>
              </div>
              
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full flex items-center justify-center gap-2 px-6 py-3 bg-light-2 text-white rounded-full shadow-md transition-all duration-300 
                    ${isSubmitting ? 'cursor-not-allowed opacity-50' : 'hover:bg-light-1 hover:shadow-lg transform hover:scale-105'}`}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" /> 
                      Creating Module...
                    </>
                  ) : (
                    "Create Module"
                  )}
                </button>
              </div>
            </form>
          </div>
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

export default CreateModule;