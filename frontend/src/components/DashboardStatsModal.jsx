import React, { useState, useEffect } from 'react'
import axiosInstance from '../api/axios'
import { 
  FiX, 
  FiMonitor, 
  FiCheckCircle, 
  FiPackage, 
  FiTool, 
  FiFileText,
  FiDollarSign,
  FiAlertCircle,
  FiExternalLink,
  FiDownload
} from 'react-icons/fi'
import { formatCurrency, formatNumber } from '../utils/formatters'
import './DashboardStatsModal.css'

const DashboardStatsModal = ({ 
  isOpen, 
  onClose, 
  cardType, 
  assets,
  maintenance,
  licenses,
  onNavigate 
}) => {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState(null)

  useEffect(() => {
    if (isOpen && cardType) {
      fetchModalData()
    }
  }, [isOpen, cardType])

  const fetchModalData = async () => {
    setLoading(true)
    try {
      // We'll fetch specific data based on cardType
      // For now, we'll use the passed props
      setData({
        assets,
        maintenance,
        licenses
      })
    } catch (err) {
      console.error('Error fetching modal data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleNavigate = (view, filter = null) => {
    onNavigate(view, filter)
    onClose()
  }

  const getModalContent = () => {
    switch (cardType) {
      case 'total_assets':
        return renderTotalAssetsContent()
      case 'active_assets':
        return renderActiveAssetsContent()
      case 'available_assets':
        return renderAvailableAssetsContent()
      case 'under_maintenance':
        return renderMaintenanceContent()
      case 'total_cost':
        return renderTotalCostContent()
      case 'retired_assets':
        return renderRetiredAssetsContent()
      case 'expired_licenses':
        return renderExpiredLicensesContent()
      case 'total_licenses':
        return renderTotalLicensesContent()
      case 'active_licenses':
        return renderActiveLicensesContent()
      case 'maintenance_cost':
        return renderMaintenanceCostContent()
      default:
        return <div>Select a stat card to view details</div>
    }
  }

  const renderTotalAssetsContent = () => {
    const byDepartment = {}
    const byType = {}
    let oldestAsset = null
    let newestAsset = null
    let totalValue = 0

    assets.forEach(asset => {
      // By department
      const dept = asset.department?.name || 'Unassigned'
      byDepartment[dept] = (byDepartment[dept] || 0) + 1

      // By type
      const type = asset.asset_type?.name || 'Unknown'
      byType[type] = (byType[type] || 0) + 1

      // Total value
      totalValue += asset.cost || 0

      // Oldest/Newest
      const purchaseDate = new Date(asset.purchase_date)
      if (!oldestAsset || purchaseDate < new Date(oldestAsset.purchase_date)) {
        oldestAsset = asset
      }
      if (!newestAsset || purchaseDate > new Date(newestAsset.purchase_date)) {
        newestAsset = asset
      }
    })

    const topAssets = [...assets]
      .sort((a, b) => (b.cost || 0) - (a.cost || 0))
      .slice(0, 5)

    return (
      <div className="modal-content-body">
        <h3>Asset Overview</h3>
        
        {/* Quick Stats */}
        <div className="stats-row">
          <div className="stat-box">
            <span className="stat-label">Total Assets</span>
            <span className="stat-value">{formatNumber(assets.length, 0)}</span>
          </div>
          <div className="stat-box">
            <span className="stat-label">Total Value</span>
            <span className="stat-value">{formatCurrency(totalValue)}</span>
          </div>
          <div className="stat-box">
            <span className="stat-label">Oldest Asset</span>
            <span className="stat-value-small">
              {oldestAsset ? new Date(oldestAsset.purchase_date).getFullYear() : 'N/A'}
            </span>
          </div>
          <div className="stat-box">
            <span className="stat-label">Newest Asset</span>
            <span className="stat-value-small">
              {newestAsset ? new Date(newestAsset.purchase_date).getFullYear() : 'N/A'}
            </span>
          </div>
        </div>

        {/* Charts Section */}
        <div className="charts-grid">
          {/* By Department */}
          <div className="chart-section">
            <h4>By Department</h4>
            <div className="chart-list">
              {Object.entries(byDepartment)
                .sort((a, b) => b[1] - a[1])
                .map(([dept, count]) => (
                  <div key={dept} className="chart-item" onClick={() => handleNavigate('assets', { department: dept })}>
                    <span className="chart-label">{dept}</span>
                    <div className="chart-bar-container">
                      <div 
                        className="chart-bar" 
                        style={{ width: `${(count / assets.length) * 100}%` }}
                      ></div>
                      <span className="chart-value">{formatNumber(count, 0)}</span>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* By Type */}
          <div className="chart-section">
            <h4>By Type</h4>
            <div className="chart-list">
              {Object.entries(byType)
                .sort((a, b) => b[1] - a[1])
                .map(([type, count]) => (
                  <div key={type} className="chart-item" onClick={() => handleNavigate('assets', { type })}>
                    <span className="chart-label">{type}</span>
                    <div className="chart-bar-container">
                      <div 
                        className="chart-bar" 
                        style={{ width: `${(count / assets.length) * 100}%` }}
                      ></div>
                      <span className="chart-value">{formatNumber(count, 0)}</span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* Top 5 Most Expensive */}
        <div className="top-assets">
          <h4>Top 5 Most Expensive Assets</h4>
          <div className="asset-list">
            {topAssets.map((asset, index) => (
              <div key={asset.id} className="asset-item">
                <div className="asset-rank">#{index + 1}</div>
                <div className="asset-info">
                  <strong>{asset.brand_obj?.name} {asset.model}</strong>
                  <small>{asset.id} • {asset.department?.name || 'Unassigned'}</small>
                </div>
                <div className="asset-cost">{formatCurrency(asset.cost)}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="modal-actions">
          <button className="btn btn-primary" onClick={() => handleNavigate('assets')}>
            <FiExternalLink size={16} />
            View All Assets
          </button>
        </div>
      </div>
    )
  }

  const renderActiveAssetsContent = () => {
    const activeAssets = assets.filter(a => a.status === 'Active')
    const byDepartment = {}

    activeAssets.forEach(asset => {
      const dept = asset.department?.name || 'Unassigned'
      byDepartment[dept] = (byDepartment[dept] || 0) + 1
    })

    return (
      <div className="modal-content-body">
        <h3>Active Assets</h3>
        
        <div className="stats-row">
          <div className="stat-box">
            <span className="stat-label">Total Active</span>
            <span className="stat-value">{formatNumber(activeAssets.length, 0)}</span>
          </div>
          <div className="stat-box">
            <span className="stat-label">Utilization Rate</span>
            <span className="stat-value">
              {assets.length > 0 ? Math.round((activeAssets.length / assets.length) * 100) : 0}%
            </span>
          </div>
        </div>

        {/* Active Assets List */}
        <div className="active-list">
          <h4>Currently Assigned Assets</h4>
          <div className="asset-list">
            {activeAssets.slice(0, 10).map(asset => (
              <div key={asset.id} className="asset-item">
                <div className="asset-info">
                  <strong>{asset.brand_obj?.name} {asset.model}</strong>
                  <small>
                    {asset.id} • Assigned to: {asset.assignee?.display_name || asset.assignee?.email || 'Unknown'}
                  </small>
                </div>
                <div className="asset-dept">{asset.department?.name || 'N/A'}</div>
              </div>
            ))}
          </div>
          {activeAssets.length > 10 && (
            <p className="more-items">+ {activeAssets.length - 10} more assets</p>
          )}
        </div>

        {/* Department Breakdown */}
        <div className="chart-section">
          <h4>Active by Department</h4>
          <div className="chart-list">
            {Object.entries(byDepartment)
              .sort((a, b) => b[1] - a[1])
              .map(([dept, count]) => (
                <div key={dept} className="chart-item">
                  <span className="chart-label">{dept}</span>
                  <div className="chart-bar-container">
                    <div 
                      className="chart-bar" 
                      style={{ width: `${(count / activeAssets.length) * 100}%` }}
                    ></div>
                    <span className="chart-value">{formatNumber(count, 0)}</span>
                  </div>
                </div>
              ))}
          </div>
        </div>

        <div className="modal-actions">
          <button className="btn btn-primary" onClick={() => handleNavigate('assets', { status: 'Active' })}>
            <FiExternalLink size={16} />
            View All Active Assets
          </button>
        </div>
      </div>
    )
  }

  const renderAvailableAssetsContent = () => {
    const availableAssets = assets.filter(a => a.status === 'Available')
    const byType = {}

    availableAssets.forEach(asset => {
      const type = asset.asset_type?.name || 'Unknown'
      byType[type] = (byType[type] || 0) + 1
    })

    return (
      <div className="modal-content-body">
        <h3>Available Assets</h3>
        
        <div className="stats-row">
          <div className="stat-box">
            <span className="stat-label">Ready to Deploy</span>
            <span className="stat-value">{formatNumber(availableAssets.length, 0)}</span>
          </div>
        </div>

        {/* Available by Type */}
        <div className="chart-section">
          <h4>Available by Type</h4>
          <div className="chart-list">
            {Object.entries(byType)
              .sort((a, b) => b[1] - a[1])
              .map(([type, count]) => (
                <div key={type} className="chart-item">
                  <span className="chart-label">{type}</span>
                  <div className="chart-bar-container">
                    <div 
                      className="chart-bar available" 
                      style={{ width: `${(count / availableAssets.length) * 100}%` }}
                    ></div>
                    <span className="chart-value">{formatNumber(count, 0)}</span>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* List */}
        <div className="active-list">
          <h4>Available Devices</h4>
          <div className="asset-list">
            {availableAssets.slice(0, 10).map(asset => (
              <div key={asset.id} className="asset-item">
                <div className="asset-info">
                  <strong>{asset.brand_obj?.name} {asset.model}</strong>
                  <small>{asset.id}</small>
                </div>
                <span className="status-badge available">Available</span>
              </div>
            ))}
          </div>
          {availableAssets.length > 10 && (
            <p className="more-items">+ {availableAssets.length - 10} more assets</p>
          )}
        </div>

        <div className="modal-actions">
          <button className="btn btn-primary" onClick={() => handleNavigate('assets', { status: 'Available' })}>
            <FiExternalLink size={16} />
            View All Available
          </button>
        </div>
      </div>
    )
  }

  const renderMaintenanceContent = () => {
    const underMaintenance = assets.filter(a => a.status === 'Under Maintenance')
    const totalCost = maintenance.reduce((sum, m) => sum + (m.cost || 0), 0)

    return (
      <div className="modal-content-body">
        <h3>Under Maintenance</h3>
        
        <div className="stats-row">
          <div className="stat-box">
            <span className="stat-label">In Service</span>
            <span className="stat-value">{formatNumber(underMaintenance.length, 0)}</span>
          </div>
          <div className="stat-box">
            <span className="stat-label">Total Cost</span>
            <span className="stat-value">{formatCurrency(totalCost)}</span>
          </div>
        </div>

        <div className="active-list">
          <h4>Assets Being Serviced</h4>
          <div className="asset-list">
            {underMaintenance.slice(0, 10).map(asset => {
              const assetMaintenance = maintenance
                .filter(m => m.asset_id === asset.id)
                .sort((a, b) => new Date(b.date) - new Date(a.date))[0]

              return (
                <div key={asset.id} className="asset-item">
                  <div className="asset-info">
                    <strong>{asset.brand_obj?.name} {asset.model}</strong>
                    <small>
                      {asset.id} • {assetMaintenance?.activity || 'General maintenance'}
                    </small>
                  </div>
                  <span className="status-badge warning">Maintenance</span>
                </div>
              )
            })}
          </div>
          {underMaintenance.length > 10 && (
            <p className="more-items">+ {underMaintenance.length - 10} more assets</p>
          )}
        </div>

        <div className="modal-actions">
          <button className="btn btn-primary" onClick={() => handleNavigate('maintenance')}>
            <FiExternalLink size={16} />
            View Maintenance Page
          </button>
        </div>
      </div>
    )
  }

  const renderTotalCostContent = () => {
    const byDepartment = {}
    
    assets.forEach(asset => {
      const dept = asset.department?.name || 'Unassigned'
      byDepartment[dept] = (byDepartment[dept] || 0) + (asset.cost || 0)
    })

    const totalAssetCost = assets.reduce((sum, a) => sum + (a.cost || 0), 0)
    const totalMaintenanceCost = maintenance.reduce((sum, m) => sum + (m.cost || 0), 0)

    const recentPurchases = [...assets]
      .sort((a, b) => new Date(b.purchase_date) - new Date(a.purchase_date))
      .slice(0, 5)

    return (
      <div className="modal-content-body">
        <h3>Financial Overview</h3>
        
        <div className="stats-row">
          <div className="stat-box">
            <span className="stat-label">Asset Value</span>
            <span className="stat-value">{formatCurrency(totalAssetCost)}</span>
          </div>
          <div className="stat-box">
            <span className="stat-label">Maintenance</span>
            <span className="stat-value">{formatCurrency(totalMaintenanceCost)}</span>
          </div>
          <div className="stat-box">
            <span className="stat-label">Total Spent</span>
            <span className="stat-value">{formatCurrency(totalAssetCost + totalMaintenanceCost)}</span>
          </div>
        </div>

        {/* Cost by Department */}
        <div className="chart-section">
          <h4>Cost by Department</h4>
          <div className="chart-list">
            {Object.entries(byDepartment)
              .sort((a, b) => b[1] - a[1])
              .map(([dept, cost]) => (
                <div key={dept} className="chart-item">
                  <span className="chart-label">{dept}</span>
                  <div className="chart-bar-container">
                    <div 
                      className="chart-bar cost" 
                      style={{ width: `${(cost / totalAssetCost) * 100}%` }}
                    ></div>
                    <span className="chart-value">{formatCurrency(cost)}</span>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Recent Purchases */}
        <div className="top-assets">
          <h4>Recent Purchases</h4>
          <div className="asset-list">
            {recentPurchases.map(asset => (
              <div key={asset.id} className="asset-item">
                <div className="asset-info">
                  <strong>{asset.brand_obj?.name} {asset.model}</strong>
                  <small>{new Date(asset.purchase_date).toLocaleDateString()}</small>
                </div>
                <div className="asset-cost">{formatCurrency(asset.cost)}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="modal-actions">
          <button className="btn btn-primary" onClick={() => handleNavigate('reports')}>
            <FiExternalLink size={16} />
            Open Financial Report
          </button>
        </div>
      </div>
    )
  }

  const renderRetiredAssetsContent = () => {
    const retiredAssets = assets.filter(a => a.status === 'Retired')

    return (
      <div className="modal-content-body">
        <h3>Retired Assets</h3>
        
        <div className="stats-row">
          <div className="stat-box">
            <span className="stat-label">Total Retired</span>
            <span className="stat-value">{formatNumber(retiredAssets.length, 0)}</span>
          </div>
        </div>

        <div className="active-list">
          <h4>No Longer in Use</h4>
          <div className="asset-list">
            {retiredAssets.slice(0, 10).map(asset => (
              <div key={asset.id} className="asset-item">
                <div className="asset-info">
                  <strong>{asset.brand_obj?.name} {asset.model}</strong>
                  <small>{asset.id}</small>
                </div>
                <span className="status-badge retired">Retired</span>
              </div>
            ))}
          </div>
          {retiredAssets.length > 10 && (
            <p className="more-items">+ {retiredAssets.length - 10} more assets</p>
          )}
        </div>

        <div className="modal-actions">
          <button className="btn btn-primary" onClick={() => handleNavigate('assets', { status: 'Retired' })}>
            <FiExternalLink size={16} />
            View All Retired Assets
          </button>
        </div>
      </div>
    )
  }

  const renderExpiredLicensesContent = () => {
    const expiredLicenses = licenses.filter(l => l.status === 'Expired')

    return (
      <div className="modal-content-body">
        <h3>⚠️ Expired Licenses</h3>
        
        <div className="stats-row">
          <div className="stat-box">
            <span className="stat-label">Expired</span>
            <span className="stat-value">{formatNumber(expiredLicenses.length, 0)}</span>
          </div>
        </div>

        <div className="alert alert-warning">
          ⚠️ These licenses need renewal to maintain compliance
        </div>

        <div className="active-list">
          <h4>Licenses Needing Renewal</h4>
          <div className="asset-list">
            {expiredLicenses.slice(0, 10).map(license => (
              <div key={license.id} className="asset-item">
                <div className="asset-info">
                  <strong>{license.name}</strong>
                  <small>Expired: {new Date(license.expiration_date).toLocaleDateString()}</small>
                </div>
                <span className="status-badge expired">Expired</span>
              </div>
            ))}
          </div>
          {expiredLicenses.length > 10 && (
            <p className="more-items">+ {expiredLicenses.length - 10} more licenses</p>
          )}
        </div>

        <div className="modal-actions">
          <button className="btn btn-primary" onClick={() => handleNavigate('licenses')}>
            <FiExternalLink size={16} />
            Manage Licenses
          </button>
        </div>
      </div>
    )
  }

  const renderTotalLicensesContent = () => {
    const activeLicenses = licenses.filter(l => l.status === 'Active')
    const expiredLicenses = licenses.filter(l => l.status === 'Expired')
    const expiringIn30Days = licenses.filter(l => {
      const expiryDate = new Date(l.expiration_date)
      const today = new Date()
      const daysUntilExpiry = Math.floor((expiryDate - today) / (1000 * 60 * 60 * 24))
      return daysUntilExpiry <= 30 && daysUntilExpiry > 0
    })

    const totalCost = licenses.reduce((sum, l) => sum + (l.cost || 0), 0)

    return (
      <div className="modal-content-body">
        <h3>Software Licenses Overview</h3>
        
        <div className="stats-row">
          <div className="stat-box">
            <span className="stat-label">Total Licenses</span>
            <span className="stat-value">{formatNumber(licenses.length, 0)}</span>
          </div>
          <div className="stat-box">
            <span className="stat-label">Active</span>
            <span className="stat-value">{formatNumber(activeLicenses.length, 0)}</span>
          </div>
          <div className="stat-box">
            <span className="stat-label">Expired</span>
            <span className="stat-value">{formatNumber(expiredLicenses.length, 0)}</span>
          </div>
          <div className="stat-box">
            <span className="stat-label">Total Cost</span>
            <span className="stat-value-small">{formatCurrency(totalCost)}</span>
          </div>
        </div>

        {expiringIn30Days.length > 0 && (
          <div className="alert alert-warning">
            ⚠️ {expiringIn30Days.length} license(s) expiring within 30 days!
          </div>
        )}

        {/* All Licenses List */}
        <div className="active-list">
          <h4>All Software Licenses</h4>
          <div className="asset-list">
            {licenses.slice(0, 10).map(license => {
              const isExpired = license.status === 'Expired'
              const expiryDate = new Date(license.expiration_date)
              const today = new Date()
              const daysUntilExpiry = Math.floor((expiryDate - today) / (1000 * 60 * 60 * 24))
              const isExpiringSoon = daysUntilExpiry <= 30 && daysUntilExpiry > 0

              return (
                <div key={license.id} className="asset-item">
                  <div className="asset-info">
                    <strong>{license.name}</strong>
                    <small>
                      Expires: {new Date(license.expiration_date).toLocaleDateString()}
                      {isExpiringSoon && ` (${daysUntilExpiry} days left)`}
                    </small>
                  </div>
                  <span className={`status-badge ${isExpired ? 'expired' : isExpiringSoon ? 'warning' : 'available'}`}>
                    {isExpired ? 'Expired' : isExpiringSoon ? 'Expiring Soon' : 'Active'}
                  </span>
                </div>
              )
            })}
          </div>
          {licenses.length > 10 && (
            <p className="more-items">+ {licenses.length - 10} more licenses</p>
          )}
        </div>

        <div className="modal-actions">
          <button className="btn btn-primary" onClick={() => handleNavigate('licenses')}>
            <FiExternalLink size={16} />
            Manage All Licenses
          </button>
        </div>
      </div>
    )
  }

  const renderActiveLicensesContent = () => {
    const activeLicenses = licenses.filter(l => l.status === 'Active')

    return (
      <div className="modal-content-body">
        <h3>Active Licenses</h3>
        
        <div className="stats-row">
          <div className="stat-box">
            <span className="stat-label">Active</span>
            <span className="stat-value">{formatNumber(activeLicenses.length, 0)}</span>
          </div>
          <div className="stat-box">
            <span className="stat-label">Coverage</span>
            <span className="stat-value">
              {licenses.length > 0 ? Math.round((activeLicenses.length / licenses.length) * 100) : 0}%
            </span>
          </div>
        </div>

        <div className="active-list">
          <h4>Currently Active Licenses</h4>
          <div className="asset-list">
            {activeLicenses.slice(0, 10).map(license => (
              <div key={license.id} className="asset-item">
                <div className="asset-info">
                  <strong>{license.name}</strong>
                  <small>Expires: {new Date(license.expiration_date).toLocaleDateString()}</small>
                </div>
                <div className="asset-cost">{formatCurrency(license.cost || 0)}</div>
              </div>
            ))}
          </div>
          {activeLicenses.length > 10 && (
            <p className="more-items">+ {activeLicenses.length - 10} more licenses</p>
          )}
        </div>

        <div className="modal-actions">
          <button className="btn btn-primary" onClick={() => handleNavigate('licenses')}>
            <FiExternalLink size={16} />
            View All Licenses
          </button>
        </div>
      </div>
    )
  }

  const renderMaintenanceCostContent = () => {
    const totalCost = maintenance.reduce((sum, m) => sum + (m.cost || 0), 0)
    const avgCost = maintenance.length > 0 ? totalCost / maintenance.length : 0

    // Group by month
    const byMonth = {}
    maintenance.forEach(m => {
      const month = new Date(m.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      byMonth[month] = (byMonth[month] || 0) + (m.cost || 0)
    })

    // Top 5 most expensive maintenance
    const topMaintenance = [...maintenance]
      .sort((a, b) => (b.cost || 0) - (a.cost || 0))
      .slice(0, 5)

    return (
      <div className="modal-content-body">
        <h3>Maintenance Costs</h3>
        
        <div className="stats-row">
          <div className="stat-box">
            <span className="stat-label">Total Spent</span>
            <span className="stat-value-small">{formatCurrency(totalCost)}</span>
          </div>
          <div className="stat-box">
            <span className="stat-label">Records</span>
            <span className="stat-value">{formatNumber(maintenance.length, 0)}</span>
          </div>
          <div className="stat-box">
            <span className="stat-label">Avg Cost</span>
            <span className="stat-value-small">{formatCurrency(avgCost)}</span>
          </div>
        </div>

        {/* Cost by Month */}
        <div className="chart-section">
          <h4>Monthly Spending</h4>
          <div className="chart-list">
            {Object.entries(byMonth)
              .sort((a, b) => new Date(a[0]) - new Date(b[0]))
              .slice(-6)
              .map(([month, cost]) => (
                <div key={month} className="chart-item">
                  <span className="chart-label">{month}</span>
                  <div className="chart-bar-container">
                    <div 
                      className="chart-bar warning" 
                      style={{ 
                        width: `${(cost / Math.max(...Object.values(byMonth))) * 100}%`,
                        background: 'linear-gradient(90deg, #ffc107 0%, #ff9800 100%)'
                      }}
                    ></div>
                    <span className="chart-value">{formatCurrency(cost)}</span>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Top 5 Most Expensive */}
        <div className="top-assets">
          <h4>Most Expensive Maintenance</h4>
          <div className="asset-list">
            {topMaintenance.map((m, index) => (
              <div key={m.id} className="asset-item">
                <div className="asset-rank">#{index + 1}</div>
                <div className="asset-info">
                  <strong>{m.activity}</strong>
                  <small>Asset: {m.asset_id} • {new Date(m.date).toLocaleDateString()}</small>
                </div>
                <div className="asset-cost">{formatCurrency(m.cost || 0)}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="modal-actions">
          <button className="btn btn-primary" onClick={() => handleNavigate('maintenance')}>
            <FiExternalLink size={16} />
            View Maintenance Records
          </button>
        </div>
      </div>
    )
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div className="stats-modal-backdrop" onClick={onClose} />

      {/* Modal */}
      <div className="stats-modal">
        <div className="stats-modal-header">
          <h2>{getModalTitle()}</h2>
          <button className="stats-modal-close" onClick={onClose}>
            <FiX size={24} />
          </button>
        </div>

        <div className="stats-modal-body">
          {loading ? (
            <div className="loading">Loading...</div>
          ) : (
            getModalContent()
          )}
        </div>
      </div>
    </>
  )
}

const getModalTitle = () => {
  // Helper function to get modal title
  return 'Asset Details'
}

export default DashboardStatsModal