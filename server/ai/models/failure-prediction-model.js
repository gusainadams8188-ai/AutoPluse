const tf = require('@tensorflow/tfjs');
const { Matrix } = require('ml-matrix');

class FailurePredictionModel {
  constructor() {
    this.model = null;
    this.isTrained = false;
    this.inputShape = null;
    this.outputShape = null;
    this.scaler = null;
  }

  /**
   * Build LSTM model for time series failure prediction
   * @param {number} inputShape - Shape of input data
   * @param {number} outputShape - Shape of output predictions
   */
  buildModel(inputShape, outputShape) {
    this.inputShape = inputShape;
    this.outputShape = outputShape;

    const model = tf.sequential();

    // LSTM layers for sequence processing
    model.add(tf.layers.lstm({
      units: 128,
      inputShape: [null, inputShape],
      returnSequences: true,
      kernel_regularizer: tf.regularizers.l2({ l2: 0.01 })
    }));

    model.add(tf.layers.dropout({ rate: 0.2 }));

    model.add(tf.layers.lstm({
      units: 64,
      returnSequences: false,
      kernel_regularizer: tf.regularizers.l2({ l2: 0.01 })
    }));

    model.add(tf.layers.dropout({ rate: 0.2 }));

    // Dense layers for prediction
    model.add(tf.layers.dense({
      units: 32,
      activation: 'relu',
      kernel_regularizer: tf.regularizers.l2({ l2: 0.01 })
    }));

    model.add(tf.layers.dense({
      units: outputShape,
      activation: 'sigmoid' // For binary classification (failure/no failure)
    }));

    // Compile model
    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'binaryCrossentropy',
      metrics: ['accuracy', tf.metrics.precision, tf.metrics.recall]
    });

    this.model = model;
    console.log('Failure prediction model built successfully');
  }

  /**
   * Train the model with historical data
   * @param {Array} trainingData - Training sequences
   * @param {Array} labels - Training labels
   * @param {Object} options - Training options
   */
  async train(trainingData, labels, options = {}) {
    const {
      epochs = 50,
      batchSize = 32,
      validationSplit = 0.2,
      callbacks = []
    } = options;

    if (!this.model) {
      throw new Error('Model not built. Call buildModel() first.');
    }

    console.log('Starting model training...');
    console.log(`Training data shape: ${trainingData.length} sequences`);
    console.log(`Labels shape: ${labels.length}`);

    // Convert to tensors
    const xs = tf.tensor3d(trainingData);
    const ys = tf.tensor2d(labels);

    // Default callbacks
    const defaultCallbacks = [
      tf.callbacks.earlyStopping({
        monitor: 'val_loss',
        patience: 10,
        restoreBestWeights: true
      }),
      {
        onEpochEnd: (epoch, logs) => {
          if (epoch % 10 === 0) {
            console.log(`Epoch ${epoch}: loss = ${logs.loss.toFixed(4)}, accuracy = ${logs.acc.toFixed(4)}, val_loss = ${logs.val_loss?.toFixed(4) || 'N/A'}`);
          }
        }
      }
    ];

    const allCallbacks = [...defaultCallbacks, ...callbacks];

    // Train the model
    const history = await this.model.fit(xs, ys, {
      epochs,
      batchSize,
      validationSplit,
      callbacks: allCallbacks,
      shuffle: true
    });

    this.isTrained = true;
    console.log('Model training completed');

    // Clean up tensors
    xs.dispose();
    ys.dispose();

    return history;
  }

  /**
   * Make predictions on new data
   * @param {Array} inputData - Input sequences for prediction
   * @returns {Array} Prediction results
   */
  async predict(inputData) {
    if (!this.model || !this.isTrained) {
      throw new Error('Model not trained. Train the model first.');
    }

    const inputTensor = tf.tensor3d([inputData]);
    const predictions = this.model.predict(inputTensor);
    const results = await predictions.data();

    // Clean up
    inputTensor.dispose();
    predictions.dispose();

    return Array.from(results);
  }

  /**
   * Evaluate model performance
   * @param {Array} testData - Test sequences
   * @param {Array} testLabels - Test labels
   * @returns {Object} Evaluation metrics
   */
  async evaluate(testData, testLabels) {
    if (!this.model || !this.isTrained) {
      throw new Error('Model not trained. Cannot evaluate.');
    }

    const xs = tf.tensor3d(testData);
    const ys = tf.tensor2d(testLabels);

    const evaluation = await this.model.evaluate(xs, ys);
    const metrics = {
      loss: evaluation[0].dataSync()[0],
      accuracy: evaluation[1].dataSync()[0],
      precision: evaluation[2].dataSync()[0],
      recall: evaluation[3].dataSync()[0]
    };

    // Calculate additional metrics
    const predictions = this.model.predict(xs);
    const predData = await predictions.data();
    const trueData = ys.dataSync();

    metrics.f1Score = this.calculateF1Score(predData, trueData);
    metrics.confusionMatrix = this.calculateConfusionMatrix(predData, trueData);

    // Clean up
    xs.dispose();
    ys.dispose();
    predictions.dispose();

    return metrics;
  }

  /**
   * Calculate F1 score
   * @param {Array} predictions - Model predictions
   * @param {Array} actual - Actual labels
   * @returns {number} F1 score
   */
  calculateF1Score(predictions, actual) {
    const threshold = 0.5;
    const predBinary = predictions.map(p => p > threshold ? 1 : 0);

    let truePositives = 0, falsePositives = 0, falseNegatives = 0;

    for (let i = 0; i < predBinary.length; i++) {
      if (predBinary[i] === 1 && actual[i] === 1) truePositives++;
      else if (predBinary[i] === 1 && actual[i] === 0) falsePositives++;
      else if (predBinary[i] === 0 && actual[i] === 1) falseNegatives++;
    }

    const precision = truePositives / (truePositives + falsePositives) || 0;
    const recall = truePositives / (truePositives + falseNegatives) || 0;

    return 2 * (precision * recall) / (precision + recall) || 0;
  }

  /**
   * Calculate confusion matrix
   * @param {Array} predictions - Model predictions
   * @param {Array} actual - Actual labels
   * @returns {Array} Confusion matrix
   */
  calculateConfusionMatrix(predictions, actual) {
    const threshold = 0.5;
    const predBinary = predictions.map(p => p > threshold ? 1 : 0);

    let tp = 0, fp = 0, tn = 0, fn = 0;

    for (let i = 0; i < predBinary.length; i++) {
      if (predBinary[i] === 1 && actual[i] === 1) tp++;
      else if (predBinary[i] === 1 && actual[i] === 0) fp++;
      else if (predBinary[i] === 0 && actual[i] === 0) tn++;
      else if (predBinary[i] === 0 && actual[i] === 1) fn++;
    }

    return [
      [tp, fp],
      [fn, tn]
    ];
  }

  /**
   * Save model to file
   * @param {string} path - Path to save model
   */
  async saveModel(path = './models/failure-prediction') {
    if (!this.model) {
      throw new Error('No model to save');
    }

    await this.model.save(`file://${path}`);
    console.log(`Model saved to ${path}`);
  }

  /**
   * Load model from file
   * @param {string} path - Path to load model from
   */
  async loadModel(path = './models/failure-prediction') {
    try {
      this.model = await tf.loadLayersModel(`file://${path}/model.json`);
      this.isTrained = true;
      console.log(`Model loaded from ${path}`);
    } catch (error) {
      console.error('Error loading model:', error);
      throw error;
    }
  }

  /**
   * Get model summary
   * @returns {string} Model summary
   */
  getModelSummary() {
    if (!this.model) {
      return 'Model not built';
    }

    return this.model.summary();
  }

  /**
   * Reset model
   */
  reset() {
    if (this.model) {
      this.model.dispose();
    }
    this.model = null;
    this.isTrained = false;
    this.inputShape = null;
    this.outputShape = null;
  }

  /**
   * Get failure prediction for real-time data
   * @param {Array} sensorData - Recent sensor readings
   * @param {number} sequenceLength - Length of sequence to use
   * @returns {Object} Prediction results
   */
  async predictFailure(sensorData, sequenceLength = 20) {
    if (!this.isTrained) {
      throw new Error('Model not trained');
    }

    // Prepare sequence data
    const recentData = sensorData.slice(-sequenceLength);
    if (recentData.length < sequenceLength) {
      // Pad with zeros if not enough data
      const padding = new Array(sequenceLength - recentData.length).fill(0);
      recentData.unshift(...padding);
    }

    // Extract relevant features
    const features = recentData.map(point => [
      point.rpm || 0,
      point.speed || 0,
      point.coolant_temp || 0,
      point.engine_load || 0,
      point.fuel_pressure || 0,
      point.intake_manifold_pressure || 0
    ]);

    const prediction = await this.predict(features);

    // Calculate confidence and risk level
    const failureProbability = prediction[0];
    const confidence = Math.abs(failureProbability - 0.5) * 2; // 0-1 scale

    let riskLevel = 'low';
    if (failureProbability > 0.7) riskLevel = 'high';
    else if (failureProbability > 0.5) riskLevel = 'medium';

    return {
      failureProbability: failureProbability,
      confidence: confidence,
      riskLevel: riskLevel,
      prediction: failureProbability > 0.5,
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = FailurePredictionModel;