"use client";
import React, { useState, useEffect } from "react";
import api from "@/lib/api";
import { useParams } from "next/navigation";
import BackButton from "@/app/(dashboard)/_components/BackButton";
import { useRouter } from "next/navigation";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  FileText,
  Plus,
  Trash2,
  Save,
  Check,
  X,
  AlertTriangle,
  HelpCircle,
  List,
  Type,
  Calculator,
  Clock,
  AlignLeft,
  ChevronDown,
  ChevronUp,
  Loader2,
  ChevronRight,
  FileUp,
  Info,
} from "lucide-react";

interface AnswerRow {
  id?: number;
  number: number;
  question: string;
  answer: string;
  marks: string;
  caseSensitive: boolean;
  orderSensitive: boolean;
  rangeSensitive: boolean;
  partialMatching: boolean;
  semanticThreshold: number;
  gradingType: "one-word" | "short-phrase" | "list" | "numerical";
  useRange?: boolean;
  range?: { min: number; max: number; tolerance_percent?: number };
  expanded?: boolean; // For UI expansion/collapse
  // New fields to track state
  isNew?: boolean;
  isModified?: boolean;
}

const MarkingSchemeForm: React.FC = () => {
  // Main state
  const [rows, setRows] = useState<AnswerRow[]>([
    {
      number: 1,
      question: "",
      answer: "",
      marks: "10", // Default to "10" as string to avoid empty field validation error
      caseSensitive: false,
      orderSensitive: false,
      rangeSensitive: false,
      partialMatching: false,
      semanticThreshold: 0.7,
      gradingType: "one-word",
      expanded: true, // First row expanded by default
      isNew: true, // Track that this is a new row
    },
  ]);
  
  // Other state variables
  const [title, setTitle] = useState<string>("");
  const { assignmentId, moduleId } = useParams();
  const [markingSchemeId, setMarkingSchemeId] = useState<number | null>(null);
  const [passScore, setPassScore] = useState<number>(40);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [assignmentTitle, setAssignmentTitle] = useState<string>("");
  const router = useRouter();
  
  // File upload related states
  const [isParsingFile, setIsParsingFile] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  
  // Track whether marking scheme has been modified since loading
  const [hasChanges, setHasChanges] = useState<boolean>(false);

  // Fetch existing marking scheme when the component loads
  const fetchMarkingScheme = async () => {
    if (!assignmentId) return;
    setIsLoading(true);

    // Fetch assignment details to get the title
    try {
      const assignmentResponse = await api.get(`/api/assignment/${assignmentId}/`);
      setAssignmentTitle(assignmentResponse.data.title || `Assignment ${assignmentId}`);
    } catch (error) {
      console.error("Error fetching assignment details:", error);
      setAssignmentTitle(`Assignment ${assignmentId}`);
    }

    try {
      const response = await api.get(
        `/api/assignment/${assignmentId}/marking-scheme/detail/`
      );
      const { id, answers, title, pass_score } = response.data;

      setMarkingSchemeId(id);
      setTitle(title || `Assignment ${assignmentId}`);
      setPassScore(pass_score || 40);

      if (answers && answers.length > 0) {
        const formattedAnswers = answers.map((answer: any, index: number) => ({
          id: answer.id,
          number: index + 1,
          question: answer.question_text || "",
          answer: answer.answer_text,
          marks: answer.marks.toString(), // Convert to string for form input
          caseSensitive: answer.case_sensitive || false,
          orderSensitive: answer.order_sensitive || false,
          rangeSensitive: answer.range_sensitive || false,
          partialMatching: answer.partial_matching || false,
          semanticThreshold: answer.semantic_threshold || 0.7,
          gradingType: answer.grading_type || "one-word",
          useRange: answer.range_sensitive || false,
          range: answer.range || { min: 0, max: 0, tolerance_percent: 0 },
          expanded: false, // All collapsed initially except first
          isModified: false, // Track that this is an existing row
        }));
        
        // Make first row expanded
        if (formattedAnswers.length > 0) {
          formattedAnswers[0].expanded = true;
        }
        
        setRows(formattedAnswers);
      }

      setIsLoading(false);
      setHasChanges(false); // Reset changes flag
    } catch (error: any) {
      if (error.response && error.response.status === 404) {
        console.log("No existing marking scheme found. Creating a new one.");
        setMarkingSchemeId(null);
        setTitle(`Assignment ${assignmentId}`);
      } else {
        console.error("Error fetching marking scheme:", error);
        toast.error("Failed to fetch marking scheme. Using default values.");
      }
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMarkingScheme();
  }, [assignmentId]);

  // Handle changes to form fields
  const handleChange = (index: number, field: keyof AnswerRow, value: any) => {
    const updatedRows = [...rows];
    updatedRows[index] = {
      ...updatedRows[index],
      [field]: value,
      isModified: true, // Mark this row as modified
    };

    // Enforce business logic based on grading type
    const gradingType = updatedRows[index].gradingType;
    
    if (gradingType === "one-word") {
      updatedRows[index].orderSensitive = false;
      updatedRows[index].rangeSensitive = false;
      updatedRows[index].useRange = false;
      // Don't force case sensitivity - let user decide
    } 
    else if (gradingType === "short-phrase") {
      updatedRows[index].orderSensitive = false;
      updatedRows[index].rangeSensitive = false;
      updatedRows[index].useRange = false;
      // Short phrases typically benefit from semantic matching
    } 
    else if (gradingType === "list") {
      updatedRows[index].rangeSensitive = false;
      updatedRows[index].useRange = false;
      // For lists, partial matching is often useful
      if (field === "gradingType") {
        updatedRows[index].partialMatching = true;
      }
    } 
    else if (gradingType === "numerical") {
      // Numerical answers are never case sensitive
      updatedRows[index].caseSensitive = false;
      updatedRows[index].orderSensitive = false;
      
      // Handle range settings
      if (field === "gradingType") {
        // When switching to numerical, enable range by default with sensible defaults
        updatedRows[index].rangeSensitive = true;
        updatedRows[index].useRange = true;
        
        // If there's a numeric answer, use it as the base for the range
        const numericValue = parseFloat(updatedRows[index].answer);
        if (!isNaN(numericValue)) {
          updatedRows[index].range = {
            min: Math.floor(numericValue * 0.95), // 5% below
            max: Math.ceil(numericValue * 1.05),  // 5% above
            tolerance_percent: 5
          };
        } else {
          updatedRows[index].range = { min: 0, max: 0, tolerance_percent: 5 };
        }
      }
      
      // Update rangeSensitive based on useRange
      if (field === "useRange") {
        updatedRows[index].rangeSensitive = value;
      }
    }

    setRows(updatedRows);
    setHasChanges(true);
  };

  // Add a new question row
  const addRow = (index: number) => {
    const newRow: AnswerRow = {
      id: Date.now(), // Temporary ID for frontend tracking
      number: rows.length + 1,
      question: "",
      answer: "",
      marks: "10", // Default to 10 marks
      caseSensitive: false,
      orderSensitive: false,
      rangeSensitive: false,
      partialMatching: false,
      semanticThreshold: 0.7,
      gradingType: "one-word",
      expanded: true, // New rows should be expanded
      isNew: true,    // Flag as a new row
    };
    const updatedRows = [
      ...rows.slice(0, index + 1),
      newRow,
      ...rows.slice(index + 1),
    ];

    // Renumber rows
    const renumberedRows = updatedRows.map((row, i) => ({
      ...row,
      number: i + 1,
    }));

    setRows(renumberedRows);
    setHasChanges(true);
  };

  // Delete a question row
  const deleteRow = (index: number) => {
    // Confirm before deleting
    if (rows.length <= 1) {
      toast.warning("Cannot delete the only question row!");
      return;
    }

    const updatedRows = rows.filter((_, i) => i !== index);
    const renumberedRows = updatedRows.map((row, i) => ({
      ...row,
      number: i + 1,
    }));
    setRows(renumberedRows);
    setHasChanges(true);
    toast.info("Question deleted");
  };

  // Toggle row expansion (collapse/expand)
  const toggleRowExpansion = (index: number) => {
    const updatedRows = [...rows];
    updatedRows[index] = {
      ...updatedRows[index],
      expanded: !updatedRows[index].expanded,
    };
    setRows(updatedRows);
  };

  // File upload handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file type
    const fileExt = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    const allowedTypes = ['.docx', '.pdf', '.xlsx', '.txt'];
    if (!allowedTypes.some(ext => fileExt.endsWith(ext))) {
      toast.error(`Unsupported file type. Please upload DOCX, PDF, XLSX, or TXT files.`);
      return;
    }
    
    // If we have existing scheme, confirm replacement
    if (hasChanges || rows.length > 1 || (rows.length === 1 && rows[0].answer)) {
      if (!window.confirm(`This will replace your current marking scheme. Any unsaved changes will be lost. Continue?`)) {
        return;
      }
    }
    
    setIsParsingFile(true);
    setUploadProgress(0);
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      // Use progress tracking during upload
      const response = await api.post(
        `/api/assignment/${assignmentId}/parse-marking-scheme/`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1));
            setUploadProgress(percentCompleted);
          }
        }
      );
      
      const parsedItems = response.data.items;
      
      if (parsedItems && parsedItems.length > 0) {
        // Convert parsed items to our row format
        const newRows = parsedItems.map((item, index) => ({
          number: index + 1, // Ensure sequential numbering
          question: item.question || "",
          answer: item.answer,
          marks: String(item.marks || 10),
          caseSensitive: item.caseSensitive || false,
          orderSensitive: item.orderSensitive || false,
          rangeSensitive: item.rangeSensitive || (item.gradingType === 'numerical'),
          partialMatching: item.partialMatching || (item.gradingType === 'list'),
          semanticThreshold: item.gradingType === 'short-phrase' ? 0.7 : 0.5,
          gradingType: item.gradingType || "one-word",
          expanded: index === 0, // Only expand first item
          useRange: item.gradingType === 'numerical',
          range: item.gradingType === 'numerical' ? 
            { min: 0, max: 0, tolerance_percent: 5 } : undefined,
          isNew: true, // Mark as new for proper handling during save
        }));
        
        setRows(newRows);
        setHasChanges(true);
        toast.success(`Successfully imported ${newRows.length} questions from ${file.name}`);
      } else {
        toast.warning("No valid questions found in the file. Please check the format and try again.");
      }
    } catch (error: any) {
      console.error("Error parsing file:", error);
      toast.error(`Failed to process file: ${error.response?.data?.error || "Unknown error"}`);
    } finally {
      setIsParsingFile(false);
      setUploadProgress(0);
      
      // Reset the file input so the same file can be uploaded again if needed
      const fileInput = document.getElementById('schemeFile') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    }
  };

  // Form validation and submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // If no changes, no need to save
    if (!hasChanges && markingSchemeId) {
      toast.info("No changes to save");
      router.push(`/module/${moduleId}/${assignmentId}`);
      return;
    }
    
    setIsSaving(true);

    // Basic validation
    let isValid = true;
    let errorMessage = "";

    // Check for empty required fields
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (!row.answer.trim()) {
        isValid = false;
        errorMessage = `Question ${i + 1} is missing an answer`;
        break;
      }
      if (!row.marks.trim() || parseInt(row.marks) <= 0) {
        isValid = false;
        errorMessage = `Question ${i + 1} needs a valid marks value`;
        break;
      }
      // Validate numerical ranges if applicable
      if (row.gradingType === "numerical" && row.useRange) {
        if (row.range?.min === undefined || row.range?.max === undefined) {
          isValid = false;
          errorMessage = `Question ${i + 1} needs valid min and max values for the range`;
          break;
        }
        if (row.range.min > row.range.max) {
          isValid = false;
          errorMessage = `Question ${i + 1} has min value greater than max value`;
          break;
        }
      }
    }

    if (!isValid) {
      toast.error(errorMessage);
      setIsSaving(false);
      return;
    }

    // Validate pass score
    if (passScore < 0 || passScore > 100) {
      toast.error("Pass score must be between 0 and 100");
      setIsSaving(false);
      return;
    }

    // Prepare data for submission
    const markingSchemeData = {
      assignment: assignmentId,
      title: title.trim() || `Assignment ${assignmentId} Marking Scheme`,
      pass_score: passScore,
      answers: rows.map((row) => ({
        id: row.id, // Include ID for existing rows, backend will handle new rows
        question_text: row.question,
        answer_text: row.answer.trim(),
        marks: parseInt(row.marks, 10),
        case_sensitive: row.caseSensitive,
        order_sensitive: row.orderSensitive,
        range_sensitive: row.rangeSensitive || (row.gradingType === "numerical" && row.useRange),
        partial_matching: row.partialMatching,
        semantic_threshold: row.semanticThreshold,
        grading_type: row.gradingType,
        range: row.gradingType === "numerical" && row.useRange ? row.range : null,
      })),
    };

    try {
      // Update or create marking scheme based on markingSchemeId
      if (markingSchemeId) {
        await api.put(
          `/api/assignment/${assignmentId}/marking-scheme/detail/`,
          markingSchemeData
        );
        toast.success("Marking Scheme updated successfully!");
      } else {
        await api.post(
          `/api/assignment/${assignmentId}/marking-scheme/`,
          markingSchemeData
        );
        toast.success("Marking Scheme created successfully!");
      }
      
      // Reset change tracking
      setHasChanges(false);
      
      // Redirect after a short delay to allow toast to be visible
      setTimeout(() => {
        router.push(`/module/${moduleId}/${assignmentId}`);
      }, 1500);
    } catch (error: any) {
      console.error("Error submitting marking scheme:", error);
      
      // More specific error message based on error response
      if (error.response?.data?.error) {
        toast.error(`Error: ${error.response.data.error}`);
      } else {
        toast.error("Failed to submit marking scheme. Please try again.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Helper function to get the grading type icon and label
  const getGradingTypeInfo = (type: string) => {
    switch (type) {
      case "one-word":
        return { icon: <Type className="w-4 h-4" />, label: "One Word" };
      case "short-phrase":
        return { icon: <AlignLeft className="w-4 h-4" />, label: "Short Phrase" };
      case "list":
        return { icon: <List className="w-4 h-4" />, label: "List" };
      case "numerical":
        return { icon: <Calculator className="w-4 h-4" />, label: "Numerical" };
      default:
        return { icon: <Type className="w-4 h-4" />, label: "One Word" };
    }
  };
  
  // Tooltip component for better UI clarity
  const Tooltip = ({ children, text }: { children: React.ReactNode, text: string }) => {
    const [isVisible, setIsVisible] = useState(false);
    
    return (
      <div className="relative inline-block">
        <div
          onMouseEnter={() => setIsVisible(true)}
          onMouseLeave={() => setIsVisible(false)}
        >
          {children}
        </div>
        {isVisible && (
          <div className="absolute z-10 w-60 px-3 py-2 text-xs text-white bg-gray-700 rounded-md shadow-lg bottom-full left-1/2 transform -translate-x-1/2 -translate-y-2">
            {text}
            <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 rotate-45 bg-gray-700"></div>
          </div>
        )}
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-purple-50 p-8">
        <div className="flex gap-4 items-center mb-6">
          <BackButton />
        </div>
        <div className="max-w-5xl mx-auto">
          <div className="bg-white shadow-lg rounded-xl p-8 flex flex-col items-center justify-center">
            <Loader2 className="w-12 h-12 text-light-2 animate-spin mb-4" />
            <h2 className="text-xl font-medium text-gray-700">Loading marking scheme...</h2>
            <p className="text-gray-500 mt-2">Please wait while we load the marking scheme details</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-purple-50">
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
            Module {moduleId}
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
            Marking Scheme
          </span>
        </div>
      </div>
      
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-extrabold text-dark-1 tracking-wide mb-2">
            Edit <span className="text-light-2">Marking Scheme</span>
          </h1>
          <p className="text-gray-500">
            Configure how answers will be graded automatically using AI
          </p>
        </div>

        {/* File Upload Section */}
        <div className="bg-white shadow-lg rounded-xl p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <FileUp className="w-5 h-5 mr-2 text-purple-600" />
            Import Answers from File
          </h3>
          
          <div 
            className={`border-2 border-dashed ${isDragging ? 'border-light-1 bg-purple-50' : 'border-gray-300'} rounded-lg p-6 hover:border-light-2 transition-colors`}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              if (e.dataTransfer.files.length > 0) {
                const fileInput = document.getElementById('schemeFile') as HTMLInputElement;
                const dataTransfer = new DataTransfer();
                dataTransfer.items.add(e.dataTransfer.files[0]);
                fileInput.files = dataTransfer.files;
                handleFileUpload({ target: fileInput } as React.ChangeEvent<HTMLInputElement>);
              }
            }}
          >
            <input
              type="file"
              id="schemeFile"
              onChange={handleFileUpload}
              className="hidden"
              accept=".docx,.pdf,.xlsx,.txt"
            />
            <label htmlFor="schemeFile" className="cursor-pointer block text-center">
              <div className="flex flex-col items-center">
                <FileText className="w-12 h-12 text-gray-400 mb-3" />
                <p className="text-sm font-medium text-gray-700 mb-1">
                  Drag & drop or click to upload a file with answers
                </p>
                <p className="text-xs text-gray-500 mb-3">
                  Supported formats: DOCX, PDF, XLSX, TXT
                </p>
                <button 
                  type="button"
                  className="mt-2 px-4 py-2 bg-light-2 text-white rounded-full text-sm hover:bg-light-1 transition-all"
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById('schemeFile')?.click();
                  }}
                >
                  Select File
                </button>
              </div>
            </label>
          </div>
          
          {isParsingFile && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">Analyzing file...</span>
                <span className="text-sm text-gray-500">{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div className="bg-light-2 h-2.5 rounded-full" style={{ width: `${uploadProgress}%` }}></div>
              </div>
              <p className="mt-2 text-xs text-gray-500 flex items-center">
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                AI is extracting questions and answers from your file
              </p>
            </div>
          )}
          
          <div className="mt-4 text-xs text-gray-500">
            <p className="font-medium mb-1">Tips for best results:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Number your questions (e.g., "1. Paris")</li>
              <li>Include answers for each question</li>
              <li>Optional: specify marks like "(5 marks)" after answers</li>
              <li>AI will automatically determine appropriate grading types</li>
            </ul>
          </div>
        </div>

        <div className="bg-white shadow-lg rounded-xl p-6 mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 pb-4 border-b">
            <div>
              <h2 className="text-xl font-semibold text-dark-1">{title || `Assignment ${assignmentId}`}</h2>
              <p className="text-sm text-gray-500 mt-1">
                {markingSchemeId ? "Update existing marking scheme" : "Create new marking scheme"}
              </p>
            </div>
            
            <div className="flex items-center mt-4 md:mt-0 gap-3">
              <div className="flex items-center bg-purple-50 px-3 py-2 rounded-lg">
                <Tooltip text="Minimum score (out of 100) required to pass this assessment.">
                  <label htmlFor="passScore" className="text-sm font-medium text-dark-1 mr-2 flex items-center">
                    Pass Score:
                    <Info className="w-3.5 h-3.5 ml-1 text-gray-400" />
                  </label>
                </Tooltip>
                <input
                  id="passScore"
                  type="number"
                  min="0"
                  max="100"
                  value={passScore}
                  onChange={(e) => {
                    setPassScore(parseInt(e.target.value));
                    setHasChanges(true);
                  }}
                  className="w-16 border border-gray-300 rounded-md px-2 py-1 text-center focus:outline-none focus:ring-2 focus:ring-light-2"
                />
                <span className="ml-1 text-gray-500">%</span>
              </div>
              
              <button
                onClick={handleSubmit}
                disabled={isSaving}
                className="flex items-center gap-2 px-4 py-2 bg-light-2 text-white rounded-lg hover:bg-light-1 transition duration-200 shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Scheme</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="mb-4 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <HelpCircle className="h-5 w-5 text-yellow-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">Grading Instructions</h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Enter each question with its answer, points, and grading options</li>
                    <li>For <strong>numerical</strong> answers, you can specify an acceptable range</li>
                    <li>For <strong>list</strong> answers, enable partial matching to award partial credit</li>
                    <li><strong>Short phrase</strong> answers use semantic meaning comparison</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Questions */}
          <div className="space-y-4 mb-6">
            {rows.map((row, index) => (
              <div
                key={index}
                className="border border-gray-200 rounded-lg overflow-hidden shadow-sm transition duration-200 hover:shadow-md bg-white"
              >
                {/* Question header - always visible */}
                <div 
                  className="flex items-center justify-between p-4 bg-gray-50 cursor-pointer"
                  onClick={() => toggleRowExpansion(index)}
                >
                  <div className="flex items-center">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-light-2 text-white font-medium mr-3">
                      {row.number}
                    </div>
                    <div className="mr-3">
                      <span className="text-sm font-medium text-gray-700">
                        {row.answer ? row.answer : "No answer provided"}
                      </span>
                      <div className="flex items-center text-xs text-gray-500 mt-1">
                        <span className="flex items-center mr-3">
                          {getGradingTypeInfo(row.gradingType).icon}
                          <span className="ml-1">{getGradingTypeInfo(row.gradingType).label}</span>
                        </span>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-light-3 text-dark-1">
                          {row.marks ? `${row.marks} marks` : "0 marks"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteRow(index);
                      }}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded-md mr-2 transition-colors"
                      aria-label="Delete question"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        addRow(index);
                      }}
                      className="p-1.5 text-light-2 hover:bg-purple-50 rounded-md mr-2 transition-colors"
                      aria-label="Add question"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                    {row.expanded ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </div>
                
                {/* Expanded content */}
                {row.expanded && (
                  <div className="p-4 border-t border-gray-100">
                    {/* Question text */}
                    <div className="mb-4">
                      <label htmlFor={`question-${index}`} className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                        <span>Question Text (for context):</span>
                        <Tooltip text="Adding the question text helps AI understand the context for short phrase matching.">
                          <Info className="w-3.5 h-3.5 ml-1 text-gray-400 cursor-help" />
                        </Tooltip>
                      </label>
                      <textarea
                        id={`question-${index}`}
                        value={row.question}
                        onChange={(e) => handleChange(index, "question", e.target.value)}
                        placeholder="Enter the question text for better context"
                        rows={2}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-light-2 transition-all"
                      />
                    </div>
                    
                    {/* Answer and marks */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                      <div className="md:col-span-3">
                        <label htmlFor={`answer-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
                          Answer:
                        </label>
                        <input
                          id={`answer-${index}`}
                          type="text"
                          value={row.answer}
                          onChange={(e) => handleChange(index, "answer", e.target.value)}
                          placeholder="Enter the correct answer"
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-light-2 transition-all"
                        />
                      </div>
                      <div>
                        <label htmlFor={`marks-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
                          Marks:
                        </label>
                        <input
                          id={`marks-${index}`}
                          type="number"
                          value={row.marks}
                          onChange={(e) => handleChange(index, "marks", e.target.value)}
                          placeholder="Marks"
                          min="0"
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-light-2 transition-all"
                        />
                      </div>
                    </div>
                    
                    {/* Grading type and options */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label htmlFor={`gradingType-${index}`} className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                          <span>Grading Type:</span>
                          <Tooltip text="Select how this answer should be graded. Different types use different matching methods.">
                            <Info className="w-3.5 h-3.5 ml-1 text-gray-400 cursor-help" />
                          </Tooltip>
                        </label>
                        <select
                          id={`gradingType-${index}`}
                          value={row.gradingType}
                          onChange={(e) => handleChange(index, "gradingType", e.target.value)}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-light-2 transition-all"
                        >
                          <option value="one-word">One Word (Exact Match)</option>
                          <option value="short-phrase">Short Phrase (Semantic Match)</option>
                          <option value="list">List Items</option>
                          <option value="numerical">Numerical Value</option>
                        </select>
                        
                        {/* Grading type explanation */}
                        <div className="mt-1 text-xs text-gray-500">
                          {row.gradingType === "one-word" && "Matches a single word exactly"}
                          {row.gradingType === "short-phrase" && "Uses AI to understand the meaning of phrases"}
                          {row.gradingType === "list" && "Compares items in a list, with or without order"}
                          {row.gradingType === "numerical" && "Compares numbers, with optional range tolerance"}
                        </div>
                      </div>
                      
                      <div className="flex flex-col justify-between">
                        <span className="block text-sm font-medium text-gray-700 mb-1">
                          Grading Options:
                        </span>
                        
                        <div className="grid grid-cols-2 gap-2">
                          {/* Case Sensitive Option */}
                          <div className={`flex items-center ${row.gradingType === "numerical" ? "opacity-50" : ""}`}>
                            <Tooltip text="When enabled, 'Paris' and 'paris' will be treated as different answers.">
                              <div className="flex items-center">
                                <input
                                  id={`caseSensitive-${index}`}
                                  type="checkbox"
                                  checked={row.caseSensitive}
                                  disabled={row.gradingType === "numerical"}
                                  onChange={(e) => handleChange(index, "caseSensitive", e.target.checked)}
                                  className="h-4 w-4 text-light-2 focus:ring-light-2 border-gray-300 rounded"
                                />
                                <label htmlFor={`caseSensitive-${index}`} className="ml-2 text-sm text-gray-700 flex items-center">
                                  Case Sensitive
                                  <Info className="w-3.5 h-3.5 ml-1 text-gray-400 cursor-help" />
                                </label>
                              </div>
                            </Tooltip>
                          </div>
                          
                          {/* Order Sensitive Option */}
                          <div className={`flex items-center ${row.gradingType !== "list" ? "opacity-50" : ""}`}>
                            <Tooltip text="When enabled, the order of items in a list matters. For example, 'A,B,C' and 'B,A,C' would be different.">
                              <div className="flex items-center">
                                <input
                                  id={`orderSensitive-${index}`}
                                  type="checkbox"
                                  checked={row.orderSensitive}
                                  disabled={row.gradingType !== "list"}
                                  onChange={(e) => handleChange(index, "orderSensitive", e.target.checked)}
                                  className="h-4 w-4 text-light-2 focus:ring-light-2 border-gray-300 rounded"
                                />
                                <label htmlFor={`orderSensitive-${index}`} className="ml-2 text-sm text-gray-700 flex items-center">
                                  Order Matters
                                  <Info className="w-3.5 h-3.5 ml-1 text-gray-400 cursor-help" />
                                </label>
                              </div>
                            </Tooltip>
                          </div>
                          
                          {/* Partial Matching Option */}
                          <div className={`flex items-center ${row.gradingType !== "list" ? "opacity-50" : ""}`}>
                            <Tooltip text="When enabled, partial credit is given based on how many items are correct in a list.">
                              <div className="flex items-center">
                                <input
                                  id={`partialMatching-${index}`}
                                  type="checkbox"
                                  checked={row.partialMatching}
                                  disabled={row.gradingType !== "list"}
                                  onChange={(e) => handleChange(index, "partialMatching", e.target.checked)}
                                  className="h-4 w-4 text-light-2 focus:ring-light-2 border-gray-300 rounded"
                                />
                                <label htmlFor={`partialMatching-${index}`} className="ml-2 text-sm text-gray-700 flex items-center">
                                  Partial Credit
                                  <Info className="w-3.5 h-3.5 ml-1 text-gray-400 cursor-help" />
                                </label>
                              </div>
                            </Tooltip>
                          </div>
                          
                          {/* Use Range Option */}
                          {row.gradingType === "numerical" && (
                            <div className="flex items-center">
                              <Tooltip text="When enabled, answers within a specified range are considered correct.">
                                <div className="flex items-center">
                                  <input
                                    id={`useRange-${index}`}
                                    type="checkbox"
                                    checked={row.useRange || false}
                                    onChange={(e) => handleChange(index, "useRange", e.target.checked)}
                                    className="h-4 w-4 text-light-2 focus:ring-light-2 border-gray-300 rounded"
                                  />
                                  <label htmlFor={`useRange-${index}`} className="ml-2 text-sm text-gray-700 flex items-center">
                                    Use Range
                                    <Info className="w-3.5 h-3.5 ml-1 text-gray-400 cursor-help" />
                                  </label>
                                </div>
                              </Tooltip>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Additional options based on grading type */}
                    {row.gradingType === "short-phrase" && (
                      <div className="mb-4">
                        <label htmlFor={`semanticThreshold-${index}`} className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                          <span>Semantic Threshold (0.0 - 1.0):</span>
                          <Tooltip text="Higher values require answers to be more similar to the correct answer. Lower values are more lenient.">
                            <Info className="w-3.5 h-3.5 ml-1 text-gray-400 cursor-help" />
                          </Tooltip>
                        </label>
                        <div className="flex items-center">
                          <input
                            id={`semanticThreshold-${index}`}
                            type="range"
                            min="0"
                            max="1"
                            step="0.1"
                            value={row.semanticThreshold}
                            onChange={(e) => handleChange(index, "semanticThreshold", parseFloat(e.target.value))}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-light-2"
                          />
                          <span className="ml-2 w-12 text-center text-sm font-medium">
                            {row.semanticThreshold.toFixed(1)}
                          </span>
                        </div>
                        <div className="mt-1 text-xs text-gray-500 flex justify-between">
                          <span>More lenient</span>
                          <span>More strict</span>
                        </div>
                      </div>
                    )}
                    
                    {/* Numerical range inputs */}
                    {row.gradingType === "numerical" && row.useRange && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 p-3 bg-gray-50 rounded-lg">
                        <div>
                          <label htmlFor={`minRange-${index}`} className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                            <span>Minimum Value:</span>
                            <Tooltip text="The lowest acceptable answer value.">
                              <Info className="w-3.5 h-3.5 ml-1 text-gray-400 cursor-help" />
                            </Tooltip>
                          </label>
                          <input
                            id={`minRange-${index}`}
                            type="number"
                            value={row.range?.min || ""}
                            onChange={(e) => handleChange(index, "range", {
                              ...row.range,
                              min: parseFloat(e.target.value),
                            })}
                            placeholder="Min Value"
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-light-2"
                          />
                        </div>
                        <div>
                          <label htmlFor={`maxRange-${index}`} className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                            <span>Maximum Value:</span>
                            <Tooltip text="The highest acceptable answer value.">
                              <Info className="w-3.5 h-3.5 ml-1 text-gray-400 cursor-help" />
                            </Tooltip>
                          </label>
                          <input
                            id={`maxRange-${index}`}
                            type="number"
                            value={row.range?.max || ""}
                            onChange={(e) => handleChange(index, "range", {
                              ...row.range,
                              max: parseFloat(e.target.value),
                            })}
                            placeholder="Max Value"
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-light-2"
                          />
                        </div>
                        <div>
                          <label htmlFor={`toleranceRange-${index}`} className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                            <span>Tolerance %:</span>
                            <Tooltip text="Percentage tolerance outside the min/max range. For example, 5% means answers up to 5% below minimum or above maximum will still be accepted.">
                              <Info className="w-3.5 h-3.5 ml-1 text-gray-400 cursor-help" />
                            </Tooltip>
                          </label>
                          <input
                            id={`toleranceRange-${index}`}
                            type="number"
                            min="0"
                            max="100"
                            value={row.range?.tolerance_percent || ""}
                            onChange={(e) => handleChange(index, "range", {
                              ...row.range,
                              tolerance_percent: parseFloat(e.target.value),
                            })}
                            placeholder="Tolerance %"
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-light-2"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {/* Add question button */}
          <div className="mt-6 flex justify-center">
            <button
              type="button"
              onClick={() => addRow(rows.length - 1)}
              className="flex items-center gap-2 px-4 py-2 border border-dashed border-light-2 rounded-lg text-light-2 hover:bg-purple-50 transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span>Add Question</span>
            </button>
          </div>
        </div>
        
        {/* Action buttons */}
        <div className="flex justify-between items-center">
          <button
            type="button"
            onClick={() => {
              // If there are unsaved changes, confirm before leaving
              if (hasChanges) {
                if (window.confirm("You have unsaved changes. Are you sure you want to leave?")) {
                  router.push(`/module/${moduleId}/${assignmentId}`);
                }
              } else {
                router.push(`/module/${moduleId}/${assignmentId}`);
              }
            }}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2 bg-light-2 text-white rounded-lg hover:bg-light-1 transition-colors shadow-md disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                <span>Save Marking Scheme</span>
              </>
            )}
          </button>
        </div>
      </div>
      
      {/* Toast container for notifications */}
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
    </div>
  );
};

export default MarkingSchemeForm;