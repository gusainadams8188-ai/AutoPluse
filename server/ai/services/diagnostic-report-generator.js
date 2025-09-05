class DiagnosticReportGenerator {
  constructor() {
    this.templates = this.initializeTemplates();
  }

  /**
   * Initialize report templates
   * @returns {Object} Report templates
   */
  initializeTemplates() {
    return {
      comprehensive: {
        title: 'Comprehensive Vehicle Diagnostic Report',
        sections: [
          'executive_summary',
          'vehicle_information',
          'diagnostic_findings',
          'ai_analysis',
          'maintenance_recommendations',
          'repair_procedures',
          'cost_estimate',
          'safety_recommendations',
          'conclusion'
        ]
      },
      maintenance: {
        title: 'Vehicle Maintenance Report',
        sections: [
          'executive_summary',
          'vehicle_information',
          'maintenance_history',
          'upcoming_maintenance',
          'cost_projections',
          'conclusion'
        ]
      },
      emergency: {
        title: 'Emergency Diagnostic Report',
        sections: [
          'alert_summary',
          'critical_findings',
          'immediate_actions',
          'safety_warnings',
          'contact_information'
        ]
      }
    };
  }

  /**
   * Generate comprehensive diagnostic report
   * @param {Object} diagnosticData - All diagnostic data
   * @param {string} reportType - Type of report to generate
   * @returns {Object} Generated report
   */
  async generateReport(diagnosticData, reportType = 'comprehensive') {
    const template = this.templates[reportType];

    if (!template) {
      throw new Error(`Unknown report type: ${reportType}`);
    }

    const report = {
      metadata: {
        report_id: this.generateReportId(),
        report_type: reportType,
        generated_at: new Date().toISOString(),
        template_version: '1.0'
      },
      title: template.title,
      sections: {}
    };

    // Generate each section based on template
    for (const sectionName of template.sections) {
      try {
        report.sections[sectionName] = await this.generateSection(sectionName, diagnosticData);
      } catch (error) {
        console.error(`Error generating section ${sectionName}:`, error);
        report.sections[sectionName] = {
          error: `Failed to generate section: ${error.message}`,
          status: 'error'
        };
      }
    }

    // Add report summary
    report.summary = this.generateReportSummary(report);

    return report;
  }

  /**
   * Generate individual report section
   * @param {string} sectionName - Name of section to generate
   * @param {Object} diagnosticData - Diagnostic data
   * @returns {Object} Section content
   */
  async generateSection(sectionName, diagnosticData) {
    const {
      vehicleData,
      dtcCodes,
      symptoms,
      sensorData,
      maintenanceHistory,
      aiAnalysis,
      repairManuals
    } = diagnosticData;

    switch (sectionName) {
      case 'executive_summary':
        return this.generateExecutiveSummary(diagnosticData);

      case 'vehicle_information':
        return this.generateVehicleInformation(vehicleData);

      case 'diagnostic_findings':
        return this.generateDiagnosticFindings(dtcCodes, symptoms, sensorData);

      case 'ai_analysis':
        return this.generateAIAnalysis(aiAnalysis);

      case 'maintenance_recommendations':
        return this.generateMaintenanceRecommendations(aiAnalysis?.maintenance);

      case 'repair_procedures':
        return this.generateRepairProcedures(repairManuals, dtcCodes);

      case 'cost_estimate':
        return this.generateCostEstimate(aiAnalysis, repairManuals);

      case 'safety_recommendations':
        return this.generateSafetyRecommendations(dtcCodes, symptoms);

      case 'maintenance_history':
        return this.generateMaintenanceHistory(maintenanceHistory);

      case 'upcoming_maintenance':
        return this.generateUpcomingMaintenance(aiAnalysis?.lifespan);

      case 'cost_projections':
        return this.generateCostProjections(aiAnalysis);

      case 'alert_summary':
        return this.generateAlertSummary(diagnosticData);

      case 'critical_findings':
        return this.generateCriticalFindings(diagnosticData);

      case 'immediate_actions':
        return this.generateImmediateActions(diagnosticData);

      case 'safety_warnings':
        return this.generateSafetyWarnings(diagnosticData);

      case 'contact_information':
        return this.generateContactInformation();

      case 'conclusion':
        return this.generateConclusion(diagnosticData);

      default:
        return { content: 'Section not implemented', status: 'pending' };
    }
  }

  /**
   * Generate executive summary
   * @param {Object} diagnosticData - All diagnostic data
   * @returns {Object} Executive summary
   */
  generateExecutiveSummary(diagnosticData) {
    const { dtcCodes, symptoms, aiAnalysis } = diagnosticData;

    let severity = 'normal';
    let key_findings = [];
    let recommendations = [];

    // Determine overall severity
    if (dtcCodes && dtcCodes.length > 0) {
      const highSeverityCodes = dtcCodes.filter(code => code.severity === 'high' || code.severity === 'critical');
      if (highSeverityCodes.length > 0) {
        severity = 'high';
      } else {
        severity = 'medium';
      }
    }

    // Key findings
    if (dtcCodes && dtcCodes.length > 0) {
      key_findings.push(`${dtcCodes.length} diagnostic trouble code(s) detected`);
    }

    if (symptoms && symptoms.length > 0) {
      key_findings.push(`${symptoms.length} symptom(s) reported`);
    }

    if (aiAnalysis?.anomaly?.isAnomaly) {
      key_findings.push('AI detected anomalous sensor readings');
      severity = 'high';
    }

    // Recommendations
    if (severity === 'high') {
      recommendations.push('Immediate professional inspection recommended');
    } else if (severity === 'medium') {
      recommendations.push('Schedule maintenance appointment within 1 week');
    } else {
      recommendations.push('Continue regular maintenance schedule');
    }

    return {
      overall_condition: severity,
      key_findings: key_findings,
      primary_recommendations: recommendations,
      report_confidence: this.calculateReportConfidence(diagnosticData)
    };
  }

  /**
   * Generate vehicle information section
   * @param {Object} vehicleData - Vehicle data
   * @returns {Object} Vehicle information
   */
  generateVehicleInformation(vehicleData) {
    if (!vehicleData) {
      return { status: 'no_data', message: 'Vehicle information not available' };
    }

    return {
      basic_info: {
        vin: vehicleData.vin || 'Not available',
        make: vehicleData.make || 'Unknown',
        model: vehicleData.model || 'Unknown',
        year: vehicleData.year || 'Unknown',
        engine: vehicleData.engine || 'Unknown',
        transmission: vehicleData.transmission || 'Unknown',
        mileage: vehicleData.mileage || 'Unknown'
      },
      technical_specs: {
        fuel_type: vehicleData.fuel_type || 'Unknown',
        drivetrain: vehicleData.drivetrain || 'Unknown',
        curb_weight: vehicleData.curb_weight || 'Unknown'
      },
      last_updated: new Date().toISOString()
    };
  }

  /**
   * Generate diagnostic findings section
   * @param {Array} dtcCodes - DTC codes
   * @param {Array} symptoms - Symptoms
   * @param {Object} sensorData - Sensor data
   * @returns {Object} Diagnostic findings
   */
  generateDiagnosticFindings(dtcCodes, symptoms, sensorData) {
    const findings = {
      dtc_codes: [],
      reported_symptoms: [],
      sensor_readings: [],
      severity_breakdown: { critical: 0, high: 0, medium: 0, low: 0 }
    };

    // Process DTC codes
    if (dtcCodes && dtcCodes.length > 0) {
      findings.dtc_codes = dtcCodes.map(code => ({
        code: code.code,
        description: code.description,
        severity: code.severity,
        status: code.status,
        timestamp: code.timestamp
      }));

      // Count severity levels
      dtcCodes.forEach(code => {
        const severity = code.severity?.toLowerCase() || 'medium';
        if (findings.severity_breakdown.hasOwnProperty(severity)) {
          findings.severity_breakdown[severity]++;
        }
      });
    }

    // Process symptoms
    if (symptoms && symptoms.length > 0) {
      findings.reported_symptoms = symptoms.map(symptom => ({
        symptom: symptom,
        reported_at: new Date().toISOString(),
        category: this.categorizeSymptom(symptom)
      }));
    }

    // Process sensor data
    if (sensorData) {
      findings.sensor_readings = this.summarizeSensorData(sensorData);
    }

    return findings;
  }

  /**
   * Generate AI analysis section
   * @param {Object} aiAnalysis - AI analysis results
   * @returns {Object} AI analysis section
   */
  generateAIAnalysis(aiAnalysis) {
    if (!aiAnalysis) {
      return { status: 'no_analysis', message: 'AI analysis not available' };
    }

    const analysis = {
      failure_prediction: null,
      anomaly_detection: null,
      maintenance_recommendations: null,
      confidence_levels: {}
    };

    // Failure prediction results
    if (aiAnalysis.failure) {
      analysis.failure_prediction = {
        prediction: aiAnalysis.failure.prediction,
        probability: aiAnalysis.failure.failureProbability,
        risk_level: aiAnalysis.failure.riskLevel,
        confidence: aiAnalysis.failure.confidence
      };
      analysis.confidence_levels.failure_prediction = aiAnalysis.failure.confidence;
    }

    // Anomaly detection results
    if (aiAnalysis.anomaly) {
      analysis.anomaly_detection = {
        is_anomaly: aiAnalysis.anomaly.isAnomaly,
        severity: aiAnalysis.anomaly.severity,
        reconstruction_error: aiAnalysis.anomaly.reconstructionError,
        confidence: aiAnalysis.anomaly.confidence
      };
      analysis.confidence_levels.anomaly_detection = aiAnalysis.anomaly.confidence;
    }

    // Maintenance recommendations
    if (aiAnalysis.maintenance) {
      analysis.maintenance_recommendations = {
        recommendations: aiAnalysis.maintenance.recommendations || [],
        summary: aiAnalysis.maintenance.summary || {}
      };
    }

    return analysis;
  }

  /**
   * Generate maintenance recommendations section
   * @param {Object} maintenanceData - Maintenance analysis data
   * @returns {Object} Maintenance recommendations
   */
  generateMaintenanceRecommendations(maintenanceData) {
    if (!maintenanceData) {
      return { status: 'no_data', message: 'Maintenance analysis not available' };
    }

    return {
      immediate_actions: maintenanceData.immediate_actions || [],
      short_term: maintenanceData.short_term || [],
      long_term: maintenanceData.long_term || [],
      preventive_measures: maintenanceData.preventive || [],
      priority_order: this.prioritizeMaintenance(maintenanceData)
    };
  }

  /**
   * Generate repair procedures section
   * @param {Object} repairManuals - Repair manual data
   * @param {Array} dtcCodes - DTC codes
   * @returns {Object} Repair procedures
   */
  generateRepairProcedures(repairManuals, dtcCodes) {
    const procedures = {
      primary_repairs: [],
      diagnostic_procedures: [],
      preventive_maintenance: []
    };

    // Get repair procedures for DTC codes
    if (dtcCodes && dtcCodes.length > 0 && repairManuals) {
      dtcCodes.forEach(code => {
        const manual = repairManuals[code.code];
        if (manual) {
          procedures.primary_repairs.push({
            dtc_code: code.code,
            procedure: manual.repair || 'Procedure not available',
            difficulty: manual.difficulty || 'unknown',
            estimated_time: manual.time_estimate || 'unknown',
            cost_estimate: manual.cost_estimate || 0
          });
        }
      });
    }

    return procedures;
  }

  /**
   * Generate cost estimate section
   * @param {Object} aiAnalysis - AI analysis data
   * @param {Object} repairManuals - Repair manual data
   * @returns {Object} Cost estimates
   */
  generateCostEstimate(aiAnalysis, repairManuals) {
    const estimates = {
      immediate_repairs: 0,
      preventive_maintenance: 0,
      total_estimate: 0,
      breakdown: {}
    };

    // Calculate repair costs
    if (repairManuals) {
      Object.values(repairManuals).forEach(manual => {
        if (manual.cost_estimate) {
          estimates.immediate_repairs += manual.cost_estimate;
        }
      });
    }

    // Add maintenance costs
    if (aiAnalysis?.maintenance?.summary) {
      estimates.preventive_maintenance = aiAnalysis.maintenance.summary.total_cost_estimate || 0;
    }

    estimates.total_estimate = estimates.immediate_repairs + estimates.preventive_maintenance;

    return estimates;
  }

  /**
   * Generate safety recommendations section
   * @param {Array} dtcCodes - DTC codes
   * @param {Array} symptoms - Symptoms
   * @returns {Object} Safety recommendations
   */
  generateSafetyRecommendations(dtcCodes, symptoms) {
    const recommendations = {
      immediate_safety_concerns: [],
      operating_restrictions: [],
      safety_precautions: []
    };

    // Check for safety-critical DTC codes
    if (dtcCodes) {
      const safetyCodes = dtcCodes.filter(code =>
        code.severity === 'critical' ||
        code.description?.toLowerCase().includes('brake') ||
        code.description?.toLowerCase().includes('steering') ||
        code.description?.toLowerCase().includes('airbag')
      );

      if (safetyCodes.length > 0) {
        recommendations.immediate_safety_concerns.push(
          'Vehicle may have safety system faults. Professional inspection required before driving.'
        );
        recommendations.operating_restrictions.push(
          'Do not drive vehicle until safety systems are verified and repaired.'
        );
      }
    }

    // General safety precautions
    recommendations.safety_precautions = [
      'Follow all repair procedures exactly as specified',
      'Use appropriate safety equipment when working on vehicle',
      'Ensure vehicle is on stable ground with parking brake engaged',
      'Keep fire extinguisher nearby when working on fuel system',
      'Wear safety glasses to protect eyes from debris'
    ];

    return recommendations;
  }

  /**
   * Generate conclusion section
   * @param {Object} diagnosticData - All diagnostic data
   * @returns {Object} Conclusion
   */
  generateConclusion(diagnosticData) {
    const conclusion = {
      overall_assessment: 'normal',
      next_steps: [],
      monitoring_recommendations: [],
      warranty_considerations: []
    };

    // Determine overall assessment
    const { dtcCodes, aiAnalysis } = diagnosticData;

    if (dtcCodes && dtcCodes.some(code => code.severity === 'critical')) {
      conclusion.overall_assessment = 'critical';
    } else if (dtcCodes && dtcCodes.some(code => code.severity === 'high')) {
      conclusion.overall_assessment = 'serious';
    } else if (aiAnalysis?.anomaly?.isAnomaly) {
      conclusion.overall_assessment = 'requires_attention';
    }

    // Generate next steps based on assessment
    switch (conclusion.overall_assessment) {
      case 'critical':
        conclusion.next_steps = [
          'Do not operate vehicle',
          'Contact authorized service center immediately',
          'Request towing service if needed',
          'Prepare for potential extended repair time'
        ];
        break;
      case 'serious':
        conclusion.next_steps = [
          'Schedule service appointment within 24-48 hours',
          'Avoid long distance driving',
          'Monitor vehicle performance closely',
          'Prepare repair cost estimates'
        ];
        break;
      case 'requires_attention':
        conclusion.next_steps = [
          'Schedule maintenance appointment within 1 week',
          'Continue regular vehicle operation with caution',
          'Monitor symptoms for changes',
          'Plan for preventive maintenance'
        ];
        break;
      default:
        conclusion.next_steps = [
          'Continue regular maintenance schedule',
          'Monitor vehicle performance',
          'Address any minor issues promptly',
          'Keep maintenance records up to date'
        ];
    }

    return conclusion;
  }

  /**
   * Generate report summary
   * @param {Object} report - Complete report
   * @returns {Object} Report summary
   */
  generateReportSummary(report) {
    const summary = {
      total_sections: Object.keys(report.sections).length,
      completed_sections: 0,
      issues_found: 0,
      recommendations_count: 0,
      estimated_cost: 0
    };

    // Count completed sections and extract key metrics
    Object.values(report.sections).forEach(section => {
      if (section.status !== 'error') {
        summary.completed_sections++;
      }

      // Extract metrics from relevant sections
      if (section.dtc_codes) {
        summary.issues_found += section.dtc_codes.length;
      }

      if (section.primary_recommendations) {
        summary.recommendations_count += section.primary_recommendations.length;
      }

      if (section.total_estimate) {
        summary.estimated_cost = section.total_estimate;
      }
    });

    return summary;
  }

  /**
   * Calculate report confidence
   * @param {Object} diagnosticData - Diagnostic data
   * @returns {number} Confidence score (0-1)
   */
  calculateReportConfidence(diagnosticData) {
    let confidence = 0.5; // Base confidence

    // Increase confidence based on data availability
    if (diagnosticData.dtcCodes && diagnosticData.dtcCodes.length > 0) confidence += 0.1;
    if (diagnosticData.symptoms && diagnosticData.symptoms.length > 0) confidence += 0.1;
    if (diagnosticData.sensorData) confidence += 0.1;
    if (diagnosticData.aiAnalysis) confidence += 0.2;
    if (diagnosticData.repairManuals) confidence += 0.1;

    return Math.min(1.0, confidence);
  }

  /**
   * Categorize symptom
   * @param {string} symptom - Symptom description
   * @returns {string} Symptom category
   */
  categorizeSymptom(symptom) {
    const symptomLower = symptom.toLowerCase();

    if (symptomLower.includes('engine') || symptomLower.includes('rpm')) {
      return 'engine';
    } else if (symptomLower.includes('brake')) {
      return 'brakes';
    } else if (symptomLower.includes('transmission') || symptomLower.includes('gear')) {
      return 'transmission';
    } else if (symptomLower.includes('electrical') || symptomLower.includes('light')) {
      return 'electrical';
    } else {
      return 'general';
    }
  }

  /**
   * Summarize sensor data
   * @param {Object} sensorData - Sensor data
   * @returns {Array} Sensor summary
   */
  summarizeSensorData(sensorData) {
    const summary = [];

    // Key sensor readings
    const keySensors = [
      { key: 'coolant_temp', name: 'Coolant Temperature', unit: '°C', normal: [80, 100] },
      { key: 'engine_load', name: 'Engine Load', unit: '%', normal: [20, 80] },
      { key: 'fuel_pressure', name: 'Fuel Pressure', unit: 'kPa', normal: [35, 45] },
      { key: 'rpm', name: 'Engine RPM', unit: 'rpm', normal: [800, 4000] }
    ];

    keySensors.forEach(sensor => {
      if (sensorData[sensor.key] !== undefined) {
        const value = sensorData[sensor.key];
        const isNormal = value >= sensor.normal[0] && value <= sensor.normal[1];

        summary.push({
          sensor: sensor.name,
          value: value,
          unit: sensor.unit,
          status: isNormal ? 'normal' : 'abnormal',
          normal_range: sensor.normal
        });
      }
    });

    return summary;
  }

  /**
   * Prioritize maintenance recommendations
   * @param {Object} maintenanceData - Maintenance data
   * @returns {Array} Prioritized recommendations
   */
  prioritizeMaintenance(maintenanceData) {
    const allRecommendations = [];

    // Collect all recommendations
    if (maintenanceData.immediate_actions) {
      allRecommendations.push(...maintenanceData.immediate_actions.map(r => ({ ...r, priority: 'immediate' })));
    }
    if (maintenanceData.short_term) {
      allRecommendations.push(...maintenanceData.short_term.map(r => ({ ...r, priority: 'short_term' })));
    }
    if (maintenanceData.long_term) {
      allRecommendations.push(...maintenanceData.long_term.map(r => ({ ...r, priority: 'long_term' })));
    }

    // Sort by priority
    const priorityOrder = { immediate: 3, short_term: 2, long_term: 1 };
    return allRecommendations.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);
  }

  /**
   * Generate unique report ID
   * @returns {string} Report ID
   */
  generateReportId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `RPT-${timestamp}-${random}`.toUpperCase();
  }

  /**
   * Export report in different formats
   * @param {Object} report - Report to export
   * @param {string} format - Export format (json, pdf, html)
   * @returns {string} Exported report
   */
  exportReport(report, format = 'json') {
    switch (format) {
      case 'json':
        return JSON.stringify(report, null, 2);

      case 'html':
        return this.generateHTMLReport(report);

      case 'pdf':
        // Would integrate with PDF generation library
        return JSON.stringify(report);

      default:
        return JSON.stringify(report);
    }
  }

  /**
   * Generate HTML report
   * @param {Object} report - Report data
   * @returns {string} HTML report
   */
  generateHTMLReport(report) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${report.title}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { background: #f0f0f0; padding: 20px; border-radius: 5px; }
          .section { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
          .critical { border-color: #ff0000; background: #fff5f5; }
          .warning { border-color: #ffa500; background: #fffbf0; }
          h1, h2, h3 { color: #333; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${report.title}</h1>
          <p>Report ID: ${report.metadata.report_id}</p>
          <p>Generated: ${new Date(report.metadata.generated_at).toLocaleString()}</p>
        </div>

        ${Object.entries(report.sections).map(([sectionName, sectionData]) =>
          `<div class="section">
            <h2>${sectionName.replace(/_/g, ' ').toUpperCase()}</h2>
            <pre>${JSON.stringify(sectionData, null, 2)}</pre>
          </div>`
        ).join('')}
      </body>
      </html>
    `;
  }
}

module.exports = DiagnosticReportGenerator;