import React, { useState, useEffect } from 'react'
import { FaPlus, FaHistory, FaExchangeAlt, FaEye } from 'react-icons/fa'
import axiosInstance from '../api/axios'

const AssetList = ({ assets, loading, onRefresh, onNewAssetClick }) => {
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
      alert('Asset transferred successfully! Notification sent to the new assignee.')
      setShowTransfer(false)
      onRefresh() // Refresh the asset list
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
                  <th>Type</th>
                  <th>Brand</th>
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
                      <td>{asset.asset_type?.name || 'N/A'}</td>
                      <td>{asset.brand_obj?.name || 'N/A'}</td>
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
                            <div style={{ fontWeight: '600' }}>{asset.assignee.email}</div>
                            <div style={{ fontSize: '0.8rem', color: '#6c757d' }}>
                              Since: {new Date(asset.updated_at).toLocaleDateString()}
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
                          <button 
                            className="btn btn-sm btn-outline"
                            onClick={() => viewAssetHistory(asset)}
                            title="View assignment history"
                          >
                            <FaHistory size={12} />
                          </button>
                          
                          {asset.status !== 'Retired' && (
                            <button 
                              className="btn btn-sm btn-primary"
                              onClick={() => openTransferModal(asset)}
                              title="Transfer asset"
                            >
                              <FaExchangeAlt size={12} />
                            </button>
                          )}
                          
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
            maxWidth: '800px',
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
              <h3>Assignment History - {selectedAsset.id}</h3>
              <button 
                onClick={() => setShowHistory(false)}
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
              {assignmentHistory.length === 0 ? (
                <p>No assignment history found for this asset.</p>
              ) : (
                <table className="assets-table">
                  <thead>
                    <tr>
                      <th>Date Assigned</th>
                      <th>Assigned To</th>
                      <th>Assigned By</th>
                      <th>Returned Date</th>
                      <th>Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assignmentHistory.map(assignment => (
                      <tr key={assignment.id}>
                        <td>{new Date(assignment.assigned_date).toLocaleString()}</td>
                        <td>{assignment.assigned_to?.email || 'N/A'}</td>
                        <td>{assignment.assigned_by_user?.email || 'N/A'}</td>
                        <td>
                          {assignment.returned_date 
                            ? new Date(assignment.returned_date).toLocaleString()
                            : 'Currently assigned'
                          }
                        </td>
                        <td>{assignment.notes || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
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
                  {users.filter(user => user.id !== selectedAsset.assignee_id).map(user => (
                    <option key={user.id} value={user.id}>
                      {user.email} ({user.role})
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