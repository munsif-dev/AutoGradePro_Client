"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import api from "@/lib/api";
import ProtectedRoute from "@/app/_components/ProtectedRoutes";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  Upload,
  FileUp,
  FileText,
  File,
  X,
  ChevronRight,
  ArrowLeft,
  Check,
  AlertTriangle,
  HelpCircle,
  Info,
  Loader2,
  FilePlus2,
  BookOpen,
  FileQuestion,
} from "lucide-react";

// Supported file types for upload
const SUPPORTED_TYPES = [
  "application/pdf", // PDF
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // DOCX
  "application/msword", // DOC
  "text/plain", // TXT
  "application/vnd.oasis.opendocument.text", // ODT
  "application/vnd.ms-excel", // XLS
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // XLSX
];

const UploadAnswersPage = () => {
  const router = useRouter();
  const { moduleId, assignmentId } = useParams();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [assignmentTitle, setAssignmentTitle] = useState("");
  const [moduleTitle, setModuleTitle] = useState("");
  const [fileErrors, setFileErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);

  // Get assignment details on mount
  useEffect(() => {
    const fetchDetails = async () => {
      setIsLoading(true);
      try {
        // Fetch module details
        const moduleResponse = await api.get(`/api/module/${moduleId}/`);
        setModuleTitle(moduleResponse.data.name || `Module ${moduleId}`);

        // Fetch assignment details
        const assignmentResponse = await api.get(`/api/assignment/${assignmentId}/`);
        setAssignmentTitle(assignmentResponse.data.title || `Assignment ${assignmentId}`);
      } catch (error) {
        console.error("Error fetching details:", error);
        toast.error("Failed to load assignment details");
      } finally {
        setIsLoading(false);
      }
    };

    fetchDetails();
  }, [moduleId, assignmentId]);

  // Handle file validation
  const validateFile = (file: File): { valid: boolean; error?: string } => {
    // Check file type
    if (!SUPPORTED_TYPES.includes(file.type)) {
      return {
        valid: false,
        error: "Unsupported file type. Please upload PDF, DOCX, DOC, TXT, ODT, XLS, or XLSX files.",
      };
    }

    // Check file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      return {
        valid: false,
        error: "File is too large. Maximum file size is 10MB.",
      };
    }

    return { valid: true };
  };

  // Handle drag events
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const newFileErrors: Record<string, string> = {};
    let hasAddedValidFiles = false;
    let hasDuplicates = false;
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const newFiles = Array.from(e.dataTransfer.files);
      
      setSelectedFiles((prev) => {
        const updatedFiles = [...prev];
        
        newFiles.forEach((newFile) => {
          // Validate file
          const validation = validateFile(newFile);
          
          if (!validation.valid) {
            newFileErrors[newFile.name] = validation.error || "Invalid file";
            return;
          }
          
          // Check for duplicates
          const existingIndex = updatedFiles.findIndex(
            (file) => file.name === newFile.name
          );
          
          if (existingIndex !== -1) {
            updatedFiles[existingIndex] = newFile; // Replace existing file
            hasDuplicates = true;
          } else {
            updatedFiles.push(newFile); // Add new file
            hasAddedValidFiles = true;
          }
        });
        
        return updatedFiles;
      });
      
      setFileErrors(newFileErrors);
      
      // Show toast messages based on what happened
      if (Object.keys(newFileErrors).length > 0) {
        toast.error(`${Object.keys(newFileErrors).length} file(s) couldn't be added`);
      }
      
      if (hasDuplicates) {
        toast.info("Duplicate files have been replaced with newer versions");
      }
      
      if (hasAddedValidFiles) {
        toast.success("Files added successfully");
      }
    }
  }, []);

  // Handle file input change
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      const newFileErrors: Record<string, string> = {};
      let hasAddedValidFiles = false;
      let hasDuplicates = false;
      
      setSelectedFiles((prev) => {
        const updatedFiles = [...prev];
        
        newFiles.forEach((newFile) => {
          // Validate file
          const validation = validateFile(newFile);
          
          if (!validation.valid) {
            newFileErrors[newFile.name] = validation.error || "Invalid file";
            return;
          }
          
          // Check for duplicates
          const existingIndex = updatedFiles.findIndex(
            (file) => file.name === newFile.name
          );
          
          if (existingIndex !== -1) {
            updatedFiles[existingIndex] = newFile; // Replace existing file
            hasDuplicates = true;
          } else {
            updatedFiles.push(newFile); // Add new file
            hasAddedValidFiles = true;
          }
        });
        
        return updatedFiles;
      });
      
      setFileErrors(newFileErrors);
      
      // Show toast messages based on what happened
      if (Object.keys(newFileErrors).length > 0) {
        toast.error(`${Object.keys(newFileErrors).length} file(s) couldn't be added`);
      }
      
      if (hasDuplicates) {
        toast.info("Duplicate files have been replaced with newer versions");
      }
      
      if (hasAddedValidFiles) {
        toast.success("Files added successfully");
      }
    }
    
    // Reset the input
    if (e.target) {
      e.target.value = '';
    }
  };

  // Remove file from selection
  const removeFileFromSelection = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    toast.info("File removed from selection");
  };

  // Get file icon based on file type
  const getFileIcon = (file: File) => {
    if (file.type.includes("pdf")) {
      return <FileText className="w-5 h-5 text-red-500" />;
    } else if (file.type.includes("word") || file.type.includes("opendocument.text")) {
      return <FileText className="w-5 h-5 text-blue-500" />;
    } else if (file.type.includes("excel") || file.type.includes("spreadsheet")) {
      return <FileText className="w-5 h-5 text-green-500" />;
    } else if (file.type.includes("text/plain")) {
      return <FileText className="w-5 h-5 text-gray-500" />;
    }
    return <File className="w-5 h-5 text-gray-500" />;
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " bytes";
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
    else return (bytes / 1048576).toFixed(1) + " MB";
  };

  // Handle file upload
  const handleFileUpload = async () => {
    if (selectedFiles.length === 0) {
      toast.warning("No files selected for upload");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    
    const formData = new FormData();
    selectedFiles.forEach((file) => {
      formData.append("files", file);
      formData.append("file_names", file.name);
    });

    try {
      await api.post(`/api/submission/${assignmentId}/upload/`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(progress);
          }
        },
      });
      
      toast.success("Files uploaded successfully!");
      setSelectedFiles([]);
      
      // Redirect after successful upload with a small delay
      setTimeout(() => {
        router.push(`/module/${moduleId}/${assignmentId}`);
      }, 1500);
    } catch (err) {
      console.error("Upload error:", err);
      toast.error("Failed to upload files. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-purple-50 p-8">
          <div className="flex gap-4 items-center mb-6">
            <button
              className="flex items-center text-gray-600 hover:text-purple-600 transition-colors"
              onClick={() => router.push(`/module/${moduleId}/${assignmentId}`)}
            >
              <ArrowLeft className="w-5 h-5 mr-1" />
              <span>Back</span>
            </button>
          </div>
          <div className="max-w-5xl mx-auto">
            <div className="bg-white shadow-lg rounded-xl p-8 flex flex-col items-center justify-center">
              <Loader2 className="w-12 h-12 text-light-2 animate-spin mb-4" />
              <h2 className="text-xl font-medium text-gray-700">Loading...</h2>
              <p className="text-gray-500 mt-2">Please wait</p>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-purple-50">
        {/* Breadcrumb navigation */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center m-4">
          <div className="text-gray-500 text-xs sm:text-sm hidden sm:flex items-center mt-8">
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
              {moduleTitle || `Module ${moduleId}`}
            </span>
            <ChevronRight className="w-3 h-3 mx-1 text-gray-400" />
            <span
              className="hover:text-purple-600 cursor-pointer"
              onClick={() => router.push(`/module/${moduleId}/${assignmentId}`)}
            >
              {assignmentTitle || `Assignment ${assignmentId}`}
            </span>
            <ChevronRight className="w-3 h-3 mx-1 text-gray-400" />
            <span className="text-purple-600 font-medium truncate max-w-xs">
              Upload Answers
            </span>
          </div>

          {/* Mobile back button */}
          <div className="sm:hidden">
            <button
              className="flex items-center text-gray-600 hover:text-purple-600 transition-colors"
              onClick={() => router.push(`/module/${moduleId}/${assignmentId}`)}
            >
              <ArrowLeft className="w-5 h-5 mr-1" />
              <span>Back to Assignment</span>
            </button>
          </div>
        </div>
        
        <div className="max-w-5xl mx-auto px-4 pb-8">
          {/* Header */}
          <div className="bg-white shadow-lg rounded-xl p-6 mb-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
              <div>
                <h1 className="text-2xl font-bold text-dark-1 mb-1 flex items-center">
                  <Upload className="w-6 h-6 mr-2 text-light-2" />
                  Upload Student Answers
                </h1>
                <p className="text-gray-500 text-sm">
                  {assignmentTitle || `Assignment ${assignmentId}`}
                </p>
              </div>
            </div>
          </div>
          
          {/* Instructions Card */}
          <div className="bg-white shadow-lg rounded-xl overflow-hidden mb-6">
            <div className="bg-purple-50 px-6 py-4 border-b border-purple-100">
              <h2 className="font-semibold text-dark-1 flex items-center">
                <Info className="w-5 h-5 mr-2 text-light-2" />
                Upload Instructions
              </h2>
            </div>
            <div className="p-6">
              <div className="flex items-start mb-4">
                <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-md w-full">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <Info className="h-5 w-5 text-blue-500" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-blue-700">
                        Upload students' answer files to assess with your marking scheme. Supported file formats include PDF, DOCX, DOC, TXT, ODT, XLS, and XLSX. 
                        The system will automatically grade answers based on your marking scheme criteria.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg flex items-start">
                  <div className="rounded-full bg-purple-100 p-2 mr-3 flex-shrink-0">
                    <FileQuestion className="w-5 h-5 text-light-2" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-800 text-sm mb-1">File Requirements</h3>
                    <p className="text-xs text-gray-600">
                      Each file should contain numbered answers that match your marking scheme questions
                    </p>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg flex items-start">
                  <div className="rounded-full bg-purple-100 p-2 mr-3 flex-shrink-0">
                    <BookOpen className="w-5 h-5 text-light-2" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-800 text-sm mb-1">Answer Format</h3>
                    <p className="text-xs text-gray-600">
                      Answers should be in format: "1. Answer" with one question per line
                    </p>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg flex items-start">
                  <div className="rounded-full bg-purple-100 p-2 mr-3 flex-shrink-0">
                    <FilePlus2 className="w-5 h-5 text-light-2" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-800 text-sm mb-1">Multiple Files</h3>
                    <p className="text-xs text-gray-600">
                      You can upload multiple files at once for batch grading
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Upload Area */}
          <div className="bg-white shadow-lg rounded-xl overflow-hidden mb-6">
            <div className="bg-purple-50 px-6 py-4 border-b border-purple-100">
              <h2 className="font-semibold text-dark-1 flex items-center">
                <FileUp className="w-5 h-5 mr-2 text-light-2" />
                Upload Files
              </h2>
            </div>
            
            <div className="p-6">
              {/* Drag and Drop Area */}
              <div
                className={`border-2 ${
                  isDragging
                    ? "border-light-2 bg-purple-50"
                    : "border-dashed border-gray-300"
                } rounded-lg p-8 transition-all duration-200 text-center`}
                onDragEnter={handleDragEnter}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => document.getElementById("file-input")?.click()}
              >
                <input
                  id="file-input"
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleFileInputChange}
                  accept=".pdf,.docx,.doc,.txt,.odt,.xls,.xlsx"
                />
                
                <div className={`transition-transform duration-200 ${isDragging ? "scale-110" : "scale-100"}`}>
                  <div className="mx-auto w-16 h-16 flex items-center justify-center bg-purple-100 rounded-full mb-4">
                    <Upload className="w-8 h-8 text-light-2" />
                  </div>
                  
                  <h3 className="text-lg font-medium text-gray-700 mb-2">
                    {isDragging ? "Drop files here" : "Drag and drop files here"}
                  </h3>
                  
                  <p className="text-gray-500 mb-4">or click to browse your files</p>
                  
                  <span className="text-xs text-gray-400">
                    Supported formats: PDF, DOCX, DOC, TXT, ODT, XLS, XLSX (max 10MB per file)
                  </span>
                </div>
              </div>
              
              {/* Upload Progress Bar (visible during upload) */}
              {isUploading && (
                <div className="mt-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">Uploading...</span>
                    <span className="text-sm text-gray-500">{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className="bg-light-2 h-2.5 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Selected Files List */}
          {selectedFiles.length > 0 && (
            <div className="bg-white shadow-lg rounded-xl overflow-hidden mb-6">
              <div className="bg-purple-50 px-6 py-4 border-b border-purple-100 flex justify-between items-center">
                <h2 className="font-semibold text-dark-1 flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-light-2" />
                  Selected Files
                </h2>
                <span className="bg-purple-200 text-dark-1 px-2 py-1 rounded-full text-xs font-medium">
                  {selectedFiles.length} {selectedFiles.length === 1 ? 'file' : 'files'}
                </span>
              </div>
              
              <div className="p-6">
                <ul className="divide-y divide-gray-200">
                  {selectedFiles.map((file, index) => (
                    <li
                      key={index}
                      className="py-3 flex items-center justify-between hover:bg-gray-50 px-2 rounded-md transition-colors"
                    >
                      <div className="flex items-center">
                        <div className="mr-3">
                          {getFileIcon(file)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-800 text-sm">{file.name}</p>
                          <p className="text-xs text-gray-500 mt-1">{formatFileSize(file.size)}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => removeFileFromSelection(index)}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                        title="Remove file"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </li>
                  ))}
                </ul>
                
                {/* Upload Button */}
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={handleFileUpload}
                    disabled={isUploading || selectedFiles.length === 0}
                    className="flex items-center gap-2 px-6 py-2.5 bg-light-2 text-white rounded-lg hover:bg-light-1 transition-colors shadow-md disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <>
                        <FileUp className="w-5 h-5" />
                        <span>Upload {selectedFiles.length} {selectedFiles.length === 1 ? 'File' : 'Files'}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* No Files Selected State */}
          {selectedFiles.length === 0 && !isUploading && (
            <div className="text-center bg-gray-50 border border-dashed border-gray-300 rounded-lg p-8">
              <HelpCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 font-medium mb-2">No files selected yet</p>
              <p className="text-gray-500 text-sm mb-4">Drag and drop files or use the uploader above</p>
              <button
                onClick={() => document.getElementById("file-input")?.click()}
                className="px-4 py-2 bg-light-2 text-white rounded-lg hover:bg-light-1 transition-colors text-sm"
              >
                Select Files
              </button>
            </div>
          )}
          
          {/* Action Buttons */}
          <div className="flex justify-between mt-6">
            <button
              onClick={() => router.push(`/module/${moduleId}/${assignmentId}`)}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            
            {selectedFiles.length > 0 && (
              <button
                onClick={handleFileUpload}
                disabled={isUploading}
                className="flex items-center gap-2 px-6 py-2 bg-light-2 text-white rounded-lg hover:bg-light-1 transition-colors shadow-md disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Uploading...</span>
                  </>
                ) : (
                  <>
                    <FileUp className="w-5 h-5" />
                    <span>Upload Files</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* Toast notifications */}
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
    </ProtectedRoute>
  );
};

export default UploadAnswersPage;