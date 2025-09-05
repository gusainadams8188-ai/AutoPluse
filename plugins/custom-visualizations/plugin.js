/**
 * Custom Visualizations Plugin
 * Provides additional chart types and visualization components
 */

const { ClientPlugin } = require('../../shared/plugin-interface');

class CustomVisualizationsPlugin extends ClientPlugin {
  constructor() {
    super();
    this.name = 'Custom Visualizations';
    this.version = '1.0.0';
    this.description = 'Custom visualization components and charts for automotive data';
    this.author = 'Dashboard Team';
  }

  /**
   * Initialize client-side functionality
   */
  async initClient(context) {
    const { React } = context;
    console.log('Initializing Custom Visualizations Plugin');

    // Register React components
    if (context.registerComponents) {
      context.registerComponents(this.getComponents(React));
    }

    // Register routes
    if (context.registerRoutes) {
      context.registerRoutes(this.getRoutes(React));
    }
  }

  /**
   * Get React components
   */
  getComponents(React) {
    return {
      // 3D Engine Performance Chart
      Engine3DChart: this.createEngine3DChart(React),

      // Real-time Gauge Cluster
      GaugeCluster: this.createGaugeCluster(React),

      // Performance Heatmap
      PerformanceHeatmap: this.createPerformanceHeatmap(React),

      // Fuel Efficiency Timeline
      FuelEfficiencyTimeline: this.createFuelEfficiencyTimeline(React),

      // Diagnostic Status Dashboard
      DiagnosticDashboard: this.createDiagnosticDashboard(React)
    };
  }

  /**
   * Create 3D Engine Performance Chart component
   */
  createEngine3DChart(React) {
    const { useState, useEffect } = React;

    return function Engine3DChart({ data, width = 400, height = 300 }) {
      const [chartData, setChartData] = useState([]);

      useEffect(() => {
        if (data && data.length > 0) {
          // Transform data for 3D visualization
          const transformed = data.slice(-20).map((item, index) => ({
            x: index,
            y: item.rpm / 100,
            z: item.engine_load,
            speed: item.speed
          }));
          setChartData(transformed);
        }
      }, [data]);

      return React.createElement('div', {
        className: 'engine-3d-chart',
        style: { width, height, border: '1px solid #ccc', borderRadius: '8px', padding: '10px' }
      }, [
        React.createElement('h4', { key: 'title' }, '3D Engine Performance'),
        React.createElement('div', {
          key: 'chart',
          style: {
            width: '100%',
            height: '80%',
            background: 'linear-gradient(45deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '14px'
          }
        }, '3D Engine Performance Visualization'),
        React.createElement('div', {
          key: 'stats',
          style: { marginTop: '10px', fontSize: '12px', color: '#666' }
        }, `Data points: ${chartData.length}`)
      ]);
    };
  }

  /**
   * Create Gauge Cluster component
   */
  createGaugeCluster(React) {
    const { useState, useEffect } = React;

    return function GaugeCluster({ vehicleData, width = 400, height = 200 }) {
      const [gauges, setGauges] = useState({
        rpm: 0,
        speed: 0,
        temp: 0,
        fuel: 0
      });

      useEffect(() => {
        if (vehicleData) {
          setGauges({
            rpm: vehicleData.rpm,
            speed: vehicleData.speed,
            temp: vehicleData.coolant_temp,
            fuel: 75 // Mock fuel level
          });
        }
      }, [vehicleData]);

      const Gauge = ({ label, value, max, color, unit }) => {
        const percentage = (value / max) * 100;

        return React.createElement('div', {
          className: 'gauge-item',
          style: { flex: 1, textAlign: 'center', padding: '10px' }
        }, [
          React.createElement('div', {
            key: 'label',
            style: { fontSize: '12px', color: '#666', marginBottom: '5px' }
          }, label),
          React.createElement('div', {
            key: 'gauge',
            style: {
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              background: `conic-gradient(${color} 0% ${percentage}%, #e0e0e0 ${percentage}% 100%)`,
              margin: '0 auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '10px',
              fontWeight: 'bold',
              color: 'white'
            }
          }, `${Math.round(value)}${unit}`),
          React.createElement('div', {
            key: 'value',
            style: { fontSize: '10px', color: '#333', marginTop: '5px' }
          }, `${value.toFixed(1)}${unit}`)
        ]);
      };

      return React.createElement('div', {
        className: 'gauge-cluster',
        style: {
          width,
          height,
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center',
          border: '1px solid #ccc',
          borderRadius: '8px',
          padding: '10px',
          background: '#f9f9f9'
        }
      }, [
        React.createElement(Gauge, { key: 'rpm', label: 'RPM', value: gauges.rpm, max: 6000, color: '#ff6b6b', unit: '' }),
        React.createElement(Gauge, { key: 'speed', label: 'Speed', value: gauges.speed, max: 200, color: '#4ecdc4', unit: ' km/h' }),
        React.createElement(Gauge, { key: 'temp', label: 'Temp', value: gauges.temp, max: 120, color: '#45b7d1', unit: '°C' }),
        React.createElement(Gauge, { key: 'fuel', label: 'Fuel', value: gauges.fuel, max: 100, color: '#f9ca24', unit: '%' })
      ]);
    };
  }

