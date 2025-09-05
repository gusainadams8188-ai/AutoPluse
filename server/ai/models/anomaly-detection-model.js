const tf = require('@tensorflow/tfjs');

class AnomalyDetectionModel {
  constructor() {
    this.encoder = null;
    this.decoder = null;
    this.autoencoder = null;
    this.isTrained = false;
    this.threshold = null;
    this.reconstructionErrors = [];
  }

  /**
   * Build autoencoder model for anomaly detection
   * @param {number} inputShape - Input feature dimensions
   * @param {number} encodingDim - Dimension of encoded representation
   */
  buildModel(inputShape, encodingDim = 32) {
    // Encoder
    const encoder = tf.sequential();
    encoder.add(tf.layers.dense({
      inputShape: [inputShape],
      units: 128,
      activation: 'relu',
      kernel_regularizer: tf.regularizers.l2({ l2: 0.01 })
    }));
    encoder.add(tf.layers.dropout({ rate: 0.2 }));
    encoder.add(tf.layers.dense({
      units: 64,
      activation: 'relu',
      kernel_regularizer: tf.regularizers.l2({ l2: 0.01 })
    }));
    encoder.add(tf.layers.dropout({ rate: 0.2 }));
    encoder.add(tf.layers.dense({
      units: encodingDim,
      activation: 'relu'
    }));

    // Decoder
    const decoder = tf.sequential();
    decoder.add(tf.layers.dense({
      inputShape: [encodingDim],
      units: 64,
      activation: 'relu',
      kernel_regularizer: tf.regularizers.l2({ l2: 0.01 })
    }));
    decoder.add(tf.layers.dropout({ rate: 0.2 }));
    decoder.add(tf.layers.dense({
      units: 128,
      activation: 'relu',
      kernel_regularizer: tf.regularizers.l2({ l2: 0.01 })
    }));
    decoder.add(tf.layers.dropout({ rate: 0.2 }));
    decoder.add(tf.layers.dense({
      units: inputShape,
      activation: 'linear' // Linear activation for reconstruction
    }));

    // Autoencoder (encoder + decoder)
    const input = tf.input({ shape: [inputShape] });
    const encoded = encoder.apply(input);
    const decoded = decoder.apply(encoded);

    const autoencoder = tf.model({ inputs: input, outputs: decoded });

    // Compile autoencoder
    autoencoder.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'meanSquaredError',
      metrics: ['mse']
    });

    this.encoder = encoder;
    this.decoder = decoder;
    this.autoencoder = autoencoder;

    console.log('Anomaly detection autoencoder built successfully');
  }

  /**
   * Train the autoencoder on normal data
   * @param {Array} trainingData - Normal training data
   * @param {Object} options - Training options
   */
  async train(trainingData, options = {}) {
    const {
      epochs = 100,
      batchSize = 32,
      validationSplit = 0.2,
      callbacks = []
    } = options;

    if (!this.autoencoder) {
      throw new Error('Model not built. Call buildModel() first.');
    }

    console.log('Starting autoencoder training...');
    console.log(`Training data shape: ${trainingData.length} samples`);

    // Convert to tensors
    const xs = tf.tensor2d(trainingData);
    const ys = xs.clone(); // For autoencoder, input = output

    // Default callbacks
    const defaultCallbacks = [
      tf.callbacks.earlyStopping({
        monitor: 'val_loss',
        patience: 15,
        restoreBestWeights: true
      }),
      {
        onEpochEnd: (epoch, logs) => {
          if (epoch % 10 === 0) {
            console.log(`Epoch ${epoch}: loss = ${logs.loss.toFixed(6)}, val_loss = ${logs.val_loss?.toFixed(6) || 'N/A'}`);
          }
        }
      }
    ];

    const allCallbacks = [...defaultCallbacks, ...callbacks];

    // Train the autoencoder
    const history = await this.autoencoder.fit(xs, ys, {
      epochs,
      batchSize,
      validationSplit,
      callbacks: allCallbacks,
      shuffle: true
    });

    // Calculate reconstruction errors on training data to set threshold
    await this.calculateThreshold(trainingData);

    this.isTrained = true;
    console.log('Autoencoder training completed');

    // Clean up tensors
    xs.dispose();
    ys.dispose();

    return history;
  }

  /**
   * Calculate threshold for anomaly detection based on training data
   * @param {Array} trainingData - Normal training data
   */
  async calculateThreshold(trainingData) {
    const xs = tf.tensor2d(trainingData);
    const reconstructed = this.autoencoder.predict(xs);

    // Calculate reconstruction errors
    const errors = [];
    const originalData = await xs.data();
    const reconstructedData = await reconstructed.data();

    const numSamples = trainingData.length;
    const numFeatures = trainingData[0].length;

    for (let i = 0; i < numSamples; i++) {
      let sampleError = 0;
      for (let j = 0; j < numFeatures; j++) {
        const diff = originalData[i * numFeatures + j] - reconstructedData[i * numFeatures + j];
        sampleError += diff * diff;
      }
      errors.push(Math.sqrt(sampleError / numFeatures)); // RMSE per sample
    }

    // Set threshold as mean + 3 * standard deviation
    const mean = errors.reduce((sum, err) => sum + err, 0) / errors.length;
    const std = Math.sqrt(errors.reduce((sum, err) => sum + Math.pow(err - mean, 2), 0) / errors.length);

    this.threshold = mean + 3 * std;
    this.reconstructionErrors = errors;

    console.log(`Anomaly threshold set to: ${this.threshold.toFixed(6)} (mean: ${mean.toFixed(6)}, std: ${std.toFixed(6)})`);

    // Clean up
    xs.dispose();
    reconstructed.dispose();
  }

  /**
   * Detect anomalies in new data
   * @param {Array} inputData - Data to check for anomalies
   * @returns {Array} Anomaly detection results
   */
  async detectAnomalies(inputData) {
    if (!this.autoencoder || !this.isTrained) {
      throw new Error('Model not trained. Train the model first.');
    }

    const xs = tf.tensor2d(inputData);
    const reconstructed = this.autoencoder.predict(xs);

    const results = [];
    const originalData = await xs.data();
    const reconstructedData = await reconstructed.data();

    const numSamples = inputData.length;
    const numFeatures = inputData[0].length;

    for (let i = 0; i < numSamples; i++) {
      let sampleError = 0;
      const featureErrors = [];

      for (let j = 0; j < numFeatures; j++) {
        const original = originalData[i * numFeatures + j];
        const reconstructed = reconstructedData[i * numFeatures + j];
        const error = Math.abs(original - reconstructed);
        featureErrors.push(error);
        sampleError += error * error;
      }

      const rmse = Math.sqrt(sampleError / numFeatures);
      const isAnomaly = rmse > this.threshold;

      results.push({
        index: i,
        reconstructionError: rmse,
        isAnomaly: isAnomaly,
        confidence: Math.max(0, Math.min(1, 1 - (rmse / (this.threshold * 2)))),
        featureErrors: featureErrors,
        threshold: this.threshold
      });
    }

    // Clean up
    xs.dispose();
    reconstructed.dispose();

    return results;
  }

  /**
   * Get reconstruction for visualization
   * @param {Array} inputData - Input data
   * @returns {Array} Original and reconstructed data
   */
  async getReconstruction(inputData) {
    if (!this.autoencoder || !this.isTrained) {
      throw new Error('Model not trained.');
    }

    const xs = tf.tensor2d(inputData);
    const reconstructed = this.autoencoder.predict(xs);

    const originalData = await xs.data();
    const reconstructedData = await reconstructed.data();

    const results = [];
    const numSamples = inputData.length;
    const numFeatures = inputData[0].length;

    for (let i = 0; i < numSamples; i++) {
      const original = [];
      const reconstructed = [];

      for (let j = 0; j < numFeatures; j++) {
        original.push(originalData[i * numFeatures + j]);
        reconstructed.push(reconstructedData[i * numFeatures + j]);
      }

      results.push({
        original: original,
        reconstructed: reconstructed
      });
    }

    // Clean up
    xs.dispose();
    reconstructed.dispose();

    return results;
  }

  /**
   * Evaluate model performance on test data
   * @param {Array} testData - Test data
   * @param {Array} testLabels - Test labels (1 for anomaly, 0 for normal)
   * @returns {Object} Evaluation metrics
   */
  async evaluate(testData, testLabels) {
    if (!this.autoencoder || !this.isTrained) {
      throw new Error('Model not trained. Cannot evaluate.');
    }

    const anomalyResults = await this.detectAnomalies(testData);

    let truePositives = 0, falsePositives = 0, trueNegatives = 0, falseNegatives = 0;

    anomalyResults.forEach((result, index) => {
      const predictedAnomaly = result.isAnomaly ? 1 : 0;
      const actualAnomaly = testLabels[index];

      if (predictedAnomaly === 1 && actualAnomaly === 1) truePositives++;
      else if (predictedAnomaly === 1 && actualAnomaly === 0) falsePositives++;
      else if (predictedAnomaly === 0 && actualAnomaly === 0) trueNegatives++;
      else if (predictedAnomaly === 0 && actualAnomaly === 1) falseNegatives++;
    });

    const accuracy = (truePositives + trueNegatives) / testData.length;
    const precision = truePositives / (truePositives + falsePositives) || 0;
    const recall = truePositives / (truePositives + falseNegatives) || 0;
    const f1Score = 2 * (precision * recall) / (precision + recall) || 0;

    return {
      accuracy,
      precision,
      recall,
      f1Score,
      confusionMatrix: [
        [truePositives, falsePositives],
        [falseNegatives, trueNegatives]
      ],
      threshold: this.threshold
    };
  }

  /**
   * Save model to file
   * @param {string} path - Path to save model
   */
  async saveModel(path = './models/anomaly-detection') {
    if (!this.autoencoder) {
      throw new Error('No model to save');
    }

    await this.autoencoder.save(`file://${path}`);
    console.log(`Anomaly detection model saved to ${path}`);
  }

  /**
   * Load model from file
   * @param {string} path - Path to load model from
   */
  async loadModel(path = './models/anomaly-detection') {
    try {
      this.autoencoder = await tf.loadLayersModel(`file://${path}/model.json`);
      this.isTrained = true;
      console.log(`Anomaly detection model loaded from ${path}`);
    } catch (error) {
      console.error('Error loading anomaly detection model:', error);
      throw error;
    }
  }

  /**
   * Get model summary
   * @returns {string} Model summary
   */
  getModelSummary() {
    if (!this.autoencoder) {
      return 'Autoencoder not built';
    }

    return this.autoencoder.summary();
  }

  /**
   * Reset model
   */
  reset() {
    if (this.autoencoder) {
      this.autoencoder.dispose();
    }
    if (this.encoder) {
      this.encoder.dispose();
    }
    if (this.decoder) {
      this.decoder.dispose();
    }

    this.autoencoder = null;
    this.encoder = null;
    this.decoder = null;
    this.isTrained = false;
    this.threshold = null;
    this.reconstructionErrors = [];
  }

  /**
   * Detect anomalies in real-time sensor data
   * @param {Array} sensorData - Recent sensor readings
   * @returns {Object} Anomaly detection results
   */
  async detectRealtimeAnomalies(sensorData) {
    if (!this.isTrained) {
      throw new Error('Model not trained');
    }

    // Extract features from sensor data
    const features = sensorData.map(point => [
      point.rpm || 0,
      point.speed || 0,
      point.coolant_temp || 0,
      point.intake_air_temp || 0,
      point.throttle_pos || 0,
      point.engine_load || 0,
      point.fuel_pressure || 0,
      point.intake_manifold_pressure || 0
    ]);

    const anomalies = await this.detectAnomalies(features);

    // Get the most recent anomaly result
    const latestResult = anomalies[anomalies.length - 1];

    // Calculate anomaly severity
    let severity = 'normal';
    if (latestResult.isAnomaly) {
      if (latestResult.reconstructionError > this.threshold * 1.5) {
        severity = 'critical';
      } else {
        severity = 'warning';
      }
    }

    return {
      isAnomaly: latestResult.isAnomaly,
      severity: severity,
      reconstructionError: latestResult.reconstructionError,
      confidence: latestResult.confidence,
      threshold: this.threshold,
      timestamp: new Date().toISOString(),
      featureErrors: latestResult.featureErrors
    };
  }
}

module.exports = AnomalyDetectionModel;