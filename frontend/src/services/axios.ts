import axios from "axios";

export const AxiosInstance = axios.create({
  baseURL: "http://localhost:3001/api/v1/",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Important: sends httpOnly cookies with requests
});

// request interceptor to add access token
AxiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      AxiosInstance.defaults.headers.common[
        "Authorization"
      ] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// response interceptor to handle token refresh
AxiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // if 401 error and not already retried and not a refresh token request
    if (
      error.response &&
      error.response.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("/refresh-token")
    ) {
      originalRequest._retry = true;

      // attempt to refresh token
      try {
        // No need to send refresh token - it's in the httpOnly cookie
        const res = await axios.post(
          "http://localhost:3001/api/v1/auth/refresh-token",
          {}, // Empty body since refresh token is in cookie
          {
            headers: {
              "Content-Type": "application/json",
            },
            withCredentials: true, // Send cookies with refresh request
          }
        );

        const { accessToken } = res.data.data;

        // update local storage and Axios headers (only access token)
        localStorage.setItem("accessToken", accessToken);

        // update authorization header for the original request
        originalRequest.headers["Authorization"] = `Bearer ${accessToken}`;

        // send the original request again
        return AxiosInstance(originalRequest);
      } catch (refreshError) {
        // refresh failed, redirect to login
        console.error("Token refresh failed:", refreshError);

        // clear access token (refresh token will be cleared by server)
        localStorage.removeItem("accessToken");
        // No need to remove refreshToken since it's in httpOnly cookie

        // Only redirect if not already on auth pages
        if (
          !window.location.pathname.includes("/login") &&
          !window.location.pathname.includes("/register")
        ) {
          window.location.href = "/login";
        }

        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  }
);
