import React from "react";
import { useRouter } from "next/router";

const registerandLogout = () => {
  localStorage.clear();
  const router = useRouter();

  return router.push("/regiter");
};

export default registerandLogout;
