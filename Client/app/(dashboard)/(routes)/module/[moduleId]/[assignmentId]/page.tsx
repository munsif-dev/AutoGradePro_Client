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
  Clock,
  AlertCircle,
  Trash2,
  FileUp,
  CheckSquare,
  BarChart2,
  BookOpen,
  Users,
  ChevronDown,
  Info,
  RefreshCw,
  Check,
  X,
  Filter,
  SortAsc,
  SortDesc,
  FileQuestion,
  ExternalLink,
} from "lucide-react";
import * as XLSX from "xlsx";
import GradingProgressModal from "@/app/(dashboard)/(routes)/module/[moduleId]/[assignmentId]/_components/GradingProgressModal";

interface AssignmentDetail {
  id: number;
  title: string;
  description?: string;
  due_date: string;
  created_at?: string;
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

interface GradingFile {
  id: number;
  file_name: string;
  status: "pending" | "grading" | "completed" | "error";
  score?: number;
}

interface GradingStats {
  totalFiles: number;
  completedFiles: number;
  totalScore: number;
  averageScore: number;
  passedFiles: number;
  failedFiles: number;
  passScore: number;
}

const AssignmentDetailPage = () => {
  const router = useRouter();
  const { moduleId, assignmentId } = useParams();

  const [assignment, setAssignment] = useState<AssignmentDetail | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<FileDetail[]>([]);
  const [passScore, setPassScore] = useState(0);
  const [hasMarkingScheme, setHasMarkingScheme] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [sortField, setSortField] = useState<
    "file_name" | "uploaded_at" | "score"
  >("uploaded_at");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // Grading progress state
  const [showGradingModal, setShowGradingModal] = useState(false);
  const [gradingFiles, setGradingFiles] = useState<GradingFile[]>([]);
  const [gradingStats, setGradingStats] = useState<GradingStats>({
    totalFiles: 0,
    completedFiles: 0,
    totalScore: 0,
    averageScore: 0,
    passedFiles: 0,
    failedFiles: 0,
    passScore: 40,
  });
  const [isGrading, setIsGrading] = useState(false);
  const [showDescription, setShowDescription] = useState(false);

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
      const { pass_score, answers } = response.data;
      setPassScore(pass_score ?? 40);
      // Check if marking scheme is configured by checking if answers exist and are not empty
      setHasMarkingScheme(answers && answers.length > 0);

      // Update grading stats with pass score
      setGradingStats((prev) => ({
        ...prev,
        passScore: pass_score ?? 40,
      }));
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

  const updateGradingProgress = (
    fileId: number,
    status: "pending" | "grading" | "completed" | "error",
    score?: number
  ) => {
    setGradingFiles((prev) =>
      prev.map((file) =>
        file.id === fileId ? { ...file, status, score } : file
      )
    );

    // Update statistics if a file has been completed
    if (status === "completed" && score !== undefined) {
      setGradingStats((prev) => {
        const newCompletedFiles = prev.completedFiles + 1;
        const newTotalScore = prev.totalScore + score;
        const newAverageScore = newTotalScore / newCompletedFiles;
        const isPassed = score >= prev.passScore;

        return {
          ...prev,
          completedFiles: newCompletedFiles,
          totalScore: newTotalScore,
          averageScore: newAverageScore,
          passedFiles: isPassed ? prev.passedFiles + 1 : prev.passedFiles,
          failedFiles: !isPassed ? prev.failedFiles + 1 : prev.failedFiles,
        };
      });
    }
  };

  // Simulation of gradual file grading for better UI feedback
  const simulateGradingProcess = async (
    files: GradingFile[]
  ): Promise<any[]> => {
    // Prepare the real API call
    const apiPromise = api.put(`/api/submission/${assignmentId}/grade/`);

    // While the real API call is happening, simulate visual progress
    for (const file of files) {
      // Update status to 'grading'
      updateGradingProgress(file.id, "grading");

      // Simulate processing time for each file (150-800ms)
      const processingTime = Math.floor(Math.random() * 650) + 150;
      await new Promise((resolve) => setTimeout(resolve, processingTime));
    }

    // Wait for the real API response
    try {
      const response = await apiPromise;
      return response.data;
    } catch (error) {
      console.error("Error grading submissions:", error);
      // Mark all files as error
      files.forEach((file) => {
        if (file.status !== "completed") {
          updateGradingProgress(file.id, "error");
        }
      });
      toast.error("Failed to grade submissions");
      throw error;
    }
  };

  const gradeSubmissions = async () => {
    if (!assignmentId || isGrading) return;

    // Initialize grading process
    setIsGrading(true);

    // Prepare grading files array from uploaded files
    const filesToGrade = uploadedFiles.map((file) => ({
      id: file.id,
      file_name: file.file_name,
      status: "pending" as const,
    }));

    // Reset grading stats
    setGradingStats({
      totalFiles: filesToGrade.length,
      completedFiles: 0,
      totalScore: 0,
      averageScore: 0,
      passedFiles: 0,
      failedFiles: 0,
      passScore: passScore,
    });

    setGradingFiles(filesToGrade);
    setShowGradingModal(true);

    try {
      // Start the simulated grading process
      const gradingResults = await simulateGradingProcess(filesToGrade);

      // Update UI with actual results from the API
      gradingResults.forEach((result: { id: number; score: number }) => {
        updateGradingProgress(result.id, "completed", result.score);
      });

      // Update the uploaded files with the new scores
      setUploadedFiles((prevFiles) =>
        prevFiles.map((file) => {
          const updatedScore = gradingResults.find(
            (scoreObj: { id: number }) => scoreObj.id === file.id
          );
          return updatedScore ? { ...file, score: updatedScore.score } : file;
        })
      );

      toast.success("Grading completed successfully!");
    } catch (err) {
      // Error handling done in simulateGradingProcess
    } finally {
      setIsGrading(false);
    }
  };

  const clearGradingResults = async () => {
    if (!assignmentId || !window.confirm("Are you sure you want to clear all grading results? This action cannot be undone.")) {
      return;
    }

    try {
      const response = await api.delete(
        `/api/assignment/${assignmentId}/clear-grading-results/`
      );
      
      // Reset scores in the UI
      setUploadedFiles(prevFiles => 
        prevFiles.map(file => ({ ...file, score: undefined }))
      );
      
      // Update stats
      setGradingStats(prevStats => ({
        ...prevStats,
        completedFiles: 0,
        totalScore: 0,
        averageScore: 0,
        passedFiles: 0,
        failedFiles: 0
      }));
      
      toast.success("Grading results cleared successfully!");
    } catch (error) {
      console.error("Error clearing grading results:", error);
      toast.error("Failed to clear grading results");
    }
  };

  // Filter files based on search query
  const filteredFiles = uploadedFiles.filter((file) =>
    file.file_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Sort files
  const sortedFiles = [...filteredFiles].sort((a, b) => {
    if (sortField === "file_name") {
      return sortDirection === "asc"
        ? a.file_name.localeCompare(b.file_name)
        : b.file_name.localeCompare(a.file_name);
    } else if (sortField === "uploaded_at") {
      return sortDirection === "asc"
        ? new Date(a.uploaded_at).getTime() - new Date(b.uploaded_at).getTime()
        : new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime();
    } else if (sortField === "score") {
      const scoreA = a.score !== undefined ? a.score : -1;
      const scoreB = b.score !== undefined ? b.score : -1;
      return sortDirection === "asc" ? scoreA - scoreB : scoreB - scoreA;
    }
    return 0;
  });

  // Function to handle column sorting
  const handleSort = (field: "file_name" | "uploaded_at" | "score") => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Get sort icon based on current sort state
  const getSortIcon = (field: "file_name" | "uploaded_at" | "score") => {
    if (sortField !== field) return null;
    return sortDirection === "asc" ? (
      <SortAsc className="w-4 h-4" />
    ) : (
      <SortDesc className="w-4 h-4" />
    );
  };

  // Calculate stats
  const getSubmissionStats = () => {
    const totalFiles = uploadedFiles.length;
    const gradedFiles = uploadedFiles.filter(
      (file) => file.score !== undefined
    ).length;
    const passedFiles = uploadedFiles.filter(
      (file) => file.score !== undefined && file.score >= passScore
    ).length;
    const failedFiles = gradedFiles - passedFiles;
    const avgScore =
      gradedFiles > 0
        ? uploadedFiles.reduce(
            (sum, file) => sum + (file.score !== undefined ? file.score : 0),
            0
          ) / gradedFiles
        : 0;

    return {
      totalFiles,
      gradedFiles,
      pendingFiles: totalFiles - gradedFiles,
      passedFiles,
      failedFiles,
      avgScore,
      passRate: gradedFiles > 0 ? (passedFiles / gradedFiles) * 100 : 0,
    };
  };

  // Function to export files to Excel
  const exportToExcel = () => {
    const stats = getSubmissionStats();

    // Add statistics sheet
    const statsData = [
      ["Assignment Summary"],
      [""],
      ["Title", assignment?.title || "N/A"],
      [
        "Due Date",
        assignment?.due_date
          ? new Date(assignment.due_date).toLocaleString()
          : "N/A",
      ],
      ["Pass Score", `${passScore}%`],
      [""],
      ["Submission Statistics"],
      ["Total Submissions", stats.totalFiles],
      ["Graded Submissions", stats.gradedFiles],
      ["Pending Submissions", stats.pendingFiles],
      ["Passed Submissions", stats.passedFiles],
      ["Failed Submissions", stats.failedFiles],
      ["Average Score", `${stats.avgScore.toFixed(1)}%`],
      ["Pass Rate", `${stats.passRate.toFixed(1)}%`],
    ];

    const statWorksheet = XLSX.utils.aoa_to_sheet(statsData);

    // Create submissions sheet
    const fileData = uploadedFiles.map((file, index) => ({
      "#": index + 1,
      "File Name": file.file_name,
      "Uploaded At": new Date(file.uploaded_at).toLocaleString(),
      Score: file.score !== undefined ? file.score : "Not graded",
      Status:
        file.score !== undefined
          ? file.score >= passScore
            ? "Pass"
            : "Fail"
          : "Not graded",
    }));

    const worksheet = XLSX.utils.json_to_sheet(fileData);

    // Create workbook and add sheets
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, statWorksheet, "Summary");
    XLSX.utils.book_append_sheet(workbook, worksheet, "Submissions");

    // Generate Excel file
    const assignmentName = assignment?.title || "Assignment";
    XLSX.writeFile(workbook, `${assignmentName}_submissions.xlsx`);
    toast.success("Excel report exported successfully");
  };

  // Format date in a nice readable format
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Check if due date is in the past
  const isDueDatePassed = (dueDate: string) => {
    return new Date(dueDate) < new Date();
  };

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex flex-col p-4 md:p-8 bg-purple-50">
          <div className="flex gap-4 items-center mb-6">
            <BackButton />
            <div className="h-8 w-56 bg-gray-300 rounded-md animate-pulse"></div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 mb-6 animate-pulse">
            <div className="h-8 w-3/4 bg-gray-300 rounded-md mb-4"></div>
            <div className="h-6 w-1/3 bg-gray-200 rounded-md mb-6"></div>
            <div className="h-24 w-full bg-gray-200 rounded-md mb-6"></div>
            <div className="flex flex-wrap gap-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-10 w-32 bg-gray-300 rounded-md"></div>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 animate-pulse">
            <div className="h-6 w-40 bg-gray-300 rounded-md mb-6"></div>
            <div className="h-64 w-full bg-gray-200 rounded-md"></div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  const stats = getSubmissionStats();

  return (
    <ProtectedRoute>
      <div className="min-h-screen flex flex-col p-4 md:p-8 bg-purple-50">
        {/* Header Section with Breadcrumb and Back Button */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="text-gray-500 text-sm hidden sm:flex items-center">
              <span
                className="hover:text-purple-600 cursor-pointer"
                onClick={() => router.push("/module")}
              >
                Modules
              </span>
              <span className="mx-2">/</span>
              <span
                className="hover:text-purple-600 cursor-pointer"
                onClick={() => router.push(`/module/${moduleId}`)}
              >
                Module {moduleId}
              </span>
              <span className="mx-2">/</span>
              <span className="text-purple-600 font-medium">
                Assignment {assignmentId}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={exportToExcel}
              className="text-sm bg-white hover:bg-gray-50 text-gray-700 rounded-md px-3 py-1.5 flex items-center gap-1 border border-gray-300 shadow-sm transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>

            <button
              onClick={() =>
                router.push(`/module/${moduleId}/${assignmentId}/report`)
              }
              className="text-sm bg-white hover:bg-gray-50 text-gray-700 rounded-md px-3 py-1.5 flex items-center gap-1 border border-gray-300 shadow-sm transition-colors"
            >
              <BarChart2 className="w-4 h-4" />
              <span className="hidden sm:inline">Report</span>
            </button>
          </div>
        </div>

        {assignment ? (
          <>
            {/* Assignment Details Card */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
              <div className="p-6 pb-4 border-b border-gray-100">
                <div className="flex justify-between items-start">
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2 group">
                      {assignment.title}
                      <span className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity text-sm font-normal text-purple-500 cursor-pointer">
                        {/* Optional edit button */}
                      </span>
                    </h1>
                    <div className="flex items-center gap-4 text-sm text-gray-500 mb-2">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1 text-purple-500" />
                        <span
                          className={
                            isDueDatePassed(assignment.due_date)
                              ? "text-red-500"
                              : ""
                          }
                        >
                          {isDueDatePassed(assignment.due_date)
                            ? "Past Due: "
                            : "Due: "}
                          {formatDate(assignment.due_date)}
                        </span>
                      </div>
                      {assignment.created_at && (
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-1 text-purple-500" />
                          <span>
                            Created: {formatDate(assignment.created_at)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => setShowDescription(!showDescription)}
                    className="text-purple-600 hover:text-purple-700 text-sm flex items-center mt-1"
                  >
                    <Info className="w-4 h-4 mr-1" />
                    {showDescription ? "Hide Details" : "View Details"}
                  </button>
                </div>

                {/* Collapsible Description */}
                {showDescription && assignment.description && (
                  <div className="mt-4 p-4 rounded-md border border-purple-100 bg-purple-50 text-gray-700 text-sm leading-relaxed max-h-48 overflow-auto">
                    <p>{assignment.description}</p>
                  </div>
                )}
              </div>

              {/* Stats Summary */}
              <div className="bg-gray-50 p-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white p-3 rounded-lg shadow-sm flex flex-col">
                  <span className="text-xs text-gray-500 mb-1">
                    Total Submissions
                  </span>
                  <span className="text-xl font-bold text-gray-800">
                    {stats.totalFiles}
                  </span>
                  <div className="flex items-center mt-1 text-xs">
                    <span className="text-purple-600">
                      {stats.gradedFiles} graded
                    </span>
                    <span className="mx-1">•</span>
                    <span className="text-gray-500">
                      {stats.pendingFiles} pending
                    </span>
                  </div>
                </div>

                <div className="bg-white p-3 rounded-lg shadow-sm flex flex-col">
                  <span className="text-xs text-gray-500 mb-1">Pass Rate</span>
                  <span className="text-xl font-bold text-gray-800">
                    {stats.gradedFiles > 0
                      ? `${stats.passRate.toFixed(1)}%`
                      : "N/A"}
                  </span>
                  <div className="flex items-center mt-1 text-xs">
                    <span className="text-green-600">
                      {stats.passedFiles} passed
                    </span>
                    <span className="mx-1">•</span>
                    <span className="text-red-500">
                      {stats.failedFiles} failed
                    </span>
                  </div>
                </div>

                <div className="bg-white p-3 rounded-lg shadow-sm flex flex-col">
                  <span className="text-xs text-gray-500 mb-1">
                    Average Score
                  </span>
                  <span className="text-xl font-bold text-gray-800">
                    {stats.gradedFiles > 0
                      ? `${stats.avgScore.toFixed(1)}%`
                      : "N/A"}
                  </span>
                  <div className="flex items-center mt-1 text-xs">
                    <span className="text-gray-500">
                      Pass threshold: {passScore}%
                    </span>
                  </div>
                </div>

                <div className="bg-white p-3 rounded-lg shadow-sm flex flex-col">
                  <span className="text-xs text-gray-500 mb-1">
                    Marking Scheme
                  </span>
                  <span className="text-md font-medium text-gray-800">
                    {hasMarkingScheme ? (
                      <span className="text-green-600">Configured</span>
                    ) : (
                      <span className="text-amber-600">Not Configured</span>
                    )}
                  </span>
                  <div className="mt-1">
                    <button
                      onClick={() =>
                        router.push(
                          `/module/${moduleId}/${assignmentId}/markingScheme`
                        )
                      }
                      className="text-xs text-purple-600 hover:text-purple-700 flex items-center"
                    >
                      <CheckSquare className="w-3 h-3 mr-1" />
                      {hasMarkingScheme ? "Edit" : "Create"} Scheme
                    </button>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-4 border-t border-gray-100 flex flex-wrap gap-3">
                <button
                  onClick={() =>
                    router.push(
                      `/module/${moduleId}/${assignmentId}/uploadAnswers`
                    )
                  }
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition shadow-sm"
                >
                  <FileUp className="w-4 h-4" />
                  <span>Upload Answers</span>
                </button>

                <button
                  onClick={gradeSubmissions}
                  disabled={isGrading || uploadedFiles.length === 0 || !hasMarkingScheme}
                  className={`flex items-center gap-2 px-4 py-2 ${
                    isGrading || uploadedFiles.length === 0 || !hasMarkingScheme
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-green-600 hover:bg-green-700"
                  } text-white rounded-md transition shadow-sm`}
                  title={!hasMarkingScheme ? "Marking scheme must be configured before grading" : ""}
                >
                  {isGrading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <FileText className="w-4 h-4" />
                  )}
                  <span>{isGrading ? "Grading..." : "Grade Files"}</span>
                </button>
                
                <button
                  onClick={clearGradingResults}
                  disabled={isGrading || uploadedFiles.filter(f => f.score !== undefined && f.score !== null).length === 0}
                  className={`flex items-center gap-2 px-4 py-2 ${
                    isGrading || uploadedFiles.filter(f => f.score !== undefined && f.score !== null).length === 0
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-red-500 hover:bg-red-600"
                  } text-white rounded-md transition shadow-sm`}
                  title="Clear all grading results"
                >
                  <X className="w-4 h-4" />
                  <span>Clear Grading</span>
                </button>
              </div>
            </div>

            {/* Uploaded Files Section */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-6 border-b border-gray-100">
                <h2 className="text-xl font-semibold text-gray-800 mb-3 sm:mb-0 flex items-center">
                  <FileQuestion className="w-5 h-5 mr-2 text-purple-600" />
                  Submitted Files
                  <span className="ml-2 text-sm font-normal text-gray-500">
                    ({uploadedFiles.length})
                  </span>
                </h2>

                {/* Search and Filter Bar */}
                <div className="w-full sm:w-auto flex items-center gap-2">
                  <div className="relative w-full sm:w-auto">
                    <input
                      type="text"
                      placeholder="Search files..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full sm:w-56 pl-9 pr-4 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                    <Search className="absolute left-2.5 top-1.5 w-4 h-4 text-gray-400" />
                  </div>
                </div>
              </div>

              {/* Table and List Views */}
              {sortedFiles.length > 0 ? (
                <div>
                  {/* Desktop Table View */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                            onClick={() => handleSort("file_name")}
                          >
                            <div className="flex items-center">
                              <span>File Name</span>
                              {getSortIcon("file_name")}
                            </div>
                          </th>
                          <th
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                            onClick={() => handleSort("uploaded_at")}
                          >
                            <div className="flex items-center">
                              <span>Uploaded</span>
                              {getSortIcon("uploaded_at")}
                            </div>
                          </th>
                          <th
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                            onClick={() => handleSort("score")}
                          >
                            <div className="flex items-center">
                              <span>Score</span>
                              {getSortIcon("score")}
                            </div>
                          </th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {sortedFiles.map((file) => (
                          <tr
                            key={file.id}
                            className="hover:bg-gray-50 transition-colors"
                          >
                            <td className="px-6 py-4">
                              <div
                                onClick={() =>
                                  router.push(
                                    `/module/${moduleId}/${assignmentId}/${file.id}/`
                                  )
                                }
                                className="text-blue-600 hover:text-blue-700 cursor-pointer flex items-center group"
                              >
                                <FileText className="w-4 h-4 mr-2 text-blue-600 flex-shrink-0" />
                                <span className="truncate max-w-xs">
                                  {file.file_name}
                                </span>
                                <ExternalLink className="w-3.5 h-3.5 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatDate(file.uploaded_at)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {file.score !== undefined ? (
                                <div className="flex items-center">
                                  <div className="mr-3 w-10 h-10 rounded-full flex items-center justify-center text-white font-medium text-sm bg-gradient-to-br from-purple-500 to-purple-700 shadow-sm">
                                    {file.score}
                                  </div>
                                  <div>
                                    <span
                                      className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                        file.score >= passScore
                                          ? "bg-green-100 text-green-800"
                                          : "bg-red-100 text-red-800"
                                      }`}
                                    >
                                      {file.score >= passScore
                                        ? "PASS"
                                        : "FAIL"}
                                    </span>
                                    <div className="text-xs text-gray-500 mt-1">
                                      Pass: {passScore}%
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                                  Not graded
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              <div className="flex justify-center space-x-2">
                                <button
                                  onClick={() =>
                                    router.push(
                                      `/module/${moduleId}/${assignmentId}/${file.id}/`
                                    )
                                  }
                                  className="text-purple-600 hover:text-purple-700 p-1 rounded hover:bg-purple-50"
                                  title="View details"
                                >
                                  <FileText className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => deleteFile(file.id)}
                                  className="text-red-600 hover:text-red-700 p-1 rounded hover:bg-red-50"
                                  title="Delete file"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Card View */}
                  <div className="md:hidden">
                    <ul className="divide-y divide-gray-200">
                      {sortedFiles.map((file) => (
                        <li
                          key={file.id}
                          className="p-4 hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div
                              className="flex-1 cursor-pointer"
                              onClick={() =>
                                router.push(
                                  `/module/${moduleId}/${assignmentId}/${file.id}/`
                                )
                              }
                            >
                              <div className="flex items-center">
                                <FileText className="w-4 h-4 mr-2 text-blue-600 flex-shrink-0" />
                                <span className="text-blue-600 font-medium truncate">
                                  {file.file_name}
                                </span>
                              </div>
                              <div className="ml-6 text-xs text-gray-500 mt-1">
                                Uploaded: {formatDate(file.uploaded_at)}
                              </div>
                            </div>
                            <div className="ml-3 flex items-center">
                              {file.score !== undefined ? (
                                <span
                                  className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                    file.score >= passScore
                                      ? "bg-green-100 text-green-800"
                                      : "bg-red-100 text-red-800"
                                  }`}
                                >
                                  {file.score}%
                                </span>
                              ) : (
                                <span className="px-2 py-1 text-xs font-normal rounded-full bg-gray-100 text-gray-600">
                                  Not graded
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="mt-3 flex justify-end space-x-2">
                            <button
                              onClick={() =>
                                router.push(
                                  `/module/${moduleId}/${assignmentId}/${file.id}/`
                                )
                              }
                              className="text-xs px-2 py-1 rounded bg-purple-100 text-purple-700 flex items-center"
                            >
                              <FileText className="w-3 h-3 mr-1" />
                              View
                            </button>
                            <button
                              onClick={() => deleteFile(file.id)}
                              className="text-xs px-2 py-1 rounded bg-red-100 text-red-700 flex items-center"
                            >
                              <Trash2 className="w-3 h-3 mr-1" />
                              Delete
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="py-16 flex flex-col items-center justify-center">
                  {uploadedFiles.length === 0 ? (
                    <>
                      <FileQuestion className="w-16 h-16 text-gray-300 mb-4" />
                      <p className="text-gray-500 mb-2">
                        No files uploaded yet
                      </p>
                      <p className="text-gray-400 text-sm mb-6">
                        Upload files to start grading
                      </p>
                      <button
                        onClick={() =>
                          router.push(
                            `/module/${moduleId}/${assignmentId}/uploadAnswers`
                          )
                        }
                        className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition shadow-sm"
                      >
                        <FileUp className="w-4 h-4" />
                        <span>Upload Answers</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-16 h-16 text-gray-300 mb-4" />
                      <p className="text-gray-500">
                        No files match your search
                      </p>
                      <button
                        onClick={() => setSearchQuery("")}
                        className="mt-4 px-4 py-2 text-sm text-purple-600 border border-purple-300 rounded-md hover:bg-purple-50"
                      >
                        Clear Search
                      </button>
                    </>
                  )}
                </div>
              )}

              {/* Pagination (if needed) */}
              {sortedFiles.length > 0 && (
                <div className="px-6 py-3 flex items-center justify-between border-t border-gray-200 bg-gray-50">
                  <div className="flex-1 flex justify-between sm:hidden">
                    <span className="text-xs text-gray-700">
                      Showing{" "}
                      <span className="font-medium">{sortedFiles.length}</span>{" "}
                      of{" "}
                      <span className="font-medium">
                        {uploadedFiles.length}
                      </span>{" "}
                      files
                    </span>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        Showing{" "}
                        <span className="font-medium">
                          {sortedFiles.length}
                        </span>{" "}
                        of{" "}
                        <span className="font-medium">
                          {uploadedFiles.length}
                        </span>{" "}
                        files
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
            <p className="text-gray-700 font-medium mb-1">
              Assignment not found
            </p>
            <p className="text-gray-500 text-sm mb-4">
              The assignment details could not be loaded
            </p>
            <button
              onClick={() => router.push(`/module/${moduleId}`)}
              className="px-4 py-2 text-sm text-white bg-purple-600 rounded-md hover:bg-purple-700"
            >
              Back to Module
            </button>
          </div>
        )}
      </div>

      {/* Grading Progress Modal */}
      <GradingProgressModal
        isOpen={showGradingModal}
        onClose={() => setShowGradingModal(false)}
        files={gradingFiles}
        stats={gradingStats}
      />

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
        theme="light"
      />
    </ProtectedRoute>
  );
};

export default AssignmentDetailPage;
