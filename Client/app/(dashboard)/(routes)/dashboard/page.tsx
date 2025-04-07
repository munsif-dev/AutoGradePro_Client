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
  Filler,
} from "chart.js";
import {
  Plus,
  BookOpen,
  FileText,
  Upload,
  CheckSquare,
  Calendar,
  TrendingUp,
  Award,
  PieChart,
  Filter,
  RefreshCw,
  ArrowRight,
  Activity,
} from "lucide-react";
// Removed react-spring import

// Register chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Function to format dates nicely
const formatDate = (dateString: string): string => {
  const options: Intl.DateTimeFormatOptions = { year: "numeric", month: "short", day: "numeric" };
  return new Date(dateString).toLocaleDateString(undefined, options);
};

// Simple counter component without external dependencies
const AnimatedCounter = ({ value }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    // Skip animation for zero values
    if (value === 0) {
      setDisplayValue(0);
      return;
    }

    // Set start and end values
    const startValue = 0;
    const endValue = value;
    const duration = 1000; // Animation duration in ms
    const frameDuration = 16; // ~60fps
    const totalFrames = Math.round(duration / frameDuration);

    let frame = 0;
    const counter = setInterval(() => {
      frame++;
      // Calculate current value with easing
      const progress = frame / totalFrames;
      const currentValue = Math.floor(
        startValue + (endValue - startValue) * easeOutQuad(progress)
      );
      setDisplayValue(currentValue);

      if (frame === totalFrames) {
        clearInterval(counter);
        setDisplayValue(endValue); // Ensure we end on the exact value
      }
    }, frameDuration);

    return () => clearInterval(counter);
  }, [value]);

  // Easing function for smoother animation
  const easeOutQuad = (x) => {
    return 1 - (1 - x) * (1 - x);
  };

  return <p className="text-4xl font-bold text-light-3">{displayValue}</p>;
};

