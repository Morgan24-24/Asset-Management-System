import React from 'react'
import { 
  FaTachometerAlt, 
  FaDesktop, 
  FaWrench, 
  FaFileAlt, 
  FaBars,
  FaTimes,
  FaSignOutAlt,
  FaBuilding,
  FaUsers,
  FaChartBar,
  FaUserCircle
} from 'react-icons/fa'
import './Sidebar.css'

// Sidebar component for navigation and user actions
const Sidebar = ({ 
  currentView, 
  setCurrentView, 
  isSidebarOpen, 
  toggleSidebar, 
  onLogout,
  menuItems = [],
  user 
}) => {
  // Default menu items with role-based access
  const defaultMenuItems = [
    { id: 'dashboard', icon: FaTachometerAlt, label: 'Dashboard', roles: ['Admin', 'Manager', 'Viewer'] },
    { id: 'assets', icon: FaDesktop, label: 'Assets', roles: ['Admin', 'Manager', 'Viewer'] },
    { id: 'maintenance', icon: FaWrench, label: 'Maintenance', roles: ['Admin', 'Manager'] },
    { id: 'licenses', icon: FaFileAlt, label: 'Licenses', roles: ['Admin', 'Manager', 'Viewer'] },
    { id: 'departments', icon: FaBuilding, label: 'Departments', roles: ['Admin', 'Manager', 'Viewer'] },
    { id: 'users', icon: FaUsers, label: 'User Management', roles: ['Admin'] },
    { id: 'reports', icon: FaChartBar, label: 'Reports', roles: ['Admin', 'Manager'] },
  ]

  // Use provided menuItems or default, filtered by user role
  const effectiveMenuItems = menuItems.length > 0 ? menuItems : 
    defaultMenuItems.filter(item => user ? item.roles.includes(user.role) : false)

  // Handle navigation to different views
  const handleNavigation = (view) => {
    setCurrentView(view)
    // Auto-close sidebar on mobile after navigation
    if (window.innerWidth <= 768) {
      toggleSidebar()
    }
  }

  // Get user role color
  const getRoleColor = (role) => {
    switch (role) {
      case 'Admin': return '#dc3545'
      case 'Manager': return '#fd7e14'
      case 'Viewer': return '#6c757d'
      default: return '#6c757d'
    }
  }

  // Get user initials for avatar
  const getUserInitials = (email) => {
    if (!email) return 'U'
    return email.charAt(0).toUpperCase()
  }

  // Get user display name
  const getUserDisplayName = (email) => {
    if (!email) return 'User'
    return email.split('@')[0]
  }

  return (
    <>
      {/* Hamburger Menu Button - Outside sidebar */}
      <button 
        className="hamburger-menu"
        onClick={toggleSidebar}
        aria-label={isSidebarOpen ? 'Close menu' : 'Open menu'}
      >
        {isSidebarOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
      </button>

      {/* Sidebar */}
      <div className={`sidebar ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="logo-icon">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <rect width="32" height="32" rx="8" fill="#4361ee"/>
                <path d="M16 8L8 12v8c0 5 3.5 7 8 7s8-2 8-7v-8l-8-4z" fill="white"/>
                <circle cx="16" cy="16" r="3" fill="#4361ee"/>
              </svg>
            </div>
            <div>
              <h2>AssetHub</h2>
              <p style={{ 
                fontSize: '0.75rem', 
                color: 'rgba(255,255,255,0.7)', 
                margin: 0,
                marginTop: '2px'
              }}>
                Asset Management
              </p>
            </div>
          </div>
        </div>
        
        <nav className="sidebar-menu">
          {effectiveMenuItems.map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              className={`menu-item ${currentView === id ? 'active' : ''}`}
              onClick={() => handleNavigation(id)}
              aria-current={currentView === id ? 'page' : undefined}
            >
              <Icon className="menu-icon" size={18} />
              <span className="menu-text">{label}</span>
              {currentView === id && <span className="active-indicator" />}
              
              {/* Role badges for admin-only features */}
              {id === 'users' && (
                <span className="role-badge" style={{
                  background: '#dc3545',
                  color: 'white',
                  fontSize: '10px',
                  padding: '2px 6px',
                  borderRadius: '8px',
                  marginLeft: 'auto',
                  fontWeight: 'bold'
                }}>
                  Admin
                </span>
              )}
              
              {(id === 'reports' || id === 'maintenance') && user?.role === 'Manager' && (
                <span className="role-badge" style={{
                  background: '#fd7e14',
                  color: 'white',
                  fontSize: '10px',
                  padding: '2px 6px',
                  borderRadius: '8px',
                  marginLeft: 'auto',
                  fontWeight: 'bold'
                }}>
                  Manager
                </span>
              )}
            </button>
          ))}
          
          {/* Sign Out Button - Separate */}
          <button
            className="menu-item logout-item"
            onClick={onLogout}
          >
            <FaSignOutAlt className="menu-icon" size={18} />
            <span className="menu-text">Sign Out</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <div className="user-badge">
            <div 
              className="user-avatar"
              style={{ 
                background: user ? getRoleColor(user.role) : '#4361ee',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                fontSize: '1rem'
              }}
            >
              {user ? getUserInitials(user.email) : 'U'}
            </div>
            <div className="user-info">
              <span className="user-name">
                {user ? getUserDisplayName(user.email) : 'User'}
              </span>
              <span className="user-status">
                <span style={{
                  background: user ? getRoleColor(user.role) : '#28a745',
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  display: 'inline-block',
                  marginRight: '5px'
                }}></span>
                {user ? user.role : 'User'}
                {user?.company && (
                  <div style={{
                    fontSize: '0.7rem',
                    color: 'rgba(255,255,255,0.6)',
                    marginTop: '2px'
                  }}>
                    {user.company}
                  </div>
                )}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Overlay for mobile when sidebar is open */}
      {isSidebarOpen && (
        <div className="sidebar-overlay" onClick={toggleSidebar} />
      )}
    </>
  )
}

export default Sidebar