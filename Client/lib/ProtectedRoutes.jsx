import { useRouter } from "next/router"; // Import useRouter from Next.js for navigation
import { jwtDecode } from "jwt-decode"; // JWT decode to check token expiration
import api from "./api"; // Assuming api.js is your axios instance
import { REFRESH_TOKEN, ACCESS_TOKEN } from "../constants"; // Import constants for tokens
import { useState, useEffect } from "react";

function ProtectedRoute({ children }) {
  const [isAuthorized, setIsAuthorized] = useState(null); // State to track authorization status
  const router = useRouter(); // Next.js router for navigation

  // This will run when the component is mounted
  useEffect(() => {
    auth().catch(() => setIsAuthorized(false));
  }, []);

  // Refresh token logic
  const refreshToken = async () => {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN); // Get the refresh token from localStorage
    try {
      const res = await api.post("/api/token/refresh/", {
        refresh: refreshToken,
      });
      if (res.status === 200) {
        // If refresh token is valid, update the access token
        localStorage.setItem(ACCESS_TOKEN, res.data.access);
        setIsAuthorized(true);
      } else {
        setIsAuthorized(false);
      }
    } catch (error) {
      console.log(error);
      setIsAuthorized(false);
    }
  };

  // Check if the current access token is valid
  const auth = async () => {
    const token = localStorage.getItem(ACCESS_TOKEN);
    if (!token) {
      setIsAuthorized(false); // If no access token, redirect to login
      return;
    }

    const decoded = jwtDecode(token); // Decode the JWT to check the expiration
    const tokenExpiration = decoded.exp;
    const now = Date.now() / 1000; // Get the current time in seconds

    if (tokenExpiration < now) {
      await refreshToken(); // If the token is expired, refresh it
    } else {
      setIsAuthorized(true); // If token is valid, grant access
    }
  };

  // Show loading indicator while checking authentication
  if (isAuthorized === null) {
    return <div>Loading...</div>;
  }

  // If authorized, render the children (protected content), otherwise redirect to login
  return isAuthorized ? children : router.push("/login");
}

export default ProtectedRoute;
