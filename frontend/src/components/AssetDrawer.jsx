import React, { useState } from 'react'
import { FiX, FiEdit, FiRefreshCw, FiUser, FiCalendar, FiPackage, FiMapPin, FiCheckCircle, FiAlertCircle, FiClock } from 'react-icons/fi'
import { formatCurrency, formatNumber } from '../utils/formatters'
import { getDisplayName } from '../utils/helpers'
import './AssetDrawer.css'

const AssetDrawer = ({ asset, onClose, onRefresh, user, onViewHistory, onEdit, onTransfer }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return { bg: '#d4edda', text: '#155724', icon: FiCheckCircle }
      case 'Available': return { bg: '#d1ecf1', text: '#0c5460', icon: FiPackage }
      case 'Under Maintenance': return { bg: '#fff3cd', text: '#856404', icon: FiClock }
      case 'Retired': return { bg: '#f8d7da', text: '#721c24', icon: FiAlertCircle }
      default: return { bg: '#e9ecef', text: '#495057', icon: FiPackage }
    }
  }

  const statusInfo = getStatusColor(asset.status)
  const StatusIcon = statusInfo.icon

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric'
    })
  }

  const handleEdit = () => {
    if (onEdit) {
      onEdit(asset)
    }
  }

  const handleTransfer = () => {
    if (onTransfer) {
      onTransfer(asset)
    }
  }

  return (
    <>
      {/* Overlay */}
      <div className="drawer-overlay" onClick={onClose} />

      {/* Drawer */}
      <div className="asset-drawer">
        {/* Header */}
        <div className="drawer-header">
          <div>
            <h2>{asset.id}</h2>
            <p>{asset.brand_obj?.name} {asset.model}</p>
          </div>
          <button className="drawer-close" onClick={onClose}>
            <FiX size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="drawer-body">
          {/* Status Card */}
          <div className="drawer-section status-section" style={{
            background: statusInfo.bg,
            borderLeft: `4px solid ${statusInfo.text}`
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <StatusIcon size={24} color={statusInfo.text} />
              <div>
                <span style={{ fontSize: '0.85rem', color: statusInfo.text, opacity: 0.8 }}>
                  Current Status
                </span>
                <div style={{ 
                  fontSize: '1.2rem', 
                  fontWeight: 'bold', 
                  color: statusInfo.text 
                }}>
                  {asset.status}
                </div>
              </div>
            </div>
          </div>

          {/* Asset Information */}
          <div className="drawer-section">
            <h3 className="section-title">Asset Information</h3>
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">
                  <FiPackage size={16} /> Asset Type
                </span>
                <span className="info-value">{asset.asset_type?.name || 'N/A'}</span>
              </div>

              <div className="info-item">
                <span className="info-label">Serial Number</span>
                <span className="info-value" style={{ fontFamily: 'monospace', fontSize: '0.9rem' }}>
                  {asset.serial}
                </span>
              </div>

              <div className="info-item">
                <span className="info-label">
                   Purchase Cost
                </span>
                <span className="info-value" style={{ fontWeight: 'bold', color: '#28a745' }}>
                  {formatCurrency(asset.cost)}
                </span>
              </div>

              <div className="info-item">
                <span className="info-label">
                  <FiCalendar size={16} /> Purchase Date
                </span>
                <span className="info-value">{formatDate(asset.purchase_date)}</span>
              </div>

              <div className="info-item">
                <span className="info-label">Warranty Status</span>
                <span className="info-value">
                  <span style={{
                    padding: '4px 10px',
                    borderRadius: '12px',
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
                    background: asset.warranty_status === 'Active' ? '#d4edda' : '#f8d7da',
                    color: asset.warranty_status === 'Active' ? '#155724' : '#721c24'
                  }}>
                    {asset.warranty_status}
                  </span>
                </span>
              </div>

              <div className="info-item">
                <span className="info-label">
                  <FiMapPin size={16} /> Location
                </span>
                <span className="info-value">{asset.location || 'Not specified'}</span>
              </div>
            </div>
          </div>

          {/* Assignment Information */}
          <div className="drawer-section">
            <h3 className="section-title">Assignment Details</h3>
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">Department</span>
                <span className="info-value">{asset.department?.name || 'Unassigned'}</span>
              </div>

              <div className="info-item">
                <span className="info-label">
                  <FiUser size={16} /> Assigned To
                </span>
                <span className="info-value">
                  {asset.assignee ? (
                    <div>
                      <div style={{ fontWeight: '600' }}>{getDisplayName(asset.assignee)}</div>
                      <div style={{ fontSize: '0.8rem', color: '#6c757d' }}>
                        {asset.assignee.email}
                      </div>
                    </div>
                  ) : (
                    <span style={{ color: '#999', fontStyle: 'italic' }}>Unassigned</span>
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Asset created info */}
          <div className="drawer-section" style={{ background: '#f8f9fa', padding: '15px' }}>
            <div style={{ fontSize: '0.85rem', color: '#6c757d' }}>
              <div>Created: {formatDate(asset.created_at)}</div>
              {asset.updated_at && (
                <div>Last Updated: {formatDate(asset.updated_at)}</div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="drawer-footer">
          <button 
            className="btn btn-outline"
            onClick={() => onViewHistory(asset)}
          >
            <FiClock size={18} />
            View History
          </button>

          {(user?.role === 'Admin' || user?.role === 'Manager') && (
            <>
              {asset.status !== 'Retired' && (
                <button 
                  className="btn btn-primary"
                  onClick={handleTransfer}
                >
                  <FiRefreshCw size={18} />
                  Transfer
                </button>
              )}
              
              <button 
                className="btn btn-warning"
                onClick={handleEdit}
              >
                <FiEdit size={18} />
                Edit Asset
              </button>
            </>
          )}
        </div>
      </div>
    </>
  )
}

export default AssetDrawer