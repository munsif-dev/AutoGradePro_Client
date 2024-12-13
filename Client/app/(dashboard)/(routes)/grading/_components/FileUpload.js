"use client";
import React from "react";
import { FilePreview } from "./FilePreview";
import axios from "axios";

const assignmentId = 1; // Replace with actual assignment ID
const studentId = 1; // Replace with actual student ID

const FileUpload = () => {
  const [file, setFile] = React.useState(null);
  const [uploading, setUploading] = React.useState(false);

  const onFileSelect = (file) => {
    if (file && file.size > 6000000) {
      alert("File size is too large");
      return;
    }

    setFile(file);
    console.log("file: ", file);
  };

  const uploadFile = async () => {
    if (!file) {
      alert("Please select a file to upload.");

      return;
    }

    setUploading(true);
    const formData = new FormData();

    // Assuming you have `assignmentId` and `studentId` values to pass
    formData.append("assignment", assignmentId); // Replace with actual assignment ID
    formData.append("student", studentId); // Replace with actual student ID
    formData.append("submission_file", file);

    try {
      const response = await axios.post(
        "http://127.0.0.1:8000/api/submissions/create/",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      alert("File uploaded successfully!");
    } catch (error) {
      console.error("Upload error:", error.response?.data || error.message);
      alert("File upload failed.");
    } finally {
      setUploading(false);
      setFile(null);
    }
  };

  return (
    <div className="text-center">
      <div className="flex-col justify-center space-y-2 w-full bg-transparent">
        <label
          htmlFor="dropzone-file"
          className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-purple-50 hover:bg-purple-200"
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            {/* SVG icon */}
            <p className="mb-2 text-sm text-gray-500">
              <span className="font-semibold">Click to upload</span> or drag and
              drop
            </p>
            <p className="text-xs text-gray-500">
              SVG, PNG, JPG or GIF (MAX 6MB)
            </p>
          </div>
          <input
            id="dropzone-file"
            type="file"
            className="hidden"
            onChange={(event) => onFileSelect(event.target.files[0])}
          />
        </label>
        <div className="w-full flex space-x-2 justify-center items-center">
          <button
            onClick={uploadFile}
            disabled={!file || uploading}
            className="px-4 py-2 mt-4 text-sm text-center font-medium bg-light-2 hover:bg-light-1 text-white rounded-full disabled:bg-gray-600"
          >
            {uploading ? "Uploading..." : "Upload"}
          </button>
          <div className="w-full">
            <FilePreview file={file} removeFile={() => setFile(null)} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileUpload;
