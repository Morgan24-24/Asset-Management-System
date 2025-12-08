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
import { formatCurrency, formatNumber } from '../utils/formatters'
import DashboardStatsModal from './DashboardStatsModal'
import './DashboardStatsModal.css' // Ensure CSS is imported if needed for the clickable class

const Dashboard = ({ assets, maintenance, licenses, onNavigate, user }) => {
  const [summary, setSummary] = useState(null)
  const [assetStats, setAssetStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedCardType, setSelectedCardType] = useState(null)

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    setRefreshing(true)
    try {
      const [summaryRes, statsRes] = await Promise.all([
        axiosInstance.get('/report/summary'),
        axiosInstance.get('/report/asset-stats'),
      ])
      
      setSummary(summaryRes.data)
      setAssetStats(statsRes.data)
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
 const displaySummary = {
  total_assets: totalAssets,
  active_assets: activeAssets,
  maintenance_assets: underMaintenanceAssets,
  available_assets: availableAssets,
  total_asset_cost: totalAssetCost,
  total_maintenance_cost: totalMaintenanceCost,
  total_users: summary?.total_users || 0,
  total_departments: summary?.total_departments || 0
}

  const handleRefresh = () => {
    fetchDashboardData()
  }

  // Handle stat card click
  const handleCardClick = (cardType) => {
    setSelectedCardType(cardType)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedCardType(null)
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
  <div style={{ paddingTop: '20px' }}>
    {/* Stats Grid */}
    <div className="stats-grid">
      {/* Total Assets */}
      <div 
        className="stat-card clickable-card" 
        onClick={() => handleCardClick('total_assets')}
        style={{ cursor: 'pointer' }}
      >
        <div className="stat-header">
          <div className="stat-content">
            <h3>Total Assets</h3>
            <div className="stat-number">{formatNumber(displaySummary.total_assets, 0)}</div>
            <div className="stat-trend">All devices in inventory</div>
          </div>
          <div className="stat-icon" style={{ color: '#4361ee' }}>
            <FiMonitor size={24} />
          </div>
        </div>
      </div>

      {/* Active Assets */}
      <div 
        className="stat-card success clickable-card"
        onClick={() => handleCardClick('active_assets')}
        style={{ cursor: 'pointer' }}
      >
        <div className="stat-header">
          <div className="stat-content">
            <h3>Active Assets</h3>
            <div className="stat-number">{formatNumber(displaySummary.active_assets, 0)}</div>
            <div className="stat-trend">Currently in use</div>
          </div>
          <div className="stat-icon">
            <FiCheckCircle size={24} />
          </div>
        </div>
      </div>

      {/* Available Assets */}
      <div 
        className="stat-card info clickable-card"
        onClick={() => handleCardClick('available_assets')}
        style={{ cursor: 'pointer' }}
      >
        <div className="stat-header">
          <div className="stat-content">
            <h3>Available Assets</h3>
            <div className="stat-number">{formatNumber(displaySummary.available_assets, 0)}</div>
            <div className="stat-trend">Ready to deploy</div>
          </div>
          <div className="stat-icon">
            <FiPackage size={24} />
          </div>
        </div>
      </div>

      {/* Under Maintenance */}
      <div 
        className="stat-card warning clickable-card"
        onClick={() => handleCardClick('under_maintenance')}
        style={{ cursor: 'pointer' }}
      >
        <div className="stat-header">
          <div className="stat-content">
            <h3>Under Maintenance</h3>
            <div className="stat-number">{formatNumber(displaySummary.maintenance_assets, 0)}</div>
            <div className="stat-trend">Being serviced</div>
          </div>
          <div className="stat-icon">
            <FiTool size={24} />
          </div>
        </div>
      </div>

      {/* Software Licenses - NOW ACTIVE */}
      <div 
        className="stat-card clickable-card"
        onClick={() => handleCardClick('total_licenses')}
        style={{ cursor: 'pointer' }}
      >
        <div className="stat-header">
          <div className="stat-content">
            <h3>Software Licenses</h3>
            <div className="stat-number">{formatNumber(totalLicenses, 0)}</div>
            <div className="stat-trend">Total licenses</div>
          </div>
          <div className="stat-icon" style={{ color: '#6f42c1' }}>
            <FiFileText size={24} />
          </div>
        </div>
      </div>

      {/* Active Licenses - NOW ACTIVE */}
      <div 
        className="stat-card success clickable-card"
        onClick={() => handleCardClick('active_licenses')}
        style={{ cursor: 'pointer' }}
      >
        <div className="stat-header">
          <div className="stat-content">
            <h3>Active Licenses</h3>
            <div className="stat-number">{formatNumber(activeLicenses, 0)}</div>
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
      {/* Total Asset Cost */}
      <div 
        className="stat-card clickable-card"
        onClick={() => handleCardClick('total_cost')}
        style={{ cursor: 'pointer' }}
      >
        <div className="stat-header">
          <div className="stat-content">
            <h3>Total Asset Value</h3>
            <div className="stat-number">{formatCurrency(displaySummary.total_asset_cost)}</div>
            <div className="stat-trend">Total investment</div>
          </div>
        </div>
      </div>

      {/* Maintenance Cost - NOW ACTIVE */}
      <div 
        className="stat-card warning clickable-card"
        onClick={() => handleCardClick('maintenance_cost')}
        style={{ cursor: 'pointer' }}
      >
        <div className="stat-header">
          <div className="stat-content">
            <h3>Maintenance Cost</h3>
            <div className="stat-number">{formatCurrency(displaySummary.total_maintenance_cost)}</div>
            <div className="stat-trend">Service expenses</div>
          </div>
        </div>
      </div>

      {/* Retired Assets */}
      <div 
        className="stat-card clickable-card"
        onClick={() => handleCardClick('retired_assets')}
        style={{ cursor: 'pointer' }}
      >
        <div className="stat-header">
          <div className="stat-content">
            <h3>Retired Assets</h3>
            <div className="stat-number">{formatNumber(retiredAssets, 0)}</div>
            <div className="stat-trend">No longer in use</div>
          </div>
          <div className="stat-icon" style={{ color: '#6c757d' }}>
            <FiAlertCircle size={24} />
          </div>
        </div>
      </div>

      {/* Expired Licenses */}
      <div 
        className="stat-card warning clickable-card"
        onClick={() => handleCardClick('expired_licenses')}
        style={{ cursor: 'pointer' }}
      >
        <div className="stat-header">
          <div className="stat-content">
            <h3>Expired Licenses</h3>
            <div className="stat-number">{formatNumber(expiredLicenses, 0)}</div>
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
                You have <strong>{formatNumber(totalAssets, 0)}</strong> assets and <strong>{formatNumber(totalLicenses, 0)}</strong> software licenses in your inventory.
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
                  <strong>{formatNumber(count, 0)}</strong>
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
                  <strong>{formatNumber(count, 0)}</strong>
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
                  <strong>{formatNumber(count, 0)}</strong>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )}

    {/* Dashboard Stats Modal */}
    <DashboardStatsModal
      isOpen={isModalOpen}
      onClose={handleCloseModal}
      cardType={selectedCardType}
      assets={assets}
      maintenance={maintenance}
      licenses={licenses}
      onNavigate={onNavigate}
    />
  </div>
)
}

export default Dashboard