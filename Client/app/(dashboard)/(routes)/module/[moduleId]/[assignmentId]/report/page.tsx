"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import api from "@/lib/api";
import ProtectedRoute from "@/app/_components/ProtectedRoutes";
import BackButton from "@/app/(dashboard)/_components/BackButton";
import { Bar, Pie } from "react-chartjs-2";
import "chart.js/auto";

const AssignmentReportPage = () => {
  const { moduleId, assignmentId } = useParams();

  const [grades, setGrades] = useState<number[]>([]);
  const [statistics, setStatistics] = useState({
    highest: 0,
    lowest: 0,
    median: 0,
    average: 0,
  });

  useEffect(() => {
    if (assignmentId) {
      fetchGrades();
    }
  }, [assignmentId]);

  const fetchGrades = () => {
    if (!assignmentId) return;

    api
      .get(`/api/submission/${assignmentId}/grades/`)
      .then((res) => {
        const scores = res.data
          .map((file: { score: number }) => file.score)
          .filter((score: number) => score !== null);
        setGrades(scores);
        calculateStatistics(scores);
      })
      .catch((err) => alert("Failed to fetch grades: " + err));
  };

  const calculateStatistics = (scores: number[]) => {
    if (scores.length === 0) return;

    scores.sort((a, b) => a - b);
    const highest = scores[scores.length - 1];
    const lowest = scores[0];
    const median =
      scores.length % 2 === 0
        ? (scores[scores.length / 2 - 1] + scores[scores.length / 2]) / 2
        : scores[Math.floor(scores.length / 2)];
    const average =
      scores.reduce((sum, score) => sum + score, 0) / scores.length;

    setStatistics({ highest, lowest, median, average });
  };

  const chartData = {
    labels: grades.map((_, index) => `Submission ${index + 1}`),
    datasets: [
      {
        label: "Scores",
        data: grades,
        backgroundColor: grades.map((score) =>
          score < 45 ? "rgba(255, 99, 132, 0.6)" : "rgba(54, 162, 235, 0.6)"
        ),
        borderColor: "rgba(54, 162, 235, 1)",
        borderWidth: 1,
      },
    ],
  };

  const pieData = {
    labels: ["Passed", "Failed"],
    datasets: [
      {
        data: [
          grades.filter((score) => score >= 45).length,
          grades.filter((score) => score < 45).length,
        ],
        backgroundColor: ["#36A2EB", "#FF6384"],
        hoverBackgroundColor: ["#36A2EB", "#FF6384"],
      },
    ],
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen p-6">
        <div className="flex gap-4 items-center m-4 mb-0">
          <BackButton />
        </div>
        <h1 className="text-4xl font-bold text-dark-1 mb-4">
          Assignment Report
        </h1>
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-2xl font-semibold mb-4">Statistics</h2>
          <ul className="list-disc ml-6 text-gray-700 text-lg">
            <li>
              <strong>Highest Score:</strong> {statistics.highest}
            </li>
            <li>
              <strong>Lowest Score:</strong> {statistics.lowest}
            </li>
            <li>
              <strong>Median Score:</strong> {statistics.median}
            </li>
            <li>
              <strong>Average Score:</strong> {statistics.average.toFixed(2)}
            </li>
          </ul>
        </div>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Bar Chart */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-4">Score Distribution</h2>
            <Bar data={chartData} />
          </div>

          {/* Pie Chart */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-4">Pass/Fail Ratio</h2>
            <Pie data={pieData} />
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default AssignmentReportPage;
