/**
 * OBD-II Adapter Integration Plugin
 * Provides real hardware connectivity for vehicle diagnostics
 */

const { HybridPlugin } = require('../../shared/plugin-interface');

class OBD2AdapterPlugin extends HybridPlugin {
  constructor() {
    super();
    this.name = 'OBD-II Adapter';
    this.version = '1.0.0';
    this.description = 'Real OBD-II adapter integration for live vehicle diagnostics';
    this.author = 'Dashboard Team';

    // Connection state
    this.connected = false;
    this.adapterType = null;
    this.adapterInfo = null;
    this.connectionPort = null;

    // OBD-II state
    this.protocol = null;
    this.ecuCount = 0;
    this.supportedPIDs = new Set();

    // Data streams
    this.dataStreams = new Map();
    this.commandQueue = [];
    this.isProcessing = false;

    // Bluetooth connection state
    this.pendingCommand = null;

    // Connection settings
    this.connectionSettings = {
      baudRate: 38400,
      dataBits: 8,
      parity: 'none',
      stopBits: 1,
      autoReconnect: true,
      reconnectDelay: 5000,
      timeout: 2000
    };

    // OBD-II PIDs (Parameter IDs)
    this.pidDefinitions = {
      // Engine parameters
      '010C': { name: 'Engine RPM', unit: 'rpm', formula: (data) => ((data[0] * 256) + data[1]) / 4 },
      '010D': { name: 'Vehicle Speed', unit: 'km/h', formula: (data) => data[0] },
      '010F': { name: 'Intake Air Temperature', unit: '°C', formula: (data) => data[0] - 40 },
      '0110': { name: 'Mass Air Flow', unit: 'g/s', formula: (data) => ((data[0] * 256) + data[1]) / 100 },
      '0111': { name: 'Throttle Position', unit: '%', formula: (data) => (data[0] * 100) / 255 },

      // Temperature parameters
      '0105': { name: 'Coolant Temperature', unit: '°C', formula: (data) => data[0] - 40 },
      '013C': { name: 'Catalyst Temperature', unit: '°C', formula: (data) => ((data[0] * 256) + data[1]) / 10 - 40 },

      // Fuel parameters
      '012F': { name: 'Fuel Level', unit: '%', formula: (data) => (data[0] * 100) / 255 },
      '0151': { name: 'Fuel Type', unit: 'code', formula: (data) => data[0] },
      '0121': { name: 'Distance Traveled with MIL On', unit: 'km', formula: (data) => (data[0] * 256) + data[1] },

      // Pressure parameters
      '010A': { name: 'Fuel Pressure', unit: 'kPa', formula: (data) => data[0] * 3 },
      '010B': { name: 'Intake Manifold Pressure', unit: 'kPa', formula: (data) => data[0] },

      // Voltage parameters
      '0142': { name: 'Control Module Voltage', unit: 'V', formula: (data) => ((data[0] * 256) + data[1]) / 1000 },
      '0143': { name: 'Absolute Load Value', unit: '%', formula: (data) => (data[0] * 100) / 255 },

      // Status parameters
      '0101': { name: 'DTC Status', unit: 'bitmask', formula: (data) => data[0] },
      '0103': { name: 'Fuel System Status', unit: 'code', formula: (data) => data[0] },
      '011C': { name: 'OBD Standards', unit: 'code', formula: (data) => data[0] }
    };
  }

  /**
   * Initialize server-side functionality
   */
  async initServer(context) {
    const { app, io, db } = context;

    console.log('Initializing OBD-II Adapter Plugin (Server)');

    // Setup API routes
    this.setupOBD2Routes(app, db);

    // Setup socket handlers
    this.setupOBD2SocketHandlers(io);

    // Setup database tables
    this.setupOBD2Database(db);

    // Initialize adapter detection
    this.initializeAdapterDetection();
  }

  /**
   * Initialize client-side functionality
   */
  async initClient(context) {
    console.log('Initializing OBD-II Adapter Plugin (Client)');

    // Register React components
    if (context.registerComponents) {
      context.registerComponents(this.getComponents(context.React));
    }

    // Register routes
    if (context.registerRoutes) {
      context.registerRoutes(this.getRoutes(context.React));
    }
  }

