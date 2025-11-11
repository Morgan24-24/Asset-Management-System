import React, { useState, useEffect } from 'react'
import axiosInstance from '../api/axios'
import { 
  FiX, 
  FiUser, 
  FiCalendar, 
  FiArrowRight,
  FiCheckCircle,
  FiAlertCircle,
  FiFileText,
  FiClock
} from 'react-icons/fi'

const AssetHistoryModal = ({ assetId, onClose, user }) => {
  const [history, setHistory] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchHistory()
  }, [assetId])

  const fetchHistory = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await axiosInstance.get(`/assets/${assetId}/history`)
      setHistory(response.data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to fetch assignment history')
    } finally {
      setLoading(false)
    }
  }

  // Format date for display
  const formatDate = (dateStr) => {
    if (!dateStr) return null
    return dateStr // Already formatted from backend
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '700px' }}>
        {/* Modal Header */}
        <div className="modal-header">
          <div>
            <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FiFileText size={24} />
              Assignment History
            </h2>
            <p style={{ margin: '5px 0 0 0', color: '#6c757d', fontSize: '0.9rem' }}>
              Asset ID: <strong>{assetId}</strong>
            </p>
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
        <div className="modal-body" style={{ maxHeight: '500px', overflowY: 'auto' }}>
          {loading && (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <div className="loading">Loading assignment history...</div>
            </div>
          )}

          {error && (
            <div className="alert alert-danger">
              {error}
            </div>
          )}

          {!loading && !error && history && (
            <>
              {/* VIEWER VIEW - Limited Access */}
              {!history.full_access && (
                <div>
                  <div className="alert" style={{ backgroundColor: '#fff3cd', borderColor: '#ffc107', color: '#856404' }}>
                    <FiAlertCircle size={18} style={{ marginRight: '8px' }} />
                    <strong>Limited Access:</strong> {history.message}
                  </div>
                  
                  <div style={{ 
                    padding: '20px', 
                    background: '#f8f9fa', 
                    borderRadius: '8px',
                    marginTop: '20px'
                  }}>
                    <h4 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <FiUser size={20} />
                      Current Assignment
                    </h4>
                    
                    {history.current_assignee ? (
                      <div style={{ 
                        padding: '15px', 
                        background: 'white', 
                        borderRadius: '6px',
                        borderLeft: '4px solid #28a745'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                          <FiCheckCircle size={18} color="#28a745" />
                          <span style={{ fontSize: '1.1rem', fontWeight: '600' }}>
                            {history.current_assignee}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.9rem', color: '#6c757d' }}>
                          Status: <strong style={{ color: '#28a745' }}>{history.status}</strong>
                        </div>
                      </div>
                    ) : (
                      <div style={{ 
                        padding: '15px', 
                        background: 'white', 
                        borderRadius: '6px',
                        borderLeft: '4px solid #17a2b8'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <FiAlertCircle size={18} color="#17a2b8" />
                          <span style={{ fontSize: '1rem', color: '#6c757d' }}>
                            Not currently assigned to anyone
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ADMIN/MANAGER VIEW - Full History */}
              {history.full_access && (
                <div>
                  {history.history.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#6c757d' }}>
                      <FiAlertCircle size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
                      <p>No assignment history found for this asset.</p>
                      <p style={{ fontSize: '0.9rem' }}>This asset has not been assigned to anyone yet.</p>
                    </div>
                  ) : (
                    <div style={{ position: 'relative' }}>
                      {/* Timeline Line */}
                      <div style={{
                        position: 'absolute',
                        left: '20px',
                        top: '30px',
                        bottom: '30px',
                        width: '2px',
                        background: '#e0e0e0'
                      }}></div>

                      {/* Timeline Items */}
                      {history.history.map((assignment, index) => (
                        <div 
                          key={assignment.id} 
                          style={{ 
                            position: 'relative',
                            paddingLeft: '50px',
                            marginBottom: '30px'
                          }}
                        >
                          {/* Timeline Dot */}
                          <div style={{
                            position: 'absolute',
                            left: '12px',
                            top: '20px',
                            width: '18px',
                            height: '18px',
                            borderRadius: '50%',
                            background: assignment.is_active ? '#28a745' : '#6c757d',
                            border: '3px solid white',
                            boxShadow: '0 0 0 2px ' + (assignment.is_active ? '#28a745' : '#6c757d')
                          }}></div>

                          {/* Assignment Card */}
                          <div style={{
                            padding: '20px',
                            background: assignment.is_active ? '#d4edda' : 'white',
                            border: '1px solid ' + (assignment.is_active ? '#28a745' : '#e0e0e0'),
                            borderRadius: '8px',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                          }}>
                            {/* Active Badge */}
                            {assignment.is_active && (
                              <div style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                                padding: '4px 10px',
                                background: '#28a745',
                                color: 'white',
                                borderRadius: '12px',
                                fontSize: '0.75rem',
                                fontWeight: 'bold',
                                marginBottom: '10px'
                              }}>
                                <FiCheckCircle size={12} />
                                CURRENT
                              </div>
                            )}

                            {/* Assignment Details */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                              <FiUser size={18} color="#007bff" />
                              <div>
                                <div style={{ fontSize: '1.05rem', fontWeight: '600', color: '#2c3e50' }}>
                                  Assigned to: {assignment.assigned_to}
                                </div>
                                <div style={{ fontSize: '0.85rem', color: '#6c757d' }}>
                                  by {assignment.assigned_by}
                                </div>
                              </div>
                            </div>

                            {/* Dates */}
                            <div style={{ 
                              display: 'grid', 
                              gridTemplateColumns: assignment.returned_date ? '1fr 1fr' : '1fr',
                              gap: '15px',
                              marginTop: '15px',
                              paddingTop: '15px',
                              borderTop: '1px solid rgba(0,0,0,0.1)'
                            }}>
                              {/* Assigned Date */}
                              <div>
                                <div style={{ 
                                  fontSize: '0.75rem', 
                                  color: '#6c757d', 
                                  textTransform: 'uppercase',
                                  fontWeight: 'bold',
                                  marginBottom: '5px'
                                }}>
                                  <FiCalendar size={12} style={{ marginRight: '5px' }} />
                                  Assigned
                                </div>
                                <div style={{ fontSize: '0.9rem', color: '#2c3e50' }}>
                                  {assignment.assigned_date}
                                </div>
                              </div>

                              {/* Returned Date */}
                              {assignment.returned_date && (
                                <div>
                                  <div style={{ 
                                    fontSize: '0.75rem', 
                                    color: '#6c757d', 
                                    textTransform: 'uppercase',
                                    fontWeight: 'bold',
                                    marginBottom: '5px'
                                  }}>
                                    <FiClock size={12} style={{ marginRight: '5px' }} />
                                    Returned
                                  </div>
                                  <div style={{ fontSize: '0.9rem', color: '#2c3e50' }}>
                                    {assignment.returned_date}
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Notes */}
                            {assignment.notes && (
                              <div style={{ 
                                marginTop: '15px',
                                paddingTop: '15px',
                                borderTop: '1px solid rgba(0,0,0,0.1)'
                              }}>
                                <div style={{ 
                                  fontSize: '0.75rem', 
                                  color: '#6c757d', 
                                  textTransform: 'uppercase',
                                  fontWeight: 'bold',
                                  marginBottom: '5px'
                                }}>
                                  <FiFileText size={12} style={{ marginRight: '5px' }} />
                                  Notes
                                </div>
                                <div style={{ 
                                  fontSize: '0.9rem', 
                                  color: '#2c3e50',
                                  fontStyle: 'italic',
                                  padding: '10px',
                                  background: 'rgba(0,0,0,0.05)',
                                  borderRadius: '4px'
                                }}>
                                  {assignment.notes}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
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

export default AssetHistoryModal