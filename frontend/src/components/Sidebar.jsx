import React, { useState, useEffect } from 'react'
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
  FaUserCircle,
  FaHistory,
  FaCog
} from 'react-icons/fa'
import './Sidebar.css'
import { getDisplayName, getUserInitials } from '../utils/helpers'

const Sidebar = ({ 
  currentView, 
  setCurrentView, 
  onLogout,
  user 
}) => {
  // Get initial collapsed state from localStorage (default: collapsed on desktop)
  const getInitialCollapsedState = () => {
    const saved = localStorage.getItem('sidebarCollapsed')
    if (saved !== null) {
      return saved === 'true'
    }
    // Default: collapsed on desktop, hidden on mobile
    return window.innerWidth > 768
  }

  const [isCollapsed, setIsCollapsed] = useState(getInitialCollapsedState())
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [hoveredItem, setHoveredItem] = useState(null)

  // Default menu items with role-based access
  const defaultMenuItems = [
    { id: 'dashboard', icon: FaTachometerAlt, label: 'Dashboard', roles: ['Admin', 'Manager', 'Viewer'] },
    { id: 'assets', icon: FaDesktop, label: 'Assets', roles: ['Admin', 'Manager', 'Viewer'] },
    { id: 'maintenance', icon: FaWrench, label: 'Maintenance', roles: ['Admin', 'Manager'] },
    { id: 'licenses', icon: FaFileAlt, label: 'Licenses', roles: ['Admin', 'Manager', 'Viewer'] },
    { id: 'departments', icon: FaBuilding, label: 'Departments', roles: ['Admin', 'Manager', 'Viewer'] },
    { id: 'users', icon: FaUsers, label: 'User Management', roles: ['Admin'] },
    { id: 'activity-logs', icon: FaHistory, label: 'Activity Logs', roles: ['Admin', 'Manager'] },
    { id: 'reports', icon: FaChartBar, label: 'Reports', roles: ['Admin', 'Manager'] },
    { id: 'settings', icon: FaCog, label: 'Settings', roles: ['Admin', 'Manager', 'Viewer'] },
  ]

  const menuItems = defaultMenuItems.filter(item => 
    user ? item.roles.includes(user.role) : false
  )

  // Save collapsed state to localStorage
  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', isCollapsed.toString())
  }, [isCollapsed])

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 768) {
        setIsMobileOpen(false)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Toggle sidebar
  const toggleSidebar = () => {
    if (window.innerWidth <= 768) {
      // Mobile: toggle overlay
      setIsMobileOpen(!isMobileOpen)
    } else {
      // Desktop: toggle collapsed
      setIsCollapsed(!isCollapsed)
    }
  }

  // Handle navigation
  const handleNavigation = (view) => {
    setCurrentView(view)
    // Auto-close on mobile
    if (window.innerWidth <= 768) {
      setIsMobileOpen(false)
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

  const isMobile = window.innerWidth <= 768
  const sidebarClass = isMobile 
    ? `sidebar sidebar-mobile ${isMobileOpen ? 'mobile-open' : ''}`
    : `sidebar ${isCollapsed ? 'sidebar-collapsed' : 'sidebar-expanded'}`

  return (
    <>
      {/* Mobile Hamburger Button (floating in main content) */}
      {isMobile && (
        <button 
          className="mobile-hamburger"
          onClick={toggleSidebar}
          aria-label="Toggle menu"
        >
          <FaBars size={24} />
        </button>
      )}

      {/* Sidebar */}
      <div className={sidebarClass}>
       
        {/* Header with Hamburger */}
        <div className="sidebar-header">
          {(!isCollapsed || isMobile) && (
            <div className="sidebar-logo">
              <div className="logo-icon">
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                  <rect width="32" height="32" rx="8" fill="#4361ee"/>
                  <path d="M16 8L8 12v8c0 5 3.5 7 8 7s8-2 8-7v-8l-8-4z" fill="white"/>
                  <circle cx="16" cy="16" r="3" fill="#4361ee"/>
                </svg>
              </div>
              <div className="logo-text">
                <h2>AssetHub</h2>
                <p>Asset Management</p>
              </div>
            </div>
          )}

          <button 
            className="sidebar-toggle"
            onClick={toggleSidebar}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isMobile ? <FaTimes size={20} /> : <FaBars size={20} />}
          </button>
        </div>
        
        {/* Menu Items */}
        <nav className="sidebar-menu">
          {menuItems.map(({ id, icon: Icon, label }) => (
            <div 
              key={id}
              className="menu-item-wrapper"
              onMouseEnter={() => setHoveredItem(id)}
              onMouseLeave={() => setHoveredItem(null)}
            >
              <button
                className={`menu-item ${currentView === id ? 'active' : ''}`}
                onClick={() => handleNavigation(id)}
                aria-current={currentView === id ? 'page' : undefined}
              >
                <Icon className="menu-icon" size={20} />
                {(!isCollapsed || isMobile) && (
                  <span className="menu-text">{label}</span>
                )}
                {currentView === id && <span className="active-indicator" />}
              </button>

              {/* Tooltip for collapsed state */}
              {isCollapsed && !isMobile && hoveredItem === id && (
                <div className="menu-tooltip">{label}</div>
              )}
            </div>
          ))}

          {/* Spacer to push logout to bottom */}
          <div className="menu-spacer"></div>
          
          {/* Sign Out Button */}
          <div 
            className="menu-item-wrapper"
            onMouseEnter={() => setHoveredItem('logout')}
            onMouseLeave={() => setHoveredItem(null)}
          >
            <button
              className="menu-item logout-item"
              onClick={onLogout}
            >
              <FaSignOutAlt className="menu-icon" size={20} />
              {(!isCollapsed || isMobile) && (
                <span className="menu-text">Sign Out</span>
              )}
            </button>

            {/* Tooltip for logout */}
            {isCollapsed && !isMobile && hoveredItem === 'logout' && (
              <div className="menu-tooltip">Sign Out</div>
            )}
          </div>
        </nav>

        {/* User Info Footer */}
        <div className="sidebar-footer">
          <div className="user-badge">
            <div 
              className="user-avatar"
              style={{ 
                background: user?.avatar_url ? 'transparent' : (user ? getRoleColor(user.role) : '#4361ee'),
                overflow: 'hidden'
              }}
            >
              {user?.avatar_url ? (
                <img 
                  src={`http://localhost:8000/${user.avatar_url}`} 
                  alt={getDisplayName(user)}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                />
              ) : (
                user ? getUserInitials(user) : 'U'
              )}
            </div>
            
            {(!isCollapsed || isMobile) && (
              <div className="user-info">
                <span className="user-name">
                  {user ? getDisplayName(user) : 'User'}
                </span>
                <span 
                  className="user-role-badge" 
                  style={{
                    background: user ? getRoleColor(user.role) : '#6c757d',
                  }}
                >
                  {user ? user.role : 'User'}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Overlay */}
      {isMobile && isMobileOpen && (
        <div className="sidebar-overlay" onClick={toggleSidebar} />
      )}
    </>
  )
}

export default Sidebar