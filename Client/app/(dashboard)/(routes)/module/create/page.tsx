"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

const CreateModule = () => {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const router = useRouter();

  const handleCreateModule = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    api
      .post("/api/module/", { name, code, description })
      .then((res) => {
        if (res.status === 201) {
          alert("Module created successfully!");
          router.push("/module"); // Redirect to modules page
        } else {
          alert("Failed to create module.");
        }
      })
      .catch((err) => alert("Error creating module: " + err));
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="bg-white shadow-md rounded-lg p-6 w-full max-w-lg">
        <h1 className="text-2xl font-bold text-dark-1 mb-4 text-center">
          Create a <strong className="text-light-2">Module</strong>
        </h1>
        <form onSubmit={handleCreateModule} className="space-y-4">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700"
            >
              Module Name
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2 px-3 focus:ring-light-2 focus:border-light-2 sm:text-sm"
              required
            />
          </div>
          <div>
            <label
              htmlFor="code"
              className="block text-sm font-medium text-gray-700"
            >
              Module Code
            </label>
            <input
              type="text"
              id="code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2 px-3 focus:ring-light-2 focus:border-light-2 sm:text-sm"
              required
            />
          </div>
          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700"
            >
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2 px-3 focus:ring-light-2 focus:border-light-2 sm:text-sm"
              placeholder="Optional"
            ></textarea>
          </div>
          <button
            type="submit"
            className="mt-4 w-full px-6 py-2 bg-light-2 hover:bg-light-1 text-white rounded-full"
          >
            Create Module
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateModule;