const Dashboard = () => {
  const [stats, setStats] = useState({
    modules_created: 0,
    assignments_created: 0,
    files_uploaded: 0,
    submissions_received: 0,
  });

  // Define interface for Trend
  interface Trend {
    day: string;
    count: number;
  }

  const [moduleTrends, setModuleTrends] = useState<Trend[]>([]);
  const [assignmentTrends, setAssignmentTrends] = useState<Trend[]>([]);
  const [uploadTrends, setUploadTrends] = useState<Trend[]>([]);
  const [dateRange, setDateRange] = useState("week"); // week, month, year
  const [isLoading, setIsLoading] = useState(true);
  const [quickActions, setQuickActions] = useState([
    { title: "Create New Module", icon: BookOpen, path: "/module/create" },
    { title: "Add Assignment", icon: FileText, path: "/assignment" },
    { title: "View Reports", icon: PieChart, path: "/reports" },
  ]);

  const router = useRouter();

  const fetchData = () => {
    setIsLoading(true);

    // Fetch all data in parallel
    Promise.all([
      api.get("/api/dashboard/stats/"),
      api.get("/api/dashboard/module-trends/"),
      api.get("/api/dashboard/assignment-trends/"),
      api.get("/api/dashboard/upload-trends/"),
    ])
      .then(
        ([statsRes, moduleTrendsRes, assignmentTrendsRes, uploadTrendsRes]) => {
          setStats(statsRes.data);
          setModuleTrends(moduleTrendsRes.data);
          setAssignmentTrends(assignmentTrendsRes.data);
          setUploadTrends(uploadTrendsRes.data);
        }
      )
      .catch((error) => {
        console.error("Error fetching dashboard data:", error);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    fetchData();
  }, [dateRange]);

  const lineChartOptions = {
    responsive: true,
    interaction: {
      mode: "index" as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: "top" as const,
        labels: {
          boxWidth: 15,
          usePointStyle: true,
          pointStyle: "circle",
        },
      },
      tooltip: {
        backgroundColor: "rgba(255, 255, 255, 0.95)",
        titleColor: "#333",
        bodyColor: "#666",
        borderColor: "#ddd",
        borderWidth: 1,
        padding: 10,
        boxPadding: 5,
        cornerRadius: 8,
        titleFont: {
          weight: "bold",
          size: 14,
        },
        callbacks: {
          title: (tooltipItems) => {
            return `Date: ${formatDate(tooltipItems[0].label)}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          maxRotation: 45,
          minRotation: 45,
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: "rgba(0, 0, 0, 0.05)",
        },
        border: {
          dash: [5, 5],
        },
      },
    },
    elements: {
      line: {
        tension: 0.4, // Smoother curves
      },
      point: {
        radius: 3,
        hoverRadius: 6,
      },
    },
  };

  // Chart data for Modules Created
  const moduleChartData = {
    labels: moduleTrends.map((trend) => trend.day),
    datasets: [
      {
        label: "Modules Created",
        data: moduleTrends.map((trend) => trend.count),
        borderColor: "#42A5F5",
        backgroundColor: "rgba(66, 165, 245, 0.3)",
        fill: true,
        borderWidth: 2,
        pointBackgroundColor: "#2196F3",
      },
    ],
  };

  // Chart data for Assignments Created
  const assignmentChartData = {
    labels: assignmentTrends.map((trend) => trend.day),
    datasets: [
      {
        label: "Assignments Created",
        data: assignmentTrends.map((trend) => trend.count),
        borderColor: "#66BB6A",
        backgroundColor: "rgba(102, 187, 106, 0.3)",
        fill: true,
        borderWidth: 2,
        pointBackgroundColor: "#4CAF50",
      },
    ],
  };

  // Chart data for Files Uploaded
  const uploadChartData = {
    labels: uploadTrends.map((trend) => trend.day),
    datasets: [
      {
        label: "Files Uploaded",
        data: uploadTrends.map((trend) => trend.count),
        borderColor: "#FF7043",
        backgroundColor: "rgba(255, 112, 67, 0.3)",
        fill: true,
        borderWidth: 2,
        pointBackgroundColor: "#FF5722",
      },
    ],
  };

  // Skeleton loader component for stats
  const StatCardSkeleton = () => (
    <div className="bg-white p-6 rounded-lg shadow-xl text-center flex-1 min-w-[200px] animate-pulse">
      <div className="flex items-center justify-center mb-3">
        <div className="w-8 h-8 rounded-full bg-gray-200"></div>
      </div>
      <div className="h-6 bg-gray-200 rounded w-3/4 mx-auto mb-2"></div>
      <div className="h-8 bg-gray-200 rounded w-1/2 mx-auto"></div>
    </div>
  );

  // Skeleton loader for charts
  const ChartSkeleton = ({ height = "300px" }) => (
    <div className="bg-white p-6 rounded-lg shadow-xl animate-pulse">
      <div className="h-6 bg-gray-200 rounded w-1/4 mb-6"></div>
      <div className="bg-gray-200 rounded" style={{ height }}></div>
    </div>
  );

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-r from-purple-100 p-4 md:p-8 flex flex-col">
        {/* Header with welcome message */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-dark-1 tracking-wide">
              Welcome to your <span className="text-light-2">Dashboard</span>
            </h1>
            <p className="text-gray-600 mt-1">
              Here's an overview of your teaching activities and performance
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => fetchData()}
              className="flex items-center gap-2 px-4 py-2 bg-white text-light-2 rounded-lg shadow-sm hover:shadow-md transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh Data
            </button>

            <button
              onClick={() => router.push("/module/create")}
              className="flex items-center gap-2 px-4 py-2 bg-light-2 text-white rounded-lg shadow-md hover:bg-light-1 transition-all"
            >
              <Plus className="w-4 h-4" />
              Create Module
            </button>
          </div>
        </div>

        {/* Date range filter */}
        <div className="mb-6 flex items-center space-x-2 p-4 bg-white rounded-lg shadow-md">
          <Filter className="text-gray-500 w-5 h-5" />
          <span className="text-gray-700 mr-3">Filter by:</span>
          <div className="flex space-x-2">
            {["week", "month", "year"].map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-4 py-1 rounded-full text-sm font-medium transition-all ${
                  dateRange === range
                    ? "bg-light-2 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {range.charAt(0).toUpperCase() + range.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Quick actions section */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <Activity className="w-5 h-5 mr-2 text-light-2" />
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {quickActions.map((action, index) => (
              <div
                key={index}
                onClick={() => router.push(action.path)}
                className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center space-x-3 border-l-4 border-light-2"
              >
                <div className="bg-purple-100 p-3 rounded-lg">
                  <action.icon className="w-6 h-6 text-light-2" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-dark-1">{action.title}</h3>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400" />
              </div>
            ))}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-dark-1 mb-4 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-light-2" />
            Key Statistics
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {isLoading ? (
              <>
                <StatCardSkeleton />
                <StatCardSkeleton />
                <StatCardSkeleton />
                <StatCardSkeleton />
              </>
            ) : (
              <>
                <div className="bg-white p-6 rounded-lg shadow-md text-center flex-1 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
                  <div className="flex justify-center mb-3">
                    <div className="bg-blue-100 p-3 rounded-full">
                      <BookOpen className="w-7 h-7 text-purple-500" />
                    </div>
                  </div>
                  <h2 className="text-lg font-semibold text-dark-1 mb-1">
                    Modules Created
                  </h2>
                  {isLoading ? (
                    <div className="h-8 w-16 bg-gray-200 rounded mx-auto animate-pulse"></div>
                  ) : (
                    <AnimatedCounter value={stats.modules_created} />
                  )}
                  <div className="mt-2 text-sm text-gray-500">
                    Total active modules
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md text-center flex-1 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
                  <div className="flex justify-center mb-3">
                    <div className="bg-green-100 p-3 rounded-full">
                      <FileText className="w-7 h-7 text-green-500" />
                    </div>
                  </div>
                  <h2 className="text-lg font-semibold text-dark-1 mb-1">
                    Assignments Created
                  </h2>
                  {isLoading ? (
                    <div className="h-8 w-16 bg-gray-200 rounded mx-auto animate-pulse"></div>
                  ) : (
                    <AnimatedCounter value={stats.assignments_created} />
                  )}
                  <div className="mt-2 text-sm text-gray-500">
                    Across all modules
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md text-center flex-1 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
                  <div className="flex justify-center mb-3">
                    <div className="bg-orange-100 p-3 rounded-full">
                      <Upload className="w-7 h-7 text-orange-500" />
                    </div>
                  </div>
                  <h2 className="text-lg font-semibold text-dark-1 mb-1">
                    Files Uploaded
                  </h2>
                  {isLoading ? (
                    <div className="h-8 w-16 bg-gray-200 rounded mx-auto animate-pulse"></div>
                  ) : (
                    <AnimatedCounter value={stats.files_uploaded} />
                  )}
                  <div className="mt-2 text-sm text-gray-500 bg-orange-50 px-2 py-1 rounded-full inline-block">
                    All submissions
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md text-center flex-1 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
                  <div className="flex justify-center mb-3">
                    <div className="bg-purple-100 p-3 rounded-full">
                      <CheckSquare className="w-7 h-7 text-purple-600" />
                    </div>
                  </div>
                  <h2 className="text-lg font-semibold text-dark-1 mb-1">
                    AnswerScript Created
                  </h2>
                  {isLoading ? (
                    <div className="h-8 w-16 bg-gray-200 rounded mx-auto animate-pulse"></div>
                  ) : (
                    <AnimatedCounter value={stats.submissions_received} />
                  )}
                  <div className="mt-2 text-sm text-gray-500 bg-purple-50 px-2 py-1 rounded-full inline-block">
                    Ready for grading
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Activity summary card */}
        <div className="mb-8 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-dark-1 mb-4 flex items-center">
            <Calendar className="w-5 h-5 mr-2 text-light-2" />
            Activity Summary
          </h2>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
              <h3 className="font-medium text-purple-700 flex items-center mb-2">
                <Award className="w-4 h-4 mr-2" />
                Recent Achievements
              </h3>
              {isLoading ? (
                <div className="space-y-2 animate-pulse">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                  <div className="h-4 bg-gray-200 rounded w-4/6"></div>
                </div>
              ) : stats.modules_created > 0 ? (
                <ul className="text-sm text-gray-600 space-y-2">
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mt-1.5 mr-2"></div>
                    <span>
                      Created {stats.modules_created} module
                      {stats.modules_created !== 1 ? "s" : ""}
                    </span>
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mt-1.5 mr-2"></div>
                    <span>
                      Set up {stats.assignments_created} assignment
                      {stats.assignments_created !== 1 ? "s" : ""}
                    </span>
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mt-1.5 mr-2"></div>
                    <span>
                      Received {stats.files_uploaded} submission
                      {stats.files_uploaded !== 1 ? "s" : ""}
                    </span>
                  </li>
                </ul>
              ) : (
                <p className="text-sm text-gray-500">
                  No activities recorded yet. Start by creating your first
                  module!
                </p>
              )}
            </div>

            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
              <h3 className="font-medium text-blue-700 flex items-center mb-2">
                <TrendingUp className="w-4 h-4 mr-2" />
                Performance Insights
              </h3>
              {isLoading ? (
                <div className="space-y-2 animate-pulse">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                </div>
              ) : (
                <p className="text-sm text-gray-600">
                  {stats.submissions_received > 0
                    ? `You have ${stats.submissions_received} marking scheme${
                        stats.submissions_received !== 1 ? "s" : ""
                      } ready for auto-grading.`
                    : "Create your first assignment to start auto-grading submissions."}
                </p>
              )}
            </div>

            <div className="bg-green-50 p-4 rounded-lg border border-green-100">
              <h3 className="font-medium text-green-700 flex items-center mb-2">
                <Calendar className="w-4 h-4 mr-2" />
                Upcoming Deadlines
              </h3>
              {isLoading ? (
                <div className="space-y-2 animate-pulse">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                </div>
              ) : (
                <p className="text-sm text-gray-600">
                  Visit the assignments section to view upcoming deadlines.
                </p>
              )}
              <button
                onClick={() => router.push("/assignment")}
                className="mt-2 text-sm text-green-700 font-medium flex items-center"
              >
                View assignments
                <ArrowRight className="w-3 h-3 ml-1" />
              </button>
            </div>
          </div>
        </div>

        {/* Trend Graphs */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-dark-1 mb-4 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-light-2" />
            Performance Trends
          </h2>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <ChartSkeleton />
              <ChartSkeleton />
              <ChartSkeleton height="250px" className="md:col-span-2" />
            </div>
          ) : (
            <>
              {/* First Two Trends in One Line */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow">
                  <h3 className="text-lg font-semibold text-dark-1 mb-4 flex items-center">
                    <BookOpen className="w-5 h-5 text-blue-500 mr-2" />
                    Modules Created
                  </h3>
                  {moduleTrends.length > 0 ? (
                    <Line data={moduleChartData} options={lineChartOptions} />
                  ) : (
                    <div className="h-64 flex items-center justify-center text-gray-500">
                      No module data available for this period
                    </div>
                  )}
                </div>

                <div className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow">
                  <h3 className="text-lg font-semibold text-dark-1 mb-4 flex items-center">
                    <FileText className="w-5 h-5 text-green-500 mr-2" />
                    Assignments Created
                  </h3>
                  {assignmentTrends.length > 0 ? (
                    <Line
                      data={assignmentChartData}
                      options={lineChartOptions}
                    />
                  ) : (
                    <div className="h-64 flex items-center justify-center text-gray-500">
                      No assignment data available for this period
                    </div>
                  )}
                </div>
              </div>

              {/* Last Trend in a Larger Line */}
              <div className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow">
                <h3 className="text-lg font-semibold text-dark-1 mb-4 flex items-center">
                  <Upload className="w-5 h-5 text-orange-500 mr-2" />
                  Files Uploaded
                </h3>
                {uploadTrends.length > 0 ? (
                  <Line data={uploadChartData} options={lineChartOptions} />
                ) : (
                  <div className="h-64 flex items-center justify-center text-gray-500">
                    No upload data available for this period
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Help card */}
        <div className="bg-gradient-to-r from-purple-100 to-purple-200 rounded-xl p-6 shadow-lg mb-8">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="md:w-2/3">
              <h2 className="text-2xl font-bold text-dark-1 mb-2">
                Need Help Getting Started?
              </h2>
              <p className="text-gray-700 mb-4">
                Learn how to create modules, set up assignments, and use the
                auto-grading features effectively with our comprehensive guides.
              </p>
              <button className="px-6 py-2 bg-light-2 text-white rounded-lg shadow-md hover:bg-light-1 transition-all">
                View Tutorials
              </button>
            </div>
            <div className="md:w-1/3 flex justify-center">
              <div className="bg-white p-4 rounded-full shadow-md">
                <BookOpen className="w-16 h-16 text-light-2" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default Dashboard;
