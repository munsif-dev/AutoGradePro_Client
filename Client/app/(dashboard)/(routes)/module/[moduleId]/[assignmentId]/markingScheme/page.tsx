"use client";
import React, { useState, useEffect } from "react";
import api from "@/lib/api";
import { useParams } from "next/navigation";
import BackButton from "@/app/(dashboard)/_components/BackButton";

interface AnswerRow {
  id?: number; // Add an optional id field for existing answers
  number: number;
  answer: string;
  marks: string;
}

const MarkingSchemeForm: React.FC = () => {
  const [rows, setRows] = useState<AnswerRow[]>([
    { number: 1, answer: "", marks: "" },
  ]);
  const [title, setTitle] = useState<string>("");
  const { assignmentId } = useParams();
  const [markingSchemeId, setMarkingSchemeId] = useState<number | null>(null); // Store marking scheme ID if it exists

  // Fetch assignment details and marking scheme
  const fetchMarkingScheme = async () => {
    if (!assignmentId) return;

    try {
      const response = await api.get(
        `/api/assignment/${assignmentId}/marking-scheme/detail/`
      );
      const { id, title, answers } = response.data;

      setMarkingSchemeId(id); // Store marking scheme ID
      setTitle(title);
      if (answers && answers.length > 0) {
        const formattedAnswers = answers.map((answer: any, index: number) => ({
          id: answer.id, // Include answer ID for updates
          number: index + 1,
          answer: answer.answer_text,
          marks: answer.marks.toString(),
        }));
        setRows(formattedAnswers);
      }
    } catch (error: any) {
      if (error.response && error.response.status === 404) {
        console.log("No existing marking scheme found.");
      } else {
        alert("Failed to fetch marking scheme: " + error.message);
      }
    }
  };

  useEffect(() => {
    fetchMarkingScheme();
  }, [assignmentId]);

  // Handle input changes
  const handleChange = (
    index: number,
    field: keyof AnswerRow,
    value: string
  ) => {
    const updatedRows = [...rows];
    updatedRows[index] = {
      ...updatedRows[index],
      [field]: value,
    };
    setRows(updatedRows);
  };

  // Add a new row
  const addRow = (index: number) => {
    const newRow: AnswerRow = {
      id: Date.now(), // Assign a temporary unique ID
      number: rows.length + 1,
      answer: "",
      marks: "",
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
  // Delete a row
  const deleteRow = (index: number) => {
    const updatedRows = rows.filter((_, i) => i !== index);
    const renumberedRows = updatedRows.map((row, i) => ({
      ...row,
      number: i + 1,
    }));
    setRows(renumberedRows);
  };

  // Submit form data
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const markingSchemeData = {
      assignment: assignmentId,
      answers: rows.map((row) => ({
        id: row.id,
        answer_text: row.answer,
        marks: parseInt(row.marks, 10),
      })),
    };

    try {
      if (markingSchemeId) {
        // Update existing marking scheme
        const response = await api.put(
          `/api/assignment/${assignmentId}/marking-scheme/detail/`,
          markingSchemeData
        );
        alert("Marking Scheme updated successfully!");
        console.log("Response:", response.data);
      } else {
        // Create a new marking scheme
        const response = await api.post(
          `/api/assignment/${assignmentId}/marking-scheme/`,
          markingSchemeData
        );
        alert("Marking Scheme created successfully!");
        console.log("Response:", response.data);
      }

      // Reload data
      fetchMarkingScheme();
    } catch (error) {
      console.error("Error submitting marking scheme:", error);
      alert("Failed to submit marking scheme.");
    }
  };

  return (
    <>
      <div className="flex gap-4 items-center m-4">
        <BackButton /> {/* Add the back button here */}
      </div>
      <div className="min-h-screen bg-gradient-to-r p-8 flex flex-col items-center">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-extrabold text-dark-1 ">
            Edit <span className="text-light-2">Marking Scheme</span>
          </h1>
        </div>

        {/* Form */}
        <div className="bg-white shadow-lg rounded-2xl p-8 w-3/4 mx-auto m-2">
          <h2 className="text-2xl font-semibold text-center text-dark-1 mb-6">
            {`Marking Scheme: ${title || "Loading..."}`}
          </h2>

          {rows.map((row, index) => (
            <div
              key={index}
              className="flex justify-center items-center p-4 bg-gray-50 hover:bg-gray-100 rounded-lg shadow-md mb-4 transform transition-transform hover:scale-101"
            >
              <span className="text-lg font-medium text-dark-1">
                {row.number}.
              </span>
              <input
                type="text"
                value={row.answer}
                onChange={(e) => handleChange(index, "answer", e.target.value)}
                placeholder="Enter Answer"
                className="w-80 border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-light-2 placeholder-gray-400 text-sm m-4"
              />
              <input
                type="number"
                value={row.marks}
                onChange={(e) => handleChange(index, "marks", e.target.value)}
                placeholder="Marks"
                className="w-20 border border-gray-300 rounded-md px-2 py-2 focus:outline-none focus:ring-2 focus:ring-light-2 placeholder-gray-400 text-sm m-4 ml-1"
              />
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => addRow(index)}
                  className="bg-light-2 text-white py-2 px-4 rounded-full shadow-md hover:bg-light-1 transition-all duration-300 transform hover:scale-105 text-sm"
                >
                  +
                </button>
                {rows.length > 1 && (
                  <button
                    type="button"
                    onClick={() => deleteRow(index)}
                    className="bg-red-500 text-white py-2 px-4 rounded-full shadow-md hover:bg-red-600 transition-all duration-300 transform hover:scale-105 text-sm"
                  >
                    -
                  </button>
                )}
              </div>
            </div>
          ))}
          <div className="flex justify-end">
            <button
              type="submit"
              onClick={handleSubmit}
              className="flex items-center text-center gap-3 px-6 py-3 bg-light-2 text-white rounded-full shadow-md hover:bg-light-1 transition ease-in-out duration-300 transform hover:scale-105"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default MarkingSchemeForm;
