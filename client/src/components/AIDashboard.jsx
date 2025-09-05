import { useState, useEffect } from 'react';
import ChartComponent from './ChartComponent';

function AIDashboard() {
  const [aiData, setAiData] = useState({
    fuelEfficiency: null,
    maintenanceRecommendations: [],
    ecoScore: null,
    drivingPattern: null,
    maintenanceAnalysis: null,
    predictions: null
  });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadAIData();
  }, []);

  const loadAIData = async () => {
    setLoading(true);
    try {
      // Load fuel efficiency analysis
      const fuelResponse = await fetch('http://localhost:3001/api/ai/fuel-efficiency/analysis');
      if (fuelResponse.ok) {
        const fuelData = await fuelResponse.json();
        setAiData(prev => ({ ...prev, fuelEfficiency: fuelData }));
      }

      // Load eco-driving score
      const ecoResponse = await fetch('http://localhost:3001/api/ai/fuel-efficiency/eco-score');
      if (ecoResponse.ok) {
        const ecoData = await ecoResponse.json();
        setAiData(prev => ({ ...prev, ecoScore: ecoData }));
      }

      // Load driving pattern
      const patternResponse = await fetch('http://localhost:3001/api/ai/fuel-efficiency/driving-pattern');
      if (patternResponse.ok) {
        const patternData = await patternResponse.json();
        setAiData(prev => ({ ...prev, drivingPattern: patternData }));
      }

      // Load maintenance recommendations
      const maintenanceResponse = await fetch('http://localhost:3001/api/ai/maintenance/recommendations');
      if (maintenanceResponse.ok) {
        const maintenanceData = await maintenanceResponse.json();
        setAiData(prev => ({ ...prev, maintenanceRecommendations: maintenanceData }));
      }

    } catch (error) {
      console.error('Error loading AI data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMaintenanceAnalysis = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/ai/maintenance/performance-analysis');
      if (response.ok) {
        const data = await response.json();
        setAiData(prev => ({ ...prev, maintenanceAnalysis: data }));
      }
    } catch (error) {
      console.error('Error loading maintenance analysis:', error);
    }
  };

  const loadPredictions = async (maintenanceType) => {
    try {
      const response = await fetch(`http://localhost:3001/api/ai/maintenance/predict-impact?maintenanceType=${maintenanceType}`);
      if (response.ok) {
        const data = await response.json();
        setAiData(prev => ({ ...prev, predictions: data }));
      }
    } catch (error) {
      console.error('Error loading predictions:', error);
    }
  };

  const renderOverview = () => (
    <div className="ai-overview">
      <div className="ai-metrics-grid">
        {/* Fuel Efficiency Card */}
        <div className="ai-metric-card">
          <h3>🚗 Fuel Efficiency</h3>
          {aiData.fuelEfficiency ? (
            <div className="metric-content">
              <div className="metric-value">{aiData.fuelEfficiency.current_efficiency?.instant_mpg?.toFixed(1)} MPG</div>
              <div className="metric-change">
                {aiData.fuelEfficiency.trend === 'improving' ? '📈' : '📉'}
                {aiData.fuelEfficiency.change_percentage?.toFixed(1)}% vs last week
              </div>
            </div>
          ) : (
            <div className="metric-loading">Loading...</div>
          )}
        </div>

        {/* Eco Score Card */}
        <div className="ai-metric-card">
          <h3>🌱 Eco Score</h3>
          {aiData.ecoScore ? (
            <div className="metric-content">
              <div className="metric-value">{aiData.ecoScore.score}/100</div>
              <div className="metric-grade grade-{aiData.ecoScore.grade.toLowerCase()}">
                {aiData.ecoScore.grade}
              </div>
            </div>
          ) : (
            <div className="metric-loading">Loading...</div>
          )}
        </div>

        {/* Driving Pattern Card */}
        <div className="ai-metric-card">
          <h3>🛣️ Driving Pattern</h3>
          {aiData.drivingPattern ? (
            <div className="metric-content">
              <div className="metric-value">{aiData.drivingPattern.pattern}</div>
              <div className="metric-efficiency">
                Efficiency: {(aiData.drivingPattern.efficiency_multiplier * 100).toFixed(0)}%
              </div>
            </div>
          ) : (
            <div className="metric-loading">Loading...</div>
          )}
        </div>

        {/* Maintenance Recommendations Card */}
        <div className="ai-metric-card">
          <h3>🔧 Recommendations</h3>
          <div className="metric-content">
            <div className="metric-value">{aiData.maintenanceRecommendations.length}</div>
            <div className="metric-label">Active recommendations</div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="ai-quick-actions">
        <h3>Quick Actions</h3>
        <div className="action-buttons">
          <button
            onClick={() => setActiveTab('fuel')}
            className="action-btn"
          >
            📊 Fuel Analysis
          </button>
          <button
            onClick={() => setActiveTab('maintenance')}
            className="action-btn"
          >
            🔧 Maintenance
          </button>
          <button
            onClick={() => setActiveTab('predictions')}
            className="action-btn"
          >
            🔮 Predictions
          </button>
        </div>
      </div>
    </div>
  );

  const renderFuelAnalysis = () => (
    <div className="ai-fuel-analysis">
      <h2>Fuel Efficiency Analysis</h2>

      {aiData.fuelEfficiency && (
        <div className="analysis-grid">
          <div className="analysis-card">
            <h3>Current Performance</h3>
            <div className="performance-metrics">
              <div className="metric">
                <span className="label">Instant MPG:</span>
                <span className="value">{aiData.fuelEfficiency.current_efficiency?.instant_mpg?.toFixed(1)}</span>
              </div>
              <div className="metric">
                <span className="label">Average MPG:</span>
                <span className="value">{aiData.fuelEfficiency.current_efficiency?.average_mpg?.toFixed(1)}</span>
              </div>
              <div className="metric">
                <span className="label">Fuel Level:</span>
                <span className="value">{aiData.fuelEfficiency.current_efficiency?.fuel_level}%</span>
              </div>
            </div>
          </div>

          <div className="analysis-card">
            <h3>Eco-Driving Score</h3>
            {aiData.ecoScore && (
              <div className="eco-score-display">
                <div className="score-circle">{aiData.ecoScore.score}</div>
                <div className="score-details">
                  <div className="grade">Grade: {aiData.ecoScore.grade}</div>
                  <div className="tips">
                    <h4>Improvement Tips:</h4>
                    <ul>
                      {aiData.ecoScore.tips.map((tip, index) => (
                        <li key={index}>{tip}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="analysis-card">
            <h3>Driving Pattern Analysis</h3>
            {aiData.drivingPattern && (
              <div className="pattern-analysis">
                <div className="pattern-type">{aiData.drivingPattern.pattern} Driving</div>
                <div className="pattern-description">{aiData.drivingPattern.description}</div>
                <div className="efficiency-indicator">
                  <span>Efficiency Multiplier: </span>
                  <span className="multiplier">{aiData.drivingPattern.efficiency_multiplier.toFixed(2)}x</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Fuel Efficiency Recommendations */}
      <div className="recommendations-section">
        <h3>Fuel Efficiency Recommendations</h3>
        <div className="recommendations-grid">
          <div className="recommendation-card immediate">
            <h4>🚀 Immediate Actions</h4>
            <ul>
              <li>Check tire pressure (optimal: 32 PSI)</li>
              <li>Remove unnecessary weight from vehicle</li>
              <li>Avoid rapid acceleration</li>
            </ul>
          </div>
          <div className="recommendation-card short-term">
            <h4>📅 Short-term Improvements</h4>
            <ul>
              <li>Replace air filter</li>
              <li>Schedule fuel system cleaning</li>
              <li>Monitor driving habits</li>
            </ul>
          </div>
          <div className="recommendation-card long-term">
            <h4>🎯 Long-term Optimization</h4>
            <ul>
              <li>Consider fuel-efficient tires</li>
              <li>Regular maintenance schedule</li>
              <li>Advanced driver training</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );

  const renderMaintenanceAnalysis = () => (
    <div className="ai-maintenance-analysis">
      <h2>Maintenance Performance Analysis</h2>

      <div className="analysis-controls">
        <button
          onClick={loadMaintenanceAnalysis}
          className="analysis-btn"
          disabled={loading}
        >
          {loading ? 'Loading...' : 'Run Analysis'}
        </button>
      </div>

      {aiData.maintenanceAnalysis && (
        <div className="analysis-results">
          <div className="summary-cards">
            <div className="summary-card">
              <h3>Overall Effectiveness</h3>
              <div className="score-display">
                {aiData.maintenanceAnalysis.analysis?.maintenance_effectiveness?.overall_score?.toFixed(1)}/100
              </div>
            </div>
            <div className="summary-card">
              <h3>Events Analyzed</h3>
              <div className="count-display">
                {aiData.maintenanceAnalysis.maintenance_events_analyzed}
              </div>
            </div>
            <div className="summary-card">
              <h3>Cost-Benefit Ratio</h3>
              <div className="ratio-display">
                {aiData.maintenanceAnalysis.analysis?.cost_benefit_analysis?.average_roi?.toFixed(2)}x
              </div>
            </div>
          </div>

          <div className="recommendations-list">
            <h3>AI Recommendations</h3>
            {aiData.maintenanceAnalysis.analysis?.recommendations?.map((rec, index) => (
              <div key={index} className={`recommendation-item priority-${rec.priority}`}>
                <div className="rec-header">
                  <h4>{rec.title}</h4>
                  <span className="priority">{rec.priority}</span>
                </div>
                <p>{rec.description}</p>
                <div className="rec-meta">
                  <span>Impact: {rec.impact}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Maintenance Recommendations */}
      <div className="maintenance-recommendations">
        <h3>Active Maintenance Recommendations</h3>
        <div className="recommendations-list">
          {aiData.maintenanceRecommendations.map((rec, index) => (
            <div key={index} className="recommendation-card">
              <div className="rec-header">
                <h4>{rec.title}</h4>
                <span className={`urgency ${rec.urgency}`}>{rec.urgency}</span>
              </div>
              <p>{rec.description}</p>
              <div className="rec-details">
                <span>Priority: {rec.priority}</span>
                <span>Impact: {rec.impact}</span>
                <span>Confidence: {rec.confidence}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderPredictions = () => (
    <div className="ai-predictions">
      <h2>Maintenance Impact Predictions</h2>

      <div className="prediction-controls">
        <select
          onChange={(e) => loadPredictions(e.target.value)}
          className="maintenance-select"
        >
          <option value="">Select maintenance type...</option>
          <option value="oil_change">Oil Change</option>
          <option value="air_filter_replacement">Air Filter Replacement</option>
          <option value="fuel_filter_replacement">Fuel Filter Replacement</option>
          <option value="spark_plug_replacement">Spark Plug Replacement</option>
          <option value="brake_pad_replacement">Brake Pad Replacement</option>
          <option value="tire_replacement">Tire Replacement</option>
        </select>
      </div>

      {aiData.predictions && (
        <div className="prediction-results">
          {aiData.predictions.prediction_available ? (
            <div className="prediction-content">
              <div className="prediction-header">
                <h3>{aiData.predictions.maintenance_type.replace(/_/g, ' ').toUpperCase()}</h3>
                <div className="confidence">Confidence: {aiData.predictions.confidence_level}</div>
              </div>

              <div className="expected-improvements">
                <h4>Expected Performance Improvements</h4>
                <div className="improvements-grid">
                  {Object.entries(aiData.predictions.expected_improvements).map(([metric, data]) => (
                    <div key={metric} className="improvement-card">
                      <h5>{metric.replace(/_/g, ' ')}</h5>
                      <div className="improvement-values">
                        <div className="current">Current: {data.current.toFixed(2)}</div>
                        <div className="expected">Expected: {data.expected.toFixed(2)}</div>
                        <div className="change">+{data.improvement_percentage.toFixed(1)}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="cost-benefit-analysis">
                <h4>Cost-Benefit Analysis</h4>
                <div className="analysis-metrics">
                  <div className="metric">
                    <span>Typical Cost:</span>
                    <span>${aiData.predictions.cost_benefit_projection?.typical_cost_range?.min} - ${aiData.predictions.cost_benefit_projection?.typical_cost_range?.max}</span>
                  </div>
                  <div className="metric">
                    <span>Annual Savings:</span>
                    <span>${aiData.predictions.cost_benefit_projection?.expected_annual_savings?.toFixed(0)}</span>
                  </div>
                  <div className="metric">
                    <span>ROI:</span>
                    <span>{aiData.predictions.cost_benefit_projection?.roi_percentage?.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="no-prediction">
              <p>{aiData.predictions.reason}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="ai-dashboard">
      <div className="ai-header">
        <h1>🤖 AI Automotive Assistant</h1>
        <p>Intelligent analysis and recommendations for your vehicle</p>
      </div>

      <div className="ai-navigation">
        <button
          className={activeTab === 'overview' ? 'nav-btn active' : 'nav-btn'}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={activeTab === 'fuel' ? 'nav-btn active' : 'nav-btn'}
          onClick={() => setActiveTab('fuel')}
        >
          Fuel Analysis
        </button>
        <button
          className={activeTab === 'maintenance' ? 'nav-btn active' : 'nav-btn'}
          onClick={() => setActiveTab('maintenance')}
        >
          Maintenance
        </button>
        <button
          className={activeTab === 'predictions' ? 'nav-btn active' : 'nav-btn'}
          onClick={() => setActiveTab('predictions')}
        >
          Predictions
        </button>
      </div>

      <div className="ai-content">
        {loading && <div className="loading-indicator">Loading AI data...</div>}

        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'fuel' && renderFuelAnalysis()}
        {activeTab === 'maintenance' && renderMaintenanceAnalysis()}
        {activeTab === 'predictions' && renderPredictions()}
      </div>
    </div>
  );
}

export default AIDashboard;