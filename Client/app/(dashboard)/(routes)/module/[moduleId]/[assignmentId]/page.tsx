"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import api from "@/lib/api";
import ProtectedRoute from "@/app/_components/ProtectedRoutes";
import BackButton from "@/app/(dashboard)/_components/BackButton";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  Search,
  Download,
  FileText,
  Calendar,
  AlertCircle,
  Trash2,
  FileUp,
  CheckSquare,
  BarChart2,
} from "lucide-react";
import * as XLSX from "xlsx";

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
  const [passScore, setPassScore] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (assignmentId) {
      fetchAssignmentDetails();
      fetchUploadedFiles();
      fetchMarkingScheme();
    }
  }, [assignmentId]);

  const fetchAssignmentDetails = () => {
    if (!assignmentId) return;
    setIsLoading(true);
    api
      .get(`/api/assignment/${assignmentId}/`)
      .then((res) => {
        setAssignment(res.data);
        setIsLoading(false);
      })
      .catch((err) => {
        toast.error("Failed to fetch assignment details");
        setIsLoading(false);
      });
  };

  const fetchUploadedFiles = () => {
    if (!assignmentId) return;
    api
      .get(`/api/submission/${assignmentId}/files/`)
      .then((res) => setUploadedFiles(res.data))
      .catch((err) => toast.error("Failed to fetch uploaded files"));
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
      setPassScore(pass_score ?? 40);
    } catch (error) {
      console.error("Error fetching marking scheme:", error);
      setPassScore(40);
    }
  };

  const deleteFile = (fileId: number) => {
    if (confirm("Are you sure you want to delete this file?")) {
      api
        .delete(`/api/submission/${assignmentId}/delete-file/${fileId}/`)
        .then((res) => {
          toast.success("File deleted successfully!");
          fetchUploadedFiles();
        })
        .catch((err) => toast.error("Failed to delete file"));
    }
  };

  const gradeSubmissions = () => {
    if (!assignmentId) return;

    toast.info("Grading answers, please wait...", {
      position: "top-right",
      autoClose: 3000,
      closeOnClick: false,
      pauseOnHover: false,
    });

    api
      .put(`/api/submission/${assignmentId}/grade/`)
      .then((res) => {
        const updatedScores = res.data;
        setUploadedFiles((prevFiles) =>
          prevFiles.map((file) => {
            const updatedScore = updatedScores.find(
              (scoreObj: { id: number }) => scoreObj.id === file.id
            );
            return updatedScore ? { ...file, score: updatedScore.score } : file;
          })
        );

        toast.success("Answers are graded successfully!");
      })
      .catch((err) => toast.error("Failed to grade submissions"));
  };

  // Filter files based on search query
  const filteredFiles = uploadedFiles.filter((file) =>
    file.file_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Function to export files to Excel
  const exportToExcel = () => {
    const fileData = uploadedFiles.map((file) => ({
      "File Name": file.file_name,
      "Uploaded At": new Date(file.uploaded_at).toLocaleString(),
      Score: file.score !== undefined ? file.score : "Not graded",
      Status:
        file.score !== undefined
          ? file.score >= passScore
            ? "Pass"
            : "Fail"
          : "N/A",
    }));

    const worksheet = XLSX.utils.json_to_sheet(fileData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Submissions");

    // Generate Excel file
    const assignmentName = assignment?.title || "Assignment";
    XLSX.writeFile(workbook, `${assignmentName}_submissions.xlsx`);
  };

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex flex-col p-8">
          <div className="flex gap-4 items-center mb-6">
            <BackButton />
          </div>
          <div className="w-full h-64 flex justify-center items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen flex flex-col p-8">
        {/* Header Section */}
        <div className="flex gap-4 items-center mb-6">
          <BackButton />
        </div>

        {assignment ? (
          <>
            {/* Assignment Details Card */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h1 className="text-3xl font-bold text-gray-800 mb-4">
                {assignment.title}
              </h1>

              <div className="flex items-center text-gray-600 mb-4">
                <Calendar className="w-5 h-5 mr-2 text-purple-500" />
                <span>
                  Due: {new Date(assignment.due_date).toLocaleString()}
                </span>
              </div>

              {assignment.description && (
                <div className="bg-purple-50 p-4 rounded-md border border-purple-100 mb-4">
                  <p className="text-gray-700">{assignment.description}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 mt-4">
                <button
                  onClick={() =>
                    router.push(
                      `/module/${moduleId}/${assignmentId}/uploadAnswers`
                    )
                  }
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition"
                >
                  <FileUp className="w-4 h-4" />
                  Upload Answers
                </button>

                <button
                  onClick={() =>
                    router.push(
                      `/module/${moduleId}/${assignmentId}/markingScheme`
                    )
                  }
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                >
                  <CheckSquare className="w-4 h-4" />
                  Make Marking Scheme
                </button>

                <button
                  onClick={gradeSubmissions}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition"
                >
                  <FileText className="w-4 h-4" />
                  Grade
                </button>

                <button
                  onClick={() =>
                    router.push(`/module/${moduleId}/${assignmentId}/report`)
                  }
                  className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 transition"
                >
                  <BarChart2 className="w-4 h-4" />
                  Report
                </button>

                <button
                  onClick={exportToExcel}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition"
                >
                  <Download className="w-4 h-4" />
                  Export to Excel
                </button>
              </div>
            </div>

            {/* Uploaded Files Section */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-800">
                  Uploaded Files
                </h2>

                {/* Search Bar */}
                <div className="relative w-full max-w-xs">
                  <input
                    type="text"
                    placeholder="Search files..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                </div>
              </div>

              {filteredFiles.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          File Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Uploaded At
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Score
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredFiles.map((file) => (
                        <tr key={file.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div
                              onClick={() =>
                                router.push(
                                  `/module/${moduleId}/${assignmentId}/${file.id}/`
                                )
                              }
                              className="text-blue-600 hover:underline cursor-pointer flex items-center"
                            >
                              <FileText className="w-4 h-4 mr-2" />
                              {file.file_name}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(file.uploaded_at).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {file.score !== undefined ? (
                              <span
                                className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                  file.score >= passScore
                                    ? "bg-green-100 text-green-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {file.score} / 100
                              </span>
                            ) : (
                              <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                                Not graded
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => deleteFile(file.id)}
                              className="text-red-600 hover:text-red-900 flex items-center"
                            >
                              <Trash2 className="w-4 h-4 mr-1" />
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <AlertCircle className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">
                    {uploadedFiles.length === 0
                      ? "No files uploaded yet."
                      : "No files match your search."}
                  </p>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <p className="text-gray-500">
              Assignment not found or failed to load.
            </p>
          </div>
        )}
      </div>
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
      />
    </ProtectedRoute>
  );
};

export default AssignmentDetailPage;
