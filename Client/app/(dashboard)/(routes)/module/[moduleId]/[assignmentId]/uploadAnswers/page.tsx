"use client";

import React, { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import api from "@/lib/api";
import ProtectedRoute from "@/app/_components/ProtectedRoutes";
import BackButton from "@/app/(dashboard)/_components/BackButton";

const UploadAnswersPage = () => {
  const router = useRouter();
  const { moduleId, assignmentId } = useParams();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileDrop = (files: FileList) => {
    const newFiles = Array.from(files);
    setSelectedFiles((prev) => {
      const updatedFiles = [...prev];
      newFiles.forEach((newFile) => {
        const existingIndex = updatedFiles.findIndex(
          (file) => file.name === newFile.name
        );
        if (existingIndex !== -1) {
          updatedFiles[existingIndex] = newFile; // Replace existing file
        } else {
          updatedFiles.push(newFile); // Add new file
        }
      });
      return updatedFiles;
    });
  };

  const handleFileUpload = () => {
    if (selectedFiles.length === 0) {
      alert("No files selected.");
      return;
    }

    const formData = new FormData();
    selectedFiles.forEach((file) => {
      formData.append("files", file);
      formData.append("file_names", file.name);
    });

    api
      .post(`/api/submission/${assignmentId}/upload/`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then(() => {
        alert("Files uploaded successfully!");
        setSelectedFiles([]);
        router.push(`/module/${moduleId}/${assignmentId}`);
      })
      .catch((err) => alert("Failed to upload files: " + err));
  };

  const removeFileFromSelection = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <ProtectedRoute>
      <div className="flex gap-4 items-center m-4">
        <BackButton /> {/* Add the back button here */}
      </div>
      <div className="min-h-screen p-6 flex flex-col gap-6 items-center ">
        <h1 className="text-4xl font-bold text-custom-purple mb-4">
          Upload Answers
        </h1>

        {/* Enhanced Drag-and-Drop Section */}
        <div
          className={`relative p-8 rounded-lg w-3/4   shadow-lg border-4 ${
            isDragging
              ? "border-light-1 bg-light-3"
              : "border-light-2 bg-gray-50"
          } transition-all duration-300 ease-in-out cursor-pointer hover:shadow-xl hover:bg-purple-100 group`}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            if (e.dataTransfer.files) {
              handleFileDrop(e.dataTransfer.files);
            }
          }}
          onClick={() => document.getElementById("file-input")?.click()}
        >
          <div className="text-center">
            <svg
              className="mx-auto w-16 h-16 text-light-2 group-hover:text-custom-purple transition-colors duration-300"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4v16m8-8H4"
              />
            </svg>
            <p className="text-lg font-medium text-light-2 group-hover:text-custom-purple transition-colors duration-300">
              Drag and drop files here or click to upload
            </p>
            <p className="text-sm text-gray-400">
              Supported formats: PDF, DOCX, PNG, JPG
            </p>
          </div>
        </div>

        {/* Hidden File Input */}
        <input
          id="file-input"
          type="file"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files) {
              handleFileDrop(e.target.files);
            }
          }}
        />

        {selectedFiles.length > 0 && (
          <div className="mt-6 w-3/4">
            <h3 className="text-xl font-semibold text-light-2 mb-2">
              Files Selected for Upload:
            </h3>

            <ul className="divide-y divide-gray-200 bg-white shadow-md rounded-lg">
              {selectedFiles.map((file, index) => (
                <li
                  key={index}
                  className="flex justify-between items-center py-3 px-4 hover:bg-light-3 rounded-lg transition-all duration-200 ease-in-out"
                >
                  <div className="flex items-center">
                    <span className="text-light-2 font-medium">
                      {file.name}
                    </span>
                    <span className="ml-4 text-sm text-gray-500">
                      ({(file.size / 1024).toFixed(2)} KB)
                    </span>
                  </div>
                  <button
                    onClick={() => removeFileFromSelection(index)}
                    className="bg-custom-purple hover:bg-light-1 text-white py-1 px-3 rounded-full text-sm shadow-md transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-light-1 focus:ring-offset-2"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {selectedFiles.length > 0 && (
          <div className="mt-6 flex justify-end">
            <button
              onClick={handleFileUpload}
              className="px-6 py-3 text-sm bg-gradient-to-r from-custom-purple to-light-1 hover:from-light-2 hover:to-light-1 text-white font-semibold rounded-full shadow-lg transform transition duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-light-2 focus:ring-offset-2"
            >
              Upload All
            </button>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
};

export default UploadAnswersPage;
