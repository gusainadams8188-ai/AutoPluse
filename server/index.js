const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const Database = require('better-sqlite3');
const path = require('path');
const PluginLoader = require('../shared/plugin-loader');
const MockDataService = require('./mock-data-service');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*", // Allow all origins for development
    methods: ["GET", "POST"]
  }
});

app.use(cors({
  origin: true, // Allow all origins for development
  credentials: true
}));
app.use(express.json());

// Initialize SQLite database
const fs = require('fs');
const dbDir = path.join(__dirname, '../database');

// Create database directory if it doesn't exist
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(__dirname, '../database/vehicle_data.db');
const db = new Database(dbPath);

// Initialize mock data service
const mockDataService = new MockDataService();
console.log('Mock data service initialized');

// Initialize plugin system
const pluginLoader = new PluginLoader(path.join(__dirname, '../plugins'));
console.log('Initializing plugin system...');

// Load and initialize plugins
const loadedPlugins = pluginLoader.loadAllPlugins();
console.log(`Loaded ${loadedPlugins.length} plugins`);

const serverContext = { app, io, db, mockDataService };
pluginLoader.initializeAllPlugins(serverContext).then(() => {
  console.log('All plugins initialized successfully');
}).catch(error => {
  console.error('Error initializing plugins:', error);
});

// Create tables if not exist
db.exec(`
  CREATE TABLE IF NOT EXISTS vehicle_metrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    rpm REAL,
    speed REAL,
    coolant_temp REAL,
    intake_air_temp REAL,
    throttle_pos REAL,
    engine_load REAL,
    fuel_pressure REAL,
    intake_manifold_pressure REAL,
    mode TEXT,
    vehicle_type TEXT,
    fault_scenario TEXT
  );

  CREATE TABLE IF NOT EXISTS dtc_codes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT,
    status TEXT,
    description TEXT,
    severity TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS vin_data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vin TEXT,
    make TEXT,
    model TEXT,
    year INTEGER,
    engine TEXT,
    transmission TEXT,
    fuel_type TEXT,
    body_type TEXT,
    drivetrain TEXT,
    country_origin TEXT,
    manufacturer TEXT,
    plant_code TEXT,
    serial_number TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS maintenance_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    service_type TEXT,
    description TEXT,
    mileage INTEGER,
    cost REAL,
    date_performed DATE,
    next_service_mileage INTEGER,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS fuel_economy (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    fuel_level REAL,
    fuel_consumed REAL,
    distance_traveled REAL,
    instant_mpg REAL,
    average_mpg REAL,
    range_remaining REAL
  );

  CREATE TABLE IF NOT EXISTS trip_data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    trip_id TEXT,
    start_time DATETIME,
    end_time DATETIME,
    distance REAL,
    average_speed REAL,
    max_speed REAL,
    fuel_used REAL,
    duration INTEGER,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- OE-LEVEL extensions
  CREATE TABLE IF NOT EXISTS oem_manufacturers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    manufacturer_code TEXT UNIQUE,
    manufacturer_name TEXT,
    country TEXT,
    supported_protocols TEXT, -- JSON array of supported protocols
    proprietary_parameters TEXT, -- JSON object of proprietary parameter definitions
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS oem_dtc_codes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    manufacturer_id INTEGER,
    dtc_code TEXT,
    description TEXT,
    severity TEXT,
    category TEXT,
    subsystem TEXT,
    proprietary_info TEXT, -- JSON object with OEM-specific details
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (manufacturer_id) REFERENCES oem_manufacturers(id)
  );

  CREATE TABLE IF NOT EXISTS oem_vehicle_metrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    manufacturer_id INTEGER,
    -- Standard parameters
    rpm REAL,
    speed REAL,
    coolant_temp REAL,
    intake_air_temp REAL,
    throttle_pos REAL,
    engine_load REAL,
    fuel_pressure REAL,
    intake_manifold_pressure REAL,
    -- OEM proprietary parameters (JSON for flexibility)
    proprietary_data TEXT, -- JSON object with OEM-specific sensor data
    mode TEXT,
    vehicle_type TEXT,
    fault_scenario TEXT,
    FOREIGN KEY (manufacturer_id) REFERENCES oem_manufacturers(id)
  );

  CREATE TABLE IF NOT EXISTS oem_diagnostic_commands (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    command_id TEXT UNIQUE,
    manufacturer_id INTEGER,
    command_name TEXT,
    command_description TEXT,
    command_type TEXT, -- 'read', 'write', 'clear', 'test'
    parameters TEXT, -- JSON array of required parameters
    expected_response TEXT, -- JSON object describing expected response format
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (manufacturer_id) REFERENCES oem_manufacturers(id)
  );

  CREATE TABLE IF NOT EXISTS oem_command_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    command_id TEXT,
    manufacturer_id INTEGER,
    vin TEXT,
    command_parameters TEXT, -- JSON object of parameters used
    command_response TEXT, -- JSON object of response data
    execution_time REAL, -- Time taken to execute in milliseconds
    success BOOLEAN,
    error_message TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (manufacturer_id) REFERENCES oem_manufacturers(id),
    FOREIGN KEY (command_id) REFERENCES oem_diagnostic_commands(command_id)
  );
`);

// Populate initial data if tables are empty
const maintenanceCount = db.prepare('SELECT COUNT(*) as count FROM maintenance_history').get().count;
if (maintenanceCount === 0) {
  const maintenanceData = [
    { service_type: 'Oil Change', description: 'Full synthetic oil change', mileage: 15000, cost: 45.99, date_performed: '2024-01-15', next_service_mileage: 30000 },
    { service_type: 'Tire Rotation', description: 'Rotate all four tires', mileage: 15000, cost: 25.00, date_performed: '2024-01-15', next_service_mileage: 30000 },
    { service_type: 'Brake Inspection', description: 'Inspect brake pads and rotors', mileage: 20000, cost: 0.00, date_performed: '2024-02-20', next_service_mileage: 35000 },
    { service_type: 'Air Filter', description: 'Replace cabin air filter', mileage: 25000, cost: 15.99, date_performed: '2024-03-10', next_service_mileage: 40000 }
  ];

  const insertMaintenance = db.prepare('INSERT INTO maintenance_history (service_type, description, mileage, cost, date_performed, next_service_mileage) VALUES (?, ?, ?, ?, ?, ?)');
  maintenanceData.forEach(data => {
    insertMaintenance.run(data.service_type, data.description, data.mileage, data.cost, data.date_performed, data.next_service_mileage);
  });
}

const dtcCount = db.prepare('SELECT COUNT(*) as count FROM dtc_codes').get().count;
if (dtcCount === 0) {
  const dtcData = [
    { code: 'P0300', status: 'active', description: 'Random/Multiple Cylinder Misfire Detected', severity: 'High' },
    { code: 'P0171', status: 'pending', description: 'System Too Lean (Bank 1)', severity: 'Medium' },
    { code: 'P0420', status: 'active', description: 'Catalyst System Efficiency Below Threshold (Bank 1)', severity: 'Medium' }
  ];

  const insertDTC = db.prepare('INSERT INTO dtc_codes (code, status, description, severity) VALUES (?, ?, ?, ?)');
  dtcData.forEach(data => {
    insertDTC.run(data.code, data.status, data.description, data.severity);
  });
}

// Populate OE-LEVEL data if tables are empty
const oemCount = db.prepare('SELECT COUNT(*) as count FROM oem_manufacturers').get().count;
if (oemCount === 0) {
  const oemData = [
    {
      manufacturer_code: 'TOYOTA',
      manufacturer_name: 'Toyota Motor Corporation',
      country: 'Japan',
      supported_protocols: JSON.stringify(['ISO 14230-4', 'ISO 15765-4']),
      proprietary_parameters: JSON.stringify({
        'engine_oil_level': { unit: 'mm', range: [0, 100], description: 'Engine oil level sensor' },
        'transmission_temp': { unit: '°C', range: [-40, 150], description: 'Transmission fluid temperature' },
        'battery_voltage': { unit: 'V', range: [10, 16], description: 'Battery voltage' },
        'fuel_injector_pulse': { unit: 'ms', range: [0, 20], description: 'Fuel injector pulse width' }
      })
    },
    {
      manufacturer_code: 'FORD',
      manufacturer_name: 'Ford Motor Company',
      country: 'USA',
      supported_protocols: JSON.stringify(['ISO 14230-4', 'ISO 15765-4', 'SAE J1850']),
      proprietary_parameters: JSON.stringify({
        'transmission_slip': { unit: '%', range: [0, 100], description: 'Transmission slip percentage' },
        'brake_pad_wear': { unit: '%', range: [0, 100], description: 'Brake pad wear percentage' },
        'cabin_air_quality': { unit: 'ppm', range: [0, 5000], description: 'Cabin air quality sensor' },
        'tire_pressure_system': { unit: 'psi', range: [0, 50], description: 'TPMS pressure readings' }
      })
    },
    {
      manufacturer_code: 'BMW',
      manufacturer_name: 'Bayerische Motoren Werke AG',
      country: 'Germany',
      supported_protocols: JSON.stringify(['ISO 14230-4', 'BMW-FAST']),
      proprietary_parameters: JSON.stringify({
        'valvetronic_position': { unit: '°', range: [0, 90], description: 'Valvetronic valve position' },
        'dsc_status': { unit: 'boolean', description: 'Dynamic Stability Control status' },
        'adaptive_headlight_angle': { unit: '°', range: [-15, 15], description: 'Adaptive headlight angle' },
        'comfort_access_status': { unit: 'boolean', description: 'Comfort access system status' }
      })
    },
    {
      manufacturer_code: 'VW',
      manufacturer_name: 'Volkswagen AG',
      country: 'Germany',
      supported_protocols: JSON.stringify(['ISO 14230-4', 'ISO 15765-4', 'VW-CAN']),
      proprietary_parameters: JSON.stringify({
        'engine_oil_level': { unit: 'mm', range: [0, 100], description: 'Engine oil level sensor' },
        'transmission_temp': { unit: '°C', range: [-40, 150], description: 'Transmission fluid temperature' },
        'battery_voltage': { unit: 'V', range: [10, 16], description: 'Battery voltage' },
        'fuel_injector_pulse': { unit: 'ms', range: [0, 20], description: 'Fuel injector pulse width' },
        'abs_pressure': { unit: 'bar', range: [0, 200], description: 'ABS system pressure' },
        'esp_status': { unit: 'boolean', description: 'Electronic Stability Program status' },
        'airbag_status': { unit: 'boolean', description: 'Airbag system status' },
        'immobilizer_status': { unit: 'boolean', description: 'Immobilizer system status' }
      })
    }
  ];

  const insertOEM = db.prepare('INSERT INTO oem_manufacturers (manufacturer_code, manufacturer_name, country, supported_protocols, proprietary_parameters) VALUES (?, ?, ?, ?, ?)');
  oemData.forEach(data => {
    insertOEM.run(data.manufacturer_code, data.manufacturer_name, data.country, data.supported_protocols, data.proprietary_parameters);
  });
}

