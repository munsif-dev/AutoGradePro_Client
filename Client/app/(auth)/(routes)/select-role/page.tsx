"use client";
import { useState } from "react";
import { db } from "@/app/(auth)/(routes)/_components/firebaseConfig";
import { doc, updateDoc } from "firebase/firestore";
import { auth } from "@/app/(auth)/(routes)/_components/firebaseConfig";

export default function SelectRole() {
  const [role, setRole] = useState("student");
  const [University, setUniversity] = useState("");
  const [level, setLevel] = useState("");
  const isLecturer = role === "lecturer";

  const handleRoleSubmit = async () => {
    const user = auth.currentUser;
    if (user) {
      await updateDoc(doc(db, "users", user.uid), {
        role,
        University: isLecturer ? University : null,
        level: isLecturer ? level : null,
        isRolePending: false,
      });
      alert("Role and details updated successfully");
      window.location.href = "/grading";
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center items-center">
      <div className="max-w-md w-full bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4 text-center">
          Select Your Role
        </h2>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="w-full px-4 py-2 border rounded-lg mb-4"
        >
          <option value="student">Student</option>
          <option value="lecturer">Lecturer</option>
        </select>
        {isLecturer && (
          <>
            <input
              type="text"
              placeholder="Working University"
              value={University}
              onChange={(e) => setUniversity(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg mb-4"
            />
            <input
              type="text"
              placeholder="Higher Studies Level"
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg mb-4"
            />
          </>
        )}
        <button
          onClick={handleRoleSubmit}
          className="w-full bg-blue-500 text-white py-2 rounded-lg"
        >
          Submit
        </button>
      </div>
    </div>
  );
}
