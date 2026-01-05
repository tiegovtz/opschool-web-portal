import axios from "axios";
import { Config } from "../constants/config";
import { useAuthStore } from "../stores/auth";

const axiosInstance = axios.create({
  baseURL: Config.BASE_URL,
});

const excludedEndpoints = ["/login"];

axiosInstance.interceptors.request.use(
  (config) => {
    const authStore = useAuthStore();
    const token =
      authStore.token ||
      (process.client ? localStorage.getItem("auth_token") : null);

    const isExcluded = excludedEndpoints.some((endpoint) =>
      config.url?.endsWith(endpoint)
    );

    if (!isExcluded && token) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${token}`,
      };
    }

    return config;
  },
  (error) => Promise.reject(error)
);

export default axiosInstance;
