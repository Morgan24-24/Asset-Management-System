import React, { useEffect, useState } from 'react'
import axiosInstance from '../api/axios'
import { FiPlus, FiEdit2, FiTrash2, FiMapPin, FiPackage, FiUser, FiMail, FiPhone, FiHash } from 'react-icons/fi'

const Department = () => {
   // State for storing list of departments
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  // State to track which department is being edited (null for new departments)
  const [editingDept, setEditingDept] = useState(null)
  // State for form data
  const [formData, setFormData] = useState({
    name: '',
    code: '',  // Department Code(e.g., IT, HR)
    location: '',
    head_of_department: '',
    contact_email: '',
    contact_phone: ''
  })

  // Fetch departments from backend
  const fetchDepartments = async () => {
    setLoading(true)
    setError('')
    try {
       // Make API call to get all departments
      const response = await axiosInstance.get('/departments')
      setDepartments(response.data)
    } catch (err) {
      setError('Failed to fetch departments')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

   // Fetch departments when component mounts
  useEffect(() => {
    fetchDepartments()
  }, [])

  // Handle form submission (Create or Update)
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // Validate code format (uppercase letters only, 2-4 characters)
    const codeRegex = /^[A-Z]{2,4}$/
    if (!codeRegex.test(formData.code)) {
      setError('Department code must be 2-4 uppercase letters (e.g., IT, HR, FIN)')
      return
    }

    try {
      if (editingDept) {
        // Update existing department
        await axiosInstance.patch(`/departments/${editingDept.id}`, formData)
        alert('Department updated successfully!')
      } else {
        // Create new department
        await axiosInstance.post('/departments', formData)
        alert('Department created successfully!')
      }
      
      // Reset form and refresh list
      setFormData({ 
        name: '', 
        code: '',
        location: '', 
        head_of_department: '', 
        contact_email: '', 
        contact_phone: '' 
      })
      setEditingDept(null)
      setShowForm(false)
      fetchDepartments()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save department')
    }
  }

  // Handle edit button click
  const handleEdit = (dept) => {
    setEditingDept(dept)
    setFormData({
      name: dept.name,
      code: dept.code,
      location: dept.location || '',
      head_of_department: dept.head_of_department || '',
      contact_email: dept.contact_email || '',
      contact_phone: dept.contact_phone || ''
    })
    setShowForm(true)
  }

  // Handle delete
  const handleDelete = async (deptId, deptName) => {
    if (!window.confirm(`Are you sure you want to delete "${deptName}"?`)) {
      return
    }

    try {
      await axiosInstance.delete(`/departments/${deptId}`)
      alert('Department deleted successfully!')
      fetchDepartments()
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to delete department')
    }
  }

  // Cancel form
  const handleCancel = () => {
    setShowForm(false)
    setEditingDept(null)
    setFormData({ 
      name: '', 
      code: '',
      location: '', 
      head_of_department: '', 
      contact_email: '', 
      contact_phone: '' 
    })
    setError('')
  }

  if (loading) {
    return <div className="loading">Loading departments...</div>
  }

  return (
    <div>
      {/* Header */}
      <div className="header">
        <h1>Departments</h1>
        <button 
          className="btn btn-primary"
          onClick={() => setShowForm(true)}
        >
          <FiPlus size={18} /> Add Department
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="alert alert-danger">
          {error}
        </div>
      )}

      {/* Add/Edit Form */}
      {showForm && (
        <div className="card">
          <div className="card-header">
            <h3>{editingDept ? 'Edit Department' : 'Add New Department'}</h3>
          </div>
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Department Name *</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., IT Department, Finance, HR"
                  required
                />
              </div>

              <div className="form-group">
                <label>Department Code *</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="e.g., IT, HR, FIN, OPS"
                  maxLength={4}
                  style={{ textTransform: 'uppercase' }}
                  required
                />
                <small style={{ color: '#6c757d', fontSize: '0.85rem' }}>
                  2-4 uppercase letters. This will be used for asset IDs (e.g., IT-001)
                </small>
              </div>

              <div className="form-group">
                <label>Location</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g., Building A, Floor 3"
                />
              </div>

              <div className="form-group">
                <label>Head of Department</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.head_of_department}
                  onChange={(e) => setFormData({ ...formData, head_of_department: e.target.value })}
                  placeholder="e.g., John Mensah"
                />
              </div>

              <div className="form-group">
                <label>Contact Email</label>
                <input
                  type="email"
                  className="form-control"
                  value={formData.contact_email}
                  onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                  placeholder="e.g., finance@company.com"
                />
              </div>

              <div className="form-group">
                <label>Contact Phone</label>
                <input
                  type="tel"
                  className="form-control"
                  value={formData.contact_phone}
                  onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                  placeholder="e.g., +233 24 123 4567"
                />
              </div>

              <div className="form-actions">
                <button type="submit" className="btn btn-success">
                  {editingDept ? 'Update Department' : 'Create Department'}
                </button>
                <button 
                  type="button" 
                  className="btn btn-outline"
                  onClick={handleCancel}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Departments List */}
      <div className="card">
        <div className="card-header">
          <h3>All Departments ({departments.length})</h3>
        </div>
        <div className="card-body">
          {departments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#6c757d' }}>
              <FiPackage size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
              <p>No departments found. Create your first department to get started!</p>
              <button 
                className="btn btn-primary"
                onClick={() => setShowForm(true)}
                style={{ marginTop: '16px' }}
              >
                <FiPlus size={18} /> Create Department
              </button>
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Department Name</th>
                  <th>Location</th>
                  <th>Head of Department</th>
                  <th>Contact</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {departments.map((dept) => (
                  <tr key={dept.id}>
                    <td>
                      <span style={{ 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        gap: '6px',
                        padding: '4px 8px',
                        background: '#e3f2fd',
                        borderRadius: '4px',
                        fontWeight: 'bold',
                        color: '#1976d2'
                      }}>
                        <FiHash size={14} />
                        {dept.code}
                      </span>
                    </td>
                    <td>
                      <strong>{dept.name}</strong>
                    </td>
                    <td>
                      {dept.location ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <FiMapPin size={14} />
                          {dept.location}
                        </span>
                      ) : (
                        <span style={{ color: '#999' }}>—</span>
                      )}
                    </td>
                    <td>
                      {dept.head_of_department ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <FiUser size={14} />
                          {dept.head_of_department}
                        </span>
                      ) : (
                        <span style={{ color: '#999' }}>—</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.9rem' }}>
                        {dept.contact_email && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <FiMail size={12} />
                            {dept.contact_email}
                          </span>
                        )}
                        {dept.contact_phone && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <FiPhone size={12} />
                            {dept.contact_phone}
                          </span>
                        )}
                        {!dept.contact_email && !dept.contact_phone && (
                          <span style={{ color: '#999' }}>—</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button 
                          className="btn btn-sm btn-outline"
                          onClick={() => handleEdit(dept)}
                          title="Edit department"
                        >
                          <FiEdit2 size={16} />
                        </button>
                        <button 
                          className="btn btn-sm btn-danger"
                          onClick={() => handleDelete(dept.id, dept.name)}
                          title="Delete department"
                        >
                          <FiTrash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}

export default Department