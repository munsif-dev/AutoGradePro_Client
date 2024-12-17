"user client";
import React from "react";

export const FilePreview = ({ file, removeFile }) => {
  // Only render the component if the file exists
  if (!file) return null;

  return (
    <div>
      <div
        className="flex items-center gap-2 
      justify-between mt-5 border rounded-md p-2 border-light-1 w-[30%]"
      >
        <div className="flex items-center p-2">
          <div className="text-left">
            <h2>{file.name}</h2>
            <h2 className="text-[12px] text-light-2">
              {file.type}/{(file.size / 1024 / 1024).toFixed(2)}MB
            </h2>
          </div>
        </div>
        <X
          className="w-4 h-4 text-red-500 cursor-pointer"
          onClick={() => removeFile(file)}
        />
      </div>
    </div>
  );
};
