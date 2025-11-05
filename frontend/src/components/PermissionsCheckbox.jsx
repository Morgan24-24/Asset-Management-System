import React from 'react';

const PermissionsCheckbox = ({ selectedPermissions, onPermissionChange, userRole }) => {
  // Define permissions by category
  const permissionCategories = {
    "Asset Management": [
      { id: "view_assets", name: "View Assets", description: "Can view assets" },
      { id: "create_assets", name: "Create Assets", description: "Can create new assets" },
      { id: "edit_assets", name: "Edit Assets", description: "Can edit existing assets" },
      { id: "delete_assets", name: "Delete Assets", description: "Can delete assets" },
      { id: "assign_assets", name: "Assign Assets", description: "Can assign assets to users" },
      { id: "transfer_assets", name: "Transfer Assets", description: "Can transfer assets between users" }
    ],
    "Maintenance": [
      { id: "view_maintenance", name: "View Maintenance", description: "Can view maintenance records" },
      { id: "create_maintenance", name: "Create Maintenance", description: "Can create maintenance records" },
      { id: "delete_maintenance", name: "Delete Maintenance", description: "Can delete maintenance records" }
    ],
    "Departments": [
      { id: "view_departments", name: "View Departments", description: "Can view departments" },
      { id: "create_departments", name: "Create Departments", description: "Can create departments" },
      { id: "edit_departments", name: "Edit Departments", description: "Can edit departments" },
      { id: "delete_departments", name: "Delete Departments", description: "Can delete departments" }
    ],
    "Reports": [
      { id: "view_reports", name: "View Reports", description: "Can view reports" },
      { id: "generate_reports", name: "Generate Reports", description: "Can generate reports" },
      { id: "export_reports_pdf", name: "Export PDF", description: "Can export reports as PDF" },
      { id: "export_reports_excel", name: "Export Excel", description: "Can export reports as Excel" },
      { id: "view_financial_reports", name: "View Financial Reports", description: "Can view financial reports" }
    ],
    "System": [
      { id: "view_activity_logs", name: "View Activity Logs", description: "Can view system activity logs" },
      { id: "manage_permissions", name: "Manage Permissions", description: "Can manage user permissions" },
      { id: "view_users", name: "View Users", description: "Can view other users" }
    ]
  };

  // Preset permissions based on role
  const rolePresets = {
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
    if (role && rolePresets[role]) {
      onPermissionChange(rolePresets[role]);
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
        {Object.entries(permissionCategories).map(([category, perms]) => (
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