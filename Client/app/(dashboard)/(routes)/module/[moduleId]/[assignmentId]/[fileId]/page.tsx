"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import ProtectedRoute from "@/app/_components/ProtectedRoutes";
import BackButton from "@/app/(dashboard)/_components/BackButton";
import {
  DocumentChartBarIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import * as XLSX from "xlsx";
import {
  Download,
  Printer,
  FileText,
  CheckCircle,
  XCircle,
  BarChart4,
  Calendar,
  ChevronRight,
  RefreshCw,
  FileDown,
  ExternalLink,
  AlertTriangle,
  Award,
  File,
  HelpCircle,
  Edit,
  BookOpen,
  MessageCircle,
  Info,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface Answer {
  question_id: number;
  student_answer: string;
  correct_answer: string;
  marks_for_answer: number;
  allocated_marks: number;
}

interface FileDetailData {
  file: string;
  file_name: string;
  answers: Answer[];
  marking_scheme: Record<number, any>;
  score: number;
  pass_score?: number;
}

const FileDetailPage = () => {
  const router = useRouter();
  const { moduleId, assignmentId, fileId } = useParams();
  const [fileData, setFileData] = useState<FileDetailData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"answers" | "summary">("answers");
  const [passScore, setPassScore] = useState<number>(40); // Default pass score
  const [refreshing, setRefreshing] = useState(false);
  const [assignmentTitle, setAssignmentTitle] = useState<string>("");
  const [moduleTitle, setModuleTitle] = useState<string>("");
  const [expandedQuestions, setExpandedQuestions] = useState<Set<number>>(new Set());
  const questionRefs = useRef<{ [key: number]: HTMLTableRowElement | null }>({});

  useEffect(() => {
    fetchFileDetails();
    fetchMarkingSchemeDetails();
    fetchAssignmentDetails();
  }, [fileId]);

  const fetchAssignmentDetails = () => {
    if (!assignmentId) return;

    api
      .get(`/api/assignment/${assignmentId}/`)
      .then((res) => {
        setAssignmentTitle(res.data.title || `Assignment ${assignmentId}`);
        if (res.data.module && res.data.module.name) {
          setModuleTitle(res.data.module.name);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch assignment details:", err);
      });
  };

  const fetchFileDetails = () => {
    if (!fileId || !assignmentId) return;
    setIsLoading(true);

    api
      .get(`/api/assignment/${assignmentId}/${fileId}/detail/`)
      .then((res) => {
        setFileData(res.data);
        // If pass_score is included in the response, use it
        if (res.data.pass_score !== undefined) {
          setPassScore(res.data.pass_score);
        }
        setIsLoading(false);
      })
      .catch((err) => {
        toast.error("Failed to fetch file details");
        setIsLoading(false);
      });
  };

  const refreshData = () => {
    setRefreshing(true);
    Promise.all([fetchFileDetails(), fetchMarkingSchemeDetails()]).finally(
      () => {
        setTimeout(() => setRefreshing(false), 700);
        toast.success("Assessment data refreshed");
      }
    );
  };

  // Fetch marking scheme to get the pass score
  const fetchMarkingSchemeDetails = async () => {
    if (!assignmentId) return;

    try {
      const response = await api.get(
        `/api/assignment/${assignmentId}/marking-scheme/detail/`
      );
      const { pass_score } = response.data;
      if (pass_score !== undefined) {
        setPassScore(pass_score);
      }
    } catch (error) {
      console.error("Error fetching marking scheme:", error);
      // Keep default pass score if there's an error
    }
  };

  // Calculate percentage score based on marks awarded vs total possible marks
  const calculatePercentageScore = () => {
    if (!fileData) return 0;
    const stats = getStats();
    return Math.round((stats?.totalMarksAwarded || 0) / (stats?.totalPossibleMarks || 1) * 100);
  };

  // Get grade color based on score
  const getGradeColor = (score: number) => {
    if (score >= 81) return "bg-green-600 text-white"; // A+
    if (score >= 70) return "bg-green-500 text-white"; // A and A-
    if (score >= 55) return "bg-blue-500 text-white";  // B+, B, and B-
    if (score >= 40) return "bg-yellow-500 text-white"; // C+, C, and C-
    return "bg-red-500 text-white"; // E (Fail)
  };

  // Get grade letter based on score
  const getGradeLetter = (score: number) => {
    if (score >= 81) return "A+";
    if (score >= 75) return "A";
    if (score >= 70) return "A-";
    if (score >= 65) return "B+";
    if (score >= 60) return "B";
    if (score >= 55) return "B-";
    if (score >= 50) return "C+";
    if (score >= 45) return "C";
    if (score >= 40) return "C-";
    return "E"; // Fail
  };

  // Check if student passed based on dynamic pass score
  const isPassed = (score: number) => score >= passScore;

  // Toggle question expansion
  const toggleQuestion = (questionId: number) => {
    setExpandedQuestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
      } else {
        newSet.add(questionId);
        // Scroll to the expanded question after a small delay to ensure DOM update
        setTimeout(() => {
          if (questionRefs.current[questionId]) {
            questionRefs.current[questionId]?.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'start' 
            });
          }
        }, 100);
      }
      return newSet;
    });
  };

  // Calculate statistics
  const getStats = () => {
    if (!fileData) return null;

    const correctAnswers = fileData.answers.filter(
      (a) => a.marks_for_answer > 0
    ).length;
    const totalQuestions = fileData.answers.length;
    const correctPercentage = Math.round(
      (correctAnswers / totalQuestions) * 100
    );
    const totalMarksAwarded = fileData.answers.reduce(
      (sum, a) => sum + (a.marks_for_answer || 0),
      0
    );
    const totalPossibleMarks = fileData.answers.reduce(
      (sum, a) => sum + a.allocated_marks,
      0
    );

    return {
      correctAnswers,
      totalQuestions,
      correctPercentage,
      totalMarksAwarded,
      totalPossibleMarks,
    };
  };

  // Export to Excel
  const exportToExcel = () => {
    if (!fileData) return;

    try {
      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new();

      // Format answers data for the first sheet
      const answersData = fileData.answers.map((answer) => {
        const markingScheme = fileData.marking_scheme[answer.question_id];
        return {
          "Question #": answer.question_id,
          "Question": markingScheme.question_text || "N/A",
          "Correct Answer": markingScheme.answer_text,
          "Student's Answer": answer.student_answer,
          "Marks Awarded": answer.marks_for_answer || 0,
          "Max Marks": answer.allocated_marks,
          "Status": answer.marks_for_answer > 0 ? "CORRECT" : "INCORRECT"
        };
      });

      // Add answers sheet
      const answersSheet = XLSX.utils.json_to_sheet(answersData);
      XLSX.utils.book_append_sheet(workbook, answersSheet, "Answers");

      const stats = getStats();
      const percentageScore = calculatePercentageScore();
      
      // Create summary sheet
      const summaryData = [
        ["ASSESSMENT RESULTS"],
        [""],
        ["File Name", fileData.file_name],
        ["Assignment", assignmentTitle],
        ["Module", moduleTitle],
        [""],
        ["SCORING SUMMARY"],
        [""],
        ["Total Score", percentageScore],
        ["Pass Threshold", passScore],
        ["Grade", getGradeLetter(percentageScore)],
        ["Result", isPassed(percentageScore) ? "PASS" : "FAIL"],
        [""],
        ["DETAILED BREAKDOWN"],
        [""],
        ["Total Questions", stats?.totalQuestions || 0],
        ["Correct Answers", stats?.correctAnswers || 0],
        [
          "Incorrect Answers",
          (stats?.totalQuestions || 0) - (stats?.correctAnswers || 0),
        ],
        ["Correctness Rate", `${stats?.correctPercentage || 0}%`],
        ["Total Marks Awarded", stats?.totalMarksAwarded || 0],
        ["Total Possible Marks", stats?.totalPossibleMarks || 0],
      ];

      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary");

      // Apply some styling to the header
      if (summarySheet["A1"]) {
        summarySheet["A1"].s = { font: { bold: true, sz: 14 } };
      }

      // Generate filename
      const fileName = `${
        fileData.file_name.split(".")[0]
      }_assessment_results.xlsx`;

      // Trigger download
      XLSX.writeFile(workbook, fileName);
      toast.success("Assessment results exported successfully!");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export assessment results");
    }
  };

  // Export to PDF (using print functionality)
  const printReport = () => {
    window.print();
    toast.success("Print dialog opened");
  };

  const viewOriginalFile = () => {
    if (fileData && fileData.file) {
      window.open(fileData.file, "_blank");
    } else {
      toast.error("Original file not available");
    }
  };

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen p-1 md:p-8 bg-purple-50">
          <div className="flex gap-4 items-center mb-6">
            <div className="w-24 h-10 bg-gray-300 rounded-md animate-pulse"></div>
            <div className="h-5 w-56 bg-gray-300 rounded-md animate-pulse"></div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 mb-6 animate-pulse">
            <div className="h-8 w-3/4 bg-gray-300 rounded-md mb-4"></div>
            <div className="h-6 w-1/3 bg-gray-200 rounded-md mb-6"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
            <div className="bg-white shadow-md rounded-lg p-6 h-64">
              <div className="h-6 w-40 bg-gray-300 rounded-md mb-4"></div>
              <div className="h-full w-full bg-gray-200 rounded-md"></div>
            </div>
            <div className="bg-white shadow-md rounded-lg p-6 h-64">
              <div className="h-6 w-40 bg-gray-300 rounded-md mb-4"></div>
              <div className="h-full w-full bg-gray-200 rounded-md"></div>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  const stats = getStats();
  const percentageScore = calculatePercentageScore();

  return (
    <ProtectedRoute>
      <div className="min-h-screen p-0 md:p-8 bg-purple-50 print:bg-white">
        {/* Header with navigation and actions */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mt-0 mb-6 print:hidden">
          <div className="flex items-center gap-2">
            <BackButton />
            <div className="text-gray-500 text-xs sm:text-sm hidden sm:flex items-center">
              <span
                className="hover:text-purple-600 cursor-pointer"
                onClick={() => router.push("/module")}
              >
                Modules
              </span>
              <ChevronRight className="w-3 h-3 mx-1 text-gray-400" />
              <span
                className="hover:text-purple-600 cursor-pointer"
                onClick={() => router.push(`/module/${moduleId}`)}
              >
                Module {moduleId}
              </span>
              <ChevronRight className="w-3 h-3 mx-1 text-gray-400" />
              <span
                className="hover:text-purple-600 cursor-pointer"
                onClick={() =>
                  router.push(`/module/${moduleId}/${assignmentId}`)
                }
              >
                {assignmentTitle || `Assignment ${assignmentId}`}
              </span>
              <ChevronRight className="w-3 h-3 mx-1 text-gray-400" />
              <span className="text-purple-600 font-medium truncate max-w-xs">
                {fileData?.file_name || `File ${fileId}`}
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={exportToExcel}
              className="flex items-center gap-1.5 bg-light-2 hover:bg-light-1 text-white px-3 py-1.5 rounded-md text-sm transition-all duration-200 shadow-sm"
            >
              <FileDown size={16} />
              <span>Export</span>
            </button>
            <button
              onClick={printReport}
              className="flex items-center gap-1.5 bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 px-3 py-1.5 rounded-md text-sm transition-all duration-200 shadow-sm"
            >
              <Printer size={16} />
              <span className="hidden sm:inline">Print</span>
            </button>
            <button
              onClick={viewOriginalFile}
              className="flex items-center gap-1.5 bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 px-3 py-1.5 rounded-md text-sm transition-all duration-200 shadow-sm"
            >
              <File size={16} />
              <span className="hidden sm:inline">View File</span>
            </button>
            <button
              onClick={() =>
                router.push(`/module/${moduleId}/${assignmentId}/report`)
              }
              className="flex items-center gap-1.5 bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 px-3 py-1.5 rounded-md text-sm transition-all duration-200 shadow-sm"
            >
              <BarChart4 size={16} />
              <span className="hidden sm:inline">Report</span>
            </button>
            <button
              onClick={refreshData}
              className="flex items-center gap-1.5 bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 px-3 py-1.5 rounded-md text-sm transition-all duration-200 shadow-sm"
              disabled={refreshing}
            >
              <RefreshCw
                size={16}
                className={refreshing ? "animate-spin" : ""}
              />
            </button>
          </div>
        </div>

        {fileData ? (
          <>
            {/* File Summary Card with enhanced UI */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
              <div className="p-6 border-b border-gray-100">
                <div className="flex flex-col sm:flex-row justify-between">
                  <div>
                    <div className="flex items-start sm:items-center mb-2">
                      <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 print:text-2xl mr-2">
                        Assessment Results
                      </h1>
                      <span className="px-2 py-1 text-xs sm:text-sm bg-purple-100 text-purple-800 rounded-md">
                        ID: {fileId}
                      </span>
                    </div>
                    <h2 className="text-lg text-gray-600 mb-1 flex items-center">
                      <File className="w-4 h-4 mr-1.5 text-gray-500" />
                      {fileData.file_name}
                    </h2>
                    <div className="flex flex-wrap gap-y-1 gap-x-4 mt-2 text-sm text-gray-500">
                      <div className="flex items-center">
                        <BookOpen className="w-4 h-4 mr-1.5 text-purple-500" />
                        <span>{assignmentTitle}</span>
                      </div>
                      {moduleTitle && (
                        <div className="flex items-center">
                          <span className="text-gray-400 mx-1">•</span>
                          <Calendar className="w-4 h-4 mr-1.5 text-purple-500" />
                          <span>{moduleTitle}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 sm:mt-0 flex items-start">
                    <div className="flex flex-col items-center">
                      <div
                        className={`flex flex-col items-center justify-center h-24 w-24 rounded-full ${getGradeColor(
                          percentageScore
                        )} shadow-md`}
                      >
                        <span className="text-3xl font-bold">
                          {getGradeLetter(percentageScore)}
                        </span>
                        <span className="text-sm mt-1 font-medium">Grade</span>
                      </div>
                      <div className="mt-2 flex flex-col items-center">
                        <span className="font-semibold text-lg">
                          {percentageScore}%
                        </span>
                        <span
                          className={`px-2 py-0.5 text-xs rounded-full ${
                            isPassed(percentageScore)
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {isPassed(percentageScore) ? "PASS" : "FAIL"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Enhanced Performance Metrics */}
              <div className="bg-gray-50 p-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-lg shadow-sm flex flex-col">
                  <span className="text-xs text-gray-500 mb-1 flex items-center">
                    <MessageCircle className="w-3 h-3 mr-1" />
                    Questions
                  </span>
                  <span className="text-xl font-bold text-gray-800">
                    {stats?.totalQuestions || 0}
                  </span>
                  <div className="flex items-center mt-1 text-xs">
                    <span className="text-green-600 flex items-center">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      {stats?.correctAnswers || 0} correct
                    </span>
                    <span className="mx-1">•</span>
                    <span className="text-red-500 flex items-center">
                      <XCircle className="w-3 h-3 mr-1" />
                      {(stats?.totalQuestions || 0) -
                        (stats?.correctAnswers || 0)}{" "}
                      incorrect
                    </span>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-lg shadow-sm flex flex-col">
                  <span className="text-xs text-gray-500 mb-1 flex items-center">
                    <Award className="w-3 h-3 mr-1" />
                    Accuracy
                  </span>
                  <span className="text-xl font-bold text-gray-800">
                    {stats?.correctPercentage || 0}%
                  </span>
                  <div className="mt-1 w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500"
                      style={{ width: `${stats?.correctPercentage || 0}%` }}
                    ></div>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-lg shadow-sm flex flex-col">
                  <span className="text-xs text-gray-500 mb-1 flex items-center">
                    <Info className="w-3 h-3 mr-1" />
                    Status
                  </span>
                  <span className="text-xl font-bold text-gray-800">
                    {isPassed(percentageScore) ? "Passed" : "Failed"}
                  </span>
                  <div className="flex items-center mt-1 text-xs">
                    <span className="text-gray-500">
                      Pass threshold: {passScore}%
                    </span>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-lg shadow-sm flex flex-col">
                  <span className="text-xs text-gray-500 mb-1 flex items-center">
                    <Award className="w-3 h-3 mr-1" />
                    Marks Awarded
                  </span>
                  <span className="text-xl font-bold text-gray-800">
                    {stats?.totalMarksAwarded || 0}/
                    {stats?.totalPossibleMarks || 0}
                  </span>
                  <div className="mt-1 w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-purple-500"
                      style={{
                        width: `${
                          (stats?.totalMarksAwarded /
                            (stats?.totalPossibleMarks || 1)) *
                          100
                        }%`,
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="mb-6 print:hidden">
              <div className="flex border-b border-gray-200">
                <button
                  onClick={() => setActiveTab("answers")}
                  className={`py-3 px-4 font-medium text-sm flex items-center ${
                    activeTab === "answers"
                      ? "text-purple-600 border-b-2 border-purple-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Question Breakdown
                </button>
                <button
                  onClick={() => setActiveTab("summary")}
                  className={`py-3 px-4 font-medium text-sm flex items-center ${
                    activeTab === "summary"
                      ? "text-purple-600 border-b-2 border-purple-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <BarChart4 className="w-4 h-4 mr-2" />
                  Performance Summary
                </button>
              </div>
            </div>

            {/* Enhanced Answers Table Card */}
            {(activeTab === "answers" || !activeTab) && (
              <div className="bg-white shadow-md rounded-lg p-4 sm:p-6 overflow-hidden mb-6">
                <h3 className="text-lg font-semibold mb-4 text-gray-800 flex items-center">
                  <DocumentChartBarIcon className="h-5 w-5 mr-2 text-purple-500" />
                  Question Breakdown
                </h3>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-3 sm:px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                          Q#
                        </th>
                        <th className="px-3 py-3 sm:px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Question & Correct Answer
                        </th>
                        <th className="px-3 py-3 sm:px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Student's Answer
                        </th>
                        <th className="px-3 py-3 sm:px-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                          Result
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {fileData.answers.map((answer, index) => {
                        const markingScheme =
                          fileData.marking_scheme[answer.question_id];
                        const marksForAnswer = answer.marks_for_answer || 0;
                        const allocatedMarks = answer.allocated_marks;
                        const isCorrect = marksForAnswer > 0;
                        const isExpanded = expandedQuestions.has(answer.question_id);
                        const hasQuestionText = markingScheme?.question_text && markingScheme.question_text.trim() !== "";

                        return (
                          <React.Fragment key={answer.question_id}>
                            <tr 
                              ref={el => questionRefs.current[answer.question_id] = el}
                              className={
                                index % 2 === 0
                                  ? `bg-white ${isExpanded ? 'bg-purple-50' : 'hover:bg-gray-50'}`
                                  : `bg-gray-50 ${isExpanded ? 'bg-purple-50' : 'hover:bg-gray-100'}`
                              }
                            >
                              {/* Question Number with expand button */}
                              <td className="px-3 py-4 sm:px-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                <div className="flex items-center">
                                  {hasQuestionText && (
                                    <button 
                                      onClick={() => toggleQuestion(answer.question_id)}
                                      className="mr-2 text-purple-600 hover:bg-purple-100 p-1 rounded-full"
                                    >
                                      {isExpanded ? 
                                        <ChevronUp className="w-4 h-4" /> : 
                                        <ChevronDown className="w-4 h-4" />
                                      }
                                    </button>
                                  )}
                                  <span>{answer.question_id}</span>
                                </div>
                              </td>

                              {/* Question & Correct Answer */}
                              <td className="px-3 py-4 sm:px-4 text-sm">
                                {hasQuestionText && !isExpanded && (
                                  <div 
                                    className="text-sm font-medium text-gray-900 mb-1 cursor-pointer truncate max-w-xs sm:max-w-sm" 
                                    onClick={() => toggleQuestion(answer.question_id)}
                                  >
                                    {markingScheme.question_text.length > 50 
                                      ? markingScheme.question_text.substring(0, 50) + "..." 
                                      : markingScheme.question_text}
                                  </div>
                                )}
                                <div className="text-gray-700 break-words">
                                  <span className="font-medium text-gray-600">Answer: </span>
                                  {markingScheme.answer_text}
                                </div>
                              </td>

                              {/* Student's Answer */}
                              <td className="px-3 py-4 sm:px-4 text-sm text-gray-700">
                                <div className="break-words">
                                  {answer.student_answer}
                                </div>
                              </td>

                              {/* Marks */}
                              <td className="px-3 py-4 sm:px-4 whitespace-nowrap text-sm text-center">
                                <div className="flex flex-col items-center">
                                  <span
                                    className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${
                                      isCorrect
                                        ? "bg-green-100 text-green-700"
                                        : "bg-red-100 text-red-700"
                                    }`}
                                  >
                                    {isCorrect ? (
                                      <CheckCircle className="h-5 w-5" />
                                    ) : (
                                      <XCircle className="h-5 w-5" />
                                    )}
                                  </span>
                                  <span className="mt-1 text-sm font-medium">
                                    {marksForAnswer}/{allocatedMarks}
                                  </span>
                                </div>
                              </td>
                            </tr>
                            
                            {/* Expanded question details */}
                            {isExpanded && hasQuestionText && (
                              <tr className="bg-purple-50">
                                <td className="px-3 py-4 sm:px-4" colSpan={4}>
                                  <div className="bg-white p-4 rounded-md shadow-sm">
                                    <h4 className="font-medium text-gray-800 mb-2 flex items-center">
                                      <HelpCircle className="w-4 h-4 mr-2 text-purple-600" />
                                      Question {answer.question_id}
                                    </h4>
                                    <p className="text-gray-700 mb-4 whitespace-pre-line">
                                      {markingScheme.question_text}
                                    </p>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                                      <div className="border-l-4 border-green-500 pl-3 py-2">
                                        <p className="text-xs text-gray-500 mb-1">Correct Answer:</p>
                                        <p className="text-sm text-gray-800">{markingScheme.answer_text}</p>
                                      </div>
                                      
                                      <div className={`border-l-4 pl-3 py-2 ${isCorrect ? 'border-green-500' : 'border-red-500'}`}>
                                        <p className="text-xs text-gray-500 mb-1">Student's Answer:</p>
                                        <p className="text-sm text-gray-800">{answer.student_answer}</p>
                                      </div>
                                    </div>
                                    
                                    <div className="mt-3 flex justify-between items-center">
                                      <div className="text-sm text-gray-600">
                                        <span className="font-medium">Marks: </span>
                                        <span className={isCorrect ? "text-green-600" : "text-red-600"}>
                                          {marksForAnswer}/{allocatedMarks}
                                        </span>
                                      </div>
                                      <button
                                        onClick={() => toggleQuestion(answer.question_id)}
                                        className="text-xs px-3 py-1 bg-purple-100 text-purple-700 rounded-full hover:bg-purple-200"
                                      >
                                        Collapse
                                      </button>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Enhanced Summary Card */}
            {(activeTab === "summary" || true) && (
              <div
                className={`bg-white shadow-md rounded-lg p-6 ${
                  activeTab !== "summary" && !activeTab
                    ? "hidden print:block"
                    : ""
                }`}
              >
                <h3 className="text-lg font-semibold mb-4 text-gray-800 flex items-center">
                  <BarChart4 className="h-5 w-5 mr-2 text-purple-500" />
                  Performance Summary
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Performance Metrics */}
                  <div>
                    <h4 className="font-medium text-gray-700 mb-3 flex items-center">
                      <Award className="w-4 h-4 mr-2 text-purple-500" />
                      Score Breakdown
                    </h4>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600">Correct Answers</span>
                          <span className="font-medium">
                            {stats?.correctAnswers || 0}/
                            {stats?.totalQuestions || 0}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div
                            className="bg-green-500 h-2.5 rounded-full"
                            style={{
                              width: `${stats?.correctPercentage || 0}%`,
                            }}
                          ></div>
                        </div>
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>Attempted: {stats?.totalQuestions || 0}</span>
                          <span>Correct: {stats?.correctAnswers || 0}</span>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600">Overall Score</span>
                          <span className="font-medium">
                            {percentageScore}/100
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div
                            className={`h-2.5 rounded-full ${
                              isPassed(percentageScore)
                                ? "bg-green-500"
                                : "bg-red-500"
                            }`}
                            style={{ width: `${percentageScore}%` }}
                          ></div>
                        </div>
                      </div>

                      <div className="pt-2">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-gray-600 text-sm">
                            Pass Threshold
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-medium ${
                              isPassed(percentageScore)
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {isPassed(percentageScore) ? "PASSED" : "FAILED"}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5 relative">
                          <div
                            className="absolute top-0 bottom-0 w-px bg-yellow-500"
                            style={{ left: `${passScore}%` }}
                          ></div>
                          <div
                            className={`h-2.5 rounded-full ${
                              isPassed(percentageScore)
                                ? "bg-green-500"
                                : "bg-red-500"
                            }`}
                            style={{ width: `${percentageScore}%` }}
                          ></div>
                        </div>
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>0</span>
                          <span className="text-yellow-600 font-medium">
                            {passScore}% Pass Mark
                          </span>
                          <span>100</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Grade Information */}
                  <div className="border-t pt-4 md:border-t-0 md:pt-0 md:border-l md:pl-6">
                    <h4 className="font-medium text-gray-700 mb-3 flex items-center">
                      <Award className="w-4 h-4 mr-2 text-purple-500" />
                      Grade Information
                    </h4>

                    <div className="flex items-center mb-4">
                      <div
                        className={`flex items-center justify-center h-16 w-16 rounded-full ${getGradeColor(
                          percentageScore
                        )}`}
                      >
                        <span className="text-2xl font-bold">
                          {getGradeLetter(percentageScore)}
                        </span>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm text-gray-500">Final Grade</p>
                        <p className="text-2xl font-bold">{percentageScore}%</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="text-gray-600 text-sm">
                          Total Questions
                        </span>
                        <span className="font-medium">
                          {stats?.totalQuestions || 0}
                        </span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="text-gray-600 text-sm">
                          Correct Answers
                        </span>
                        <span className="font-medium text-green-600">
                          {stats?.correctAnswers || 0}
                        </span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="text-gray-600 text-sm">
                          Incorrect Answers
                        </span>
                        <span className="font-medium text-red-600">
                          {(stats?.totalQuestions || 0) -
                            (stats?.correctAnswers || 0)}
                        </span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="text-gray-600 text-sm">
                          Marks Awarded
                        </span>
                        <span className="font-medium">
                          {stats?.totalMarksAwarded || 0}/
                          {stats?.totalPossibleMarks || 0}
                        </span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="text-gray-600 text-sm">
                          Pass Threshold
                        </span>
                        <span className="font-medium text-yellow-600">
                          {passScore}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="bg-white shadow-md rounded-lg p-6 text-center">
            <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-3" />
            <p className="text-gray-700 font-medium mb-1">File not found</p>
            <p className="text-gray-500 text-sm mb-4">
              The assessment details could not be loaded
            </p>
            <button
              onClick={() => router.push(`/module/${moduleId}/${assignmentId}`)}
              className="px-4 py-2 text-sm text-white bg-purple-600 rounded-md hover:bg-purple-700"
            >
              Return to Assignment
            </button>
          </div>
        )}
      </div>
      <ToastContainer position="top-right" autoClose={3000} theme="light" />
    </ProtectedRoute>
  );
};

export default FileDetailPage;