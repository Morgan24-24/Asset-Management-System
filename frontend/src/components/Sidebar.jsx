import React from 'react'
import { 
  FaTachometerAlt, 
  FaDesktop, 
  FaWrench, 
  FaFileAlt, 
  FaPlus,
  FaBars,
  FaTimes,
  FaSignOutAlt,
  FaBuilding
} from 'react-icons/fa'
import './Sidebar.css'

// Sidebar component for navigation and user actions
const Sidebar = ({ currentView, setCurrentView, isSidebarOpen, toggleSidebar, onLogout }) => {
  // Define menu items with their icons and labels
  const menuItems = [
    { id: 'dashboard', icon: FaTachometerAlt, label: 'Dashboard' },
    { id: 'assets', icon: FaDesktop, label: 'Assets' },
    { id: 'maintenance', icon: FaWrench, label: 'Maintenance' },
    { id: 'licenses', icon: FaFileAlt, label: 'Licenses' },
    { id: 'departments', icon: FaBuilding, label: 'Departments' },
  ]

  // Handle navigation to different views
  const handleNavigation = (view) => {
    setCurrentView(view)
    // Auto-close sidebar on mobile after navigation
    if (window.innerWidth <= 768) {
      toggleSidebar()
    }
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
            <h2>AssetHub</h2>
          </div>
        </div>
        
        <nav className="sidebar-menu">
          {menuItems.map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              className={`menu-item ${currentView === id ? 'active' : ''}`}
              onClick={() => handleNavigation(id)}
              aria-current={currentView === id ? 'page' : undefined}
            >
              <Icon className="menu-icon" size={18} />
              <span className="menu-text">{label}</span>
              {currentView === id && <span className="active-indicator" />}
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
            <div className="user-avatar">A</div>
            <div className="user-info">
              <span className="user-name">Admin</span>
              <span className="user-status">Online</span>
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