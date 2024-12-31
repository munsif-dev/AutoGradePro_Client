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
      className="flex items-center gap-2 px-4 py-2 bg-transparent text-light-2 rounded-full shadow-md hover:bg-light-3 transition ease-in-out duration-300 transform hover:scale-105"
    >
      <ArrowLeft className="w-5 h-5" />
      Back
    </button>
  );
};

export default BackButton;
