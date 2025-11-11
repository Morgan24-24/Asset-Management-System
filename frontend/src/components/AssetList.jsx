import React, { useState, useEffect } from 'react'
import { FaPlus, FaHistory, FaExchangeAlt, FaEye, FaEdit } from 'react-icons/fa'
import axiosInstance from '../api/axios'
import AssetHistoryModal from './AssetHistoryModal' 
import { getDisplayName } from '../utils/helpers'

const AssetList = ({ assets, loading, onRefresh, onNewAssetClick, user }) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterDepartment, setFilterDepartment] = useState('')
  const [selectedAsset, setSelectedAsset] = useState(null)
  const [showHistory, setShowHistory] = useState(false)
  const [showTransfer, setShowTransfer] = useState(false)
  const [assetTypes, setAssetTypes] = useState([])
  const [departments, setDepartments] = useState([])
  const [users, setUsers] = useState([])
  const [transferData, setTransferData] = useState({
    assigned_to_id: '',
    notes: ''
  })
  const [assignmentHistory, setAssignmentHistory] = useState([])
  
  // ✅ NEW: Edit modal states
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingAsset, setEditingAsset] = useState(null)
  const [editFormData, setEditFormData] = useState({
    model: '',
    serial: '',
    cost: '',
    status: '',
    warranty_status: '',
    location: '',
    department_id: '',
    assignee_id: ''
  })

  // Fetch dropdown data
  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        const [typesRes, deptsRes, usersRes] = await Promise.all([
          axiosInstance.get('/asset-types'),
          axiosInstance.get('/departments'),
          axiosInstance.get('/users/active')
        ])
        setAssetTypes(typesRes.data)
        setDepartments(deptsRes.data)
        setUsers(usersRes.data)
      } catch (err) {
        console.error('Failed to fetch dropdown data:', err)
      }
    }
    fetchDropdownData()
  }, [])

  // Filter assets based on search and filters
  const filteredAssets = assets.filter(asset => {
    const matchesSearch = searchTerm === '' || 
      asset.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (asset.brand_obj?.name && asset.brand_obj.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      asset.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.serial.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (asset.assignee?.email && asset.assignee.email.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesType = filterType === '' || asset.asset_type_id?.toString() === filterType
    const matchesStatus = filterStatus === '' || asset.status === filterStatus
    const matchesDepartment = filterDepartment === '' || asset.department_id?.toString() === filterDepartment

    return matchesSearch && matchesType && matchesStatus && matchesDepartment
  })

  // Fetch assignment history for an asset
  const fetchAssignmentHistory = async (assetId) => {
    try {
      const response = await axiosInstance.get(`/assets/${assetId}/history`)
      setAssignmentHistory(response.data)
    } catch (err) {
      console.error('Failed to fetch assignment history:', err)
      setAssignmentHistory([])
    }
  }

  const viewAssetHistory = async (asset) => {
    setSelectedAsset(asset)
    await fetchAssignmentHistory(asset.id)
    setShowHistory(true)
  }

  const openTransferModal = (asset) => {
    setSelectedAsset(asset)
    setTransferData({
      assigned_to_id: '',
      notes: ''
    })
    setShowTransfer(true)
  }

  const handleTransfer = async () => {
    if (!transferData.assigned_to_id) {
      alert('Please select a user to transfer the asset to')
      return
    }

    try {
      await axiosInstance.post(`/assets/${selectedAsset.id}/assign`, transferData)
      
      // Get the assigned user from the users list (already fetched)
      const assignedUser = users.find(u => u.id === parseInt(transferData.assigned_to_id))
      const userName = assignedUser ? getDisplayName(assignedUser) : 'the user'
      
      alert(`Asset transferred successfully to ${userName}! Notification has been sent.`)
      setShowTransfer(false)
      onRefresh() // Refresh the asset list
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to transfer asset')
    }
  }

  // ✅ NEW: Handle edit click
  const handleEditClick = (asset) => {
    setEditingAsset(asset)
    setEditFormData({
      model: asset.model,
      serial: asset.serial,
      cost: asset.cost,
      status: asset.status,
      warranty_status: asset.warranty_status,
      location: asset.location || '',
      department_id: asset.department_id || '',
      assignee_id: asset.assignee_id || ''
    })
    setShowEditModal(true)
  }

  // ✅ NEW: Handle edit submit
  const handleEditSubmit = async () => {
    if (!editingAsset) return

    try {
      await axiosInstance.patch(`/assets/${editingAsset.id}`, editFormData)
      alert('Asset updated successfully!')
      setShowEditModal(false)
      setEditingAsset(null)
      onRefresh()
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to update asset')
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return { bg: '#d4edda', text: '#155724' }
      case 'Available': return { bg: '#d1ecf1', text: '#0c5460' }
      case 'Under Maintenance': return { bg: '#fff3cd', text: '#856404' }
      case 'Retired': return { bg: '#f8d7da', text: '#721c24' }
      default: return { bg: '#e9ecef', text: '#495057' }
    }
  }

  if (loading) {
    return <div className="loading">Loading assets...</div>
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Asset Inventory</h2>
        <div>
          <button className="btn" onClick={onRefresh} style={{ marginRight: '10px' }}>
            Refresh
          </button>
          <button className="btn btn-success" onClick={onNewAssetClick}>
            <FaPlus style={{ marginRight: '5px' }} />
            New Asset
          </button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr auto auto auto', 
        gap: '10px', 
        marginBottom: '20px' 
      }}>
        <input
          type="text"
          placeholder="Search by ID, brand, model, serial, or assignee..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="form-control"
        />
        
        <select 
          value={filterType} 
          onChange={(e) => setFilterType(e.target.value)}
          className="form-control"
        >
          <option value="">All Types</option>
          {assetTypes.map(type => (
            <option key={type.id} value={type.id}>{type.name}</option>
          ))}
        </select>
        
        <select 
          value={filterStatus} 
          onChange={(e) => setFilterStatus(e.target.value)}
          className="form-control"
        >
          <option value="">All Status</option>
          <option value="Available">Available</option>
          <option value="Active">Active</option>
          <option value="Under Maintenance">Under Maintenance</option>
          <option value="Retired">Retired</option>
        </select>
        
        <select 
          value={filterDepartment} 
          onChange={(e) => setFilterDepartment(e.target.value)}
          className="form-control"
        >
          <option value="">All Departments</option>
          {departments.map(dept => (
            <option key={dept.id} value={dept.id}>{dept.name}</option>
          ))}
        </select>
      </div>

      {/* Summary Stats */}
      <div className="stats-grid" style={{ marginBottom: '20px' }}>
        <div className="stat-card">
          <div className="stat-content">
            <h3>Total Assets</h3>
            <div className="stat-number">{filteredAssets.length}</div>
            <div className="stat-trend">Filtered results</div>
          </div>
        </div>
        
        <div className="stat-card success">
          <div className="stat-content">
            <h3>Active</h3>
            <div className="stat-number">
              {filteredAssets.filter(a => a.status === 'Active').length}
            </div>
            <div className="stat-trend">In use</div>
          </div>
        </div>
        
        <div className="stat-card info">
          <div className="stat-content">
            <h3>Available</h3>
            <div className="stat-number">
              {filteredAssets.filter(a => a.status === 'Available').length}
            </div>
            <div className="stat-trend">Ready to assign</div>
          </div>
        </div>
      </div>

      {filteredAssets.length === 0 ? (
        <div className="loading">No assets found matching your criteria</div>
      ) : (
        <div className="card">
          <div className="card-header">
            <h3>Assets ({filteredAssets.length})</h3>
          </div>
          <div className="card-body" style={{ padding: '0' }}>
            <table className="assets-table">
              <thead>
                <tr>
                  <th>Asset ID</th>
                  <th>Model</th>
                  <th>Serial</th>
                  <th>Status</th>
                  <th>Assignee</th>
                  <th>Department</th>
                  <th>Location</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAssets.map(asset => {
                  const statusColors = getStatusColor(asset.status)
                  return (
                    <tr key={asset.id}>
                      <td>
                        <strong>{asset.id}</strong>
                      </td>
                      <td>{asset.model}</td>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.9rem' }}>
                        {asset.serial}
                      </td>
                      <td>
                        <span style={{
                          padding: '6px 12px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          backgroundColor: statusColors.bg,
                          color: statusColors.text
                        }}>
                          {asset.status}
                        </span>
                      </td>
                      <td>
  {asset.assignee ? (
    <div>
      <div style={{ fontWeight: '600' }}>
        {getDisplayName(asset.assignee)}
      </div>
      <div style={{ fontSize: '0.8rem', color: '#6c757d' }}>
        {asset.assignee.email}
      </div>
    </div>
  ) : (
    <span style={{ color: '#6c757d' }}>Unassigned</span>
  )}
</td>
                      <td>{asset.department?.name || 'Unassigned'}</td>
                      <td>{asset.location || 'N/A'}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          {/* View History - Everyone can see */}
                          <button 
                            className="btn btn-sm btn-outline"
                            onClick={() => viewAssetHistory(asset)}
                            title="View assignment history"
                            style={{
                              background: '#17a2b8',
                              color: 'white',
                              border: 'none'
                            }}
                          >
                            <FaHistory size={12} />
                          </button>
                          
                          {/* ✅ NEW: Edit button - Manager/Admin only */}
                          {(user?.role === 'Admin' || user?.role === 'Manager') && (
                            <button 
                              className="btn btn-sm btn-outline"
                              onClick={() => handleEditClick(asset)}
                              title="Edit asset"
                              style={{
                                background: '#ffc107',
                                color: 'white',
                                border: 'none'
                              }}
                            >
                              <FaEdit size={12} />
                            </button>
                          )}
                          
                          {/* Transfer - Manager/Admin only */}
                          {asset.status !== 'Retired' && (user?.role === 'Admin' || user?.role === 'Manager') && (
                            <button 
                              className="btn btn-sm btn-primary"
                              onClick={() => openTransferModal(asset)}
                              title="Transfer asset"
                            >
                              <FaExchangeAlt size={12} />
                            </button>
                          )}
                          
                          {/* View Details - Everyone can see */}
                          <button 
                            className="btn btn-sm btn-info"
                            onClick={() => {/* Add view details functionality */}}
                            title="View asset details"
                          >
                            <FaEye size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Asset History Modal */}
      {showHistory && selectedAsset && (
        <AssetHistoryModal 
          assetId={selectedAsset.id}
          onClose={() => setShowHistory(false)}
          user={user}
        />
      )}

      {/* ✅ NEW: Edit Asset Modal */}
      {showEditModal && editingAsset && (
        <div className="modal-overlay" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div className="modal" style={{
            background: 'white',
            borderRadius: '8px',
            padding: '20px',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <div className="modal-header" style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px',
              borderBottom: '1px solid #eaeaea',
              paddingBottom: '10px'
            }}>
              <h3>Edit Asset - {editingAsset.id}</h3>
              <button 
                onClick={() => setShowEditModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer'
                }}
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              <div className="form-group">
                <label>Model *</label>
                <input
                  type="text"
                  className="form-control"
                  value={editFormData.model}
                  onChange={(e) => setEditFormData({...editFormData, model: e.target.value})}
                  required
                />
              </div>

              <div className="form-group">
                <label>Serial Number *</label>
                <input
                  type="text"
                  className="form-control"
                  value={editFormData.serial}
                  onChange={(e) => setEditFormData({...editFormData, serial: e.target.value})}
                  required
                />
              </div>

              <div className="form-group">
                <label>Cost *</label>
                <input
                  type="number"
                  className="form-control"
                  value={editFormData.cost}
                  onChange={(e) => setEditFormData({...editFormData, cost: parseFloat(e.target.value)})}
                  required
                />
              </div>

              <div className="form-group">
                <label>Status *</label>
                <select
                  className="form-control"
                  value={editFormData.status}
                  onChange={(e) => setEditFormData({...editFormData, status: e.target.value})}
                  required
                >
                  <option value="Available">Available</option>
                  <option value="Active">Active</option>
                  <option value="Under Maintenance">Under Maintenance</option>
                  <option value="Retired">Retired</option>
                </select>
              </div>

              <div className="form-group">
                <label>Warranty Status *</label>
                <select
                  className="form-control"
                  value={editFormData.warranty_status}
                  onChange={(e) => setEditFormData({...editFormData, warranty_status: e.target.value})}
                  required
                >
                  <option value="Active">Active</option>
                  <option value="Expired">Expired</option>
                  <option value="No Warranty">No Warranty</option>
                </select>
              </div>

              <div className="form-group">
                <label>Department</label>
                <select
                  className="form-control"
                  value={editFormData.department_id}
                  onChange={(e) => setEditFormData({...editFormData, department_id: e.target.value})}
                >
                  <option value="">Select Department</option>
                  {departments.map(dept => (
                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Location</label>
                <input
                  type="text"
                  className="form-control"
                  value={editFormData.location}
                  onChange={(e) => setEditFormData({...editFormData, location: e.target.value})}
                  placeholder="e.g., Building A, Floor 2"
                />
              </div>

              <div className="form-actions">
                <button 
                  className="btn btn-success"
                  onClick={handleEditSubmit}
                >
                  Save Changes
                </button>
                <button 
                  className="btn btn-outline"
                  onClick={() => setShowEditModal(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Transfer Asset Modal */}
      {showTransfer && selectedAsset && (
        <div className="modal-overlay" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div className="modal" style={{
            background: 'white',
            borderRadius: '8px',
            padding: '20px',
            maxWidth: '500px',
            width: '90%'
          }}>
            <div className="modal-header" style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px',
              borderBottom: '1px solid #eaeaea',
              paddingBottom: '10px'
            }}>
              <h3>Transfer Asset - {selectedAsset.id}</h3>
              <button 
                onClick={() => setShowTransfer(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer'
                }}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Transfer to User *</label>
                <select
                  value={transferData.assigned_to_id}
                  onChange={(e) => setTransferData({...transferData, assigned_to_id: e.target.value})}
                  className="form-control"
                  required
                >
                  <option value="">Select User</option>
                  {users.filter(u => u.id !== selectedAsset.assignee_id).map(u => (
                    <option key={u.id} value={u.id}>
                      {getDisplayName(u)} ({u.role})
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label>Transfer Notes</label>
                <textarea
                  value={transferData.notes}
                  onChange={(e) => setTransferData({...transferData, notes: e.target.value})}
                  className="form-control"
                  placeholder="Reason for transfer..."
                  rows="3"
                />
              </div>

              <div className="form-actions">
                <button 
                  className="btn btn-success"
                  onClick={handleTransfer}
                >
                  Transfer Asset
                </button>
                <button 
                  className="btn btn-outline"
                  onClick={() => setShowTransfer(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AssetList