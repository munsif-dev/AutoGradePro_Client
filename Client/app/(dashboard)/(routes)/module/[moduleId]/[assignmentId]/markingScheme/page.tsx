"use client";
import React, { useState } from "react";

interface AnswerRow {
  number: number;
  answer: string;
  marks: string;
}

const MarkingSchemeForm: React.FC = () => {
  const [rows, setRows] = useState<AnswerRow[]>([
    { number: 1, answer: "", marks: "" },
  ]);

  // Handle input changes
  const handleChange = (
    index: number,
    field: keyof AnswerRow,
    value: string
  ) => {
    const updatedRows = [...rows];
    updatedRows[index] = {
      ...updatedRows[index],
      [field]: value, // Use computed property to ensure type safety
    };
    setRows(updatedRows);
  };

  // Add a new row
  const addRow = () => {
    setRows([...rows, { number: rows.length + 1, answer: "", marks: "" }]);
  };

  // Delete a row and renumber subsequent rows
  const deleteRow = (index: number) => {
    const updatedRows = rows.filter((_, i) => i !== index);
    const renumberedRows = updatedRows.map((row, i) => ({
      ...row,
      number: i + 1,
    }));
    setRows(renumberedRows);
  };

  // Submit form data
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Marking Scheme Submitted:", rows);
    // Submit the `rows` data to your API here
  };

  return (
    <div className="min-h-screen flex flex-col items-center   p-8">
      <h2 className="text-3xl font-semibold text-blue-600 mb-8 text-center">
        Create Marking Scheme
      </h2>
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-4xl bg-white shadow-lg rounded-lg p-8"
      >
        {rows.map((row, index) => (
          <div
            key={index}
            className="grid grid-cols-5 gap-6 items-center mb-6 bg-gray-100 p-4 rounded-lg shadow-sm"
          >
            <span className="text-center text-gray-700 font-medium">
              {row.number}.
            </span>
            <input
              type="text"
              value={row.answer}
              onChange={(e) => handleChange(index, "answer", e.target.value)}
              placeholder="Enter Answer"
              className="col-span-2 border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder-gray-400 text-sm"
            />
            <input
              type="number"
              value={row.marks}
              onChange={(e) => handleChange(index, "marks", e.target.value)}
              placeholder="Marks"
              className="border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder-gray-400 text-sm"
            />
            <div className="flex justify-center space-x-2">
              <button
                type="button"
                onClick={addRow}
                className="bg-green-500 text-white rounded-md px-3 py-2 hover:bg-green-600 transition duration-300 text-sm"
              >
                +
              </button>
              {rows.length > 1 && (
                <button
                  type="button"
                  onClick={() => deleteRow(index)}
                  className="bg-red-500 text-white rounded-md px-3 py-2 hover:bg-red-600 transition duration-300 text-sm"
                >
                  -
                </button>
              )}
            </div>
          </div>
        ))}
        <div className="flex justify-end mt-8">
          <button
            type="submit"
            className="bg-blue-600 text-white font-semibold rounded-md px-8 py-3 hover:bg-blue-700 transition duration-300 text-lg"
          >
            Submit
          </button>
        </div>
      </form>
    </div>
  );
};

export default MarkingSchemeForm;
