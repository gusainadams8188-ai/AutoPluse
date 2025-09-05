/**
 * Mock Data Service
 * Centralized service for generating mock vehicle data with various scenarios
 */

class MockDataService {
  constructor() {
    this.isEnabled = true;
    this.currentScenario = 'normal';
    this.scenarios = {
      normal: {
        name: 'Normal Operation',
        description: 'Standard driving conditions with normal parameters'
      },
      city: {
        name: 'City Driving',
        description: 'Urban driving with frequent stops and starts'
      },
      highway: {
        name: 'Highway Driving',
        description: 'High-speed highway driving'
      },
      sport: {
        name: 'Sport Mode',
        description: 'Performance driving with high RPM and load'
      },
      overheat: {
        name: 'Overheating',
        description: 'Engine overheating scenario'
      },
      low_oil: {
        name: 'Low Oil Pressure',
        description: 'Low oil pressure warning'
      },
      sensor_fault: {
        name: 'Sensor Fault',
        description: 'Faulty sensor readings'
      },
      fuel_economy: {
        name: 'Fuel Economy Focus',
        description: 'Optimized for fuel efficiency'
      }
    };

    this.vehicleTypes = {
      sedan: {
        name: 'Sedan',
        multipliers: { rpm: 1, speed: 1, load: 1 }
      },
      suv: {
        name: 'SUV',
        multipliers: { rpm: 0.9, speed: 0.95, load: 1.1 }
      },
      truck: {
        name: 'Truck',
        multipliers: { rpm: 0.8, speed: 0.9, load: 1.2 }
      },
      sports: {
        name: 'Sports Car',
        multipliers: { rpm: 1.2, speed: 1.3, load: 1.1 }
      }
    };

    this.currentVehicleType = 'sedan';
    this.dataHistory = [];
    this.fuelHistory = [];
    this.maxHistorySize = 1000;
  }

