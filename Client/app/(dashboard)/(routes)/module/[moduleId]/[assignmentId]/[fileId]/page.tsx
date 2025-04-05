"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import api from "@/lib/api";
import ProtectedRoute from "@/app/_components/ProtectedRoutes";
import BackButton from "@/app/(dashboard)/_components/BackButton";
import {
  CheckCircleIcon,
  XCircleIcon,
  DocumentTextIcon,
  DocumentChartBarIcon,
  ArrowPathIcon,
  AcademicCapIcon,
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
  pass_score?: number; // Pass score might be included in the API response
}

const FileDetailPage = () => {
  const { moduleId, assignmentId, fileId } = useParams();
  const [fileData, setFileData] = useState<FileDetailData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"answers" | "summary">("answers");
  const [passScore, setPassScore] = useState<number>(40); // Default pass score, will be updated

  useEffect(() => {
    fetchFileDetails();
    fetchMarkingSchemeDetails(); // Get the pass score from marking scheme
  }, [fileId]);

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

  // Get grade color based on score
  const getGradeColor = (score: number) => {
    if (score >= 80) return "bg-green-600 text-white";
    if (score >= 60) return "bg-green-500 text-white";
    if (score >= passScore) return "bg-yellow-500 text-white";
    return "bg-red-500 text-white";
  };

  // Get grade letter based on score
  const getGradeLetter = (score: number) => {
    if (score >= 80) return "A";
    if (score >= 70) return "B";
    if (score >= 60) return "C";
    if (score >= 50) return "D";
    if (score >= passScore) return "E";
    return "F";
  };

  // Check if student passed based on dynamic pass score
  const isPassed = (score: number) => score >= passScore;

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
          "Correct Answer": markingScheme.answer_text,
          "Student's Answer": answer.student_answer,
          "Marks Awarded": answer.marks_for_answer || 0,
          "Max Marks": answer.allocated_marks,
          Status: answer.marks_for_answer > 0 ? "CORRECT" : "INCORRECT",
          "Grading Type": markingScheme.grading_type || "N/A",
        };
      });

      // Add answers sheet
      const answersSheet = XLSX.utils.json_to_sheet(answersData);
      XLSX.utils.book_append_sheet(workbook, answersSheet, "Answers");

      const stats = getStats();
      // Create summary sheet
      const summaryData = [
        ["GRADING REPORT SUMMARY"],
        [""],
        ["File Name", fileData.file_name],
        ["Total Score", fileData.score],
        ["Pass Threshold", passScore],
        ["Grade", getGradeLetter(fileData.score)],
        ["Result", isPassed(fileData.score) ? "PASS" : "FAIL"],
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
      }_grading_report.xlsx`;

      // Trigger download
      XLSX.writeFile(workbook, fileName);
      toast.success("Report exported successfully!");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export report");
    }
  };

  // Export to PDF (using print functionality)
  const printReport = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex flex-col bg-purple-50">
          <div className="flex gap-4 items-center m-4 mb-0">
            <BackButton />
          </div>
          <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center bg-white p-8 rounded-lg shadow-md">
              <div className="animate-spin h-12 w-12 mb-4 border-4 border-purple-500 border-t-transparent rounded-full"></div>
              <p className="text-gray-700 font-medium">
                Loading assessment details...
              </p>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  const stats = getStats();

  return (
    <ProtectedRoute>
      <div className="min-h-screen flex flex-col pb-8 bg-purple-50 print:bg-white">
        <div className="flex gap-4 items-center m-4 mb-6 print:hidden">
          <BackButton />
          <h1 className="text-3xl font-bold text-gray-800">
            Assessment Details
          </h1>
        </div>

        <div className="px-4 sm:px-6 max-w-7xl mx-auto w-full">
          {fileData ? (
            <>
              {/* Header Section with Grade */}
              <div className="flex flex-col md:flex-row gap-6 mb-6 print:flex-row">
                {/* File Info Card */}
                <div className="bg-white shadow-md rounded-lg p-6 flex-1">
                  <div className="flex items-start">
                    <div className="bg-purple-100 p-3 rounded-full mr-4">
                      <FileText className="h-6 w-6 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-xl font-bold text-gray-800 break-words mb-1">
                        {fileData.file_name}
                      </h2>
                      <p className="text-sm text-gray-500 mb-4">
                        Assessment ID: {fileId}
                      </p>

                      <div className="flex flex-wrap gap-2 mt-4 print:hidden">
                        <button
                          onClick={exportToExcel}
                          className="inline-flex items-center px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm rounded-md transition-colors duration-200"
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Export Excel
                        </button>
                        <button
                          onClick={printReport}
                          className="inline-flex items-center px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-md transition-colors duration-200"
                        >
                          <Printer className="h-4 w-4 mr-1" />
                          Print Report
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Grade Card */}
                <div className="bg-white shadow-md rounded-lg p-6 md:w-80 print:w-80">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-lg font-semibold text-gray-700">
                      Final Grade
                    </h3>
                    <span
                      className={`px-2 py-1 rounded-md text-xs font-bold ${
                        isPassed(fileData.score)
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {isPassed(fileData.score) ? "PASS" : "FAIL"}
                    </span>
                  </div>

                  <div className="flex items-center">
                    <div
                      className={`flex items-center justify-center h-20 w-20 rounded-full ${getGradeColor(
                        fileData.score
                      )}`}
                    >
                      <span className="text-3xl font-bold">
                        {getGradeLetter(fileData.score)}
                      </span>
                    </div>
                    <div className="ml-4">
                      <div className="text-3xl font-bold text-gray-800">
                        {fileData.score}
                        <span className="text-lg text-gray-500">/100</span>
                      </div>
                      <div className="text-sm text-gray-600">
                        {stats?.correctAnswers || 0}/
                        {stats?.totalQuestions || 0} correct
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tab Navigation */}
              <div className="mb-6 print:hidden">
                <div className="flex border-b border-gray-200">
                  <button
                    onClick={() => setActiveTab("answers")}
                    className={`py-3 px-4 font-medium text-sm ${
                      activeTab === "answers"
                        ? "text-purple-600 border-b-2 border-purple-600"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    Question Breakdown
                  </button>
                  <button
                    onClick={() => setActiveTab("summary")}
                    className={`py-3 px-4 font-medium text-sm ${
                      activeTab === "summary"
                        ? "text-purple-600 border-b-2 border-purple-600"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    Performance Summary
                  </button>
                </div>
              </div>

              {/* Answers Table Card - shown when answers tab is active or when printing */}
              {(activeTab === "answers" || !activeTab) && (
                <div className="bg-white shadow-md rounded-lg p-4 sm:p-6 overflow-hidden mb-6">
                  <h3 className="text-xl font-semibold mb-4 text-gray-800 flex items-center">
                    <DocumentChartBarIcon className="h-6 w-6 mr-2 text-purple-500" />
                    Question Breakdown
                  </h3>

                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-3 sm:px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                            Q#
                          </th>
                          <th className="px-3 py-3 sm:px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Correct Answer
                          </th>
                          <th className="px-3 py-3 sm:px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Student's Answer
                          </th>
                          <th className="px-3 py-3 sm:px-6 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
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

                          return (
                            <tr
                              key={answer.question_id}
                              className={
                                index % 2 === 0
                                  ? "bg-white hover:bg-gray-50"
                                  : "bg-gray-50 hover:bg-gray-100"
                              }
                            >
                              {/* Question Number */}
                              <td className="px-3 py-4 sm:px-6 whitespace-nowrap text-sm font-medium text-gray-900">
                                {answer.question_id}
                              </td>

                              {/* Correct Answer */}
                              <td className="px-3 py-4 sm:px-6 text-sm text-gray-700">
                                <div className="break-words">
                                  {markingScheme.answer_text}
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                  Type:{" "}
                                  {markingScheme.grading_type || "Standard"}
                                </div>
                              </td>

                              {/* Student's Answer */}
                              <td className="px-3 py-4 sm:px-6 text-sm text-gray-700">
                                <div className="break-words">
                                  {answer.student_answer}
                                </div>
                              </td>

                              {/* Marks */}
                              <td className="px-3 py-4 sm:px-6 whitespace-nowrap text-sm text-center">
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
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Summary Card - shown when summary tab is active or always when printing */}
              {(activeTab === "summary" || true) && (
                <div
                  className={`bg-white shadow-md rounded-lg p-6 ${
                    activeTab !== "summary" && !activeTab
                      ? "hidden print:block"
                      : ""
                  }`}
                >
                  <h3 className="text-xl font-semibold mb-4 text-gray-800 flex items-center">
                    <BarChart4 className="h-6 w-6 mr-2 text-purple-500" />
                    Performance Summary
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Performance Metrics */}
                    <div>
                      <h4 className="font-medium text-gray-700 mb-3">
                        Score Breakdown
                      </h4>
                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-600">
                              Correct Answers
                            </span>
                            <span className="font-medium">
                              {stats?.correctAnswers || 0}/
                              {stats?.totalQuestions || 0}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-green-500 h-2 rounded-full"
                              style={{
                                width: `${stats?.correctPercentage || 0}%`,
                              }}
                            ></div>
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-600">Overall Score</span>
                            <span className="font-medium">
                              {fileData.score}/100
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                isPassed(fileData.score)
                                  ? "bg-green-500"
                                  : "bg-red-500"
                              }`}
                              style={{ width: `${fileData.score}%` }}
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
                                isPassed(fileData.score)
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {isPassed(fileData.score) ? "PASSED" : "FAILED"}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2 relative">
                            <div
                              className="absolute top-0 bottom-0 w-px bg-yellow-500"
                              style={{ left: `${passScore}%` }}
                            ></div>
                            <div
                              className={`h-2 rounded-full ${
                                isPassed(fileData.score)
                                  ? "bg-green-500"
                                  : "bg-red-500"
                              }`}
                              style={{ width: `${fileData.score}%` }}
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
                      <h4 className="font-medium text-gray-700 mb-3">
                        Grade Information
                      </h4>

                      <div className="flex items-center mb-4">
                        <div
                          className={`flex items-center justify-center h-16 w-16 rounded-full ${getGradeColor(
                            fileData.score
                          )}`}
                        >
                          <span className="text-2xl font-bold">
                            {getGradeLetter(fileData.score)}
                          </span>
                        </div>
                        <div className="ml-4">
                          <p className="text-sm text-gray-500">Final Grade</p>
                          <p className="text-2xl font-bold">
                            {fileData.score}%
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between py-1 border-b border-gray-100">
                          <span className="text-gray-600 text-sm">
                            Total Questions
                          </span>
                          <span className="font-medium">
                            {stats?.totalQuestions || 0}
                          </span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-gray-100">
                          <span className="text-gray-600 text-sm">
                            Correct Answers
                          </span>
                          <span className="font-medium text-green-600">
                            {stats?.correctAnswers || 0}
                          </span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-gray-100">
                          <span className="text-gray-600 text-sm">
                            Incorrect Answers
                          </span>
                          <span className="font-medium text-red-600">
                            {(stats?.totalQuestions || 0) -
                              (stats?.correctAnswers || 0)}
                          </span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-gray-100">
                          <span className="text-gray-600 text-sm">
                            Marks Awarded
                          </span>
                          <span className="font-medium">
                            {stats?.totalMarksAwarded || 0}/
                            {stats?.totalPossibleMarks || 0}
                          </span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-gray-100">
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
              <p className="text-gray-500">File not found or failed to load</p>
            </div>
          )}
        </div>
      </div>
      <ToastContainer position="top-right" autoClose={3000} />
    </ProtectedRoute>
  );
};

export default FileDetailPage;
