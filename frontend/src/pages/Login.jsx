import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const API_BASE = 'http://127.0.0.1:8000';

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const formData = new URLSearchParams();
      formData.append('username', email);
      formData.append('password', password);

      const response = await axios.post(`${API_BASE}/login`, formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      localStorage.setItem("token", response.data.access_token);
      
      // Fetch user info to store role/company
      const userResponse = await axios.get(`${API_BASE}/users/me`, {
        headers: {
          'Authorization': `Bearer ${response.data.access_token}`
        }
      });
      
      localStorage.setItem("user", JSON.stringify(userResponse.data));
      
      console.log("Login successful!");
      navigate("/dashboard");

    } catch (err) {
      console.error("Login error:", err);
      setError(err.response?.data?.detail || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="logo">
            <svg width="40" height="40" viewBox="0 0 32 32" fill="none">
              <rect width="32" height="32" rx="8" fill="#4361ee"/>
              <path d="M16 8L8 12v8c0 5 3.5 7 8 7s8-2 8-7v-8l-8-4z" fill="white"/>
              <circle cx="16" cy="16" r="3" fill="#4361ee"/>
            </svg>
            <h1>AssetHub</h1>
          </div>
          <p className="login-subtitle">IT Asset Management System</p>
        </div>
        
        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="login-form">
          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary btn-block"
          >
            {loading ? "Signing In..." : "Sign In"}
          </button>
        </form>

        <div className="login-footer">
          <p className="text-muted text-center">
            Contact your administrator for access credentials
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;