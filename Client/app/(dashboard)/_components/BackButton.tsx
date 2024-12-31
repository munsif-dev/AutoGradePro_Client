"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

const BackButton = () => {
  const router = useRouter();

  const handleBackClick = () => {
    router.back(); // Navigate to the previous page
  };

  return (
    <button
      onClick={handleBackClick}
      className="flex items-center gap-2 px-4 py-2 bg-light-2 text-white rounded-full shadow-md hover:bg-light-3 transition ease-in-out duration-300 transform hover:scale-105"
    >
      <ArrowLeft className="w-5 h-5" />
      Back
    </button>
  );
};

export default BackButton;


/*
              <button
                onClick={() => router.back()}
                className="absolute top-0 left-0 mt-4 ml-3 px-4 py-2 bg-light-2 text-white rounded-full shadow-lg hover:bg-light-1 transition flex items-center space-x-2"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                <span>Back</span>
              </button>



                    className="flex items-center gap-2 px-4 py-2 bg-transparent text-light-2 rounded-full shadow-md hover:bg-light-3 transition ease-in-out duration-300 transform hover:scale-105"
    >
*/