import React, { useState } from 'react'

// SoftwareLicenses component for managing software license records
const SoftwareLicenses = ({ licenses, onAddLicense, onDeleteLicense, onRefresh }) => {
   // State to control visibility of the license form
  const [showForm, setShowForm] = useState(false)
   // State to manage form data for new license records
  const [formData, setFormData] = useState({
    name: '',
    vendor: '',
    license_key: '',
    purchase_date: '',
    expiry_date: '',
    cost: '',
    assigned_to: '',
    department: '',
    status: 'Active'
  })

   // Handle form submission for adding new license
  const handleSubmit = async (e) => {
    e.preventDefault()
    // Call parent function to add license and wait for result
    const success = await onAddLicense({
      ...formData,
      cost: parseFloat(formData.cost) || 0
    })
    
     // If successful, reset form and hide it
    if (success) {
      setFormData({
        name: '',
        vendor: '',
        license_key: '',
        purchase_date: '',
        expiry_date: '',
        cost: '',
        assigned_to: '',
        department: '',
        status: 'Active'
      })
      setShowForm(false)
    }
  }

  // Handle input changes in the form
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value // Update specific field based on input name
    })
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Software Licenses</h2>
        <div>
          <button className="btn" onClick={onRefresh} style={{ marginRight: '10px' }}>
            Refresh
          </button>
          <button className="btn btn-success" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : 'Add License'}
          </button>
        </div>
      </div>

      {showForm && (
        <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '6px', marginBottom: '20px' }}>
          <h3>Add Software License</h3>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div className="form-group">
                <label>Software Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Vendor *</label>
                <input
                  type="text"
                  name="vendor"
                  value={formData.vendor}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>License Key *</label>
                <input
                  type="text"
                  name="license_key"
                  value={formData.license_key}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Purchase Date *</label>
                <input
                  type="date"
                  name="purchase_date"
                  value={formData.purchase_date}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Expiry Date *</label>
                <input
                  type="date"
                  name="expiry_date"
                  value={formData.expiry_date}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Cost *</label>
                <input
                  type="number"
                  step="0.01"
                  name="cost"
                  value={formData.cost}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Assigned To</label>
                <input
                  type="text"
                  name="assigned_to"
                  value={formData.assigned_to}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label>Department</label>
                <input
                  type="text"
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label>Status *</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
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
                Add License
              </button>
            </div>
          </form>
        </div>
      )}

      {licenses.length === 0 ? (
        <div className="loading">No software licenses found</div>
      ) : (
        <table className="assets-table">
          <thead>
            <tr>
              <th>Software Name</th>
              <th>Vendor</th>
              <th>License Key</th>
              <th>Purchase Date</th>
              <th>Expiry Date</th>
              <th>Cost</th>
              <th>Assigned To</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {licenses.map(license => (
              <tr key={license.id}>
                <td>{license.name}</td>
                <td>{license.vendor}</td>
                <td style={{ fontFamily: 'monospace' }}>{license.license_key}</td>
                <td>{license.purchase_date}</td>
                <td>{license.expiry_date}</td>
                <td>${license.cost?.toFixed(2)}</td>
                <td>{license.assigned_to || '-'}</td>
                <td>
                  <span style={{
                    padding: '4px 8px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    backgroundColor: 
                      license.status === 'Active' ? '#d4edda' :
                      license.status === 'Expired' ? '#f8d7da' : '#fff3cd',
                    color: 
                      license.status === 'Active' ? '#155724' :
                      license.status === 'Expired' ? '#721c24' : '#856404'
                  }}>
                    {license.status}
                  </span>
                </td>
                <td>
                  <button 
                    className="btn" 
                    style={{ 
                      backgroundColor: '#dc3545', 
                      padding: '4px 8px', 
                      fontSize: '12px' 
                    }}
                    onClick={() => onDeleteLicense(license.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

export default SoftwareLicenses