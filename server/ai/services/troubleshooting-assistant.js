class TroubleshootingAssistant {
  constructor() {
    this.dtcKnowledgeBase = this.initializeDTCKnowledgeBase();
    this.symptomPatterns = this.initializeSymptomPatterns();
    this.repairProcedures = this.initializeRepairProcedures();
    this.diagnosticFlowcharts = this.initializeDiagnosticFlowcharts();
  }

  /**
   * Initialize DTC knowledge base with common codes and their implications
   * @returns {Object} DTC knowledge base
   */
  initializeDTCKnowledgeBase() {
    return {
      'P0300': {
        description: 'Random/Multiple Cylinder Misfire Detected',
        severity: 'high',
        category: 'engine',
        symptoms: ['rough_idle', 'engine_vibration', 'power_loss', 'check_engine_light'],
        possible_causes: [
          'faulty_spark_plugs', 'bad_ignition_coils', 'clogged_fuel_injectors',
          'low_fuel_pressure', 'vacuum_leak', 'low_compression'
        ],
        related_systems: ['ignition', 'fuel', 'air_intake'],
        urgency: 'high'
      },
      'P0171': {
        description: 'System Too Lean (Bank 1)',
        severity: 'medium',
        category: 'fuel',
        symptoms: ['poor_fuel_economy', 'rough_idle', 'hesitation', 'check_engine_light'],
        possible_causes: [
          'vacuum_leak', 'faulty_mass_airflow_sensor', 'clogged_fuel_filter',
          'faulty_oxygen_sensor', 'exhaust_leak'
        ],
        related_systems: ['fuel', 'air_intake', 'exhaust'],
        urgency: 'medium'
      },
      'P0420': {
        description: 'Catalyst System Efficiency Below Threshold (Bank 1)',
        severity: 'medium',
        category: 'emissions',
        symptoms: ['check_engine_light', 'reduced_performance', 'poor_fuel_economy'],
        possible_causes: [
          'faulty_catalytic_converter', 'faulty_oxygen_sensor', 'exhaust_leak',
          'engine_misfire', 'rich_fuel_mixture'
        ],
        related_systems: ['exhaust', 'emissions', 'engine'],
        urgency: 'medium'
      },
      'P0301': {
        description: 'Cylinder 1 Misfire Detected',
        severity: 'high',
        category: 'engine',
        symptoms: ['rough_idle', 'engine_vibration', 'power_loss'],
        possible_causes: [
          'faulty_spark_plug_cylinder1', 'bad_ignition_coil_cylinder1',
          'clogged_fuel_injector_cylinder1', 'low_compression_cylinder1'
        ],
        related_systems: ['ignition', 'fuel'],
        urgency: 'high'
      },
      'P0101': {
        description: 'Mass or Volume Air Flow Circuit Range/Performance Problem',
        severity: 'medium',
        category: 'air_intake',
        symptoms: ['poor_performance', 'rough_idle', 'hesitation', 'check_engine_light'],
        possible_causes: [
          'dirty_mass_airflow_sensor', 'faulty_mass_airflow_sensor',
          'air_filter_clogged', 'vacuum_leak'
        ],
        related_systems: ['air_intake', 'fuel'],
        urgency: 'medium'
      }
    };
  }

  /**
   * Initialize symptom patterns for diagnosis
   * @returns {Object} Symptom patterns
   */
  initializeSymptomPatterns() {
    return {
      rough_idle: {
        possible_codes: ['P0300', 'P0171', 'P0101'],
        related_symptoms: ['engine_vibration', 'hesitation', 'poor_performance'],
        priority_checks: ['spark_plugs', 'fuel_injectors', 'air_filter']
      },
      engine_vibration: {
        possible_codes: ['P0300', 'P0301'],
        related_symptoms: ['rough_idle', 'power_loss'],
        priority_checks: ['engine_mounts', 'spark_plugs', 'fuel_system']
      },
      poor_fuel_economy: {
        possible_codes: ['P0171', 'P0420', 'P0101'],
        related_symptoms: ['hesitation', 'power_loss'],
        priority_checks: ['air_filter', 'fuel_filter', 'oxygen_sensors']
      },
      check_engine_light: {
        possible_codes: ['P0300', 'P0171', 'P0420', 'P0101'],
        related_symptoms: ['various'],
        priority_checks: ['read_dtc_codes', 'check_engine_components']
      },
      power_loss: {
        possible_codes: ['P0300', 'P0301'],
        related_symptoms: ['hesitation', 'poor_acceleration'],
        priority_checks: ['fuel_system', 'ignition_system', 'air_intake']
      }
    };
  }

  /**
   * Initialize repair procedures database
   * @returns {Object} Repair procedures
   */
  initializeRepairProcedures() {
    return {
      spark_plugs: {
        difficulty: 'easy',
        time_estimate: '30 minutes',
        tools_required: ['spark_plug_socket', 'ratchet', 'gap_tool'],
        steps: [
          'Locate spark plugs (usually on top of engine)',
          'Remove ignition coil or spark plug wire from first plug',
          'Use spark plug socket to remove old plug',
          'Check gap on new plug and adjust if necessary',
          'Install new plug and torque to specification',
          'Repeat for remaining plugs',
          'Reconnect ignition coils or wires'
        ],
        cost_estimate: 80,
        safety_notes: ['Allow engine to cool before starting', 'Wear safety glasses']
      },
      air_filter: {
        difficulty: 'easy',
        time_estimate: '15 minutes',
        tools_required: ['screwdriver'],
        steps: [
          'Locate air filter housing',
          'Remove housing cover clips or screws',
          'Remove old air filter',
          'Clean housing if necessary',
          'Install new air filter',
          'Replace housing cover and secure'
        ],
        cost_estimate: 25,
        safety_notes: ['Ensure new filter is properly seated']
      },
      fuel_filter: {
        difficulty: 'medium',
        time_estimate: '45 minutes',
        tools_required: ['wrench_set', 'drain_pan'],
        steps: [
          'Locate fuel filter (usually along fuel line)',
          'Relieve fuel system pressure',
          'Place drain pan under filter',
          'Disconnect fuel lines from filter',
          'Remove old filter',
          'Install new filter (note flow direction)',
          'Reconnect fuel lines',
          'Prime fuel system and check for leaks'
        ],
        cost_estimate: 60,
        safety_notes: ['Work in well-ventilated area', 'No smoking or open flames', 'Wear safety glasses']
      }
    };
  }

  /**
   * Initialize diagnostic flowcharts
   * @returns {Object} Diagnostic flowcharts
   */
  initializeDiagnosticFlowcharts() {
    return {
      misfire_diagnosis: {
        start_question: 'Does the engine run rough or vibrate?',
        steps: [
          {
            question: 'Is the Check Engine Light on?',
            yes_action: 'Read DTC codes to identify specific cylinders',
            no_action: 'Check for mechanical issues'
          },
          {
            question: 'Are spark plugs fouled or worn?',
            yes_action: 'Replace spark plugs',
            no_action: 'Check ignition coils'
          },
          {
            question: 'Are ignition coils functioning properly?',
            yes_action: 'Check fuel injectors',
            no_action: 'Replace faulty ignition coil'
          }
        ]
      },
      poor_fuel_economy: {
        start_question: 'Has fuel economy decreased significantly?',
        steps: [
          {
            question: 'Is the air filter clean?',
            yes_action: 'Check tire pressure',
            no_action: 'Replace air filter'
          },
          {
            question: 'Are tires properly inflated?',
            yes_action: 'Check fuel filter',
            no_action: 'Inflate tires to proper pressure'
          },
          {
            question: 'Is fuel filter clogged?',
            yes_action: 'Check oxygen sensors',
            no_action: 'Replace fuel filter'
          }
        ]
      }
    };
  }

  /**
   * Analyze DTC codes and provide diagnostic suggestions
   * @param {Array} dtcCodes - Array of DTC codes
   * @param {Object} sensorData - Current sensor data
   * @returns {Object} Diagnostic analysis
   */
  analyzeDTCCodes(dtcCodes, sensorData = {}) {
    const analysis = {
      primary_issues: [],
      related_symptoms: [],
      recommended_tests: [],
      repair_priority: [],
      estimated_cost: 0,
      time_estimate: '0 minutes'
    };

    dtcCodes.forEach(code => {
      if (this.dtcKnowledgeBase[code.code]) {
        const dtcInfo = this.dtcKnowledgeBase[code.code];

        analysis.primary_issues.push({
          code: code.code,
          description: dtcInfo.description,
          severity: dtcInfo.severity,
          category: dtcInfo.category
        });

        // Add symptoms
        dtcInfo.symptoms.forEach(symptom => {
          if (!analysis.related_symptoms.includes(symptom)) {
            analysis.related_symptoms.push(symptom);
          }
        });

        // Add repair priority based on severity
        dtcInfo.possible_causes.forEach(cause => {
          analysis.repair_priority.push({
            cause: cause,
            priority: dtcInfo.urgency,
            related_code: code.code
          });
        });
      }
    });

    // Generate recommended tests based on issues
    analysis.recommended_tests = this.generateRecommendedTests(analysis.primary_issues, sensorData);

    // Estimate cost and time
    const estimates = this.estimateRepairCostAndTime(analysis.repair_priority);
    analysis.estimated_cost = estimates.cost;
    analysis.time_estimate = estimates.time;

    return analysis;
  }

  /**
   * Analyze symptoms and suggest possible causes
   * @param {Array} symptoms - Array of reported symptoms
   * @param {Object} sensorData - Current sensor data
   * @returns {Object} Symptom analysis
   */
  analyzeSymptoms(symptoms, sensorData = {}) {
    const analysis = {
      possible_causes: [],
      recommended_dtc_checks: [],
      immediate_actions: [],
      severity_assessment: 'low'
    };

    let maxSeverity = 0;

    symptoms.forEach(symptom => {
      if (this.symptomPatterns[symptom]) {
        const pattern = this.symptomPatterns[symptom];

        // Add possible DTC codes
        pattern.possible_codes.forEach(code => {
          if (!analysis.recommended_dtc_checks.includes(code)) {
            analysis.recommended_dtc_checks.push(code);
          }
        });

        // Add priority checks as possible causes
        pattern.priority_checks.forEach(check => {
          if (!analysis.possible_causes.includes(check)) {
            analysis.possible_causes.push(check);
          }
        });

        // Determine severity
        if (pattern.possible_codes.some(code => this.dtcKnowledgeBase[code]?.severity === 'high')) {
          maxSeverity = Math.max(maxSeverity, 3);
        } else if (pattern.possible_codes.some(code => this.dtcKnowledgeBase[code]?.severity === 'medium')) {
          maxSeverity = Math.max(maxSeverity, 2);
        } else {
          maxSeverity = Math.max(maxSeverity, 1);
        }
      }
    });

    // Set severity assessment
    if (maxSeverity === 3) analysis.severity_assessment = 'high';
    else if (maxSeverity === 2) analysis.severity_assessment = 'medium';

    // Generate immediate actions based on severity
    analysis.immediate_actions = this.generateImmediateActions(analysis.severity_assessment, symptoms);

    return analysis;
  }

  /**
   * Generate recommended diagnostic tests
   * @param {Array} issues - Primary issues
   * @param {Object} sensorData - Sensor data
   * @returns {Array} Recommended tests
   */
  generateRecommendedTests(issues, sensorData) {
    const tests = [];

    issues.forEach(issue => {
      switch (issue.category) {
        case 'engine':
          tests.push({
            test: 'Compression Test',
            priority: 'high',
            reason: 'Check for engine mechanical issues'
          });
          tests.push({
            test: 'Spark Plug Inspection',
            priority: 'high',
            reason: 'Check ignition system components'
          });
          break;

        case 'fuel':
          tests.push({
            test: 'Fuel Pressure Test',
            priority: 'high',
            reason: 'Verify fuel system pressure'
          });
          tests.push({
            test: 'Fuel Injector Balance Test',
            priority: 'medium',
            reason: 'Check fuel delivery balance'
          });
          break;

        case 'air_intake':
          tests.push({
            test: 'Mass Airflow Sensor Test',
            priority: 'high',
            reason: 'Check air intake sensor'
          });
          tests.push({
            test: 'Intake Manifold Vacuum Test',
            priority: 'medium',
            reason: 'Check for vacuum leaks'
          });
          break;

        case 'emissions':
          tests.push({
            test: 'Exhaust Gas Analysis',
            priority: 'medium',
            reason: 'Check exhaust system efficiency'
          });
          tests.push({
            test: 'Oxygen Sensor Test',
            priority: 'high',
            reason: 'Check emissions sensors'
          });
          break;
      }
    });

    return tests;
  }

  /**
   * Generate immediate actions based on severity
   * @param {string} severity - Severity level
   * @param {Array} symptoms - Symptoms
   * @returns {Array} Immediate actions
   */
  generateImmediateActions(severity, symptoms) {
    const actions = [];

    if (severity === 'high') {
      actions.push({
        action: 'Do not drive the vehicle',
        reason: 'High risk of further damage or safety issue'
      });
      actions.push({
        action: 'Contact professional mechanic immediately',
        reason: 'Complex diagnostic procedures required'
      });
    } else if (severity === 'medium') {
      actions.push({
        action: 'Schedule diagnostic appointment within 1 week',
        reason: 'Issue requires professional attention'
      });
      actions.push({
        action: 'Avoid high-speed or heavy-load driving',
        reason: 'May worsen the condition'
      });
    } else {
      actions.push({
        action: 'Monitor symptoms and vehicle performance',
        reason: 'May be minor issue or intermittent fault'
      });
      actions.push({
        action: 'Check and maintain proper fluid levels',
        reason: 'Basic maintenance may resolve issue'
      });
    }

    return actions;
  }

  /**
   * Estimate repair cost and time
   * @param {Array} repairItems - Items requiring repair
   * @returns {Object} Cost and time estimates
   */
  estimateRepairCostAndTime(repairItems) {
    let totalCost = 0;
    let totalTime = 0;

    repairItems.forEach(item => {
      // Use repair procedures database for estimates
      if (this.repairProcedures[item.cause]) {
        const procedure = this.repairProcedures[item.cause];
        totalCost += procedure.cost_estimate;
        totalTime += this.parseTimeEstimate(procedure.time_estimate);
      } else {
        // Default estimates for unknown procedures
        totalCost += 100;
        totalTime += 60; // 1 hour default
      }
    });

    return {
      cost: totalCost,
      time: this.formatTimeEstimate(totalTime)
    };
  }

  /**
   * Parse time estimate string to minutes
   * @param {string} timeString - Time estimate (e.g., "30 minutes")
   * @returns {number} Time in minutes
   */
  parseTimeEstimate(timeString) {
    const match = timeString.match(/(\d+)/);
    if (match) {
      const value = parseInt(match[1]);
      if (timeString.includes('hour')) {
        return value * 60;
      }
      return value;
    }
    return 60; // Default 1 hour
  }

  /**
   * Format time estimate from minutes
   * @param {number} minutes - Time in minutes
   * @returns {string} Formatted time string
   */
  formatTimeEstimate(minutes) {
    if (minutes < 60) {
      return `${minutes} minutes`;
    } else {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return `${hours} hour${hours > 1 ? 's' : ''} ${remainingMinutes} minute${remainingMinutes !== 1 ? 's' : ''}`;
    }
  }

  /**
   * Get detailed repair procedure
   * @param {string} component - Component to repair
   * @returns {Object} Repair procedure details
   */
  getRepairProcedure(component) {
    return this.repairProcedures[component] || {
      difficulty: 'unknown',
      time_estimate: 'Contact professional',
      tools_required: ['professional_diagnostic_tools'],
      steps: ['Consult vehicle service manual', 'Contact certified mechanic'],
      cost_estimate: 0,
      safety_notes: ['Professional service recommended']
    };
  }

  /**
   * Perform comprehensive diagnostic analysis
   * @param {Array} dtcCodes - DTC codes
   * @param {Array} symptoms - Reported symptoms
   * @param {Object} sensorData - Sensor data
   * @returns {Object} Comprehensive diagnostic report
   */
  performComprehensiveDiagnosis(dtcCodes = [], symptoms = [], sensorData = {}) {
    const report = {
      timestamp: new Date().toISOString(),
      diagnostic_summary: {},
      recommended_actions: [],
      priority_level: 'low',
      estimated_cost: 0,
      estimated_time: '0 minutes'
    };

    // Analyze DTC codes
    if (dtcCodes.length > 0) {
      const dtcAnalysis = this.analyzeDTCCodes(dtcCodes, sensorData);
      report.diagnostic_summary.dtc_analysis = dtcAnalysis;
    }

    // Analyze symptoms
    if (symptoms.length > 0) {
      const symptomAnalysis = this.analyzeSymptoms(symptoms, sensorData);
      report.diagnostic_summary.symptom_analysis = symptomAnalysis;
    }

    // Determine overall priority
    const priorities = [];
    if (report.diagnostic_summary.dtc_analysis) {
      priorities.push(...report.diagnostic_summary.dtc_analysis.primary_issues.map(i => i.severity));
    }
    if (report.diagnostic_summary.symptom_analysis) {
      priorities.push(report.diagnostic_summary.symptom_analysis.severity_assessment);
    }

    if (priorities.includes('high')) {
      report.priority_level = 'high';
    } else if (priorities.includes('medium')) {
      report.priority_level = 'medium';
    }

    // Combine recommended actions
    const allActions = [];

    if (report.diagnostic_summary.dtc_analysis) {
      allActions.push(...report.diagnostic_summary.dtc_analysis.repair_priority);
    }
    if (report.diagnostic_summary.symptom_analysis) {
      allActions.push(...report.diagnostic_summary.symptom_analysis.immediate_actions);
    }

    report.recommended_actions = allActions;

    // Calculate total estimates
    let totalCost = 0;
    let totalTime = 0;

    if (report.diagnostic_summary.dtc_analysis) {
      totalCost += report.diagnostic_summary.dtc_analysis.estimated_cost;
      totalTime += this.parseTimeEstimate(report.diagnostic_summary.dtc_analysis.time_estimate);
    }

    report.estimated_cost = totalCost;
    report.estimated_time = this.formatTimeEstimate(totalTime);

    return report;
  }

  /**
   * Get diagnostic flowchart for a specific issue
   * @param {string} issueType - Type of issue
   * @returns {Object} Diagnostic flowchart
   */
  getDiagnosticFlowchart(issueType) {
    return this.diagnosticFlowcharts[issueType] || {
      start_question: 'Please describe the symptoms',
      steps: [
        {
          question: 'Have you checked the basics (oil, coolant, battery)?',
          yes_action: 'Proceed to specific diagnostic procedures',
          no_action: 'Check basic maintenance items first'
        }
      ]
    };
  }
}

module.exports = TroubleshootingAssistant;