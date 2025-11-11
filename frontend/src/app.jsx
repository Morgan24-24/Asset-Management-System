import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import axiosInstance from './api/axios'
import Dashboard from './components/Dashboard'
import AssetList from './components/AssetList'
import AssetForm from './components/AssetForm'
import Maintenance from './components/Maintenance'
import SoftwareLicenses from './components/SoftwareLicenses'
import Sidebar from './components/Sidebar'
import Login from "./pages/Login"
import UsersManagement from './components/UsersManagement'
import Reports from './components/Reports'
import Department from './pages/Departments'
import ActivityLogs from './pages/ActivityLogs'

// Protected Route Component - checks for authentication token
function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');
  
  if (!token) {
    return <Navigate to="/" replace />;
  }
  
  return children;
}

// Main application component that contains all the business logic
function MainApp() {
  const [assets, setAssets] = useState([])
  const [maintenance, setMaintenance] = useState([])
  const [licenses, setLicenses] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [user, setUser] = useState(null)
  
  const location = useLocation()
  const navigate = useNavigate()

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen)
  }

  // Get current view from URL path
  const getCurrentView = () => {
    const path = location.pathname
    if (path === '/dashboard') return 'dashboard'
    if (path === '/assets') return 'assets'
    if (path === '/assets/create') return 'create'
    if (path === '/maintenance') return 'maintenance'
    if (path === '/licenses') return 'licenses'
    if (path === '/departments') return 'departments'
    if (path === '/users') return 'users'
    if (path === '/activity-logs') return 'activity-logs'
    if (path === '/reports') return 'reports'
    return 'dashboard'
  }

  const currentView = getCurrentView()

  // Navigation function
  const navigateTo = (view) => {
    const routes = {
      dashboard: '/dashboard',
      assets: '/assets',
      create: '/assets/create',
      maintenance: '/maintenance',
      licenses: '/licenses',
      departments: '/departments',
      users: '/users',
      'activity-logs': '/activity-logs',
      reports: '/reports'
    }
    navigate(routes[view] || '/dashboard')
  }

  // Fetch current user info from API
  const fetchUser = async () => {
    try {
      const response = await axiosInstance.get('/users/me') 
      setUser(response.data)
    } catch (err) {
      console.error('Error fetching user:', err)
    }
  }

  // Fetch all assets from API
  const fetchAssets = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await axiosInstance.get('/assets')
      setAssets(response.data)
    } catch (err) {
      setError('Failed to fetch assets')
      console.error('Error fetching assets:', err)
    } finally {
      setLoading(false)
    }
  }

  // Fetch all maintenance records from API
  const fetchMaintenance = async () => {
    try {
      const response = await axiosInstance.get('/maintenance')
      setMaintenance(response.data)
    } catch (err) {
      console.error('Error fetching maintenance:', err)
    }
  }

  // Fetch all software licenses from API
  const fetchLicenses = async () => {
    try {
      const response = await axiosInstance.get('/licenses')
      setLicenses(response.data)
    } catch (err) {
      console.error('Error fetching licenses:', err)
    }
  }

  // Fetch all data
  const fetchAllData = async () => {
    await fetchAssets()
    await fetchMaintenance()
    await fetchLicenses()
  }

  // Fetch initial data when component mounts
  useEffect(() => {
    fetchUser()
    fetchAllData()
  }, [])

  // Handle creating a new asset
  const handleCreateAsset = async (assetData) => {
    try {
      setError('')
      await axiosInstance.post('/assets', assetData)
      await fetchAssets()
      navigateTo('assets')
      alert('Asset created successfully!')
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create asset')
    }
  }

  // Handle transferring an asset (REPLACED DELETE)
  const handleTransferAsset = async (assetId, transferData) => {
    try {
      setError('')
      await axiosInstance.post(`/assets/${assetId}/assign`, transferData)
      await fetchAssets()
      
      // Get the assigned user info for notification
      const assignedUser = await axiosInstance.get(`/admin/users/${transferData.assigned_to_id}`)
      
      alert(`Asset transferred successfully to ${assignedUser.data.email}! Notification has been sent.`)
      return true
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to transfer asset')
      return false
    }
  }

  // Handle retiring an asset (soft delete for auditing)
  const handleRetireAsset = async (assetId) => {
    if (!window.confirm('Are you sure you want to retire this asset? This action cannot be undone.')) {
      return
    }

    try {
      setError('')
      await axiosInstance.patch(`/assets/${assetId}`, {
        status: 'Retired',
        assignee_id: null
      })
      await fetchAssets()
      alert('Asset retired successfully! It has been removed from active inventory but preserved for auditing.')
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to retire asset')
    }
  }

  // Handle returning an asset to available pool
  const handleReturnAsset = async (assetId) => {
    try {
      setError('')
      await axiosInstance.post(`/assets/${assetId}/return`)
      await fetchAssets()
      alert('Asset returned successfully! It is now available for reassignment.')
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to return asset')
    }
  }

  // Handle adding a new maintenance record
  const handleAddMaintenance = async (maintenanceData) => {
    try {
      setError('')
      await axiosInstance.post('/maintenance', maintenanceData)
      await fetchMaintenance()
      await fetchAssets() // Refresh assets to update status if needed
      alert('Maintenance record added successfully!')
      return true
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to add maintenance record')
      return false
    }
  }

  // Handle adding a new software license
  const handleAddLicense = async (licenseData) => {
    try {
      setError('')
      await axiosInstance.post('/licenses', licenseData)
      await fetchLicenses()
      alert('Software license added successfully!')
      return true
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to add license')
      return false
    }
  }

  // Handle user logout with confirmation
