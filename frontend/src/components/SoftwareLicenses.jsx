import React, { useState, useEffect } from 'react'
import axiosInstance from '../api/axios'
import { FiPlus, FiSave, FiX, FiFileText, FiCalendar, FiDollarSign, FiUser,  FiHome  } from 'react-icons/fi'

const SoftwareLicenses = ({ licenses, onAddLicense, onRefresh, user }) => {
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    vendor: '',
    license_key: '',
    purchase_date: '',
    expiry_date: '',
    cost: '0.00',
    assigned_to_id: '',
    department_id: '',
    status: 'Active'
  })
  const [dropdownData, setDropdownData] = useState({
    departments: [],
    users: []
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  // Fetch dropdown data
  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        const [departmentsRes, usersRes] = await Promise.all([
          axiosInstance.get('/departments'),
          axiosInstance.get('/admin/users') 
        ])
        
        setDropdownData({
          departments: departmentsRes.data,
          users: usersRes.data
        })
      } catch (err) {
        console.error('Failed to fetch dropdown data:', err)
      }
    }
    fetchDropdownData()
  }, [])

  // Handle form submission for adding new license
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      alert('Please fix the errors in the form before submitting.')
      return
    }

    const success = await onAddLicense({
      ...formData,
      cost: parseFloat(formData.cost) || 0
    })
    
    if (success) {
      setFormData({
        name: '',
        vendor: '',
        license_key: '',
        purchase_date: '',
        expiry_date: '',
        cost: '0.00',
        assigned_to_id: '',
        department_id: '',
        status: 'Active'
      })
      setShowForm(false)
      setErrors({})
    }
  }

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.name.trim()) newErrors.name = 'Software name is required'
    if (!formData.vendor.trim()) newErrors.vendor = 'Vendor is required'
    if (!formData.license_key.trim()) newErrors.license_key = 'License key is required'
    if (!formData.purchase_date) newErrors.purchase_date = 'Purchase date is required'
    if (!formData.expiry_date) newErrors.expiry_date = 'Expiry date is required'
    if (parseFloat(formData.cost) < 0) newErrors.cost = 'Cost cannot be negative'

    // Date validation
    if (formData.purchase_date && formData.expiry_date) {
      const purchaseDate = new Date(formData.purchase_date)
      const expiryDate = new Date(formData.expiry_date)
      if (expiryDate <= purchaseDate) {
        newErrors.expiry_date = 'Expiry date must be after purchase date'
      }
    }

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
      name: '',
      vendor: '',
      license_key: '',
      purchase_date: '',
      expiry_date: '',
      cost: '0.00',
      assigned_to_id: '',
      department_id: '',
      status: 'Active'
    })
    setErrors({})
  }

  const getCurrentDate = () => {
    return new Date().toISOString().split('T')[0]
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return { bg: '#d4edda', text: '#155724' }
      case 'Expired': return { bg: '#f8d7da', text: '#721c24' }
      case 'Renewed': return { bg: '#d1ecf1', text: '#0c5460' }
      default: return { bg: '#e9ecef', text: '#495057' }
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2>Software Licenses</h2>
          <p style={{ color: '#6c757d', margin: 0 }}>Manage software licenses and assignments</p>
        </div>
        <div>
          <button className="btn" onClick={onRefresh} style={{ marginRight: '10px' }}>
            Refresh
          </button>
          {user?.role !== 'Viewer' && (
            <button className="btn btn-success" onClick={() => setShowForm(!showForm)}>
              <FiPlus size={18} />
              {showForm ? 'Cancel' : 'Add License'}
            </button>
          )}
        </div>
      </div>

      {showForm && user?.role !== 'Viewer' && (
        <div className="card">
          <div className="card-header">
            <h3>
              <FiFileText size={20} style={{ marginRight: '10px' }} />
              Add Software License
            </h3>
          </div>
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Software Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={`form-control ${errors.name ? 'error' : ''}`}
                    placeholder="e.g., Microsoft Office 365, Adobe Creative Cloud"
                    required
                  />
                  {errors.name && (
                    <div className="error-message">{errors.name}</div>
                  )}
                </div>

                <div className="form-group">
                  <label>Vendor *</label>
                  <input
                    type="text"
                    name="vendor"
                    value={formData.vendor}
                    onChange={handleChange}
                    className={`form-control ${errors.vendor ? 'error' : ''}`}
                    placeholder="e.g., Microsoft, Adobe, Autodesk"
                    required
                  />
                  {errors.vendor && (
                    <div className="error-message">{errors.vendor}</div>
                  )}
                </div>

                <div className="form-group">
                  <label>License Key *</label>
                  <input
                    type="text"
                    name="license_key"
                    value={formData.license_key}
                    onChange={handleChange}
                    className={`form-control ${errors.license_key ? 'error' : ''}`}
                    placeholder="e.g., XXXXX-XXXXX-XXXXX-XXXXX-XXXXX"
                    required
                  />
                  {errors.license_key && (
                    <div className="error-message">{errors.license_key}</div>
                  )}
                </div>

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

                <div className="form-group">
                  <label>Expiry Date *</label>
                  <input
                    type="date"
                    name="expiry_date"
                    value={formData.expiry_date}
                    onChange={handleChange}
                    className={`form-control ${errors.expiry_date ? 'error' : ''}`}
                    min={formData.purchase_date || getCurrentDate()}
                    required
                  />
                  {errors.expiry_date && (
                    <div className="error-message">{errors.expiry_date}</div>
                  )}
                </div>

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

                <div className="form-group">
                  <label>Assigned To</label>
                  <select
                    name="assigned_to_id"
                    value={formData.assigned_to_id}
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
                    Select user if license is assigned to specific person
                  </small>
                </div>

                <div className="form-group">
                  <label>Department</label>
                  <select
                    name="department_id"
                    value={formData.department_id}
                    onChange={handleChange}
                    className="form-control"
                  >
                    <option value="">No Department</option>
                    {dropdownData.departments.map(dept => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name} ({dept.code})
                      </option>
                    ))}
                  </select>
                  <small style={{ color: '#6c757d', fontSize: '0.85rem' }}>
                    Department for organizational purposes
                  </small>
                </div>

                <div className="form-group">
                  <label>Status *</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="form-control"
                    required
                  >
                    <option value="Active">Active</option>
                    <option value="Expired">Expired</option>
                    <option value="Renewed">Renewed</option>
                  </select>
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" className="btn btn-success">
                  <FiSave size={18} />
                  Add License
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

      {/* Licenses List */}
      <div className="card">
        <div className="card-header">
          <h3>Software Licenses ({licenses.length})</h3>
        </div>
        <div className="card-body" style={{ padding: '0' }}>
          {licenses.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#6c757d' }}>
              <FiFileText size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
              <p>No software licenses found. Add your first license to get started!</p>
            </div>
          ) : (
            <table className="assets-table">
              <thead>
                <tr>
                  <th>Software Name</th>
                  <th>Vendor</th>
                  <th>License Key</th>
                  <th>Purchase Date</th>
                  <th>Expiry Date</th>
                  <th>Cost (₵)</th>
                  <th>Assigned To</th>
                  <th>Department</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {licenses.map(license => {
                  const statusColors = getStatusColor(license.status)
                  const assignedUser = dropdownData.users.find(user => user.id === license.assigned_to_id)
                  const department = dropdownData.departments.find(dept => dept.id === license.department_id)
                  
                  return (
                    <tr key={license.id}>
                      <td>
                        <strong>{license.name}</strong>
                      </td>
                      <td>{license.vendor}</td>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.9rem' }}>
                        {license.license_key}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <FiCalendar size={14} />
                          {license.purchase_date}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <FiCalendar size={14} />
                          {license.expiry_date}
                          {new Date(license.expiry_date) < new Date() && (
                            <span style={{ 
                              marginLeft: '6px',
                              padding: '2px 6px',
                              borderRadius: '8px',
                              fontSize: '10px',
                              fontWeight: 'bold',
                              backgroundColor: '#dc3545',
                              color: 'white'
                            }}>
                              EXPIRED
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <FiDollarSign size={14} />
                          <strong>₵{license.cost?.toFixed(2)}</strong>
                        </div>
                      </td>
                      <td>
                        {assignedUser ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <FiUser size={14} />
                            {assignedUser.email}
                          </div>
                        ) : (
                          <span style={{ color: '#6c757d' }}>Unassigned</span>
                        )}
                      </td>
                      <td>
                        {department ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <FiBuilding size={14} />
                            {department.name}
                          </div>
                        ) : (
                          <span style={{ color: '#6c757d' }}>-</span>
                        )}
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
                          {license.status}
                        </span>
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

export default SoftwareLicenses