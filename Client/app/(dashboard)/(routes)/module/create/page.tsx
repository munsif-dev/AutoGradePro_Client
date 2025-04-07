"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { BookOpen, Loader2 } from "lucide-react";
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
    api
      .post("/api/module/", { name, code, description })
      .then((res) => {
        if (res.status === 201) {
          toast.success("Module created successfully!");
          router.push("/module"); // Redirect to modules page
        } else {
          toast.error("Failed to create module.");
          setIsSubmitting(false);
        }
      })
      .catch((err) => {
        toast.error("Error creating module: " + err);
        setIsSubmitting(false);
      });
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-purple-100 p-6">
        <div className="max-w-2xl mx-auto">
          <div className="mb-6">
            <BackButton />
          </div>
          
          <div className="bg-white shadow-md rounded-xl p-8 w-full">
            <div className="flex items-center justify-center mb-6">
              <div className="bg-purple-100 p-4 rounded-full">
                <BookOpen className="w-8 h-8 text-light-2" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-dark-1 mb-6 text-center">
              Create a <strong className="text-light-2">Module</strong>
            </h1>
            <form onSubmit={handleCreateModule} className="space-y-6">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-dark-1"
            >
              Module Name
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:ring-2 focus:ring-light-2 focus:border-light-2 sm:text-sm"
              required
            />
          </div>
          <div>
            <label
              htmlFor="code"
              className="block text-sm font-medium text-dark-1"
            >
              Module Code
            </label>
            <input
              type="text"
              id="code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:ring-2 focus:ring-light-2 focus:border-light-2 sm:text-sm"
              required
            />
          </div>
          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-dark-1"
            >
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:ring-2 focus:ring-light-2 focus:border-light-2 sm:text-sm"
              placeholder="Optional"
            ></textarea>
          </div>
          <button
            type="submit"
            className="mt-6 w-full px-6 py-3 bg-light-2 hover:bg-light-1 text-white rounded-full flex items-center justify-center transition-colors shadow-md disabled:bg-gray-400 disabled:cursor-not-allowed"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" /> 
                Creating...
              </>
            ) : (
              "Create Module"
            )}
          </button>
        </form>
          </div>
        </div>
      </div>
      <ToastContainer position="top-right" autoClose={3000} theme="light" />
    </ProtectedRoute>
  );
};

export default CreateModule;
