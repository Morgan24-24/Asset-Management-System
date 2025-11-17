import React, { useState, useEffect } from 'react'
import { FiX, FiMail, FiBriefcase, FiCalendar, FiUser, FiShield, FiClock, FiActivity } from 'react-icons/fi'
import axiosInstance from '../api/axios'
import './UserDetailDrawer.css'

const UserDetailDrawer = ({ user, isOpen, onClose, onEdit, onDeactivate, onReactivate, onPermanentDelete }) => {
  const [userPermissions, setUserPermissions] = useState([])
  const [userActivity, setUserActivity] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen && user) {
      fetchUserDetails()
    }
  }, [isOpen, user])

 const fetchUserDetails = async () => {
  setLoading(true)
  try {
    // Fetch permissions
    if (user.role !== 'Admin') {
      const permResponse = await axiosInstance.get(`/users/${user.id}/permissions`)
      setUserPermissions(permResponse.data.permissions || [])
    }

    // Fetch recent activity
    try {
      const activityResponse = await axiosInstance.get(`/activities?user_id=${user.id}&limit=5`)
      setUserActivity(activityResponse.data || [])
    } catch (activityErr) {
      console.error('Failed to fetch user activity:', activityErr)
      setUserActivity([])
    }
    
  } catch (err) {
    console.error('Failed to fetch user details:', err)
  } finally {
    setLoading(false)
  }
}

  const getRoleColor = (role) => {
    switch (role) {
      case 'Admin': return '#dc3545'
      case 'Manager': return '#fd7e14'
      case 'Viewer': return '#6c757d'
      default: return '#6c757d'
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getInitials = (email) => {
    return email.substring(0, 2).toUpperCase()
  }

  if (!isOpen || !user) return null

  return (
    <>
      {/* Backdrop */}
      <div className="drawer-backdrop" onClick={onClose} />

      {/* Drawer */}
      <div className={`user-drawer ${isOpen ? 'open' : ''}`}>
        {/* Header */}
        <div className="drawer-header">
          <button className="drawer-close" onClick={onClose}>
            <FiX size={24} />
          </button>
        </div>

        {/* User Profile Section */}
<div className="drawer-profile">
  <div 
    className="drawer-avatar"
    style={{ 
      background: user.is_active ? getRoleColor(user.role) : '#6c757d',
      opacity: user.is_active ? 1 : 0.6
    }}
  >
    {getInitials(user.email)}
  </div>
  
  <h2 className="drawer-email">{user.email}</h2>
  
  {user.display_name && (
    <p className="drawer-display-name">{user.display_name}</p>
  )}

  <div className="drawer-role-info">
      
    {!user.is_active && (
      <span className="drawer-inactive-tag">• Deactivated</span>
    )}
  </div>
</div>

        {/* Details Section */}
        <div className="drawer-content">
          {loading ? (
            <div className="drawer-loading">Loading details...</div>
          ) : (
            <>
              {/* User Information */}
              <div className="drawer-section">
                <h3 className="drawer-section-title">
                  <FiUser size={18} />
                  User Information
                </h3>
                <div className="drawer-info-grid">
                  <div className="drawer-info-item">
                    <FiBriefcase size={16} />
                    <div>
                      <span className="drawer-info-label">Company</span>
                      <span className="drawer-info-value">{user.company}</span>
                    </div>
                  </div>

                  <div className="drawer-info-item">
                    <FiCalendar size={16} />
                    <div>
                      <span className="drawer-info-label">Joined</span>
                      <span className="drawer-info-value">{formatDate(user.created_at)}</span>
                    </div>
                  </div>

                  <div className="drawer-info-item">
                    <FiUser size={16} />
                    <div>
                      <span className="drawer-info-label">User ID</span>
                      <span className="drawer-info-value">#{user.id}</span>
                    </div>
                  </div>

                  {/* Add more fields as they become available */}
                  {/* <div className="drawer-info-item">
                    <FiClock size={16} />
                    <div>
                      <span className="drawer-info-label">Last Login</span>
                      <span className="drawer-info-value">{formatDate(user.last_login)}</span>
                    </div>
                  </div> */}
                </div>
              </div>

              {/* Permissions Section */}
              {user.role === 'Admin' ? (
                <div className="drawer-section">
                  <h3 className="drawer-section-title">
                    <FiShield size={18} />
                    Permissions
                  </h3>
                  <div className="drawer-admin-note">
                    <FiShield size={20} />
                    <div>
                      <strong>Admin Access</strong>
                      <p>This user has full administrative privileges and access to all system features.</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="drawer-section">
                  <h3 className="drawer-section-title">
                    <FiShield size={18} />
                    Permissions ({userPermissions.length})
                  </h3>
                  {userPermissions.length > 0 ? (
                    <div className="drawer-permissions-list">
                      {userPermissions.slice(0, 8).map((perm) => (
                        <div key={perm.id} className="drawer-permission-item">
                          ✓ {perm.description || perm.name}
                        </div>
                      ))}
                      {userPermissions.length > 8 && (
                        <div className="drawer-permission-more">
                          +{userPermissions.length - 8} more permissions
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="drawer-empty-state">No permissions assigned</p>
                  )}
                </div>
              )}

              {/* Recent Activity Section */}
<div className="drawer-section">
  <h3 className="drawer-section-title">
    <FiActivity size={18} />
    Recent Activity
  </h3>
  {userActivity.length > 0 ? (
    <div className="drawer-activity-list">
      {userActivity.map((activity) => (
        <div key={activity.id} className="drawer-activity-item">
          <div className="drawer-activity-dot" />
          <div>
            <p className="drawer-activity-description">
              <strong>{activity.action_type}</strong> - {activity.description}
            </p>
            <span className="drawer-activity-time">
              {activity.timestamp_formatted || formatDate(activity.timestamp)}
            </span>
          </div>
        </div>
      ))}
    </div>
  ) : (
    <p className="drawer-empty-state">No recent activity</p>
  )}
</div>
            </>
          )}
        </div>

        {/* Actions Section */}
        <div className="drawer-actions">
          <h3 className="drawer-actions-title">Actions</h3>
          
          <button 
            className="drawer-action-btn edit"
            onClick={() => {
              onEdit(user)
              onClose()
            }}
          >
             Edit User
          </button>

          <button 
            className="drawer-action-btn reset"
            onClick={() => {
              alert('Reset password feature coming soon!')
              // TODO: Implement reset password
            }}
          >
             Reset Password
          </button>

          {user.is_active ? (
            <button 
              className="drawer-action-btn deactivate"
              onClick={() => {
                onDeactivate(user.id, user.email)
                onClose()
              }}
            >
               Deactivate User
            </button>
          ) : (
            <>
              <button 
                className="drawer-action-btn reactivate"
                onClick={() => {
                  onReactivate(user.id, user.email)
                  onClose()
                }}
              >
                 Reactivate User
              </button>

              <button 
                className="drawer-action-btn delete"
                onClick={() => {
                  onPermanentDelete(user.id, user.email)
                  onClose()
                }}
              >
                 Permanently Delete
              </button>
            </>
          )}
        </div>
      </div>
    </>
  )
}

export default UserDetailDrawer