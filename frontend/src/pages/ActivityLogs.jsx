import React, { useState, useEffect } from 'react'
import axiosInstance from '../api/axios'
import { 
  FiClock, 
  FiUser, 
  FiSearch, 
  FiFilter,
  FiChevronLeft,
  FiChevronRight,
  FiPackage,
  FiAlertCircle,
  FiDownload
} from 'react-icons/fi'
import { getDisplayName } from '../utils/helpers'

const ActivityLogs = ({ user }) => {
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [totalActivities, setTotalActivities] = useState(0)
  const itemsPerPage = 25
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [filterActionType, setFilterActionType] = useState('')
  const [filterUserId, setFilterUserId] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  
  // Users list for filter dropdown
  const [users, setUsers] = useState([])

  // Fetch activities
  const fetchActivities = async () => {
    setLoading(true)
    setError('')
    try {
      const skip = (currentPage - 1) * itemsPerPage
      
      // Build query params
      const params = new URLSearchParams({
        skip: skip.toString(),
        limit: itemsPerPage.toString()
      })
      
      if (searchTerm) params.append('search', searchTerm)
      if (filterActionType) params.append('action_type', filterActionType)
      if (filterUserId) params.append('user_id', filterUserId)
      if (startDate) params.append('start_date', startDate)
      if (endDate) params.append('end_date', endDate)
      
      const response = await axiosInstance.get(`/activities?${params.toString()}`)
      setActivities(response.data)
      
      // Note: Backend should return total count, but for now we'll estimate
      setTotalActivities(response.data.length < itemsPerPage ? skip + response.data.length : skip + itemsPerPage + 1)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to fetch activity logs')
      console.error('Error fetching activities:', err)
    } finally {
      setLoading(false)
    }
  }

  // Generate PDF Report
  const handleGenerateReport = async () => {
    try {
      // Build query params for current filters
      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      if (filterActionType) params.append('action_type', filterActionType)
      if (filterUserId) params.append('user_id', filterUserId)
      if (startDate) params.append('start_date', startDate)
      if (endDate) params.append('end_date', endDate)
      
      const response = await axiosInstance.get(
        `/report/export/activity-logs?format=pdf&${params.toString()}`,
        { responseType: 'blob' }
      )
      
      // Download the file
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `activity_logs_${new Date().toISOString().split('T')[0]}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (err) {
      alert('Failed to generate activity log report')
      console.error(err)
    }
  }

  // Fetch users for filter dropdown
  const fetchUsers = async () => {
    try {
      const response = await axiosInstance.get('/admin/users')
      setUsers(response.data)
    } catch (err) {
      console.error('Error fetching users:', err)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  useEffect(() => {
    fetchActivities()
  }, [currentPage, searchTerm, filterActionType, filterUserId, startDate, endDate])

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Unknown'
    const date = new Date(timestamp)
    const day = date.toLocaleDateString('en-US', { weekday: 'long' })
    const dateStr = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    const time = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    return `${day}, ${dateStr} at ${time}`
  }

  // Get action color
  const getActionColor = (actionType) => {
    switch (actionType) {
      case 'CREATE': return '#28a745'
      case 'UPDATE': return '#17a2b8'
      case 'DELETE': return '#dc3545'
      case 'ASSIGN': return '#ffc107'
      case 'TRANSFER': return '#fd7e14'
      case 'RETURN': return '#20c997'
      case 'MAINTENANCE': return '#6f42c1'
      case 'LOGIN': return '#007bff'
      case 'LOGOUT': return '#6c757d'
      case 'EXPORTLOGS': return '#17c0eb'
      default: return '#6c757d'
    }
  }

  // Reset filters
  const handleResetFilters = () => {
    setSearchTerm('')
    setFilterActionType('')
    setFilterUserId('')
    setStartDate('')
    setEndDate('')
    setCurrentPage(1)
  }

  // Pagination
  const totalPages = Math.ceil(totalActivities / itemsPerPage)
  const canGoPrevious = currentPage > 1
  const canGoNext = currentPage < totalPages

  if (loading && activities.length === 0) {
    return (
      <div className="card">
        <div className="card-body">
          <div className="loading">Loading activity logs...</div>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="header">
        <div>
          <h1>Activity Logs</h1>
          <p style={{ color: '#6c757d', margin: 0 }}>
            System-wide activity audit trail • {user?.role || 'User'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          {user?.role === 'Admin' && (
            <button 
              className="btn btn-success"
              onClick={handleGenerateReport}
            >
              <FiDownload size={18} /> Generate Report
            </button>
          )}
          <button 
            className="btn btn-outline"
            onClick={() => setShowFilters(!showFilters)}
          >
            <FiFilter size={18} /> {showFilters ? 'Hide Filters' : 'Show Filters'}
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="alert alert-danger">
          {error}
        </div>
      )}

      {/* Filters Section */}
      {showFilters && (
        <div className="card" style={{ marginBottom: '20px' }}>
          <div className="card-header">
            <h3>Filters</h3>
          </div>
          <div className="card-body">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
              {/* Search */}
              <div className="form-group">
                <label>Search Description</label>
                <div style={{ position: 'relative' }}>
                  <FiSearch 
                    size={16} 
                    style={{ 
                      position: 'absolute', 
                      left: '10px', 
                      top: '50%', 
                      transform: 'translateY(-50%)',
                      color: '#6c757d'
                    }} 
                  />
                  <input
                    type="text"
                    className="form-control"
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value)
                      setCurrentPage(1)
                    }}
                    placeholder="Search activities..."
                    style={{ paddingLeft: '35px' }}
                  />
                </div>
              </div>

              {/* Action Type Filter */}
              <div className="form-group">
                <label>Action Type</label>
                <select
                  className="form-control"
                  value={filterActionType}
                  onChange={(e) => {
                    setFilterActionType(e.target.value)
                    setCurrentPage(1)
                  }}
                >
                  <option value="">All Actions</option>
                  <option value="CREATE">Create</option>
                  <option value="UPDATE">Update</option>
                  <option value="DELETE">Delete</option>
                  <option value="ASSIGN">Assign</option>
                  <option value="TRANSFER">Transfer</option>
                  <option value="RETURN">Return</option>
                  <option value="MAINTENANCE">Maintenance</option>
                  <option value="LOGIN">Login</option>
                  <option value="LOGOUT">Logout</option>
                  <option value="EXPORTLOGS">Export Logs</option>
                </select>
              </div>

              {/* User Filter */}
              <div className="form-group">
                <label>User</label>
                <select
                  className="form-control"
                  value={filterUserId}
                  onChange={(e) => {
                    setFilterUserId(e.target.value)
                    setCurrentPage(1)
                  }}
                >
                  <option value="">All Users</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.email} ({u.role})
                    </option>
                  ))}
                </select>
              </div>

              {/* Start Date */}
              <div className="form-group">
                <label>Start Date</label>
                <input
                  type="date"
                  className="form-control"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value)
                    setCurrentPage(1)
                  }}
                />
              </div>

              {/* End Date */}
              <div className="form-group">
                <label>End Date</label>
                <input
                  type="date"
                  className="form-control"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value)
                    setCurrentPage(1)
                  }}
                />
              </div>

              {/* Reset Button */}
              <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end' }}>
                <button 
                  className="btn btn-outline"
                  onClick={handleResetFilters}
                  style={{ width: '100%' }}
                >
                  Reset Filters
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Activity Logs Table */}
      <div className="card">
        <div className="card-header">
          <h3>Activity History</h3>
          <span style={{ fontSize: '0.9rem', color: '#6c757d' }}>
            Showing {activities.length} activities • Page {currentPage} of {totalPages || 1}
          </span>
        </div>
        <div className="card-body">
          {activities.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#6c757d' }}>
              <FiAlertCircle size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
              <p>No activities found matching your filters.</p>
              {(searchTerm || filterActionType || filterUserId || startDate || endDate) && (
                <button className="btn btn-outline" onClick={handleResetFilters} style={{ marginTop: '10px' }}>
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th style={{ width: '180px' }}>Date & Time</th>
                    <th style={{ width: '100px' }}>Action</th>
                    <th style={{ width: '200px' }}>User</th>
                    <th>Description</th>
                    <th style={{ width: '120px' }}>Asset ID</th>
                  </tr>
                </thead>
                <tbody>
                  {activities.map((activity) => {
                    const activityUser = users.find(u => u.id === activity.user_id)
                    
                    return (
                      <tr key={activity.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
                            <FiClock size={14} style={{ color: '#6c757d' }} />
                            <div>
                              <div style={{ fontWeight: '600' }}>
                                {new Date(activity.timestamp).toLocaleDateString('en-US', { 
                                  month: 'short', 
                                  day: 'numeric', 
                                  year: 'numeric' 
                                })}
                              </div>
                              <div style={{ color: '#6c757d', fontSize: '0.8rem' }}>
                                {new Date(activity.timestamp).toLocaleTimeString('en-US', { 
                                  hour: '2-digit', 
                                  minute: '2-digit'
                                })}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            fontWeight: 'bold',
                            backgroundColor: getActionColor(activity.action_type) + '20',
                            color: getActionColor(activity.action_type),
                            textTransform: 'uppercase'
                          }}>
                            {activity.action_type}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
  <FiUser size={14} style={{ color: '#6c757d' }} />
  <div>
    <div style={{ fontSize: '0.9rem', fontWeight: '500' }}>
      {activityUser ? getDisplayName(activityUser) : 'Unknown'}
    </div>
    <div style={{ fontSize: '0.75rem', color: '#6c757d' }}>
      {activityUser ? activityUser.role : ''}
    </div>
  </div>
</div>
                        </td>
                        <td>
                          <div style={{ fontSize: '0.9rem', color: '#2c3e50' }}>
                            {activity.description}
                          </div>
                        </td>
                        <td>
                          {activity.asset_id ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <FiPackage size={14} style={{ color: '#6c757d' }} />
                              <span style={{ 
                                fontFamily: 'monospace', 
                                fontSize: '0.85rem',
                                color: '#007bff',
                                fontWeight: '600'
                              }}>
                                {activity.asset_id}
                              </span>
                            </div>
                          ) : (
                            <span style={{ color: '#999' }}>—</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Pagination */}
      {activities.length > 0 && (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginTop: '20px',
          padding: '15px',
          background: 'white',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <div style={{ color: '#6c757d', fontSize: '0.9rem' }}>
            Page {currentPage} of {totalPages || 1}
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              className="btn btn-outline"
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={!canGoPrevious}
              style={{ 
                opacity: canGoPrevious ? 1 : 0.5,
                cursor: canGoPrevious ? 'pointer' : 'not-allowed'
              }}
            >
              <FiChevronLeft size={16} /> Previous
            </button>
            <button 
              className="btn btn-outline"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={!canGoNext}
              style={{ 
                opacity: canGoNext ? 1 : 0.5,
                cursor: canGoNext ? 'pointer' : 'not-allowed'
              }}
            >
              Next <FiChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default ActivityLogs