  /**
   * Create Performance Heatmap component
   */
  createPerformanceHeatmap(React) {
    const { useState, useEffect } = React;

    return function PerformanceHeatmap({ data, width = 400, height = 300 }) {
      const [heatmapData, setHeatmapData] = useState([]);

      useEffect(() => {
        if (data && data.length > 0) {
          // Create heatmap data from performance metrics
          const heatData = [];
          for (let i = 0; i < 10; i++) {
            for (let j = 0; j < 10; j++) {
              const rpm = (i / 9) * 6000;
              const load = (j / 9) * 100;
              const intensity = Math.random(); // Mock intensity based on data
              heatData.push({ x: i, y: j, intensity, rpm, load });
            }
          }
          setHeatmapData(heatData);
        }
      }, [data]);

      return React.createElement('div', {
        className: 'performance-heatmap',
        style: { width, height, border: '1px solid #ccc', borderRadius: '8px', padding: '10px' }
      }, [
        React.createElement('h4', { key: 'title' }, 'Performance Heatmap'),
        React.createElement('div', {
          key: 'heatmap',
          style: {
            width: '100%',
            height: '80%',
            background: 'linear-gradient(45deg, #ff9a9e 0%, #fecfef 50%, #fecfef 100%)',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '14px'
          }
        }, 'RPM vs Load Performance Map'),
        React.createElement('div', {
          key: 'legend',
          style: { marginTop: '10px', fontSize: '12px', color: '#666' }
        }, 'Heatmap shows engine performance across RPM and load ranges')
      ]);
    };
  }

  /**
   * Create Fuel Efficiency Timeline component
   */
  createFuelEfficiencyTimeline(React) {
    const { useState, useEffect } = React;

    return function FuelEfficiencyTimeline({ data, width = 400, height = 300 }) {
      const [timelineData, setTimelineData] = useState([]);

      useEffect(() => {
        if (data && data.length > 0) {
          const processed = data.slice(-20).map((item, index) => ({
            time: index,
            efficiency: item.instant_mpg,
            speed: item.speed,
            load: item.engine_load
          }));
          setTimelineData(processed);
        }
      }, [data]);

      return React.createElement('div', {
        className: 'fuel-timeline',
        style: { width, height, border: '1px solid #ccc', borderRadius: '8px', padding: '10px' }
      }, [
        React.createElement('h4', { key: 'title' }, 'Fuel Efficiency Timeline'),
        React.createElement('div', {
          key: 'chart',
          style: {
            width: '100%',
            height: '70%',
            background: 'linear-gradient(to right, #a8edea 0%, #fed6e3 100%)',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#333',
            fontSize: '14px'
          }
        }, 'Fuel Efficiency Over Time'),
        React.createElement('div', {
          key: 'stats',
          style: { marginTop: '10px', fontSize: '12px', color: '#666' }
        }, `Average MPG: ${timelineData.length > 0 ? (timelineData.reduce((sum, item) => sum + item.efficiency, 0) / timelineData.length).toFixed(1) : 'N/A'}`)
      ]);
    };
  }

  /**
   * Create Diagnostic Dashboard component
   */
  createDiagnosticDashboard(React) {
    const { useState, useEffect } = React;

    return function DiagnosticDashboard({ vehicleData, dtcCodes, width = 400, height = 300 }) {
      const [diagnostics, setDiagnostics] = useState({
        engine: 'Good',
        transmission: 'Good',
        brakes: 'Good',
        electrical: 'Good'
      });

      useEffect(() => {
        if (vehicleData) {
          // Mock diagnostic analysis
          setDiagnostics({
            engine: vehicleData.coolant_temp > 100 ? 'Warning' : 'Good',
            transmission: 'Good',
            brakes: 'Good',
            electrical: vehicleData.fuel_pressure < 30 ? 'Warning' : 'Good'
          });
        }
      }, [vehicleData]);

      const DiagnosticItem = ({ system, status }) => {
        const color = status === 'Good' ? '#4caf50' : status === 'Warning' ? '#ff9800' : '#f44336';

        return React.createElement('div', {
          className: 'diagnostic-item',
          style: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '8px',
            borderBottom: '1px solid #eee'
          }
        }, [
          React.createElement('span', { key: 'system' }, system),
          React.createElement('span', {
            key: 'status',
            style: { color, fontWeight: 'bold' }
          }, status)
        ]);
      };

      return React.createElement('div', {
        className: 'diagnostic-dashboard',
        style: {
          width,
          height,
          border: '1px solid #ccc',
          borderRadius: '8px',
          padding: '15px',
          background: '#f9f9f9'
        }
      }, [
        React.createElement('h4', { key: 'title' }, 'System Diagnostics'),
        React.createElement('div', { key: 'systems' }, [
          React.createElement(DiagnosticItem, { key: 'engine', system: 'Engine', status: diagnostics.engine }),
          React.createElement(DiagnosticItem, { key: 'transmission', system: 'Transmission', status: diagnostics.transmission }),
          React.createElement(DiagnosticItem, { key: 'brakes', system: 'Brakes', status: diagnostics.brakes }),
          React.createElement(DiagnosticItem, { key: 'electrical', system: 'Electrical', status: diagnostics.electrical })
        ]),
        React.createElement('div', {
          key: 'summary',
          style: { marginTop: '10px', fontSize: '12px', color: '#666' }
        }, `Active DTC Codes: ${dtcCodes ? dtcCodes.filter(code => code.status === 'active').length : 0}`)
      ]);
    };
  }

  /**
   * Get routes for client-side
   */
  getRoutes(React) {
    // Return empty for now - can be extended with custom routes
    return [];
  }
}

module.exports = CustomVisualizationsPlugin;