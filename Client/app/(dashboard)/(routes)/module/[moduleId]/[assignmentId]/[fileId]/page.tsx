"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import api from "@/lib/api";
import ProtectedRoute from "@/app/_components/ProtectedRoutes";
import BackButton from "@/app/(dashboard)/_components/BackButton";
import { CheckCircleIcon, XCircleIcon } from "@heroicons/react/20/solid"; // Import Heroicons

const FileDetailPage = () => {
  const { moduleId, assignmentId, fileId } = useParams();

  const [fileData, setFileData] = useState<any>(null);

  useEffect(() => {
    fetchFileDetails();
  }, [fileId]);

  const fetchFileDetails = () => {
    if (!fileId || !assignmentId) return;

    api
      .get(`/api/assignment/${assignmentId}/${fileId}/detail/`)
      .then((res) => {
        setFileData(res.data);
      })
      .catch((err) => alert("Failed to fetch file details: " + err));
  };

  return (
    <ProtectedRoute>
      <div className="flex gap-4 items-center m-4 mb-0">
        <BackButton />
      </div>
      <div className="min-h-screen p-6">
        {fileData ? (
          <>
            <h1 className="text-4xl font-bold text-dark-1 mb-4">File Detail</h1>

            {/* File Info */}
            <div className="bg-white shadow rounded-lg p-6 mb-6">
              <h2 className="text-2xl font-semibold mb-4">
                File: {fileData.file_name}
              </h2>
              <a
                href={fileData.file}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline mb-4 inline-block"
              >
                View the submitted file
              </a>
            </div>

            {/* Table for Marking Scheme and Answers */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-4">
                Marking Scheme & Answers
              </h3>

              <table className="min-w-full table-auto divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      No
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Correct Answer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Student's Answer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Marks for Answer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Allocated Marks
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {fileData.answers.map((answer: any, index: number) => {
                    const markingScheme =
                      fileData.marking_scheme[answer.question_id];
                    const marksForAnswer = answer.marks_for_answer || 0;
                    const allocatedMarks = markingScheme.marks;

                    return (
                      <tr key={answer.question_id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {answer.question_id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {markingScheme.answer_text}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {answer.student_answer}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">
                          <span
                            className={`inline-flex items-center ${
                              marksForAnswer > 0
                                ? "text-green-500"
                                : "text-red-500"
                            }`}
                          >
                            {marksForAnswer > 0 ? (
                              <CheckCircleIcon className="h-5 w-5 mr-2" />
                            ) : (
                              <XCircleIcon className="h-5 w-5 mr-2" />
                            )}
                            {marksForAnswer > 0 ? marksForAnswer : "0"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {allocatedMarks}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Total Score */}
            <div className="mt-6 bg-white shadow rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-4">Total Score</h3>
              <p className="text-lg text-gray-800">
                {fileData.score !== undefined
                  ? fileData.score
                  : "This submission has not been graded yet."}
              </p>
            </div>
          </>
        ) : (
          <p>Loading file details...</p>
        )}
      </div>
    </ProtectedRoute>
  );
};

export default FileDetailPage;
