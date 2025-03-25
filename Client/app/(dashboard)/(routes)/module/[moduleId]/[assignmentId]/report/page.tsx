"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import ProtectedRoute from "@/app/_components/ProtectedRoutes";
import BackButton from "@/app/(dashboard)/_components/BackButton";
import { Bar, Pie, Doughnut } from "react-chartjs-2";
import "chart.js/auto";
import { Download, FileSpreadsheet, Printer, Share2 } from "lucide-react";
import * as XLSX from "xlsx";

const AssignmentReportPage = () => {
  const { moduleId, assignmentId } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [assignmentDetails, setAssignmentDetails] = useState({
    title: "",
    module: { name: "" },
  });
  const [grades, setGrades] = useState<number[]>([]);
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
    }
  }, [assignmentId]);

  const fetchAssignmentDetails = () => {
    if (!assignmentId) return;

    api
      .get(`/api/assignment/${assignmentId}/`)
      .then((res) => {
        setAssignmentDetails(res.data);
      })
      .catch((err) =>
        console.error("Failed to fetch assignment details:", err)
      );
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
      });
  };

  const downloadExcel = () => {
    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();

    // Define the data for the statistics sheet
    const statsData = [
      ["Assignment Report Statistics"],
      ["Assignment Title", assignmentDetails.title],
      ["Module", assignmentDetails.module.name],
      ["Date Generated", new Date().toLocaleString()],
      [""],
      ["Metric", "Value"],
      ["Highest Score", statistics.highest],
      ["Lowest Score", statistics.lowest],
      ["Median Score", statistics.median],
      ["Average Score", Number(statistics.average.toFixed(2))],
      ["Passed Students", statistics.passed],
      ["Failed Students", statistics.failed],
      ["Total Submissions", grades.length],
      [
        "Pass Rate",
        `${((statistics.passed / grades.length) * 100).toFixed(2)}%`,
      ],
    ];

    // Create statistics worksheet
    const statsWorksheet = XLSX.utils.aoa_to_sheet(statsData);
    XLSX.utils.book_append_sheet(workbook, statsWorksheet, "Statistics");

    // Create individual scores worksheet
    const scoresData = [
      ["Student Scores"],
      ["Submission #", "Score", "Pass/Fail"],
      ...grades.map((score, index) => [
        `Submission ${index + 1}`,
        score,
        score >= 45 ? "PASS" : "FAIL",
      ]),
    ];

    const scoresWorksheet = XLSX.utils.aoa_to_sheet(scoresData);
    XLSX.utils.book_append_sheet(workbook, scoresWorksheet, "Scores");

    // Generate the file and trigger download
    XLSX.writeFile(workbook, `${assignmentDetails.title}_Report.xlsx`);
  };

  // Skip chart rendering if no data is available
  if (loading) {
    return (
      <ProtectedRoute>
        <div className="flex gap-4 items-center m-4 mb-0">
          <BackButton />
        </div>
        <div className="min-h-screen p-6 flex items-center justify-center">
          <div className="animate-pulse flex flex-col items-center">
            <div className="h-8 w-64 bg-gray-300 rounded mb-4"></div>
            <div className="h-4 w-48 bg-gray-300 rounded"></div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  // Define chart colors with the existing theme
  const purpleColor = "rgba(137, 71, 153, 0.7)";
  const purpleColorBorder = "rgba(137, 71, 153, 1)";
  const lightPurpleColor = "rgba(216, 180, 254, 0.7)";
  const redColor = "rgba(239, 68, 68, 0.7)";
  const redColorBorder = "rgba(239, 68, 68, 1)";

  // Bar chart configuration
  const chartData = {
    labels: grades.map((_, index) => `Sub ${index + 1}`),
    datasets: [
      {
        label: "Scores",
        data: grades,
        backgroundColor: grades.map((score) =>
          score < 45 ? redColor : purpleColor
        ),
        borderColor: grades.map((score) =>
          score < 45 ? redColorBorder : purpleColorBorder
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

  // Grade distribution in ranges
  const getGradeDistribution = () => {
    const ranges = [
      { min: 0, max: 20, label: "0-20" },
      { min: 21, max: 40, label: "21-40" },
      { min: 41, max: 60, label: "41-60" },
      { min: 61, max: 80, label: "61-80" },
      { min: 81, max: 100, label: "81-100" },
    ];

    const distribution = ranges.map((range) => {
      return {
        label: range.label,
        count: grades.filter(
          (grade) => grade >= range.min && grade <= range.max
        ).length,
      };
    });

    return {
      labels: distribution.map((d) => d.label),
      datasets: [
        {
          label: "Number of Students",
          data: distribution.map((d) => d.count),
          backgroundColor: [
            "rgba(255, 99, 132, 0.7)",
            "rgba(255, 159, 64, 0.7)",
            "rgba(255, 205, 86, 0.7)",
            "rgba(75, 192, 192, 0.7)",
            "rgba(54, 162, 235, 0.7)",
          ],
          borderColor: [
            "rgb(255, 99, 132)",
            "rgb(255, 159, 64)",
            "rgb(255, 205, 86)",
            "rgb(75, 192, 192)",
            "rgb(54, 162, 235)",
          ],
          borderWidth: 1,
        },
      ],
    };
  };

  return (
    <ProtectedRoute>
      <div className="flex gap-4 items-center m-4 mb-0">
        <BackButton />
      </div>
      <div className="min-h-screen p-6">
        {/* Header section */}
        <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-dark-1">
              Assignment Report
            </h1>
            <h2 className="text-xl text-gray-600 mt-1">
              {assignmentDetails.title} - {assignmentDetails.module.name}
            </h2>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 mt-4 md:mt-0">
            <button
              onClick={downloadExcel}
              className="flex items-center gap-2 bg-light-2 hover:bg-light-1 text-white px-4 py-2 rounded-md transition-all duration-300 shadow-md"
            >
              <FileSpreadsheet size={18} />
              <span>Export to Excel</span>
            </button>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 px-4 py-2 rounded-md transition-all duration-300 shadow-md"
            >
              <Printer size={18} />
              <span className="hidden md:inline">Print</span>
            </button>
            <button
              onClick={() => {
                const url = window.location.href;
                navigator.clipboard.writeText(url);
                alert("Link copied to clipboard!");
              }}
              className="flex items-center gap-2 bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 px-4 py-2 rounded-md transition-all duration-300 shadow-md"
            >
              <Share2 size={18} />
              <span className="hidden md:inline">Share</span>
            </button>
          </div>
        </div>

        {/* Statistics cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white shadow-md rounded-lg p-4 border-l-4 border-purple-500">
            <h3 className="text-gray-500 text-sm uppercase">Submissions</h3>
            <p className="text-3xl font-bold">{grades.length}</p>
          </div>
          <div className="bg-white shadow-md rounded-lg p-4 border-l-4 border-green-500">
            <h3 className="text-gray-500 text-sm uppercase">Average Score</h3>
            <p className="text-3xl font-bold">
              {statistics.average.toFixed(1)}
            </p>
          </div>
          <div className="bg-white shadow-md rounded-lg p-4 border-l-4 border-blue-500">
            <h3 className="text-gray-500 text-sm uppercase">Pass Rate</h3>
            <p className="text-3xl font-bold">
              {grades.length
                ? `${((statistics.passed / grades.length) * 100).toFixed(1)}%`
                : "0%"}
            </p>
          </div>
          <div className="bg-white shadow-md rounded-lg p-4 border-l-4 border-yellow-500">
            <h3 className="text-gray-500 text-sm uppercase">Highest Score</h3>
            <p className="text-3xl font-bold">{statistics.highest}</p>
          </div>
        </div>

        {/* Detailed statistics */}
        <div className="bg-white shadow-md rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-dark-1">
            Detailed Statistics
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="bg-gray-50 p-3 rounded">
              <p className="text-sm text-gray-500">Highest</p>
              <p className="font-semibold text-xl">{statistics.highest}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <p className="text-sm text-gray-500">Lowest</p>
              <p className="font-semibold text-xl">{statistics.lowest}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <p className="text-sm text-gray-500">Median</p>
              <p className="font-semibold text-xl">{statistics.median}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <p className="text-sm text-gray-500">Average</p>
              <p className="font-semibold text-xl">
                {statistics.average.toFixed(2)}
              </p>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <p className="text-sm text-gray-500">Passed</p>
              <p className="font-semibold text-xl">{statistics.passed}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <p className="text-sm text-gray-500">Failed</p>
              <p className="font-semibold text-xl">{statistics.failed}</p>
            </div>
          </div>
        </div>

        {/* Charts section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Bar Chart */}
          <div className="bg-white shadow-md rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-dark-1">
              Individual Scores
            </h2>
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
                    },
                  },
                }}
              />
            </div>
          </div>

          {/* Doughnut Chart */}
          <div className="bg-white shadow-md rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-dark-1">
              Pass/Fail Distribution
            </h2>
            <div className="h-80 flex items-center justify-center">
              <Doughnut
                data={doughnutData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: "bottom",
                    },
                  },
                  cutout: "70%",
                }}
              />
            </div>
          </div>
        </div>

        {/* Grade distribution chart */}
        <div className="bg-white shadow-md rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-dark-1">
            Grade Distribution
          </h2>
          <div className="h-64">
            <Bar
              data={getGradeDistribution()}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: false,
                  },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      precision: 0,
                    },
                  },
                },
              }}
            />
          </div>
        </div>

        {/* Raw data table */}
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-dark-1">Raw Scores</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead className="bg-gray-50">
                <tr>
                  <th className="py-2 px-4 border-b text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Submission
                  </th>
                  <th className="py-2 px-4 border-b text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Score
                  </th>
                  <th className="py-2 px-4 border-b text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {grades.map((score, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="py-2 px-4 whitespace-nowrap">
                      Submission {index + 1}
                    </td>
                    <td className="py-2 px-4 whitespace-nowrap">{score}</td>
                    <td className="py-2 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          score >= 45
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {score >= 45 ? "PASS" : "FAIL"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default AssignmentReportPage;
