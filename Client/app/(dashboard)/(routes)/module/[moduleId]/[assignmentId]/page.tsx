"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import api from "@/lib/api";
import ProtectedRoute from "@/app/_components/ProtectedRoutes";

interface AssignmentDetail {
  id: number;
  title: string;
  description?: string;
  due_date: string;
  uploaded_files: FileDetail[];
}

interface FileDetail {
  id: number;
  file_name: string;
  file_url: string;
}

const AssignmentDetailPage = () => {
  const router = useRouter();
  const { moduleId, assignmentId } = useParams();

  const [assignment, setAssignment] = useState<AssignmentDetail | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<FileDetail[]>([]);

  useEffect(() => {
    if (assignmentId) {
      fetchAssignmentDetails();
      fetchUploadedFiles(); // Fetch the uploaded files
    }
  }, [assignmentId]);

  const fetchAssignmentDetails = () => {
    if (!assignmentId) return;
    api
      .get(`/api/assignment/${assignmentId}/`)
      .then((res) => setAssignment(res.data))
      .catch((err) => alert("Failed to fetch assignment details: " + err));
  };

  const fetchUploadedFiles = () => {
    if (!assignmentId) return;
    api
      .get(`/api/submission/${assignmentId}/files/`) // Using the URL to get files for the assignment
      .then((res) => setUploadedFiles(res.data))
      .catch((err) => alert("Failed to fetch uploaded files: " + err));
  };

  const deleteFile = (fileId: number) => {
    api
      .delete(`/api/assignment/${assignmentId}/delete-file/${fileId}/`)
      .then((res) => {
        alert("File deleted successfully!");
        fetchUploadedFiles(); // Refresh uploaded files after deletion
      })
      .catch((err) => alert("Failed to delete file: " + err));
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen p-6">
        {assignment ? (
          <>
            <h1 className="text-4xl font-bold text-dark-1 mb-4">
              {assignment.title}
            </h1>
            <p className="text-lg text-gray-600 mt-2">
              Due: {new Date(assignment.due_date).toLocaleString()}
            </p>
            {assignment.description && (
              <p className="text-base text-gray-500 mt-4">
                {assignment.description}
              </p>
            )}

            {/* Action Buttons */}
            <div className="mt-6 flex justify-between space-x-4">
              <button
                className="flex-1 px-4 py-3 bg-[#a3c9e6] text-gray-800 rounded-lg shadow hover:bg-[#80b6d3] transition text-center"
                onClick={() =>
                  router.push(
                    `/module/${moduleId}/${assignmentId}/uploadAnswers`
                  )
                }
              >
                Upload Answers
              </button>
              <button
                className="flex-1 px-4 py-3 bg-[#b3b3b3] text-gray-800 rounded-lg shadow hover:bg-[#999999] transition text-center"
                onClick={() => console.log("Make Marking Scheme")}
              >
                Make Marking Scheme
              </button>
              <button
                className="flex-1 px-4 py-3 bg-[#a6f1c7] text-gray-800 rounded-lg shadow hover:bg-[#8ae3ab] transition text-center"
                onClick={() => console.log("Grade")}
              >
                Grade
              </button>
              <button
                className="flex-1 px-4 py-3 bg-[#ffe066] text-gray-800 rounded-lg shadow hover:bg-[#ffd13f] transition text-center"
                onClick={() => console.log("Visualize")}
              >
                Visualize
              </button>
              <button
                className="flex-1 px-4 py-3 bg-[#d1b1e3] text-gray-800 rounded-lg shadow hover:bg-[#b897d3] transition text-center"
                onClick={() => console.log("Options")}
              >
                Options
              </button>
            </div>

            {/* Uploaded Files */}
            <div className="mt-8">
              <h2 className="text-2xl font-semibold text-dark-1 mb-4">
                Uploaded Files
              </h2>
              {uploadedFiles.length > 0 ? (
                <ul className="divide-y divide-gray-200">
                  {uploadedFiles.map((file) => (
                    <li
                      key={file.id}
                      className="flex justify-between items-center py-4 hover:bg-gray-100 rounded-lg transition"
                    >
                      <a
                        href={file.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {file.file_name}
                      </a>
                      <button
                        onClick={() => deleteFile(file.id)}
                        className="bg-red-500 hover:bg-red-600 text-white py-1 px-4 rounded-full text-sm transition"
                      >
                        Delete
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">
                  No files uploaded yet.
                </p>
              )}
            </div>
          </>
        ) : (
          <p>Loading...</p>
        )}
      </div>
    </ProtectedRoute>
  );
};

export default AssignmentDetailPage;
