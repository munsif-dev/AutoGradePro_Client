"use client";
import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import api from "@/lib/api";
import ProtectedRoute from "@/app/_components/ProtectedRoutes";
import BackButton from "@/app/(dashboard)/_components/BackButton";

const ModuleEditPage = () => {
  const { id } = useParams();
  const [module, setModule] = useState({
    name: "",
    code: "",
    description: "",
  });
  const router = useRouter();

  useEffect(() => {
    fetchModule();
  }, []);

  const fetchModule = () => {
    api
      .get(`/api/module/${id}/`)
      .then((res) => setModule(res.data))
      .catch((err) => toast.error("Failed to fetch module: " + err));
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setModule({ ...module, [name]: value });
  };

  const updateModule = () => {
    api
      .put(`/api/module/edit/${id}/`, module)
      .then((res) => {
        toast.success("Module updated successfully!");
        setTimeout(() => {
          router.push("/module"); // Redirect after a brief delay
        }, 2000); // Delay to allow toast to be visible
      })
      .catch((err) => toast.error("Error updating module: " + err));
  };

  return (
    <ProtectedRoute>
      <div className="flex gap-4 items-center m-4">
        <BackButton /> {/* Add the back button here */}
      </div>
      <div className="min-h-screen bg-gradient-to-r p-8 flex flex-col max-w-3xl mx-auto">
        <h1 className="text-4xl font-extrabold text-dark-1 tracking-wide mb-4">
          Edit <span className="text-light-2">Module</span>
        </h1>

        <div className="bg-white shadow-lg rounded-2xl p-8">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              updateModule();
            }}
          >
            <div className="mb-4">
              <label className="block text-gray-700">Module Name</label>
              <input
                type="text"
                name="name"
                value={module.name}
                onChange={handleChange}
                className="mt-2 p-2 w-full border border-gray-300 rounded-md"
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700">Module Code</label>
              <input
                type="text"
                name="code"
                value={module.code}
                onChange={handleChange}
                className="mt-2 p-2 w-full border border-gray-300 rounded-md"
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700">Description</label>
              <textarea
                name="description"
                value={module.description}
                onChange={handleChange}
                className="mt-2 p-2 w-full border border-gray-300 rounded-md"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-3 bg-light-2 text-white rounded-full shadow-md hover:bg-light-1 transition ease-in-out duration-300 transform hover:scale-105"
            >
              Update Module
            </button>
          </form>
        </div>
      </div>

      {/* Toast Container */}
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </ProtectedRoute>
  );
};

export default ModuleEditPage;
