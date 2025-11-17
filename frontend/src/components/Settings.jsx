import React, { useState, useEffect } from 'react'
import axiosInstance from '../api/axios'
import { FiUser, FiLock, FiCamera, FiX, FiShield, FiBriefcase, FiMail, FiCalendar } from 'react-icons/fi'
import './Settings.css'

const Settings = ({ user, onUserUpdate }) => {  // ← Added onUserUpdate prop
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [showPermissions, setShowPermissions] = useState(false)
  const [showAvatarModal, setShowAvatarModal] = useState(false)
  
  // Password change state
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  })
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    setLoading(true)
    try {
      const response = await axiosInstance.get('/users/me/profile')
      setProfile(response.data)

      if (response.data.avatar_url) {
        setAvatarPreview(`http://localhost:8000/${response.data.avatar_url}`)
      }
    } catch (err) {
      console.error('Failed to fetch profile:', err)
      alert('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  const handleAvatarUpload = async (e) => {
  const file = e.target.files[0]
  if (!file) return

  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    alert('Please upload a valid image (JPEG, PNG, or WebP)')
    return
  }

  // Validate file size (5MB)
  if (file.size > 5 * 1024 * 1024) {
    alert('Image must be less than 5MB')
    return
  }

  setUploadingAvatar(true)
  const formData = new FormData()
  formData.append('file', file)

  try {
    const response = await axiosInstance.post('/users/me/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    
    console.log('Upload response:', response.data) // 🔍 DEBUG
    
    setAvatarPreview(`http://localhost:8000/${response.data.avatar_url}`)
    alert('Profile picture updated successfully!')
    
    // ✅ Refresh user data to update sidebar
    console.log('Calling onUserUpdate...') // 🔍 DEBUG
    if (onUserUpdate) {
      await onUserUpdate()
      console.log('onUserUpdate completed') // 🔍 DEBUG
    } else {
      console.error('onUserUpdate is not defined!') // 🔍 DEBUG
    }
    
    fetchProfile()
  } catch (err) {
    console.error('Upload failed:', err)
    alert(err.response?.data?.detail || 'Failed to upload image')
  } finally {
    setUploadingAvatar(false)
  }
}

  const handleRemoveAvatar = async () => {
    if (!window.confirm('Remove your profile picture?')) return

    try {
      await axiosInstance.delete('/users/me/avatar')
      setAvatarPreview(null)
      alert('Profile picture removed')
      
      // ✅ Refresh user data to update sidebar
      if (onUserUpdate) {
        await onUserUpdate()
      }
      
      fetchProfile()
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to remove picture')
    }
  }

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    setPasswordError('')
    setPasswordSuccess('')

    // Validate
    if (passwordData.new_password.length < 6) {
      setPasswordError('New password must be at least 6 characters')
      return
    }

    if (passwordData.new_password !== passwordData.confirm_password) {
      setPasswordError('New passwords do not match')
      return
    }

    try {
      await axiosInstance.patch('/users/me/password', passwordData)
      setPasswordSuccess('Password changed successfully!')
      setPasswordData({
        current_password: '',
        new_password: '',
        confirm_password: ''
      })
      
      setTimeout(() => setPasswordSuccess(''), 3000)
    } catch (err) {
      setPasswordError(err.response?.data?.detail || 'Failed to change password')
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

  const getInitials = (email) => {
    if (!email) return 'U'
    return email.substring(0, 2).toUpperCase()
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric'
    })
  }

  if (loading) {
    return <div className="loading">Loading settings...</div>
  }

  if (!profile) {
    return <div className="loading">Failed to load profile</div>
  }

  return (
    <div className="settings-container">
      <div className="header">
        <h1>Settings</h1>
      </div>

      {/* Profile Picture Section */}
      <div className="settings-card">
        <div className="settings-card-header">
          <h2><FiCamera size={20} /> Profile Picture</h2>
        </div>
        <div className="settings-card-body">

<div className="avatar-section">
  <div 
    className="avatar-preview clickable"
    onClick={() => avatarPreview && setShowAvatarModal(true)}
    style={{ cursor: avatarPreview ? 'pointer' : 'default' }}
  >
    {avatarPreview ? (
      <img src={avatarPreview} alt="Profile" />
    ) : (
      <div 
        className="avatar-placeholder"
        style={{ background: getRoleColor(profile.role) }}
      >
        {getInitials(profile.email)}
      </div>
    )}
    {avatarPreview && (
      <div className="avatar-view-hint">
        <FiCamera size={16} />
        <span>Click to view</span>
      </div>
    )}
  </div>
  
  <div className="avatar-actions">
    <input
      type="file"
      id="avatar-upload"
      accept="image/jpeg,image/jpg,image/png,image/webp"
      onChange={handleAvatarUpload}
      style={{ display: 'none' }}
    />
    <label htmlFor="avatar-upload" className="btn btn-primary">
      {uploadingAvatar ? 'Uploading...' : '📸 Upload Photo'}
    </label>
    
    {avatarPreview && (
      <button 
        className="btn btn-outline"
        onClick={handleRemoveAvatar}
      >
        <FiX size={16} /> Remove
      </button>
    )}
  </div>
  
  <p className="avatar-hint">
    Maximum size: 5MB • Formats: JPEG, PNG, WebP • Will be resized to 200x200
  </p>
</div>

{/* Avatar Viewer Modal */}
{showAvatarModal && avatarPreview && (
  <div className="avatar-modal" onClick={() => setShowAvatarModal(false)}>
    <button 
      className="avatar-modal-close"
      onClick={() => setShowAvatarModal(false)}
    >
      <FiX size={24} />
    </button>
    <div className="avatar-modal-content" onClick={(e) => e.stopPropagation()}>
      <div className="avatar-modal-image">
        <img src={avatarPreview} alt="Profile Picture" />
      </div>
      <div className="avatar-modal-info">
        <strong>{profile.display_name || profile.email}</strong>
        <span className="role-badge" style={{
          backgroundColor: getRoleColor(profile.role) + '20',
          color: getRoleColor(profile.role),
          padding: '6px 12px',
          borderRadius: '4px',
          fontSize: '0.9rem'
        }}>
          {profile.role}
        </span>
      </div>
    </div>
  </div>
)}
        </div>
      </div>

      {/* Account Information Section */}
      <div className="settings-card">
        <div className="settings-card-header">
          <h2><FiUser size={20} /> Account Information</h2>
        </div>
        <div className="settings-card-body">
          <div className="info-grid">
            <div className="info-item">
              <label><FiMail size={16} /> Email</label>
              <input 
                type="text" 
                value={profile.email} 
                disabled 
                className="disabled-input"
              />
              <small>Email cannot be changed</small>
            </div>

            <div className="info-item">
              <label><FiUser size={16} /> Display Name</label>
              <input 
                type="text" 
                value={profile.display_name || 'Not set'} 
                disabled 
                className="disabled-input"
              />
            </div>

            <div className="info-item">
              <label><FiBriefcase size={16} /> Company</label>
              <input 
                type="text" 
                value={profile.company} 
                disabled 
                className="disabled-input"
              />
            </div>

            <div className="info-item">
              <label><FiShield size={16} /> Role</label>
              <div className="role-display">
                <span 
                  className="role-badge-large"
                  style={{
                    backgroundColor: getRoleColor(profile.role) + '20',
                    color: getRoleColor(profile.role)
                  }}
                >
                  <FiShield size={16} />
                  {profile.role}
                </span>
              </div>
            </div>

            <div className="info-item">
              <label><FiCalendar size={16} /> Member Since</label>
              <input 
                type="text" 
                value={formatDate(profile.created_at)} 
                disabled 
                className="disabled-input"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Permissions Section */}
      {profile.role !== 'Admin' && (
        <div className="settings-card">
          <div className="settings-card-header">
            <h2><FiShield size={20} /> My Permissions ({profile.permissions.length})</h2>
            <button 
              className="btn btn-sm btn-outline"
              onClick={() => setShowPermissions(!showPermissions)}
            >
              {showPermissions ? 'Hide' : 'Show All'}
            </button>
          </div>
          <div className="settings-card-body">
            {showPermissions ? (
              <div className="permissions-list">
                {profile.permissions.map((perm) => (
                  <div key={perm.id} className="permission-item">
                    <span className="permission-icon">✓</span>
                    <div>
                      <strong>{perm.description}</strong>
                      <small>{perm.category}</small>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="permissions-summary">
                You have {profile.permissions.length} permissions. 
                Click "Show All" to view details.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Admin Permissions Note */}
      {profile.role === 'Admin' && (
        <div className="settings-card admin-note">
          <div className="settings-card-header">
            <h2><FiShield size={20} /> Permissions</h2>
          </div>
          <div className="settings-card-body">
            <div className="admin-badge">
              <FiShield size={32} />
              <div>
                <strong>Full Administrative Access</strong>
                <p>As an admin, you have unrestricted access to all system features and capabilities.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Change Password Section */}
      <div className="settings-card">
        <div className="settings-card-header">
          <h2><FiLock size={20} /> Change Password</h2>
        </div>
        <div className="settings-card-body">
          <form onSubmit={handlePasswordChange} className="password-form">
            <div className="form-group">
              <label>Current Password</label>
              <input
                type="password"
                value={passwordData.current_password}
                onChange={(e) => setPasswordData({...passwordData, current_password: e.target.value})}
                required
                placeholder="Enter current password"
              />
            </div>

            <div className="form-group">
              <label>New Password</label>
              <input
                type="password"
                value={passwordData.new_password}
                onChange={(e) => setPasswordData({...passwordData, new_password: e.target.value})}
                required
                minLength={6}
                placeholder="Enter new password (min 6 characters)"
              />
            </div>

            <div className="form-group">
              <label>Confirm New Password</label>
              <input
                type="password"
                value={passwordData.confirm_password}
                onChange={(e) => setPasswordData({...passwordData, confirm_password: e.target.value})}
                required
                placeholder="Confirm new password"
              />
            </div>

            {passwordError && (
              <div className="alert alert-danger">{passwordError}</div>
            )}

            {passwordSuccess && (
              <div className="alert alert-success">{passwordSuccess}</div>
            )}

            <button type="submit" className="btn btn-primary">
              Update Password
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Settings