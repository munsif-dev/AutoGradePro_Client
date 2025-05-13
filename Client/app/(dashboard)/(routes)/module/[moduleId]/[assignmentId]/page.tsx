"use client";

import React, { useState, useEffect, useCallback } from "react";
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
  RefreshCw,
  Check,
  X,
  Filter,
  SortAsc,
  SortDesc,
  FileQuestion,
  ExternalLink,
  Info,
  ChevronDown,
  ArrowDownToLine,
  ArrowUpToLine,
  MoreHorizontal,
  CheckCheck,
  UploadCloud,
  Eye,
  FileBarChart2,
  Users
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
  score?: number; // Raw score of the file, optional
}

interface GradingFile {
  id: number;
  file_name: string;
  status: "pending" | "grading" | "completed" | "error";
  rawScore?: number;
  score?: number; // Normalized percentage score
}

interface GradingStats {
  totalFiles: number;
  completedFiles: number;
  totalRawScore: number;
  totalScore: number;
  averageScore: number;
  passedFiles: number;
  failedFiles: number;
  passScore: number;
  totalPossibleMarks: number; // Total possible raw marks
}

const AssignmentDetailPage = () => {
  const router = useRouter();
  const { moduleId, assignmentId } = useParams();

  const [assignment, setAssignment] = useState<AssignmentDetail | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<FileDetail[]>([]);
  const [passScore, setPassScore] = useState(0);
  const [totalPossibleMarks, setTotalPossibleMarks] = useState(100); // Default to 100
  const [hasMarkingScheme, setHasMarkingScheme] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const [sortField, setSortField] = useState<
    "file_name" | "uploaded_at" | "score"
  >("uploaded_at");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [selectedFiles, setSelectedFiles] = useState<number[]>([]);
  const [selectAll, setSelectAll] = useState(false);

  // Grading progress state
  const [showGradingModal, setShowGradingModal] = useState(false);
  const [gradingFiles, setGradingFiles] = useState<GradingFile[]>([]);
  const [gradingStats, setGradingStats] = useState<GradingStats>({
    totalFiles: 0,
    completedFiles: 0,
    totalRawScore: 0,
    totalScore: 0,
    averageScore: 0,
    passedFiles: 0,
    failedFiles: 0,
    passScore: 40,
    totalPossibleMarks: 100, // Default total possible marks
  });
  const [isGrading, setIsGrading] = useState(false);
  const [showDescription, setShowDescription] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState<{
    show: boolean;
    title: string;
    message: string;
    confirmAction: () => void;
  }>({
    show: false,
    title: "",
    message: "",
    confirmAction: () => {},
  });

  // Function to convert raw score to percentage
  const normalizeScore = (rawScore: number): number => {
    if (totalPossibleMarks === 0) return 0;
    return Math.round((rawScore / totalPossibleMarks) * 100);
  };

  const loadData = useCallback(async () => {
    if (!assignmentId) return;
    
    setIsRefreshing(true);
    try {
      await Promise.all([
        fetchAssignmentDetails(),
        fetchUploadedFiles(),
        fetchMarkingScheme()
      ]);
      setLastRefreshed(new Date());
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setIsRefreshing(false);
    }
  }, [assignmentId]);

  useEffect(() => {
    if (assignmentId) {
      loadData();
    }
  }, [assignmentId, loadData]);

  // Reset selection when files change
  useEffect(() => {
    setSelectedFiles([]);
    setSelectAll(false);
  }, [uploadedFiles]);

  const fetchAssignmentDetails = async () => {
    if (!assignmentId) return;
    setIsLoading(true);
    try {
      const res = await api.get(`/api/assignment/${assignmentId}/`);
      setAssignment(res.data);
      setIsLoading(false);
    } catch (err) {
      toast.error("Failed to fetch assignment details");
      setIsLoading(false);
    }
  };

  const fetchUploadedFiles = async () => {
    if (!assignmentId) return;
    try {
      const res = await api.get(`/api/submission/${assignmentId}/files/`);
      setUploadedFiles(res.data);
    } catch (err) {
      toast.error("Failed to fetch uploaded files");
    }
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
      
      // Calculate total possible marks from marking scheme
      if (answers && Array.isArray(answers)) {
        const totalMarks = answers.reduce((total, answer) => total + (answer.marks || 0), 0);
        setTotalPossibleMarks(totalMarks || 100);
        
        // Update grading stats with total possible marks
        setGradingStats((prev) => ({
          ...prev,
          totalPossibleMarks: totalMarks || 100,
          passScore: pass_score ?? 40,
        }));
      }
      
      // Check if marking scheme is configured by checking if answers exist and are not empty
      setHasMarkingScheme(answers && answers.length > 0);
    } catch (error) {
      console.error("Error fetching marking scheme:", error);
      setPassScore(40);
    }
  };

  const deleteFile = (fileId: number) => {
    setShowConfirmDialog({
      show: true,
      title: "Delete File",
      message: "Are you sure you want to delete this file? This action cannot be undone.",
      confirmAction: async () => {
        try {
          await api.delete(`/api/submission/${assignmentId}/delete-file/${fileId}/`);
          toast.success("File deleted successfully!");
          fetchUploadedFiles();
          setShowConfirmDialog({ show: false, title: "", message: "", confirmAction: () => {} });
        } catch (err) {
          toast.error("Failed to delete file");
        }
      }
    });
  };

  const deleteSelectedFiles = () => {
    if (selectedFiles.length === 0) return;
    
    setShowConfirmDialog({
      show: true,
      title: "Delete Selected Files",
      message: `Are you sure you want to delete ${selectedFiles.length} selected file(s)? This action cannot be undone.`,
      confirmAction: async () => {
        setIsLoading(true);
        try {
          // Delete files one by one
          const promises = selectedFiles.map(fileId => 
            api.delete(`/api/submission/${assignmentId}/delete-file/${fileId}/`)
          );
          await Promise.all(promises);
          
          toast.success(`Successfully deleted ${selectedFiles.length} file(s)`);
          fetchUploadedFiles();
          setSelectedFiles([]);
          setShowConfirmDialog({ show: false, title: "", message: "", confirmAction: () => {} });
        } catch (err) {
          toast.error("Failed to delete some files");
        } finally {
          setIsLoading(false);
        }
      }
    });
  };

  const updateGradingProgress = (
    fileId: number,
    status: "pending" | "grading" | "completed" | "error",
    rawScore?: number
  ) => {
    setGradingFiles((prev) =>
      prev.map((file) => {
        if (file.id === fileId) {
          // Calculate normalized score if raw score is provided
          const normalizedScore = rawScore !== undefined 
            ? normalizeScore(rawScore) 
            : undefined;
            
          return { 
            ...file, 
            status, 
            rawScore, 
            score: normalizedScore 
          };
        }
        return file;
      })
    );

    // Update statistics if a file has been completed
    if (status === "completed" && rawScore !== undefined) {
      const normalizedScore = normalizeScore(rawScore);
      
      setGradingStats((prev) => {
        const newCompletedFiles = prev.completedFiles + 1;
        const newTotalRawScore = prev.totalRawScore + rawScore;
        const newTotalScore = prev.totalScore + normalizedScore;
        const newAverageScore = newTotalScore / newCompletedFiles;
        const isPassed = normalizedScore >= prev.passScore;

        return {
          ...prev,
          completedFiles: newCompletedFiles,
          totalRawScore: newTotalRawScore,
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
    
    if (!hasMarkingScheme) {
      toast.warning(
        "Marking scheme not configured! Please set up a marking scheme first.", 
        { autoClose: 5000 }
      );
      return;
    }

    // Initialize grading process
    setIsGrading(true);

    // Prepare grading files array from uploaded files
    const filesToGrade = uploadedFiles
      .filter(file => selectedFiles.length > 0 ? selectedFiles.includes(file.id) : true)
      .map((file) => ({
        id: file.id,
        file_name: file.file_name,
        status: "pending" as const,
      }));

    if (filesToGrade.length === 0) {
      toast.warning("No files selected for grading");
      setIsGrading(false);
      return;
    }

    // Reset grading stats
    setGradingStats({
      totalFiles: filesToGrade.length,
      completedFiles: 0,
      totalRawScore: 0,
      totalScore: 0,
      averageScore: 0,
      passedFiles: 0,
      failedFiles: 0,
      passScore: passScore,
      totalPossibleMarks: totalPossibleMarks,
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
          const updatedResult = gradingResults.find(
            (scoreObj: { id: number }) => scoreObj.id === file.id
          );
          return updatedResult ? { ...file, score: updatedResult.score } : file;
        })
      );

      toast.success("Grading completed successfully!");
      setLastRefreshed(new Date());
      
      // Clear selection after grading
      if (selectedFiles.length > 0) {
        setSelectedFiles([]);
      }
    } catch (err) {
      // Error handling done in simulateGradingProcess
    } finally {
      setIsGrading(false);
    }
  };

  const clearGradingResults = () => {
    setShowConfirmDialog({
      show: true,
      title: "Clear Grading Results",
      message: "Are you sure you want to clear all grading results? This action cannot be undone.",
      confirmAction: async () => {
        if (!assignmentId) return;
        
        try {
          await api.delete(`/api/assignment/${assignmentId}/clear-grading-results/`);
          
          // Reset scores in the UI
          setUploadedFiles(prevFiles => 
            prevFiles.map(file => ({ ...file, score: undefined }))
          );
          
          // Update stats
          setGradingStats(prevStats => ({
            ...prevStats,
            completedFiles: 0,
            totalRawScore: 0,
            totalScore: 0,
            averageScore: 0,
            passedFiles: 0,
            failedFiles: 0
          }));
          
          toast.success("Grading results cleared successfully!");
          setLastRefreshed(new Date());
          setShowConfirmDialog({ show: false, title: "", message: "", confirmAction: () => {} });
        } catch (error) {
          console.error("Error clearing grading results:", error);
          toast.error("Failed to clear grading results");
        }
      }
    });
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
      // Use normalized scores for sorting
      const scoreA = a.score !== undefined ? normalizeScore(a.score) : -1;
      const scoreB = b.score !== undefined ? normalizeScore(b.score) : -1;
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

  // Handle select file checkbox
  const toggleFileSelection = (fileId: number) => {
    setSelectedFiles(prev => 
      prev.includes(fileId)
        ? prev.filter(id => id !== fileId)
        : [...prev, fileId]
    );
  };

  // Handle select all checkbox
  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedFiles([]);
    } else {
      setSelectedFiles(sortedFiles.map(file => file.id));
    }
    setSelectAll(!selectAll);
  };

  // Calculate stats
  const getSubmissionStats = () => {
    const totalFiles = uploadedFiles.length;
    
    // Process scores, ensuring we handle raw scores correctly
    const processedFiles = uploadedFiles.map(file => ({
      ...file,
      normalizedScore: file.score !== undefined ? normalizeScore(file.score) : undefined
    }));
    
    const gradedFiles = processedFiles.filter(
      (file) => file.normalizedScore !== undefined
    ).length;
    
    const passedFiles = processedFiles.filter(
      (file) => file.normalizedScore !== undefined && file.normalizedScore >= passScore
    ).length;
    
    const failedFiles = gradedFiles - passedFiles;
    
    const sumOfRawScores = uploadedFiles.reduce(
      (sum, file) => sum + (file.score !== undefined ? file.score : 0),
      0
    );
    
    const sumOfNormalizedScores = processedFiles.reduce(
      (sum, file) => sum + (file.normalizedScore !== undefined ? file.normalizedScore : 0),
      0
    );
    
    const avgNormalizedScore =
      gradedFiles > 0 ? sumOfNormalizedScores / gradedFiles : 0;

    return {
      totalFiles,
      gradedFiles,
      pendingFiles: totalFiles - gradedFiles,
      passedFiles,
      failedFiles,
      totalRawScore: sumOfRawScores,
      avgScore: avgNormalizedScore,
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
      ["Total Possible Marks", totalPossibleMarks],
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

    // Create submissions sheet with both raw and normalized scores
    const fileData = uploadedFiles.map((file, index) => ({
      "#": index + 1,
      "File Name": file.file_name,
      "Uploaded At": new Date(file.uploaded_at).toLocaleString(),
      "Raw Score": file.score !== undefined ? `${file.score}/${totalPossibleMarks}` : "Not graded",
      "Percentage Score": file.score !== undefined ? `${normalizeScore(file.score)}%` : "Not graded",
      "Status": file.score !== undefined
          ? normalizeScore(file.score) >= passScore ? "Pass" : "Fail"
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
  
  // Format relative time
  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    
    if (diffSec < 60) return "just now";
    if (diffMin < 60) return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`;
    if (diffHour < 24) return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
    return formatDate(date.toISOString());
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
      <div className="min-h-screen flex flex-col p-1 md:p-8 bg-purple-50">
        {/* Header Section with Breadcrumb and Back Button */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <BackButton />
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
            {lastRefreshed && (
              <div className="hidden md:block text-xs text-gray-500 mr-2">
                Last updated: {formatRelativeTime(lastRefreshed)}
              </div>
            )}
            
            <button
              onClick={loadData}
              disabled={isRefreshing}
              className="text-sm bg-white hover:bg-gray-50 text-gray-700 rounded-md px-3 py-1.5 flex items-center gap-1 border border-gray-300 shadow-sm transition-colors"
              title="Refresh data"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            
            <button
              onClick={exportToExcel}
              className="text-sm bg-white hover:bg-gray-50 text-gray-700 rounded-md px-3 py-1.5 flex items-center gap-1 border border-gray-300 shadow-sm transition-colors"
              title="Export to Excel"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export</span>
            </button>

            <button
              onClick={() =>
                router.push(`/module/${moduleId}/${assignmentId}/report`)
              }
              className="text-sm bg-white hover:bg-gray-50 text-gray-700 rounded-md px-3 py-1.5 flex items-center gap-1 border border-gray-300 shadow-sm transition-colors"
              title="View detailed report"
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
                    <div className="flex items-center">
                      <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2 group">
                        {assignment.title}
                      </h1>
                      <button
                        onClick={() => router.push(`/module/${moduleId}/edit-assignment/${assignment.id}`)}
                        className="ml-2 text-purple-500 hover:text-purple-700 hidden sm:block"
                        title="Edit assignment"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-2">
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
                <div className="bg-white p-3 rounded-lg shadow-sm flex flex-col hover:shadow-md transition-shadow">
                  <span className="text-xs text-gray-500 mb-1 flex items-center">
                    <FileText className="w-3 h-3 mr-1 text-purple-500" />
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

                <div className="bg-white p-3 rounded-lg shadow-sm flex flex-col hover:shadow-md transition-shadow">
                  <span className="text-xs text-gray-500 mb-1 flex items-center">
                    <CheckCheck className="w-3 h-3 mr-1 text-green-500" />
                    Pass Rate
                  </span>
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

                <div className="bg-white p-3 rounded-lg shadow-sm flex flex-col hover:shadow-md transition-shadow">
                  <span className="text-xs text-gray-500 mb-1 flex items-center">
                    <FileBarChart2 className="w-3 h-3 mr-1 text-blue-500" />
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

                <div className="bg-white p-3 rounded-lg shadow-sm flex flex-col hover:shadow-md transition-shadow">
                  <span className="text-xs text-gray-500 mb-1 flex items-center">
                    <CheckSquare className="w-3 h-3 mr-1 text-purple-500" />
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
                    <span className="text-xs text-gray-500">
                      Total marks: {totalPossibleMarks}
                    </span>
                  </div>
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
                  title="Upload student answer files"
                >
                  <UploadCloud className="w-4 h-4" />
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
                  title={!hasMarkingScheme ? "Marking scheme must be configured before grading" : selectedFiles.length > 0 ? `Grade ${selectedFiles.length} selected files` : "Grade all files"}
                >
                  {isGrading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <FileText className="w-4 h-4" />
                  )}
                  <span>
                    {isGrading 
                      ? "Grading..." 
                      : selectedFiles.length > 0 
                        ? `Grade Selected (${selectedFiles.length})` 
                        : "Grade All Files"
                    }
                  </span>
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
                    {searchQuery && (
                      <button
                        className="absolute right-2.5 top-1.5 text-gray-400 hover:text-gray-600"
                        onClick={() => setSearchQuery("")}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Batch Actions Bar - Shows when files are selected */}
              {selectedFiles.length > 0 && (
                <div className="bg-purple-50 p-3 border-b border-purple-100 flex items-center justify-between">
                  <div className="text-sm font-medium text-purple-700">
                    {selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''} selected
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={gradeSubmissions}
                      disabled={!hasMarkingScheme || isGrading}
                      className="text-xs py-1 px-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors flex items-center gap-1 disabled:bg-gray-400 disabled:cursor-not-allowed"
                      title={!hasMarkingScheme ? "Marking scheme required" : ""}
                    >
                      <FileText className="w-3 h-3" />
                      <span>Grade Selected</span>
                    </button>
                    <button 
                      onClick={deleteSelectedFiles}
                      className="text-xs py-1 px-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Delete Selected</span>
                    </button>
                    <button 
                      onClick={() => {
                        setSelectedFiles([]);
                        setSelectAll(false);
                      }}
                      className="text-xs py-1 px-2 border border-gray-300 rounded hover:bg-gray-100 transition-colors"
                    >
                      Clear Selection
                    </button>
                  </div>
                </div>
              )}

              {/* Table and List Views */}
              {sortedFiles.length > 0 ? (
                <div>
                  {/* Desktop Table View */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-3 text-left">
                            <div className="flex items-center">
                              <input
                                type="checkbox"
                                checked={selectAll}
                                onChange={toggleSelectAll}
                                className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                              />
                            </div>
                          </th>
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
                        {sortedFiles.map((file) => {
                          const normalizedScore = file.score !== undefined ? normalizeScore(file.score) : undefined;
                          
                          return (
                            <tr
                              key={file.id}
                              className={`hover:bg-gray-50 transition-colors ${
                                selectedFiles.includes(file.id) ? "bg-purple-50" : ""
                              }`}
                            >
                              <td className="px-3 py-4">
                                <input
                                  type="checkbox"
                                  checked={selectedFiles.includes(file.id)}
                                  onChange={() => toggleFileSelection(file.id)}
                                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                                />
                              </td>
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
                                    <div className={`mr-3 w-10 h-10 rounded-full flex items-center justify-center text-white font-medium text-sm ${
                                      normalizedScore >= passScore 
                                        ? "bg-gradient-to-br from-green-500 to-green-700" 
                                        : "bg-gradient-to-br from-red-500 to-red-700"
                                    } shadow-sm`}>
                                      {normalizedScore}
                                    </div>
                                    <div>
                                      <div className="text-xs text-gray-500 mb-1">
                                        Raw: {file.score}/{totalPossibleMarks}
                                      </div>
                                      <span
                                        className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                          normalizedScore >= passScore
                                            ? "bg-green-100 text-green-800"
                                            : "bg-red-100 text-red-800"
                                        }`}
                                      >
                                        {normalizedScore >= passScore
                                          ? "PASS"
                                          : "FAIL"}
                                      </span>
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
                                    <Eye className="w-4 h-4" />
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
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Card View */}
                  <div className="md:hidden">
                    <ul className="divide-y divide-gray-200">
                      {sortedFiles.map((file) => {
                        const normalizedScore = file.score !== undefined ? normalizeScore(file.score) : undefined;
                        
                        return (
                          <li
                            key={file.id}
                            className={`p-4 hover:bg-gray-50 transition-colors ${
                              selectedFiles.includes(file.id) ? "bg-purple-50" : ""
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex items-start mr-2">
                                <input
                                  type="checkbox"
                                  checked={selectedFiles.includes(file.id)}
                                  onChange={() => toggleFileSelection(file.id)}
                                  className="h-4 w-4 mt-1 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                                />
                              </div>
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
                                {file.score !== undefined && (
                                  <div className="ml-6 text-xs text-gray-500 mt-1">
                                    Raw Score: {file.score}/{totalPossibleMarks}
                                  </div>
                                )}
                              </div>
                              <div className="ml-3 flex items-center">
                                {normalizedScore !== undefined ? (
                                  <span
                                    className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                      normalizedScore >= passScore
                                        ? "bg-green-100 text-green-800"
                                        : "bg-red-100 text-red-800"
                                    }`}
                                  >
                                    {normalizedScore}%
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
                                <Eye className="w-3 h-3 mr-1" />
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
                        );
                      })}
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
                        <UploadCloud className="w-4 h-4" />
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
                    <div>
                      <p className="text-xs text-gray-500">
                        Total possible marks: {totalPossibleMarks}
                      </p>
                    </div>
                    <div>
                      {lastRefreshed && (
                        <p className="text-xs text-gray-500">
                          Last updated: {formatRelativeTime(lastRefreshed)}
                        </p>
                      )}
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

      {/* Confirmation Dialog */}
      {showConfirmDialog.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">{showConfirmDialog.title}</h3>
            <p className="text-gray-600 mb-4">{showConfirmDialog.message}</p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowConfirmDialog({...showConfirmDialog, show: false})}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={showConfirmDialog.confirmAction}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

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

// Missing Edit icon component
const Edit = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
    <path d="m15 5 4 4" />
  </svg>
);

export default AssignmentDetailPage;