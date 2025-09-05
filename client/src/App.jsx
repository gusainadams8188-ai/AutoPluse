import React, { useState, useEffect, useRef } from 'react'
import io from 'socket.io-client'
import ChartComponent from './components/ChartComponent'
import AIDashboard from './components/AIDashboard'
import MockDataController from './components/MockDataController'
import clientPluginLoader from './utils/pluginLoader'
import './App.css'

function App() {
  // Helper function to get server URL
  const getServerUrl = () => import.meta.env.VITE_SERVER_URL || 'http://localhost:3001'

  const [vehicleData, setVehicleData] = useState({
    rpm: 0,
    speed: 0,
    coolant_temp: 0,
    intake_air_temp: 0,
    throttle_pos: 0,
    engine_load: 0,
    fuel_pressure: 0,
    intake_manifold_pressure: 0,
    mode: 'city',
    vehicleType: 'sedan',
    faultScenario: 'normal'
  })
  const [fuelData, setFuelData] = useState({
    fuel_level: 75,
    instant_mpg: 0,
    average_mpg: 0,
    range_remaining: 0
  })
  const [connectionStatus, setConnectionStatus] = useState('disconnected')
  const [dataHistory, setDataHistory] = useState([])
  const [fuelHistory, setFuelHistory] = useState([])
  const dataHistoryRef = useRef([])
  const fuelHistoryRef = useRef([])
  const [dtcCodes, setDtcCodes] = useState([])
  const [maintenanceHistory, setMaintenanceHistory] = useState([])
  const [healthScore, setHealthScore] = useState({ score: 85, status: 'Good', issues: [] })
  const [vinData, setVinData] = useState(null)
  const [vinInput, setVinInput] = useState('')

  // OE-LEVEL state
  const [oemManufacturers, setOemManufacturers] = useState([])
  const [selectedManufacturer, setSelectedManufacturer] = useState('')
  const [oemDtcCodes, setOemDtcCodes] = useState([])
  const [oemCommands, setOemCommands] = useState([])

  // VW-specific state
  const [vwWorkshopResources, setVwWorkshopResources] = useState(null)
  const [vwRepairGuide, setVwRepairGuide] = useState(null)
  const [vwLegalSources, setVwLegalSources] = useState(null)
  const [vwHardwareTestResults, setVwHardwareTestResults] = useState(null)
  const [showVwWorkshop, setShowVwWorkshop] = useState(false)
  const [showVwTesting, setShowVwTesting] = useState(false)

  // OBD-II adapter state
  const [availableAdapters, setAvailableAdapters] = useState([])
  const [obd2Connected, setObd2Connected] = useState(false)
  const [obd2Status, setObd2Status] = useState(null)
  const [obd2Data, setObd2Data] = useState({})
  const [monitoringActive, setMonitoringActive] = useState(false)
  const [selectedPIDs, setSelectedPIDs] = useState(['010C', '010D', '0105', '0111'])
  const [showObd2Panel, setShowObd2Panel] = useState(false)
  const [obd2Dtcs, setObd2Dtcs] = useState([])

  // Plugin management state
  const [availablePlugins, setAvailablePlugins] = useState([])
  const [showPluginManager, setShowPluginManager] = useState(false)

  // AI Dashboard state
  const [showAIDashboard, setShowAIDashboard] = useState(false)

  // Mock Data Controller state
  const [showMockController, setShowMockController] = useState(false)

  useEffect(() => {
    const serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001'
    const socket = io(serverUrl)

    socket.on('connect', () => {
      setConnectionStatus('connected')
    })

    socket.on('disconnect', () => {
      setConnectionStatus('disconnected')
    })

    socket.on('vehicleData', (data) => {
      try {
        setVehicleData(data)
        dataHistoryRef.current = [...dataHistoryRef.current, data].slice(-50)
        setDataHistory([...dataHistoryRef.current])
      } catch (error) {
        console.error('Error processing vehicle data:', error)
      }
    })

    socket.on('fuelData', (data) => {
      try {
        setFuelData(data)
        fuelHistoryRef.current = [...fuelHistoryRef.current, data].slice(-50)
        setFuelHistory([...fuelHistoryRef.current])
      } catch (error) {
        console.error('Error processing fuel data:', error)
      }
    })

    return () => {
      socket.disconnect()
    }
  }, [])

  useEffect(() => {
    fetchDtcCodes()
    fetchMaintenanceHistory()
    fetchHealthScore()
    fetchOemManufacturers()

    // Initialize client-side plugins
    const initializePlugins = async () => {
      try {
        await clientPluginLoader.loadAllPlugins({
          app: window.app || {},
          React: React
        });
        console.log('Client plugins loaded successfully');
      } catch (error) {
        console.error('Error loading client plugins:', error);
      }
    };

    initializePlugins();
  }, [])

  const fetchDtcCodes = async () => {
    try {
      const response = await fetch(`${getServerUrl()}/api/dtc`)
      const data = await response.json()
      setDtcCodes(data)
    } catch (error) {
      console.error('Error fetching DTC codes:', error)
    }
  }

  const fetchMaintenanceHistory = async () => {
    try {
      const response = await fetch(`${getServerUrl()}/api/maintenance`)
      const data = await response.json()
      setMaintenanceHistory(data)
    } catch (error) {
      console.error('Error fetching maintenance history:', error)
    }
  }

  const fetchHealthScore = async () => {
    try {
      const response = await fetch(`${getServerUrl()}/api/health-score`)
      const data = await response.json()
      setHealthScore(data)
    } catch (error) {
      console.error('Error fetching health score:', error)
    }
  }

  const decodeVin = async () => {
    if (!vinInput) return
    try {
      const response = await fetch(`${getServerUrl()}/api/vin/${vinInput}/oem`)
      const data = await response.json()
      setVinData(data)
    } catch (error) {
      console.error('Error decoding VIN:', error)
    }
  }

  // OE-LEVEL functions
  const fetchOemManufacturers = async () => {
    try {
      const response = await fetch(`${getServerUrl()}/api/oem/manufacturers`)
      const data = await response.json()
      setOemManufacturers(data)
    } catch (error) {
      console.error('Error fetching OEM manufacturers:', error)
    }
  }

  const fetchOemDtcCodes = async (manufacturer) => {
    if (!manufacturer) return
    try {
      const response = await fetch(`${getServerUrl()}/api/oem/dtc/${manufacturer}`)
      const data = await response.json()
      setOemDtcCodes(data)
    } catch (error) {
      console.error('Error fetching OEM DTC codes:', error)
    }
  }

  const fetchOemCommands = async (manufacturer) => {
    if (!manufacturer) return
    try {
      const response = await fetch(`${getServerUrl()}/api/oem/commands/${manufacturer}`)
      const data = await response.json()
      setOemCommands(data)
    } catch (error) {
      console.error('Error fetching OEM commands:', error)
    }
  }

  const executeOemCommand = async (commandId, parameters = {}) => {
    try {
      const response = await fetch(`${getServerUrl()}/api/oem/commands/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          command_id: commandId,
          vin: vinInput || 'DEMO_VIN',
          parameters: parameters
        })
      })
      const data = await response.json()
      return data
    } catch (error) {
      console.error('Error executing OEM command:', error)
      return { error: error.message }
    }
  }

  const handleManufacturerChange = (manufacturer) => {
    setSelectedManufacturer(manufacturer)
    if (manufacturer) {
      fetchOemDtcCodes(manufacturer)
      fetchOemCommands(manufacturer)

      // VW-specific initialization
      if (manufacturer === 'VW') {
        fetchVwWorkshopResources('Polo 9N', '1.4 MPI', '2004')
        fetchVwLegalSources('Polo 9N', '1.4 MPI')
      }
    } else {
      setOemDtcCodes([])
      setOemCommands([])
      setVwWorkshopResources(null)
      setVwLegalSources(null)
    }
  }

  // VW-specific functions
  const fetchVwWorkshopResources = async (model, engine, year) => {
    try {
      const response = await fetch(`${getServerUrl()}/api/vw/workshop-resources/${model}/${engine}/${year}`)
      const data = await response.json()
      setVwWorkshopResources(data)
    } catch (error) {
      console.error('Error fetching VW workshop resources:', error)
    }
  }

  const fetchVwRepairGuide = async (issue, engine) => {
    try {
      const response = await fetch(`${getServerUrl()}/api/vw/repair-guide/${issue}/${engine}`)
      const data = await response.json()
      setVwRepairGuide(data)
    } catch (error) {
      console.error('Error fetching VW repair guide:', error)
    }
  }

  const fetchVwLegalSources = async (model, engine) => {
    try {
      const response = await fetch(`${getServerUrl()}/api/vw/legal-sources/${model}/${engine}`)
      const data = await response.json()
      setVwLegalSources(data)
    } catch (error) {
      console.error('Error fetching VW legal sources:', error)
    }
  }

  const runVwHardwareTest = async (testType) => {
    try {
      let endpoint = ''
      switch (testType) {
        case 'init':
          endpoint = '/api/vw/hardware-test/init'
          break
        case 'suite':
          endpoint = '/api/vw/hardware-test/suite'
          break
        case 'benchmark':
          endpoint = '/api/vw/hardware-test/benchmark'
          break
        default:
          return
      }

      const response = await fetch(`${getServerUrl()}${endpoint}`, {
        method: 'POST'
      })
      const data = await response.json()
      setVwHardwareTestResults({ ...data, testType })
    } catch (error) {
      console.error('Error running VW hardware test:', error)
      setVwHardwareTestResults({ error: error.message, testType })
    }
  }

  // OBD-II adapter functions
  const loadAvailableAdapters = async () => {
    try {
      const response = await fetch(`${getServerUrl()}/api/obd2/adapters`)
      const data = await response.json()
      setAvailableAdapters(data)
    } catch (error) {
      console.error('Error loading adapters:', error)
    }
  }

  const connectToAdapter = async (adapterId, adapterType, connectionParams) => {
    try {
      const response = await fetch(`${getServerUrl()}/api/obd2/connect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          adapterId,
          adapterType,
          connectionParams
        })
      })
      const data = await response.json()

      if (data.success) {
        setObd2Connected(true)
        setObd2Status(data)
        alert('Successfully connected to OBD-II adapter!')
      } else {
        alert(`Connection failed: ${data.error}`)
      }
    } catch (error) {
      console.error('Error connecting to adapter:', error)
      alert('Error connecting to adapter')
    }
  }

  const disconnectAdapter = async () => {
    try {
      const response = await fetch(`${getServerUrl()}/api/obd2/disconnect`, {
        method: 'POST'
      })
      const data = await response.json()

      if (data.success) {
        setObd2Connected(false)
        setObd2Status(null)
        setMonitoringActive(false)
        setObd2Data({})
        alert('Successfully disconnected from OBD-II adapter')
      } else {
        alert(`Disconnection failed: ${data.error}`)
      }
    } catch (error) {
      console.error('Error disconnecting adapter:', error)
      alert('Error disconnecting adapter')
    }
  }

  const startDataMonitoring = async () => {
    try {
      const response = await fetch(`${getServerUrl()}/api/obd2/monitor/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          pids: selectedPIDs,
          interval: 1000
        })
      })
      const data = await response.json()

      if (data.success) {
        setMonitoringActive(true)
        alert('Data monitoring started successfully')
      } else {
        alert(`Failed to start monitoring: ${data.error}`)
      }
    } catch (error) {
      console.error('Error starting monitoring:', error)
      alert('Error starting data monitoring')
    }
  }

  const stopDataMonitoring = async () => {
    try {
      const response = await fetch(`${getServerUrl()}/api/obd2/monitor/stop`, {
        method: 'POST'
      })
      const data = await response.json()

      if (data.success) {
        setMonitoringActive(false)
        alert('Data monitoring stopped')
      } else {
        alert(`Failed to stop monitoring: ${data.error}`)
      }
    } catch (error) {
      console.error('Error stopping monitoring:', error)
      alert('Error stopping data monitoring')
    }
  }

  const readDTCs = async () => {
    try {
      const response = await fetch(`${getServerUrl()}/api/obd2/dtcs`)
      const data = await response.json()

      if (data.success) {
        setObd2Dtcs(data.dtcs)
      } else {
        alert(`Failed to read DTCs: ${data.error}`)
      }
    } catch (error) {
      console.error('Error reading DTCs:', error)
      alert('Error reading DTCs')
    }
  }

  const clearDTCs = async () => {
    if (!confirm('Are you sure you want to clear all DTCs? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`${getServerUrl()}/api/obd2/clear-dtcs`, {
        method: 'POST'
      })
      const data = await response.json()

      if (data.success) {
        alert('DTCs cleared successfully')
        setObd2Dtcs([])
      } else {
        alert(`Failed to clear DTCs: ${data.error}`)
      }
    } catch (error) {
      console.error('Error clearing DTCs:', error)
      alert('Error clearing DTCs')
    }
  }

  const sendCustomCommand = async (command) => {
    try {
      const response = await fetch(`${getServerUrl()}/api/obd2/command`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          command,
          timeout: 2000
        })
      })
      const data = await response.json()

      if (data.success) {
        alert(`Command executed successfully:\n${JSON.stringify(data, null, 2)}`)
      } else {
        alert(`Command failed: ${data.error}`)
      }
    } catch (error) {
      console.error('Error sending command:', error)
      alert('Error sending custom command')
    }
  }

  // Plugin management functions
  const fetchAvailablePlugins = async () => {
    try {
      const response = await fetch(`${getServerUrl()}/api/plugins`)
      const data = await response.json()
      setAvailablePlugins(data)
    } catch (error) {
      console.error('Error fetching plugins:', error)
    }
  }

  const loadPlugin = async (pluginName) => {
    try {
      const response = await fetch(`${getServerUrl()}/api/plugins/${pluginName}/load`, {
        method: 'POST'
      })
      const result = await response.json()
      if (result.success) {
        alert(`Plugin ${pluginName} loaded successfully`)
        fetchAvailablePlugins() // Refresh the list
      } else {
        alert(`Failed to load plugin: ${result.error}`)
      }
    } catch (error) {
      console.error('Error loading plugin:', error)
      alert('Error loading plugin')
    }
  }

  const unloadPlugin = async (pluginName) => {
    try {
      const response = await fetch(`${getServerUrl()}/api/plugins/${pluginName}/unload`, {
        method: 'POST'
      })
      const result = await response.json()
      if (result.success) {
        alert(`Plugin ${pluginName} unloaded successfully`)
        fetchAvailablePlugins() // Refresh the list
      } else {
        alert(`Failed to unload plugin: ${result.error}`)
      }
    } catch (error) {
      console.error('Error unloading plugin:', error)
      alert('Error unloading plugin')
    }
  }

  const exportData = (type, data) => {
    if (!data || data.length === 0) {
      alert('No data to export');
      return;
    }

    const timestamp = new Date().toISOString().split('T')[0];
    let filename = `${type}_data_${timestamp}.json`;
    let exportData = data;

    // For vehicle metrics and fuel data, use the history arrays
    if (type === 'vehicle_metrics') {
      exportData = dataHistory;
      filename = `vehicle_metrics_${timestamp}.json`;
    } else if (type === 'fuel_economy') {
      exportData = fuelHistory;
      filename = `fuel_economy_${timestamp}.json`;
    }

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);

    const exportFileDefaultName = filename;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Automotive Diagnostic Dashboard</h1>
        <div className="header-controls">
          <div className="oem-selector">
            <label htmlFor="oem-select">OEM Level:</label>
            <select
              id="oem-select"
              value={selectedManufacturer}
              onChange={(e) => handleManufacturerChange(e.target.value)}
            >
              <option value="">Generic OBD-II</option>
              {oemManufacturers.map((manufacturer) => (
                <option key={manufacturer.id} value={manufacturer.manufacturer_code}>
                  {manufacturer.manufacturer_name} ({manufacturer.country})
                </option>
              ))}
            </select>
          </div>
          <div className={`connection-status ${connectionStatus}`}>
            Connection: {connectionStatus}
          </div>
          <button
            onClick={() => {
              setShowPluginManager(!showPluginManager)
              if (!showPluginManager) {
                fetchAvailablePlugins()
              }
            }}
            className="plugin-manager-btn"
          >
            Plugin Manager
          </button>
          {selectedManufacturer === 'VW' && (
            <>
              <button
                onClick={() => {
                  setShowVwWorkshop(!showVwWorkshop)
                  if (!showVwWorkshop && !vwWorkshopResources) {
                    fetchVwWorkshopResources('Polo 9N', '1.4 MPI', '2004')
                  }
                }}
                className="vw-workshop-btn"
              >
                VW Workshop
              </button>
              <button
                onClick={() => {
                  setShowVwTesting(!showVwTesting)
                }}
                className="vw-testing-btn"
              >
                VW Testing
              </button>
            </>
          )}

          <button
            onClick={() => {
              setShowObd2Panel(!showObd2Panel)
              if (!showObd2Panel) {
                loadAvailableAdapters()
              }
            }}
            className="obd2-panel-btn"
          >
            OBD-II Adapter
          </button>
          <button
            onClick={() => setShowAIDashboard(!showAIDashboard)}
            className="ai-dashboard-btn"
          >
            🤖 AI Assistant
          </button>
          <button
            onClick={() => setShowMockController(!showMockController)}
            className="mock-controller-btn"
          >
            🎭 Mock Data
          </button>
        </div>
      </header>

      <div className="dashboard-content">
        <div className="metrics-grid">
          <div className="metric-card">
            <h3>RPM</h3>
            <div className="metric-value">{vehicleData.rpm.toFixed(0)}</div>
            <div className="metric-unit">rpm</div>
          </div>
          <div className="metric-card">
            <h3>Speed</h3>
            <div className="metric-value">{vehicleData.speed.toFixed(1)}</div>
            <div className="metric-unit">km/h</div>
          </div>
          <div className="metric-card">
            <h3>Coolant Temp</h3>
            <div className="metric-value">{vehicleData.coolant_temp.toFixed(1)}</div>
            <div className="metric-unit">°C</div>
          </div>
          <div className="metric-card">
            <h3>Engine Load</h3>
            <div className="metric-value">{vehicleData.engine_load.toFixed(1)}</div>
            <div className="metric-unit">%</div>
          </div>
          <div className="metric-card">
            <h3>Fuel Level</h3>
            <div className="metric-value">{fuelData.fuel_level}</div>
            <div className="metric-unit">%</div>
          </div>
          <div className="metric-card">
            <h3>Instant MPG</h3>
            <div className="metric-value">{fuelData.instant_mpg.toFixed(1)}</div>
            <div className="metric-unit">mpg</div>
          </div>
          <div className="metric-card">
            <h3>Range</h3>
            <div className="metric-value">{fuelData.range_remaining}</div>
            <div className="metric-unit">mi</div>
          </div>
          <div className="metric-card">
            <h3>Fuel Pressure</h3>
            <div className="metric-value">{vehicleData.fuel_pressure.toFixed(1)}</div>
            <div className="metric-unit">kPa</div>
          </div>
        </div>

        <div className="charts-section">
           <h2>Performance Charts</h2>
           <div className="section-controls">
             <button onClick={() => exportData('vehicle_metrics', dataHistory)} className="export-btn">Export Vehicle Data</button>
             <button onClick={() => exportData('fuel_economy', fuelHistory)} className="export-btn">Export Fuel Data</button>
           </div>
           <div className="charts-grid">
             <div className="chart-container">
               <ChartComponent data={dataHistory} title="RPM Trend" dataKey="rpm" />
             </div>
             <div className="chart-container">
               <ChartComponent data={dataHistory} title="Engine Load" dataKey="engine_load" />
             </div>
             <div className="chart-container">
               <ChartComponent data={dataHistory} title="Coolant Temperature" dataKey="coolant_temp" />
             </div>
             <div className="chart-container">
               <ChartComponent data={fuelHistory} title="Fuel Economy (MPG)" dataKey="instant_mpg" />
             </div>
             <div className="chart-container">
               <ChartComponent data={fuelHistory} title="Fuel Level (%)" dataKey="fuel_level" />
             </div>
           </div>
         </div>

        <div className="alerts-section">
           <h2>Active Alerts</h2>
           {vehicleData.faultScenario !== 'normal' && (
             <div className={`alert-card ${vehicleData.faultScenario === 'overheat' ? 'critical' : 'warning'}`}>
               <p>Fault Detected: {vehicleData.faultScenario.replace('_', ' ').toUpperCase()}</p>
             </div>
           )}
           {vehicleData.coolant_temp > 100 && (
             <div className="alert-card critical">
               <p>High Coolant Temperature: {vehicleData.coolant_temp}°C</p>
             </div>
           )}
           {fuelData.fuel_level < 15 && (
             <div className="alert-card warning">
               <p>Low Fuel Level: {fuelData.fuel_level}%</p>
             </div>
           )}
           {healthScore.issues.length > 0 && (
             <div className="alert-card info">
               <p>Health Issues: {healthScore.issues.length} detected</p>
             </div>
           )}
           {healthScore.issues.length === 0 && vehicleData.faultScenario === 'normal' && (
             <div className="alert-card success">
               <p>All Systems Normal</p>
             </div>
           )}
         </div>

        <div className="health-score">
           <h2>Vehicle Health Score</h2>
           <div className="score-display">
             <div className="score-circle">{healthScore.score}%</div>
             <p>Overall Health: {healthScore.status}</p>
             {healthScore.issues.length > 0 && (
               <div className="health-issues">
                 <p><strong>Issues:</strong></p>
                 <ul>
                   {healthScore.issues.map((issue, index) => (
                     <li key={index}>{issue}</li>
                   ))}
                 </ul>
                 {healthScore.oem_issues && healthScore.oem_issues.length > 0 && (
                   <div className="oem-health-issues">
                     <p><strong>OEM-Specific Issues:</strong></p>
                     <ul>
                       {healthScore.oem_issues.map((issue, index) => (
                         <li key={`oem-${index}`} className="oem-issue">{issue}</li>
                       ))}
                     </ul>
                   </div>
                 )}
               </div>
             )}
           </div>
         </div>

        <div className="dtc-section">
           <h2>Diagnostic Trouble Codes</h2>
           <div className="section-controls">
             <button onClick={fetchDtcCodes} className="refresh-btn">Refresh</button>
             <button onClick={() => exportData('dtc', dtcCodes)} className="export-btn">Export DTC Data</button>
           </div>
           <div className="dtc-list">
             {dtcCodes.length === 0 ? (
               <p>No DTC codes found</p>
             ) : (
               dtcCodes.map((dtc) => (
                 <div key={dtc.id} className={`dtc-item ${dtc.status.toLowerCase()}`}>
                   <div className="dtc-code">{dtc.code}</div>
                   <div className="dtc-info">
                     <p>{dtc.description}</p>
                     <span className="dtc-severity">{dtc.severity}</span>
                   </div>
                 </div>
               ))
             )}
           </div>
         </div>

        <div className="maintenance-section">
           <h2>Maintenance History</h2>
           <div className="section-controls">
             <button onClick={fetchMaintenanceHistory} className="refresh-btn">Refresh</button>
             <button onClick={() => exportData('maintenance', maintenanceHistory)} className="export-btn">Export Maintenance Data</button>
           </div>
           <div className="maintenance-list">
             {maintenanceHistory.length === 0 ? (
               <p>No maintenance records found</p>
             ) : (
               maintenanceHistory.map((record) => (
                 <div key={record.id} className="maintenance-item">
                   <div className="maintenance-header">
                     <h4>{record.service_type}</h4>
                     <span className="maintenance-date">{new Date(record.date_performed).toLocaleDateString()}</span>
                   </div>
                   <p>{record.description}</p>
                   <div className="maintenance-details">
                     <span>Mileage: {record.mileage.toLocaleString()}</span>
                     <span>Cost: ${record.cost.toFixed(2)}</span>
                     {record.next_service_mileage && (
                       <span>Next Service: {record.next_service_mileage.toLocaleString()} mi</span>
                     )}
                   </div>
                 </div>
               ))
             )}
           </div>
         </div>

         {selectedManufacturer && (
           <div className="oem-dtc-section">
             <h2>OEM-Specific DTC Codes ({selectedManufacturer})</h2>
             <div className="section-controls">
               <button onClick={() => fetchOemDtcCodes(selectedManufacturer)} className="refresh-btn">Refresh OEM DTC</button>
               <button onClick={() => exportData('oem_dtc', oemDtcCodes)} className="export-btn">Export OEM DTC Data</button>
             </div>
             <div className="dtc-list">
               {oemDtcCodes.length === 0 ? (
                 <p>No OEM-specific DTC codes found</p>
               ) : (
                 oemDtcCodes.map((dtc) => (
                   <div key={dtc.id} className={`dtc-item oem-dtc-item ${dtc.severity.toLowerCase()}`}>
                     <div className="dtc-code">{dtc.dtc_code}</div>
                     <div className="dtc-info">
                       <p>{dtc.description}</p>
                       <div className="dtc-meta">
                         <span className="dtc-severity">{dtc.severity}</span>
                         <span className="dtc-category">{dtc.category}</span>
                         <span className="dtc-subsystem">{dtc.subsystem}</span>
                       </div>
                     </div>
                   </div>
                 ))
               )}
             </div>
           </div>
         )}

         {selectedManufacturer && (
           <div className="oem-commands-section">
             <h2>OEM Diagnostic Commands ({selectedManufacturer})</h2>
             <div className="commands-grid">
               {oemCommands.length === 0 ? (
                 <p>No OEM diagnostic commands available</p>
               ) : (
                 oemCommands.map((command) => (
                   <div key={command.id} className="command-card">
                     <div className="command-header">
                       <h4>{command.command_name}</h4>
                       <span className={`command-type ${command.command_type}`}>{command.command_type}</span>
                     </div>
                     <p className="command-description">{command.command_description}</p>
                     <button
                       onClick={async () => {
                         const result = await executeOemCommand(command.command_id)
                         if (result.success) {
                           alert(`Command executed successfully!\n${JSON.stringify(result.response, null, 2)}`)
                         } else {
                           alert(`Command failed: ${result.error || 'Unknown error'}`)
                         }
                       }}
                       className="execute-btn"
                     >
                       Execute Command
                     </button>
                   </div>
                 ))
               )}
             </div>
           </div>
         )}

         <div className="vin-section">
           <h2>VIN Decoder</h2>
           <div className="vin-input">
             <input
               type="text"
               value={vinInput}
               onChange={(e) => setVinInput(e.target.value)}
               placeholder="Enter 17-character VIN"
               maxLength="17"
             />
             <button onClick={decodeVin} className="decode-btn">Decode</button>
           </div>
           {vinData && (
             <div className="vin-result">
               <h3>Vehicle Information</h3>
               <div className="vin-basic-info">
                 <p><strong>Make:</strong> {vinData.make}</p>
                 <p><strong>Model:</strong> {vinData.model}</p>
                 <p><strong>Year:</strong> {vinData.year}</p>
                 <p><strong>Engine:</strong> {vinData.engine}</p>
                 <p><strong>Fuel Type:</strong> {vinData.fuel_type}</p>
                 <p><strong>Country:</strong> {vinData.country_origin}</p>
               </div>

               {vinData.oem_data && (
                 <div className="vin-oem-info">
                   <h4>OEM-Specific Information</h4>
                   <p><strong>OEM:</strong> {vinData.oem_data.manufacturer_name}</p>
                   <p><strong>Country:</strong> {vinData.oem_data.country}</p>
                   <p><strong>Supported Protocols:</strong> {vinData.oem_data.supported_protocols.join(', ')}</p>
                   <div className="oem-parameters">
                     <h5>Proprietary Parameters:</h5>
                     <ul>
                       {Object.entries(vinData.oem_data.proprietary_parameters).map(([key, param]) => (
                         <li key={key}>
                           <strong>{key.replace(/_/g, ' ')}:</strong> {param.description} ({param.unit})
                         </li>
                       ))}
                     </ul>
                   </div>
                 </div>
               )}
             </div>
           )}
         </div>

         {showPluginManager && (
           <div className="plugin-manager-section">
             <h2>Plugin Manager</h2>
             <div className="section-controls">
               <button onClick={fetchAvailablePlugins} className="refresh-btn">Refresh</button>
             </div>
             <div className="plugin-list">
               {availablePlugins.length === 0 ? (
                 <p>No plugins found</p>
               ) : (
                 availablePlugins.map((plugin) => (
                   <div key={plugin.name} className={`plugin-item ${plugin.status.toLowerCase()}`}>
                     <div className="plugin-header">
                       <h4>{plugin.name} v{plugin.version}</h4>
                       <span className={`plugin-status ${plugin.status.toLowerCase()}`}>
                         {plugin.status.replace('_', ' ')}
                       </span>
                     </div>
                     <p className="plugin-description">{plugin.description}</p>
                     <div className="plugin-meta">
                       <span>Author: {plugin.author}</span>
                       <span>Capabilities: {plugin.capabilities ? plugin.capabilities.join(', ') : 'None'}</span>
                     </div>
                     <div className="plugin-actions">
                       {plugin.status === 'not_loaded' && (
                         <button
                           onClick={() => loadPlugin(plugin.name)}
                           className="load-btn"
                         >
                           Load Plugin
                         </button>
                       )}
                       {plugin.status === 'initialized' && (
                         <button
                           onClick={() => unloadPlugin(plugin.name)}
                           className="unload-btn"
                         >
                           Unload Plugin
                         </button>
                       )}
                       {plugin.status === 'loaded' && (
                         <span className="status-text">Loading...</span>
                       )}
                       {plugin.status === 'error' && (
                         <span className="error-text">Error loading plugin</span>
                       )}
                     </div>
                   </div>
                 ))
               )}
             </div>
           </div>
         )}

         {/* VW Workshop Section */}
         {showVwWorkshop && selectedManufacturer === 'VW' && (
           <div className="vw-workshop-section">
             <h2>VW Polo 9N Workshop Resources</h2>

             {vwWorkshopResources && (
               <div className="vw-workshop-content">
                 <div className="vw-technical-specs">
                   <h3>Technical Specifications</h3>
                   <div className="specs-grid">
                     {Object.entries(vwWorkshopResources.technicalSpecs || {}).map(([key, value]) => (
                       <div key={key} className="spec-item">
                         <span className="spec-label">{key.replace(/_/g, ' ')}:</span>
                         <span className="spec-value">{value}</span>
                       </div>
                     ))}
                   </div>
                 </div>

                 <div className="vw-service-intervals">
                   <h3>Service Intervals</h3>
                   <ul className="service-list">
                     {Object.entries(vwWorkshopResources.serviceIntervals || {}).map(([service, interval]) => (
                       <li key={service} className="service-item">
                         <strong>{service.replace(/_/g, ' ')}:</strong> {interval}
                       </li>
                     ))}
                   </ul>
                 </div>

                 <div className="vw-common-repairs">
                   <h3>Common Repairs</h3>
                   <div className="repairs-grid">
                     {(vwWorkshopResources.commonRepairs || []).map((repair, index) => (
                       <div key={index} className="repair-card">
                         <h4>{repair.component}</h4>
                         <p><strong>Frequency:</strong> {repair.frequency}</p>
                         <p><strong>Symptoms:</strong> {repair.symptoms}</p>
                         <p><strong>Cost:</strong> {repair.estimatedCost}</p>
                         <button
                           onClick={() => fetchVwRepairGuide(repair.component.toLowerCase().replace(/\s+/g, '_'), '1.4 MPI')}
                           className="repair-guide-btn"
                         >
                           View Repair Guide
                         </button>
                       </div>
                     ))}
                   </div>
                 </div>

                 {vwLegalSources && (
                   <div className="vw-legal-sources">
                     <h3>Legal Workshop Resources</h3>
                     <div className="sources-grid">
                       {Object.entries(vwLegalSources).map(([category, sources]) => (
                         <div key={category} className="source-category">
                           <h4>{category.charAt(0).toUpperCase() + category.slice(1)} Sources</h4>
                           <ul>
                             {sources.map((source, index) => (
                               <li key={index}>
                                 <a href={source.url} target="_blank" rel="noopener noreferrer">
                                   {source.name}
                                 </a>
                                 <p>{source.description}</p>
                               </li>
                             ))}
                           </ul>
                         </div>
                       ))}
                     </div>
                   </div>
                 )}
               </div>
             )}
           </div>
         )}

         {/* VW Repair Guide Modal */}
         {vwRepairGuide && (
           <div className="vw-repair-guide-modal">
             <div className="modal-content">
               <h2>{vwRepairGuide.title}</h2>
               <div className="guide-details">
                 <p><strong>Difficulty:</strong> {vwRepairGuide.difficulty}</p>
                 <p><strong>Time Required:</strong> {vwRepairGuide.timeRequired}</p>
                 {vwRepairGuide.tools && (
                   <div className="tools-section">
                     <h3>Tools Required:</h3>
                     <ul>
                       {vwRepairGuide.tools.map((tool, index) => (
                         <li key={index}>{tool}</li>
                       ))}
                     </ul>
                   </div>
                 )}
                 {vwRepairGuide.steps && (
                   <div className="steps-section">
                     <h3>Repair Steps:</h3>
                     <ol>
                       {vwRepairGuide.steps.map((step, index) => (
                         <li key={index}>{step}</li>
                       ))}
                     </ol>
                   </div>
                 )}
                 {vwRepairGuide.safetyNotes && (
                   <div className="safety-section">
                     <h3>⚠️ Safety Notes:</h3>
                     <ul>
                       {vwRepairGuide.safetyNotes.map((note, index) => (
                         <li key={index}>{note}</li>
                       ))}
                     </ul>
                   </div>
                 )}
               </div>
               <button onClick={() => setVwRepairGuide(null)} className="close-modal-btn">Close</button>
             </div>
           </div>
         )}

         {/* VW Testing Section */}
         {showVwTesting && selectedManufacturer === 'VW' && (
           <div className="vw-testing-section">
             <h2>VW Polo 9N Hardware Testing</h2>

             <div className="testing-controls">
               <button onClick={() => runVwHardwareTest('init')} className="test-btn init-test">
                 Initialize Hardware
               </button>
               <button onClick={() => runVwHardwareTest('suite')} className="test-btn suite-test">
                 Run Test Suite
               </button>
               <button onClick={() => runVwHardwareTest('benchmark')} className="test-btn benchmark-test">
                 Performance Benchmark
               </button>
             </div>

             {vwHardwareTestResults && (
               <div className="test-results">
                 <h3>Test Results ({vwHardwareTestResults.testType})</h3>

                 {vwHardwareTestResults.error ? (
                   <div className="error-result">
                     <p>Error: {vwHardwareTestResults.error}</p>
                   </div>
                 ) : (
                   <div className="results-content">
                     {vwHardwareTestResults.testType === 'init' && (
                       <div className="init-results">
                         <p><strong>Status:</strong> {vwHardwareTestResults.success ? 'Connected' : 'Failed'}</p>
                         <p><strong>VIN:</strong> {vwHardwareTestResults.hardware?.vin}</p>
                         <p><strong>Engine:</strong> {vwHardwareTestResults.hardware?.engineType}</p>
                         <p><strong>Protocol:</strong> {vwHardwareTestResults.hardware?.protocol}</p>
                       </div>
                     )}

                     {vwHardwareTestResults.testType === 'suite' && (
                       <div className="suite-results">
                         <div className="summary-stats">
                           <p><strong>Total Tests:</strong> {vwHardwareTestResults.summary?.totalTests}</p>
                           <p><strong>Passed:</strong> {vwHardwareTestResults.summary?.passedTests}</p>
                           <p><strong>Failed:</strong> {vwHardwareTestResults.summary?.failedTests}</p>
                           <p><strong>Success Rate:</strong> {vwHardwareTestResults.summary?.successRate?.toFixed(1)}%</p>
                           <p><strong>Overall Status:</strong>
                             <span className={`status-${vwHardwareTestResults.summary?.overallStatus}`}>
                               {vwHardwareTestResults.summary?.overallStatus?.toUpperCase()}
                             </span>
                           </p>
                         </div>

                         <div className="test-details">
                           <h4>Test Details:</h4>
                           {vwHardwareTestResults.tests?.map((test, index) => (
                             <div key={index} className={`test-item ${test.status}`}>
                               <h5>{test.name}</h5>
                               <p><strong>Status:</strong> {test.status}</p>
                               {test.details && <p><strong>Details:</strong> {test.details}</p>}
                               {test.protocols && (
                                 <div className="protocol-results">
                                   <strong>Protocols:</strong>
                                   <ul>
                                     {test.protocols.map((protocol, pIndex) => (
                                       <li key={pIndex}>
                                         {protocol.protocol}: {protocol.status}
                                         {protocol.error && ` (${protocol.error})`}
                                       </li>
                                     ))}
                                   </ul>
                                 </div>
                               )}
                             </div>
                           ))}
                         </div>
                       </div>
                     )}

                     {vwHardwareTestResults.testType === 'benchmark' && (
                       <div className="benchmark-results">
                         <h4>Performance Benchmark Results:</h4>
                         {vwHardwareTestResults.tests?.map((test, index) => (
                           <div key={index} className="benchmark-item">
                             <h5>{test.name}</h5>
                             {test.name === 'Response Time Test' && (
                               <div className="response-metrics">
                                 <p><strong>Average:</strong> {test.average?.toFixed(2)}ms</p>
                                 <p><strong>Min:</strong> {test.minimum}ms</p>
                                 <p><strong>Max:</strong> {test.maximum}ms</p>
                                 <p><strong>Status:</strong> {test.status}</p>
                               </div>
                             )}
                             {test.name === 'Throughput Test' && (
                               <div className="throughput-metrics">
                                 <p><strong>Commands/Second:</strong> {test.throughput?.toFixed(2)}</p>
                                 <p><strong>Total Time:</strong> {test.totalTime}ms</p>
                                 <p><strong>Status:</strong> {test.status}</p>
                               </div>
                             )}
                             {test.name === 'Memory Usage Test' && (
                               <div className="memory-metrics">
                                 <p><strong>Memory Increase:</strong> {(test.memoryIncrease / 1024 / 1024).toFixed(2)} MB</p>
                                 <p><strong>Status:</strong> {test.status}</p>
                               </div>
                             )}
                           </div>
                         ))}
                       </div>
                     )}
                   </div>
                 )}
               </div>
             )}
           </div>
         )}

         {/* OBD-II Adapter Panel */}
         {showObd2Panel && (
           <div className="obd2-panel">
             <h2>OBD-II Adapter Control Panel</h2>

             {/* Connection Status */}
             <div className="obd2-status">
               <h3>Connection Status</h3>
               <div className={`status-indicator ${obd2Connected ? 'connected' : 'disconnected'}`}>
                 <span className="status-dot"></span>
                 <span className="status-text">
                   {obd2Connected ? 'Connected' : 'Disconnected'}
                 </span>
               </div>
               {obd2Status && (
                 <div className="connection-details">
                   <p><strong>Adapter:</strong> {obd2Status.adapterType} - {obd2Status.adapterInfo?.id}</p>
                   <p><strong>Protocol:</strong> {obd2Status.protocol}</p>
                   <p><strong>ECUs Detected:</strong> {obd2Status.ecuCount}</p>
                   <p><strong>PIDs Supported:</strong> {obd2Status.supportedPIDs?.length || 0}</p>
                 </div>
               )}
             </div>

             {/* Adapter Selection */}
             {!obd2Connected && (
               <div className="adapter-selection">
                 <h3>Available Adapters</h3>
                 <div className="adapters-list">
                   {availableAdapters.length === 0 ? (
                     <p>No adapters detected. Make sure your OBD-II adapter is connected and powered.</p>
                   ) : (
                     availableAdapters.map((adapter) => (
                       <div key={adapter.id} className="adapter-item">
                         <div className="adapter-info">
                           <h4>{adapter.name}</h4>
                           <p><strong>Type:</strong> {adapter.type}</p>
                           <p><strong>Address:</strong> {adapter.address}</p>
                           <p><strong>Status:</strong> {adapter.supported ? 'Supported' : 'Not Supported'}</p>
                         </div>
                         <button
                           onClick={() => connectToAdapter(adapter.id, adapter.type, {
                             address: adapter.address,
                             channel: 1
                           })}
                           className="connect-adapter-btn"
                           disabled={!adapter.supported}
                         >
                           Connect
                         </button>
                       </div>
                     ))
                   )}
                 </div>
                 <button onClick={loadAvailableAdapters} className="refresh-adapters-btn">
                   Refresh Adapters
                 </button>
               </div>
             )}

             {/* Connection Controls */}
             {obd2Connected && (
               <div className="connection-controls">
                 <button onClick={disconnectAdapter} className="disconnect-btn">
                   Disconnect Adapter
                 </button>
               </div>
             )}

             {/* Real-time Data Monitoring */}
             {obd2Connected && (
               <div className="data-monitoring">
                 <h3>Real-time Data Monitoring</h3>

                 <div className="monitoring-controls">
                   <div className="pid-selection">
                     <h4>Select PIDs to Monitor:</h4>
                     <div className="pid-checkboxes">
                       {[
                         { pid: '010C', name: 'Engine RPM' },
                         { pid: '010D', name: 'Vehicle Speed' },
                         { pid: '0105', name: 'Coolant Temp' },
                         { pid: '0111', name: 'Throttle Position' },
                         { pid: '010F', name: 'Intake Air Temp' },
                         { pid: '0110', name: 'Mass Air Flow' }
                       ].map((pid) => (
                         <label key={pid.pid} className="pid-checkbox">
                           <input
                             type="checkbox"
                             checked={selectedPIDs.includes(pid.pid)}
                             onChange={(e) => {
                               if (e.target.checked) {
                                 setSelectedPIDs([...selectedPIDs, pid.pid])
                               } else {
                                 setSelectedPIDs(selectedPIDs.filter(p => p !== pid.pid))
                               }
                             }}
                           />
                           {pid.name} ({pid.pid})
                         </label>
                       ))}
                     </div>
                   </div>

                   <div className="monitoring-buttons">
                     {!monitoringActive ? (
                       <button onClick={startDataMonitoring} className="start-monitoring-btn">
                         Start Monitoring
                       </button>
                     ) : (
                       <button onClick={stopDataMonitoring} className="stop-monitoring-btn">
                         Stop Monitoring
                       </button>
                     )}
                   </div>
                 </div>

                 {/* Live Data Display */}
                 {monitoringActive && (
                   <div className="live-data-display">
                     <h4>Live Data:</h4>
                     <div className="data-grid">
                       {Object.entries(obd2Data).map(([pid, data]) => (
                         <div key={pid} className="data-item">
                           <span className="data-label">{data.name}:</span>
                           <span className="data-value">{data.value} {data.unit}</span>
                         </div>
                       ))}
                     </div>
                   </div>
                 )}
               </div>
             )}

             {/* DTC Management */}
             {obd2Connected && (
               <div className="dtc-management">
                 <h3>DTC Management</h3>
                 <div className="dtc-controls">
                   <button onClick={readDTCs} className="read-dtc-btn">
                     Read DTCs
                   </button>
                   <button onClick={clearDTCs} className="clear-dtc-btn" disabled={obd2Dtcs.length === 0}>
                     Clear DTCs
                   </button>
                 </div>

                 {obd2Dtcs.length > 0 && (
                   <div className="dtc-list">
                     <h4>Stored DTCs:</h4>
                     {obd2Dtcs.map((dtc, index) => (
                       <div key={index} className="dtc-item">
                         <span className="dtc-code">{dtc.code}</span>
                         <span className="dtc-description">{dtc.description}</span>
                         <span className="dtc-severity">{dtc.severity}</span>
                       </div>
                     ))}
                   </div>
                 )}
               </div>
             )}

             {/* Custom Commands */}
             {obd2Connected && (
               <div className="custom-commands">
                 <h3>Custom OBD-II Commands</h3>
                 <div className="command-presets">
                   <h4>Quick Commands:</h4>
                   <div className="preset-buttons">
                     <button onClick={() => sendCustomCommand('0100')} className="preset-btn">
                       Get Supported PIDs
                     </button>
                     <button onClick={() => sendCustomCommand('0101')} className="preset-btn">
                       Get Status
                     </button>
                     <button onClick={() => sendCustomCommand('0103')} className="preset-btn">
                       Get DTCs
                     </button>
                     <button onClick={() => sendCustomCommand('010C')} className="preset-btn">
                       Get RPM
                     </button>
                     <button onClick={() => sendCustomCommand('010D')} className="preset-btn">
                       Get Speed
                     </button>
                   </div>
                 </div>

                 <div className="custom-command-input">
                   <h4>Send Custom Command:</h4>
                   <div className="command-input-group">
                     <input
                       type="text"
                       placeholder="Enter OBD-II command (e.g., 010C)"
                       id="customCommand"
                       className="command-input"
                     />
                     <button
                       onClick={() => {
                         const command = document.getElementById('customCommand').value.trim()
                         if (command) {
                           sendCustomCommand(command)
                         }
                       }}
                       className="send-command-btn"
                     >
                       Send
                     </button>
                   </div>
                 </div>
               </div>
             )}
           </div>
         )}

         {/* Mock Data Controller */}
         {showMockController && (
           <div className="mock-controller-section">
             <MockDataController />
           </div>
         )}

         {/* AI Dashboard */}
         {showAIDashboard && (
           <div className="ai-dashboard-section">
             <AIDashboard />
           </div>
         )}
      </div>
    </div>
  )
}

export default App
