// app/module/[moduleId]/assignment/[assignmentId]/uploadAnswers.tsx

"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import api from "@/lib/api";
import ProtectedRoute from "@/app/_components/ProtectedRoutes";

const UploadAnswersPage = () => {
  const router = useRouter();
  const { moduleId, assignmentId } = useParams();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const handleFileUpload = () => {
    if (selectedFiles.length === 0) {
      alert("No files selected.");
      return;
    }

    const formData = new FormData();
    selectedFiles.forEach((file) => {
      formData.append("files", file); // Add the file itself
      formData.append("file_names", file.name); // Add the file name explicitly
    });

    api
      .post(`api/submission/${assignmentId}/upload/`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((res) => {
        alert("Files uploaded successfully!");
        setSelectedFiles([]); // Clear selected files after successful upload
        router.push(`/module/${moduleId}/${assignmentId}`);
      })
      .catch((err) => alert("Failed to upload files: " + err));
  };

  const removeFileFromSelection = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen p-6">
        <h1 className="text-4xl font-bold text-dark-1 mb-4">Upload Answers</h1>

        {/* File Upload Section */}
        <div className="mt-6">
          <h2 className="text-2xl font-semibold text-dark-1 mb-4">
            Upload Files
          </h2>
          <input
            type="file"
            multiple
            onChange={(e) => {
              if (e.target.files) {
                const newFiles = Array.from(e.target.files);
                setSelectedFiles((prev) => {
                  const updatedFiles = [...prev];
                  newFiles.forEach((newFile) => {
                    const existingIndex = updatedFiles.findIndex(
                      (file) => file.name === newFile.name
                    );
                    if (existingIndex !== -1) {
                      // Replace the existing file
                      updatedFiles[existingIndex] = newFile;
                    } else {
                      // Add new file
                      updatedFiles.push(newFile);
                    }
                  });
                  return updatedFiles;
                });
              }
            }}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200"
          />

          {selectedFiles.length > 0 && (
            <div className="mt-4">
              <h3 className="text-xl font-semibold text-gray-700 mb-2 flex items-center justify-between">
                Files Selected for Upload:
                <button
                  onClick={handleFileUpload}
                  className="hidden md:block px-6 py-3 text-sm bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold rounded-full shadow-lg transform transition duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
                >
                  Upload All
                </button>
              </h3>

              <ul className="divide-y divide-gray-200 bg-white shadow-md rounded-lg">
                {selectedFiles.map((file, index) => (
                  <li
                    key={index}
                    className="flex justify-between items-center py-3 px-4 hover:bg-blue-50 rounded-lg transition-all duration-200 ease-in-out"
                  >
                    <div className="flex items-center">
                      <span className="text-gray-800 font-medium">
                        {file.name}
                      </span>
                      <span className="ml-4 text-sm text-gray-500">
                        ({(file.size / 1024).toFixed(2)} KB)
                      </span>
                    </div>
                    <button
                      onClick={() => removeFileFromSelection(index)}
                      className="bg-red-500 hover:bg-red-600 text-white py-1 px-3 rounded-full text-sm shadow-md transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default UploadAnswersPage;
