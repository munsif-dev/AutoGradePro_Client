"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import ProtectedRoute from "@/app/_components/ProtectedRoutes";
import BackButton from "@/app/(dashboard)/_components/BackButton";
import { Bar, Pie, Doughnut } from "react-chartjs-2";
import "chart.js/auto";
import {
  Download,
  FileSpreadsheet,
  Printer,
  Share2,
  BarChart2,
  Calendar,
  Users,
  TrendingUp,
  Award,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ChevronLeft,
  RefreshCw,
  FileDown,
  FileText,
} from "lucide-react";
import * as XLSX from "xlsx";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const AssignmentReportPage = () => {
  const { moduleId, assignmentId } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [assignmentDetails, setAssignmentDetails] = useState({
    title: "",
    description: "",
    due_date: "",
    module: { name: "", code: "" },
  });
  const [grades, setGrades] = useState<number[]>([]);
  const [passScore, setPassScore] = useState(45); // Default pass score
  const [statistics, setStatistics] = useState({
    highest: 0,
    lowest: 0,
    median: 0,
    average: 0,
    passed: 0,
    failed: 0,
  });

  useEffect(() => {
    if (assignmentId) {
      fetchReportData();
      fetchAssignmentDetails();
      fetchMarkingScheme();
    }
  }, [assignmentId]);

  const fetchMarkingScheme = async () => {
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

  const fetchAssignmentDetails = () => {
    if (!assignmentId) return;

    api
      .get(`/api/assignment/${assignmentId}/`)
      .then((res) => {
        setAssignmentDetails(res.data);
      })
      .catch((err) => {
        console.error("Failed to fetch assignment details:", err);
        toast.error("Failed to load assignment details");
      });
  };

  const fetchReportData = () => {
    if (!assignmentId) return;

    setLoading(true);
    api
      .get(`/api/assignment/${assignmentId}/report/`)
      .then((res) => {
        const { grades, highest, lowest, median, average, passed, failed } =
          res.data;
        setGrades(grades);
        setStatistics({ highest, lowest, median, average, passed, failed });
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch report data:", err);
        setLoading(false);
        toast.error("Failed to load report data");
      });
  };

  const refreshReportData = () => {
    setRefreshing(true);
    fetchReportData();
    setTimeout(() => setRefreshing(false), 1000);
    toast.success("Report data refreshed");
  };

  const getLetterGrade = (score: number): string => {
    if (score >= 90) return "A+";
    if (score >= 80) return "A";
    if (score >= 75) return "B+";
    if (score >= 70) return "B";
    if (score >= 65) return "C+";
    if (score >= 60) return "C";
    if (score >= 55) return "D+";
    if (score >= 50) return "D";
    if (score >= passScore) return "E";
    return "F";
  };

  // Get color for grades
  const getGradeColor = (grade: string): string => {
    switch (grade) {
      case "A+":
        return "rgba(0, 200, 83, 0.7)";
      case "A":
        return "rgba(56, 173, 169, 0.7)";
      case "B+":
        return "rgba(75, 192, 192, 0.7)";
      case "B":
        return "rgba(54, 162, 235, 0.7)";
      case "C+":
        return "rgba(153, 102, 255, 0.7)";
      case "C":
        return "rgba(137, 71, 153, 0.7)"; // Purple from theme
      case "D+":
        return "rgba(255, 159, 64, 0.7)";
      case "D":
        return "rgba(255, 205, 86, 0.7)";
      case "E":
        return "rgba(255, 99, 132, 0.7)";
      case "F":
        return "rgba(239, 68, 68, 0.7)"; // Red
      default:
        return "rgba(201, 203, 207, 0.7)";
    }
  };

  // Get border color for grades (darker version)
  const getGradeBorderColor = (grade: string): string => {
    switch (grade) {
      case "A+":
        return "rgb(0, 200, 83)";
      case "A":
        return "rgb(56, 173, 169)";
      case "B+":
        return "rgb(75, 192, 192)";
      case "B":
        return "rgb(54, 162, 235)";
      case "C+":
        return "rgb(153, 102, 255)";
      case "C":
        return "rgb(137, 71, 153)"; // Purple from theme
      case "D+":
        return "rgb(255, 159, 64)";
      case "D":
        return "rgb(255, 205, 86)";
      case "E":
        return "rgb(255, 99, 132)";
      case "F":
        return "rgb(239, 68, 68)"; // Red
      default:
        return "rgb(201, 203, 207)";
    }
  };

  const downloadExcel = () => {
    try {
      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new();

      // Define the data for the statistics sheet
      const statsData = [
        ["ASSIGNMENT REPORT"],
        [""],
        ["Assignment Title", assignmentDetails.title],
        [
          "Module",
          `${assignmentDetails.module.name} (${
            assignmentDetails.module.code || "N/A"
          })`,
        ],
        ["Date Generated", new Date().toLocaleString()],
        ["Pass Score", `${passScore}%`],
        [""],
        ["SUMMARY STATISTICS"],
        [""],
        ["Metric", "Value"],
        ["Total Submissions", grades.length],
        ["Highest Score", statistics.highest],
        ["Lowest Score", statistics.lowest],
        ["Median Score", statistics.median],
        ["Average Score", Number(statistics.average.toFixed(2))],
        [""],
        ["PERFORMANCE BREAKDOWN"],
        [""],
        ["Passed Students", statistics.passed],
        ["Failed Students", statistics.failed],
        [
          "Pass Rate",
          grades.length
            ? `${((statistics.passed / grades.length) * 100).toFixed(2)}%`
            : "0%",
        ],
      ];

      // Create statistics worksheet
      const statsWorksheet = XLSX.utils.aoa_to_sheet(statsData);
      XLSX.utils.book_append_sheet(workbook, statsWorksheet, "Overview");

      // Create individual scores worksheet with letter grades
      const scoresData = [
        ["STUDENT SCORES"],
        [""],
        ["Submission #", "Score", "Letter Grade", "Status"],
        ...grades.map((score, index) => [
          `Submission ${index + 1}`,
          score,
          getLetterGrade(score),
          score >= passScore ? "PASS" : "FAIL",
        ]),
      ];

      const scoresWorksheet = XLSX.utils.aoa_to_sheet(scoresData);
      XLSX.utils.book_append_sheet(workbook, scoresWorksheet, "Scores");

      // Create grade distribution worksheet
      const gradeCounts = calculateGradeDistribution();
      const gradeDistData = [
        ["GRADE DISTRIBUTION"],
        [""],
        ["Grade", "Count", "Percentage"],
        ...gradeCounts.map((item) => [
          item.grade,
          item.count,
          `${((item.count / grades.length) * 100).toFixed(1)}%`,
        ]),
      ];

      const gradeDistWorksheet = XLSX.utils.aoa_to_sheet(gradeDistData);
      XLSX.utils.book_append_sheet(
        workbook,
        gradeDistWorksheet,
        "Grade Distribution"
      );

      // Apply some styling (extra feature - XLSX.js style objects for cell formatting)
      if (statsWorksheet["A1"]) {
        statsWorksheet["A1"].s = { font: { bold: true, sz: 14 } };
      }

      // Generate the file and trigger download
      XLSX.writeFile(workbook, `${assignmentDetails.title}_Report.xlsx`);
      toast.success("Report downloaded successfully!");
    } catch (error) {
      console.error("Error generating Excel file:", error);
      toast.error("Failed to generate Excel file");
    }
  };

  // Format date in a nice readable format
  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";

    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const copyShareLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard!");
  };

  // Calculate grade distribution for the horizontal bar chart
  const calculateGradeDistribution = () => {
    if (!grades.length) return [];

    // Define grades in desired order (high to low)
    const gradeOrder = ["A+", "A", "B+", "B", "C+", "C", "D+", "D", "E", "F"];

    // Initialize counts object
    const gradeCounts = gradeOrder.map((grade) => ({ grade, count: 0 }));

    // Count grades
    grades.forEach((score) => {
      const letterGrade = getLetterGrade(score);
      const gradeItem = gradeCounts.find((item) => item.grade === letterGrade);
      if (gradeItem) gradeItem.count++;
    });

    // Filter out grades with zero count for cleaner visualization
    return gradeCounts.filter((item) => item.count > 0);
  };

  // Horizontal bar chart for grade distribution (transformed from vertical)
  const getGradeDistributionData = () => {
    const gradeCounts = calculateGradeDistribution();

    return {
      labels: gradeCounts.map((item) => item.grade),
      datasets: [
        {
          label: "Number of Students",
          data: gradeCounts.map((item) => item.count),
          backgroundColor: gradeCounts.map((item) => getGradeColor(item.grade)),
          borderColor: gradeCounts.map((item) =>
            getGradeBorderColor(item.grade)
          ),
          borderWidth: 1,
        },
      ],
    };
  };

  // Define chart colors with the existing theme
  const purpleColor = "rgba(137, 71, 153, 0.7)";
  const purpleColorBorder = "rgba(137, 71, 153, 1)";
  const lightPurpleColor = "rgba(216, 180, 254, 0.7)";
  const redColor = "rgba(239, 68, 68, 0.7)";
  const redColorBorder = "rgba(239, 68, 68, 1)";

  // Bar chart configuration for individual scores
  const chartData = {
    labels: grades.map((_, index) => `Sub ${index + 1}`),
    datasets: [
      {
        label: "Scores",
        data: grades,
        backgroundColor: grades.map((score) =>
          score < passScore ? redColor : purpleColor
        ),
        borderColor: grades.map((score) =>
          score < passScore ? redColorBorder : purpleColorBorder
        ),
        borderWidth: 1,
        borderRadius: 6,
      },
    ],
  };

  // Doughnut chart configuration for pass/fail ratio
  const doughnutData = {
    labels: ["Passed", "Failed"],
    datasets: [
      {
        data: [statistics.passed, statistics.failed],
        backgroundColor: [purpleColor, redColor],
        borderColor: [purpleColorBorder, redColorBorder],
        borderWidth: 1,
        hoverOffset: 4,
      },
    ],
  };

  // Skeleton loading state
  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen p-4 md:p-8 bg-purple-50">
          <div className="flex gap-4 items-center mb-6">
            <div className="w-24 h-10 bg-gray-300 rounded-md animate-pulse"></div>
            <div className="h-8 w-56 bg-gray-300 rounded-md animate-pulse"></div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 mb-6 animate-pulse">
            <div className="h-8 w-3/4 bg-gray-300 rounded-md mb-4"></div>
            <div className="h-6 w-1/3 bg-gray-200 rounded-md mb-6"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="bg-white shadow-md rounded-lg p-4 animate-pulse"
              >
                <div className="h-4 w-20 bg-gray-300 rounded-md mb-2"></div>
                <div className="h-8 w-16 bg-gray-300 rounded-md"></div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="bg-white shadow-md rounded-lg p-6 animate-pulse"
              >
                <div className="h-6 w-32 bg-gray-300 rounded-md mb-4"></div>
                <div className="h-64 w-full bg-gray-200 rounded-md"></div>
              </div>
            ))}
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen p-4 md:p-8 bg-purple-50 print:bg-white">
        {/* Header with navigation and actions */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-6 print:hidden">
          <div className="flex items-center gap-2">
            <BackButton variant="minimal" size="sm" destination="Assignment" />
            <div className="text-gray-500 text-xs sm:text-sm hidden sm:flex items-center">
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
              <span
                className="hover:text-purple-600 cursor-pointer"
                onClick={() =>
                  router.push(`/module/${moduleId}/${assignmentId}`)
                }
              >
                Assignment {assignmentId}
              </span>
              <span className="mx-2">/</span>
              <span className="text-purple-600 font-medium">Report</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={downloadExcel}
              className="flex items-center gap-1.5 bg-light-2 hover:bg-light-1 text-white px-3 py-1.5 rounded-md text-sm transition-all duration-200 shadow-sm"
            >
              <FileDown size={16} />
              <span>Export Excel</span>
            </button>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 px-3 py-1.5 rounded-md text-sm transition-all duration-200 shadow-sm"
            >
              <Printer size={16} />
              <span className="hidden sm:inline">Print</span>
            </button>
            <button
              onClick={copyShareLink}
              className="flex items-center gap-1.5 bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 px-3 py-1.5 rounded-md text-sm transition-all duration-200 shadow-sm"
            >
              <Share2 size={16} />
              <span className="hidden sm:inline">Share</span>
            </button>
            <button
              onClick={refreshReportData}
              className="flex items-center gap-1.5 bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 px-3 py-1.5 rounded-md text-sm transition-all duration-200 shadow-sm"
              disabled={refreshing}
            >
              <RefreshCw
                size={16}
                className={refreshing ? "animate-spin" : ""}
              />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>

        {/* Report Header Card */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col sm:flex-row justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2 print:text-2xl">
                Assessment Report
              </h1>
              <h2 className="text-lg text-gray-600">
                {assignmentDetails.title}
              </h2>
              <div className="flex items-center mt-2 text-sm text-gray-500">
                <Calendar className="w-4 h-4 mr-1.5" />
                <span>Due: {formatDate(assignmentDetails.due_date)}</span>
                {assignmentDetails.module && assignmentDetails.module.name && (
                  <>
                    <span className="mx-2">•</span>
                    <span>
                      {assignmentDetails.module.name}
                      {assignmentDetails.module.code &&
                        ` (${assignmentDetails.module.code})`}
                    </span>
                  </>
                )}
              </div>
            </div>

            <div className="mt-4 sm:mt-0 flex items-center">
              <div className="bg-purple-100 p-3 rounded-lg">
                <div className="text-sm text-gray-500 mb-1">Pass Score</div>
                <div className="text-xl font-bold text-purple-700">
                  {passScore}%
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white shadow-md rounded-lg p-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-gray-500 text-xs uppercase">Submissions</h3>
                <p className="text-2xl font-bold text-gray-800">
                  {grades.length}
                </p>
              </div>
              <div className="bg-purple-100 p-1.5 rounded-md">
                <Users size={18} className="text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white shadow-md rounded-lg p-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-gray-500 text-xs uppercase">Average</h3>
                <p className="text-2xl font-bold text-gray-800">
                  {statistics.average.toFixed(1)}
                </p>
              </div>
              <div className="bg-green-100 p-1.5 rounded-md">
                <TrendingUp size={18} className="text-green-600" />
              </div>
            </div>
            <div className="mt-2 text-xs text-gray-500">
              Median: {statistics.median}
            </div>
          </div>

          <div className="bg-white shadow-md rounded-lg p-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-gray-500 text-xs uppercase">Pass Rate</h3>
                <p className="text-2xl font-bold text-gray-800">
                  {grades.length
                    ? `${((statistics.passed / grades.length) * 100).toFixed(
                        0
                      )}%`
                    : "0%"}
                </p>
              </div>
              <div className="bg-blue-100 p-1.5 rounded-md">
                <CheckCircle size={18} className="text-blue-600" />
              </div>
            </div>
            <div className="mt-2 flex justify-between text-xs">
              <span className="text-green-600">{statistics.passed} passed</span>
              <span className="text-red-600">{statistics.failed} failed</span>
            </div>
          </div>

          <div className="bg-white shadow-md rounded-lg p-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-gray-500 text-xs uppercase">Score Range</h3>
                <p className="text-2xl font-bold text-gray-800">
                  {statistics.highest}
                </p>
              </div>
              <div className="bg-amber-100 p-1.5 rounded-md">
                <Award size={18} className="text-amber-600" />
              </div>
            </div>
            <div className="mt-2 text-xs text-gray-500">
              Min: {statistics.lowest} • Max: {statistics.highest}
            </div>
          </div>
        </div>

        {/* Charts section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Grade Distribution Chart (Horizontal Bar) */}
          <div className="bg-white shadow-md rounded-lg p-6 order-2 lg:order-1">
            <h2 className="text-lg font-semibold mb-4 text-gray-800 flex items-center">
              <BarChart2 className="w-5 h-5 mr-2 text-purple-600" />
              Grade Distribution
            </h2>
            <div className="h-80">
              <Bar
                data={getGradeDistributionData()}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  indexAxis: "y", // Horizontal bar chart
                  plugins: {
                    legend: {
                      display: false,
                    },
                    tooltip: {
                      callbacks: {
                        label: function (context) {
                          const count = context.raw as number;
                          const total = grades.length;
                          const percentage = ((count / total) * 100).toFixed(1);
                          return `${count} students (${percentage}%)`;
                        },
                      },
                    },
                  },
                  scales: {
                    x: {
                      beginAtZero: true,
                      title: {
                        display: true,
                        text: "Number of Students",
                        font: {
                          size: 12,
                        },
                      },
                      ticks: {
                        precision: 0,
                      },
                    },
                    y: {
                      title: {
                        display: true,
                        text: "Grade",
                        font: {
                          size: 12,
                        },
                      },
                    },
                  },
                }}
              />
            </div>
          </div>

          {/* Pass/Fail Doughnut Chart */}
          <div className="bg-white shadow-md rounded-lg p-6 order-1 lg:order-2">
            <h2 className="text-lg font-semibold mb-4 text-gray-800 flex items-center">
              <Award className="w-5 h-5 mr-2 text-purple-600" />
              Success Rate
            </h2>
            {grades.length > 0 ? (
              <div className="h-80 flex items-center justify-center">
                <Doughnut
                  data={doughnutData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: "bottom",
                        labels: {
                          boxWidth: 12,
                          padding: 20,
                          font: {
                            size: 12,
                          },
                        },
                      },
                      tooltip: {
                        callbacks: {
                          label: function (context) {
                            const count = context.raw as number;
                            const total = grades.length;
                            const percentage = ((count / total) * 100).toFixed(
                              1
                            );
                            const label = context.label as string;
                            return `${label}: ${count} (${percentage}%)`;
                          },
                        },
                      },
                    },
                    cutout: "65%",
                  }}
                />
              </div>
            ) : (
              <div className="h-80 flex flex-col items-center justify-center text-gray-500">
                <AlertTriangle className="w-12 h-12 text-amber-500 mb-3" />
                <p className="font-medium">No submissions to display</p>
                <p className="text-sm mt-1">
                  No data is available for analysis
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Individual Scores Chart */}
        <div className="bg-white shadow-md rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-800 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-purple-600" />
            Individual Performance
          </h2>
          {grades.length > 0 ? (
            <div className="h-80">
              <Bar
                data={chartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      display: false,
                    },
                    tooltip: {
                      callbacks: {
                        title: (items) => {
                          return `Submission ${parseInt(
                            items[0].label.replace("Sub ", "")
                          )}`;
                        },
                        label: (context) => {
                          const score = context.raw as number;
                          return [
                            `Score: ${score}`,
                            `Grade: ${getLetterGrade(score)}`,
                            `Status: ${score >= passScore ? "PASS" : "FAIL"}`,
                          ];
                        },
                      },
                    },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      max: Math.max(
                        100,
                        Math.ceil(statistics.highest / 10) * 10
                      ),
                      title: {
                        display: true,
                        text: "Score",
                        font: {
                          size: 12,
                        },
                      },
                    },
                    x: {
                      title: {
                        display: true,
                        text: "Submissions",
                        font: {
                          size: 12,
                        },
                      },
                    },
                  },
                }}
              />
            </div>
          ) : (
            <div className="h-80 flex flex-col items-center justify-center text-gray-500">
              <AlertTriangle className="w-12 h-12 text-amber-500 mb-3" />
              <p className="font-medium">No submissions to display</p>
              <p className="text-sm mt-1">No data is available for analysis</p>
            </div>
          )}
        </div>

        {/* Raw data table */}
        <div className="bg-white shadow-md rounded-lg p-6 overflow-hidden">
          <h2 className="text-lg font-semibold mb-4 text-gray-800 flex items-center">
            <FileText className="w-5 h-5 mr-2 text-purple-600" />
            Submission Details
          </h2>

          {grades.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-b">
                      ID
                    </th>
                    <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-b">
                      Score
                    </th>
                    <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-b">
                      Grade
                    </th>
                    <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-b">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {grades.map((score, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="py-3 px-4 whitespace-nowrap text-sm">
                        {index + 1}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="text-sm font-medium text-gray-900">
                            {score}
                          </div>
                          <div
                            className="ml-2 w-12 h-2 bg-gray-200 rounded-full overflow-hidden"
                            title={`${score}%`}
                          >
                            <div
                              className={`h-full ${
                                score >= passScore
                                  ? "bg-green-500"
                                  : "bg-red-500"
                              }`}
                              style={{ width: `${score}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className="inline-flex items-center justify-center w-8 h-8 rounded-full text-white text-xs font-medium"
                          style={{
                            backgroundColor: getGradeBorderColor(
                              getLetterGrade(score)
                            ),
                          }}
                        >
                          {getLetterGrade(score)}
                        </span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            score >= passScore
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {score >= passScore ? (
                            <CheckCircle className="w-3 h-3 mr-1" />
                          ) : (
                            <XCircle className="w-3 h-3 mr-1" />
                          )}
                          {score >= passScore ? "PASS" : "FAIL"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12 text-center text-gray-500">
              <AlertTriangle className="w-12 h-12 mx-auto text-amber-500 mb-3" />
              <p className="text-lg font-medium">
                No submission data available
              </p>
              <p className="mt-1 text-sm">
                Try refreshing the report or check if any files have been
                uploaded
              </p>
            </div>
          )}
        </div>
      </div>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnHover
        theme="light"
      />
    </ProtectedRoute>
  );
};

export default AssignmentReportPage;