// Populate OEM-specific DTC codes
const oemDtcCount = db.prepare('SELECT COUNT(*) as count FROM oem_dtc_codes').get().count;
if (oemDtcCount === 0) {
  const oemDtcData = [
    // Toyota specific codes
    { manufacturer_code: 'TOYOTA', code: 'P1604', description: 'Startability Malfunction', severity: 'High', category: 'Engine', subsystem: 'ECU' },
    { manufacturer_code: 'TOYOTA', code: 'P1614', description: 'SBDS Interactive Codes', severity: 'Medium', category: 'Communication', subsystem: 'Network' },
    { manufacturer_code: 'TOYOTA', code: 'P1633', description: 'ECM Malfunction (ETCS Circuit)', severity: 'High', category: 'Engine', subsystem: 'ETCS' },

    // Ford specific codes
    { manufacturer_code: 'FORD', code: 'P1000', description: 'OBD Systems Readiness Test Not Complete', severity: 'Low', category: 'System', subsystem: 'OBD' },
    { manufacturer_code: 'FORD', code: 'P1100', description: 'Mass Air Flow Sensor Intermittent', severity: 'Medium', category: 'Engine', subsystem: 'MAF' },
    { manufacturer_code: 'FORD', code: 'P1299', description: 'Cylinder Head Over Temperature Protection Active', severity: 'High', category: 'Engine', subsystem: 'Cooling' },

    // BMW specific codes
    { manufacturer_code: 'BMW', code: '2A17', description: 'DME Internal Fault', severity: 'High', category: 'Engine', subsystem: 'DME' },
    { manufacturer_code: 'BMW', code: '2A31', description: 'DME Internal Fault', severity: 'High', category: 'Engine', subsystem: 'DME' },
    { manufacturer_code: 'BMW', code: '2A47', description: 'DME Internal Fault', severity: 'High', category: 'Engine', subsystem: 'DME' },

    // VW Polo 9N specific codes
    { manufacturer_code: 'VW', code: 'P0101', description: 'Mass or Volume Air Flow Circuit Range/Performance Problem', severity: 'Medium', category: 'Engine', subsystem: 'Air Flow' },
    { manufacturer_code: 'VW', code: 'P0171', description: 'System Too Lean (Bank 1)', severity: 'Medium', category: 'Engine', subsystem: 'Fuel System' },
    { manufacturer_code: 'VW', code: 'P0300', description: 'Random/Multiple Cylinder Misfire Detected', severity: 'High', category: 'Engine', subsystem: 'Ignition' },
    { manufacturer_code: 'VW', code: 'P0325', description: 'Knock Sensor 1 Circuit Malfunction (Bank 1)', severity: 'Medium', category: 'Engine', subsystem: 'Knock Sensor' },
    { manufacturer_code: 'VW', code: 'P0401', description: 'Exhaust Gas Recirculation Flow Insufficient', severity: 'Medium', category: 'Engine', subsystem: 'EGR' },
    { manufacturer_code: 'VW', code: 'P0441', description: 'Evaporative Emission Control System Incorrect Purge Flow', severity: 'Low', category: 'Emissions', subsystem: 'EVAP' },
    { manufacturer_code: 'VW', code: 'P0501', description: 'Vehicle Speed Sensor Range/Performance', severity: 'Medium', category: 'Transmission', subsystem: 'Speed Sensor' },
    { manufacturer_code: 'VW', code: 'P0700', description: 'Transmission Control System Malfunction', severity: 'High', category: 'Transmission', subsystem: 'TCM' },
    { manufacturer_code: 'VW', code: 'P1602', description: 'Powertrain Control Module Programming Error', severity: 'High', category: 'Engine', subsystem: 'ECM' },
    { manufacturer_code: 'VW', code: 'P1611', description: 'MIL Call-Up Circuit/Tell Tale Circuit Malfunction', severity: 'Low', category: 'System', subsystem: 'MIL' }
  ];

  const insertOEMDTC = db.prepare('INSERT INTO oem_dtc_codes (manufacturer_id, dtc_code, description, severity, category, subsystem) VALUES ((SELECT id FROM oem_manufacturers WHERE manufacturer_code = ?), ?, ?, ?, ?, ?)');
  oemDtcData.forEach(data => {
    insertOEMDTC.run(data.manufacturer_code, data.code, data.description, data.severity, data.category, data.subsystem);
  });
}

// Populate OEM diagnostic commands
const oemCommandCount = db.prepare('SELECT COUNT(*) as count FROM oem_diagnostic_commands').get().count;
if (oemCommandCount === 0) {
  const oemCommandData = [
    // Toyota commands
    {
      manufacturer_code: 'TOYOTA',
      command_id: 'TOYOTA_READ_ENGINE_OIL',
      command_name: 'Read Engine Oil Level',
      command_description: 'Retrieve current engine oil level and status',
      command_type: 'read',
      parameters: JSON.stringify([]),
      expected_response: JSON.stringify({
        oil_level: { type: 'number', unit: 'mm', description: 'Oil level in millimeters' },
        oil_temperature: { type: 'number', unit: '°C', description: 'Oil temperature' },
        oil_pressure: { type: 'number', unit: 'kPa', description: 'Oil pressure' },
        next_change_mileage: { type: 'number', unit: 'miles', description: 'Miles until next oil change' }
      })
    },
    {
      manufacturer_code: 'TOYOTA',
      command_id: 'TOYOTA_READ_TRANSMISSION_TEMP',
      command_name: 'Read Transmission Temperature',
      command_description: 'Retrieve transmission fluid temperature and status',
      command_type: 'read',
      parameters: JSON.stringify([]),
      expected_response: JSON.stringify({
        transmission_temp: { type: 'number', unit: '°C', description: 'Transmission temperature' },
        fluid_level: { type: 'string', description: 'Fluid level status' },
        filter_status: { type: 'string', description: 'Filter status' }
      })
    },
    {
      manufacturer_code: 'TOYOTA',
      command_id: 'TOYOTA_CLEAR_ADAPTIVE_MEMORY',
      command_name: 'Clear Adaptive Memory',
      command_description: 'Reset ECU adaptive learning parameters',
      command_type: 'write',
      parameters: JSON.stringify([]),
      expected_response: JSON.stringify({
        status: { type: 'string', description: 'Operation status' },
        modules_reset: { type: 'array', description: 'List of modules reset' }
      })
    },

    // Ford commands
    {
      manufacturer_code: 'FORD',
      command_id: 'FORD_READ_BRAKE_PAD_WEAR',
      command_name: 'Read Brake Pad Wear',
      command_description: 'Retrieve brake pad wear percentages for all wheels',
      command_type: 'read',
      parameters: JSON.stringify([]),
      expected_response: JSON.stringify({
        front_left: { type: 'number', unit: '%', description: 'Front left brake pad wear' },
        front_right: { type: 'number', unit: '%', description: 'Front right brake pad wear' },
        rear_left: { type: 'number', unit: '%', description: 'Rear left brake pad wear' },
        rear_right: { type: 'number', unit: '%', description: 'Rear right brake pad wear' }
      })
    },
    {
      manufacturer_code: 'FORD',
      command_id: 'FORD_READ_TIRE_PRESSURE',
      command_name: 'Read Tire Pressure',
      command_description: 'Retrieve tire pressure readings from TPMS',
      command_type: 'read',
      parameters: JSON.stringify([]),
      expected_response: JSON.stringify({
        front_left: { type: 'number', unit: 'psi', description: 'Front left tire pressure' },
        front_right: { type: 'number', unit: 'psi', description: 'Front right tire pressure' },
        rear_left: { type: 'number', unit: 'psi', description: 'Rear left tire pressure' },
        rear_right: { type: 'number', unit: 'psi', description: 'Rear right tire pressure' }
      })
    },
    {
      manufacturer_code: 'FORD',
      command_id: 'FORD_SYNC_KEY_FOBS',
      command_name: 'Sync Key Fobs',
      command_description: 'Synchronize key fob remote controls',
      command_type: 'write',
      parameters: JSON.stringify([]),
      expected_response: JSON.stringify({
        status: { type: 'string', description: 'Synchronization status' },
        keys_synchronized: { type: 'number', description: 'Number of keys synchronized' }
      })
    },

    // BMW commands
    {
      manufacturer_code: 'BMW',
      command_id: 'BMW_READ_VALVETRONIC_POSITION',
      command_name: 'Read Valvetronic Position',
      command_description: 'Retrieve valvetronic valve position data',
      command_type: 'read',
      parameters: JSON.stringify([]),
      expected_response: JSON.stringify({
        intake_valve_position: { type: 'number', unit: '°', description: 'Intake valve position' },
        exhaust_valve_position: { type: 'number', unit: '°', description: 'Exhaust valve position' }
      })
    },
    {
      manufacturer_code: 'BMW',
      command_id: 'BMW_READ_DSC_STATUS',
      command_name: 'Read DSC Status',
      command_description: 'Retrieve Dynamic Stability Control system status',
      command_type: 'read',
      parameters: JSON.stringify([]),
      expected_response: JSON.stringify({
        dsc_active: { type: 'boolean', description: 'DSC system active status' },
        traction_control: { type: 'boolean', description: 'Traction control status' },
        stability_control: { type: 'boolean', description: 'Stability control status' }
      })
    },
    {
      manufacturer_code: 'BMW',
      command_id: 'BMW_CALIBRATE_ADAPTIVE_HEADLIGHTS',
      command_name: 'Calibrate Adaptive Headlights',
      command_description: 'Calibrate adaptive headlight system',
      command_type: 'write',
      parameters: JSON.stringify([]),
      expected_response: JSON.stringify({
        status: { type: 'string', description: 'Calibration status' },
        calibration_angle: { type: 'number', unit: '°', description: 'Calibration angle' }
      })
    },

    // VW Polo 9N commands
    {
      manufacturer_code: 'VW',
      command_id: 'VW_READ_ENGINE_OIL_LEVEL',
      command_name: 'Read Engine Oil Level',
      command_description: 'Retrieve current engine oil level and status',
      command_type: 'read',
      parameters: JSON.stringify([]),
      expected_response: JSON.stringify({
        oil_level: { type: 'number', unit: 'mm', description: 'Oil level in millimeters' },
        oil_temperature: { type: 'number', unit: '°C', description: 'Oil temperature' },
        oil_pressure: { type: 'number', unit: 'kPa', description: 'Oil pressure' },
        next_change_mileage: { type: 'number', unit: 'miles', description: 'Miles until next oil change' }
      })
    },
    {
      manufacturer_code: 'VW',
      command_id: 'VW_READ_TRANSMISSION_TEMP',
      command_name: 'Read Transmission Temperature',
      command_description: 'Retrieve transmission fluid temperature and status',
      command_type: 'read',
      parameters: JSON.stringify([]),
      expected_response: JSON.stringify({
        transmission_temp: { type: 'number', unit: '°C', description: 'Transmission temperature' },
        fluid_level: { type: 'string', description: 'Fluid level status' },
        filter_status: { type: 'string', description: 'Filter status' }
      })
    },
    {
      manufacturer_code: 'VW',
      command_id: 'VW_READ_ABS_STATUS',
      command_name: 'Read ABS System Status',
      command_description: 'Retrieve ABS system pressure and status',
      command_type: 'read',
      parameters: JSON.stringify([]),
      expected_response: JSON.stringify({
        abs_pressure: { type: 'number', unit: 'bar', description: 'ABS system pressure' },
        abs_active: { type: 'boolean', description: 'ABS system active status' },
        brake_pad_wear: { type: 'number', unit: '%', description: 'Brake pad wear percentage' }
      })
    },
    {
      manufacturer_code: 'VW',
      command_id: 'VW_RESET_SERVICE_INTERVAL',
      command_name: 'Reset Service Interval',
      command_description: 'Reset the service interval indicator',
      command_type: 'write',
      parameters: JSON.stringify([]),
      expected_response: JSON.stringify({
        status: { type: 'string', description: 'Reset status' },
        next_service_mileage: { type: 'number', unit: 'miles', description: 'Next service mileage' }
      })
    },
    {
      manufacturer_code: 'VW',
      command_id: 'VW_READ_IMMOBILIZER_STATUS',
      command_name: 'Read Immobilizer Status',
      command_description: 'Check immobilizer system status',
      command_type: 'read',
      parameters: JSON.stringify([]),
      expected_response: JSON.stringify({
        immobilizer_active: { type: 'boolean', description: 'Immobilizer system active' },
        key_recognized: { type: 'boolean', description: 'Key recognition status' },
        security_status: { type: 'string', description: 'Security system status' }
      })
    }
  ];

  const insertOEMCommand = db.prepare(`
    INSERT INTO oem_diagnostic_commands (manufacturer_id, command_id, command_name, command_description, command_type, parameters, expected_response)
    VALUES ((SELECT id FROM oem_manufacturers WHERE manufacturer_code = ?), ?, ?, ?, ?, ?, ?)
  `);

  oemCommandData.forEach(data => {
    insertOEMCommand.run(
      data.manufacturer_code,
      data.command_id,
      data.command_name,
      data.command_description,
      data.command_type,
      data.parameters,
      data.expected_response
    );
  });
}


