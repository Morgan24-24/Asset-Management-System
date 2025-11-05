import React, { useState, useEffect } from 'react'
import axiosInstance from '../api/axios'
import { FiSave, FiX, FiHelpCircle } from 'react-icons/fi'

const AssetForm = ({ onSubmit, onCancel, user }) => {
  const [formData, setFormData] = useState({
    asset_type_id: '',
    brand_id: '',
    model: '',
    serial: '',
    purchase_date: '',
    cost: '',
    warranty_status: 'Active',
    status: 'Available',
    assignee_id: '',
    department_id: '',
    location: ''
  })

  const [dropdownData, setDropdownData] = useState({
    assetTypes: [],
    brands: [],
    departments: [],
    users: []
  })
  const [loading, setLoading] = useState(true)
  const [errors, setErrors] = useState({})
  const [generatedId, setGeneratedId] = useState('')

  // Fetch all dropdown data
  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        const [assetTypesRes, brandsRes, departmentsRes, usersRes] = await Promise.all([
          axiosInstance.get('/asset-types'),
          axiosInstance.get('/brands'),
          axiosInstance.get('/departments'),
          axiosInstance.get('/users/active')
        ])
        
        setDropdownData({
          assetTypes: assetTypesRes.data,
          brands: brandsRes.data,
          departments: departmentsRes.data,
          users: usersRes.data
        })
      } catch (err) {
        console.error('Failed to fetch dropdown data:', err)
        alert('Failed to load form data. Please refresh the page.')
      } finally {
        setLoading(false)
      }
    }
    fetchDropdownData()
  }, [])

  // Generate asset ID preview when department changes
  useEffect(() => {
    if (formData.department_id) {
      const department = dropdownData.departments.find(dept => dept.id == formData.department_id)
      if (department) {
        // In a real scenario, you'd get the next number from the backend
        setGeneratedId(`${department.code}-001`)
      }
    } else {
      setGeneratedId('')
    }
  }, [formData.department_id, dropdownData.departments])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.asset_type_id) newErrors.asset_type_id = 'Asset type is required'
    if (!formData.brand_id) newErrors.brand_id = 'Brand is required'
    if (!formData.model.trim()) newErrors.model = 'Model is required'
    if (!formData.serial.trim()) newErrors.serial = 'Serial number is required'
    if (!formData.purchase_date) newErrors.purchase_date = 'Purchase date is required'
    if (!formData.cost || parseFloat(formData.cost) <= 0) newErrors.cost = 'Valid cost is required'
    if (!formData.department_id) newErrors.department_id = 'Department is required'
    
    // Validate purchase date is not in the future
    if (formData.purchase_date) {
      const purchaseDate = new Date(formData.purchase_date)
      const today = new Date()
      if (purchaseDate > today) {
        newErrors.purchase_date = 'Purchase date cannot be in the future'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      alert('Please fix the errors in the form before submitting.')
      return
    }

    // Prepare data for submission
    const submitData = {
      ...formData,
      asset_type_id: parseInt(formData.asset_type_id),
      brand_id: parseInt(formData.brand_id),
      department_id: parseInt(formData.department_id),
      assignee_id: formData.assignee_id ? parseInt(formData.assignee_id) : null,
      cost: parseFloat(formData.cost),
      purchase_date: formData.purchase_date
    }

    const success = await onSubmit(submitData)
    if (success) {
      // Form will be closed by parent component
    }
  }

  const getCurrentDate = () => {
    return new Date().toISOString().split('T')[0]
  }

  if (loading) {
    return (
      <div className="card">
        <div className="card-body">
          <div className="loading">Loading form data...</div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="header">
        <h1>Add New Asset</h1>
        <p style={{ color: '#6c757d', margin: 0 }}>Create a new asset in the system</p>
      </div>

      <div className="card">
        <div className="card-header">
          <h3>
            <FiHelpCircle size={20} style={{ marginRight: '10px' }} />
            Asset Information
          </h3>
          {generatedId && (
            <div style={{ 
              background: '#e3f2fd', 
              padding: '8px 12px', 
              borderRadius: '6px',
              fontSize: '0.9rem',
              color: '#1976d2',
              fontWeight: '600'
            }}>
              Asset ID: <strong>{generatedId}</strong>
            </div>
          )}
        </div>
        
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              {/* Asset Type */}
              <div className="form-group">
                <label>Asset Type *</label>
                <select
                  name="asset_type_id"
                  value={formData.asset_type_id}
                  onChange={handleChange}
                  className={`form-control ${errors.asset_type_id ? 'error' : ''}`}
                  required
                >
                  <option value="">Select Asset Type</option>
                  {dropdownData.assetTypes.map(type => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>
                {errors.asset_type_id && (
                  <div className="error-message">{errors.asset_type_id}</div>
                )}
              </div>

              {/* Brand */}
              <div className="form-group">
                <label>Brand *</label>
                <select
                  name="brand_id"
                  value={formData.brand_id}
                  onChange={handleChange}
                  className={`form-control ${errors.brand_id ? 'error' : ''}`}
                  required
                >
                  <option value="">Select Brand</option>
                  {dropdownData.brands.map(brand => (
                    <option key={brand.id} value={brand.id}>
                      {brand.name}
                    </option>
                  ))}
                </select>
                {errors.brand_id && (
                  <div className="error-message">{errors.brand_id}</div>
                )}
              </div>

              {/* Model */}
              <div className="form-group">
                <label>Model *</label>
                <input
                  type="text"
                  name="model"
                  value={formData.model}
                  onChange={handleChange}
                  className={`form-control ${errors.model ? 'error' : ''}`}
                  placeholder="e.g., Latitude 5420, ProBook 450 G8"
                  required
                />
                {errors.model && (
                  <div className="error-message">{errors.model}</div>
                )}
              </div>

              {/* Serial Number */}
              <div className="form-group">
                <label>Serial Number *</label>
                <input
                  type="text"
                  name="serial"
                  value={formData.serial}
                  onChange={handleChange}
                  className={`form-control ${errors.serial ? 'error' : ''}`}
                  placeholder="e.g., SN123456789"
                  required
                />
                {errors.serial && (
                  <div className="error-message">{errors.serial}</div>
                )}
              </div>

              {/* Purchase Date */}
              <div className="form-group">
                <label>Purchase Date *</label>
                <input
                  type="date"
                  name="purchase_date"
                  value={formData.purchase_date}
                  onChange={handleChange}
                  className={`form-control ${errors.purchase_date ? 'error' : ''}`}
                  max={getCurrentDate()}
                  required
                />
                {errors.purchase_date && (
                  <div className="error-message">{errors.purchase_date}</div>
                )}
              </div>

              {/* Cost */}
              <div className="form-group">
                <label>Cost (₵) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  name="cost"
                  value={formData.cost}
                  onChange={handleChange}
                  className={`form-control ${errors.cost ? 'error' : ''}`}
                  placeholder="0.00"
                  required
                />
                {errors.cost && (
                  <div className="error-message">{errors.cost}</div>
                )}
              </div>

              {/* Warranty Status */}
              <div className="form-group">
                <label>Warranty Status *</label>
                <select
                  name="warranty_status"
                  value={formData.warranty_status}
                  onChange={handleChange}
                  className="form-control"
                  required
                >
                  <option value="Active">Active</option>
                  <option value="Expired">Expired</option>
                  <option value="No Warranty">No Warranty</option>
                </select>
              </div>

              {/* Status */}
              <div className="form-group">
                <label>Status *</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="form-control"
                  required
                >
                  <option value="Available">Available</option>
                  <option value="Active">Active</option>
                  <option value="Under Maintenance">Under Maintenance</option>
                  <option value="Retired">Retired</option>
                </select>
              </div>

              {/* Department */}
              <div className="form-group">
                <label>Department *</label>
                <select
                  name="department_id"
                  value={formData.department_id}
                  onChange={handleChange}
                  className={`form-control ${errors.department_id ? 'error' : ''}`}
                  required
                >
                  <option value="">Select Department</option>
                  {dropdownData.departments.map(dept => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name} ({dept.code})
                    </option>
                  ))}
                </select>
                {errors.department_id && (
                  <div className="error-message">{errors.department_id}</div>
                )}
                <small style={{ color: '#6c757d', fontSize: '0.85rem' }}>
                  Asset ID will be auto-generated based on department code
                </small>
              </div>

              {/* Assignee */}
              <div className="form-group">
                <label>Assignee</label>
                <select
                  name="assignee_id"
                  value={formData.assignee_id}
                  onChange={handleChange}
                  className="form-control"
                >
                  <option value="">Unassigned</option>
                  {dropdownData.users.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.email} ({user.role})
                    </option>
                  ))}
                </select>
                <small style={{ color: '#6c757d', fontSize: '0.85rem' }}>
                  Leave unassigned if asset is available
                </small>
              </div>

              {/* Location */}
              <div className="form-group">
                <label>Location</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  className="form-control"
                  placeholder="e.g., Building A, Floor 3, Room 101"
                />
              </div>
            </div>

            {/* Form Instructions */}
            <div style={{
              background: '#f8f9fa',
              padding: '15px',
              borderRadius: '6px',
              marginTop: '20px',
              borderLeft: '4px solid #4361ee'
            }}>
              <h4 style={{ margin: '0 0 10px 0', color: '#2c3e50' }}>
                <FiHelpCircle size={16} style={{ marginRight: '8px' }} />
                Form Instructions
              </h4>
              <ul style={{ margin: 0, paddingLeft: '20px', color: '#6c757d' }}>
                <li>All fields marked with * are required</li>
                <li>Asset ID will be automatically generated after submission</li>
                <li>Select "Unassigned" if the asset is not assigned to any user</li>
                <li>Purchase date cannot be in the future</li>
              </ul>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-success">
                <FiSave size={18} />
                Create Asset
              </button>
              <button type="button" className="btn btn-outline" onClick={onCancel}>
                <FiX size={18} />
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default AssetForm