  /**
   * Setup OBD-II API routes
   */
  setupOBD2Routes(app, db) {
    // Adapter management
    app.get('/api/obd2/adapters', (req, res) => {
      try {
        const adapters = this.getAvailableAdapters();
        res.json(adapters);
      } catch (error) {
        console.error('Error getting adapters:', error);
        res.status(500).json({ error: 'Failed to get adapters' });
      }
    });

    app.post('/api/obd2/connect', async (req, res) => {
      try {
        const { adapterId, adapterType, connectionParams } = req.body;
        const result = await this.connectToAdapter(adapterId, adapterType, connectionParams);
        res.json(result);
      } catch (error) {
        console.error('Error connecting to adapter:', error);
        res.status(500).json({ error: 'Failed to connect to adapter' });
      }
    });

    app.post('/api/obd2/disconnect', async (req, res) => {
      try {
        const result = await this.disconnectAdapter();
        res.json(result);
      } catch (error) {
        console.error('Error disconnecting adapter:', error);
        res.status(500).json({ error: 'Failed to disconnect adapter' });
      }
    });

    // OBD-II commands
    app.post('/api/obd2/command', async (req, res) => {
      try {
        const { command, timeout } = req.body;
        const result = await this.sendOBD2Command(command, timeout);
        res.json(result);
      } catch (error) {
        console.error('Error sending OBD-II command:', error);
        res.status(500).json({ error: 'Failed to send OBD-II command' });
      }
    });

    app.get('/api/obd2/pids', (req, res) => {
      try {
        const pids = this.getSupportedPIDs();
        res.json(pids);
      } catch (error) {
        console.error('Error getting PIDs:', error);
        res.status(500).json({ error: 'Failed to get PIDs' });
      }
    });

    // Real-time data
    app.post('/api/obd2/monitor/start', async (req, res) => {
      try {
        const { pids, interval } = req.body;
        const result = await this.startDataMonitoring(pids, interval);
        res.json(result);
      } catch (error) {
        console.error('Error starting data monitoring:', error);
        res.status(500).json({ error: 'Failed to start data monitoring' });
      }
    });

    app.post('/api/obd2/monitor/stop', async (req, res) => {
      try {
        const result = await this.stopDataMonitoring();
        res.json(result);
      } catch (error) {
        console.error('Error stopping data monitoring:', error);
        res.status(500).json({ error: 'Failed to stop data monitoring' });
      }
    });

    // DTC operations
    app.get('/api/obd2/dtcs', async (req, res) => {
      try {
        const dtcs = await this.readDTCs();
        res.json(dtcs);
      } catch (error) {
        console.error('Error reading DTCs:', error);
        res.status(500).json({ error: 'Failed to read DTCs' });
      }
    });

    app.post('/api/obd2/clear-dtcs', async (req, res) => {
      try {
        const result = await this.clearDTCs();
        res.json(result);
      } catch (error) {
        console.error('Error clearing DTCs:', error);
        res.status(500).json({ error: 'Failed to clear DTCs' });
      }
    });
  }

  /**
   * Setup OBD-II socket handlers
   */
  setupOBD2SocketHandlers(io) {
    io.on('connection', (socket) => {
      console.log('OBD-II client connected');

      // Adapter status updates
      socket.on('obd2-status-request', () => {
        socket.emit('obd2-status-update', {
          connected: this.connected,
          adapterType: this.adapterType,
          adapterInfo: this.adapterInfo,
          protocol: this.protocol,
          ecuCount: this.ecuCount
        });
      });

      // Real-time data streaming
      socket.on('obd2-data-subscribe', (pids) => {
        this.subscribeToDataStream(socket, pids);
      });

      socket.on('obd2-data-unsubscribe', () => {
        this.unsubscribeFromDataStream(socket);
      });

      socket.on('disconnect', () => {
        console.log('OBD-II client disconnected');
        this.unsubscribeFromDataStream(socket);
      });
    });
  }

  /**
   * Setup OBD-II database tables
   */
  setupOBD2Database(db) {
    try {
      db.exec(`
        CREATE TABLE IF NOT EXISTS obd2_sessions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
          adapter_type TEXT,
          adapter_info TEXT,
          protocol TEXT,
          duration INTEGER,
          data_points INTEGER
        );

        CREATE TABLE IF NOT EXISTS obd2_data (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          session_id INTEGER,
          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
          pid TEXT,
          raw_value TEXT,
          parsed_value REAL,
          unit TEXT,
          FOREIGN KEY (session_id) REFERENCES obd2_sessions(id)
        );

        CREATE TABLE IF NOT EXISTS obd2_commands (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
          command TEXT,
          response TEXT,
          execution_time REAL,
          success BOOLEAN,
          error_message TEXT
        );

        CREATE TABLE IF NOT EXISTS obd2_dtcs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
          code TEXT,
          status TEXT,
          description TEXT,
          severity TEXT
        );
      `);
      console.log('OBD-II database tables created');
    } catch (error) {
      console.error('Error setting up OBD-II database:', error);
    }
  }

