import React, { useState, useEffect } from 'react'
import axiosInstance from '../api/axios'
import { FiX, FiPackage, FiDollarSign, FiTrendingUp, FiEdit2, FiTrash2 } from 'react-icons/fi'
import { formatCurrency, formatNumber } from '../utils/formatters'

const DepartmentAssetsModal = ({ 
  departmentId, 
  departmentName, 
  department,
  onClose, 
  onEdit, 
  onDelete, 
  userRole 
}) => {
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
    <div 
      className="modal-overlay" 
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        backdropFilter: 'blur(4px)'
      }}
    >
      <div 
        className="modal" 
        onClick={(e) => e.stopPropagation()} 
        style={{ 
          maxWidth: '1100px', 
          width: '95%',
          maxHeight: '85vh',
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* Modal Header - Fixed */}
        <div 
          className="modal-header" 
          style={{
            padding: '25px 30px',
            borderBottom: '2px solid #e0e0e0',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            flexShrink: 0
          }}
        >
          <div>
            <h2 style={{ 
              margin: 0, 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px',
              fontSize: '1.5rem',
              fontWeight: '700'
            }}>
              <FiPackage size={28} />
              {departmentName}
            </h2>
            {data && (
              <p style={{ margin: '8px 0 0 0', fontSize: '0.95rem', opacity: 0.9 }}>
                {formatNumber(data.total_assets, 0)} total assets • {formatNumber(data.active_assets, 0)} active • {formatCurrency(data.total_cost)}
              </p>
            )}
          </div>
          <button 
            onClick={onClose}
            style={{ 
              background: 'rgba(255, 255, 255, 0.2)', 
              border: 'none', 
              fontSize: '28px', 
              cursor: 'pointer',
              color: 'white',
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
          >
            <FiX />
          </button>
        </div>

        {/* Modal Body - Scrollable */}
        <div 
          className="modal-body" 
          style={{ 
            padding: '30px',
            overflowY: 'auto',
            flex: 1
          }}
        >
          {loading && (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
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
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '20px',
                marginBottom: '30px'
              }}>
                <div className="stat-card">
                  <div className="stat-header">
                    <div className="stat-content">
                      <h3>Total Assets</h3>
                      <div className="stat-number">{formatNumber(data.total_assets, 0)}</div>
                      <div className="stat-trend">In this department</div>
                    </div>
                    <div className="stat-icon"><FiPackage size={24} /></div>
                  </div>
                </div>

                <div className="stat-card success">
                  <div className="stat-header">
                    <div className="stat-content">
                      <h3>Active</h3>
                      <div className="stat-number">{formatNumber(data.active_assets, 0)}</div>
                      <div className="stat-trend">Currently in use</div>
                    </div>
                    <div className="stat-icon"><FiTrendingUp size={24} /></div>
                  </div>
                </div>

                <div className="stat-card info">
                  <div className="stat-header">
                    <div className="stat-content">
                      <h3>Total Value</h3>
                      <div className="stat-number" style={{ fontSize: '1.8rem' }}>
                        {formatCurrency(data.total_cost)}
                      </div>
                      <div className="stat-trend">Asset investment</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Assets Table */}
              {data.assets.length === 0 ? (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '60px 20px', 
                  color: '#6c757d',
                  background: '#f8f9fa',
                  borderRadius: '8px'
                }}>
                  <FiPackage size={64} style={{ marginBottom: '20px', opacity: 0.3 }} />
                  <h3>No Assets Found</h3>
                  <p>This department doesn't have any assets assigned yet.</p>
                </div>
              ) : (
                <div style={{ 
                  background: 'white',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  border: '1px solid #e0e0e0'
                }}>
                  <div style={{ overflowX: 'auto' }}>
                    <table className="table" style={{ marginBottom: 0 }}>
                      <thead>
                        <tr>
                          <th>Asset ID</th>
                          <th>Type</th>
                          <th>Brand</th>
                          <th>Model</th>
                          <th>Serial</th>
                          <th>Status</th>
                          <th>Assignee</th>
                          <th style={{ textAlign: 'right' }}>Cost</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.assets.map((asset) => {
                          const statusColors = getStatusColor(asset.status)
                          return (
                            <tr key={asset.id}>
                              <td>
                                <strong style={{ 
                                  fontFamily: 'monospace', 
                                  color: '#007bff',
                                  fontSize: '0.95rem'
                                }}>
                                  {asset.id}
                                </strong>
                              </td>
                              <td>{asset.asset_type?.name || 'N/A'}</td>
                              <td>{asset.brand_obj?.name || 'N/A'}</td>
                              <td style={{ fontWeight: '500' }}>{asset.model}</td>
                              <td style={{ 
                                fontFamily: 'monospace', 
                                fontSize: '0.85rem', 
                                color: '#6c757d' 
                              }}>
                                {asset.serial}
                              </td>
                              <td>
                                <span style={{
                                  padding: '5px 12px',
                                  borderRadius: '12px',
                                  fontSize: '0.75rem',
                                  fontWeight: 'bold',
                                  backgroundColor: statusColors.bg,
                                  color: statusColors.text,
                                  display: 'inline-block'
                                }}>
                                  {asset.status}
                                </span>
                              </td>
                              <td>
                                {asset.assignee ? (
                                  <span style={{ fontSize: '0.9rem' }}>
                                    {asset.assignee.display_name || asset.assignee.email.split('@')[0]}
                                  </span>
                                ) : (
                                  <span style={{ color: '#999', fontStyle: 'italic' }}>Unassigned</span>
                                )}
                              </td>
                              <td style={{ textAlign: 'right' }}>
                                <strong style={{ color: '#2c3e50' }}>
                                  {formatCurrency(asset.cost)}
                                </strong>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer - Fixed with Action Buttons */}
        <div 
          className="modal-footer"
          style={{
            padding: '20px 30px',
            borderTop: '1px solid #e0e0e0',
            background: '#f8f9fa',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexShrink: 0,
            gap: '10px'
          }}
        >
          {/* Left side: Edit & Delete buttons (Admin only) */}
          <div style={{ display: 'flex', gap: '10px' }}>
            {userRole === 'Admin' && (
              <>
                <button 
                  className="btn btn-outline"
                  onClick={(e) => {
                    onEdit(department, e)
                    onClose()
                  }}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <FiEdit2 size={16} />
                  Edit Department
                </button>
                <button 
                  className="btn btn-danger"
                  onClick={(e) => {
                    onDelete(departmentId, departmentName, e)
                    onClose()
                  }}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <FiTrash2 size={16} />
                  Delete
                </button>
              </>
            )}
          </div>

          {/* Right side: Close button */}
          <button className="btn btn-outline" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div> 
  )
}

export default DepartmentAssetsModal