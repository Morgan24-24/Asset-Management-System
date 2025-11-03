import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

// Your backend API URL
const API_BASE = 'http://127.0.0.1:8000';

function Signup() {
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("Viewer"); // Default role
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  // State for loading and errors
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  
   // React Router navigation hook
  const navigate = useNavigate();

   // Handle signup form submission
  const handleSignup = async (e) => {
    e.preventDefault();
    setError(null); // Clear previous errors
    setLoading(true);

    const signupData = {
      company,
      role,
      email,
      password,
    };

    try {
      // Send signup details to the backend (changed from /auth/signup to /signup)
      const response = await axios.post(`${API_BASE}/signup`, signupData);
      
      console.log("Signup successful:", response.data);
      
      // On success, navigate to the login page
      alert("Account created successfully! Please login.");
      navigate("/");

    } catch (err) {
      console.error("Signup error:", err);
      // Show error from backend if available
      if (err.response && err.response.data) {
        setError(err.response.data.detail);
      } else {
        setError("Signup failed. Please try again.");
      }
    } finally {
      setLoading(false); // Stop loading
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <form
        onSubmit={handleSignup}
        className="p-8 bg-white shadow-lg rounded-2xl w-96"
      >
        <h2 className="mb-6 text-2xl font-bold text-center">AssetHub Sign Up</h2>
        
        {/* Show error message if 'error' is set */}
        {error && (
          <div className="px-4 py-3 mb-4 text-red-700 bg-red-100 border border-red-400 rounded">
            {error}
          </div>
        )}

        <input
          type="text"
          placeholder="Company Name"
          className="w-full p-3 mb-4 border rounded"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          required
        />

        <select
          className="w-full p-3 mb-4 border rounded"
          value={role}
          onChange={(e) => setRole(e.target.value)}
        >
          <option>Admin</option>
          <option>Technician</option>
          <option>Viewer</option>
        </select>

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
          className="w-full p-3 text-white bg-green-600 rounded hover:bg-green-700 disabled:bg-green-400"
        >
          {loading ? "Signing up..." : "Sign Up"}
        </button>

        <p className="mt-4 text-sm text-center">
          Already have an account?{" "}
          <Link to="/" className="text-blue-600 hover:underline">
            Login
          </Link>
        </p>
      </form>
    </div>
  );
}

export default Signup;