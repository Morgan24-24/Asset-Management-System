import React, { useState, useEffect } from 'react'
import { FaPlus } from 'react-icons/fa'
import axiosInstance from '../api/axios'
import AssetHistoryModal from './AssetHistoryModal'
import AssetDrawer from './Assetdrawer'
import { getDisplayName } from '../utils/helpers'
import { formatCurrency, formatNumber } from '../utils/formatters'

const AssetList = ({ assets, loading, onRefresh, onNewAssetClick, user }) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterDepartment, setFilterDepartment] = useState('')
  const [selectedAsset, setSelectedAsset] = useState(null)
  const [showHistory, setShowHistory] = useState(false)
  const [showDrawer, setShowDrawer] = useState(false)
  const [showTransferModal, setShowTransferModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [assetTypes, setAssetTypes] = useState([])
  const [departments, setDepartments] = useState([])
  const [users, setUsers] = useState([])
  
  // Transfer data
  const [transferData, setTransferData] = useState({
    assigned_to_id: '',
    notes: ''
  })
  
  // Edit data
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

  // Handle row click - open drawer
  const handleRowClick = (asset) => {
    setSelectedAsset(asset)
    setShowDrawer(true)
  }

  // Handle view history from drawer
  const handleViewHistory = (asset) => {
    setShowDrawer(false)
    setSelectedAsset(asset)
    setShowHistory(true)
  }

  // Handle edit from drawer
  const handleEditFromDrawer = (asset) => {
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
    setShowDrawer(false)
    setShowEditModal(true)
  }

  // Handle transfer from drawer
  const handleTransferFromDrawer = (asset) => {
    setTransferData({
      assigned_to_id: '',
      notes: ''
    })
    setShowDrawer(false)
    setShowTransferModal(true)
  }

  // Submit edit
  const handleEditSubmit = async () => {
    if (!selectedAsset) return

    try {
      await axiosInstance.patch(`/assets/${selectedAsset.id}`, editFormData)
      alert('Asset updated successfully!')
      setShowEditModal(false)
      setSelectedAsset(null)
      onRefresh()
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to update asset')
    }
  }

  // Submit transfer
  const handleTransferSubmit = async () => {
    if (!selectedAsset) return
    
    if (!transferData.assigned_to_id) {
      alert('Please select a user to transfer the asset to')
      return
    }

    try {
      await axiosInstance.post(`/assets/${selectedAsset.id}/assign`, transferData)
      
      const assignedUser = users.find(u => u.id === parseInt(transferData.assigned_to_id))
      const userName = assignedUser ? getDisplayName(assignedUser) : 'the user'
      
      alert(`Asset transferred successfully to ${userName}! Notification has been sent.`)
      setShowTransferModal(false)
      setSelectedAsset(null)
      onRefresh()
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to transfer asset')
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
            <div className="stat-number">{formatNumber(filteredAssets.length, 0)}</div>
            <div className="stat-trend">Filtered results</div>
          </div>
        </div>
        
        <div className="stat-card success">
          <div className="stat-content">
            <h3>Active</h3>
            <div className="stat-number">
              {formatNumber(filteredAssets.filter(a => a.status === 'Active').length, 0)}
            </div>
            <div className="stat-trend">In use</div>
          </div>
        </div>
        
        <div className="stat-card info">
          <div className="stat-content">
            <h3>Available</h3>
            <div className="stat-number">
              {formatNumber(filteredAssets.filter(a => a.status === 'Available').length, 0)}
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
            <h3>Assets ({formatNumber(filteredAssets.length, 0)})</h3>
            <p style={{ margin: 0, fontSize: '0.9rem', color: '#6c757d' }}>
              Click on any row to view details
            </p>
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
                  <th>Cost</th>
                </tr>
              </thead>
              <tbody>
                {filteredAssets.map(asset => {
                  const statusColors = getStatusColor(asset.status)
                  return (
                    <tr 
                      key={asset.id}
                      onClick={() => handleRowClick(asset)}
                      style={{ 
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#f0f3ff'
                        e.currentTarget.style.transform = 'translateX(4px)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent'
                        e.currentTarget.style.transform = 'translateX(0)'
                      }}
                    >
                      <td>
                        <strong style={{ 
                          fontFamily: 'monospace',
                          color: '#007bff',
                          fontSize: '0.95rem'
                        }}>
                          {asset.id}
                        </strong>
                      </td>
                      <td>{asset.model}</td>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.9rem', color: '#6c757d' }}>
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
                            <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>
                              {getDisplayName(asset.assignee)}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#6c757d' }}>
                              {asset.assignee.email}
                            </div>
                          </div>
                        ) : (
                          <span style={{ color: '#999', fontStyle: 'italic' }}>Unassigned</span>
                        )}
                      </td>
                      <td>{asset.department?.name || 'Unassigned'}</td>
                      <td style={{ fontWeight: 'bold', color: '#28a745' }}>
                        {formatCurrency(asset.cost)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Asset Drawer */}
      {showDrawer && selectedAsset && (
        <AssetDrawer
          asset={selectedAsset}
          onClose={() => {
            setShowDrawer(false)
            setSelectedAsset(null)
          }}
          onRefresh={onRefresh}
          user={user}
          onViewHistory={handleViewHistory}
          onEdit={handleEditFromDrawer}
          onTransfer={handleTransferFromDrawer}
        />
      )}

      {/* Transfer Modal */}
      {showTransferModal && selectedAsset && (
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
          zIndex: 10000
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
                onClick={() => {
                  setShowTransferModal(false)
                  setSelectedAsset(null)
                }}
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
                  onClick={handleTransferSubmit}
                >
                  Transfer Asset
                </button>
                <button 
                  className="btn btn-outline"
                  onClick={() => {
                    setShowTransferModal(false)
                    setSelectedAsset(null)
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedAsset && (
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
          zIndex: 10000
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
              <h3>Edit Asset - {selectedAsset.id}</h3>
              <button 
                onClick={() => {
                  setShowEditModal(false)
                  setSelectedAsset(null)
                }}
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
                  onClick={() => {
                    setShowEditModal(false)
                    setSelectedAsset(null)
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Asset History Modal */}
      {showHistory && selectedAsset && (
        <AssetHistoryModal 
          assetId={selectedAsset.id}
          onClose={() => {
            setShowHistory(false)
            setSelectedAsset(null)
          }}
          user={user}
        />
      )}
    </div>
  )
}

export default AssetList