  /**
   * Enable or disable mock data generation
   */
  setEnabled(enabled) {
    this.isEnabled = enabled;
    console.log(`Mock data service ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Check if mock data service is enabled
   */
  isMockEnabled() {
    return this.isEnabled;
  }

  /**
   * Set the current driving scenario
   */
  setScenario(scenario) {
    if (this.scenarios[scenario]) {
      this.currentScenario = scenario;
      console.log(`Mock data scenario changed to: ${this.scenarios[scenario].name}`);
    } else {
      console.warn(`Unknown scenario: ${scenario}`);
    }
  }

  /**
   * Get current scenario
   */
  getCurrentScenario() {
    return this.currentScenario;
  }

  /**
   * Set vehicle type
   */
  setVehicleType(vehicleType) {
    if (this.vehicleTypes[vehicleType]) {
      this.currentVehicleType = vehicleType;
      console.log(`Vehicle type changed to: ${this.vehicleTypes[vehicleType].name}`);
    } else {
      console.warn(`Unknown vehicle type: ${vehicleType}`);
    }
  }

  /**
   * Get available scenarios
   */
  getAvailableScenarios() {
    return Object.keys(this.scenarios).map(key => ({
      id: key,
      ...this.scenarios[key]
    }));
  }

  /**
   * Get available vehicle types
   */
  getAvailableVehicleTypes() {
    return Object.keys(this.vehicleTypes).map(key => ({
      id: key,
      ...this.vehicleTypes[key]
    }));
  }

  /**
   * Generate mock vehicle data based on current scenario and vehicle type
   */
  generateVehicleData() {
    if (!this.isEnabled) {
      return null;
    }

    const scenario = this.scenarios[this.currentScenario];
    const vehicleType = this.vehicleTypes[this.currentVehicleType];
    const multipliers = vehicleType.multipliers;

    let baseData = {};

    // Generate base data based on scenario
    switch (this.currentScenario) {
      case 'city':
        baseData = {
          rpm: (1200 + Math.random() * 2500) * multipliers.rpm,
          speed: (15 + Math.random() * 50) * multipliers.speed,
          throttle_pos: 25 + Math.random() * 45,
          engine_load: 35 + Math.random() * 35
        };
        break;

      case 'highway':
        baseData = {
          rpm: (1800 + Math.random() * 1800) * multipliers.rpm,
          speed: (70 + Math.random() * 50) * multipliers.speed,
          throttle_pos: 15 + Math.random() * 35,
          engine_load: 25 + Math.random() * 30
        };
        break;

      case 'sport':
        baseData = {
          rpm: (2500 + Math.random() * 3500) * multipliers.rpm,
          speed: (40 + Math.random() * 100) * multipliers.speed,
          throttle_pos: 40 + Math.random() * 60,
          engine_load: 50 + Math.random() * 45
        };
        break;

      case 'fuel_economy':
        baseData = {
          rpm: (1400 + Math.random() * 1200) * multipliers.rpm,
          speed: (45 + Math.random() * 35) * multipliers.speed,
          throttle_pos: 10 + Math.random() * 25,
          engine_load: 20 + Math.random() * 25
        };
        break;

      default: // normal
        baseData = {
          rpm: (1500 + Math.random() * 2000) * multipliers.rpm,
          speed: (20 + Math.random() * 60) * multipliers.speed,
          throttle_pos: 20 + Math.random() * 40,
          engine_load: 30 + Math.random() * 30
        };
    }

    // Apply fault scenarios
    let coolant_temp = 75 + Math.random() * 25;
    let fuel_pressure = 30 + Math.random() * 20;
    let intake_manifold_pressure = 25 + Math.random() * 55;

    switch (this.currentScenario) {
      case 'overheat':
        coolant_temp = 105 + Math.random() * 25;
        break;
      case 'low_oil':
        fuel_pressure = 18 + Math.random() * 12;
        break;
      case 'sensor_fault':
        intake_manifold_pressure = Math.random() * 25;
        break;
    }

    const vehicleData = {
      rpm: Math.round(baseData.rpm),
      speed: Math.round(baseData.speed * 10) / 10,
      coolant_temp: Math.round(coolant_temp * 10) / 10,
      intake_air_temp: 15 + Math.random() * 35,
      throttle_pos: Math.round(baseData.throttle_pos),
      engine_load: Math.round(baseData.engine_load * 10) / 10,
      fuel_pressure: Math.round(fuel_pressure * 10) / 10,
      intake_manifold_pressure: Math.round(intake_manifold_pressure),
      mode: this.currentScenario,
      vehicleType: this.currentVehicleType,
      faultScenario: this.currentScenario,
      timestamp: new Date().toISOString(),
      isMock: true
    };

    // Store in history
    this.dataHistory.push(vehicleData);
    if (this.dataHistory.length > this.maxHistorySize) {
      this.dataHistory.shift();
    }

    return vehicleData;
  }

  /**
   * Generate mock fuel economy data
   */
  generateFuelData(vehicleData) {
    if (!this.isEnabled || !vehicleData) {
      return null;
    }

    // Calculate instant MPG based on speed and engine load
    let instant_mpg = 0;
    if (vehicleData.speed > 10) {
      instant_mpg = (vehicleData.speed / 12) * (1 - vehicleData.engine_load / 100) * (1 + Math.random() * 0.3 - 0.15);
      instant_mpg = Math.max(8, Math.min(45, instant_mpg));
    }

    // Simulate fuel consumption
    const fuel_consumed = vehicleData.speed > 0 ? (0.005 + Math.random() * 0.02) : 0;
    const distance_traveled = vehicleData.speed * (2 / 3600); // 2 seconds in hours

    // Calculate average MPG from recent data
    const recentData = this.dataHistory.slice(-10);
    const recentFuelData = this.fuelHistory.slice(-10);
    const average_mpg = recentFuelData.length > 0
      ? recentFuelData.reduce((sum, data) => sum + data.instant_mpg, 0) / recentFuelData.length
      : instant_mpg;

    // Simulate fuel level
    const lastFuelData = this.fuelHistory[this.fuelHistory.length - 1];
    let fuel_level = lastFuelData ? Math.max(0, lastFuelData.fuel_level - fuel_consumed) : 80;
    if (fuel_level < 5) fuel_level = 80; // Refill when low

    // Calculate range remaining
    const range_remaining = fuel_level * average_mpg * 0.08; // Rough estimate

    const fuelData = {
      fuel_level: Math.round(fuel_level * 10) / 10,
      fuel_consumed: Math.round(fuel_consumed * 1000) / 1000,
      distance_traveled: Math.round(distance_traveled * 1000) / 1000,
      instant_mpg: Math.round(instant_mpg * 10) / 10,
      average_mpg: Math.round(average_mpg * 10) / 10,
      range_remaining: Math.round(range_remaining),
      timestamp: new Date().toISOString(),
      isMock: true
    };

    // Store in history
    this.fuelHistory.push(fuelData);
    if (this.fuelHistory.length > this.maxHistorySize) {
      this.fuelHistory.shift();
    }

    return fuelData;
  }

  /**
   * Generate mock DTC codes
   */
  generateDTCCodes() {
    if (!this.isEnabled) {
      return [];
    }

    const dtcTemplates = [
      { code: 'P0300', status: 'active', description: 'Random/Multiple Cylinder Misfire Detected', severity: 'High' },
      { code: 'P0171', status: 'pending', description: 'System Too Lean (Bank 1)', severity: 'Medium' },
      { code: 'P0420', status: 'active', description: 'Catalyst System Efficiency Below Threshold (Bank 1)', severity: 'Medium' },
      { code: 'P0128', status: 'pending', description: 'Coolant Thermostat (Coolant Temperature Below Thermostat Regulating Temperature)', severity: 'Low' },
      { code: 'P0133', status: 'active', description: 'O2 Sensor Circuit Slow Response (Bank 1 Sensor 1)', severity: 'Medium' }
    ];

    // Return DTCs based on current scenario
    const activeDtcs = [];
    if (this.currentScenario === 'overheat') {
      activeDtcs.push(dtcTemplates[3]); // Coolant thermostat issue
    }
    if (this.currentScenario === 'low_oil') {
      activeDtcs.push({
        code: 'P0520',
        status: 'active',
        description: 'Engine Oil Pressure Sensor/Switch Circuit Malfunction',
        severity: 'High'
      });
    }
    if (this.currentScenario === 'sensor_fault') {
      activeDtcs.push(dtcTemplates[4]); // O2 sensor issue
    }

    // Add some random DTCs for variety
    if (Math.random() < 0.3) {
      const randomDtc = dtcTemplates[Math.floor(Math.random() * dtcTemplates.length)];
      if (!activeDtcs.find(dtc => dtc.code === randomDtc.code)) {
        activeDtcs.push(randomDtc);
      }
    }

    return activeDtcs.map(dtc => ({
      ...dtc,
      timestamp: new Date().toISOString(),
      isMock: true
    }));
  }

  /**
   * Generate mock maintenance history
   */
  generateMaintenanceHistory() {
    if (!this.isEnabled) {
      return [];
    }

    const maintenanceTemplates = [
      {
        service_type: 'Oil Change',
        description: 'Full synthetic oil change with filter replacement',
        mileage: 15000 + Math.floor(Math.random() * 5000),
        cost: 45 + Math.random() * 20,
        date_performed: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        next_service_mileage: 30000 + Math.floor(Math.random() * 5000),
        isMock: true
      },
      {
        service_type: 'Tire Rotation',
        description: 'Rotate all four tires for even wear',
        mileage: 15000 + Math.floor(Math.random() * 3000),
        cost: 20 + Math.random() * 10,
        date_performed: new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        next_service_mileage: 30000 + Math.floor(Math.random() * 3000),
        isMock: true
      },
      {
        service_type: 'Brake Inspection',
        description: 'Inspect brake pads, rotors, and fluid',
        mileage: 20000 + Math.floor(Math.random() * 5000),
        cost: 0,
        date_performed: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        next_service_mileage: 35000 + Math.floor(Math.random() * 5000),
        isMock: true
      }
    ];

    return maintenanceTemplates;
  }

  /**
   * Get service status
   */
  getStatus() {
    return {
      enabled: this.isEnabled,
      currentScenario: this.currentScenario,
      currentVehicleType: this.currentVehicleType,
      scenarioName: this.scenarios[this.currentScenario]?.name,
      vehicleTypeName: this.vehicleTypes[this.currentVehicleType]?.name,
      dataHistorySize: this.dataHistory.length,
      fuelHistorySize: this.fuelHistory.length,
      availableScenarios: this.getAvailableScenarios(),
      availableVehicleTypes: this.getAvailableVehicleTypes()
    };
  }

  /**
   * Clear data history
   */
  clearHistory() {
    this.dataHistory = [];
    this.fuelHistory = [];
    console.log('Mock data history cleared');
  }

  /**
   * Get recent data history
   */
  getDataHistory(limit = 50) {
    return this.dataHistory.slice(-limit);
  }

  /**
   * Get recent fuel history
   */
  getFuelHistory(limit = 50) {
    return this.fuelHistory.slice(-limit);
  }
}

module.exports = MockDataService;