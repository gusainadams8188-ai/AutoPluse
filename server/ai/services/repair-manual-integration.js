class RepairManualIntegration {
  constructor() {
    this.manualDatabase = this.initializeManualDatabase();
    this.searchIndex = this.buildSearchIndex();
  }

  /**
   * Initialize repair manual database with comprehensive repair information
   * @returns {Object} Repair manual database
   */
  initializeManualDatabase() {
    return {
      // Engine repair manuals
      engine: {
        'P0300': {
          title: 'Random/Multiple Cylinder Misfire Repair Manual',
          sections: {
            diagnosis: {
              title: 'Diagnostic Procedures',
              steps: [
                'Connect diagnostic scanner and read freeze frame data',
                'Check for other DTC codes that may be causing the misfire',
                'Inspect spark plugs for fouling or excessive gap',
                'Test ignition coils for proper operation',
                'Check fuel injectors for clogging or improper spray pattern',
                'Perform cylinder compression test',
                'Check for vacuum leaks in intake system'
              ]
            },
            repair: {
              title: 'Repair Procedures',
              components: {
                spark_plugs: {
                  procedure: 'Replace all spark plugs with OEM specification plugs',
                  tools: ['spark plug socket', 'ratchet', 'torque wrench'],
                  specifications: 'Gap: 0.044 inches, Torque: 15 ft-lbs'
                },
                ignition_coils: {
                  procedure: 'Replace faulty ignition coil(s) identified during testing',
                  tools: ['multimeter', 'screwdriver'],
                  specifications: 'Resistance: 0.5-1.5 ohms primary, 10-15k ohms secondary'
                },
                fuel_injectors: {
                  procedure: 'Clean or replace clogged fuel injectors',
                  tools: ['fuel injector cleaning kit', 'multimeter'],
                  specifications: 'Resistance: 12-16 ohms at 20°C'
                }
              }
            },
            safety: {
              title: 'Safety Precautions',
              notes: [
                'Allow engine to cool before working on ignition components',
                'Wear safety glasses to protect eyes from debris',
                'Keep fire extinguisher nearby when working on fuel system',
                'Disconnect battery negative terminal before working on electrical components'
              ]
            }
          }
        },
        'P0171': {
          title: 'System Too Lean Repair Manual',
          sections: {
            diagnosis: {
              title: 'Diagnostic Procedures',
              steps: [
                'Check intake air temperature sensor operation',
                'Inspect air filter for restrictions',
                'Test mass airflow sensor signal',
                'Check for vacuum leaks in intake manifold',
                'Inspect fuel pressure regulator',
                'Test oxygen sensors for proper operation'
              ]
            },
            repair: {
              title: 'Repair Procedures',
              components: {
                mass_airflow_sensor: {
                  procedure: 'Clean or replace MAF sensor',
                  tools: ['MAF sensor cleaner', 'multimeter'],
                  specifications: 'Signal voltage: 1-5V, Frequency: 30-150 Hz'
                },
                oxygen_sensor: {
                  procedure: 'Replace faulty oxygen sensor(s)',
                  tools: ['oxygen sensor socket', 'torque wrench'],
                  specifications: 'Torque: 30-40 ft-lbs'
                },
                intake_manifold: {
                  procedure: 'Repair vacuum leaks with appropriate sealant',
                  tools: ['vacuum pump', 'carburetor cleaner'],
                  specifications: 'Sealant: RTV silicone, Cure time: 24 hours'
                }
              }
            }
          }
        }
      },

      // Transmission repair manuals
      transmission: {
        'P0700': {
          title: 'Transmission Control System Malfunction',
          sections: {
            diagnosis: {
              title: 'Diagnostic Procedures',
              steps: [
                'Check transmission fluid level and condition',
                'Scan for transmission-specific DTC codes',
                'Test transmission solenoids',
                'Check wiring harness for damage',
                'Inspect transmission control module connections'
              ]
            },
            repair: {
              title: 'Repair Procedures',
              components: {
                transmission_fluid: {
                  procedure: 'Drain and refill transmission fluid',
                  tools: ['drain pan', 'funnel', 'fluid pump'],
                  specifications: 'Fluid type: ATF+4, Capacity: 8-10 quarts'
                },
                wiring_harness: {
                  procedure: 'Repair or replace damaged wiring',
                  tools: ['multimeter', 'crimping tool', 'electrical tape'],
                  specifications: 'Wire gauge: 18-22 AWG, Continuity: <0.1 ohms'
                }
              }
            }
          }
        }
      },

      // Brake system repair manuals
      brakes: {
        general: {
          title: 'Brake System Maintenance and Repair',
          sections: {
            inspection: {
              title: 'Brake Inspection Procedures',
              steps: [
                'Visually inspect brake pads for thickness',
                'Check brake rotors for scoring or warping',
                'Measure brake fluid level',
                'Test brake pedal feel and travel',
                'Listen for unusual noises during braking'
              ]
            },
            maintenance: {
              title: 'Maintenance Procedures',
              components: {
                brake_pads: {
                  procedure: 'Replace brake pads when thickness reaches minimum',
                  tools: ['C-clamp', 'brake tool', 'torque wrench'],
                  specifications: 'Minimum thickness: 3mm, Torque: 80-100 ft-lbs'
                },
                brake_rotors: {
                  procedure: 'Resurface or replace warped/scored rotors',
                  tools: ['micrometer', 'brake lathe'],
                  specifications: 'Maximum runout: 0.002 inches, Minimum thickness: stamped on rotor'
                },
                brake_fluid: {
                  procedure: 'Flush and replace brake fluid every 2 years',
                  tools: ['brake bleeding kit', 'clear tubing'],
                  specifications: 'Fluid type: DOT 3 or DOT 4'
                }
              }
            }
          }
        }
      },

      // Electrical system repair manuals
      electrical: {
        'P0562': {
          title: 'System Voltage Low',
          sections: {
            diagnosis: {
              title: 'Diagnostic Procedures',
              steps: [
                'Test battery voltage and load test',
                'Check alternator output voltage',
                'Inspect battery cables and connections',
                'Test voltage regulator operation',
                'Check for parasitic battery drain'
              ]
            },
            repair: {
              title: 'Repair Procedures',
              components: {
                battery: {
                  procedure: 'Test and replace weak battery',
                  tools: ['battery tester', 'hydrometer'],
                  specifications: 'Cold cranking amps: 600+, Reserve capacity: 100+ minutes'
                },
                alternator: {
                  procedure: 'Test and replace faulty alternator',
                  tools: ['multimeter', 'alternator tester'],
                  specifications: 'Output voltage: 13.8-14.4V at idle, 200+ amps'
                },
                battery_cables: {
                  procedure: 'Clean or replace corroded battery cables',
                  tools: ['battery terminal cleaner', 'cable cutter'],
                  specifications: 'Cable gauge: 4-6 AWG, Torque: 10-15 ft-lbs'
                }
              }
            }
          }
        }
      }
    };
  }

  /**
   * Build search index for quick lookup
   * @returns {Object} Search index
   */
  buildSearchIndex() {
    const index = {
      by_dtc: {},
      by_symptom: {},
      by_component: {},
      by_system: {}
    };

    // Index by DTC codes
    Object.keys(this.manualDatabase).forEach(system => {
      Object.keys(this.manualDatabase[system]).forEach(code => {
        if (!index.by_dtc[code]) {
          index.by_dtc[code] = [];
        }
        index.by_dtc[code].push({
          system: system,
          code: code,
          title: this.manualDatabase[system][code].title
        });
      });
    });

    return index;
  }

  /**
   * Search repair manuals by DTC code
   * @param {string} dtcCode - DTC code to search for
   * @returns {Object} Repair manual information
   */
  searchByDTC(dtcCode) {
    const results = [];

    Object.keys(this.manualDatabase).forEach(system => {
      if (this.manualDatabase[system][dtcCode]) {
        results.push({
          system: system,
          dtc_code: dtcCode,
          manual: this.manualDatabase[system][dtcCode]
        });
      }
    });

    if (results.length === 0) {
      return {
        found: false,
        message: `No repair manual found for DTC code ${dtcCode}`,
        suggestions: this.getSimilarDTCs(dtcCode)
      };
    }

    return {
      found: true,
      results: results,
      count: results.length
    };
  }

  /**
   * Search repair manuals by symptom description
   * @param {string} symptom - Symptom description
   * @returns {Array} Relevant repair manuals
   */
  searchBySymptom(symptom) {
    const results = [];
    const symptomLower = symptom.toLowerCase();

    Object.keys(this.manualDatabase).forEach(system => {
      Object.keys(this.manualDatabase[system]).forEach(code => {
        const manual = this.manualDatabase[system][code];

        // Search in title and section content
        const titleMatch = manual.title.toLowerCase().includes(symptomLower);
        let contentMatch = false;

        Object.values(manual.sections).forEach(section => {
          if (section.steps) {
            contentMatch = contentMatch || section.steps.some(step =>
              step.toLowerCase().includes(symptomLower)
            );
          }
          if (section.components) {
            Object.values(section.components).forEach(component => {
              if (component.procedure) {
                contentMatch = contentMatch || component.procedure.toLowerCase().includes(symptomLower);
              }
            });
          }
        });

        if (titleMatch || contentMatch) {
          results.push({
            system: system,
            dtc_code: code,
            manual: manual,
            relevance_score: titleMatch ? 1.0 : 0.7
          });
        }
      });
    });

    // Sort by relevance
    results.sort((a, b) => b.relevance_score - a.relevance_score);

    return results.slice(0, 10); // Return top 10 results
  }

  /**
   * Search repair manuals by component name
   * @param {string} component - Component name
   * @returns {Array} Relevant repair manuals
   */
  searchByComponent(component) {
    const results = [];
    const componentLower = component.toLowerCase();

    Object.keys(this.manualDatabase).forEach(system => {
      Object.keys(this.manualDatabase[system]).forEach(code => {
        const manual = this.manualDatabase[system][code];

        // Search in component sections
        Object.values(manual.sections).forEach(section => {
          if (section.components) {
            Object.keys(section.components).forEach(compKey => {
              if (compKey.toLowerCase().includes(componentLower)) {
                results.push({
                  system: system,
                  dtc_code: code,
                  component: compKey,
                  procedure: section.components[compKey],
                  manual_title: manual.title
                });
              }
            });
          }
        });
      });
    });

    return results;
  }

  /**
   * Get repair procedure for specific component
   * @param {string} component - Component name
   * @param {string} system - System name (optional)
   * @returns {Object} Repair procedure
   */
  getRepairProcedure(component, system = null) {
    const componentLower = component.toLowerCase();

    if (system && this.manualDatabase[system]) {
      // Search in specific system
      for (const [code, manual] of Object.entries(this.manualDatabase[system])) {
        for (const section of Object.values(manual.sections)) {
          if (section.components && section.components[componentLower]) {
            return {
              system: system,
              dtc_code: code,
              component: component,
              procedure: section.components[componentLower],
              manual_title: manual.title
            };
          }
        }
      }
    } else {
      // Search all systems
      const results = this.searchByComponent(component);
      if (results.length > 0) {
        return results[0];
      }
    }

    return {
      found: false,
      message: `No repair procedure found for component: ${component}`,
      suggestions: this.getSimilarComponents(component)
    };
  }

  /**
   * Get diagnostic procedures for a DTC code
   * @param {string} dtcCode - DTC code
   * @returns {Object} Diagnostic procedures
   */
  getDiagnosticProcedures(dtcCode) {
    const searchResult = this.searchByDTC(dtcCode);

    if (!searchResult.found) {
      return searchResult;
    }

    const procedures = [];

    searchResult.results.forEach(result => {
      const diagnosisSection = result.manual.sections.diagnosis;
      if (diagnosisSection) {
        procedures.push({
          system: result.system,
          dtc_code: result.dtc_code,
          title: result.manual.title,
          diagnostic_steps: diagnosisSection.steps,
          estimated_time: this.estimateDiagnosticTime(diagnosisSection.steps.length),
          difficulty: this.assessDifficulty(diagnosisSection.steps)
        });
      }
    });

    return {
      found: true,
      procedures: procedures,
      count: procedures.length
    };
  }

  /**
   * Get safety precautions for a repair
   * @param {string} dtcCode - DTC code
   * @returns {Array} Safety precautions
   */
  getSafetyPrecautions(dtcCode) {
    const searchResult = this.searchByDTC(dtcCode);

    if (!searchResult.found) {
      return [];
    }

    const precautions = [];

    searchResult.results.forEach(result => {
      const safetySection = result.manual.sections.safety;
      if (safetySection && safetySection.notes) {
        precautions.push(...safetySection.notes);
      }
    });

    // Remove duplicates
    return [...new Set(precautions)];
  }

  /**
   * Estimate diagnostic time based on number of steps
   * @param {number} stepCount - Number of diagnostic steps
   * @returns {string} Estimated time
   */
  estimateDiagnosticTime(stepCount) {
    const baseTime = 30; // 30 minutes base time
    const timePerStep = 15; // 15 minutes per step
    const totalMinutes = baseTime + (stepCount * timePerStep);

    if (totalMinutes < 60) {
      return `${totalMinutes} minutes`;
    } else {
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      return `${hours} hour${hours > 1 ? 's' : ''} ${minutes} minute${minutes !== 1 ? 's' : ''}`;
    }
  }

  /**
   * Assess difficulty level of diagnostic procedure
   * @param {Array} steps - Diagnostic steps
   * @returns {string} Difficulty level
   */
  assessDifficulty(steps) {
    const stepCount = steps.length;
    const complexityIndicators = steps.join(' ').toLowerCase();

    let complexity = 0;

    // Check for complexity indicators
    if (complexityIndicators.includes('oscilloscope') || complexityIndicators.includes('scan tool')) {
      complexity += 2;
    }
    if (complexityIndicators.includes('disassemble') || complexityIndicators.includes('remove')) {
      complexity += 1;
    }
    if (stepCount > 10) complexity += 1;
    if (complexityIndicators.includes('pressure test') || complexityIndicators.includes('leak test')) {
      complexity += 1;
    }

    if (complexity >= 4) return 'expert';
    else if (complexity >= 2) return 'intermediate';
    else return 'beginner';
  }

  /**
   * Get similar DTC codes for suggestions
   * @param {string} dtcCode - Original DTC code
   * @returns {Array} Similar DTC codes
   */
  getSimilarDTCs(dtcCode) {
    const suggestions = [];
    const codePrefix = dtcCode.substring(0, 3);

    Object.keys(this.manualDatabase).forEach(system => {
      Object.keys(this.manualDatabase[system]).forEach(code => {
        if (code.startsWith(codePrefix) && code !== dtcCode) {
          suggestions.push({
            code: code,
            title: this.manualDatabase[system][code].title,
            system: system
          });
        }
      });
    });

    return suggestions.slice(0, 5);
  }

  /**
   * Get similar components for suggestions
   * @param {string} component - Original component
   * @returns {Array} Similar components
   */
  getSimilarComponents(component) {
    const suggestions = [];
    const componentLower = component.toLowerCase();

    Object.keys(this.manualDatabase).forEach(system => {
      Object.keys(this.manualDatabase[system]).forEach(code => {
        const manual = this.manualDatabase[system][code];

        Object.values(manual.sections).forEach(section => {
          if (section.components) {
            Object.keys(section.components).forEach(compKey => {
              if (compKey.toLowerCase().includes(componentLower.substring(0, 4))) {
                suggestions.push({
                  component: compKey,
                  system: system,
                  dtc_code: code
                });
              }
            });
          }
        });
      });
    });

    // Remove duplicates
    const unique = suggestions.filter((item, index, self) =>
      index === self.findIndex(s => s.component === item.component)
    );

    return unique.slice(0, 5);
  }

  /**
   * Get all available repair manuals
   * @returns {Object} Complete repair manual database
   */
  getAllManuals() {
    return {
      systems: Object.keys(this.manualDatabase),
      total_manuals: Object.values(this.manualDatabase).reduce((sum, system) =>
        sum + Object.keys(system).length, 0
      ),
      database: this.manualDatabase
    };
  }

  /**
   * Search repair manuals with advanced query
   * @param {Object} query - Search query parameters
   * @returns {Array} Search results
   */
  advancedSearch(query) {
    const {
      text,
      system,
      component,
      dtc_code,
      limit = 20
    } = query;

    let results = [];

    const searchInManual = (systemName, code, manual) => {
      let score = 0;
      const matches = [];

      // Text search
      if (text) {
        const textLower = text.toLowerCase();
        if (manual.title.toLowerCase().includes(textLower)) {
          score += 1.0;
          matches.push('title');
        }

        Object.values(manual.sections).forEach(section => {
          if (section.steps) {
            section.steps.forEach(step => {
              if (step.toLowerCase().includes(textLower)) {
                score += 0.5;
                matches.push('diagnostic_step');
              }
            });
          }

          if (section.components) {
            Object.keys(section.components).forEach(comp => {
              if (comp.toLowerCase().includes(textLower)) {
                score += 0.8;
                matches.push('component');
              }
            });
          }
        });
      }

      // System filter
      if (system && systemName !== system) {
        return null;
      }

      // Component filter
      if (component) {
        const hasComponent = Object.values(manual.sections).some(section =>
          section.components && Object.keys(section.components).some(comp =>
            comp.toLowerCase().includes(component.toLowerCase())
          )
        );
        if (!hasComponent) return null;
        score += 0.3;
      }

      // DTC code filter
      if (dtc_code && code !== dtc_code) {
        return null;
      }

      if (score > 0) {
        return {
          system: systemName,
          dtc_code: code,
          manual: manual,
          score: score,
          matches: matches
        };
      }

      return null;
    };

    // Perform search
    Object.keys(this.manualDatabase).forEach(systemName => {
      Object.keys(this.manualDatabase[systemName]).forEach(code => {
        const result = searchInManual(systemName, code, this.manualDatabase[systemName][code]);
        if (result) {
          results.push(result);
        }
      });
    });

    // Sort by score and limit results
    results.sort((a, b) => b.score - a.score);
    return results.slice(0, limit);
  }
}

module.exports = RepairManualIntegration;