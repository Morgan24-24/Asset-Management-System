import React, { useState } from 'react'

const Maintenance = ({ assets, maintenance, onAddMaintenance, onDeleteMaintenance, onRefresh }) => {
  // State to control visibility of the maintenance form
  const [showForm, setShowForm] = useState(false)
   // State to manage form data for new maintenance records
  const [formData, setFormData] = useState({
    asset_id: '',
    activity: '',
    cost: '',
    notes: ''
  })

  // Handle form submission for adding new maintenance record
  const handleSubmit = async (e) => {
    e.preventDefault()
     // Call parent function to add maintenance and wait for result
    const success = await onAddMaintenance({
      ...formData,
      cost: parseFloat(formData.cost) || 0
    })
    
    if (success) {
      setFormData({
        asset_id: '',
        activity: '',
        cost: '',
        notes: ''
      })
      setShowForm(false)
    }
  }

   // Handle input changes in the form
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Maintenance Records</h2>
        <div>
          <button className="btn" onClick={onRefresh} style={{ marginRight: '10px' }}>
            Refresh
          </button>
          <button className="btn btn-success" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : 'Add Maintenance'}
          </button>
        </div>
      </div>

      {showForm && (
        <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '6px', marginBottom: '20px' }}>
          <h3>Add Maintenance Record</h3>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div className="form-group">
                <label>Asset *</label>
                <select
                  name="asset_id"
                  value={formData.asset_id}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Asset</option>
                  {assets.map(asset => (
                    <option key={asset.id} value={asset.id}>
                      {asset.id} - {asset.brand} {asset.model}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Activity *</label>
                <input
                  type="text"
                  name="activity"
                  value={formData.activity}
                  onChange={handleChange}
                  placeholder="e.g., Hardware repair, Software update"
                  required
                />
              </div>

              <div className="form-group">
                <label>Cost</label>
                <input
                  type="number"
                  step="0.01"
                  name="cost"
                  value={formData.cost}
                  onChange={handleChange}
                  placeholder="0.00"
                />
              </div>

              <div className="form-group">
                <label>Notes</label>
                <input
                  type="text"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Additional details"
                />
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-success">
                Add Record
              </button>
            </div>
          </form>
        </div>
      )}

      {maintenance.length === 0 ? (
        <div className="loading">No maintenance records found</div>
      ) : (
        <table className="assets-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Asset ID</th>
              <th>Activity</th>
              <th>Cost</th>
              <th>Notes</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {maintenance.map(record => (
              <tr key={record.id}>
                <td>{new Date(record.date).toLocaleDateString()}</td>
                <td>
                  {assets.find(a => a.id === record.asset_id)?.id || record.asset_id}
                </td>
                <td>{record.activity}</td>
                <td>${record.cost?.toFixed(2) || '0.00'}</td>
                <td>{record.notes || '-'}</td>
                <td>
                  <button 
                    className="btn btn-danger btn-sm"
                    onClick={() => onDeleteMaintenance(record.id)}
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

export default Maintenance