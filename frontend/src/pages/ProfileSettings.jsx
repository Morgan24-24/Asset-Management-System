import React, { useState } from 'react'
import axiosInstance from '../api/axios'
import { FiUser, FiSave } from 'react-icons/fi'

const ProfileSettings = ({ user, onUserUpdate }) => {
  const [displayName, setDisplayName] = useState(user?.display_name || '')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleSave = async () => {
    setLoading(true)
    setMessage('')
    
    try {
      await axiosInstance.patch(`/admin/users/${user.id}`, {
        display_name: displayName
      })
      
      setMessage('Display name updated successfully!')
      
      // Update user in parent component
      if (onUserUpdate) {
        onUserUpdate({ ...user, display_name: displayName })
      }
    } catch (err) {
      setMessage(err.response?.data?.detail || 'Failed to update display name')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="header">
        <h1>Profile Settings</h1>
      </div>

      <div className="card">
        <div className="card-header">
          <h3><FiUser size={20} /> Personal Information</h3>
        </div>
        <div className="card-body">
          <div className="form-group">
            <label>Email</label>
            <input
              type="text"
              className="form-control"
              value={user?.email || ''}
              disabled
              style={{ backgroundColor: '#f5f5f5' }}
            />
            <small style={{ color: '#6c757d' }}>Email cannot be changed</small>
          </div>

          <div className="form-group">
            <label>Display Name</label>
            <input
              type="text"
              className="form-control"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g., Lloyd Junior, Mark Amoani"
            />
            <small style={{ color: '#6c757d' }}>
              This is how your name will appear throughout the system
            </small>
          </div>

          <div className="form-group">
            <label>Role</label>
            <input
              type="text"
              className="form-control"
              value={user?.role || ''}
              disabled
              style={{ backgroundColor: '#f5f5f5' }}
            />
          </div>

          {message && (
            <div className={`alert ${message.includes('success') ? 'alert-success' : 'alert-danger'}`}>
              {message}
            </div>
          )}

          <button
            className="btn btn-success"
            onClick={handleSave}
            disabled={loading}
          >
            <FiSave size={18} /> {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ProfileSettings