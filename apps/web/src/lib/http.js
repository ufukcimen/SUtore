import axios from "axios";

const defaultApiBaseUrl =
  import.meta.env.DEV
    ? "/api/v1"
    : typeof window === "undefined"
      ? "http://localhost:8000/api/v1"
      : `${window.location.protocol}//${window.location.hostname}:8000/api/v1`;

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? defaultApiBaseUrl,
  withCredentials: true,
  timeout: 10000,
});

