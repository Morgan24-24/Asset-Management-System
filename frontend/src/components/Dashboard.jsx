import React, { useState, useEffect } from 'react'
import axiosInstance from '../api/axios'
import { 
  FiMonitor, 
  FiCheckCircle, 
  FiPackage, 
  FiTool, 
  FiFileText, 
  FiUsers,
  FiDollarSign,
  FiTrendingUp,
  FiAlertCircle,
  FiPlus,
  FiList,
  FiRefreshCw
} from 'react-icons/fi'

const Dashboard = ({ assets, maintenance, licenses, onNavigate, user }) => {
  const [summary, setSummary] = useState(null)
  const [assetStats, setAssetStats] = useState(null)
  const [recentActivities, setRecentActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    setRefreshing(true)
    try {
      const [summaryRes, statsRes, activitiesRes] = await Promise.all([
        axiosInstance.get('/report/summary'),
        axiosInstance.get('/report/asset-stats'),
        axiosInstance.get('/activities/recent?limit=5')
      ])
      
      setSummary(summaryRes.data)
      setAssetStats(statsRes.data)
      setRecentActivities(activitiesRes.data)
    } catch (err) {
      console.error('Error fetching dashboard data:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [assets, maintenance, licenses])

  // Calculate values from local data (fallback if API fails)
  const totalAssets = assets.length
  const activeAssets = assets.filter(asset => asset.status === "Active").length
  const availableAssets = assets.filter(asset => asset.status === "Available").length
  const underMaintenanceAssets = assets.filter(asset => asset.status === "Under Maintenance").length
  const retiredAssets = assets.filter(asset => asset.status === "Retired").length
  
  const totalLicenses = licenses.length
  const activeLicenses = licenses.filter(license => license.status === 'Active').length
  const expiredLicenses = licenses.filter(license => license.status === 'Expired').length

  const totalMaintenanceCost = maintenance.reduce((sum, record) => sum + (record.cost || 0), 0)
  const totalAssetCost = assets.reduce((sum, asset) => sum + (asset.cost || 0), 0)

  // Use API data if available, otherwise use calculated values
  const displaySummary = summary || {
    total_assets: totalAssets,
    active_assets: activeAssets,
    maintenance_assets: underMaintenanceAssets,
    available_assets: availableAssets,
    total_asset_cost: totalAssetCost,
    total_maintenance_cost: totalMaintenanceCost,
    total_users: 0,
    total_departments: 0
  }

  const handleRefresh = () => {
    fetchDashboardData()
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return '#28a745'
      case 'Available': return '#17a2b8'
      case 'Under Maintenance': return '#ffc107'
      case 'Retired': return '#6c757d'
      default: return '#6c757d'
    }
  }

  const getRoleBasedActions = () => {
    const actions = []
    
    if (user?.role !== 'Viewer') {
      actions.push({
        label: 'New Asset',
        icon: FiPlus,
        view: 'create',
        color: 'success'
      })
    }
    
    actions.push(
      {
        label: 'View Assets',
        icon: FiList,
        view: 'assets',
        color: 'primary'
      },
      {
        label: 'Maintenance',
        icon: FiTool,
        view: 'maintenance',
        color: user?.role !== 'Viewer' ? 'primary' : 'outline'
      },
      {
        label: 'Licenses',
        icon: FiFileText,
        view: 'licenses',
        color: 'primary'
      }
    )

    if (user?.role === 'Admin' || user?.role === 'Manager') {
      actions.push({
        label: 'Reports',
        icon: FiTrendingUp,
        view: 'reports',
        color: 'primary'
      })
    }

    return actions
  }

  if (loading) {
    return (
      <div className="card">
        <div className="card-body">
          <div className="loading">Loading dashboard...</div>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="header">
        <div>
          <h1>Dashboard Overview</h1>
          <p style={{ color: '#6c757d', margin: 0 }}>
            Welcome back, {user?.email || 'User'}! Here's your asset management overview.
          </p>
        </div>
        <button 
          className="btn btn-outline"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <FiRefreshCw size={16} className={refreshing ? 'loading-spinner' : ''} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        {/* Total Assets */}
        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-content">
              <h3>Total Assets</h3>
              <div className="stat-number">{displaySummary.total_assets}</div>
              <div className="stat-trend">All devices in inventory</div>
            </div>
            <div className="stat-icon" style={{ color: '#4361ee' }}>
              <FiMonitor size={24} />
            </div>
          </div>
        </div>

        {/* Active Assets */}
        <div className="stat-card success">
          <div className="stat-header">
            <div className="stat-content">
              <h3>Active Assets</h3>
              <div className="stat-number">{displaySummary.active_assets}</div>
              <div className="stat-trend">Currently in use</div>
            </div>
            <div className="stat-icon">
              <FiCheckCircle size={24} />
            </div>
          </div>
        </div>

        {/* Available Assets */}
        <div className="stat-card info">
          <div className="stat-header">
            <div className="stat-content">
              <h3>Available Assets</h3>
              <div className="stat-number">{displaySummary.available_assets}</div>
              <div className="stat-trend">Ready to deploy</div>
            </div>
            <div className="stat-icon">
              <FiPackage size={24} />
            </div>
          </div>
        </div>

        {/* Under Maintenance */}
        <div className="stat-card warning">
          <div className="stat-header">
            <div className="stat-content">
              <h3>Under Maintenance</h3>
              <div className="stat-number">{displaySummary.maintenance_assets}</div>
              <div className="stat-trend">Being serviced</div>
            </div>
            <div className="stat-icon">
              <FiTool size={24} />
            </div>
          </div>
        </div>

        {/* Software Licenses */}
        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-content">
              <h3>Software Licenses</h3>
              <div className="stat-number">{totalLicenses}</div>
              <div className="stat-trend">Total licenses</div>
            </div>
            <div className="stat-icon" style={{ color: '#6f42c1' }}>
              <FiFileText size={24} />
            </div>
          </div>
        </div>

        {/* Active Licenses */}
        <div className="stat-card success">
          <div className="stat-header">
            <div className="stat-content">
              <h3>Active Licenses</h3>
              <div className="stat-number">{activeLicenses}</div>
              <div className="stat-trend">Currently active</div>
            </div>
            <div className="stat-icon">
              <FiCheckCircle size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Cost Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-content">
              <h3>Total Asset Value</h3>
              <div className="stat-number">₵{displaySummary.total_asset_cost?.toFixed(2) || '0.00'}</div>
              <div className="stat-trend">Total investment</div>
            </div>
            <div className="stat-icon" style={{ color: '#28a745' }}>
              <FiDollarSign size={24} />
            </div>
          </div>
        </div>

        <div className="stat-card warning">
          <div className="stat-header">
            <div className="stat-content">
              <h3>Maintenance Cost</h3>
              <div className="stat-number">₵{displaySummary.total_maintenance_cost?.toFixed(2) || '0.00'}</div>
              <div className="stat-trend">Service expenses</div>
            </div>
            <div className="stat-icon">
              <FiDollarSign size={24} />
            </div>
          </div>
        </div>

        {/* Retired Assets */}
        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-content">
              <h3>Retired Assets</h3>
              <div className="stat-number">{retiredAssets}</div>
              <div className="stat-trend">No longer in use</div>
            </div>
            <div className="stat-icon" style={{ color: '#6c757d' }}>
              <FiAlertCircle size={24} />
            </div>
          </div>
        </div>

        {/* Expired Licenses */}
        <div className="stat-card warning">
          <div className="stat-header">
            <div className="stat-content">
              <h3>Expired Licenses</h3>
              <div className="stat-number">{expiredLicenses}</div>
              <div className="stat-trend">Need renewal</div>
            </div>
            <div className="stat-icon">
              <FiAlertCircle size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="dashboard-grid">
        {/* Quick Actions */}
        <div className="card">
          <div className="card-header">
            <h3>Quick Actions</h3>
          </div>
          <div className="card-body">
            {totalAssets === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#6c757d' }}>
                <FiPackage size={48} style={{ marginBottom: '20px', opacity: 0.5 }} />
                <p style={{ marginBottom: '20px' }}>
                  Welcome to AssetHub! Get started by adding your first assets, maintenance records, or licenses.
                </p>
                <div className="quick-actions">
                  <button 
                    className="btn btn-success" 
                    onClick={() => onNavigate('create')}
                  >
                    <FiPlus size={16} /> New Asset
                  </button>
                  <button 
                    className="btn btn-primary" 
                    onClick={() => onNavigate('maintenance')}
                  >
                    <FiTool size={16} /> Add Maintenance
                  </button>
                  <button 
                    className="btn btn-primary" 
                    onClick={() => onNavigate('licenses')}
                  >
                    <FiFileText size={16} /> Add License
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <p style={{ marginBottom: '20px' }}>
                  You have <strong>{totalAssets}</strong> assets and <strong>{totalLicenses}</strong> software licenses in your inventory.
                </p>
                <div className="quick-actions">
                  {getRoleBasedActions().map((action, index) => (
                    <button 
                      key={index}
                      className={`btn btn-${action.color}`}
                      onClick={() => onNavigate(action.view)}
                    >
                      <action.icon size={16} />
                      {action.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activities */}
        <div className="card">
          <div className="card-header">
            <h3>Recent Activities</h3>
          </div>
          <div className="card-body">
            {recentActivities.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px', color: '#6c757d' }}>
                <FiTrendingUp size={32} style={{ marginBottom: '10px', opacity: 0.5 }} />
                <p>No recent activities</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {recentActivities.map(activity => (
                  <div 
                    key={activity.id}
                    style={{
                      padding: '12px',
                      borderLeft: `4px solid ${getStatusColor(activity.action)}`,
                      background: '#f8f9fa',
                      borderRadius: '4px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontWeight: '600', color: '#2c3e50' }}>
                          {activity.user}
                        </div>
                        <div style={{ color: '#6c757d', fontSize: '0.9rem' }}>
                          {activity.description}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', fontSize: '0.8rem', color: '#6c757d' }}>
                        {new Date(activity.timestamp).toLocaleDateString()}
                        <br />
                        {new Date(activity.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                    {activity.asset_id && (
                      <div style={{ marginTop: '8px', fontSize: '0.8rem' }}>
                        <strong>Asset:</strong> {activity.asset_id}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Asset Statistics */}
      {assetStats && (
        <div className="card">
          <div className="card-header">
            <h3>Asset Statistics</h3>
          </div>
          <div className="card-body">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
              {/* By Department */}
              <div>
                <h4 style={{ marginBottom: '15px', color: '#2c3e50' }}>By Department</h4>
                {Object.entries(assetStats.by_department || {}).map(([dept, count]) => (
                  <div key={dept} style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    padding: '8px 0',
                    borderBottom: '1px solid #eaeaea'
                  }}>
                    <span style={{ color: '#6c757d' }}>{dept}</span>
                    <strong>{count}</strong>
                  </div>
                ))}
              </div>

              {/* By Type */}
              <div>
                <h4 style={{ marginBottom: '15px', color: '#2c3e50' }}>By Type</h4>
                {Object.entries(assetStats.by_type || {}).map(([type, count]) => (
                  <div key={type} style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    padding: '8px 0',
                    borderBottom: '1px solid #eaeaea'
                  }}>
                    <span style={{ color: '#6c757d' }}>{type}</span>
                    <strong>{count}</strong>
                  </div>
                ))}
              </div>

              {/* By Status */}
              <div>
                <h4 style={{ marginBottom: '15px', color: '#2c3e50' }}>By Status</h4>
                {Object.entries(assetStats.by_status || {}).map(([status, count]) => (
                  <div key={status} style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    padding: '8px 0',
                    borderBottom: '1px solid #eaeaea'
                  }}>
                    <span style={{ 
                      color: '#6c757d',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      <div style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: getStatusColor(status)
                      }}></div>
                      {status}
                    </span>
                    <strong>{count}</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard