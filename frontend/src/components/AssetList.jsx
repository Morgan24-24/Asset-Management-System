import React, { useState } from 'react'
import { FaPlus } from 'react-icons/fa'

const AssetList = ({ assets, loading, onDelete, onRefresh, onNewAssetClick }) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

   // Filter assets based on search term and filter criteria
  const filteredAssets = assets.filter(asset => {
     // Check if asset matches search term in any relevant field
    const matchesSearch = searchTerm === '' || 
      asset.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.serial.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (asset.assignee && asset.assignee.toLowerCase().includes(searchTerm.toLowerCase()))

      // Check if asset matches selected type filter
    const matchesType = filterType === '' || asset.type === filterType
    // Check if asset matches selected status filter
    const matchesStatus = filterStatus === '' || asset.status === filterStatus

    return matchesSearch && matchesType && matchesStatus
  })

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
            <FaPlus style={{ marginRight: '5px' }} /> {/* Optional: Add icon */}
            New Asset
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '10px', marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="Search assets..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px' }}
        />
        <select 
          value={filterType} 
          onChange={(e) => setFilterType(e.target.value)}
          style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px' }}
        >
          <option value="">All Types</option>
          <option value="Laptop">Laptop</option>
          <option value="Desktop">Desktop</option>
          <option value="Monitor">Monitor</option>
          <option value="Printer">Printer</option>
          <option value="Server">Server</option>
        </select>
        <select 
          value={filterStatus} 
          onChange={(e) => setFilterStatus(e.target.value)}
          style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px' }}
        >
          <option value="">All Status</option>
          <option value="Deployed">Deployed</option>
          <option value="Available">Available</option>
          <option value="Under Repair">Under Repair</option>
          <option value="Retired">Retired</option>
        </select>
      </div>

      {filteredAssets.length === 0 ? (
        <div className="loading">No assets found</div>
      ) : (
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
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredAssets.map(asset => (
              <tr key={asset.id}>
                <td>{asset.id}</td>
                <td>{asset.type}</td>
                <td>{asset.brand}</td>
                <td>{asset.model}</td>
                <td>{asset.serial}</td>
                <td>
                  <span style={{
                    padding: '4px 8px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    backgroundColor: 
                      asset.status === 'Deployed' ? '#d4edda' :
                      asset.status === 'Available' ? '#d1ecf1' :
                      asset.status === 'Under Repair' ? '#fff3cd' : '#f8d7da',
                    color: 
                      asset.status === 'Deployed' ? '#155724' :
                      asset.status === 'Available' ? '#0c5460' :
                      asset.status === 'Under Repair' ? '#856404' : '#721c24'
                  }}>
                    {asset.status}
                  </span>
                </td>
                <td>{asset.assignee || 'Unassigned'}</td>
                <td>
                  <button 
                        className="btn btn-danger btn-sm"
                        onClick={() => onDelete(asset.id)}
                        title="Delete asset"
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

export default AssetList