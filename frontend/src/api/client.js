import axios from "axios";

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// Attach token to every request
client.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

client.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;

    if (status === 401) {
      const attempted = window.location.pathname;
      const onAuthPage = attempted === "/login" || attempted === "/register";
      // Only redirect + toast when a protected request expires, not when login itself fails
      if (!onAuthPage) {
        localStorage.removeItem("token");
        sessionStorage.setItem("redirectAfterLogin", attempted);
        window.dispatchEvent(new CustomEvent("auth:expired"));
        window.location.href = "/login";
      }
    }

    if (status === 429) {
      window.dispatchEvent(new CustomEvent("api:ratelimit"));
    }

    return Promise.reject(error);
  }
);

export default client;
