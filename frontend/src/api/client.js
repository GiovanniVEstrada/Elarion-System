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
      localStorage.removeItem("token");
      // Store the page they were on so we can redirect back after login
      const attempted = window.location.pathname;
      if (attempted !== "/login" && attempted !== "/register") {
        sessionStorage.setItem("redirectAfterLogin", attempted);
      }
      window.dispatchEvent(new CustomEvent("auth:expired"));
      window.location.href = "/login";
    }

    if (status === 429) {
      window.dispatchEvent(new CustomEvent("api:ratelimit"));
    }

    return Promise.reject(error);
  }
);

export default client;
