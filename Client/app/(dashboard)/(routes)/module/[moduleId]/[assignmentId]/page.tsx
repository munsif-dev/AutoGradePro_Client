"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import api from "@/lib/api";
import ProtectedRoute from "@/app/_components/ProtectedRoutes";
import BackButton from "@/app/(dashboard)/_components/BackButton";
import { toast, ToastContainer } from "react-toastify"; // Import toastify
import "react-toastify/dist/ReactToastify.css"; // Import toast styles

interface AssignmentDetail {
  id: number;
  title: string;
  description?: string;
  due_date: string;
  uploaded_files: FileDetail[];
}

interface FileDetail {
  id: number;
  assignment: number;
  file: string; // URL of the file
  file_name: string; // Name of the file
  uploaded_at: string;
  score?: number; // Score of the file, optional
}
const AssignmentDetailPage = () => {
  const router = useRouter();
  const { moduleId, assignmentId } = useParams();

  const [assignment, setAssignment] = useState<AssignmentDetail | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<FileDetail[]>([]);
  const [passScore, setPassScore] = useState<number>(0);

  useEffect(() => {
    if (assignmentId) {
      fetchAssignmentDetails();
      fetchUploadedFiles(); // Fetch the uploaded files
      fetchMarkingScheme(); // Fetch the marking scheme
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
      .get(`/api/submission/${assignmentId}/files/`)
      .then((res) => setUploadedFiles(res.data))
      .catch((err) => alert("Failed to fetch uploaded files: " + err));
  };

  const fetchMarkingScheme = async () => {
    if (!assignmentId) {
      console.warn("Assignment ID is not provided.");
      return;
    }

    try {
      const response = await api.get(
        `/api/assignment/${assignmentId}/marking-scheme/detail/`
      );
      const { pass_score } = response.data;
      setPassScore(pass_score ?? 40); // Use nullish coalescing to handle undefined/null values
    } catch (error) {
      console.error("Error fetching marking scheme:", error);
      setPassScore(40);
    }
  };

  const deleteFile = (fileId: number) => {
    api
      .delete(`/api/submission/${assignmentId}/delete-file/${fileId}/`)
      .then((res) => {
        alert("File deleted successfully!");
        fetchUploadedFiles(); // Refresh uploaded files after deletion
      })
      .catch((err) => alert("Failed to delete file: " + err));
  }; //for deleting the file

  const gradeSubmissions = () => {
    console.log("Grading submissions for assignment ID:", assignmentId);

    if (!assignmentId) return;

    toast.info("Grading answers, please wait...", {
      position: "top-right",
      autoClose: false, // Keep it open until grading is complete
      closeOnClick: false,
      pauseOnHover: false,
    });

    api
      .put(`/api/submission/${assignmentId}/grade/`)
      .then((res) => {
        const updatedScores = res.data; // Contains only the scores
        setUploadedFiles((prevFiles) =>
          prevFiles.map((file) => {
            const updatedScore = updatedScores.find(
              (scoreObj: { id: number }) => scoreObj.id === file.id
            );
            return updatedScore ? { ...file, score: updatedScore.score } : file;
          })
        );

        toast.success("Answers are graded successfully!", {
          position: "top-right",
          autoClose: 5000,
        });
      })
      .catch((err) => alert("Failed to grade submissions: " + err));
  };

  return (
    <ProtectedRoute>
      <div className="flex gap-4 items-center m-4 mb-0">
        <BackButton /> {/* Add the back button here */}
      </div>
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
            <div className="mt-6 flex justify-between space-x-8">
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
                onClick={() =>
                  router.push(
                    `/module/${moduleId}/${assignmentId}/markingScheme`
                  )
                }
              >
                Make Marking Scheme
              </button>
              <button
                className="flex-1 px-4 py-3 bg-[#a6f1c7] text-gray-800 rounded-lg shadow hover:bg-[#8ae3ab] transition text-center"
                onClick={gradeSubmissions}
              >
                Grade
              </button>
              <button
                className="flex-1 px-4 py-3 bg-[#ffe066] text-gray-800 rounded-lg shadow hover:bg-[#ffd13f] transition text-center"
                onClick={() =>
                  router.push(`/module/${moduleId}/${assignmentId}/report`)
                }
              >
                Report
              </button>
            </div>

            {/* Uploaded Files */}
            <div className="mt-8">
              <h2 className="text-2xl font-semibold text-dark-1 mb-4">
                Uploaded Files
              </h2>
              {uploadedFiles.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 bg-white shadow-md rounded-lg">
                    <thead className="bg-gray-50">
                      <tr>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          File Name
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Uploaded At
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Score
                        </th>
                        <th scope="col" className="relative px-6 py-3">
                          <span className="sr-only">Delete</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {uploadedFiles.map((file) => (
                        <tr
                          key={file.id}
                          className="hover:bg-gray-100 transition"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <a
                              onClick={() =>
                                router.push(
                                  `/module/${moduleId}/${assignmentId}/${file.id}/`
                                )
                              }
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                            >
                              {file.file_name}
                            </a>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(file.uploaded_at).toLocaleString()}
                          </td>
                          <td
                            className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${
                              file.score !== undefined && file.score < passScore
                                ? "text-red-600"
                                : "text-green-600"
                            }`}
                          >
                            {file.score !== undefined
                              ? file.score
                              : "Not graded"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => deleteFile(file.id)}
                              className="bg-red-500 hover:bg-red-600 text-white py-1 px-4 rounded-full text-sm transition"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
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
