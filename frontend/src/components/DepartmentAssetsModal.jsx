import React, { useState, useEffect } from 'react'
import axiosInstance from '../api/axios'
import { FiX, FiPackage, FiDollarSign, FiTrendingUp } from 'react-icons/fi'

const DepartmentAssetsModal = ({ departmentId, departmentName, onClose }) => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchDepartmentAssets()
  }, [departmentId])

  const fetchDepartmentAssets = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await axiosInstance.get(`/departments/${departmentId}/assets`)
      setData(response.data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to fetch department assets')
    } finally {
      setLoading(false)
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

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()} 
        style={{ maxWidth: '1000px', width: '95%' }}
      >
        {/* Modal Header */}
        <div className="modal-header">
          <div>
            <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FiPackage size={24} />
              {departmentName} - Assets
            </h2>
            {data && (
              <p style={{ margin: '5px 0 0 0', color: '#6c757d', fontSize: '0.9rem' }}>
                {data.total_assets} total assets • {data.active_assets} active
              </p>
            )}
          </div>
          <button 
            onClick={onClose}
            style={{ 
              background: 'none', 
              border: 'none', 
              fontSize: '24px', 
              cursor: 'pointer',
              color: '#6c757d'
            }}
          >
            <FiX />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body" style={{ maxHeight: '600px', overflowY: 'auto' }}>
          {loading && (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <div className="loading">Loading department assets...</div>
            </div>
          )}

          {error && (
            <div className="alert alert-danger">
              {error}
            </div>
          )}

          {!loading && !error && data && (
            <>
              {/* Summary Cards */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '15px',
                marginBottom: '20px'
              }}>
                <div className="stat-card">
                  <div className="stat-content">
                    <h4 style={{ margin: 0, fontSize: '0.9rem', color: '#6c757d' }}>Total Assets</h4>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#2c3e50' }}>
                      {data.total_assets}
                    </div>
                  </div>
                </div>

                <div className="stat-card success">
                  <div className="stat-content">
                    <h4 style={{ margin: 0, fontSize: '0.9rem', color: '#6c757d' }}>Active</h4>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#28a745' }}>
                      {data.active_assets}
                    </div>
                  </div>
                </div>

                <div className="stat-card info">
                  <div className="stat-content">
                    <h4 style={{ margin: 0, fontSize: '0.9rem', color: '#6c757d' }}>Total Value</h4>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#17a2b8' }}>
                      ₵{data.total_cost?.toLocaleString() || 0}
                    </div>
                  </div>
                </div>
              </div>

              {/* Assets Table */}
              {data.assets.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#6c757d' }}>
                  <FiPackage size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
                  <p>No assets found in this department.</p>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Asset ID</th>
                        <th>Type</th>
                        <th>Brand</th>
                        <th>Model</th>
                        <th>Serial</th>
                        <th>Status</th>
                        <th>Assignee</th>
                        <th>Cost</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.assets.map((asset) => {
                        const statusColors = getStatusColor(asset.status)
                        return (
                          <tr key={asset.id}>
                            <td>
                              <strong style={{ fontFamily: 'monospace', color: '#007bff' }}>
                                {asset.id}
                              </strong>
                            </td>
                            <td>{asset.asset_type?.name || 'N/A'}</td>
                            <td>{asset.brand_obj?.name || 'N/A'}</td>
                            <td>{asset.model}</td>
                            <td style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: '#6c757d' }}>
                              {asset.serial}
                            </td>
                            <td>
                              <span style={{
                                padding: '4px 10px',
                                borderRadius: '12px',
                                fontSize: '0.75rem',
                                fontWeight: 'bold',
                                backgroundColor: statusColors.bg,
                                color: statusColors.text
                              }}>
                                {asset.status}
                              </span>
                            </td>
                            <td>
                              {asset.assignee ? (
                                <span style={{ fontSize: '0.9rem' }}>
                                  {asset.assignee.email.split('@')[0]}
                                </span>
                              ) : (
                                <span style={{ color: '#999' }}>Unassigned</span>
                              )}
                            </td>
                            <td>
                              <strong>₵{asset.cost?.toLocaleString() || 0}</strong>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="modal-footer">
          <button className="btn btn-outline" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div> 
  )
}

export default DepartmentAssetsModal