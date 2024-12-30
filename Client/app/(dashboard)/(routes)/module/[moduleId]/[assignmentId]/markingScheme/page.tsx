"use client";
import React, { useState, useEffect } from "react";
import api from "@/lib/api";
import { useParams } from "next/navigation";
import BackButton from "@/app/(dashboard)/_components/BackButton";

interface AnswerRow {
  id?: number;
  number: number;
  answer: string;
  marks: string;
  caseSensitive: boolean;
  orderSensitive: boolean;
  gradingType:
    | "single-word"
    | "short-phrase"
    | "unordered-list"
    | "ordered-list"
    | "numeric";
}

const MarkingSchemeForm: React.FC = () => {
  const [rows, setRows] = useState<AnswerRow[]>([
    {
      number: 1,
      answer: "",
      marks: "",
      caseSensitive: false,
      orderSensitive: false,
      gradingType: "single-word",
    },
  ]);
  const [title, setTitle] = useState<string>("");
  const { assignmentId } = useParams();
  const [markingSchemeId, setMarkingSchemeId] = useState<number | null>(null);

  const fetchMarkingScheme = async () => {
    if (!assignmentId) return;

    try {
      const response = await api.get(
        `/api/assignment/${assignmentId}/marking-scheme/detail/`
      );
      const { id, title, answers } = response.data;

      setMarkingSchemeId(id);
      setTitle(title);
      if (answers && answers.length > 0) {
        const formattedAnswers = answers.map((answer: any, index: number) => ({
          id: answer.id,
          number: index + 1,
          answer: answer.answer_text,
          marks: answer.marks.toString(),
          caseSensitive: answer.case_sensitive || false,
          orderSensitive: answer.order_sensitive || false,
          gradingType: answer.grading_type || "single-word",
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

  const handleChange = (index: number, field: keyof AnswerRow, value: any) => {
    const updatedRows = [...rows];
    updatedRows[index] = {
      ...updatedRows[index],
      [field]: value,
    };
    setRows(updatedRows);
  };

  const addRow = (index: number) => {
    const newRow: AnswerRow = {
      id: Date.now(),
      number: rows.length + 1,
      answer: "",
      marks: "",
      caseSensitive: false,
      orderSensitive: false,
      gradingType: "single-word",
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
      answers: rows.map((row) => ({
        id: row.id,
        answer_text: row.answer,
        marks: parseInt(row.marks, 10),
        case_sensitive: row.caseSensitive,
        order_sensitive: row.orderSensitive,
        grading_type: row.gradingType,
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
    <>
      <div className="flex gap-4 items-center m-4">
        <BackButton />
      </div>
      <div className="min-h-screen bg-gradient-to-r p-8 flex flex-col items-center">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-extrabold text-dark-1 ">
            Edit <span className="text-light-2">Marking Scheme</span>
          </h1>
        </div>
        <div className="bg-white shadow-lg rounded-2xl p-8 w-3/4 mx-auto m-2">
          <h2 className="text-2xl font-semibold text-center text-dark-1 mb-6">
            {`Marking Scheme: ${title || "Loading..."}`}
          </h2>
          {rows.map((row, index) => (
            <div
              key={index}
              className="flex flex-col p-4 bg-gray-50 hover:bg-gray-100 rounded-lg shadow-md mb-4"
            >
              <div className="flex justify-between items-center mb-2">
                <span className="text-lg font-medium text-dark-1">
                  {row.number}.
                </span>
                <button
                  type="button"
                  onClick={() => deleteRow(index)}
                  className="bg-red-500 text-white py-1 px-2 rounded shadow-md hover:bg-red-600 transition-all"
                >
                  Delete
                </button>
              </div>
              <input
                type="text"
                value={row.answer}
                onChange={(e) => handleChange(index, "answer", e.target.value)}
                placeholder="Enter Answer"
                className="w-full border border-gray-300 rounded-md px-4 py-2 mb-2"
              />
              <input
                type="number"
                value={row.marks}
                onChange={(e) => handleChange(index, "marks", e.target.value)}
                placeholder="Marks"
                className="w-1/3 border border-gray-300 rounded-md px-4 py-2 mb-2"
              />
              <div className="flex space-x-4 mb-2">
                <label>
                  <input
                    type="checkbox"
                    checked={row.caseSensitive}
                    onChange={(e) =>
                      handleChange(index, "caseSensitive", e.target.checked)
                    }
                  />{" "}
                  Case Sensitive
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={row.orderSensitive}
                    onChange={(e) =>
                      handleChange(index, "orderSensitive", e.target.checked)
                    }
                  />{" "}
                  Order Sensitive
                </label>
              </div>
              <select
                value={row.gradingType}
                onChange={(e) =>
                  handleChange(index, "gradingType", e.target.value)
                }
                className="border border-gray-300 rounded-md px-4 py-2"
              >
                <option value="single-word">Single Word</option>
                <option value="short-phrase">Short Phrase</option>
                <option value="unordered-list">Unordered List</option>
                <option value="ordered-list">Ordered List</option>
                <option value="numeric">Numeric</option>
              </select>
            </div>
          ))}
          <button
            type="button"
            onClick={() => addRow(rows.length - 1)}
            className="bg-light-2 text-white py-2 px-4 rounded-full shadow-md hover:bg-light-1 transition-all"
          >
            Add Row
          </button>
          <div className="flex justify-end mt-4">
            <button
              type="submit"
              onClick={handleSubmit}
              className="px-6 py-3 bg-light-2 text-white rounded-full shadow-md hover:bg-light-1 transition-all"
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
