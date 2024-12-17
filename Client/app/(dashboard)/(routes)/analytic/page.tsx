import ProtectedRoute from "@/app/_components/ProtectedRoutes";
import React from "react";

const page = () => {
  return (
    <ProtectedRoute>
      <div className="min-h-screen border-l-2 ml-2 p-6 flex-col justify-center">
        <h1 className="text-3xl font-bold mb-6 text-center text-dark-1">
          Start <strong className="text-light-2">Uploading</strong> your Files
          and <strong className="text-light-2">Grade</strong> it
        </h1>

        <div className="space-y-4">
          <button className="mt-4 px-6 py-2 bg-light-2 hover:bg-light-1 text-white rounded-full">
            Analatics
          </button>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default page;
