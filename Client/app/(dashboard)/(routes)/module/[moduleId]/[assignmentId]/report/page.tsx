"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import ProtectedRoute from "@/app/_components/ProtectedRoutes";
import BackButton from "@/app/(dashboard)/_components/BackButton";
import { Bar, Pie, Doughnut, Line } from "react-chartjs-2";
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
  ChevronDown,
  ChevronUp,
  PieChart,
  Medal,
  Percent,
  HelpCircle,
  Filter,
  BarChart,
  LineChart,
  Bell,
  Info,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  ClipboardList,
} from "lucide-react";
import * as XLSX from "xlsx";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Define grade boundaries according to specified ranges
const GRADE_BOUNDARIES = [
  { grade: "A+", min: 81, max: 100, color: "rgb(0, 200, 83)" },
  { grade: "A", min: 75, max: 80, color: "rgb(56, 173, 169)" },
  { grade: "A-", min: 70, max: 74, color: "rgb(75, 192, 192)" },
  { grade: "B+", min: 65, max: 69, color: "rgb(54, 162, 235)" },
  { grade: "B", min: 60, max: 64, color: "rgb(153, 102, 255)" },
  { grade: "B-", min: 55, max: 59, color: "rgb(137, 71, 153)" },
  { grade: "C+", min: 50, max: 54, color: "rgb(255, 159, 64)" },
  { grade: "C", min: 45, max: 49, color: "rgb(255, 205, 86)" },
  { grade: "C-", min: 40, max: 44, color: "rgb(255, 99, 132)" },
  { grade: "E", min: 0, max: 39, color: "rgb(239, 68, 68)" },
];

// Add function to convert raw scores to percentages
const convertToPercentage = (score: number, totalPossibleMarks: number = 100): number => {
  // If the score is already a percentage (0-100) or the total marks is 100, return it as is
  if ((score <= 100 && totalPossibleMarks === 100) || totalPossibleMarks === 0) {
    return score;
  }
  
  // Otherwise, convert to percentage
  return Math.round((score / totalPossibleMarks) * 100);
};

interface SubmissionWithRank {
  id: number;
  file_name: string;
  score: number;
  rawScore?: number; // Original score before percentage conversion
  grade: string;
  rank: number;
  percentile: number;
  status: "pass" | "fail";
}

interface GradeDistribution {
  grade: string;
  count: number;
  color: string;
  percentage: number;
  min: number;
  max: number;
}

interface FileDetail {
  id: number;
  file_name: string;
  score: number;
}

interface Statistics {
  highest: number;
  lowest: number;
  median: number;
  average: number;
  passed: number;
  failed: number;
  standardDeviation: number;
  totalPossibleMarks: number;
}

