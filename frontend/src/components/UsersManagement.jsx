import React, { useState, useEffect } from 'react'
import axiosInstance from '../api/axios'
import { FiPlus, FiEdit2, FiTrash2, FiUser, FiMail, FiBriefcase, FiShield } from 'react-icons/fi'
import PermissionsCheckbox from './PermissionsCheckbox'

const UsersManagement = () => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [formData, setFormData] = useState({
    email: '',
    company: '',
    role: 'Viewer',
    password: ''
  })
  const [selectedPermissions, setSelectedPermissions] = useState([])
  const [currentUser] = useState({ role: 'Admin' }) // Assuming current user is admin

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const response = await axiosInstance.get('/admin/users')
      setUsers(response.data)
    } catch (err) {
      console.error('Failed to fetch users:', err)
      alert('Failed to fetch users. Admin access required.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingUser) {
        // Update user (without password)
        const { password, ...updateData } = formData
        await axiosInstance.patch(`/admin/users/${editingUser.id}`, updateData)
        
        // Update permissions if they changed
        if (currentUser.role === 'Admin' && formData.role !== 'Admin') {
          await axiosInstance.post(`/users/${editingUser.id}/permissions/bulk`, selectedPermissions)
        }
        
        alert('User updated successfully!')
      } else {
        // Create new user
        const userResponse = await axiosInstance.post('/admin/users', formData)
        
        // Assign permissions for non-admin users
        if (currentUser.role === 'Admin' && formData.role !== 'Admin' && selectedPermissions.length > 0) {
          await axiosInstance.post(`/users/${userResponse.data.id}/permissions/bulk`, selectedPermissions)
        }
        
        alert('User created successfully!')
      }
      
      // Reset form
      setFormData({ email: '', company: '', role: 'Viewer', password: '' })
      setSelectedPermissions([])
      setEditingUser(null)
      setShowForm(false)
      fetchUsers()
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to save user')
    }
  }

  const handleEdit = (user) => {
    setEditingUser(user)
    setFormData({
      email: user.email,
      company: user.company,
      role: user.role,
      password: '' // Don't show existing password
    })
    
    // Fetch existing permissions for the user
    if (currentUser.role === 'Admin' && user.role !== 'Admin') {
      fetchUserPermissions(user.id)
    }
    
    setShowForm(true)
  }

  const fetchUserPermissions = async (userId) => {
    try {
      const response = await axiosInstance.get(`/users/${userId}/permissions`)
      setSelectedPermissions(response.data.permissions.map(p => p.id))
    } catch (err) {
      console.error('Failed to fetch user permissions:', err)
      setSelectedPermissions([])
    }
  }

  const handleDeactivate = async (userId, userEmail) => {
    if (!window.confirm(`Are you sure you want to deactivate ${userEmail}?`)) {
      return
    }

    try {
      await axiosInstance.delete(`/admin/users/${userId}`)
      alert('User deactivated successfully!')
      fetchUsers()
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to deactivate user')
    }
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingUser(null)
    setFormData({ email: '', company: '', role: 'Viewer', password: '' })
    setSelectedPermissions([])
  }

  const handleRoleChange = (newRole) => {
    setFormData({ ...formData, role: newRole })
    
    // Apply role presets when role changes
    if (newRole === 'Manager') {
      setSelectedPermissions([
        "view_assets", "create_assets", "edit_assets", "assign_assets", "transfer_assets",
        "view_reports", "generate_reports", "export_reports_pdf", "export_reports_excel",
        "view_departments", "view_maintenance", "create_maintenance", "view_activity_logs"
      ])
    } else if (newRole === 'Viewer') {
      setSelectedPermissions([
        "view_assets", "view_reports", "view_departments", "view_maintenance"
      ])
    } else if (newRole === 'Admin') {
      setSelectedPermissions([]) // Admins get all permissions automatically
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

  return (
    <div>
      <div className="header">
        <h1>User Management</h1>
        <button 
          className="btn btn-primary"
          onClick={() => setShowForm(true)}
        >
          <FiPlus size={18} /> Add User
        </button>
      </div>

      {showForm && (
        <div className="card">
          <div className="card-header">
            <h3>{editingUser ? 'Edit User' : 'Add New User'}</h3>
          </div>
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              {/* Basic User Information */}
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ marginBottom: '15px', color: '#333' }}>Basic Information</h4>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Email *</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="user@company.com"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Company *</label>
                    <input
                      type="text"
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      placeholder="Company name"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Role *</label>
                    <select
                      value={formData.role}
                      onChange={(e) => handleRoleChange(e.target.value)}
                      required
                    >
                      <option value="Viewer">Viewer</option>
                      <option value="Manager">Manager</option>
                      <option value="Admin">Admin</option>
                    </select>
                  </div>

                  {!editingUser && (
                    <div className="form-group">
                      <label>Password *</label>
                      <input
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        placeholder="Set initial password"
                        required
                        minLength={6}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Permissions Section - Only show for non-admin roles */}
              {currentUser.role === 'Admin' && formData.role !== 'Admin' && (
                <div style={{ marginTop: '25px', paddingTop: '20px', borderTop: '2px solid #e0e0e0' }}>
                  <h4 style={{ marginBottom: '15px', color: '#333' }}>
                    🔐 Custom Permissions
                    <small style={{ fontSize: '0.8rem', color: '#666', marginLeft: '10px' }}>
                      (Optional - role presets are applied automatically)
                    </small>
                  </h4>
                  <PermissionsCheckbox
                    selectedPermissions={selectedPermissions}
                    onPermissionChange={setSelectedPermissions}
                    userRole={formData.role}
                  />
                </div>
              )}

              {/* Admin Note */}
              {currentUser.role === 'Admin' && formData.role === 'Admin' && (
                <div style={{ 
                  marginTop: '20px', 
                  padding: '15px', 
                  backgroundColor: '#fff3cd', 
                  border: '1px solid #ffeaa7',
                  borderRadius: '4px',
                  color: '#856404'
                }}>
                  <strong>💡 Note:</strong> Admin users automatically get all permissions. 
                  Custom permissions are not available for admin role.
                </div>
              )}

              <div className="form-actions">
                <button type="submit" className="btn btn-success">
                  {editingUser ? 'Update User' : 'Create User'}
                </button>
                <button type="button" className="btn btn-outline" onClick={handleCancel}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rest of your existing user list code remains the same */}
      <div className="card">
        <div className="card-header">
          <h3>System Users ({users.length})</h3>
        </div>
        <div className="card-body">
          {users.length === 0 ? (
            <div className="loading">No users found</div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Company</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          background: getRoleColor(user.role),
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontWeight: 'bold'
                        }}>
                          <FiUser size={16} />
                        </div>
                        <div>
                          <div style={{ fontWeight: '600' }}>{user.email}</div>
                          <div style={{ fontSize: '0.8rem', color: '#6c757d' }}>
                            Joined: {new Date(user.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <FiBriefcase size={14} />
                        {user.company}
                      </div>
                    </td>
                    <td>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        backgroundColor: getRoleColor(user.role) + '20',
                        color: getRoleColor(user.role)
                      }}>
                        <FiShield size={12} style={{ marginRight: '4px' }} />
                        {user.role}
                      </span>
                    </td>
                    <td>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        backgroundColor: user.is_active ? '#d4edda' : '#f8d7da',
                        color: user.is_active ? '#155724' : '#721c24'
                      }}>
                        {user.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button 
                          className="btn btn-sm btn-outline"
                          onClick={() => handleEdit(user)}
                          title="Edit user"
                        >
                          <FiEdit2 size={14} />
                        </button>
                        {user.is_active && (
                          <button 
                            className="btn btn-sm btn-danger"
                            onClick={() => handleDeactivate(user.id, user.email)}
                            title="Deactivate user"
                          >
                            <FiTrash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}

export default UsersManagement;