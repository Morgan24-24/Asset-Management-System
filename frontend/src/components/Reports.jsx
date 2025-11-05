import React, { useState, useEffect } from 'react'
import axiosInstance from '../api/axios'
import { FiFileText, FiDownload, FiPrinter, FiCalendar, FiFilter, FiBarChart2, FiDollarSign, FiTool,FiHome } from 'react-icons/fi'

const Reports = () => {
  const [generating, setGenerating] = useState(false)
  const [reportType, setReportType] = useState('assets')
  const [format, setFormat] = useState('pdf')
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    departmentId: '',
    assetTypeId: '',
    status: ''
  })
  const [departments, setDepartments] = useState([])
  const [assetTypes, setAssetTypes] = useState([])
  const [reportStats, setReportStats] = useState(null)
  const [loadingStats, setLoadingStats] = useState(false)

  // Fetch dropdown data for filters
  useEffect(() => {
    const fetchFilterData = async () => {
      try {
        const [deptsRes, typesRes] = await Promise.all([
          axiosInstance.get('/departments'),
          axiosInstance.get('/asset-types')
        ])
        setDepartments(deptsRes.data)
        setAssetTypes(typesRes.data)
      } catch (err) {
        console.error('Failed to fetch filter data:', err)
      }
    }
    fetchFilterData()
  }, [])

  // Fetch report statistics when filters change
  useEffect(() => {
    fetchReportStats()
  }, [reportType, filters])

  const fetchReportStats = async () => {
    setLoadingStats(true)
    try {
      let url = ''
      const params = new URLSearchParams()
      
      if (filters.startDate) params.append('start_date', filters.startDate)
      if (filters.endDate) params.append('end_date', filters.endDate)
      if (filters.departmentId) params.append('department_id', filters.departmentId)
      if (filters.assetTypeId) params.append('asset_type_id', filters.assetTypeId)
      if (filters.status) params.append('status', filters.status)

      switch (reportType) {
        case 'assets':
          url = '/report/summary'
          break
        case 'depreciation':
          url = '/report/depreciation'
          break
        case 'maintenance':
          url = '/report/maintenance-costs'
          break
        case 'utilization':
          url = '/report/utilization'
          break
        case 'department':
          url = '/report/utilization'
          break
        default:
          url = '/report/summary'
      }

      const response = await axiosInstance.get(`${url}?${params}`)
      setReportStats(response.data)
    } catch (err) {
      console.error('Failed to fetch report stats:', err)
    } finally {
      setLoadingStats(false)
    }
  }

  const generateReport = async () => {
    setGenerating(true)
    try {
      let url = ''
      const params = new URLSearchParams()
      params.append('format', format)
      
      // Add filters to report request
      if (filters.startDate) params.append('start_date', filters.startDate)
      if (filters.endDate) params.append('end_date', filters.endDate)
      if (filters.departmentId) params.append('department_id', filters.departmentId)
      if (filters.assetTypeId) params.append('asset_type_id', filters.assetTypeId)
      if (filters.status) params.append('status', filters.status)

      switch (reportType) {
        case 'assets':
          url = `/report/export/assets?${params}`
          break
        case 'depreciation':
          url = `/report/export/depreciation?${params}`
          break
        case 'maintenance':
          url = `/report/export/maintenance?${params}`
          break
        case 'department':
          url = `/report/export/departments?${params}`
          break
        default:
          url = `/report/export/assets?${params}`
      }

      const response = await axiosInstance.get(url, {
        responseType: 'blob'
      })

      // Create download link
      const blob = new Blob([response.data])
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      
      const filename = `${reportType}_report_${new Date().toISOString().split('T')[0]}.${format}`
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(downloadUrl)

      alert('Report generated successfully!')
    } catch (err) {
      alert('Failed to generate report: ' + (err.response?.data?.detail || err.message))
    } finally {
      setGenerating(false)
    }
  }

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const clearFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      departmentId: '',
      assetTypeId: '',
      status: ''
    })
  }

  const getReportIcon = (type) => {
    switch (type) {
      case 'assets': return <FiBarChart2 size={24} />
      case 'depreciation': return <FiDollarSign size={24} />
      case 'maintenance': return <FiTool size={24} />
      case 'department': return <FiHome size={24} />
      case 'utilization': return <FiBarChart2 size={24} />
      default: return <FiFileText size={24} />
    }
  }

  const getReportDescription = (type) => {
    switch (type) {
      case 'assets': return 'Complete inventory with all asset details and current status'
      case 'depreciation': return 'Asset values, depreciation calculations, and financial reporting'
      case 'maintenance': return 'Maintenance history, costs, and service records'
      case 'department': return 'Department-wise asset distribution and utilization metrics'
      case 'utilization': return 'Asset usage statistics and performance metrics'
      default: return 'Comprehensive asset management report'
    }
  }

  return (
    <div>
      <div className="header">
        <h1>Reports & Analytics</h1>
        <p style={{ color: '#6c757d', margin: 0 }}>Generate comprehensive asset management reports</p>
      </div>

      {/* Report Selection Card */}
      <div className="card">
        <div className="card-header">
          <h3>
            <FiFileText size={20} style={{ marginRight: '10px' }} />
            Generate Report
          </h3>
        </div>
        <div className="card-body">
          <div className="form-grid">
            <div className="form-group">
              <label>Report Type *</label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="form-control"
              >
                <option value="assets">Asset Inventory Report</option>
                <option value="depreciation">Depreciation Report</option>
                <option value="maintenance">Maintenance Cost Report</option>
                <option value="department">Department Summary Report</option>
                <option value="utilization">Utilization Report</option>
              </select>
            </div>

            <div className="form-group">
              <label>Export Format *</label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value)}
                className="form-control"
              >
                <option value="pdf">PDF Document</option>
                <option value="excel">Excel Spreadsheet</option>
              </select>
            </div>
          </div>

          {/* Report Filters */}
          <div style={{ marginTop: '20px', padding: '20px', background: '#f8f9fa', borderRadius: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
              <FiFilter size={18} style={{ marginRight: '8px' }} />
              <h4 style={{ margin: 0 }}>Report Filters</h4>
              <button 
                onClick={clearFilters}
                className="btn btn-outline btn-sm"
                style={{ marginLeft: 'auto' }}
              >
                Clear Filters
              </button>
            </div>
            
            <div className="form-grid">
              <div className="form-group">
                <label>Start Date</label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                  className="form-control"
                />
              </div>

              <div className="form-group">
                <label>End Date</label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                  className="form-control"
                />
              </div>

              <div className="form-group">
                <label>Department</label>
                <select
                  value={filters.departmentId}
                  onChange={(e) => handleFilterChange('departmentId', e.target.value)}
                  className="form-control"
                >
                  <option value="">All Departments</option>
                  {departments.map(dept => (
                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Asset Type</label>
                <select
                  value={filters.assetTypeId}
                  onChange={(e) => handleFilterChange('assetTypeId', e.target.value)}
                  className="form-control"
                >
                  <option value="">All Types</option>
                  {assetTypes.map(type => (
                    <option key={type.id} value={type.id}>{type.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="form-control"
                >
                  <option value="">All Status</option>
                  <option value="Available">Available</option>
                  <option value="Active">Active</option>
                  <option value="Under Maintenance">Under Maintenance</option>
                  <option value="Retired">Retired</option>
                </select>
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button
              onClick={generateReport}
              disabled={generating}
              className="btn btn-success"
              style={{ minWidth: '160px' }}
            >
              <FiDownload size={18} />
              {generating ? 'Generating...' : 'Generate Report'}
            </button>
            
            <button 
              className="btn btn-outline"
              onClick={fetchReportStats}
              disabled={loadingStats}
            >
              <FiBarChart2 size={18} />
              Refresh Stats
            </button>
          </div>
        </div>
      </div>

      {/* Report Statistics Preview */}
      {reportStats && !loadingStats && (
        <div className="card">
          <div className="card-header">
            <h3>
              <FiBarChart2 size={20} style={{ marginRight: '10px' }} />
              Report Preview & Statistics
            </h3>
          </div>
          <div className="card-body">
            {reportType === 'assets' && reportStats && (
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-header">
                    <div className="stat-content">
                      <h3>Total Assets</h3>
                      <div className="stat-number">{reportStats.total_assets || 0}</div>
                      <div className="stat-trend">In inventory</div>
                    </div>
                    <div className="stat-icon"><FiBarChart2 size={24} /></div>
                  </div>
                </div>

                <div className="stat-card success">
                  <div className="stat-header">
                    <div className="stat-content">
                      <h3>Active Assets</h3>
                      <div className="stat-number">{reportStats.active_assets || 0}</div>
                      <div className="stat-trend">In use</div>
                    </div>
                    <div className="stat-icon"><FiBarChart2 size={24} /></div>
                  </div>
                </div>

                <div className="stat-card info">
                  <div className="stat-header">
                    <div className="stat-content">
                      <h3>Total Value</h3>
                      <div className="stat-number">₵{reportStats.total_asset_cost?.toFixed(2) || '0.00'}</div>
                      <div className="stat-trend">Asset investment</div>
                    </div>
                    <div className="stat-icon"><FiDollarSign size={24} /></div>
                  </div>
                </div>

                <div className="stat-card warning">
                  <div className="stat-header">
                    <div className="stat-content">
                      <h3>Under Maintenance</h3>
                      <div className="stat-number">{reportStats.maintenance_assets || 0}</div>
                      <div className="stat-trend">Being serviced</div>
                    </div>
                    <div className="stat-icon"><FiTool size={24} /></div>
                  </div>
                </div>
              </div>
            )}

            {reportType === 'depreciation' && reportStats.summary && (
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-header">
                    <div className="stat-content">
                      <h3>Total Purchase Value</h3>
                      <div className="stat-number">₵{reportStats.summary.total_purchase_value?.toFixed(2) || '0.00'}</div>
                      <div className="stat-trend">Original cost</div>
                    </div>
                    <div className="stat-icon"><FiDollarSign size={24} /></div>
                  </div>
                </div>

                <div className="stat-card warning">
                  <div className="stat-header">
                    <div className="stat-content">
                      <h3>Total Depreciation</h3>
                      <div className="stat-number">₵{reportStats.summary.total_depreciation?.toFixed(2) || '0.00'}</div>
                      <div className="stat-trend">Value lost</div>
                    </div>
                    <div className="stat-icon"><FiDollarSign size={24} /></div>
                  </div>
                </div>

                <div className="stat-card success">
                  <div className="stat-header">
                    <div className="stat-content">
                      <h3>Current Value</h3>
                      <div className="stat-number">₵{reportStats.summary.total_current_value?.toFixed(2) || '0.00'}</div>
                      <div className="stat-trend">Net worth</div>
                    </div>
                    <div className="stat-icon"><FiDollarSign size={24} /></div>
                  </div>
                </div>

                <div className="stat-card info">
                  <div className="stat-header">
                    <div className="stat-content">
                      <h3>Depreciation Rate</h3>
                      <div className="stat-number">{reportStats.summary.overall_depreciation_rate?.toFixed(1) || '0'}%</div>
                      <div className="stat-trend">Average</div>
                    </div>
                    <div className="stat-icon"><FiBarChart2 size={24} /></div>
                  </div>
                </div>
              </div>
            )}

            {reportType === 'maintenance' && reportStats && (
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-header">
                    <div className="stat-content">
                      <h3>Total Maintenance Cost</h3>
                      <div className="stat-number">₵{reportStats.total_cost?.toFixed(2) || '0.00'}</div>
                      <div className="stat-trend">All time</div>
                    </div>
                    <div className="stat-icon"><FiDollarSign size={24} /></div>
                  </div>
                </div>

                <div className="stat-card info">
                  <div className="stat-header">
                    <div className="stat-content">
                      <h3>Maintenance Records</h3>
                      <div className="stat-number">{reportStats.breakdown?.length || 0}</div>
                      <div className="stat-trend">Total activities</div>
                    </div>
                    <div className="stat-icon"><FiTool size={24} /></div>
                  </div>
                </div>
              </div>
            )}

            {reportType === 'utilization' && reportStats.overall && (
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-header">
                    <div className="stat-content">
                      <h3>Utilization Rate</h3>
                      <div className="stat-number">{reportStats.overall.utilization_rate?.toFixed(1) || '0'}%</div>
                      <div className="stat-trend">Asset usage</div>
                    </div>
                    <div className="stat-icon"><FiBarChart2 size={24} /></div>
                  </div>
                </div>

                <div className="stat-card success">
                  <div className="stat-header">
                    <div className="stat-content">
                      <h3>Active Assets</h3>
                      <div className="stat-number">{reportStats.overall.active || 0}</div>
                      <div className="stat-trend">In use</div>
                    </div>
                    <div className="stat-icon"><FiBarChart2 size={24} /></div>
                  </div>
                </div>

                <div className="stat-card info">
                  <div className="stat-header">
                    <div className="stat-content">
                      <h3>Available Assets</h3>
                      <div className="stat-number">{reportStats.overall.available || 0}</div>
                      <div className="stat-trend">Ready to deploy</div>
                    </div>
                    <div className="stat-icon"><FiBarChart2 size={24} /></div>
                  </div>
                </div>
              </div>
            )}

            {reportType === 'department' && reportStats.by_department && (
              <div style={{ marginTop: '20px' }}>
                <h4>Department Utilization</h4>
                <table className="assets-table">
                  <thead>
                    <tr>
                      <th>Department</th>
                      <th>Total Assets</th>
                      <th>Active Assets</th>
                      <th>Utilization Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportStats.by_department.map((dept, index) => (
                      <tr key={index}>
                        <td>{dept.department}</td>
                        <td>{dept.total_assets}</td>
                        <td>{dept.active_assets}</td>
                        <td>
                          <span style={{
                            padding: '4px 8px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            backgroundColor: dept.utilization_rate >= 80 ? '#d4edda' : 
                                          dept.utilization_rate >= 50 ? '#fff3cd' : '#f8d7da',
                            color: dept.utilization_rate >= 80 ? '#155724' : 
                                  dept.utilization_rate >= 50 ? '#856404' : '#721c24'
                          }}>
                            {dept.utilization_rate}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Loading State for Stats */}
      {loadingStats && (
        <div className="card">
          <div className="card-body">
            <div className="loading">Loading report statistics...</div>
          </div>
        </div>
      )}

      {/* Quick Report Actions */}
      <div className="card">
        <div className="card-header">
          <h3>Quick Reports</h3>
        </div>
        <div className="card-body">
          <div className="quick-actions">
            <div 
              className="stat-card" 
              onClick={() => setReportType('assets')}
              style={{ cursor: 'pointer' }}
            >
              <div className="stat-header">
                <div className="stat-content">
                  <h3>Asset Inventory</h3>
                  <p>Complete list of all assets with details</p>
                </div>
                <div className="stat-icon">{getReportIcon('assets')}</div>
              </div>
            </div>

            <div 
              className="stat-card" 
              onClick={() => setReportType('depreciation')}
              style={{ cursor: 'pointer' }}
            >
              <div className="stat-header">
                <div className="stat-content">
                  <h3>Depreciation Report</h3>
                  <p>Asset values and depreciation calculations</p>
                </div>
                <div className="stat-icon">{getReportIcon('depreciation')}</div>
              </div>
            </div>

            <div 
              className="stat-card" 
              onClick={() => setReportType('maintenance')}
              style={{ cursor: 'pointer' }}
            >
              <div className="stat-header">
                <div className="stat-content">
                  <h3>Maintenance History</h3>
                  <p>All maintenance records and costs</p>
                </div>
                <div className="stat-icon">{getReportIcon('maintenance')}</div>
              </div>
            </div>

            <div 
              className="stat-card" 
              onClick={() => setReportType('department')}
              style={{ cursor: 'pointer' }}
            >
              <div className="stat-header">
                <div className="stat-content">
                  <h3>Department Summary</h3>
                  <p>Assets by department and utilization</p>
                </div>
                <div className="stat-icon">{getReportIcon('department')}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Reports