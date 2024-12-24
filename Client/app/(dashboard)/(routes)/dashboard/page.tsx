"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ProtectedRoute from "@/app/_components/ProtectedRoutes";
import api from "@/lib/api";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Plus } from "lucide-react";

// Register chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const Dashboard = () => {
  const [stats, setStats] = useState({
    modules_created: 0,
    assignments_created: 0,
    files_uploaded: 0,
    submissions_received: 0,
  });
  const [moduleTrends, setModuleTrends] = useState([]);
  const [assignmentTrends, setAssignmentTrends] = useState([]);
  const [uploadTrends, setUploadTrends] = useState([]);
  const router = useRouter();

  useEffect(() => {
    api
      .get("/api/dashboard/stats/")
      .then((response) => setStats(response.data))
      .catch((error) => console.error("Error fetching dashboard data:", error));

    api
      .get("/api/dashboard/module-trends/")
      .then((response) => setModuleTrends(response.data))
      .catch((error) =>
        console.error("Error fetching module trend data:", error)
      );

    api
      .get("/api/dashboard/assignment-trends/")
      .then((response) => setAssignmentTrends(response.data))
      .catch((error) =>
        console.error("Error fetching assignment trend data:", error)
      );

    api
      .get("/api/dashboard/upload-trends/")
      .then((response) => setUploadTrends(response.data))
      .catch((error) =>
        console.error("Error fetching upload trend data:", error)
      );
  }, []);

  const lineChartOptions = {
    responsive: true,
    plugins: {
      title: {
        display: true,
        text: "Trend of Modules Created",
        font: {
          size: 16,
        },
      },
      legend: {
        position: "top",
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: "Months",
        },
      },
      y: {
        title: {
          display: true,
          text: "Count",
        },
        beginAtZero: true,
      },
    },
  };

  const moduleChartData = {
    labels: moduleTrends.map((trend) => trend.month),
    datasets: [
      {
        label: "Modules Created",
        data: moduleTrends.map((trend) => trend.count),
        borderColor: "#42A5F5",
        backgroundColor: "rgba(66, 165, 245, 0.3)",
        fill: true,
      },
    ],
  };

  const assignmentChartData = {
    labels: assignmentTrends.map((trend) => trend.month),
    datasets: [
      {
        label: "Assignments Created",
        data: assignmentTrends.map((trend) => trend.count),
        borderColor: "#66BB6A",
        backgroundColor: "rgba(102, 187, 106, 0.3)",
        fill: true,
      },
    ],
  };

  const uploadChartData = {
    labels: uploadTrends.map((trend) => trend.month),
    datasets: [
      {
        label: "Files Uploaded",
        data: uploadTrends.map((trend) => trend.count),
        borderColor: "#FF7043",
        backgroundColor: "rgba(255, 112, 67, 0.3)",
        fill: true,
      },
    ],
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-r from-purple-100 p-8 flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-extrabold text-dark-1 tracking-wide">
            Welcome to your <span className="text-light-2">Dashboard</span>
          </h1>
          <button
            onClick={() => router.push("/module")} // Use router.push inside the onClick handler
            className="flex items-center gap-3 px-6 py-3 bg-light-2 text-white rounded-full shadow-md hover:bg-light-1 transition ease-in-out duration-300 transform hover:scale-105"
          >
            <Plus className="w-6 h-6" />
            Start Creating a New module
          </button>
        </div>

        {/* Display Statistics Cards (Horizontal Layout) */}
        <div className="flex justify-between gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-xl text-center flex-1">
            <h2 className="text-xl font-semibold text-dark-1">
              Modules Created
            </h2>
            <p className="text-3xl font-bold text-light-3">
              {stats.modules_created}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-xl text-center flex-1">
            <h2 className="text-xl font-semibold text-dark-1">
              Assignments Created
            </h2>
            <p className="text-3xl font-bold text-light-3">
              {stats.assignments_created}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-xl text-center flex-1">
            <h2 className="text-xl font-semibold text-dark-1">
              Files Uploaded
            </h2>
            <p className="text-3xl font-bold text-light-3">
              {stats.files_uploaded}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-xl text-center flex-1">
            <h2 className="text-xl font-semibold text-dark-1">
              AnswerScript Created
            </h2>
            <p className="text-3xl font-bold text-light-3">
              {stats.submissions_received}
            </p>
          </div>
        </div>

        {/* Trend Graphs */}
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold text-center text-dark-1">
            Performance Trends
          </h2>

          <div className="bg-white p-6 rounded-lg shadow-xl">
            <h3 className="text-xl font-semibold text-dark-1 mb-4">
              Modules Created Trend
            </h3>
            <Line data={moduleChartData} options={lineChartOptions} />
          </div>

          <div className="bg-white p-6 rounded-lg shadow-xl">
            <h3 className="text-xl font-semibold text-dark-1 mb-4">
              Assignments Created Trend
            </h3>
            <Line data={assignmentChartData} options={lineChartOptions} />
          </div>

          <div className="bg-white p-6 rounded-lg shadow-xl">
            <h3 className="text-xl font-semibold text-dark-1 mb-4">
              Files Uploaded Trend
            </h3>
            <Line data={uploadChartData} options={lineChartOptions} />
          </div>
        </div>

        {/* Additional Actions */}
        <div className="space-y-4 text-center">
          <button className="mt-4 px-6 py-3 bg-light-3 hover:bg-light-2 text-white rounded-full">
            Add New Assignment
          </button>
          <button className="mt-4 px-6 py-3 bg-light-3 hover:bg-light-2 text-white rounded-full">
            View All Modules
          </button>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default Dashboard;
