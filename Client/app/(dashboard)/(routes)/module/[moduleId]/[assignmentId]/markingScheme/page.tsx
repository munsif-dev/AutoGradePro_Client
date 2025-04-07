"use client";
import React, { useState, useEffect } from "react";
import api from "@/lib/api";
import { useParams } from "next/navigation";
import BackButton from "@/app/(dashboard)/_components/BackButton";
import { useRouter } from "next/navigation";

interface AnswerRow {
  id?: number;
  number: number;
  question: string; // New field for question text
  answer: string;
  marks: string;
  caseSensitive: boolean;
  orderSensitive: boolean;
  rangeSensitive: boolean;
  partialMatching: boolean; // New field for partial matching on lists
  semanticThreshold: number; // New field for semantic threshold on short phrases
  gradingType: "one-word" | "short-phrase" | "list" | "numerical";
  useRange?: boolean; // For numerical answers
  range?: { min: number; max: number; tolerance_percent?: number }; // Enhanced range with tolerance
}

const MarkingSchemeForm: React.FC = () => {
  const [rows, setRows] = useState<AnswerRow[]>([
    {
      number: 1,
      question: "", // New field for question text
      answer: "",
      marks: "",
      caseSensitive: false,
      orderSensitive: false,
      rangeSensitive: false,
      partialMatching: false, // Default no partial matching
      semanticThreshold: 0.7, // Default semantic threshold
      gradingType: "one-word",
    },
  ]);
  const [title, setTitle] = useState<string>("");
  const { assignmentId, moduleId } = useParams();
  const [markingSchemeId, setMarkingSchemeId] = useState<number | null>(null);
  const [passScore, setPassScore] = useState<number>(0); // New state for pass score
  const router = useRouter();

  const fetchMarkingScheme = async () => {
    if (!assignmentId) return;

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
          question: answer.question_text || "", // Get question text from backend
          answer: answer.answer_text,
          marks: answer.marks.toString(),
          caseSensitive: answer.case_sensitive || false,
          orderSensitive: answer.order_sensitive || false,
          rangeSensitive: answer.range_sensitive || false,
          partialMatching: answer.partial_matching || false, // Get partial matching setting
          semanticThreshold: answer.semantic_threshold || 0.7, // Get semantic threshold
          gradingType: answer.grading_type || "one-word",
          useRange: answer.range_sensitive || false,
          range: answer.range || { min: 0, max: 0, tolerance_percent: 0 }, // Include tolerance
        }));
        setRows(formattedAnswers);
      }
    } catch (error: any) {
      if (error.response && error.response.status === 404) {
        // Create a new marking scheme mode
        console.log("No existing marking scheme found. Creating a new one.");
        setMarkingSchemeId(null);
        setTitle(`Assignment ${assignmentId}`);
        // Keep default rows from initial state
      } else {
        console.error("Error fetching marking scheme:", error);
        // Use toast instead of alert for better UX
        // toast.error("Failed to fetch marking scheme. Using default values.");
      }
    }
  };

  useEffect(() => {
    fetchMarkingScheme();
  }, [assignmentId]);

  const handleChange = (index: number, field: keyof AnswerRow, value: any) => {
    const updatedRows = [...rows];
    updatedRows[index] = {
      ...updatedRows[index],
      [field]: value,
    };

    // Enforce logic based on gradingType
    const gradingType = updatedRows[index].gradingType;
    if (gradingType === "one-word" || gradingType === "short-phrase") {
      updatedRows[index].orderSensitive = false;
      updatedRows[index].rangeSensitive = false;
    } else if (gradingType === "list") {
      updatedRows[index].rangeSensitive = false;
    } else if (gradingType === "numerical") {
      updatedRows[index].caseSensitive = false;
      updatedRows[index].orderSensitive = false;
      updatedRows[index].rangeSensitive = true;

      // Reset range if `useRange` is false
      if (!updatedRows[index].useRange) {
        updatedRows[index].range = { min: 0, max: 0 };
      }
    }

    setRows(updatedRows);
  };

  const addRow = (index: number) => {
    const newRow: AnswerRow = {
      id: Date.now(),
      number: rows.length + 1,
      question: "", // New field for question text
      answer: "",
      marks: "",
      caseSensitive: false,
      orderSensitive: false,
      rangeSensitive: false,
      partialMatching: false, // New field for partial matching
      semanticThreshold: 0.7, // New field for semantic threshold
      gradingType: "one-word",
    };
    const updatedRows = [
      ...rows.slice(0, index + 1),
      newRow,
      ...rows.slice(index + 1),
    ];

    const renumberedRows = updatedRows.map((row, i) => ({
      ...row,
      number: i + 1,
    }));

    setRows(renumberedRows);
  };

  const deleteRow = (index: number) => {
    const updatedRows = rows.filter((_, i) => i !== index);
    const renumberedRows = updatedRows.map((row, i) => ({
      ...row,
      number: i + 1,
    }));
    setRows(renumberedRows);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const markingSchemeData = {
      assignment: assignmentId,
      title: title.trim(),
      pass_score: passScore,
      answers: rows.map((row) => ({
        id: row.id,
        question_text: row.question, // Include question text field
        answer_text: row.answer,
        marks: parseInt(row.marks, 10),
        case_sensitive: row.caseSensitive,
        order_sensitive: row.orderSensitive,
        range_sensitive: row.rangeSensitive,
        partial_matching: row.partialMatching, // Include partial matching field
        semantic_threshold: row.semanticThreshold, // Include semantic threshold
        grading_type: row.gradingType,
        use_range: row.useRange || false,
        range: row.range,
      })),
    };

    try {
      if (markingSchemeId) {
        const response = await api.put(
          `/api/assignment/${assignmentId}/marking-scheme/detail/`,
          markingSchemeData
        );
        alert("Marking Scheme updated successfully!");
        console.log("Response:", response.data);
        router.push(`/module/${moduleId}/${assignmentId}`);
      } else {
        const response = await api.post(
          `/api/assignment/${assignmentId}/marking-scheme/`,
          markingSchemeData
        );
        alert("Marking Scheme created successfully!");
        console.log("Response:", response.data);
      }

      fetchMarkingScheme();
    } catch (error) {
      console.error("Error submitting marking scheme:", error);
      alert("Failed to submit marking scheme.");
    }
  };

  return (
    <div className="w-full">
      <div className="flex gap-4 items-center m-4">
        <BackButton />
      </div>
      <div className="bg-gradient-to-r p-6 flex flex-col items-center w-full">
        <div className="flex justify-center items-center mb-6 w-full">
          <h1 className="text-4xl font-extrabold text-dark-1">
            Edit <span className="text-light-2">Marking Scheme</span>
          </h1>
        </div>
        <div className="bg-white shadow-xl rounded-2xl p-6 w-full md:w-4/5 mx-auto m-2">
          <h2 className="text-2xl font-semibold text-center text-dark-1 mb-4">
            {`Marking Scheme: ${title || "Loading..."}`}
          </h2>

          {/* Loop through rows */}
          {rows.map((row, index) => (
            <div
              key={index}
              className="flex flex-col p-4 bg-gray-50 hover:bg-gray-100 rounded-lg shadow-lg mb-3 transition duration-300"
            >
              <div className="flex justify-between items-center mb-3">
                <span className="text-lg font-medium text-dark-1">
                  {row.number}.
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => addRow(index)}
                    className="bg-light-2 text-white p-1 px-4 rounded-full hover:bg-dark-1 transition-all"
                  >
                    + Add
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteRow(index)}
                    className="bg-red-500 text-white p-1 px-4 rounded-full hover:bg-red-600 transition-all"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {/* Question Text Input */}
              <div className="mb-3">
                <label htmlFor={`question-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
                  Question Text (for context):
                </label>
                <textarea
                  id={`question-${index}`}
                  value={row.question}
                  onChange={(e) =>
                    handleChange(index, "question", e.target.value)
                  }
                  placeholder="Enter Question Text"
                  rows={2}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:border-blue-400 transition-all"
                />
              </div>

              {/* Answer Input & Marks Input in the Same Line */}
              <div className="flex gap-4 mb-3">
                <div className="flex-1">
                  <label htmlFor={`answer-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
                    Answer:
                  </label>
                  <input
                    id={`answer-${index}`}
                    type="text"
                    value={row.answer}
                    onChange={(e) =>
                      handleChange(index, "answer", e.target.value)
                    }
                    placeholder="Enter Answer"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:border-blue-400 transition-all"
                  />
                </div>
                <div className="w-1/4">
                  <label htmlFor={`marks-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
                    Marks:
                  </label>
                  <input
                    id={`marks-${index}`}
                    type="number"
                    value={row.marks}
                    onChange={(e) =>
                      handleChange(index, "marks", e.target.value)
                    }
                    placeholder="Marks"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:border-blue-400 transition-all"
                  />
                </div>
              </div>

              {/* Grading Type and Options (Side-by-Side) */}
              <div className="flex gap-4 mb-3 items-center justify-start">
                {/* Sensitivity Options (Side-by-Side) */}
                <div className="flex items-start gap-4">
                  <div className="flex items-center space-x-2">
                    <input
                      id={`caseSensitive-${index}`}
                      type="checkbox"
                      checked={row.caseSensitive}
                      disabled={row.gradingType === "numerical"}
                      onChange={(e) =>
                        handleChange(index, "caseSensitive", e.target.checked)
                      }
                    />
                    <label
                      htmlFor={`caseSensitive-${index}`}
                      className=" font-light"
                    >
                      Case Sensitive
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      id={`orderSensitive-${index}`}
                      type="checkbox"
                      checked={row.orderSensitive}
                      disabled={
                        row.gradingType === "numerical" ||
                        row.gradingType === "one-word" ||
                        row.gradingType === "short-phrase"
                      }
                      onChange={(e) =>
                        handleChange(index, "orderSensitive", e.target.checked)
                      }
                    />
                    <label
                      htmlFor={`orderSensitive-${index}`}
                      className=" font-light"
                    >
                      Order Sensitive
                    </label>
                  </div>
                </div>

                <div className="w-full sm:w-1/2">
                  <select
                    id={`gradingType-${index}`}
                    value={row.gradingType}
                    onChange={(e) =>
                      handleChange(index, "gradingType", e.target.value)
                    }
                    className="w-1/2 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:border-blue-400 transition-all"
                  >
                    <option value="one-word">One Word</option>
                    <option value="short-phrase">Short Phrase</option>
                    <option value="list">List</option>
                    <option value="numerical">Numerical</option>
                  </select>
                </div>
              </div>

              {/* Range Inputs for Numerical Grading (Side-by-Side) */}
              {row.gradingType === "numerical" && (
                <div className="flex flex-col space-y-2 mb-3">
                  <div className="flex items-center justify-start">
                    <input
                      type="checkbox"
                      checked={row.useRange || false}
                      onChange={(e) =>
                        handleChange(index, "useRange", e.target.checked)
                      }
                      id={`useRange-${index}`}
                    />
                    <label
                      htmlFor={`useRange-${index}`}
                      className="ml-2  font-light"
                    >
                      Add Range
                    </label>
                  </div>
                  {row.useRange && (
                    <div className="flex space-x-2">
                      <div className="w-1/3">
                        <input
                          id={`minRange-${index}`}
                          type="number"
                          value={row.range?.min || ""}
                          onChange={(e) =>
                            handleChange(index, "range", {
                              ...row.range,
                              min: parseFloat(e.target.value),
                            })
                          }
                          placeholder="Min Range"
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none"
                        />
                      </div>
                      <div className="w-1/3">
                        <input
                          id={`maxRange-${index}`}
                          type="number"
                          value={row.range?.max || ""}
                          onChange={(e) =>
                            handleChange(index, "range", {
                              ...row.range,
                              max: parseFloat(e.target.value),
                            })
                          }
                          placeholder="Max Range"
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {/* Pass Score & Submit Button Side by Side */}
          <div className="flex justify-end  gap-4 mt-8">
            <div className="flex-1">
              <label
                htmlFor="passScore"
                className="text-lg font-medium text-dark-1 mb-2"
              >
                {"Enter Pass Score: "}
              </label>
              <input
                id="passScore"
                type="number"
                value={passScore}
                onChange={(e) => setPassScore(parseFloat(e.target.value))}
                placeholder="Pass Score (Default: 40)"
                className="w-full sm:w-auto border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:border-blue-500 transition-all"
              />
            </div>
            <button
              type="submit"
              onClick={handleSubmit}
              className="bg-green-500 text-white px-6 py-3 rounded-full shadow-md hover:bg-green-600 transition-all flex-shrink-0"
            >
              Submit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarkingSchemeForm;