const AssignmentReportPage = () => {
  const { moduleId, assignmentId } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const [assignmentDetails, setAssignmentDetails] = useState({
    title: "",
    description: "",
    due_date: "",
    module: { name: "", code: "" },
  });
  const [grades, setGrades] = useState<number[]>([]);
  // Array to store file names corresponding to grades
  const [files, setFiles] = useState<FileDetail[]>([]);
  const [passScore, setPassScore] = useState(40); // Default pass score matches the C- threshold
  const [statistics, setStatistics] = useState<Statistics>({
    highest: 0,
    lowest: 0,
    median: 0,
    average: 0,
    passed: 0,
    failed: 0,
    standardDeviation: 0,
    totalPossibleMarks: 100, // Default to 100
  });
  const [activeTab, setActiveTab] = useState<"overview" | "distribution" | "rankings">("overview");
  const [showGradeInfo, setShowGradeInfo] = useState(false);
  const [chartType, setChartType] = useState<"bar" | "line">("bar");
  const [filterStatus, setFilterStatus] = useState<"all" | "pass" | "fail">("all");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    if (assignmentId) {
      fetchReportData();
      fetchAssignmentDetails();
      fetchMarkingScheme();
      fetchSubmissionFiles();
    }
  }, [assignmentId]);

  const fetchMarkingScheme = async () => {
    if (!assignmentId) return;

    try {
      const response = await api.get(
        `/api/assignment/${assignmentId}/marking-scheme/detail/`
      );
      const { pass_score, answers } = response.data;
      if (pass_score !== undefined) {
        setPassScore(pass_score);
      }
      
      // If answers are available, calculate total possible marks
      if (answers && Array.isArray(answers)) {
        const totalMarks = answers.reduce((total, answer) => total + (answer.marks || 0), 0);
        setStatistics(prev => ({ ...prev, totalPossibleMarks: totalMarks || 100 }));
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

  // Fetch file details to get the file names
  const fetchSubmissionFiles = () => {
    if (!assignmentId) return;

    api
      .get(`/api/submission/${assignmentId}/files/`)
      .then((res) => {
        setFiles(res.data);
      })
      .catch((err) => {
        console.error("Failed to fetch submission files:", err);
      });
  };

  const fetchReportData = () => {
    if (!assignmentId) return;

    setLoading(true);
    api
      .get(`/api/assignment/${assignmentId}/report/`)
      .then((res) => {
        const { grades, highest, lowest, median, average, passed, failed, totalMarks } = res.data;
        setGrades(grades);
        
        // Use totalMarks from response or keep existing value
        const totalPossibleMarks = totalMarks || statistics.totalPossibleMarks;
        
        // Calculate standard deviation on original scores
        const stdDev = calculateStandardDeviation(grades, average);
        
        // Convert values to percentages if needed
        setStatistics({ 
          highest: convertToPercentage(highest, totalPossibleMarks), 
          lowest: convertToPercentage(lowest, totalPossibleMarks), 
          median: convertToPercentage(median, totalPossibleMarks), 
          average: convertToPercentage(average, totalPossibleMarks), 
          passed, 
          failed,
          standardDeviation: stdDev,
          totalPossibleMarks
        });
        
        setLoading(false);
        setLastRefreshed(new Date());
      })
      .catch((err) => {
        console.error("Failed to fetch report data:", err);
        setLoading(false);
        toast.error("Failed to load report data");
      });
  };

  const calculateStandardDeviation = (scores: number[], mean: number) => {
    if (scores.length <= 1) return 0;
    
    const variance = scores.reduce((sum, score) => {
      return sum + Math.pow(score - mean, 2);
    }, 0) / (scores.length - 1); // Using sample standard deviation (n-1)
    
    return Math.sqrt(variance);
  };

  const refreshReportData = () => {
    setRefreshing(true);
    Promise.all([
      fetchReportData(),
      fetchSubmissionFiles()
    ]).then(() => {
      setTimeout(() => setRefreshing(false), 1000);
      toast.success("Report data refreshed");
    });
  };

  // Get letter grade based on score
  const getLetterGrade = (score: number, totalPossibleMarks: number = 100): string => {
    // Convert to percentage if needed
    const percentageScore = convertToPercentage(score, totalPossibleMarks);
    
    // Find the grade boundary that matches this percentage
    const gradeInfo = GRADE_BOUNDARIES.find(g => 
      percentageScore >= g.min && percentageScore <= g.max
    );
    
    return gradeInfo ? gradeInfo.grade : "E";
  };

  // Get color for grades
  const getGradeColor = (grade: string): string => {
    const gradeInfo = GRADE_BOUNDARIES.find(g => g.grade === grade);
    if (gradeInfo) {
      return gradeInfo.color.replace('rgb', 'rgba').replace(')', ', 0.7)');
    }
    return "rgba(201, 203, 207, 0.7)"; // Default gray
  };

  // Get border color for grades (darker version)
  const getGradeBorderColor = (grade: string): string => {
    const gradeInfo = GRADE_BOUNDARIES.find(g => g.grade === grade);
    return gradeInfo ? gradeInfo.color : "rgb(201, 203, 207)";
  };

  // Download Excel report
  const downloadExcel = () => {
    try {
      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new();
      
      // Get ranked submissions with percentage scores
      const rankedSubmissions = getRankedSubmissions();

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
        ["Total Possible Marks", statistics.totalPossibleMarks],
        [""],
        ["SUMMARY STATISTICS"],
        [""],
        ["Metric", "Value"],
        ["Total Submissions", grades.length],
        ["Highest Score", statistics.highest + "%"],
        ["Lowest Score", statistics.lowest + "%"],
        ["Median Score", statistics.median + "%"],
        ["Average Score", statistics.average.toFixed(2) + "%"],
        ["Standard Deviation", statistics.standardDeviation.toFixed(2)],
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

      // Create individual scores worksheet with letter grades and rankings
      const scoresData = [
        ["STUDENT SCORES AND RANKINGS"],
        [""],
        ["Rank", "File Name", "Raw Score", "Percentage Score", "Letter Grade", "Status", "Percentile"],
        ...rankedSubmissions.map((submission) => [
          submission.rank,
          submission.file_name,
          submission.rawScore || submission.score,
          submission.score + "%",
          submission.grade,
          submission.score >= passScore ? "PASS" : "FAIL",
          `${submission.percentile.toFixed(1)}%`,
        ]),
      ];

      const scoresWorksheet = XLSX.utils.aoa_to_sheet(scoresData);
      XLSX.utils.book_append_sheet(workbook, scoresWorksheet, "Scores & Rankings");

      // Create grade distribution worksheet
      const gradeDist = getGradeDistributionData();
      const gradeDistData = [
        ["GRADE DISTRIBUTION"],
        [""],
        ["Grade", "Count", "Percentage", "Score Range"],
        ...GRADE_BOUNDARIES.map(boundary => {
          const gradeInfo = gradeDist.find(g => g.grade === boundary.grade);
          return [
            boundary.grade,
            gradeInfo ? gradeInfo.count : 0,
            gradeInfo ? `${gradeInfo.percentage.toFixed(1)}%` : "0%",
            `${boundary.min}-${boundary.max}%`,
          ];
        }),
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

  const copyShareLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard!");
  };

  // Calculate grade distribution for charts
  const getGradeDistributionData = () => {
    if (!grades.length) return [];

    // Calculate distribution of grades
    const distribution: GradeDistribution[] = GRADE_BOUNDARIES.map(boundary => ({
      grade: boundary.grade,
      count: 0,
      color: boundary.color,
      percentage: 0,
      min: boundary.min,
      max: boundary.max
    }));

    // Count grades using percentage scores
    getRankedSubmissions().forEach((submission) => {
      const gradeItem = distribution.find((item) => item.grade === submission.grade);
      if (gradeItem) gradeItem.count++;
    });

    // Calculate percentages
    distribution.forEach(item => {
      item.percentage = (item.count / grades.length) * 100;
    });

    // Filter out grades with zero count for cleaner visualization
    return distribution.filter((item) => item.count > 0);
  };

  // Horizontal bar chart for grade distribution
  const getGradeDistributionChartData = () => {
    const gradeCounts = getGradeDistributionData();

    return {
      labels: gradeCounts.map((item) => `${item.grade} (${item.min}-${item.max})`),
      datasets: [
        {
          label: "Number of Students",
          data: gradeCounts.map((item) => item.count),
          backgroundColor: gradeCounts.map((item) => 
            item.color.replace('rgb', 'rgba').replace(')', ', 0.7)')
          ),
          borderColor: gradeCounts.map((item) => item.color),
          borderWidth: 1,
        },
      ],
    };
  };

  // Define chart colors with the existing theme
  const purpleColor = "rgba(137, 71, 153, 0.7)";
  const purpleColorBorder = "rgba(137, 71, 153, 1)";
  const redColor = "rgba(239, 68, 68, 0.7)";
  const redColorBorder = "rgba(239, 68, 68, 1)";

  // Generate ranked submissions with percentiles
  const getRankedSubmissions = (): SubmissionWithRank[] => {
    // Clone and sort grades in descending order
    const sortedGrades = [...grades].sort((a, b) => b - a);
    
    // Create array of submission objects with ranks
    const submissions: SubmissionWithRank[] = grades.map((score, index) => {
      // Convert raw score to percentage
      const percentageScore = convertToPercentage(score, statistics.totalPossibleMarks);
      
      // Find position in sorted array (0-based)
      const position = sortedGrades.indexOf(score);
      // Find scores with same value to handle ties
      const tiedScores = sortedGrades.filter(s => s === score);
      // Calculate rank with ties
      const rank = sortedGrades.findIndex(s => s === score) + 1;
      // Calculate percentile (percentage of scores below this score)
      const scoresBelow = grades.filter(s => s < score).length;
      const percentile = (scoresBelow / grades.length) * 100;
      
      // Get file name from files array if available, otherwise use a default
      const fileInfo = files.find((f, i) => i === index);
      const fileName = fileInfo ? fileInfo.file_name : `Unknown File ${index + 1}`;
      
      return {
        id: Math.random(), // Just for rendering purposes
        file_name: fileName,
        score: percentageScore, // Use percentage score
        rawScore: score, // Keep original raw score
        grade: getLetterGrade(score, statistics.totalPossibleMarks),
        rank,
        percentile,
        status: percentageScore >= passScore ? "pass" : "fail"
      };
    });
    
    // Sort submissions by score (descending)
    return submissions.sort((a, b) => b.score - a.score);
  };

  // Get filtered submissions based on selected filter
  const getFilteredSubmissions = () => {
    const allSubmissions = getRankedSubmissions();
    
    switch (filterStatus) {
      case "pass":
        return allSubmissions.filter(s => s.status === "pass");
      case "fail":
        return allSubmissions.filter(s => s.status === "fail");
      default:
        return allSubmissions;
    }
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

  // Individual performance chart data
  const getPerformanceChartData = () => {
    // Filter submissions based on current filter
    const filteredSubmissions = getFilteredSubmissions();
    const scores = filteredSubmissions.map(s => s.score);
    const labels = filteredSubmissions.map(s => s.file_name);
    
    return {
      labels,
      datasets: [
        {
          label: "Scores",
          data: scores,
          backgroundColor: scores.map((score) =>
            score < passScore ? redColor : purpleColor
          ),
          borderColor: scores.map((score) =>
            score < passScore ? redColorBorder : purpleColorBorder
          ),
          borderWidth: 1,
          borderRadius: 6,
        },
      ],
    };
  };
  
  // Line chart data for trend analysis
  const getScoreTrendData = () => {
    // Sort submissions by score for trend analysis
    const sortedSubmissions = [...getFilteredSubmissions()].sort((a, b) => a.score - b.score);
    
    return {
      labels: sortedSubmissions.map(s => s.file_name),
      datasets: [
        {
          label: "Scores",
          data: sortedSubmissions.map(s => s.score),
          borderColor: purpleColorBorder,
          backgroundColor: "transparent",
          pointBackgroundColor: sortedSubmissions.map(s => 
            s.score >= passScore ? "rgba(137, 71, 153, 1)" : "rgba(239, 68, 68, 1)"
          ),
          pointBorderColor: "#fff",
          tension: 0.2,
          fill: false,
        },
        {
          label: "Average",
          data: Array(sortedSubmissions.length).fill(statistics.average),
          borderColor: "rgba(75, 192, 192, 1)",
          borderDash: [5, 5],
          borderWidth: 1,
          pointRadius: 0,
          fill: false,
        },
        {
          label: "Pass Threshold",
          data: Array(sortedSubmissions.length).fill(passScore),
          borderColor: "rgba(255, 159, 64, 1)",
          borderDash: [3, 3],
          borderWidth: 1,
          pointRadius: 0,
          fill: false,
        },
      ],
    };
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
              title="Export detailed report to Excel"
            >
              <FileDown size={16} />
              <span>Export Excel</span>
            </button>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 px-3 py-1.5 rounded-md text-sm transition-all duration-200 shadow-sm"
              title="Print report"
            >
              <Printer size={16} />
              <span className="hidden sm:inline">Print</span>
            </button>
            <button
              onClick={copyShareLink}
              className="flex items-center gap-1.5 bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 px-3 py-1.5 rounded-md text-sm transition-all duration-200 shadow-sm"
              title="Copy link to clipboard"
            >
              <Share2 size={16} />
              <span className="hidden sm:inline">Share</span>
            </button>
            <button
              onClick={refreshReportData}
              className="flex items-center gap-1.5 bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 px-3 py-1.5 rounded-md text-sm transition-all duration-200 shadow-sm"
              disabled={refreshing}
              title="Refresh report data"
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
              <div className="flex flex-wrap items-center mt-2 text-sm text-gray-500">
                <div className="flex items-center mr-4">
                  <Calendar className="w-4 h-4 mr-1.5 text-purple-500" />
                  <span>Due: {formatDate(assignmentDetails.due_date)}</span>
                </div>
                {assignmentDetails.module && assignmentDetails.module.name && (
                  <div className="flex items-center">
                    <BookOpen className="w-4 h-4 mr-1.5 text-purple-500" />
                    <span>
                      {assignmentDetails.module.name}
                      {assignmentDetails.module.code &&
                        ` (${assignmentDetails.module.code})`}
                    </span>
                  </div>
                )}
                {lastRefreshed && (
                  <div className="flex items-center mt-1 sm:mt-0 sm:ml-4">
                    <Clock className="w-4 h-4 mr-1.5 text-gray-400" />
                    <span className="text-gray-400 text-xs">
                      Updated: {formatRelativeTime(lastRefreshed)}
                    </span>
                  </div>
                )}
              </div>
              {statistics.totalPossibleMarks !== 100 && (
                <div className="mt-2 text-xs text-gray-500">
                  <Info className="w-3 h-3 inline mr-1" />
                  All scores shown as percentages. Total possible marks: {statistics.totalPossibleMarks}
                </div>
              )}
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

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-md mb-6 overflow-hidden">
          <div className="flex border-b border-gray-200 overflow-x-auto">
            <button
              onClick={() => setActiveTab("overview")}
              className={`px-4 py-3 font-medium text-sm whitespace-nowrap ${
                activeTab === "overview"
                  ? "text-purple-600 border-b-2 border-purple-600"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab("distribution")}
              className={`px-4 py-3 font-medium text-sm whitespace-nowrap ${
                activeTab === "distribution"
                  ? "text-purple-600 border-b-2 border-purple-600"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
            >
              Grade Distribution
            </button>
            <button
              onClick={() => setActiveTab("rankings")}
              className={`px-4 py-3 font-medium text-sm whitespace-nowrap ${
                activeTab === "rankings"
                  ? "text-purple-600 border-b-2 border-purple-600"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
            >
              Rankings
            </button>
          </div>
          
          {/* Tab Content */}
          <div className="p-6">
            {/* Overview Tab Content */}
            {activeTab === "overview" && (
              <>
                {/* Statistics cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-white shadow-sm border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-gray-500 text-xs uppercase flex items-center">
                          <Users className="w-3 h-3 mr-1 text-purple-500" /> 
                          Submissions
                        </h3>
                        <p className="text-2xl font-bold text-gray-800">
                          {grades.length}
                        </p>
                      </div>
                      <div className="bg-purple-100 p-1.5 rounded-md">
                        <Users size={18} className="text-purple-600" />
                      </div>
                    </div>
                    <div className="mt-1 text-xs text-gray-500">
                      {files.length > 0 && `${files.length} files assessed`}
                    </div>
                  </div>

                  <div className="bg-white shadow-sm border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-gray-500 text-xs uppercase flex items-center">
                          <BarChart2 className="w-3 h-3 mr-1 text-green-500" /> 
                          Average
                        </h3>
                        <div className="flex items-center">
                          <p className="text-2xl font-bold text-gray-800">
                            {statistics.average.toFixed(1)}%
                          </p>
                          {statistics.average > passScore ? (
                            <span className="ml-1 text-green-500">
                              <ArrowUpRight size={16} />
                            </span>
                          ) : (
                            <span className="ml-1 text-red-500">
                              <ArrowDownRight size={16} />
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="bg-green-100 p-1.5 rounded-md">
                        <TrendingUp size={18} className="text-green-600" />
                      </div>
                    </div>
                    <div className="mt-1 text-xs text-gray-500 flex justify-between">
                      <span>Median: {statistics.median}%</span>
                      <span>StdDev: {statistics.standardDeviation.toFixed(1)}</span>
                    </div>
                  </div>

                  <div className="bg-white shadow-sm border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-gray-500 text-xs uppercase flex items-center">
                          <Percent className="w-3 h-3 mr-1 text-blue-500" /> 
                          Pass Rate
                        </h3>
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
                    <div className="mt-1 text-xs flex justify-between">
                      <span className="text-green-600">{statistics.passed} passed</span>
                      <span className="text-red-600">{statistics.failed} failed</span>
                    </div>
                  </div>

                  <div className="bg-white shadow-sm border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-gray-500 text-xs uppercase flex items-center">
                          <Award className="w-3 h-3 mr-1 text-amber-500" /> 
                          Score Range
                        </h3>
                        <p className="text-2xl font-bold text-gray-800">
                          {statistics.highest}%
                        </p>
                      </div>
                      <div className="bg-amber-100 p-1.5 rounded-md">
                        <Award size={18} className="text-amber-600" />
                      </div>
                    </div>
                    <div className="mt-1 text-xs text-gray-500">
                      Min: {statistics.lowest}% • Max: {statistics.highest}%
                    </div>
                  </div>
                </div>

                {/* Charts section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  {/* Grade Distribution Chart */}
                  <div className="bg-white shadow-md rounded-lg p-6 border">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                        <BarChart2 className="w-5 h-5 mr-2 text-purple-600" />
                        Grade Distribution
                      </h2>
                      <button
                        onClick={() => setShowGradeInfo(!showGradeInfo)}
                        className="text-gray-500 hover:text-purple-600"
                        title="Show grade boundaries"
                      >
                        <HelpCircle size={16} />
                      </button>
                    </div>
                    
                    {/* Grade info popover */}
                    {showGradeInfo && (
                      <div className="bg-gray-50 border rounded-md p-3 mb-4 text-sm">
                        <h3 className="font-medium text-gray-700 mb-2 flex items-center">
                          <Info className="w-4 h-4 mr-1 text-purple-600" />
                          Grade Boundaries
                        </h3>
                        <div className="grid grid-cols-2 gap-2">
                          {GRADE_BOUNDARIES.map((boundary) => (
                            <div key={boundary.grade} className="flex items-center">
                              <div 
                                className="w-3 h-3 rounded-full mr-1" 
                                style={{ backgroundColor: boundary.color }}
                              ></div>
                              <span className="font-medium">{boundary.grade}:</span>
                              <span className="ml-1 text-gray-600">
                                {boundary.min}-{boundary.max}%
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div className="h-72">
                      <Bar
                        data={getGradeDistributionChartData()}
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
                  <div className="bg-white shadow-md rounded-lg p-6 border">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                        <Award className="w-5 h-5 mr-2 text-purple-600" />
                        Success Rate
                      </h2>
                      <div className="text-xs text-gray-500">
                        Pass Score: {passScore}%
                      </div>
                    </div>
                    
                    {grades.length > 0 ? (
                      <div className="h-72 flex items-center justify-center">
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
                      <div className="h-72 flex flex-col items-center justify-center text-gray-500">
                        <AlertTriangle className="w-12 h-12 text-amber-500 mb-3" />
                        <p className="font-medium">No submissions to display</p>
                        <p className="text-sm mt-1">
                          No data is available for analysis
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Score Trend Line Chart */}
                <div className="bg-white shadow-md rounded-lg p-6 mb-6 border">
                  <h2 className="text-lg font-semibold mb-4 text-gray-800 flex items-center">
                    <LineChart className="w-5 h-5 mr-2 text-purple-600" />
                    Score Distribution
                  </h2>
                  
                  {grades.length > 0 ? (
                    <div className="h-72">
                      <Line
                        data={getScoreTrendData()}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            tooltip: {
                              callbacks: {
                                title: (items) => {
                                  return items[0].label;
                                },
                                label: (context) => {
                                  if (context.dataset.label === "Scores") {
                                    const score = context.raw as number;
                                    return [
                                      `Score: ${score}%`,
                                      `Grade: ${getLetterGrade(score)}`,
                                      `Status: ${score >= passScore ? "PASS" : "FAIL"}`,
                                    ];
                                  }
                                  return `${context.dataset.label}: ${context.raw}%`;
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
                                text: "Score (%)",
                                font: {
                                  size: 12,
                                },
                              },
                            },
                            x: {
                              title: {
                                display: true,
                                text: "Submissions (Sorted by Score)",
                                font: {
                                  size: 12,
                                },
                              },
                              ticks: {
                                display: false // Hide x-axis labels for cleaner look
                              }
                            },
                          },
                        }}
                      />
                    </div>
                  ) : (
                    <div className="h-72 flex flex-col items-center justify-center text-gray-500">
                      <AlertTriangle className="w-12 h-12 text-amber-500 mb-3" />
                      <p className="font-medium">No data available</p>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Grade Distribution Tab */}
            {activeTab === "distribution" && (
              <>
                {/* Grade Distribution Explanation */}
                <div className="bg-white shadow-md rounded-lg p-6 mb-6 border">
                  <h2 className="text-lg font-semibold mb-4 text-gray-800 flex items-center">
                    <Info className="w-5 h-5 mr-2 text-purple-600" />
                    Grade Boundaries
                  </h2>
                  
                  <div className="mb-4">
                    <p className="text-sm text-gray-600 mb-3">
                      This assignment uses the following grade boundaries to evaluate student performance:
                    </p>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {GRADE_BOUNDARIES.map((boundary) => {
                        // Count students in this grade
                        const submissionsWithGrades = getRankedSubmissions();
                        const studentsInGrade = submissionsWithGrades.filter(submission => 
                          submission.grade === boundary.grade
                        ).length;
                        
                        // Calculate percentage
                        const percentage = grades.length > 0 ? (studentsInGrade / grades.length) * 100 : 0;
                        
                        return (
                          <div 
                            key={boundary.grade} 
                            className="bg-white border rounded-lg p-3 flex flex-col"
                            style={{ borderLeftColor: boundary.color, borderLeftWidth: '4px' }}
                          >
                            <div className="flex justify-between items-center mb-1">
                              <div className="flex items-center">
                                <span 
                                  className="w-4 h-4 rounded-full mr-2 flex items-center justify-center text-xs text-white font-bold"
                                  style={{ backgroundColor: boundary.color }}
                                >
                                  {boundary.grade}
                                </span>
                                <span className="font-medium text-gray-800">
                                  {boundary.grade} Grade
                                </span>
                              </div>
                              <span className="text-sm text-gray-500">
                                {boundary.min}-{boundary.max}%
                              </span>
                            </div>
                            
                            <div className="mt-2 flex items-center justify-between">
                              <span className="text-xs text-gray-600">
                                {studentsInGrade} student{studentsInGrade !== 1 ? 's' : ''}
                              </span>
                              <span className="text-xs font-medium" style={{ color: boundary.color }}>
                                {percentage.toFixed(1)}%
                              </span>
                            </div>
                            
                            {/* Progress bar */}
                            <div className="mt-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div 
                                className="h-full rounded-full" 
                                style={{ 
                                  width: `${percentage}%`,
                                  backgroundColor: boundary.color 
                                }}
                              ></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
                
                {/* Detailed Grade Distribution Chart */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  {/* Grade Bar Chart */}
                  <div className="bg-white shadow-md rounded-lg p-6 border">
                    <h2 className="text-lg font-semibold mb-4 text-gray-800 flex items-center">
                      <BarChart2 className="w-5 h-5 mr-2 text-purple-600" />
                      Grade Distribution
                    </h2>
                    
                    <div className="h-80">
                      <Bar
                        data={getGradeDistributionChartData()}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          indexAxis: "y",
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
                  
                  {/* Grade Pie Chart */}
                  <div className="bg-white shadow-md rounded-lg p-6 border">
                    <h2 className="text-lg font-semibold mb-4 text-gray-800 flex items-center">
                      <PieChart className="w-5 h-5 mr-2 text-purple-600" />
                      Grade Breakdown
                    </h2>
                    
                    {grades.length > 0 ? (
                      <div className="h-80 flex items-center justify-center">
                        <Pie
                          data={{
                            labels: getGradeDistributionData().map(item => `${item.grade} (${item.min}-${item.max})`),
                            datasets: [
                              {
                                data: getGradeDistributionData().map(item => item.count),
                                backgroundColor: getGradeDistributionData().map(
                                  item => item.color.replace('rgb', 'rgba').replace(')', ', 0.7)')
                                ),
                                borderColor: getGradeDistributionData().map(item => item.color),
                                borderWidth: 1,
                              },
                            ],
                          }}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                              legend: {
                                position: "right",
                                labels: {
                                  boxWidth: 12,
                                  padding: 15,
                                  font: {
                                    size: 11,
                                  },
                                },
                              },
                              tooltip: {
                                callbacks: {
                                  label: function (context) {
                                    const count = context.raw as number;
                                    const total = grades.length;
                                    const percentage = ((count / total) * 100).toFixed(1);
                                    const label = context.label as string;
                                    return `${label}: ${count} (${percentage}%)`;
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
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Rankings Tab */}
            {activeTab === "rankings" && (
              <>
                {/* Rankings Header */}
                <div className="bg-white rounded-lg border p-4 mb-6 flex flex-wrap gap-3 items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                      <Medal className="w-5 h-5 mr-2 text-purple-600" />
                      File Rankings
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                      Rankings based on {grades.length} submissions with a pass score of {passScore}%
                    </p>
                  </div>
                  
                  {/* Filter dropdown */}
                  <div className="flex items-center gap-2">
                    <div className="relative inline-block">
                      <button
                        onClick={() => setDropdownOpen(!dropdownOpen)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 rounded-md text-sm text-gray-700"
                      >
                        <Filter size={14} />
                        <span>{filterStatus === "all" ? "All" : filterStatus === "pass" ? "Passed Only" : "Failed Only"}</span>
                        <ChevronDown size={14} />
                      </button>
                      {dropdownOpen && (
                        <div className="absolute right-0 mt-1 bg-white border border-gray-200 shadow-md rounded-md p-1 z-10">
                          <button
                            onClick={() => {
                              setFilterStatus("all");
                              setDropdownOpen(false);
                            }}
                            className={`block w-full text-left px-3 py-1.5 text-sm rounded ${
                              filterStatus === "all" ? "bg-purple-50 text-purple-700" : "hover:bg-gray-50"
                            }`}
                          >
                            All Submissions
                          </button>
                          <button
                            onClick={() => {
                              setFilterStatus("pass");
                              setDropdownOpen(false);
                            }}
                            className={`block w-full text-left px-3 py-1.5 text-sm rounded ${
                              filterStatus === "pass" ? "bg-purple-50 text-purple-700" : "hover:bg-gray-50"
                            }`}
                          >
                            Passed Only
                          </button>
                          <button
                            onClick={() => {
                              setFilterStatus("fail");
                              setDropdownOpen(false);
                            }}
                            className={`block w-full text-left px-3 py-1.5 text-sm rounded ${
                              filterStatus === "fail" ? "bg-purple-50 text-purple-700" : "hover:bg-gray-50"
                            }`}
                          >
                            Failed Only
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {grades.length > 0 ? (
                  <>
                    {/* Rankings Table */}
                    <div className="bg-white shadow-md rounded-lg overflow-hidden border mb-6">
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Rank
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                File Name
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                {statistics.totalPossibleMarks !== 100 ? "Raw Score" : ""}
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Score
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Grade
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Percentile
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Status
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {getFilteredSubmissions().map((submission, index) => (
                              <tr 
                                key={submission.id} 
                                className={`hover:bg-gray-50 ${
                                  index < 3 ? "bg-purple-50" : ""
                                }`}
                              >
                                <td className="px-4 py-3 whitespace-nowrap">
                                  {submission.rank <= 3 ? (
                                    <div className="flex items-center">
                                      <div 
                                        className={`w-6 h-6 rounded-full flex items-center justify-center text-white font-medium mr-1.5 ${
                                          submission.rank === 1 
                                            ? "bg-amber-500" 
                                            : submission.rank === 2 
                                              ? "bg-gray-400" 
                                              : "bg-amber-700"
                                        }`}
                                      >
                                        {submission.rank}
                                      </div>
                                      <span className="font-medium">
                                        {submission.rank === 1 
                                          ? "1st" 
                                          : submission.rank === 2 
                                            ? "2nd" 
                                            : "3rd"
                                        }
                                      </span>
                                    </div>
                                  ) : (
                                    <span>{submission.rank}th</span>
                                  )}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm">
                                  <span className="truncate block max-w-xs" title={submission.file_name}>
                                    {submission.file_name}
                                  </span>
                                </td>
                                {statistics.totalPossibleMarks !== 100 && (
                                  <td className="px-4 py-3 whitespace-nowrap">
                                    <span className="text-sm text-gray-700">
                                      {submission.rawScore}/{statistics.totalPossibleMarks}
                                    </span>
                                  </td>
                                )}
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <div className="flex items-center">
                                    <div className="mr-2 w-8 h-8 rounded-full flex items-center justify-center text-white font-medium text-sm"
                                        style={{
                                          backgroundColor: getGradeBorderColor(submission.grade)
                                        }}
                                    >
                                      {submission.score}
                                    </div>
                                    <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                      <div
                                        className={`h-full ${
                                          submission.score >= passScore
                                            ? "bg-green-500"
                                            : "bg-red-500"
                                        }`}
                                        style={{ width: `${submission.score}%` }}
                                      ></div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <span
                                    className="inline-flex items-center justify-center w-6 h-6 rounded-full text-white text-xs font-medium"
                                    style={{
                                      backgroundColor: getGradeBorderColor(submission.grade)
                                    }}
                                  >
                                    {submission.grade}
                                  </span>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <div className="flex items-center">
                                    <span className="font-medium">{submission.percentile.toFixed(1)}%</span>
                                    <div className="ml-2 w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                      <div
                                        className="h-full bg-purple-500"
                                        style={{ width: `${submission.percentile}%` }}
                                      ></div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <span
                                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                      submission.status === "pass"
                                        ? "bg-green-100 text-green-800"
                                        : "bg-red-100 text-red-800"
                                    }`}
                                  >
                                    {submission.status === "pass" ? (
                                      <CheckCircle className="w-3 h-3 mr-1" />
                                    ) : (
                                      <XCircle className="w-3 h-3 mr-1" />
                                    )}
                                    {submission.status === "pass" ? "PASS" : "FAIL"}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                    
                    {/* Performance Visualization */}
                    <div className="bg-white shadow-md rounded-lg p-6 mb-6 border">
                      <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                          <BarChart className="w-5 h-5 mr-2 text-purple-600" />
                          Performance Comparison
                        </h2>
                        
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setChartType("bar")}
                            className={`p-1 rounded ${
                              chartType === "bar" ? "bg-purple-100 text-purple-700" : "text-gray-500 hover:bg-gray-100"
                            }`}
                            title="Bar Chart"
                          >
                            <BarChart size={16} />
                          </button>
                          <button
                            onClick={() => setChartType("line")}
                            className={`p-1 rounded ${
                              chartType === "line" ? "bg-purple-100 text-purple-700" : "text-gray-500 hover:bg-gray-100"
                            }`}
                            title="Line Chart"
                          >
                            <LineChart size={16} />
                          </button>
                        </div>
                      </div>
                      
                      <div className="h-72">
                        {chartType === "bar" ? (
                          <Bar
                            data={getPerformanceChartData()}
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
                                      return items[0].label;
                                    },
                                    label: (context) => {
                                      const score = context.raw as number;
                                      return [
                                        `Score: ${score}%`,
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
                                    text: "Score (%)",
                                    font: {
                                      size: 12,
                                    },
                                  },
                                },
                                x: {
                                  title: {
                                    display: true,
                                    text: "Files",
                                    font: {
                                      size: 12,
                                    },
                                  },
                                  ticks: {
                                    display: false // Hide x-axis labels to avoid cluttering
                                  }
                                },
                              },
                            }}
                          />
                        ) : (
                          <Line
                            data={{
                              labels: getFilteredSubmissions().map(s => s.file_name),
                              datasets: [
                                {
                                  label: "Scores",
                                  data: getFilteredSubmissions().map(s => s.score),
                                  borderColor: purpleColorBorder,
                                  backgroundColor: "transparent",
                                  pointBackgroundColor: getFilteredSubmissions().map(s => 
                                    s.status === "pass" ? "rgba(137, 71, 153, 1)" : "rgba(239, 68, 68, 1)"
                                  ),
                                  pointBorderColor: "#fff",
                                },
                                {
                                  label: "Average",
                                  data: Array(getFilteredSubmissions().length).fill(statistics.average),
                                  borderColor: "rgba(75, 192, 192, 1)",
                                  borderDash: [5, 5],
                                  borderWidth: 1,
                                  pointRadius: 0,
                                  fill: false,
                                },
                                {
                                  label: "Pass Threshold",
                                  data: Array(getFilteredSubmissions().length).fill(passScore),
                                  borderColor: "rgba(255, 159, 64, 1)",
                                  borderDash: [3, 3],
                                  borderWidth: 1,
                                  pointRadius: 0,
                                  fill: false,
                                },
                              ],
                            }}
                            options={{
                              responsive: true,
                              maintainAspectRatio: false,
                              plugins: {
                                tooltip: {
                                  callbacks: {
                                    title: (items) => {
                                      return items[0].label;
                                    },
                                    label: (context) => {
                                      if (context.dataset.label === "Scores") {
                                        const score = context.raw as number;
                                        return [
                                          `Score: ${score}%`,
                                          `Grade: ${getLetterGrade(score)}`,
                                          `Status: ${score >= passScore ? "PASS" : "FAIL"}`,
                                        ];
                                      }
                                      return `${context.dataset.label}: ${context.raw}%`;
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
                                    text: "Score (%)",
                                    font: {
                                      size: 12,
                                    },
                                  },
                                },
                                x: {
                                  title: {
                                    display: true,
                                    text: "Files",
                                    font: {
                                      size: 12,
                                    },
                                  },
                                  ticks: {
                                    display: false // Hide x-axis labels to avoid cluttering
                                  }
                                },
                              },
                            }}
                          />
                        )}
                      </div>
                      
                      {filterStatus !== "all" && (
                        <div className="mt-3 text-center text-sm text-gray-500">
                          Showing {getFilteredSubmissions().length} out of {grades.length} submissions 
                          ({filterStatus === "pass" ? "passed only" : "failed only"})
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="py-16 text-center text-gray-500 bg-white rounded-lg shadow-md">
                    <AlertTriangle className="w-12 h-12 mx-auto text-amber-500 mb-3" />
                    <p className="text-lg font-medium">
                      No submission data available
                    </p>
                    <p className="mt-1 text-sm">
                      Try refreshing the report or check if any files have been
                      uploaded
                    </p>
                    <button
                      onClick={refreshReportData}
                      className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 flex items-center gap-2 mx-auto"
                      disabled={refreshing}
                    >
                      <RefreshCw
                        size={16}
                        className={refreshing ? "animate-spin" : ""}
                      />
                      Refresh Data
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
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

// BookOpen component for compatibility
const BookOpen = ({ className }: { className?: string }) => (
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
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
  </svg>
);

export default AssignmentReportPage;