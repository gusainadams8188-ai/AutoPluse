import React, { useState, useEffect } from 'react';
import './MockDataController.css';

function MockDataController() {
  const [mockStatus, setMockStatus] = useState(null);
  const [scenarios, setScenarios] = useState([]);
  const [vehicleTypes, setVehicleTypes] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadMockDataStatus();
    loadScenarios();
    loadVehicleTypes();
  }, []);

  const loadMockDataStatus = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/mock/status');
      if (response.ok) {
        const status = await response.json();
        setMockStatus(status);
      }
    } catch (error) {
      console.error('Error loading mock data status:', error);
    }
  };

  const loadScenarios = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/mock/scenarios');
      if (response.ok) {
        const data = await response.json();
        setScenarios(data);
      }
    } catch (error) {
      console.error('Error loading scenarios:', error);
    }
  };

  const loadVehicleTypes = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/mock/vehicle-types');
      if (response.ok) {
        const data = await response.json();
        setVehicleTypes(data);
      }
    } catch (error) {
      console.error('Error loading vehicle types:', error);
    }
  };

  const toggleMockData = async () => {
    if (!mockStatus) return;

    setLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/mock/enable', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ enabled: !mockStatus.enabled })
      });

      if (response.ok) {
        await loadMockDataStatus();
      } else {
        alert('Failed to toggle mock data');
      }
    } catch (error) {
      console.error('Error toggling mock data:', error);
      alert('Error toggling mock data');
    } finally {
      setLoading(false);
    }
  };

  const setScenario = async (scenarioId) => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/mock/scenario', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ scenario: scenarioId })
      });

      if (response.ok) {
        await loadMockDataStatus();
      } else {
        alert('Failed to set scenario');
      }
    } catch (error) {
      console.error('Error setting scenario:', error);
      alert('Error setting scenario');
    } finally {
      setLoading(false);
    }
  };

  const setVehicleType = async (vehicleTypeId) => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/mock/vehicle-type', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ vehicleType: vehicleTypeId })
      });

      if (response.ok) {
        await loadMockDataStatus();
      } else {
        alert('Failed to set vehicle type');
      }
    } catch (error) {
      console.error('Error setting vehicle type:', error);
      alert('Error setting vehicle type');
    } finally {
      setLoading(false);
    }
  };

  const clearHistory = async () => {
    if (!confirm('Are you sure you want to clear the mock data history?')) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/mock/clear-history', {
        method: 'POST'
      });

      if (response.ok) {
        alert('Mock data history cleared successfully');
        await loadMockDataStatus();
      } else {
        alert('Failed to clear history');
      }
    } catch (error) {
      console.error('Error clearing history:', error);
      alert('Error clearing history');
    } finally {
      setLoading(false);
    }
  };

  if (!mockStatus) {
    return (
      <div className="mock-data-controller">
        <div className="loading">Loading mock data controller...</div>
      </div>
    );
  }

  return (
    <div className="mock-data-controller">
      <h2>Mock Data Controller</h2>

      <div className="mock-status">
        <div className="status-indicator">
          <span className={`status-dot ${mockStatus.enabled ? 'enabled' : 'disabled'}`}></span>
          <span className="status-text">
            Mock Data: {mockStatus.enabled ? 'Enabled' : 'Disabled'}
          </span>
        </div>
        <button
          onClick={toggleMockData}
          disabled={loading}
          className={`toggle-btn ${mockStatus.enabled ? 'disable' : 'enable'}`}
        >
          {loading ? '...' : (mockStatus.enabled ? 'Disable Mock Data' : 'Enable Mock Data')}
        </button>
      </div>

      {mockStatus.enabled && (
        <div className="mock-controls">
          <div className="control-group">
            <label htmlFor="scenario-select">Driving Scenario:</label>
            <select
              id="scenario-select"
              value={mockStatus.currentScenario}
              onChange={(e) => setScenario(e.target.value)}
              disabled={loading}
            >
              {scenarios.map(scenario => (
                <option key={scenario.id} value={scenario.id}>
                  {scenario.name}
                </option>
              ))}
            </select>
            <div className="scenario-description">
              {scenarios.find(s => s.id === mockStatus.currentScenario)?.description}
            </div>
          </div>

          <div className="control-group">
            <label htmlFor="vehicle-select">Vehicle Type:</label>
            <select
              id="vehicle-select"
              value={mockStatus.currentVehicleType}
              onChange={(e) => setVehicleType(e.target.value)}
              disabled={loading}
            >
              {vehicleTypes.map(vehicle => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicle.name}
                </option>
              ))}
            </select>
          </div>

          <div className="mock-info">
            <div className="info-item">
              <span className="label">Current Scenario:</span>
              <span className="value">{mockStatus.scenarioName}</span>
            </div>
            <div className="info-item">
              <span className="label">Vehicle Type:</span>
              <span className="value">{mockStatus.vehicleTypeName}</span>
            </div>
            <div className="info-item">
              <span className="label">Data History:</span>
              <span className="value">{mockStatus.dataHistorySize} vehicle records</span>
            </div>
            <div className="info-item">
              <span className="label">Fuel History:</span>
              <span className="value">{mockStatus.fuelHistorySize} fuel records</span>
            </div>
          </div>

          <div className="mock-actions">
            <button
              onClick={clearHistory}
              disabled={loading}
              className="clear-btn"
            >
              Clear History
            </button>
            <button
              onClick={loadMockDataStatus}
              disabled={loading}
              className="refresh-btn"
            >
              Refresh Status
            </button>
          </div>
        </div>
      )}

      <div className="mock-help">
        <h3>How it works:</h3>
        <ul>
          <li><strong>Mock Data:</strong> When enabled, generates simulated vehicle data instead of using real sensor data</li>
          <li><strong>Scenarios:</strong> Different driving conditions (city, highway, sport, etc.) with realistic parameter variations</li>
          <li><strong>Vehicle Types:</strong> Different vehicle configurations (sedan, SUV, truck, sports car) with appropriate multipliers</li>
          <li><strong>Fault Scenarios:</strong> Simulate various vehicle faults for testing diagnostic features</li>
        </ul>
      </div>
    </div>
  );
}

export default MockDataController;