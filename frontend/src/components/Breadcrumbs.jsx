import React from 'react'
import { FiHome, FiChevronRight } from 'react-icons/fi'
import './Breadcrumbs.css'

const Breadcrumbs = ({ currentView, user }) => {
  // Define breadcrumb paths for each view
  const getBreadcrumbs = () => {
    const breadcrumbs = [
      { label: 'Home', view: 'dashboard', icon: FiHome }
    ]

    switch (currentView) {
      case 'dashboard':
        return breadcrumbs
      
      case 'assets':
        breadcrumbs.push({ label: 'Assets', view: 'assets' })
        return breadcrumbs
      
      case 'create':
        breadcrumbs.push({ label: 'Assets', view: 'assets' })
        breadcrumbs.push({ label: 'New Asset', view: 'create' })
        return breadcrumbs
      
      case 'maintenance':
        breadcrumbs.push({ label: 'Maintenance', view: 'maintenance' })
        return breadcrumbs
      
      case 'licenses':
        breadcrumbs.push({ label: 'Licenses', view: 'licenses' })
        return breadcrumbs
      
      case 'departments':
        breadcrumbs.push({ label: 'Departments', view: 'departments' })
        return breadcrumbs
      
      case 'users':
        breadcrumbs.push({ label: 'User Management', view: 'users' })
        return breadcrumbs
      
      case 'activity-logs':
        breadcrumbs.push({ label: 'Activity Logs', view: 'activity-logs' })
        return breadcrumbs
      
      case 'reports':
        breadcrumbs.push({ label: 'Reports', view: 'reports' })
        return breadcrumbs
      
      case 'settings':
        breadcrumbs.push({ label: 'Settings', view: 'settings' })
        return breadcrumbs
      
      default:
        return breadcrumbs
    }
  }

  const breadcrumbs = getBreadcrumbs()

  // Don't show breadcrumbs on dashboard
  if (currentView === 'dashboard') {
    return null
  }

  return (
    <div className="breadcrumbs">
      {breadcrumbs.map((crumb, index) => (
        <React.Fragment key={crumb.view}>
          {index > 0 && (
            <FiChevronRight className="breadcrumb-separator" size={14} />
          )}
          <span 
            className={`breadcrumb-item ${index === breadcrumbs.length - 1 ? 'active' : ''}`}
          >
            {crumb.icon && <crumb.icon size={14} className="breadcrumb-icon" />}
            {crumb.label}
          </span>
        </React.Fragment>
      ))}
    </div>
  )
}

export default Breadcrumbs