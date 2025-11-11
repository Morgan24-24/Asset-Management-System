import React, { useState, useEffect } from 'react';
import axiosInstance from '../api/axios';

const PermissionsCheckbox = ({ selectedPermissions, onPermissionChange, userRole }) => {
  const [allPermissions, setAllPermissions] = useState([])
  const [loading, setLoading] = useState(true)

  // Fetch permissions from backend
  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const response = await axiosInstance.get('/permissions')
        setAllPermissions(response.data)
      } catch (err) {
        console.error('Failed to fetch permissions:', err)
        alert('Failed to load permissions. Please refresh the page.')
      } finally {
        setLoading(false)
      }
    }
    fetchPermissions()
  }, [])

  // Group permissions by category
  const groupedPermissions = allPermissions.reduce((acc, perm) => {
    if (!acc[perm.category]) {
      acc[perm.category] = []
    }
    acc[perm.category].push(perm)
    return acc
  }, {})

  // Preset permissions based on role (using names, then convert to IDs)
  const rolePresetNames = {
    Manager: [
      "view_assets", "create_assets", "edit_assets", "assign_assets", "transfer_assets",
      "view_reports", "generate_reports", "export_reports_pdf", "export_reports_excel",
      "view_departments", "view_maintenance", "create_maintenance", "view_activity_logs"
    ],
    Viewer: [
      "view_assets", "view_reports", "view_departments", "view_maintenance"
    ]
  };

  const handleRolePreset = (role) => {
    if (role && rolePresetNames[role]) {
      // Convert permission names to IDs
      const permissionIds = allPermissions
        .filter(p => rolePresetNames[role].includes(p.name))
        .map(p => p.id)
      onPermissionChange(permissionIds)
    }
  };

  const handlePermissionToggle = (permissionId, checked) => {
    if (checked) {
      onPermissionChange([...selectedPermissions, permissionId]);
    } else {
      onPermissionChange(selectedPermissions.filter(id => id !== permissionId));
    }
  };

  const isChecked = (permissionId) => selectedPermissions.includes(permissionId);

  if (loading) {
    return <div className="loading">Loading permissions...</div>
  }

  return (
    <div className="permissions-container">
      {/* Quick Role Presets */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ fontWeight: 'bold', marginBottom: '10px', display: 'block' }}>
          Quick Role Presets:
        </label>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => handleRolePreset('Manager')}
          >
            Apply Manager Preset
          </button>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => handleRolePreset('Viewer')}
          >
            Apply Viewer Preset
          </button>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => onPermissionChange([])}
          >
            Clear All
          </button>
        </div>
      </div>

      {/* Permissions Grid */}
      <div style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid #e0e0e0', borderRadius: '8px', padding: '15px' }}>
        {Object.entries(groupedPermissions).map(([category, perms]) => (
          <div key={category} style={{ marginBottom: '25px' }}>
            <h5 style={{ 
              padding: '8px 12px', 
              backgroundColor: '#f8f9fa', 
              borderRadius: '4px',
              marginBottom: '10px',
              borderLeft: '4px solid #007bff'
            }}>
              {category}
            </h5>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '10px' }}>
              {perms.map(permission => (
                <div key={permission.id} style={{
                  padding: '12px',
                  border: '1px solid #e0e0e0',
                  borderRadius: '6px',
                  backgroundColor: isChecked(permission.id) ? '#e8f5e8' : '#f9f9f9',
                  transition: 'all 0.2s'
                }}>
                  <label style={{ display: 'flex', alignItems: 'flex-start', cursor: 'pointer', margin: 0 }}>
                    <input
                      type="checkbox"
                      checked={isChecked(permission.id)}
                      onChange={(e) => handlePermissionToggle(permission.id, e.target.checked)}
                      style={{ marginRight: '10px', marginTop: '2px' }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>
                        {permission.name}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '4px' }}>
                        {permission.description}
                      </div>
                    </div>
                  </label>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Selected Permissions Summary */}
      <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
        <strong>Selected Permissions: </strong>
        {selectedPermissions.length > 0 ? (
          <span style={{ color: '#28a745' }}>
            {selectedPermissions.length} permission(s) selected
          </span>
        ) : (
          <span style={{ color: '#dc3545' }}>No permissions selected</span>
        )}
      </div>
    </div>
  );
};

export default PermissionsCheckbox;