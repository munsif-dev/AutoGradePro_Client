import axios from "axios"; //Axios simplifies making requests, handling responses, and managing errors.
import { ACCESS_TOKEN } from "./constant";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_DJANGO_API_URL,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(ACCESS_TOKEN);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
