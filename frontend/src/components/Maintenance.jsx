import React, { useState, useEffect } from 'react'
import axiosInstance from '../api/axios'
import { FiPlus, FiSave, FiX, FiTool, FiCalendar, FiDollarSign, FiFileText } from 'react-icons/fi'

const Maintenance = ({ assets, maintenance, onAddMaintenance, onRefresh, user }) => {
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    asset_id: '',
    activity: '',
    cost: '0.00',
    notes: ''
  })
  const [dropdownData, setDropdownData] = useState({
    assets: [],
    users: []
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  // Fetch dropdown data
  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        const [assetsRes, usersRes] = await Promise.all([
          axiosInstance.get('/assets'),
          axiosInstance.get('/admin/users') 
        ])
        
        setDropdownData({
          assets: assetsRes.data,
          users: usersRes.data
        })
      } catch (err) {
        console.error('Failed to fetch dropdown data:', err)
      }
    }
    fetchDropdownData()
  }, [])

  // Handle form submission for adding new maintenance record
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      alert('Please fix the errors in the form before submitting.')
      return
    }

    const success = await onAddMaintenance({
      ...formData,
      cost: parseFloat(formData.cost) || 0
    })
    
    if (success) {
      setFormData({
        asset_id: '',
        activity: '',
        cost: '0.00',
        notes: ''
      })
      setShowForm(false)
      setErrors({})
    }
  }

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.asset_id) newErrors.asset_id = 'Asset selection is required'
    if (!formData.activity.trim()) newErrors.activity = 'Activity description is required'
    if (parseFloat(formData.cost) < 0) newErrors.cost = 'Cost cannot be negative'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value
    })
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const handleCancel = () => {
    setShowForm(false)
    setFormData({
      asset_id: '',
      activity: '',
      cost: '0.00',
      notes: ''
    })
    setErrors({})
  }

  const getSelectedAsset = () => {
    return dropdownData.assets.find(asset => asset.id === formData.asset_id)
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2>Maintenance Records</h2>
          <p style={{ color: '#6c757d', margin: 0 }}>Track and manage asset maintenance activities</p>
        </div>
        <div>
          <button className="btn" onClick={onRefresh} style={{ marginRight: '10px' }}>
            Refresh
          </button>
          {user?.role !== 'Viewer' && (
            <button className="btn btn-success" onClick={() => setShowForm(!showForm)}>
              <FiPlus size={18} />
              {showForm ? 'Cancel' : 'Add Maintenance'}
            </button>
          )}
        </div>
      </div>

      {showForm && user?.role !== 'Viewer' && (
        <div className="card">
          <div className="card-header">
            <h3>
              <FiTool size={20} style={{ marginRight: '10px' }} />
              Add Maintenance Record
            </h3>
          </div>
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Asset *</label>
                  <select
                    name="asset_id"
                    value={formData.asset_id}
                    onChange={handleChange}
                    className={`form-control ${errors.asset_id ? 'error' : ''}`}
                    required
                  >
                    <option value="">Select Asset</option>
                    {dropdownData.assets
                      .filter(asset => asset.status !== 'Retired')
                      .map(asset => (
                        <option key={asset.id} value={asset.id}>
                          {asset.id} - {asset.brand_obj?.name} {asset.model} 
                          {asset.assignee && ` (Assigned to: ${asset.assignee.email})`}
                        </option>
                      ))
                    }
                  </select>
                  {errors.asset_id && (
                    <div className="error-message">{errors.asset_id}</div>
                  )}
                  {formData.asset_id && getSelectedAsset() && (
                    <div style={{ 
                      marginTop: '8px', 
                      padding: '8px', 
                      background: '#e3f2fd', 
                      borderRadius: '4px',
                      fontSize: '0.85rem'
                    }}>
                      <strong>Selected Asset:</strong> {getSelectedAsset().brand_obj?.name} {getSelectedAsset().model} | 
                      Serial: {getSelectedAsset().serial} | 
                      Status: <span style={{
                        padding: '2px 6px',
                        borderRadius: '8px',
                        fontSize: '0.75rem',
                        fontWeight: 'bold',
                        backgroundColor: getSelectedAsset().status === 'Active' ? '#d4edda' : '#fff3cd',
                        color: getSelectedAsset().status === 'Active' ? '#155724' : '#856404'
                      }}>{getSelectedAsset().status}</span>
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label>Activity Type *</label>
                  <select
                    name="activity"
                    value={formData.activity}
                    onChange={handleChange}
                    className={`form-control ${errors.activity ? 'error' : ''}`}
                    required
                  >
                    <option value="">Select Activity Type</option>
                    <option value="Hardware Repair">Hardware Repair</option>
                    <option value="Software Update">Software Update</option>
                    <option value="Preventive Maintenance">Preventive Maintenance</option>
                    <option value="Diagnostic Check">Diagnostic Check</option>
                    <option value="Component Replacement">Component Replacement</option>
                    <option value="Cleaning Service">Cleaning Service</option>
                    <option value="Calibration">Calibration</option>
                    <option value="Other">Other</option>
                  </select>
                  {errors.activity && (
                    <div className="error-message">{errors.activity}</div>
                  )}
                </div>

                <div className="form-group">
                  <label>Cost (₵)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    name="cost"
                    value={formData.cost}
                    onChange={handleChange}
                    className={`form-control ${errors.cost ? 'error' : ''}`}
                    placeholder="0.00"
                  />
                  {errors.cost && (
                    <div className="error-message">{errors.cost}</div>
                  )}
                </div>

                <div className="form-group">
                  <label>Notes & Details</label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    className="form-control"
                    placeholder="Describe the maintenance work performed, parts replaced, issues found..."
                    rows="3"
                  />
                  <small style={{ color: '#6c757d', fontSize: '0.85rem' }}>
                    Include details about the work performed and any recommendations
                  </small>
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" className="btn btn-success">
                  <FiSave size={18} />
                  Add Maintenance Record
                </button>
                <button type="button" className="btn btn-outline" onClick={handleCancel}>
                  <FiX size={18} />
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Maintenance Records List */}
      <div className="card">
        <div className="card-header">
          <h3>Maintenance History ({maintenance.length} records)</h3>
        </div>
        <div className="card-body" style={{ padding: '0' }}>
          {maintenance.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#6c757d' }}>
              <FiTool size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
              <p>No maintenance records found. Add your first maintenance record to get started!</p>
            </div>
          ) : (
            <table className="assets-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Asset</th>
                  <th>Activity</th>
                  <th>Cost (₵)</th>
                  <th>Technician</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {maintenance.map(record => {
                  const asset = dropdownData.assets.find(a => a.id === record.asset_id)
                  return (
                    <tr key={record.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <FiCalendar size={14} />
                          {new Date(record.date).toLocaleDateString()}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#6c757d' }}>
                          {new Date(record.date).toLocaleTimeString()}
                        </div>
                      </td>
                      <td>
                        {asset ? (
                          <div>
                            <strong>{asset.id}</strong>
                            <div style={{ fontSize: '0.8rem', color: '#6c757d' }}>
                              {asset.brand_obj?.name} {asset.model}
                            </div>
                          </div>
                        ) : (
                          <span style={{ color: '#6c757d' }}>Asset not found</span>
                        )}
                      </td>
                      <td>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          backgroundColor: '#e3f2fd',
                          color: '#1976d2'
                        }}>
                          {record.activity}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <FiDollarSign size={14} />
                          <strong>₵{record.cost?.toFixed(2) || '0.00'}</strong>
                        </div>
                      </td>
                      <td>
                        {record.technician ? (
                          <div style={{ fontSize: '0.9rem' }}>
                            {record.technician.email}
                          </div>
                        ) : (
                          <span style={{ color: '#6c757d' }}>System</span>
                        )}
                      </td>
                      <td>
                        {record.notes ? (
                          <div title={record.notes}>
                            <FiFileText size={14} />
                            <span style={{ marginLeft: '6px', fontSize: '0.9rem' }}>
                              {record.notes.length > 50 ? record.notes.substring(0, 50) + '...' : record.notes}
                            </span>
                          </div>
                        ) : (
                          <span style={{ color: '#6c757d' }}>-</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}

export default Maintenance