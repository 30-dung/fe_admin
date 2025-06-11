import axios from "axios";

const instance = axios.create({
  baseURL: "http://localhost:9090/api", // chỉnh baseURL nếu khác
  timeout: 10000,
});

instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default instance;
