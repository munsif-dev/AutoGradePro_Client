import React from "react";


const Demo = () => {
  // Extract video ID from the new YouTube URL
  const videoId = "btPEU1jxKIc";
  
  return (
    <div className="w-full flex justify-center items-center p-10">
      <div className="relative w-[900px] h-[506px]">
        <iframe
          src={`https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0`}
          title="AutoGrade Pro Demo Video"
          className="absolute top-0 left-0 w-full h-full"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    </div>
  );
};

export default Demo;