  /**
   * Initialize adapter detection
   */
  initializeAdapterDetection() {
    // This would scan for available adapters
    // For now, we'll simulate adapter detection
    setInterval(() => {
      this.scanForAdapters();
    }, 5000);
  }

  /**
   * Get available adapters
   */
  getAvailableAdapters() {
    // Simulate available adapters
    return [
      {
        id: 'bluetooth_elm327',
        type: 'bluetooth',
        name: 'ELM327 Bluetooth',
        address: '00:11:22:33:44:55',
        supported: true
      },
      {
        id: 'wifi_obdlink',
        type: 'wifi',
        name: 'OBDLink WiFi',
        address: '192.168.0.10:35000',
        supported: true
      },
      {
        id: 'usb_scanmaster',
        type: 'usb',
        name: 'ScanMaster USB',
        port: 'COM3',
        supported: true
      }
    ];
  }

  /**
   * Connect to OBD-II adapter
   */
  async connectToAdapter(adapterId, adapterType, connectionParams) {
    try {
      console.log(`Connecting to ${adapterType} adapter: ${adapterId}`);

      // Simulate connection process
      await this.delay(2000);

      // Initialize connection based on adapter type
      switch (adapterType) {
        case 'bluetooth':
          await this.connectBluetoothAdapter(connectionParams);
          break;
        case 'wifi':
          await this.connectWifiAdapter(connectionParams);
          break;
        case 'usb':
          await this.connectUSBAdapter(connectionParams);
          break;
        default:
          throw new Error(`Unsupported adapter type: ${adapterType}`);
      }

      // Initialize OBD-II protocol
      await this.initializeOBD2Protocol();

      // Detect ECUs and supported PIDs
      await this.detectECUsAndPIDs();

      this.connected = true;
      this.adapterType = adapterType;
      this.adapterInfo = { id: adapterId, ...connectionParams };

      console.log(`Successfully connected to ${adapterType} adapter`);
      return {
        success: true,
        adapterType,
        adapterInfo: this.adapterInfo,
        protocol: this.protocol,
        ecuCount: this.ecuCount,
        supportedPIDs: Array.from(this.supportedPIDs)
      };

    } catch (error) {
      console.error('Adapter connection failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Connect to Bluetooth adapter
   */
  async connectBluetoothAdapter(params) {
    console.log('Connecting via Bluetooth to:', params.address);

    try {
      // Use bluetooth-serial-port for real Bluetooth communication
      const BluetoothSerialPort = require('bluetooth-serial-port');

      return new Promise((resolve, reject) => {
        const btSerial = new BluetoothSerialPort.BluetoothSerialPort();

        btSerial.on('found', (address, name) => {
          console.log('Found device:', address, name);
          if (address === params.address) {
            btSerial.findSerialPortChannel(address, (channel) => {
              console.log('Found channel:', channel);
              btSerial.connect(address, channel, () => {
                console.log('Bluetooth connected successfully');
                this.connectionPort = {
                  type: 'bluetooth',
                  address: params.address,
                  channel: channel,
                  serialPort: btSerial
                };

                // Set up data listener
                btSerial.on('data', (buffer) => {
                  const data = buffer.toString('ascii');
                  console.log('Received Bluetooth data:', data);
                  this.handleIncomingData(data);
                });

                resolve();
              }, (error) => {
                console.error('Bluetooth connection failed:', error);
                reject(error);
              });
            }, (error) => {
              console.error('Channel discovery failed:', error);
              reject(error);
            });
          }
        });

        btSerial.on('finished', () => {
          console.log('Bluetooth scan finished');
          if (!this.connectionPort) {
            reject(new Error('Device not found'));
          }
        });

        // Start scanning
        btSerial.inquire();
      });
    } catch (error) {
      console.error('Bluetooth adapter connection failed:', error);
      throw error;
    }
  }

  /**
   * Connect to WiFi adapter
   */
  async connectWifiAdapter(params) {
    // Simulate WiFi connection
    console.log('Connecting via WiFi...');
    await this.delay(1000);

    // In real implementation, this would use net.Socket
    this.connectionPort = {
      type: 'wifi',
      host: params.host,
      port: params.port
    };
  }

  /**
   * Connect to USB adapter
   */
  async connectUSBAdapter(params) {
    // Simulate USB connection
    console.log('Connecting via USB...');
    await this.delay(800);

    // In real implementation, this would use serialport
    this.connectionPort = {
      type: 'usb',
      port: params.port,
      baudRate: this.connectionSettings.baudRate
    };
  }

  /**
   * Initialize OBD-II protocol
   */
  async initializeOBD2Protocol() {
    console.log('Initializing OBD-II protocol...');

    // Send AT commands to initialize adapter
    await this.sendRawCommand('ATZ'); // Reset
    await this.delay(100);
    await this.sendRawCommand('ATE0'); // Echo off
    await this.delay(100);
    await this.sendRawCommand('ATL0'); // Linefeeds off
    await this.delay(100);
    await this.sendRawCommand('ATS0'); // Spaces off
    await this.delay(100);
    await this.sendRawCommand('ATH0'); // Headers off
    await this.delay(100);

    // Auto-detect protocol
    const protocolResponse = await this.sendRawCommand('ATDPN');
    this.protocol = this.parseProtocolResponse(protocolResponse);

    console.log(`OBD-II protocol initialized: ${this.protocol}`);
  }

  /**
   * Detect ECUs and supported PIDs
   */
  async detectECUsAndPIDs() {
    console.log('Detecting ECUs and supported PIDs...');

    // Test communication with different ECUs
    for (let ecu = 0; ecu < 8; ecu++) {
      try {
        const response = await this.sendRawCommand(`0100${ecu}`);
        if (response && !response.includes('NO DATA') && !response.includes('ERROR')) {
          this.ecuCount++;
        }
      } catch (error) {
        // ECU not responding, continue
      }
    }

    // Test supported PIDs
    const pidSupport = await this.sendOBD2Command('0100'); // Service 01, PID 00
    if (pidSupport && pidSupport.data) {
      this.parsePIDSupport(pidSupport.data);
    }

    console.log(`Detected ${this.ecuCount} ECUs, ${this.supportedPIDs.size} supported PIDs`);
  }

  /**
   * Send OBD-II command
   */
  async sendOBD2Command(command, timeout = 2000) {
    try {
      const rawCommand = `${command}\r`;
      const response = await this.sendRawCommand(rawCommand, timeout);

      if (!response || response.includes('NO DATA') || response.includes('ERROR')) {
        return {
          success: false,
          error: 'No data received',
          rawResponse: response
        };
      }

      // Parse the response
      const parsedData = this.parseOBD2Response(response);

      return {
        success: true,
        command,
        data: parsedData,
        rawResponse: response,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        command
      };
    }
  }

  /**
   * Send raw command to adapter
   */
  async sendRawCommand(command, timeout = 2000) {
    if (!this.connectionPort || !this.connectionPort.serialPort) {
      throw new Error('No active Bluetooth connection');
    }

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Command timeout: ${command}`));
      }, timeout);

      try {
        // Store the resolve function to be called when response is received
        this.pendingCommand = { resolve, reject, timeoutId };

        // Send command
        const commandWithCR = command + '\r';
        this.connectionPort.serialPort.write(Buffer.from(commandWithCR, 'ascii'), (error) => {
          if (error) {
            clearTimeout(timeoutId);
            reject(error);
          }
        });

      } catch (error) {
        clearTimeout(timeoutId);
        reject(error);
      }
    });
  }

  /**
   * Handle incoming data from Bluetooth connection
   */
  handleIncomingData(data) {
    // Clean the response
    const cleanData = data.replace(/[\r\n]/g, '').trim();

    if (this.pendingCommand) {
      const { resolve, timeoutId } = this.pendingCommand;
      clearTimeout(timeoutId);
      this.pendingCommand = null;
      resolve(cleanData);
    }
  }

  /**
   * Parse OBD-II response
   */
  parseOBD2Response(response) {
    // Remove carriage returns and line feeds
    const cleanResponse = response.replace(/[\r\n]/g, '');

    // Extract data bytes (skip command echo and spaces)
    const dataMatch = cleanResponse.match(/41\s+([0-9A-F\s]+)/i);
    if (!dataMatch) return null;

    const dataString = dataMatch[1].replace(/\s+/g, '');
    const dataBytes = [];

    for (let i = 0; i < dataString.length; i += 2) {
      dataBytes.push(parseInt(dataString.substr(i, 2), 16));
    }

    return dataBytes;
  }

  /**
   * Get supported PIDs
   */
  getSupportedPIDs() {
    const pids = [];
    for (const [pid, definition] of Object.entries(this.pidDefinitions)) {
      if (this.supportedPIDs.has(pid)) {
        pids.push({
          pid,
          name: definition.name,
          unit: definition.unit,
          supported: true
        });
      }
    }
    return pids;
  }

  /**
   * Start data monitoring
   */
  async startDataMonitoring(pids, interval = 1000) {
    if (this.dataStreams.has('main')) {
      return { success: false, error: 'Monitoring already active' };
    }

    const stream = {
      pids,
      interval,
      active: true,
      clients: new Set()
    };

    this.dataStreams.set('main', stream);

    // Start monitoring loop
    this.startMonitoringLoop(stream);

    return {
      success: true,
      streamId: 'main',
      pids,
      interval
    };
  }

  /**
   * Stop data monitoring
   */
  async stopDataMonitoring() {
    const stream = this.dataStreams.get('main');
    if (stream) {
      stream.active = false;
      this.dataStreams.delete('main');
    }

    return { success: true };
  }

  /**
   * Start monitoring loop
   */
  async startMonitoringLoop(stream) {
    const monitor = async () => {
      if (!stream.active) return;

      try {
        const dataPoints = [];

        for (const pid of stream.pids) {
          const result = await this.sendOBD2Command(pid);
          if (result.success && result.data) {
            const definition = this.pidDefinitions[pid];
            if (definition) {
              const parsedValue = definition.formula(result.data);
              dataPoints.push({
                pid,
                name: definition.name,
                value: parsedValue,
                unit: definition.unit,
                timestamp: new Date().toISOString()
              });
            }
          }
        }

        // Send data to subscribed clients
        if (dataPoints.length > 0) {
          this.broadcastDataToClients('main', dataPoints);
        }

      } catch (error) {
        console.error('Monitoring error:', error);
      }

      // Schedule next monitoring cycle
      if (stream.active) {
        setTimeout(monitor, stream.interval);
      }
    };

    // Start the loop
    setTimeout(monitor, stream.interval);
  }

  /**
   * Subscribe client to data stream
   */
  subscribeToDataStream(socket, pids) {
    const stream = this.dataStreams.get('main');
    if (stream) {
      stream.clients.add(socket.id);
      socket.emit('obd2-monitoring-started', {
        streamId: 'main',
        pids: stream.pids
      });
    }
  }

  /**
   * Unsubscribe client from data stream
   */
  unsubscribeFromDataStream(socket) {
    for (const [streamId, stream] of this.dataStreams) {
      stream.clients.delete(socket.id);
    }
  }

  /**
   * Broadcast data to clients
   */
  broadcastDataToClients(streamId, dataPoints) {
    const stream = this.dataStreams.get(streamId);
    if (!stream) return;

    // In a real implementation, this would use io.to() for room-based broadcasting
    // For now, we'll emit to all connected clients
    // This should be improved to only send to subscribed clients
  }

  /**
   * Read DTCs
   */
  async readDTCs() {
    try {
      const response = await this.sendOBD2Command('03'); // Service 03 - Show stored DTCs

      if (!response.success) {
        return { success: false, error: response.error };
      }

      const dtcs = this.parseDTCs(response.data);
      return {
        success: true,
        dtcs,
        count: dtcs.length
      };

    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Clear DTCs
   */
  async clearDTCs() {
    try {
      const response = await this.sendOBD2Command('04'); // Service 04 - Clear DTCs

      return {
        success: response.success,
        message: response.success ? 'DTCs cleared successfully' : 'Failed to clear DTCs'
      };

    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Parse DTC codes from response
   */
  parseDTCs(data) {
    const dtcs = [];

    if (!data || data.length < 2) return dtcs;

    // Skip first byte (number of DTCs) and parse DTCs
    for (let i = 1; i < data.length; i += 2) {
      if (i + 1 < data.length) {
        const dtc = this.decodeDTC(data[i], data[i + 1]);
        if (dtc) {
          dtcs.push(dtc);
        }
      }
    }

    return dtcs;
  }

  /**
   * Decode DTC from bytes
   */
  decodeDTC(byte1, byte2) {
    const firstChar = String.fromCharCode(65 + ((byte1 >> 6) & 0x03)); // A, B, C, or D
    const secondChar = String.fromCharCode(48 + ((byte1 >> 4) & 0x03)); // 0, 1, 2, or 3
    const thirdChar = ((byte1 >> 0) & 0x0F).toString(16).toUpperCase();
    const fourthChar = ((byte2 >> 4) & 0x0F).toString(16).toUpperCase();
    const fifthChar = ((byte2 >> 0) & 0x0F).toString(16).toUpperCase();

    const code = `${firstChar}${secondChar}${thirdChar}${fourthChar}${fifthChar}`;

    return {
      code,
      status: 'stored',
      description: this.getDTCDescription(code),
      severity: this.getDTCSeverity(code)
    };
  }

  /**
   * Get DTC description (simplified)
   */
  getDTCDescription(code) {
    const descriptions = {
      'P0101': 'Mass or Volume Air Flow Circuit Range/Performance Problem',
      'P0171': 'System Too Lean (Bank 1)',
      'P0300': 'Random/Multiple Cylinder Misfire Detected',
      'P0420': 'Catalyst System Efficiency Below Threshold (Bank 1)'
    };

    return descriptions[code] || 'Unknown DTC code';
  }

  /**
   * Get DTC severity
   */
  getDTCSeverity(code) {
    if (code.startsWith('P0')) return 'High';
    if (code.startsWith('P1')) return 'Medium';
    return 'Low';
  }

  /**
   * Parse PID support
   */
  parsePIDSupport(data) {
    if (!data || data.length < 4) return;

    // Each bit represents support for a PID
    for (let byte = 0; byte < 4; byte++) {
      for (let bit = 0; bit < 8; bit++) {
        if (data[byte] & (1 << (7 - bit))) {
          const pidNumber = byte * 8 + bit + 1;
          const pid = pidNumber.toString(16).toUpperCase().padStart(2, '0');
          this.supportedPIDs.add(`01${pid}`);
        }
      }
    }
  }

  /**
   * Parse protocol response
   */
  parseProtocolResponse(response) {
    // Mock protocol detection
    return 'ISO 14230-4 (KWP2000)';
  }

  /**
   * Generate mock response for testing
   */
  generateMockResponse(command) {
    // Mock responses for different commands
    const responses = {
      'ATZ': 'ELM327 v1.5',
      'ATE0': 'OK',
      'ATL0': 'OK',
      'ATS0': 'OK',
      'ATH0': 'OK',
      'ATDPN': '6',
      '0100': '41 00 BE 1F B8 10',
      '010C': '41 0C 1A F8',
      '010D': '41 0D 32',
      '0105': '41 05 5A',
      '0111': '41 11 32',
      '03': '43 01 33 00 00 00 00',
      '04': '44'
    };

    return responses[command] || 'NO DATA';
  }

  /**
   * Disconnect adapter
   */
  async disconnectAdapter() {
    try {
      console.log('Disconnecting OBD-II adapter...');

      // Stop any active monitoring
      await this.stopDataMonitoring();

      // Close connection
      if (this.connectionPort && this.connectionPort.serialPort) {
        this.connectionPort.serialPort.close();
        this.connectionPort = null;
      }

      // Clear any pending command
      if (this.pendingCommand) {
        const { reject, timeoutId } = this.pendingCommand;
        clearTimeout(timeoutId);
        reject(new Error('Connection closed'));
        this.pendingCommand = null;
      }

      this.connected = false;
      this.adapterType = null;
      this.adapterInfo = null;
      this.protocol = null;
      this.ecuCount = 0;
      this.supportedPIDs.clear();

      console.log('OBD-II adapter disconnected');
      return { success: true };

    } catch (error) {
      console.error('Error disconnecting adapter:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Scan for available adapters
   */
  scanForAdapters() {
    // In real implementation, this would scan Bluetooth, WiFi, and USB ports
    // For now, just update the available adapters list
  }

  /**
   * Utility delay function
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get React components for client-side
   */
  getComponents(React) {
    // Return empty for now - will be implemented with actual components
    return {};
  }

  /**
   * Get routes for client-side
   */
  getRoutes(React) {
    // Return empty for now - will be implemented with actual routes
    return [];
  }
}

module.exports = OBD2AdapterPlugin;