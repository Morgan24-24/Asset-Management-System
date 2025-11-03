import axios from 'axios';

// Define the base URL for all API requests - points to local Django server
const API_BASE = 'http://127.0.0.1:8000';

// Create a configured axios instance with the base URL
const axiosInstance = axios.create({
  baseURL: API_BASE,
});

// Add token to all requests
// This interceptor runs before every request is sent
axiosInstance.interceptors.request.use(
  (config) => {
    // Retrieve the authentication token from localStorage
    const token = localStorage.getItem('token');
    // Log whether a token is being sent (for debugging)
    console.log('🔑 Token being sent:', token ? 'Yes' : 'No');
    // If a token exists, add it to the Authorization header
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Return the modified config to continue the request
    return config;
  },
  (error) => {
    // If there's an error in the request interceptor, reject the promise
    return Promise.reject(error);
  }
);

// Handle 401 errors (redirect to login)
// This interceptor runs after every response is received
axiosInstance.interceptors.response.use(
  (response) => response, // If response is successful, simply return it
  (error) => {
    // Check if the error response status is 401 (Unauthorized)
    if (error.response?.status === 401) {
      // Remove the invalid token from localStorage
      localStorage.removeItem('token');
      // Redirect user to login page
      window.location.href = '/';
    }
    // Reject the promise with the error for further handling
    return Promise.reject(error);
  }
);

// Export the configured axios instance for use in other files
export default axiosInstance;
// Export the API_BASE constant for use in other files
export { API_BASE };