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
  Users,
  Bell,
  HelpCircle,
  BarChart2,
  Sparkles,
  FileCheck,
  ExternalLink,
  BarChart,
  AlertCircle,
  User,
  Loader,
} from "lucide-react";

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
  if (!dateString) return "N/A";
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

  return <p className="text-4xl font-bold text-light-2">{displayValue}</p>;
};

// Module interface
interface Module {
  id: number;
  name: string;
  code: string;
  description?: string;
}

// Assignment interface
interface Assignment {
  id: number;
  title: string;
  description?: string;
  due_date: string;
  module: number;
}

// Recent grading data interface
interface GradingData {
  id: number;
  assignment: string;
  student_count: number;
  average_score: number;
  pass_rate: number;
  date: string;
  module_id: number;
  module_name?: string;
}

// Upcoming deadline interface
interface UpcomingDeadline {
  id: number;
  title: string;
  due_date: string;
  module_id: number;
  module_name?: string;
  days_remaining: number;
}

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
  const [refreshing, setRefreshing] = useState(false);
  const [userName, setUserName] = useState("");
  const [recentGradings, setRecentGradings] = useState<GradingData[]>([]);
  const [loadingGradings, setLoadingGradings] = useState(true);
  const [modules, setModules] = useState<Module[]>([]);
  const [upcomingDeadlines, setUpcomingDeadlines] = useState<UpcomingDeadline[]>([]);
  
  const [quickActions, setQuickActions] = useState([
    { title: "Create New Module", description: "Add a new course to your teaching portfolio", icon: BookOpen, path: "/module/create", bgColor: "bg-blue-100", iconColor: "text-blue-600" },
    { title: "Add Assignment", description: "Create a new assessment for your students", icon: FileText, path: "/assignment", bgColor: "bg-green-100", iconColor: "text-green-600" },
    { title: "View Reports", description: "Analyze student performance metrics", icon: BarChart2, path: "/module", bgColor: "bg-purple-100", iconColor: "text-purple-600" },
    { title: "Upload Answers", description: "Submit answer script for auto-grading", icon: Upload, path: "/module", bgColor: "bg-amber-100", iconColor: "text-amber-600" },
  ]);

  const router = useRouter();

  // Fetch user details from the backend
  const fetchUserDetails = async () => {
    try {
      // Get lecturer details
      const response = await api.get("/api/lecturer/details/");
      if (response.data && response.data.user) {
        const { first_name, last_name } = response.data.user;
        if (first_name || last_name) {
          setUserName(`${first_name || ''} ${last_name || ''}`.trim());
        } else {
          setUserName("Lecturer"); // Fallback if name is not available
        }
      }
    } catch (error) {
      console.error("Error fetching user details:", error);
      setUserName("Lecturer"); // Fallback if API call fails
    }
  };

  // Fetch all modules
  const fetchModules = async () => {
    try {
      const response = await api.get("/api/module/list/");
      if (response.data && Array.isArray(response.data)) {
        setModules(response.data);
        return response.data;
      }
      return [];
    } catch (error) {
      console.error("Error fetching modules:", error);
      return [];
    }
  };

  // New function to fetch upcoming assignment deadlines
  const fetchUpcomingDeadlines = async () => {
    try {
      // First get all modules
      const modules = await fetchModules();
      if (!modules.length) return;

      // For each module, get assignments
      let allAssignments: Assignment[] = [];
      
      // Use Promise.all to fetch assignments for all modules concurrently
      const assignmentPromises = modules.map(module => 
        api.get("/api/assignment/list/", { params: { module_id: module.id } })
          .then(res => {
            // Add module name to each assignment
            return res.data.map(assignment => ({
              ...assignment,
              module_name: module.name
            }));
          })
          .catch(err => {
            console.error(`Error fetching assignments for module ${module.id}:`, err);
            return [];
          })
      );
      
      const assignmentsResults = await Promise.all(assignmentPromises);
      allAssignments = assignmentsResults.flat();
      
      // Filter and sort assignments by due date (only future or recent deadlines)
      const now = new Date();
      const relevantAssignments = allAssignments
        .filter(assignment => {
          const dueDate = new Date(assignment.due_date);
          const daysDifference = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 3600 * 24));
          // Include upcoming and recent deadlines (up to 3 days past)
          return daysDifference > -3;
        })
        .map(assignment => {
          const dueDate = new Date(assignment.due_date);
          const daysDifference = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 3600 * 24));
          return {
            id: assignment.id,
            title: assignment.title,
            due_date: assignment.due_date,
            module_id: assignment.module,
            module_name: assignment.module_name,
            days_remaining: daysDifference
          };
        })
        .sort((a, b) => a.days_remaining - b.days_remaining);
      
      // Take the closest 3 deadlines
      setUpcomingDeadlines(relevantAssignments.slice(0, 3));
    } catch (error) {
      console.error("Error fetching upcoming deadlines:", error);
    }
  };

  // Enhanced function to fetch real grading reports from multiple modules
  const fetchRecentGradings = async () => {
    setLoadingGradings(true);
    try {
      // Step 1: Get all modules
      const modules = await fetchModules();
      if (!modules.length) {
        setRecentGradings([]);
        setLoadingGradings(false);
        return;
      }

      // Step 2: For each module, fetch all assignments
      let allAssignments: any[] = [];
      const moduleAssignmentsMap = {};

      // Use Promise.all to fetch assignments for all modules concurrently
      const assignmentPromises = modules.map(module => 
        api.get("/api/assignment/list/", { params: { module_id: module.id } })
          .then(res => {
            // Store module name for each assignment
            moduleAssignmentsMap[module.id] = module.name;
            return res.data.map(assignment => ({
              ...assignment,
              module_name: module.name
            }));
          })
          .catch(err => {
            console.error(`Error fetching assignments for module ${module.id}:`, err);
            return [];
          })
      );
      
      const assignmentsResults = await Promise.all(assignmentPromises);
      allAssignments = assignmentsResults.flat();
      
      console.log(`Found ${allAssignments.length} assignments across ${modules.length} modules`);
      
      if (allAssignments.length === 0) {
        setRecentGradings([]);
        setLoadingGradings(false);
        return;
      }

      // Step 3: Sort assignments by due_date to get most recent ones first
      const sortedAssignments = [...allAssignments].sort((a, b) => 
        new Date(b.due_date).getTime() - new Date(a.due_date).getTime()
      );
      
      // Step 4: Take up to 10 most recent assignments to check
      const recentAssignments = sortedAssignments.slice(0, 10);
      
      console.log("Checking reports for assignments:", 
        recentAssignments.map(a => `${a.id} - ${a.title}`));
      
      // Step 5: Fetch report data for each assignment in parallel
      const reportPromises = recentAssignments.map(async (assignment) => {
        try {
          console.log(`Fetching report for assignment: ${assignment.id} - ${assignment.title}`);
          
          // Get submission files to check if any exist
          const filesResponse = await api.get(`/api/submission/${assignment.id}/files/`);
          const submissionCount = filesResponse.data ? filesResponse.data.length : 0;
          
          // Only fetch report if there are submissions
          if (submissionCount > 0) {
            const reportResponse = await api.get(`/api/assignment/${assignment.id}/report/`);
            console.log(`Report data received for ${assignment.title}:`, reportResponse.data);
            
            // Process report data if available
            if (reportResponse.data) {
              const reportData = reportResponse.data;
              
              // Calculate pass rate if passed/failed data is available
              let passRate = 0;
              if (reportData.passed !== undefined && reportData.failed !== undefined) {
                const total = reportData.passed + reportData.failed;
                passRate = total > 0 ? Math.round((reportData.passed / total) * 100) : 0;
              }
              
              return {
                id: assignment.id,
                assignment: assignment.title,
                student_count: submissionCount,
                average_score: reportData.average !== undefined ? parseFloat(reportData.average.toFixed(1)) : 0,
                pass_rate: passRate,
                date: assignment.due_date,
                module_id: assignment.module,
                module_name: assignment.module_name
              };
            }
          }
          return null;
        } catch (error) {
          console.log(`No report available for assignment ${assignment.id}`);
          return null;
        }
      });
      
      // Step 6: Process all report results
      const reportResults = await Promise.all(reportPromises);
      const validReports = reportResults.filter(report => report !== null);
      
      if (validReports.length === 0) {
        console.log("No valid grading reports found");
      } else {
        console.log(`Found ${validReports.length} valid grading reports`);
      }
      
      // Step 7: Sort by date again (most recent first) and limit to 3
      const sortedReports = validReports
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 3);
      
      console.log("Final grading reports:", sortedReports);
      setRecentGradings(sortedReports);
    } catch (error) {
      console.error("Error fetching grading data:", error);
      setRecentGradings([]);
    } finally {
      setLoadingGradings(false);
    }
  };

  // Fetch all data for the dashboard
  const fetchData = () => {
    setIsLoading(true);
    setRefreshing(true);

    // Fetch all data in parallel
    Promise.all([
      api.get("/api/dashboard/stats/"),
      api.get("/api/dashboard/module-trends/"),
      api.get("/api/dashboard/assignment-trends/"),
      api.get("/api/dashboard/upload-trends/"),
      fetchUserDetails(),
      fetchRecentGradings(),
      fetchUpcomingDeadlines(),
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
        setTimeout(() => setRefreshing(false), 500);
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
          font: {
            family: "'Poppins', sans-serif",
          }
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
          family: "'Poppins', sans-serif",
        },
        bodyFont: {
          family: "'Poppins', sans-serif",
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
          font: {
            family: "'Poppins', sans-serif",
            size: 10
          }
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
        ticks: {
          precision: 0,
          font: {
            family: "'Poppins', sans-serif",
            size: 10
          }
        }
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
        label: "Modules",
        data: moduleTrends.map((trend) => trend.count),
        borderColor: "#894799", // Use theme light-2 color
        backgroundColor: "rgba(137, 71, 153, 0.2)",
        fill: true,
        borderWidth: 2,
        pointBackgroundColor: "#894799",
      },
    ],
  };

  // Chart data for Assignments Created
  const assignmentChartData = {
    labels: assignmentTrends.map((trend) => trend.day),
    datasets: [
      {
        label: "Assignments",
        data: assignmentTrends.map((trend) => trend.count),
        borderColor: "#da7fc6", // Use theme light-1 color
        backgroundColor: "rgba(218, 127, 198, 0.2)",
        fill: true,
        borderWidth: 2,
        pointBackgroundColor: "#da7fc6",
      },
    ],
  };

  // Chart data for Files Uploaded
  const uploadChartData = {
    labels: uploadTrends.map((trend) => trend.day),
    datasets: [
      {
        label: "Submissions",
        data: uploadTrends.map((trend) => trend.count),
        borderColor: "#c9a7d3", // Use theme light-3 color
        backgroundColor: "rgba(201, 167, 211, 0.2)",
        fill: true,
        borderWidth: 2,
        pointBackgroundColor: "#c9a7d3",
      },
    ],
  };

  // Skeleton loader component for stats
  const StatCardSkeleton = () => (
    <div className="bg-white p-6 rounded-xl shadow-md text-center flex-1 min-w-[200px] animate-pulse">
      <div className="flex items-center justify-center mb-3">
        <div className="w-12 h-12 rounded-full bg-gray-200"></div>
      </div>
      <div className="h-6 bg-gray-200 rounded w-3/4 mx-auto mb-2"></div>
      <div className="h-12 bg-gray-200 rounded w-1/2 mx-auto mb-2"></div>
      <div className="h-4 bg-gray-200 rounded w-2/3 mx-auto"></div>
    </div>
  );

  // Skeleton loader for charts
  const ChartSkeleton = ({ height = "300px" }) => (
    <div className="bg-white p-6 rounded-xl shadow-md animate-pulse">
      <div className="h-6 bg-gray-200 rounded w-1/4 mb-6"></div>
      <div className="bg-gray-200 rounded-lg" style={{ height }}></div>
    </div>
  );

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  // Format the remaining days text
  const formatRemainingDays = (days: number) => {
    if (days === 0) return "Due today!";
    if (days < 0) return `${Math.abs(days)} day${Math.abs(days) !== 1 ? "s" : ""} overdue`;
    return `${days} day${days !== 1 ? "s" : ""} remaining`;
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-100 p-4 md:p-8 flex flex-col">
        {/* Header with welcome message */}
        <div className="bg-white rounded-2xl shadow-md p-6 mb-8 overflow-hidden relative">
          {/* Decorative background elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-purple-200 rounded-full opacity-10 -mt-20 -mr-20"></div>
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-purple-300 rounded-full opacity-10 -mb-20 -ml-20"></div>
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-dark-1 mb-2">
                {getGreeting()}, <span className="text-light-2">{userName || 'Lecturer'}</span>
              </h1>
              <p className="text-gray-600">
                Welcome to your AutoGradePro dashboard
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => fetchData()}
                className={`flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl shadow-sm hover:shadow-md transition-all ${
                  refreshing ? "animate-pulse" : ""
                }`}
                disabled={refreshing}
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin text-light-2" : ""}`} />
                <span>{refreshing ? "Refreshing..." : "Refresh"}</span>
              </button>

              <button
                onClick={() => router.push("/module/create")}
                className="flex items-center gap-2 px-5 py-2 bg-light-2 text-white rounded-xl shadow-md hover:bg-light-1 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Create Module</span>
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Left column - Quick Actions + Activity Summary */}
          <div className="lg:col-span-1 space-y-6">
            {/* Date range filter */}
            <div className="bg-white rounded-xl shadow-md p-5">
              <h2 className="text-lg font-semibold text-dark-1 mb-4 flex items-center">
                <Filter className="w-5 h-5 mr-2 text-light-2" />
                Filter Data
              </h2>
              <div className="flex flex-wrap gap-2">
                {["week", "month", "year"].map((range) => (
                  <button
                    key={range}
                    onClick={() => setDateRange(range)}
                    className={`px-5 py-2 rounded-xl text-sm font-medium transition-all flex-1 ${
                      dateRange === range
                        ? "bg-light-2 text-white shadow-md"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {range.charAt(0).toUpperCase() + range.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick actions section */}
            <div className="bg-white rounded-xl shadow-md p-5">
              <h2 className="text-lg font-semibold text-dark-1 mb-4 flex items-center">
                <Activity className="w-5 h-5 mr-2 text-light-2" />
                Quick Actions
              </h2>
              <div className="space-y-3">
                {quickActions.map((action, index) => (
                  <div
                    key={index}
                    onClick={() => router.push(action.path)}
                    className="p-4 rounded-xl transition-all cursor-pointer hover:shadow-md border border-gray-100 hover:border-light-2 group"
                  >
                    <div className="flex items-center">
                      <div className={`p-3 rounded-xl ${action.bgColor} ${action.iconColor} group-hover:bg-light-2 group-hover:text-white transition-colors`}>
                        <action.icon className="w-5 h-5" />
                      </div>
                      <div className="ml-4 flex-1">
                        <h3 className="font-medium text-dark-1 group-hover:text-light-2 transition-colors">
                          {action.title}
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">{action.description}</p>
                      </div>
                      <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-light-2 group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Activity summary card */}
            <div className="bg-white rounded-xl shadow-md p-5">
              <h2 className="text-lg font-semibold text-dark-1 mb-4 flex items-center">
                <Bell className="w-5 h-5 mr-2 text-light-2" />
                Activity Summary
              </h2>

              <div className="space-y-4">
                <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
                  <h3 className="font-medium text-purple-700 flex items-center mb-3">
                    <Sparkles className="w-4 h-4 mr-2" />
                    Current Status
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
                        <div className="w-2 h-2 bg-purple-500 rounded-full mt-1.5 mr-2 flex-shrink-0"></div>
                        <span>
                          Managing {stats.modules_created} module{stats.modules_created !== 1 ? "s" : ""}
                        </span>
                      </li>
                      <li className="flex items-start">
                        <div className="w-2 h-2 bg-purple-500 rounded-full mt-1.5 mr-2 flex-shrink-0"></div>
                        <span>
                          Supervising {stats.assignments_created} assignment{stats.assignments_created !== 1 ? "s" : ""}
                        </span>
                      </li>
                      <li className="flex items-start">
                        <div className="w-2 h-2 bg-purple-500 rounded-full mt-1.5 mr-2 flex-shrink-0"></div>
                        <span>
                          Collected {stats.files_uploaded} submission{stats.files_uploaded !== 1 ? "s" : ""}
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

                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                  <h3 className="font-medium text-blue-700 flex items-center mb-3">
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

                <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                  <h3 className="font-medium text-green-700 flex items-center mb-3">
                    <Calendar className="w-4 h-4 mr-2" />
                    Upcoming Due Dates
                  </h3>
                  {isLoading ? (
                    <div className="space-y-2 animate-pulse">
                      <div className="h-4 bg-gray-200 rounded"></div>
                      <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                    </div>
                  ) : upcomingDeadlines.length > 0 ? (
                    <ul className="text-sm space-y-2">
                      {upcomingDeadlines.map((deadline) => (
                        <li key={deadline.id} className="flex justify-between border-b border-green-100 pb-2">
                          <div className="flex-1">
                            <p className="text-gray-700 font-medium">{deadline.title}</p>
                            <p className="text-xs text-gray-500">{deadline.module_name}</p>
                          </div>
                          <div className="text-right">
                            <p className={`text-xs font-medium ${
                              deadline.days_remaining < 0 
                                ? "text-red-600" 
                                : deadline.days_remaining === 0 
                                ? "text-orange-600" 
                                : "text-green-600"
                            }`}>
                              {formatRemainingDays(deadline.days_remaining)}
                            </p>
                            <p className="text-xs text-gray-500">{formatDate(deadline.due_date)}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-600">
                      No upcoming deadlines found.
                    </p>
                  )}
                  <button
                    onClick={() => router.push("/assignment")}
                    className="mt-3 text-sm text-green-700 font-medium flex items-center bg-green-100 px-3 py-1.5 rounded-lg hover:bg-green-200 transition-colors"
                  >
                    View all assignments
                    <ArrowRight className="w-3 h-3 ml-1" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right column - Stats Cards + Trend Graphs */}
          <div className="lg:col-span-2 space-y-6">
            {/* Stats Cards - Detailed */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {isLoading ? (
                <>
                  <StatCardSkeleton />
                  <StatCardSkeleton />
                  <StatCardSkeleton />
                  <StatCardSkeleton />
                </>
              ) : (
                <>
                  <div className="bg-white p-6 rounded-xl shadow-md flex flex-col items-center hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-purple-100 rounded-full opacity-30 -mt-10 -mr-10"></div>
                    <div className="flex justify-center mb-3 z-10">
                      <div className="bg-purple-100 p-3 rounded-xl">
                        <BookOpen className="w-8 h-8 text-light-2" />
                      </div>
                    </div>
                    <h2 className="text-lg font-semibold text-dark-1 mb-1 text-center z-10">
                      Total Modules
                    </h2>
                    <AnimatedCounter value={stats.modules_created} />
                    <div className="mt-1 text-sm text-gray-600 bg-purple-50 px-3 py-1 rounded-full z-10">
                      Current active modules
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-xl shadow-md flex flex-col items-center hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-purple-100 rounded-full opacity-30 -mt-10 -mr-10"></div>
                    <div className="flex justify-center mb-3 z-10">
                      <div className="bg-purple-100 p-3 rounded-xl">
                        <FileText className="w-8 h-8 text-light-1" />
                      </div>
                    </div>
                    <h2 className="text-lg font-semibold text-dark-1 mb-1 text-center z-10">
                      Total Assignments
                    </h2>
                    <AnimatedCounter value={stats.assignments_created} />
                    <div className="mt-1 text-sm text-gray-600 bg-purple-50 px-3 py-1 rounded-full z-10">
                      Across all modules
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-xl shadow-md flex flex-col items-center hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-purple-100 rounded-full opacity-30 -mt-10 -mr-10"></div>
                    <div className="flex justify-center mb-3 z-10">
                      <div className="bg-purple-100 p-3 rounded-xl">
                        <Upload className="w-8 h-8 text-light-3" />
                      </div>
                    </div>
                    <h2 className="text-lg font-semibold text-dark-1 mb-1 text-center z-10">
                      Total Submissions
                    </h2>
                    <AnimatedCounter value={stats.files_uploaded} />
                    <div className="mt-1 text-sm text-gray-600 bg-purple-50 px-3 py-1 rounded-full z-10">
                      All uploaded files
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-xl shadow-md flex flex-col items-center hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-purple-100 rounded-full opacity-30 -mt-10 -mr-10"></div>
                    <div className="flex justify-center mb-3 z-10">
                      <div className="bg-purple-100 p-3 rounded-xl">
                        <CheckSquare className="w-8 h-8 text-dark-1" />
                      </div>
                    </div>
                    <h2 className="text-lg font-semibold text-dark-1 mb-1 text-center z-10">
                      Total Marking Schemes
                    </h2>
                    <AnimatedCounter value={stats.submissions_received} />
                    <div className="mt-1 text-sm text-gray-600 bg-purple-50 px-3 py-1 rounded-full z-10">
                      Ready for grading
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Recent Grading Reports Section */}
            <div className="bg-white rounded-xl shadow-md p-5 overflow-hidden">
              <h2 className="text-lg font-semibold text-dark-1 mb-4 flex items-center">
                <FileCheck className="w-5 h-5 mr-2 text-light-2" />
                Recent Grading Reports
              </h2>

              {loadingGradings ? (
                <div className="space-y-2 animate-pulse">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 bg-gray-100 rounded-xl mb-3"></div>
                  ))}
                </div>
              ) : recentGradings.length > 0 ? (
                <div className="space-y-3">
                  {recentGradings.map((grading) => (
                    <div
                      key={grading.id}
                      className="p-3 rounded-xl border border-gray-100 hover:border-light-2 hover:shadow-md transition-all cursor-pointer group"
                      onClick={() => router.push(`/module/${grading.module_id}/${grading.id}/report`)}
                    >
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                        <div className="flex items-center mb-2 md:mb-0">
                          <div className="p-2 bg-purple-100 rounded-lg mr-3">
                            <BarChart className="w-5 h-5 text-light-2" />
                          </div>
                          <div>
                            <h3 className="font-medium text-dark-1 group-hover:text-light-2 transition-colors flex items-center">
                              {grading.assignment}
                              <ExternalLink className="w-3.5 h-3.5 ml-1.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </h3>
                            <div className="text-xs text-gray-500">
                              {grading.module_name && `${grading.module_name} • `}
                              {formatDate(grading.date)} • {grading.student_count} students
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 ml-10 md:ml-0">
                          <div className="text-center">
                            <div className="text-xs text-gray-500">Average</div>
                            <div className="font-semibold">{grading.average_score}%</div>
                          </div>
                          <div className="text-center">
                            <div className="text-xs text-gray-500">Pass Rate</div>
                            <div 
                              className={`font-semibold ${
                                grading.pass_rate >= 90 
                                  ? "text-green-600" 
                                  : grading.pass_rate >= 70 
                                  ? "text-yellow-600" 
                                  : "text-red-500"
                              }`}
                            >
                              {grading.pass_rate}%
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="text-center pt-2">
                    <button 
                      onClick={() => router.push("/module")}
                      className="text-sm text-purple-700 hover:text-purple-800 font-medium flex items-center mx-auto"
                    >
                      View all modules
                      <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="py-8 flex flex-col items-center justify-center">
                  <AlertCircle className="w-12 h-12 text-gray-300 mb-3" />
                  <p className="text-gray-500 font-medium">No grading reports yet</p>
                  <p className="text-sm text-gray-400 mb-3">
                    {stats.files_uploaded > 0 
                      ? "Add marking schemes and grade submissions to see reports here"
                      : "Upload answer scripts for assignments to start grading"}
                  </p>
                  <button
                    onClick={() => router.push("/module")}
                    className="text-sm px-4 py-2 bg-light-2 text-white rounded-lg shadow-sm hover:bg-light-1 transition-colors"
                  >
                    {stats.files_uploaded > 0 ? "Manage Assignments" : "Create Assignment"}
                  </button>
                </div>
              )}
            </div>

            {/* Trend Graphs */}
            <div className="bg-white rounded-xl shadow-md p-5 overflow-hidden">
              <h2 className="text-lg font-semibold text-dark-1 mb-4 flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-light-2" />
                Activity Trends
              </h2>

              <div className="space-y-8">
                {isLoading ? (
                  <ChartSkeleton height="250px" />
                ) : uploadTrends.length > 0 ? (
                  <div className="rounded-xl bg-gray-50 p-4">
                    <h3 className="text-md font-medium text-dark-1 mb-3 flex items-center">
                      <Upload className="w-4 h-4 text-light-3 mr-2" />
                      Submission Activity
                    </h3>
                    <div className="h-64">
                      <Line data={uploadChartData} options={lineChartOptions} />
                    </div>
                  </div>
                ) : (
                  <div className="h-64 flex items-center justify-center text-gray-500 bg-gray-50 rounded-xl">
                    No submission data available for this period
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {isLoading ? (
                    <>
                      <ChartSkeleton height="200px" />
                      <ChartSkeleton height="200px" />
                    </>
                  ) : (
                    <>
                      <div className="rounded-xl bg-gray-50 p-4">
                        <h3 className="text-md font-medium text-dark-1 mb-3 flex items-center">
                          <BookOpen className="w-4 h-4 text-light-2 mr-2" />
                          Module Activity
                        </h3>
                        {moduleTrends.length > 0 ? (
                          <div className="h-48">
                            <Line data={moduleChartData} options={lineChartOptions} />
                          </div>
                        ) : (
                          <div className="h-48 flex items-center justify-center text-gray-500">
                            No module data available
                          </div>
                        )}
                      </div>

                      <div className="rounded-xl bg-gray-50 p-4">
                        <h3 className="text-md font-medium text-dark-1 mb-3 flex items-center">
                          <FileText className="w-4 h-4 text-light-1 mr-2" />
                          Assignment Activity
                        </h3>
                        {assignmentTrends.length > 0 ? (
                          <div className="h-48">
                            <Line
                              data={assignmentChartData}
                              options={lineChartOptions}
                            />
                          </div>
                        ) : (
                          <div className="h-48 flex items-center justify-center text-gray-500">
                            No assignment data available
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Help card */}
        <div className="bg-gradient-to-r from-light-3 to-light-2 rounded-2xl p-6 shadow-lg mb-6 text-white overflow-hidden relative">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full opacity-10 -mt-20 -mr-20"></div>
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-white rounded-full opacity-10 -mb-20 -ml-20"></div>
          
          <div className="flex flex-col md:flex-row items-center gap-6 relative z-10">
            <div className="md:w-2/3">
              <h2 className="text-2xl font-bold mb-3">
                Need Help Getting Started?
              </h2>
              <p className="text-white text-opacity-90 mb-4">
                Learn how to create modules, set up assignments, and use the
                auto-grading features effectively with our comprehensive guides.
              </p>
              <button className="px-6 py-2.5 bg-white text-light-2 rounded-xl shadow-md hover:bg-gray-100 transition-all flex items-center font-medium">
                <HelpCircle className="w-4 h-4 mr-2" />
                View Tutorials
              </button>
            </div>
            <div className="md:w-1/3 flex justify-center">
              <div className="bg-white p-5 rounded-full shadow-lg">
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