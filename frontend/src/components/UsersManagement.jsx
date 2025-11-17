import React, { useState, useEffect } from 'react'
import axiosInstance from '../api/axios'
import { FiPlus } from 'react-icons/fi'
import PermissionsCheckbox from './PermissionsCheckbox'
import UserDetailDrawer from './UserDetailDrawer'
import { formatNumber } from '../utils/formatters'

const UsersManagement = () => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [selectedUser, setSelectedUser] = useState(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    display_name: '',
    company: '',
    role: 'Viewer',
    password: ''
  })
  const [selectedPermissions, setSelectedPermissions] = useState([])
  const [allPermissions, setAllPermissions] = useState([])
  const [currentUser] = useState({ role: 'Admin' })

  useEffect(() => {
    fetchAllPermissions()
  }, [])

  const fetchAllPermissions = async () => {
    try {
      const response = await axiosInstance.get('/permissions')
      setAllPermissions(response.data)
    } catch (err) {
      console.error('Failed to fetch permissions:', err)
    }
  }

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
        // Update existing user
        const { password, ...updateData } = formData
        await axiosInstance.patch(`/admin/users/${editingUser.id}`, updateData)
        
        // Update permissions only if needed
        const shouldUpdatePermissions = 
          currentUser.role === 'Admin' && 
          formData.role !== 'Admin' && 
          selectedPermissions.length > 0
        
        if (shouldUpdatePermissions) {
          try {
            await axiosInstance.post(`/users/${editingUser.id}/permissions/bulk`, {
              permission_ids: selectedPermissions
            })
          } catch (permErr) {
            console.warn('Permission update failed:', permErr)
            alert('User updated, but permission update failed. Please try updating permissions separately.')
          }
        }
        
        alert('User updated successfully!')
      } else {
        // Create new user
        const userResponse = await axiosInstance.post('/admin/users', formData)
        
        // Assign permissions for non-admin users
        if (currentUser.role === 'Admin' && formData.role !== 'Admin' && selectedPermissions.length > 0) {
          try {
            await axiosInstance.post(`/users/${userResponse.data.id}/permissions/bulk`, {
              permission_ids: selectedPermissions
            })
          } catch (permErr) {
            console.error('Permission assignment failed:', permErr)
            alert('User created successfully, but permission assignment failed. You can assign permissions later by editing the user.')
          }
        }
        
        alert('User created successfully!')
      }
      
      // Reset form
      setFormData({ email: '', display_name: '', company: '', role: 'Viewer', password: '' })
      setSelectedPermissions([])
      setEditingUser(null)
      setShowForm(false)
      fetchUsers()
    } catch (err) {
      console.error('Error saving user:', err)
      const errorMsg = err.response?.data?.detail || err.message || 'Unknown error occurred'
      alert(`Failed to save user:\n${errorMsg}`)
    }
  }

  const handleEdit = (user) => {
    setEditingUser(user)
    setFormData({
      email: user.email,
      display_name: user.display_name || '',
      company: user.company,
      role: user.role,
      password: ''
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
      const permissionIds = response.data.permissions.map(p => p.id)
      setSelectedPermissions(permissionIds)
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

  const handleReactivate = async (userId, userEmail) => {
    if (!window.confirm(`Are you sure you want to reactivate ${userEmail}?`)) {
      return
    }

    try {
      await axiosInstance.patch(`/admin/users/${userId}/reactivate`)
      alert('User reactivated successfully!')
      fetchUsers()
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to reactivate user')
    }
  }

  const handlePermanentDelete = async (userId, userEmail) => {
    // First confirmation
    const confirmed = window.confirm(
      `⚠️ PERMANENT DELETE WARNING ⚠️\n\n` +
      `You are about to PERMANENTLY delete: ${userEmail}\n\n` +
      `This action CANNOT be undone and will remove:\n` +
      `• User account\n` +
      `• All permissions\n` +
      `• All activity history\n` +
      `• All assignments\n\n` +
      `Are you absolutely sure?`
    )

    if (!confirmed) {
      return
    }

    // Second confirmation with typed verification
    const verification = prompt(
      `To confirm permanent deletion of ${userEmail}, type: DELETE`
    )

    if (verification !== 'DELETE') {
      alert('Deletion cancelled. You must type DELETE exactly.')
      return
    }

    try {
      await axiosInstance.delete(`/admin/users/${userId}/permanent`)
      alert('User permanently deleted!')
      fetchUsers()
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to permanently delete user')
    }
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingUser(null)
    setFormData({ email: '', display_name: '', company: '', role: 'Viewer', password: '' })
    setSelectedPermissions([])
  }

  const handleRoleChange = (newRole) => {
    setFormData({ ...formData, role: newRole })
    
    const rolePresetNames = {
      Manager: [
        "view_assets", "create_assets", "edit_assets", "assign_assets", "transfer_assets",
        "view_reports", "generate_reports", "export_reports_pdf", "export_reports_excel",
        "view_departments", "view_maintenance", "create_maintenance", "view_activity_logs"
      ],
      Viewer: [
        "view_assets", "view_reports", "view_departments", "view_maintenance"
      ]
    }
    
    if (newRole === 'Manager' || newRole === 'Viewer') {
      const permissionIds = allPermissions
        .filter(p => rolePresetNames[newRole].includes(p.name))
        .map(p => p.id)
      setSelectedPermissions(permissionIds)
    } else if (newRole === 'Admin') {
      setSelectedPermissions([])
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

  // Handle row click to open drawer
  const handleRowClick = (user) => {
    setSelectedUser(user)
    setIsDrawerOpen(true)
  }

  // Close drawer
  const handleCloseDrawer = () => {
    setIsDrawerOpen(false)
    setTimeout(() => setSelectedUser(null), 300) // Clear after animation
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

      {/* Stats Cards */}
      <div className="stats-grid" style={{ marginBottom: '20px' }}>
        <div className="stat-card">
          <div className="stat-content">
            <h3>Total Users</h3>
            <div className="stat-number">{formatNumber(users.length, 0)}</div>
            <div className="stat-trend">All users</div>
          </div>
        </div>
        
        <div className="stat-card success">
          <div className="stat-content">
            <h3>Active</h3>
            <div className="stat-number">{formatNumber(users.filter(u => u.is_active).length, 0)}</div>
            <div className="stat-trend">Active users</div>
          </div>
        </div>
        
        <div className="stat-card warning">
          <div className="stat-content">
            <h3>Inactive</h3>
            <div className="stat-number">{formatNumber(users.filter(u => !u.is_active).length, 0)}</div>
            <div className="stat-trend">Deactivated</div>
          </div>
        </div>
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
                    <label>Display Name</label>
                    <input
                      type="text"
                      value={formData.display_name}
                      onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                      placeholder="e.g., Lloyd Junior, Mark Amoani"
                    />
                    <small style={{ color: '#6c757d', fontSize: '0.85rem', marginTop: '4px', display: 'block' }}>
                      Optional: How this user's name appears throughout the system
                    </small>
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

              {/* Permissions Section */}
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
                  <div style={{ marginTop: '10px', fontSize: '0.85rem', color: '#17a2b8' }}>
                    Selected Permissions: {selectedPermissions.length}
                  </div>
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

      {/* User List */}
      <div className={`card ${isDrawerOpen ? 'blurred' : ''}`}>
        <div className="card-header">
          <h3>System Users ({users.length})</h3>
        </div>
        <div className="card-body">
          {users.length === 0 ? (
            <div className="loading">No users found</div>
          ) : (
            <table className="table users-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Company</th>
                  <th>Role</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr 
                    key={user.id} 
                    onClick={() => handleRowClick(user)}
                    className={`user-row ${!user.is_active ? 'inactive-user' : ''}`}
                  >
                    <td>
                      <div className="user-cell">
                        <div className="user-email">
                          {user.email}
                          {!user.is_active && (
                            <span className="deactivated-label">(Deactivated)</span>
                          )}
                        </div>
                        <div className="user-joined">
                          Joined: {new Date(user.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="company-name">{user.company}</span>
                    </td>
                    <td>
                      <span 
                        className="role-badge"
                        style={{
                          backgroundColor: getRoleColor(user.role) + '20',
                          color: getRoleColor(user.role)
                        }}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${user.is_active ? 'active' : 'inactive'}`}>
                        {user.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* User Detail Drawer */}
      <UserDetailDrawer
        user={selectedUser}
        isOpen={isDrawerOpen}
        onClose={handleCloseDrawer}
        onEdit={handleEdit}
        onDeactivate={handleDeactivate}
        onReactivate={handleReactivate}
        onPermanentDelete={handlePermanentDelete}
      />
    </div>
  )
}

export default UsersManagement