// Socket.IO for real-time data
io.on('connection', (socket) => {
  console.log('Client connected');

  // Send initial data immediately
  const initialMockData = mockDataService.generateVehicleData();
  const initialFuelData = mockDataService.generateFuelData(initialMockData);
  socket.emit('vehicleData', initialMockData);
  socket.emit('fuelData', initialFuelData);

  // Simulate real-time data with enhanced scenarios
  const interval = setInterval(async () => {
    // Generate mock vehicle data using the service
    const mockData = mockDataService.generateVehicleData();

    // Generate fuel economy data using the service
    const fuelData = mockDataService.generateFuelData(mockData);

    // Perform real-time anomaly detection
    let anomalyResult = null;
    try {
      if (anomalyDetector.isTrained) {
        anomalyResult = await anomalyDetector.detectRealtimeAnomalies([mockData]);
        socket.emit('anomalyAlert', anomalyResult);
      }
    } catch (error) {
      console.error('Error in real-time anomaly detection:', error);
    }

    // Perform failure prediction
    let failurePrediction = null;
    try {
      if (failurePredictor.isTrained) {
        // Get recent data for sequence prediction
        const recentData = await dataPipeline.collector.getRealtimeData(20);
        if (recentData.length >= 10) {
          failurePrediction = await failurePredictor.predictFailure(recentData);
          socket.emit('failurePrediction', failurePrediction);
        }
      }
    } catch (error) {
      console.error('Error in failure prediction:', error);
    }

    // Send enhanced data with AI insights
    const enhancedData = {
      ...mockData,
      anomalyDetected: anomalyResult?.isAnomaly || false,
      anomalySeverity: anomalyResult?.severity || 'normal',
      failureRisk: failurePrediction?.riskLevel || 'low',
      aiTimestamp: new Date().toISOString()
    };

    socket.emit('vehicleData', enhancedData);
    socket.emit('fuelData', fuelData);

    // Save to database
    const insert = db.prepare(`
      INSERT INTO vehicle_metrics (rpm, speed, coolant_temp, intake_air_temp, throttle_pos, engine_load, fuel_pressure, intake_manifold_pressure, mode, vehicle_type, fault_scenario)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insert.run(mockData.rpm, mockData.speed, mockData.coolant_temp, mockData.intake_air_temp, mockData.throttle_pos, mockData.engine_load, mockData.fuel_pressure, mockData.intake_manifold_pressure, mockData.mode, mockData.vehicleType, mockData.faultScenario);

    // Save fuel economy data
    const fuelInsert = db.prepare(`
      INSERT INTO fuel_economy (fuel_level, fuel_consumed, distance_traveled, instant_mpg, average_mpg, range_remaining)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    fuelInsert.run(fuelData.fuel_level, fuelData.fuel_consumed, fuelData.distance_traveled, fuelData.instant_mpg, fuelData.average_mpg, fuelData.range_remaining);

    // Save OEM vehicle metrics for each manufacturer
    const manufacturers = db.prepare('SELECT id, manufacturer_code FROM oem_manufacturers').all();
    manufacturers.forEach(manufacturer => {
      const oemData = generateOEMVehicleMetrics(manufacturer.id, mockData);
      const oemInsert = db.prepare(`
        INSERT INTO oem_vehicle_metrics (manufacturer_id, rpm, speed, coolant_temp, intake_air_temp, throttle_pos, engine_load, fuel_pressure, intake_manifold_pressure, proprietary_data, mode, vehicle_type, fault_scenario)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      oemInsert.run(
        oemData.manufacturer_id,
        oemData.rpm,
        oemData.speed,
        oemData.coolant_temp,
        oemData.intake_air_temp,
        oemData.throttle_pos,
        oemData.engine_load,
        oemData.fuel_pressure,
        oemData.intake_manifold_pressure,
        oemData.proprietary_data,
        oemData.mode,
        oemData.vehicle_type,
        oemData.fault_scenario
      );
    });
  }, 2000); // Every 2 seconds

  socket.on('disconnect', () => {
    console.log('Client disconnected');
    clearInterval(interval);
  });
});


// Mock Data Service API endpoints
app.get('/api/mock/status', (req, res) => {
  try {
    const status = mockDataService.getStatus();
    res.json(status);
  } catch (error) {
    console.error('Error getting mock data status:', error);
    res.status(500).json({ error: 'Failed to get mock data status' });
  }
});

app.post('/api/mock/enable', (req, res) => {
  try {
    const { enabled } = req.body;
    mockDataService.setEnabled(enabled);
    res.json({ success: true, enabled: mockDataService.isMockEnabled() });
  } catch (error) {
    console.error('Error setting mock data enabled state:', error);
    res.status(500).json({ error: 'Failed to set mock data enabled state' });
  }
});

app.post('/api/mock/scenario', (req, res) => {
  try {
    const { scenario } = req.body;
    mockDataService.setScenario(scenario);
    res.json({ success: true, currentScenario: mockDataService.getCurrentScenario() });
  } catch (error) {
    console.error('Error setting mock data scenario:', error);
    res.status(500).json({ error: 'Failed to set mock data scenario' });
  }
});

app.post('/api/mock/vehicle-type', (req, res) => {
  try {
    const { vehicleType } = req.body;
    mockDataService.setVehicleType(vehicleType);
    res.json({ success: true, currentVehicleType: mockDataService.getStatus().currentVehicleType });
  } catch (error) {
    console.error('Error setting vehicle type:', error);
    res.status(500).json({ error: 'Failed to set vehicle type' });
  }
});

app.get('/api/mock/scenarios', (req, res) => {
  try {
    const scenarios = mockDataService.getAvailableScenarios();
    res.json(scenarios);
  } catch (error) {
    console.error('Error getting available scenarios:', error);
    res.status(500).json({ error: 'Failed to get available scenarios' });
  }
});

app.get('/api/mock/vehicle-types', (req, res) => {
  try {
    const vehicleTypes = mockDataService.getAvailableVehicleTypes();
    res.json(vehicleTypes);
  } catch (error) {
    console.error('Error getting available vehicle types:', error);
    res.status(500).json({ error: 'Failed to get available vehicle types' });
  }
});

app.post('/api/mock/clear-history', (req, res) => {
  try {
    mockDataService.clearHistory();
    res.json({ success: true, message: 'Mock data history cleared' });
  } catch (error) {
    console.error('Error clearing mock data history:', error);
    res.status(500).json({ error: 'Failed to clear mock data history' });
  }
});

// API routes
app.get('/api/dtc', (req, res) => {
  if (mockDataService.isMockEnabled()) {
    // Return mock DTC codes
    const mockDtcs = mockDataService.generateDTCCodes();
    res.json(mockDtcs);
  } else {
    // Return real DTC codes from database
    const dtcs = db.prepare('SELECT * FROM dtc_codes ORDER BY timestamp DESC').all();
    res.json(dtcs);
  }
});

app.post('/api/dtc', (req, res) => {
  const { code, status, description, severity } = req.body;
  const insert = db.prepare('INSERT INTO dtc_codes (code, status, description, severity) VALUES (?, ?, ?, ?)');
  const result = insert.run(code, status, description, severity);
  res.json({ id: result.lastInsertRowid });
});

app.get('/api/vin/:vin', (req, res) => {
  const { vin } = req.params;
  // Mock VIN decoding (replace with actual decoder)
  const decoded = {
    make: 'Toyota',
    model: 'Camry',
    year: 2020,
    engine: '2.5L',
    transmission: 'Automatic',
    fuel_type: 'Gasoline',
    body_type: 'Sedan',
    drivetrain: 'FWD',
    country_origin: 'Japan',
    manufacturer: 'Toyota Motor Corporation',
    plant_code: 'A',
    serial_number: '123456'
  };
  res.json(decoded);
});

// Maintenance History API
app.get('/api/maintenance', (req, res) => {
  if (mockDataService.isMockEnabled()) {
    // Return mock maintenance history
    const mockMaintenance = mockDataService.generateMaintenanceHistory();
    res.json(mockMaintenance);
  } else {
    // Return real maintenance history from database
    const maintenance = db.prepare('SELECT * FROM maintenance_history ORDER BY date_performed DESC').all();
    res.json(maintenance);
  }
});

app.post('/api/maintenance', (req, res) => {
  const { service_type, description, mileage, cost, date_performed, next_service_mileage } = req.body;
  const insert = db.prepare('INSERT INTO maintenance_history (service_type, description, mileage, cost, date_performed, next_service_mileage) VALUES (?, ?, ?, ?, ?, ?)');
  const result = insert.run(service_type, description, mileage, cost, date_performed, next_service_mileage);
  res.json({ id: result.lastInsertRowid });
});

// Fuel Economy API
app.get('/api/fuel-economy', (req, res) => {
  const fuelData = db.prepare('SELECT * FROM fuel_economy ORDER BY timestamp DESC LIMIT 100').all();
  res.json(fuelData);
});

app.post('/api/fuel-economy', (req, res) => {
  const { fuel_level, fuel_consumed, distance_traveled, instant_mpg, average_mpg, range_remaining } = req.body;
  const insert = db.prepare('INSERT INTO fuel_economy (fuel_level, fuel_consumed, distance_traveled, instant_mpg, average_mpg, range_remaining) VALUES (?, ?, ?, ?, ?, ?)');
  const result = insert.run(fuel_level, fuel_consumed, distance_traveled, instant_mpg, average_mpg, range_remaining);
  res.json({ id: result.lastInsertRowid });
});

// Trip Data API
app.get('/api/trips', (req, res) => {
  const trips = db.prepare('SELECT * FROM trip_data ORDER BY start_time DESC').all();
  res.json(trips);
});

app.post('/api/trips', (req, res) => {
  const { trip_id, start_time, end_time, distance, average_speed, max_speed, fuel_used, duration } = req.body;
  const insert = db.prepare('INSERT INTO trip_data (trip_id, start_time, end_time, distance, average_speed, max_speed, fuel_used, duration) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
  const result = insert.run(trip_id, start_time, end_time, distance, average_speed, max_speed, fuel_used, duration);
  res.json({ id: result.lastInsertRowid });
});

// Plugin Management API
app.get('/api/plugins', (req, res) => {
  try {
    const plugins = pluginLoader.discoverPlugins();
    const loadedPlugins = [];

    for (const plugin of plugins) {
      const status = pluginLoader.getPluginStatus(plugin.name);
      loadedPlugins.push({
        ...plugin,
        status
      });
    }

    res.json(loadedPlugins);
  } catch (error) {
    console.error('Error getting plugins:', error);
    res.status(500).json({ error: 'Failed to get plugins' });
  }
});

app.post('/api/plugins/:pluginName/load', (req, res) => {
  try {
    const { pluginName } = req.params;
    const plugin = pluginLoader.loadPlugin(pluginName);

    if (plugin) {
      const context = { app, io, db };
      pluginLoader.initializePlugin(pluginName, context).then(() => {
        res.json({ success: true, message: `Plugin ${pluginName} loaded and initialized` });
      }).catch(error => {
        console.error(`Error initializing plugin ${pluginName}:`, error);
        res.status(500).json({ error: `Failed to initialize plugin: ${error.message}` });
      });
    } else {
      res.status(404).json({ error: `Plugin ${pluginName} not found` });
    }
  } catch (error) {
    console.error(`Error loading plugin ${req.params.pluginName}:`, error);
    res.status(500).json({ error: `Failed to load plugin: ${error.message}` });
  }
});

app.post('/api/plugins/:pluginName/unload', (req, res) => {
  try {
    const { pluginName } = req.params;
    pluginLoader.unloadPlugin(pluginName);
    res.json({ success: true, message: `Plugin ${pluginName} unloaded` });
  } catch (error) {
    console.error(`Error unloading plugin ${req.params.pluginName}:`, error);
    res.status(500).json({ error: `Failed to unload plugin: ${error.message}` });
  }
});

app.get('/api/plugins/:pluginName/status', (req, res) => {
  try {
    const { pluginName } = req.params;
    const status = pluginLoader.getPluginStatus(pluginName);
    res.json({ plugin: pluginName, status });
  } catch (error) {
    console.error(`Error getting plugin status ${req.params.pluginName}:`, error);
    res.status(500).json({ error: 'Failed to get plugin status' });
  }
});

// Vehicle Health Score API
app.get('/api/health-score', (req, res) => {
  // Calculate health score based on recent metrics
  const recentMetrics = db.prepare('SELECT * FROM vehicle_metrics ORDER BY timestamp DESC LIMIT 10').all();
  const dtcCount = db.prepare('SELECT COUNT(*) as count FROM dtc_codes WHERE status = "active"').get().count;

  let healthScore = 100;
  let issues = [];
  let oemIssues = [];

  if (recentMetrics.length > 0) {
    const avgCoolantTemp = recentMetrics.reduce((sum, m) => sum + m.coolant_temp, 0) / recentMetrics.length;
    const avgFuelPressure = recentMetrics.reduce((sum, m) => sum + m.fuel_pressure, 0) / recentMetrics.length;

    if (avgCoolantTemp > 100) {
      healthScore -= 20;
      issues.push('High coolant temperature');
    }
    if (avgFuelPressure < 30) {
      healthScore -= 15;
      issues.push('Low fuel pressure');
    }
  }

  if (dtcCount > 0) {
    healthScore -= dtcCount * 10;
    issues.push(`${dtcCount} active DTC codes`);
  }

  // Include OE-LEVEL health considerations
  const oemManufacturers = db.prepare('SELECT id, manufacturer_code FROM oem_manufacturers').all();

  for (const manufacturer of oemManufacturers) {
    // Check OEM-specific DTC codes
    const oemDtcCount = db.prepare(`
      SELECT COUNT(*) as count FROM oem_dtc_codes
      WHERE manufacturer_id = ? AND severity IN ('High', 'Critical')
    `).get(manufacturer.id).count;

    if (oemDtcCount > 0) {
      healthScore -= oemDtcCount * 15; // OEM codes have higher impact
      oemIssues.push(`${oemDtcCount} critical ${manufacturer.manufacturer_code} DTC codes`);
    }

    // Check OEM vehicle metrics for proprietary parameter issues
    const recentOemMetrics = db.prepare(`
      SELECT proprietary_data FROM oem_vehicle_metrics
      WHERE manufacturer_id = ?
      ORDER BY timestamp DESC LIMIT 5
    `).all(manufacturer.id);

    if (recentOemMetrics.length > 0) {
      // Analyze proprietary parameters for issues
      const proprietaryIssues = analyzeProprietaryParameters(manufacturer.manufacturer_code, recentOemMetrics);
      if (proprietaryIssues.length > 0) {
        healthScore -= proprietaryIssues.length * 5;
        oemIssues.push(...proprietaryIssues.map(issue => `${manufacturer.manufacturer_code}: ${issue}`));
      }
    }
  }

  healthScore = Math.max(0, Math.min(100, healthScore));

  res.json({
    score: Math.round(healthScore),
    issues: [...issues, ...oemIssues],
    status: healthScore > 80 ? 'Excellent' : healthScore > 60 ? 'Good' : healthScore > 40 ? 'Fair' : 'Poor',
    oem_issues: oemIssues.length > 0 ? oemIssues : null
  });
});

// OE-LEVEL API Endpoints

// Get all OEM manufacturers
app.get('/api/oem/manufacturers', (req, res) => {
  const manufacturers = db.prepare('SELECT * FROM oem_manufacturers ORDER BY manufacturer_name').all();
  res.json(manufacturers);
});

// Get OEM-specific DTC codes
app.get('/api/oem/dtc/:manufacturer', (req, res) => {
  const { manufacturer } = req.params;
  const dtcs = db.prepare(`
    SELECT od.*, om.manufacturer_name
    FROM oem_dtc_codes od
    JOIN oem_manufacturers om ON od.manufacturer_id = om.id
    WHERE om.manufacturer_code = ?
    ORDER BY od.dtc_code
  `).all(manufacturer);
  res.json(dtcs);
});

// Get all OEM DTC codes
app.get('/api/oem/dtc', (req, res) => {
  const dtcs = db.prepare(`
    SELECT od.*, om.manufacturer_name, om.manufacturer_code
    FROM oem_dtc_codes od
    JOIN oem_manufacturers om ON od.manufacturer_id = om.id
    ORDER BY om.manufacturer_name, od.dtc_code
  `).all();
  res.json(dtcs);
});

// Get OEM vehicle metrics
app.get('/api/oem/metrics/:manufacturer', (req, res) => {
  const { manufacturer } = req.params;
  const metrics = db.prepare(`
    SELECT ovm.*, om.manufacturer_name
    FROM oem_vehicle_metrics ovm
    JOIN oem_manufacturers om ON ovm.manufacturer_id = om.id
    WHERE om.manufacturer_code = ?
    ORDER BY ovm.timestamp DESC
    LIMIT 50
  `).all(manufacturer);
  res.json(metrics);
});

// Get OEM diagnostic commands
app.get('/api/oem/commands/:manufacturer', (req, res) => {
  const { manufacturer } = req.params;
  const commands = db.prepare(`
    SELECT odc.*, om.manufacturer_name
    FROM oem_diagnostic_commands odc
    JOIN oem_manufacturers om ON odc.manufacturer_id = om.id
    WHERE om.manufacturer_code = ?
    ORDER BY odc.command_name
  `).all(manufacturer);
  res.json(commands);
});

// Execute OEM diagnostic command
app.post('/api/oem/commands/execute', (req, res) => {
  const { command_id, vin, parameters } = req.body;

  // Get command details
  const command = db.prepare(`
    SELECT odc.*, om.manufacturer_code
    FROM oem_diagnostic_commands odc
    JOIN oem_manufacturers om ON odc.manufacturer_id = om.id
    WHERE odc.command_id = ?
  `).get(command_id);

  if (!command) {
    return res.status(404).json({ error: 'Command not found' });
  }

  // Simulate command execution
  const startTime = Date.now();
  const mockResponse = generateOEMCommandResponse(command, parameters);
  const executionTime = Date.now() - startTime;

  // Store command execution history
  const insertHistory = db.prepare(`
    INSERT INTO oem_command_history (command_id, manufacturer_id, vin, command_parameters, command_response, execution_time, success)
    VALUES (?, (SELECT id FROM oem_manufacturers WHERE manufacturer_code = ?), ?, ?, ?, ?, ?)
  `);

  insertHistory.run(
    command_id,
    command.manufacturer_code,
    vin || 'DEMO_VIN',
    JSON.stringify(parameters || {}),
    JSON.stringify(mockResponse),
    executionTime,
    true
  );

  res.json({
    command_id,
    manufacturer: command.manufacturer_code,
    response: mockResponse,
    execution_time: executionTime,
    success: true
  });
});

// Get OEM command history
app.get('/api/oem/commands/history/:manufacturer', (req, res) => {
  const { manufacturer } = req.params;
  const history = db.prepare(`
    SELECT och.*, om.manufacturer_name, odc.command_name
    FROM oem_command_history och
    JOIN oem_manufacturers om ON och.manufacturer_id = om.id
    JOIN oem_diagnostic_commands odc ON och.command_id = odc.command_id
    WHERE om.manufacturer_code = ?
    ORDER BY och.timestamp DESC
    LIMIT 20
  `).all(manufacturer);
  res.json(history);
});

// Enhanced VIN decoder with OEM data
app.get('/api/vin/:vin/oem', (req, res) => {
  const { vin } = req.params;

  // Extract manufacturer from VIN (first 3 characters typically)
  const manufacturerCode = vin.substring(0, 3).toUpperCase();

  // Get OEM manufacturer data
  const oemManufacturer = db.prepare('SELECT * FROM oem_manufacturers WHERE manufacturer_code = ?').get(manufacturerCode);

  // Get standard VIN data
  const standardData = {
    make: 'Toyota',
    model: 'Camry',
    year: 2020,
    engine: '2.5L',
    transmission: 'Automatic',
    fuel_type: 'Gasoline',
    body_type: 'Sedan',
    drivetrain: 'FWD',
    country_origin: 'Japan',
    manufacturer: 'Toyota Motor Corporation',
    plant_code: 'A',
    serial_number: '123456'
  };

  // Enhance with OEM data if available
  if (oemManufacturer) {
    standardData.oem_data = {
      manufacturer_code: oemManufacturer.manufacturer_code,
      manufacturer_name: oemManufacturer.manufacturer_name,
      country: oemManufacturer.country,
      supported_protocols: JSON.parse(oemManufacturer.supported_protocols),
      proprietary_parameters: JSON.parse(oemManufacturer.proprietary_parameters)
    };
  }

  res.json(standardData);
});

// Helper function to generate OEM command responses
function generateOEMCommandResponse(command, parameters) {
  const responses = {
    'TOYOTA': {
      'read_engine_oil': {
        oil_level: Math.round((60 + Math.random() * 40) * 10) / 10,
        oil_temperature: Math.round((80 + Math.random() * 30) * 10) / 10,
        oil_pressure: Math.round((30 + Math.random() * 20) * 10) / 10,
        next_change_mileage: 5000 + Math.floor(Math.random() * 3000)
      },
      'read_transmission_temp': {
        transmission_temp: Math.round((70 + Math.random() * 40) * 10) / 10,
        fluid_level: 'normal',
        filter_status: 'good'
      },
      'clear_adaptive_memory': {
        status: 'completed',
        modules_reset: ['ECM', 'TCM', 'ABS']
      }
    },
    'FORD': {
      'read_brake_pad_wear': {
        front_left: Math.round((70 + Math.random() * 30) * 10) / 10,
        front_right: Math.round((70 + Math.random() * 30) * 10) / 10,
        rear_left: Math.round((80 + Math.random() * 20) * 10) / 10,
        rear_right: Math.round((80 + Math.random() * 20) * 10) / 10
      },
      'read_tire_pressure': {
        front_left: Math.round((32 + Math.random() * 8) * 10) / 10,
        front_right: Math.round((32 + Math.random() * 8) * 10) / 10,
        rear_left: Math.round((30 + Math.random() * 6) * 10) / 10,
        rear_right: Math.round((30 + Math.random() * 6) * 10) / 10
      },
      'sync_key_fobs': {
        status: 'completed',
        keys_synchronized: 2
      }
    },
    'BMW': {
      'read_valvetronic_position': {
        intake_valve_position: Math.round((30 + Math.random() * 60) * 10) / 10,
        exhaust_valve_position: Math.round((25 + Math.random() * 50) * 10) / 10
      },
      'read_dsc_status': {
        dsc_active: Math.random() > 0.1,
        traction_control: Math.random() > 0.1,
        stability_control: Math.random() > 0.1
      },
      'calibrate_adaptive_headlights': {
        status: 'completed',
        calibration_angle: Math.round((-5 + Math.random() * 10) * 10) / 10
      }
    },
    'VW': {
      'read_engine_oil_level': {
        oil_level: Math.round((60 + Math.random() * 40) * 10) / 10,
        oil_temperature: Math.round((80 + Math.random() * 30) * 10) / 10,
        oil_pressure: Math.round((30 + Math.random() * 20) * 10) / 10,
        next_change_mileage: 5000 + Math.floor(Math.random() * 3000)
      },
      'read_transmission_temp': {
        transmission_temp: Math.round((70 + Math.random() * 40) * 10) / 10,
        fluid_level: 'normal',
        filter_status: 'good'
      },
      'read_abs_status': {
        abs_pressure: Math.round((80 + Math.random() * 40) * 10) / 10,
        abs_active: Math.random() > 0.1,
        brake_pad_wear: Math.round((20 + Math.random() * 60) * 10) / 10
      },
      'reset_service_interval': {
        status: 'completed',
        next_service_mileage: 10000 + Math.floor(Math.random() * 5000)
      },
      'read_immobilizer_status': {
        immobilizer_active: Math.random() > 0.1,
        key_recognized: Math.random() > 0.05,
        security_status: Math.random() > 0.1 ? 'secured' : 'warning'
      }
    }
  };

  const manufacturer = command.manufacturer_code;
  const commandType = command.command_name.toLowerCase().replace(/\s+/g, '_');

  return responses[manufacturer]?.[commandType] || {
    error: 'Command not supported',
    manufacturer: manufacturer,
    command: commandType
  };
}

// Generate OEM vehicle metrics with proprietary data
function generateOEMVehicleMetrics(manufacturerId, baseData) {
  const proprietaryData = {
    1: { // Toyota
      engine_oil_level: Math.round((60 + Math.random() * 40) * 10) / 10,
      transmission_temp: Math.round((70 + Math.random() * 40) * 10) / 10,
      battery_voltage: Math.round((12 + Math.random() * 2) * 10) / 10,
      fuel_injector_pulse: Math.round((2 + Math.random() * 8) * 100) / 100
    },
    2: { // Ford
      transmission_slip: Math.round(Math.random() * 10 * 10) / 10,
      brake_pad_wear: Math.round((20 + Math.random() * 60) * 10) / 10,
      cabin_air_quality: Math.round(Math.random() * 1000),
      tire_pressure_front_left: Math.round((30 + Math.random() * 10) * 10) / 10,
      tire_pressure_front_right: Math.round((30 + Math.random() * 10) * 10) / 10,
      tire_pressure_rear_left: Math.round((28 + Math.random() * 8) * 10) / 10,
      tire_pressure_rear_right: Math.round((28 + Math.random() * 8) * 10) / 10
    },
    3: { // BMW
      valvetronic_position: Math.round((30 + Math.random() * 60) * 10) / 10,
      dsc_status: Math.random() > 0.1,
      adaptive_headlight_angle: Math.round((-5 + Math.random() * 10) * 10) / 10,
      comfort_access_status: Math.random() > 0.1
    },
    4: { // VW
      engine_oil_level: Math.round((60 + Math.random() * 40) * 10) / 10,
      transmission_temp: Math.round((70 + Math.random() * 40) * 10) / 10,
      battery_voltage: Math.round((12 + Math.random() * 2) * 10) / 10,
      fuel_injector_pulse: Math.round((2 + Math.random() * 8) * 100) / 100,
      abs_pressure: Math.round((80 + Math.random() * 40) * 10) / 10,
      esp_status: Math.random() > 0.1,
      airbag_status: Math.random() > 0.05,
      immobilizer_status: Math.random() > 0.1
    }
  };

  return {
    manufacturer_id: manufacturerId,
    rpm: baseData.rpm,
    speed: baseData.speed,
    coolant_temp: baseData.coolant_temp,
    intake_air_temp: baseData.intake_air_temp,
    throttle_pos: baseData.throttle_pos,
    engine_load: baseData.engine_load,
    fuel_pressure: baseData.fuel_pressure,
    intake_manifold_pressure: baseData.intake_manifold_pressure,
    proprietary_data: JSON.stringify(proprietaryData[manufacturerId] || {}),
    mode: baseData.mode,
    vehicle_type: baseData.vehicleType,
    fault_scenario: baseData.faultScenario
  };
}

// Helper function to analyze proprietary parameters for health issues
function analyzeProprietaryParameters(manufacturerCode, oemMetrics) {
  const issues = [];

  try {
    oemMetrics.forEach(metric => {
      if (metric.proprietary_data) {
        const proprietaryData = JSON.parse(metric.proprietary_data);

        switch (manufacturerCode) {
          case 'TOYOTA':
            // Check Toyota-specific parameters
            if (proprietaryData.engine_oil_level < 30) {
              issues.push('Low engine oil level');
            }
            if (proprietaryData.transmission_temp > 120) {
              issues.push('High transmission temperature');
            }
            if (proprietaryData.battery_voltage < 12.0) {
              issues.push('Low battery voltage');
            }
            break;

          case 'FORD':
            // Check Ford-specific parameters
            if (proprietaryData.transmission_slip > 5) {
              issues.push('High transmission slip detected');
            }
            if (proprietaryData.brake_pad_wear > 80) {
              issues.push('Brake pads worn (replacement needed)');
            }
            if (proprietaryData.cabin_air_quality > 2000) {
              issues.push('Poor cabin air quality');
            }
            break;

          case 'BMW':
            // Check BMW-specific parameters
            if (proprietaryData.valvetronic_position < 10 || proprietaryData.valvetronic_position > 80) {
              issues.push('Valvetronic position out of range');
            }
            if (!proprietaryData.dsc_status) {
              issues.push('DSC system inactive');
            }
            if (proprietaryData.adaptive_headlight_angle < -10 || proprietaryData.adaptive_headlight_angle > 10) {
              issues.push('Adaptive headlights misaligned');
            }
            break;

          case 'VW':
            // Check VW-specific parameters
            if (proprietaryData.engine_oil_level < 30) {
              issues.push('Low engine oil level');
            }
            if (proprietaryData.transmission_temp > 120) {
              issues.push('High transmission temperature');
            }
            if (proprietaryData.battery_voltage < 12.0) {
              issues.push('Low battery voltage');
            }
            if (proprietaryData.abs_pressure < 60 || proprietaryData.abs_pressure > 150) {
              issues.push('ABS pressure out of range');
            }
            if (!proprietaryData.esp_status) {
              issues.push('ESP system inactive');
            }
            if (!proprietaryData.airbag_status) {
              issues.push('Airbag system fault detected');
            }
            if (!proprietaryData.immobilizer_status) {
              issues.push('Immobilizer system issue');
            }
            break;
        }
      }
    });
  } catch (error) {
    console.error('Error analyzing proprietary parameters:', error);
  }

  return issues;
}

// Initialize AI Data Pipeline
const DataPipeline = require('./ai/data-pipeline/data-pipeline');
const dataPipeline = new DataPipeline();

// Initialize AI Services
const MaintenanceRecommendationEngine = require('./ai/services/maintenance-recommendation-engine');
const ComponentLifespanEstimator = require('./ai/services/component-lifespan-estimator');
const TroubleshootingAssistant = require('./ai/services/troubleshooting-assistant');
const RepairManualIntegration = require('./ai/services/repair-manual-integration');
const DiagnosticReportGenerator = require('./ai/services/diagnostic-report-generator');
const FuelEfficiencyOptimizer = require('./ai/services/fuel-efficiency-optimizer');
const MaintenancePerformanceAnalyzer = require('./ai/services/maintenance-performance-analyzer');
const AnomalyDetectionModel = require('./ai/models/anomaly-detection-model');
const FailurePredictionModel = require('./ai/models/failure-prediction-model');

// Use CPU version of TensorFlow.js to avoid native binding issues
const tf = require('@tensorflow/tfjs');

const maintenanceEngine = new MaintenanceRecommendationEngine();
const lifespanEstimator = new ComponentLifespanEstimator();
const troubleshootingAssistant = new TroubleshootingAssistant();
const repairManualIntegration = new RepairManualIntegration();
const reportGenerator = new DiagnosticReportGenerator();
const fuelOptimizer = new FuelEfficiencyOptimizer();
const maintenanceAnalyzer = new MaintenancePerformanceAnalyzer();
const anomalyDetector = new AnomalyDetectionModel();
const failurePredictor = new FailurePredictionModel();

// Initialize anomaly detection model
async function initializeAnomalyDetection() {
  try {
    console.log('Initializing anomaly detection model...');

    // Build model with 8 features (standard vehicle metrics)
    anomalyDetector.buildModel(8);

    // Try to load existing trained model
    try {
      await anomalyDetector.loadModel();
      console.log('Loaded existing anomaly detection model');
    } catch (error) {
      console.log('No existing anomaly detection model found, will train on first use');
    }

    console.log('Anomaly detection model initialized successfully');
  } catch (error) {
    console.error('Failed to initialize anomaly detection model:', error);
  }
}

// Initialize failure prediction model
async function initializeFailurePrediction() {
  try {
    console.log('Initializing failure prediction model...');

    // Build model with 6 features for sequence prediction
    failurePredictor.buildModel(6, 1);

    // Try to load existing trained model
    try {
      await failurePredictor.loadModel();
      console.log('Loaded existing failure prediction model');
    } catch (error) {
      console.log('No existing failure prediction model found, will train on first use');
    }

    console.log('Failure prediction model initialized successfully');
  } catch (error) {
    console.error('Failed to initialize failure prediction model:', error);
  }
}

// AI components are now initialized in startServer() function above

// AI API Endpoints

// Get data pipeline statistics
app.get('/api/ai/statistics', async (req, res) => {
  try {
    const stats = await dataPipeline.getDataStatistics();
    res.json(stats);
  } catch (error) {
    console.error('Error getting AI statistics:', error);
    res.status(500).json({ error: 'Failed to get AI statistics' });
  }
});

// Process data for training
app.post('/api/ai/process-training', async (req, res) => {
  try {
    const options = req.body || {};
    const processedData = await dataPipeline.processForTraining(options);
    res.json(processedData);
  } catch (error) {
    console.error('Error processing training data:', error);
    res.status(500).json({ error: 'Failed to process training data' });
  }
});

// Get real-time processed data
app.get('/api/ai/realtime-data', async (req, res) => {
  try {
    const windowSize = parseInt(req.query.windowSize) || 50;
    const processedData = await dataPipeline.processRealtimeData(windowSize);
    res.json(processedData);
  } catch (error) {
    console.error('Error getting real-time data:', error);
    res.status(500).json({ error: 'Failed to get real-time data' });
  }
});

// Anomaly detection
app.post('/api/ai/anomaly-detection', async (req, res) => {
  try {
    const { data } = req.body;
    const anomalies = await dataPipeline.processForAnomalyDetection(data);
    res.json(anomalies);
  } catch (error) {
    console.error('Error detecting anomalies:', error);
    res.status(500).json({ error: 'Failed to detect anomalies' });
  }
});

// Export processed data
app.get('/api/ai/export-data', async (req, res) => {
  try {
    const options = {
      format: req.query.format || 'json',
      includeRaw: req.query.includeRaw === 'true',
      includeFeatures: req.query.includeFeatures === 'true',
      limit: parseInt(req.query.limit) || 1000
    };

    const exportedData = await dataPipeline.exportProcessedData(options);
    res.json(exportedData);
  } catch (error) {
    console.error('Error exporting data:', error);
    res.status(500).json({ error: 'Failed to export data' });
  }
});

// Get AI pipeline status
app.get('/api/ai/status', (req, res) => {
  res.json({
    initialized: dataPipeline.isInitialized,
    maintenanceEngineInitialized: maintenanceEngine.isInitialized,
    anomalyDetectorInitialized: anomalyDetector.isTrained,
    failurePredictorInitialized: failurePredictor.isTrained,
    timestamp: new Date().toISOString()
  });
});

// Get real-time AI diagnostics
app.get('/api/ai/diagnostics/realtime', async (req, res) => {
  try {
    const realtimeData = await dataPipeline.processRealtimeData(20);
    const currentMetrics = realtimeData.rawData[realtimeData.rawData.length - 1];

    const diagnostics = {
      timestamp: new Date().toISOString(),
      vehicleData: currentMetrics,
      aiInsights: {}
    };

    // Anomaly detection
    if (anomalyDetector.isTrained) {
      try {
        const anomalyResult = await anomalyDetector.detectRealtimeAnomalies([currentMetrics]);
        diagnostics.aiInsights.anomaly = anomalyResult;
      } catch (error) {
        console.error('Error in anomaly detection:', error);
        diagnostics.aiInsights.anomaly = { error: 'Anomaly detection failed' };
      }
    }

    // Failure prediction
    if (failurePredictor.isTrained) {
      try {
        const failureResult = await failurePredictor.predictFailure(realtimeData.rawData);
        diagnostics.aiInsights.failurePrediction = failureResult;
      } catch (error) {
        console.error('Error in failure prediction:', error);
        diagnostics.aiInsights.failurePrediction = { error: 'Failure prediction failed' };
      }
    }

    // Maintenance recommendations
    try {
      const maintenanceRecs = await maintenanceEngine.generateRecommendations();
      diagnostics.aiInsights.maintenance = { recommendations: maintenanceRecs };
    } catch (error) {
      console.error('Error getting maintenance recommendations:', error);
      diagnostics.aiInsights.maintenance = { error: 'Maintenance recommendations failed' };
    }

    res.json(diagnostics);
  } catch (error) {
    console.error('Error getting real-time AI diagnostics:', error);
    res.status(500).json({ error: 'Failed to get real-time AI diagnostics' });
  }
});

// Get failure prediction for specific time window
app.get('/api/ai/failure-prediction', async (req, res) => {
  try {
    const { windowSize = 20, predictionHorizon = 5 } = req.query;

    if (!failurePredictor.isTrained) {
      return res.status(400).json({
        error: 'Failure prediction model not trained',
        message: 'Train the model first using POST /api/ai/train'
      });
    }

    // Get recent sensor data
    const recentData = await dataPipeline.collector.getRealtimeData(parseInt(windowSize));

    if (recentData.length < 10) {
      return res.status(400).json({
        error: 'Insufficient data for prediction',
        message: `Need at least 10 data points, got ${recentData.length}`
      });
    }

    // Make failure prediction
    const prediction = await failurePredictor.predictFailure(recentData);

    // Get maintenance recommendations based on prediction
    let maintenanceRecommendations = [];
    if (prediction.riskLevel === 'high') {
      try {
        const recommendations = await maintenanceEngine.generateRecommendations({
          includePredictive: true,
          includePreventive: true,
          urgencyThreshold: 0.8
        });
        maintenanceRecommendations = recommendations;
      } catch (error) {
        console.error('Error getting maintenance recommendations:', error);
      }
    }

    res.json({
      timestamp: new Date().toISOString(),
      prediction: prediction,
      maintenanceRecommendations: maintenanceRecommendations,
      dataPoints: recentData.length,
      predictionHorizon: predictionHorizon
    });
  } catch (error) {
    console.error('Error getting failure prediction:', error);
    res.status(500).json({ error: 'Failed to get failure prediction' });
  }
});

// Get failure prediction history
app.get('/api/ai/failure-prediction/history', async (req, res) => {
  try {
    const { limit = 50 } = req.query;

    // In a real implementation, this would query a database of stored predictions
    // For now, return mock historical predictions
    const history = [];
    const now = new Date();

    for (let i = 0; i < parseInt(limit); i++) {
      const timestamp = new Date(now.getTime() - (i * 60000)); // Every minute
      history.push({
        timestamp: timestamp.toISOString(),
        failureProbability: Math.random(),
        riskLevel: Math.random() > 0.7 ? 'high' : Math.random() > 0.4 ? 'medium' : 'low',
        confidence: 0.5 + Math.random() * 0.4,
        prediction: Math.random() > 0.8
      });
    }

    res.json({
      history: history.reverse(), // Most recent first
      total: history.length
    });
  } catch (error) {
    console.error('Error getting failure prediction history:', error);
    res.status(500).json({ error: 'Failed to get failure prediction history' });
  }
});

// Get AI diagnostics summary
app.get('/api/ai/diagnostics/summary', async (req, res) => {
  try {
    const summary = {
      timestamp: new Date().toISOString(),
      models: {
        anomalyDetection: {
          trained: anomalyDetector.isTrained,
          threshold: anomalyDetector.threshold,
          modelSummary: anomalyDetector.getModelSummary()
        },
        failurePrediction: {
          trained: failurePredictor.isTrained,
          modelSummary: failurePredictor.getModelSummary()
        }
      },
      dataStatistics: await dataPipeline.getDataStatistics(),
      recentAlerts: []
    };

    // Get recent DTC codes for context
    const recentDTCs = db.prepare('SELECT * FROM dtc_codes ORDER BY timestamp DESC LIMIT 5').all();
    summary.recentDTCs = recentDTCs;

    // Get recent failure predictions
    try {
      const failureHistory = await fetch('http://localhost:3001/api/ai/failure-prediction/history?limit=5');
      if (failureHistory.ok) {
        const historyData = await failureHistory.json();
        summary.recentFailurePredictions = historyData.history;
      }
    } catch (error) {
      console.error('Error fetching failure prediction history:', error);
    }

    res.json(summary);
  } catch (error) {
    console.error('Error getting AI diagnostics summary:', error);
    res.status(500).json({ error: 'Failed to get AI diagnostics summary' });
  }
});

// Maintenance recommendations
app.get('/api/ai/maintenance/recommendations', async (req, res) => {
  try {
    const options = {
      includePredictive: req.query.predictive !== 'false',
      includePreventive: req.query.preventive !== 'false',
      includeAnomalyBased: req.query.anomaly !== 'false',
      urgencyThreshold: parseFloat(req.query.threshold) || 0.7
    };

    const recommendations = await maintenanceEngine.generateRecommendations(options);
    res.json(recommendations);
  } catch (error) {
    console.error('Error getting maintenance recommendations:', error);
    res.status(500).json({ error: 'Failed to get maintenance recommendations' });
  }
});

// Get maintenance recommendation summary
app.get('/api/ai/maintenance/summary', async (req, res) => {
  try {
    const summary = await maintenanceEngine.getRecommendationSummary();
    res.json(summary);
  } catch (error) {
    console.error('Error getting maintenance summary:', error);
    res.status(500).json({ error: 'Failed to get maintenance summary' });
  }
});

// Component lifespan estimation
app.get('/api/ai/lifespan/:component', async (req, res) => {
  try {
    const { component } = req.params;
    const realtimeData = await dataPipeline.processRealtimeData(50);
    const currentMetrics = realtimeData.rawData[realtimeData.rawData.length - 1];

    // Get maintenance history for the component
    const maintenanceHistory = await maintenanceEngine.getMaintenanceHistory();

    const estimate = lifespanEstimator.estimateComponentLifespan(
      component,
      currentMetrics,
      maintenanceHistory,
      { total_distance: 50000 } // Mock vehicle info
    );

    res.json(estimate);
  } catch (error) {
    console.error('Error estimating component lifespan:', error);
    res.status(500).json({ error: 'Failed to estimate component lifespan' });
  }
});

// Get all component lifespan estimates
app.get('/api/ai/lifespan', async (req, res) => {
  try {
    const realtimeData = await dataPipeline.processRealtimeData(50);
    const currentMetrics = realtimeData.rawData[realtimeData.rawData.length - 1];
    const maintenanceHistory = await maintenanceEngine.getMaintenanceHistory();

    const estimates = lifespanEstimator.estimateAllComponents(
      currentMetrics,
      maintenanceHistory,
      { total_distance: 50000, curb_weight: 1500 } // Mock vehicle info
    );

    res.json(estimates);
  } catch (error) {
    console.error('Error getting component lifespan estimates:', error);
    res.status(500).json({ error: 'Failed to get component lifespan estimates' });
  }
});

// Get maintenance schedule based on component lifespans
app.get('/api/ai/maintenance/schedule', async (req, res) => {
  try {
    const realtimeData = await dataPipeline.processRealtimeData(50);
    const currentMetrics = realtimeData.rawData[realtimeData.rawData.length - 1];
    const maintenanceHistory = await maintenanceEngine.getMaintenanceHistory();

    const estimates = lifespanEstimator.estimateAllComponents(
      currentMetrics,
      maintenanceHistory,
      { total_distance: 50000, curb_weight: 1500 }
    );

    const schedule = lifespanEstimator.generateMaintenanceSchedule(estimates);

    res.json(schedule);
  } catch (error) {
    console.error('Error generating maintenance schedule:', error);
    res.status(500).json({ error: 'Failed to generate maintenance schedule' });
  }
});

// AI Troubleshooting Assistant endpoints

// Analyze DTC codes
app.post('/api/ai/troubleshoot/dtc', async (req, res) => {
  try {
    const { dtcCodes } = req.body;
    const realtimeData = await dataPipeline.processRealtimeData(10);
    const sensorData = realtimeData.rawData[realtimeData.rawData.length - 1];

    const analysis = troubleshootingAssistant.analyzeDTCCodes(dtcCodes, sensorData);
    res.json(analysis);
  } catch (error) {
    console.error('Error analyzing DTC codes:', error);
    res.status(500).json({ error: 'Failed to analyze DTC codes' });
  }
});

// Analyze symptoms
app.post('/api/ai/troubleshoot/symptoms', async (req, res) => {
  try {
    const { symptoms } = req.body;
    const realtimeData = await dataPipeline.processRealtimeData(10);
    const sensorData = realtimeData.rawData[realtimeData.rawData.length - 1];

    const analysis = troubleshootingAssistant.analyzeSymptoms(symptoms, sensorData);
    res.json(analysis);
  } catch (error) {
    console.error('Error analyzing symptoms:', error);
    res.status(500).json({ error: 'Failed to analyze symptoms' });
  }
});

// Comprehensive diagnostic analysis
app.post('/api/ai/troubleshoot/comprehensive', async (req, res) => {
  try {
    const { dtcCodes, symptoms } = req.body;
    const realtimeData = await dataPipeline.processRealtimeData(10);
    const sensorData = realtimeData.rawData[realtimeData.rawData.length - 1];

    const diagnosis = troubleshootingAssistant.performComprehensiveDiagnosis(
      dtcCodes || [],
      symptoms || [],
      sensorData
    );

    res.json(diagnosis);
  } catch (error) {
    console.error('Error performing comprehensive diagnosis:', error);
    res.status(500).json({ error: 'Failed to perform comprehensive diagnosis' });
  }
});

// Get repair procedure
app.get('/api/ai/troubleshoot/repair/:component', (req, res) => {
  try {
    const { component } = req.params;
    const procedure = troubleshootingAssistant.getRepairProcedure(component);
    res.json(procedure);
  } catch (error) {
    console.error('Error getting repair procedure:', error);
    res.status(500).json({ error: 'Failed to get repair procedure' });
  }
});

// Get diagnostic flowchart
app.get('/api/ai/troubleshoot/flowchart/:issueType', (req, res) => {
  try {
    const { issueType } = req.params;
    const flowchart = troubleshootingAssistant.getDiagnosticFlowchart(issueType);
    res.json(flowchart);
  } catch (error) {
    console.error('Error getting diagnostic flowchart:', error);
    res.status(500).json({ error: 'Failed to get diagnostic flowchart' });
  }
});

// Repair Manual Integration endpoints

// Search repair manuals by DTC code
app.get('/api/ai/repair/dtc/:dtcCode', (req, res) => {
  try {
    const { dtcCode } = req.params;
    const result = repairManualIntegration.searchByDTC(dtcCode);
    res.json(result);
  } catch (error) {
    console.error('Error searching repair manual by DTC:', error);
    res.status(500).json({ error: 'Failed to search repair manual' });
  }
});

// Search repair manuals by symptom
app.get('/api/ai/repair/symptom', (req, res) => {
  try {
    const { symptom } = req.query;
    if (!symptom) {
      return res.status(400).json({ error: 'Symptom parameter is required' });
    }
    const results = repairManualIntegration.searchBySymptom(symptom);
    res.json(results);
  } catch (error) {
    console.error('Error searching repair manual by symptom:', error);
    res.status(500).json({ error: 'Failed to search repair manual' });
  }
});

// Search repair manuals by component
app.get('/api/ai/repair/component/:component', (req, res) => {
  try {
    const { component } = req.params;
    const results = repairManualIntegration.searchByComponent(component);
    res.json(results);
  } catch (error) {
    console.error('Error searching repair manual by component:', error);
    res.status(500).json({ error: 'Failed to search repair manual' });
  }
});

// Get repair procedure for component
app.get('/api/ai/repair/procedure/:component', (req, res) => {
  try {
    const { component } = req.params;
    const { system } = req.query;
    const procedure = repairManualIntegration.getRepairProcedure(component, system);
    res.json(procedure);
  } catch (error) {
    console.error('Error getting repair procedure:', error);
    res.status(500).json({ error: 'Failed to get repair procedure' });
  }
});

// Get diagnostic procedures for DTC
app.get('/api/ai/repair/diagnostic/:dtcCode', (req, res) => {
  try {
    const { dtcCode } = req.params;
    const procedures = repairManualIntegration.getDiagnosticProcedures(dtcCode);
    res.json(procedures);
  } catch (error) {
    console.error('Error getting diagnostic procedures:', error);
    res.status(500).json({ error: 'Failed to get diagnostic procedures' });
  }
});

// Get safety precautions for repair
app.get('/api/ai/repair/safety/:dtcCode', (req, res) => {
  try {
    const { dtcCode } = req.params;
    const precautions = repairManualIntegration.getSafetyPrecautions(dtcCode);
    res.json(precautions);
  } catch (error) {
    console.error('Error getting safety precautions:', error);
    res.status(500).json({ error: 'Failed to get safety precautions' });
  }
});

// Advanced search in repair manuals
app.post('/api/ai/repair/search', (req, res) => {
  try {
    const query = req.body;
    const results = repairManualIntegration.advancedSearch(query);
    res.json(results);
  } catch (error) {
    console.error('Error performing advanced search:', error);
    res.status(500).json({ error: 'Failed to perform advanced search' });
  }
});

// Get all available repair manuals
app.get('/api/ai/repair/manuals', (req, res) => {
  try {
    const manuals = repairManualIntegration.getAllManuals();
    res.json(manuals);
  } catch (error) {
    console.error('Error getting repair manuals:', error);
    res.status(500).json({ error: 'Failed to get repair manuals' });
  }
});

// Diagnostic Report Generator endpoints

// Generate comprehensive diagnostic report
app.post('/api/ai/reports/generate', async (req, res) => {
  try {
    const {
      reportType = 'comprehensive',
      includeDTC = true,
      includeSymptoms = true,
      includeAIAnalysis = true,
      includeMaintenance = true
    } = req.body;

    // Gather all diagnostic data
    const diagnosticData = {};

    // Get current vehicle data
    const realtimeData = await dataPipeline.processRealtimeData(50);
    diagnosticData.vehicleData = realtimeData.rawData[realtimeData.rawData.length - 1];
    diagnosticData.sensorData = realtimeData.rawData[realtimeData.rawData.length - 1];

    // Get DTC codes if requested
    if (includeDTC) {
      const dtcResponse = await fetch('http://localhost:3001/api/dtc');
      if (dtcResponse.ok) {
        diagnosticData.dtcCodes = await dtcResponse.json();
      }
    }

    // Get maintenance history if requested
    if (includeMaintenance) {
      const maintenanceResponse = await fetch('http://localhost:3001/api/maintenance');
      if (maintenanceResponse.ok) {
        diagnosticData.maintenanceHistory = await maintenanceResponse.json();
      }
    }

    // Include symptoms if provided
    if (includeSymptoms && req.body.symptoms) {
      diagnosticData.symptoms = req.body.symptoms;
    }

    // AI Analysis
    if (includeAIAnalysis) {
      diagnosticData.aiAnalysis = {};

      // Get maintenance recommendations
      try {
        const maintenanceRecs = await maintenanceEngine.generateRecommendations();
        diagnosticData.aiAnalysis.maintenance = { recommendations: maintenanceRecs };
      } catch (error) {
        console.error('Error getting maintenance recommendations:', error);
      }

      // Get anomaly detection results
      try {
        const anomalyResult = await troubleshootingAssistant.analyzeSymptoms(
          diagnosticData.symptoms || [],
          diagnosticData.sensorData
        );
        diagnosticData.aiAnalysis.anomaly = anomalyResult;
      } catch (error) {
        console.error('Error getting anomaly analysis:', error);
      }
    }

    // Generate report
    const report = await reportGenerator.generateReport(diagnosticData, reportType);

    res.json(report);
  } catch (error) {
    console.error('Error generating diagnostic report:', error);
    res.status(500).json({ error: 'Failed to generate diagnostic report' });
  }
});

// Export diagnostic report
app.post('/api/ai/reports/export', async (req, res) => {
  try {
    const { reportData, format = 'json' } = req.body;

    if (!reportData) {
      return res.status(400).json({ error: 'Report data is required' });
    }

    const exportedReport = reportGenerator.exportReport(reportData, format);

    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="diagnostic-report-${Date.now()}.json"`);
    } else if (format === 'html') {
      res.setHeader('Content-Type', 'text/html');
      res.setHeader('Content-Disposition', `attachment; filename="diagnostic-report-${Date.now()}.html"`);
    }

    res.send(exportedReport);
  } catch (error) {
    console.error('Error exporting diagnostic report:', error);
    res.status(500).json({ error: 'Failed to export diagnostic report' });
  }
});

// Get report templates
app.get('/api/ai/reports/templates', (req, res) => {
  try {
    const templates = Object.keys(reportGenerator.templates).map(templateName => ({
      name: templateName,
      title: reportGenerator.templates[templateName].title,
      sections: reportGenerator.templates[templateName].sections
    }));

    res.json(templates);
  } catch (error) {
    console.error('Error getting report templates:', error);
    res.status(500).json({ error: 'Failed to get report templates' });
  }
});

// Get report history (placeholder for future implementation)
app.get('/api/ai/reports/history', (req, res) => {
  try {
    // In a real implementation, this would query a database of saved reports
    const history = [
      {
        id: 'RPT-1234567890-ABC123',
        title: 'Comprehensive Vehicle Diagnostic Report',
        generated_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        type: 'comprehensive',
        status: 'completed'
      }
    ];

    res.json(history);
  } catch (error) {
    console.error('Error getting report history:', error);
    res.status(500).json({ error: 'Failed to get report history' });
  }
});

// Fuel Efficiency Optimization endpoints

// Analyze fuel efficiency
app.get('/api/ai/fuel-efficiency/analysis', async (req, res) => {
  try {
    // Get fuel economy data
    const fuelResponse = await fetch('http://localhost:3001/api/fuel-economy');
    const fuelData = fuelResponse.ok ? await fuelResponse.json() : [];

    // Get real-time sensor data
    const realtimeData = await dataPipeline.processRealtimeData(50);
    const sensorData = realtimeData.rawData;

    const analysis = fuelOptimizer.analyzeFuelEfficiency(fuelData, sensorData);
    res.json(analysis);
  } catch (error) {
    console.error('Error analyzing fuel efficiency:', error);
    res.status(500).json({ error: 'Failed to analyze fuel efficiency' });
  }
});

// Get fuel efficiency recommendations
app.get('/api/ai/fuel-efficiency/recommendations', async (req, res) => {
  try {
    // Get fuel economy data
    const fuelResponse = await fetch('http://localhost:3001/api/fuel-economy');
    const fuelData = fuelResponse.ok ? await fuelResponse.json() : [];

    // Get real-time sensor data
    const realtimeData = await dataPipeline.processRealtimeData(50);
    const sensorData = realtimeData.rawData;

    const analysis = fuelOptimizer.analyzeFuelEfficiency(fuelData, sensorData);
    const recommendations = analysis.recommendations || [];

    res.json(recommendations);
  } catch (error) {
    console.error('Error getting fuel efficiency recommendations:', error);
    res.status(500).json({ error: 'Failed to get fuel efficiency recommendations' });
  }
});

// Get eco-driving score
app.get('/api/ai/fuel-efficiency/eco-score', async (req, res) => {
  try {
    // Get real-time sensor data
    const realtimeData = await dataPipeline.processRealtimeData(60); // Last minute of data
    const sensorData = realtimeData.rawData;

    const ecoScore = fuelOptimizer.generateEcoDrivingScore(sensorData);
    res.json(ecoScore);
  } catch (error) {
    console.error('Error generating eco-driving score:', error);
    res.status(500).json({ error: 'Failed to generate eco-driving score' });
  }
});

// Get fuel efficiency optimization strategies
app.get('/api/ai/fuel-efficiency/strategies', (req, res) => {
  try {
    const strategies = {
      immediate: fuelOptimizer.optimizationStrategies.immediate,
      short_term: fuelOptimizer.optimizationStrategies.short_term,
      long_term: fuelOptimizer.optimizationStrategies.long_term
    };

    res.json(strategies);
  } catch (error) {
    console.error('Error getting fuel efficiency strategies:', error);
    res.status(500).json({ error: 'Failed to get fuel efficiency strategies' });
  }
});

// Get fuel efficiency factors
app.get('/api/ai/fuel-efficiency/factors', (req, res) => {
  try {
    const factors = fuelOptimizer.efficiencyFactors;
    res.json(factors);
  } catch (error) {
    console.error('Error getting fuel efficiency factors:', error);
    res.status(500).json({ error: 'Failed to get fuel efficiency factors' });
  }
});

// Analyze driving pattern
app.get('/api/ai/fuel-efficiency/driving-pattern', async (req, res) => {
  try {
    // Get real-time sensor data
    const realtimeData = await dataPipeline.processRealtimeData(100); // Last 3+ minutes
    const sensorData = realtimeData.rawData;

    const pattern = fuelOptimizer.identifyDrivingPattern(sensorData);
    const patternDetails = fuelOptimizer.drivingPatterns[pattern];

    res.json({
      pattern: pattern,
      characteristics: patternDetails?.characteristics || {},
      efficiency_multiplier: patternDetails?.efficiency_multiplier || 1.0,
      description: fuelOptimizer.getPatternDescription(pattern)
    });
  } catch (error) {
    console.error('Error analyzing driving pattern:', error);
    res.status(500).json({ error: 'Failed to analyze driving pattern' });
  }
});

// Train AI models
app.post('/api/ai/train', async (req, res) => {
  try {
    const { modelType, options } = req.body;

    if (modelType === 'failure-prediction') {
      // Get training data
      const trainingData = await dataPipeline.processForTraining({ limit: 1000 });

      if (trainingData.features.rows === 0) {
        return res.status(400).json({ error: 'No training data available' });
      }

      // Prepare sequences for LSTM
      const sequences = [];
      const labels = [];

      for (let i = 10; i < trainingData.features.rows; i++) {
        const sequence = [];
        for (let j = i - 10; j < i; j++) {
          sequence.push(trainingData.features.getRow(j));
        }
        sequences.push(sequence);
        labels.push(Math.random() > 0.8 ? 1 : 0); // Mock labels - in real scenario, use actual failure data
      }

      // Build and train model
      const FailureModel = require('./ai/models/failure-prediction-model');
      const model = new FailureModel();
      model.buildModel(6, 1); // 6 features, binary classification

      const history = await model.train(sequences, labels, options);

      // Save model
      await model.saveModel();

      res.json({
        success: true,
        modelType: 'failure-prediction',
        trainingHistory: history.history,
        finalMetrics: {
          loss: history.history.loss[history.history.loss.length - 1],
          accuracy: history.history.acc[history.history.acc.length - 1]
        }
      });

    } else if (modelType === 'anomaly-detection') {
      // Get normal data for training
      const trainingData = await dataPipeline.processForTraining({ limit: 1000 });

      if (trainingData.features.rows === 0) {
        return res.status(400).json({ error: 'No training data available' });
      }

      // Extract feature arrays
      const featureArrays = [];
      for (let i = 0; i < trainingData.features.rows; i++) {
        featureArrays.push(trainingData.features.getRow(i));
      }

      // Build and train autoencoder
      const AnomalyModel = require('./ai/models/anomaly-detection-model');
      const model = new AnomalyModel();
      model.buildModel(6, 3); // 6 features, 3 encoding dimensions

      const history = await model.train(featureArrays, options);

      // Save model
      await model.saveModel();

      res.json({
        success: true,
        modelType: 'anomaly-detection',
        trainingHistory: history.history,
        finalMetrics: {
          loss: history.history.loss[history.history.loss.length - 1]
        }
      });

    } else {
      res.status(400).json({ error: 'Invalid model type' });
    }

  } catch (error) {
    console.error('Error training AI model:', error);
    res.status(500).json({ error: 'Failed to train AI model' });
  }
});

// Maintenance Performance Analysis endpoints

// Analyze maintenance impact on performance
app.get('/api/ai/maintenance/performance-analysis', async (req, res) => {
  try {
    const { maintenanceType, startDate, endDate } = req.query;

    // Get maintenance history
    const maintenanceResponse = await fetch('http://localhost:3001/api/maintenance');
    const maintenanceHistory = maintenanceResponse.ok ? await maintenanceResponse.json() : [];

    // Get performance data (vehicle metrics and fuel economy)
    const vehicleMetricsResponse = await fetch('http://localhost:3001/api/vehicle-metrics?limit=1000');
    const fuelEconomyResponse = await fetch('http://localhost:3001/api/fuel-economy');

    let performanceData = [];
    if (vehicleMetricsResponse.ok) {
      const vehicleData = await vehicleMetricsResponse.json();
      performanceData = performanceData.concat(vehicleData);
    }
    if (fuelEconomyResponse.ok) {
      const fuelData = await fuelEconomyResponse.json();
      performanceData = performanceData.concat(fuelData);
    }

    const analysis = maintenanceAnalyzer.analyzeMaintenanceImpact(
      maintenanceHistory,
      performanceData,
      maintenanceType
    );

    res.json(analysis);
  } catch (error) {
    console.error('Error analyzing maintenance performance impact:', error);
    res.status(500).json({ error: 'Failed to analyze maintenance performance impact' });
  }
});

// Predict maintenance impact
app.get('/api/ai/maintenance/predict-impact', async (req, res) => {
  try {
    const { maintenanceType } = req.query;

    if (!maintenanceType) {
      return res.status(400).json({ error: 'Maintenance type is required' });
    }

    // Get current efficiency metrics
    const fuelAnalysis = await fuelOptimizer.analyzeFuelEfficiency([], []);
    const currentEfficiency = {
      fuel_efficiency: fuelAnalysis.current_efficiency?.instant_mpg || 25,
      engine_performance: 1.0, // Placeholder
      acceleration: 1.0, // Placeholder
      braking: 1.0, // Placeholder
      overall_health: 1.0 // Placeholder
    };

    const prediction = maintenanceAnalyzer.predictMaintenanceImpact(
      maintenanceType,
      currentEfficiency
    );

    res.json(prediction);
  } catch (error) {
    console.error('Error predicting maintenance impact:', error);
    res.status(500).json({ error: 'Failed to predict maintenance impact' });
  }
});

// Get maintenance effectiveness summary
app.get('/api/ai/maintenance/effectiveness-summary', async (req, res) => {
  try {
    // Get maintenance history
    const maintenanceResponse = await fetch('http://localhost:3001/api/maintenance');
    const maintenanceHistory = maintenanceResponse.ok ? await maintenanceResponse.json() : [];

    // Get performance data
    const vehicleMetricsResponse = await fetch('http://localhost:3001/api/vehicle-metrics?limit=1000');
    const fuelEconomyResponse = await fetch('http://localhost:3001/api/fuel-economy');

    let performanceData = [];
    if (vehicleMetricsResponse.ok) {
      const vehicleData = await vehicleMetricsResponse.json();
      performanceData = performanceData.concat(vehicleData);
    }
    if (fuelEconomyResponse.ok) {
      const fuelData = await fuelEconomyResponse.json();
      performanceData = performanceData.concat(fuelData);
    }

    const analysis = maintenanceAnalyzer.analyzeMaintenanceImpact(
      maintenanceHistory,
      performanceData
    );

    const summary = {
      overall_effectiveness: analysis.analysis?.maintenance_effectiveness?.overall_score || 0,
      total_maintenance_events: analysis.maintenance_events_analyzed || 0,
      cost_benefit_ratio: analysis.analysis?.cost_benefit_analysis?.average_roi || 0,
      best_performing_service: analysis.analysis?.cost_benefit_analysis?.best_performing_maintenance || null,
      recommendations: analysis.analysis?.recommendations || []
    };

    res.json(summary);
  } catch (error) {
    console.error('Error getting maintenance effectiveness summary:', error);
    res.status(500).json({ error: 'Failed to get maintenance effectiveness summary' });
  }
});

// Get maintenance impact factors
app.get('/api/ai/maintenance/impact-factors', (req, res) => {
  try {
    const impactFactors = maintenanceAnalyzer.maintenanceImpactFactors;
    res.json(impactFactors);
  } catch (error) {
    console.error('Error getting maintenance impact factors:', error);
    res.status(500).json({ error: 'Failed to get maintenance impact factors' });
  }
});

// Initialize AI components before starting server
async function startServer() {
  try {
    console.log('Initializing AI components...');

    // Wait for AI components to initialize
    await Promise.all([
      dataPipeline.initialize(),
      maintenanceEngine.initialize(),
      initializeAnomalyDetection(),
      initializeFailurePrediction()
    ]);

    console.log('AI Data Pipeline, Maintenance Engine, Lifespan Estimator, Troubleshooting Assistant, Repair Manual Integration, Diagnostic Report Generator, Fuel Efficiency Optimizer, Maintenance Performance Analyzer, Anomaly Detection, and Failure Prediction models initialized successfully');

    const PORT = process.env.PORT || 3001;
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });

  } catch (error) {
    console.error('Failed to initialize AI components:', error);
    process.exit(1);
  }
}

startServer();