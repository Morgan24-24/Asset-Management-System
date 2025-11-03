import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

// Base URL for API calls
const API_BASE = 'http://127.0.0.1:8000';

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

   // Handle login form submission
  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Send as form data (OAuth2PasswordRequestForm expects this)
      const formData = new URLSearchParams();
      formData.append('username', email); // OAuth2 uses 'username' field
      formData.append('password', password);

      // Call the /login endpoint (not /auth/login)
      const response = await axios.post(`${API_BASE}/login`, formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      // Store the token in localStorage
      localStorage.setItem("token", response.data.access_token);
      
      console.log("Login successful!");
      // Send user to the dashboard
      navigate("/dashboard"); 

    } catch (err) {
      console.error("Login error:", err);
      setError(err.response?.data?.detail || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <form
        onSubmit={handleLogin}
        className="p-8 bg-white shadow-lg rounded-2xl w-96"
      >
        <h2 className="mb-6 text-2xl font-bold text-center">AssetHub</h2>
        
        {error && (
          <div className="px-4 py-3 mb-4 text-red-700 bg-red-100 border border-red-400 rounded">
            {error}
          </div>
        )}

        <input
          type="email"
          placeholder="Email"
          className="w-full p-3 mb-4 border rounded"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          className="w-full p-3 mb-6 border rounded"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full p-3 text-white bg-blue-600 rounded hover:bg-blue-700 disabled:bg-blue-400"
        >
          {loading ? "Logging in..." : "Login"}
        </button>
        <p className="mt-4 text-sm text-center">
          Don't have an account?{" "}
          <Link to="/signup" className="text-blue-600 hover:underline">
            Sign up
          </Link>
        </p>
      </form>
    </div>
  );
}

export default Login;