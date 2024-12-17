"use client";
import { useRouter } from "next/navigation";

const Logout = () => {
  const router = useRouter();
  localStorage.clear();
  return router.push("/sign-in");
};

export default Logout;
