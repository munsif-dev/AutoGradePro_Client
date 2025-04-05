import React from "react";
import { X, Check, AlertCircle, Loader } from "lucide-react";

interface GradingProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  files: {
    id: number;
    file_name: string;
    status: "pending" | "grading" | "completed" | "error";
    score?: number;
  }[];
  stats: {
    totalFiles: number;
    completedFiles: number;
    totalScore: number;
    averageScore: number;
    passedFiles: number;
    failedFiles: number;
    passScore: number;
  };
}

const GradingProgressModal: React.FC<GradingProgressModalProps> = ({
  isOpen,
  onClose,
  files,
  stats,
}) => {
  if (!isOpen) return null;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <div className="w-5 h-5 rounded-full bg-gray-300"></div>;
      case "grading":
        return <Loader className="w-5 h-5 animate-spin text-purple-500" />;
      case "completed":
        return <Check className="w-5 h-5 text-green-500" />;
      case "error":
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return null;
    }
  };

  const progressPercentage = (stats.completedFiles / stats.totalFiles) * 100;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-3xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-semibold text-gray-800">
            Grading Progress
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress overview */}
        <div className="p-4 bg-gray-50">
          <div className="mb-2 flex justify-between">
            <span className="text-sm font-medium text-gray-700">
              Progress: {stats.completedFiles} of {stats.totalFiles} files
            </span>
            <span className="text-sm font-medium text-gray-700">
              {Math.round(progressPercentage)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-purple-600 h-2.5 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        </div>

        {/* Files list */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-2">
            {files.map((file) => (
              <div
                key={file.id}
                className="flex items-center p-3 bg-gray-50 rounded-md"
              >
                <div className="mr-3">{getStatusIcon(file.status)}</div>
                <div className="flex-1 truncate">
                  <p className="text-sm font-medium text-gray-700 truncate">
                    {file.file_name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {file.status === "completed" ? (
                      <>
                        Score:{" "}
                        <span
                          className={
                            file.score && file.score >= stats.passScore
                              ? "text-green-600 font-medium"
                              : "text-red-600 font-medium"
                          }
                        >
                          {file.score || 0}
                        </span>
                      </>
                    ) : file.status === "error" ? (
                      <span className="text-red-500">Error grading file</span>
                    ) : file.status === "grading" ? (
                      <span className="text-purple-500">
                        Grading in progress...
                      </span>
                    ) : (
                      <span className="text-gray-400">
                        Waiting to be graded
                      </span>
                    )}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stats footer */}
        {stats.completedFiles > 0 && (
          <div className="p-4 bg-gray-50 border-t">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">
              Grading Statistics
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-center">
              <div className="bg-white p-2 rounded shadow-sm">
                <p className="text-xs text-gray-500">Average Score</p>
                <p className="text-lg font-semibold text-purple-600">
                  {stats.averageScore.toFixed(1)}
                </p>
              </div>
              <div className="bg-white p-2 rounded shadow-sm">
                <p className="text-xs text-gray-500">Passed</p>
                <p className="text-lg font-semibold text-green-600">
                  {stats.passedFiles}
                </p>
              </div>
              <div className="bg-white p-2 rounded shadow-sm">
                <p className="text-xs text-gray-500">Failed</p>
                <p className="text-lg font-semibold text-red-600">
                  {stats.failedFiles}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Close button */}
        <div className="p-4 border-t flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default GradingProgressModal;