const handleLogout = async () => {
  if (window.confirm('Are you sure you want to logout?')) {
    // Log the logout activity BEFORE removing token
    try {
      await axiosInstance.post('/logout')
    } catch (err) {
      console.error('Failed to log logout activity:', err)
    }
    
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    window.location.href = '/'
  }
}

  // Check if user has permission for specific actions
  const hasPermission = (requiredRole) => {
    if (!user) return false
    const roleHierarchy = { 'Viewer': 1, 'Manager': 2, 'Admin': 3 }
    return roleHierarchy[user.role] >= roleHierarchy[requiredRole]
  }

  return (
    <div className="app-container">
      {/* Sidebar */}
      <Sidebar 
        currentView={currentView} 
        setCurrentView={navigateTo}
        isSidebarOpen={isSidebarOpen}
        toggleSidebar={toggleSidebar}
        onLogout={handleLogout}
        user={user}
      />

      {/* Main Content */}
      <div className={`main-content ${isSidebarOpen ? 'sidebar-open' : ''}`}>
        {error && (
          <div className="alert alert-danger">
            {error}
            <button 
              onClick={() => setError('')}
              style={{ float: 'right', background: 'none', border: 'none', fontSize: '18px' }}
            >
              ×
            </button>
          </div>
        )}

        {/* Header ONLY for dashboard */}
{currentView === 'dashboard' && (
  <div className="header">
    <div>
      <h1>AssetHub - IT Asset Management</h1>
      <p style={{ color: '#6c757d', margin: 0 }}>
        Dashboard • {user?.company}
      </p>
    </div>
    <div className="user-info">
      <span>Welcome, {user?.email || 'User'}</span>
      <span className="user-role" style={{
        background: user?.role === 'Admin' ? '#dc3545' : 
                    user?.role === 'Manager' ? '#fd7e14' : '#6c757d',
        color: 'white',
        padding: '2px 8px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: '600'
      }}>
        {user?.role || 'User'}
      </span>
    </div>
  </div>
)}

        {/* Role-based access control for views */}
        {currentView === 'dashboard' && (
          <Dashboard 
            assets={assets}
            maintenance={maintenance}
            licenses={licenses}
            onNavigate={navigateTo}
            user={user}
          />
        )}

        {currentView === 'assets' && hasPermission('Viewer') && (
          <AssetList 
            assets={assets}
            loading={loading}
            onRefresh={fetchAssets}
            onNewAssetClick={() => navigateTo('create')}
            onTransferAsset={handleTransferAsset}
            onRetireAsset={handleRetireAsset}
            onReturnAsset={handleReturnAsset}
            user={user}
          />
        )}

        {currentView === 'maintenance' && hasPermission('Manager') && (
          <Maintenance 
            assets={assets}
            maintenance={maintenance}
            onAddMaintenance={handleAddMaintenance}
            onRefresh={() => {
              fetchMaintenance()
              fetchAssets()
            }}
            user={user}
          />
        )}

        {currentView === 'licenses' && hasPermission('Viewer') && (
          <SoftwareLicenses 
            licenses={licenses}
            onAddLicense={handleAddLicense}
            onRefresh={fetchLicenses}
            user={user}
          />
        )}

        {currentView === 'create' && hasPermission('Manager') && (
          <AssetForm 
            onSubmit={handleCreateAsset}
            onCancel={() => navigateTo('assets')}
            user={user}
          />
        )}

        {currentView === 'departments' && hasPermission('Viewer') && (
          <Department 
            user={user}
          />
        )}

        {currentView === 'users' && hasPermission('Admin') && (
          <UsersManagement 
            user={user}
          />
        )}

        {currentView === 'activity-logs' && hasPermission('Manager') && (
          <ActivityLogs 
            user={user}
          />
       )}

        {currentView === 'reports' && hasPermission('Manager') && (
          <Reports 
            user={user}
          />
        )}

        {/* Access denied messages */}
        {currentView === 'users' && !hasPermission('Admin') && (
          <div className="alert alert-danger">
            <h3>Access Denied</h3>
            <p>You need Admin privileges to access User Management.</p>
          </div>
        )}

        {currentView === 'reports' && !hasPermission('Manager') && (
          <div className="alert alert-danger">
            <h3>Access Denied</h3>
            <p>You need Manager or Admin privileges to access Reports.</p>
          </div>
        )}

        {currentView === 'activity-logs' && !hasPermission('Manager') && (
          <div className="alert alert-danger">
            <h3>Access Denied</h3>
            <p>You need Manager or Admin privileges to access Activity Logs.</p>
         </div>
        )}

        {currentView === 'maintenance' && !hasPermission('Manager') && (
          <div className="alert alert-danger">
            <h3>Access Denied</h3>
            <p>You need Manager or Admin privileges to access Maintenance.</p>
          </div>
        )}
      </div>
    </div>
  )
}

// Main App Router
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        {/* Signup route removed - only admin can create users */}
        
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <MainApp />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/assets" 
          element={
            <ProtectedRoute>
              <MainApp />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/assets/create" 
          element={
            <ProtectedRoute>
              <MainApp />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/maintenance" 
          element={
            <ProtectedRoute>
              <MainApp />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/licenses" 
          element={
            <ProtectedRoute>
              <MainApp />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/departments" 
          element={
            <ProtectedRoute>
              <MainApp />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/users" 
          element={
            <ProtectedRoute>
              <MainApp />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/activity-logs" 
          element={
            <ProtectedRoute>
              <MainApp />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/reports" 
          element={
            <ProtectedRoute>
              <MainApp />
            </ProtectedRoute>
          } 
        />
        
        {/* Redirect any unknown routes to dashboard */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  )
}

export default App