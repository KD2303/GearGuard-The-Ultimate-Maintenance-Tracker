/**
 * Multivariate Gaussian Anomaly Detection Service
 * 
 * This service implements a pure JavaScript Multivariate Normal Distribution algorithm.
 * It tracks the Mean vector (μ) and Covariance Matrix (Σ) of incoming telemetry streams
 * using an Exponential Moving Average (EMA) to dynamically adapt to normal equipment behavior.
 */

// A small constant added to the diagonal of the covariance matrix to ensure it remains positive-definite
const EPSILON = 1e-4;
const EMA_ALPHA = 0.05; // Learning rate for the model

class MLAnomalyService {
  constructor() {
    // Stores the model state per equipment: { mu: number[], cov: number[][] }
    this.models = new Map();
  }

  /**
   * Evaluates a new telemetry vector for an equipment.
   * Updates the ML model parameters and returns the anomaly probability.
   * 
   * @param {string} equipmentId - The ID of the equipment
   * @param {number[]} x - The feature vector e.g., [temperature, vibration]
   * @returns {number} probability - The probability density p(x)
   */
  evaluateTelemetry(equipmentId, x) {
    const k = x.length;
    
    if (!this.models.has(equipmentId)) {
      // Initialize the model with the first data point
      const initialCov = Array.from({ length: k }, (_, i) => 
        Array.from({ length: k }, (_, j) => (i === j ? 1.0 : 0.0)) // Identity matrix
      );
      this.models.set(equipmentId, { mu: [...x], cov: initialCov });
      return 1.0; // Assume first point is normal
    }

    const model = this.models.get(equipmentId);
    const { mu, cov } = model;

    // 1. Calculate the anomaly probability using the CURRENT model
    const probability = this._multivariateGaussianPDF(x, mu, cov);

    // 2. Update the model (Learn from this new data point)
    // We only update if the data point isn't extremely anomalous to avoid poisoning the model
    // but for simplicity and dynamic adaptation in this simulation, we'll softly update.
    if (probability > 1e-10) {
      this._updateModel(model, x, k);
    }

    return probability;
  }

  /**
   * Recursively calculates the determinant of a matrix (using Laplace expansion)
   */
  _determinant(m) {
    const n = m.length;
    if (n === 1) return m[0][0];
    if (n === 2) return m[0][0] * m[1][1] - m[0][1] * m[1][0];
    
    let det = 0;
    for (let i = 0; i < n; i++) {
      const subMatrix = m.slice(1).map(row => row.filter((_, j) => j !== i));
      det += (i % 2 === 0 ? 1 : -1) * m[0][i] * this._determinant(subMatrix);
    }
    return det;
  }

  /**
   * Calculates the inverse of a matrix using the adjugate matrix method
   */
  _invertMatrix(m) {
    const n = m.length;
    const det = this._determinant(m);
    
    if (Math.abs(det) < 1e-10) {
      // Matrix is singular or nearly singular, return pseudo-identity
      return Array.from({ length: n }, (_, i) => 
        Array.from({ length: n }, (_, j) => (i === j ? 1.0 : 0.0))
      );
    }

    if (n === 1) return [[1 / m[0][0]]];

    const inv = Array.from({ length: n }, () => new Array(n).fill(0));
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        const subMatrix = m.filter((_, rowIdx) => rowIdx !== i).map(row => row.filter((_, colIdx) => colIdx !== j));
        inv[j][i] = ((i + j) % 2 === 0 ? 1 : -1) * this._determinant(subMatrix) / det;
      }
    }
    return inv;
  }

  /**
   * Evaluates the Multivariate Normal PDF
   * p(x) = (2π)^(-k/2) * |Σ|^(-1/2) * exp(-1/2 * (x - μ)^T * Σ^-1 * (x - μ))
   */
  _multivariateGaussianPDF(x, mu, cov) {
    const k = x.length;
    
    // Add epsilon to diagonal to prevent singular matrix
    const stableCov = cov.map((row, i) => 
      row.map((val, j) => i === j ? val + EPSILON : val)
    );

    const det = this._determinant(stableCov);
    
    if (det <= 0) return 0; // Invalid covariance matrix state

    const invCov = this._invertMatrix(stableCov);

    // Vector difference (x - μ)
    const diff = x.map((val, i) => val - mu[i]);

    // Compute (x - μ)^T * Σ^-1 * (x - μ)
    let mahalanobisSq = 0;
    for (let i = 0; i < k; i++) {
      let rowSum = 0;
      for (let j = 0; j < k; j++) {
        rowSum += diff[j] * invCov[j][i];
      }
      mahalanobisSq += rowSum * diff[i];
    }

    // Compute PDF
    const coefficient = 1 / (Math.pow(2 * Math.PI, k / 2) * Math.sqrt(det));
    const exponent = Math.exp(-0.5 * mahalanobisSq);

    return coefficient * exponent;
  }

  /**
   * Updates the Mean vector and Covariance matrix using Exponential Moving Average
   */
  _updateModel(model, x, k) {
    const prevMu = [...model.mu];

    // Update Mean: μ_new = (1 - α) * μ_old + α * x
    for (let i = 0; i < k; i++) {
      model.mu[i] = (1 - EMA_ALPHA) * prevMu[i] + EMA_ALPHA * x[i];
    }

    // Update Covariance: Σ_new = (1 - α) * Σ_old + α * (x - μ_new) * (x - μ_new)^T
    for (let i = 0; i < k; i++) {
      for (let j = 0; j < k; j++) {
        const diffI = x[i] - model.mu[i];
        const diffJ = x[j] - model.mu[j];
        model.cov[i][j] = (1 - EMA_ALPHA) * model.cov[i][j] + EMA_ALPHA * (diffI * diffJ);
      }
    }
  }

  /**
   * Forces the model to use specific parameters (Useful for overriding in simulators)
   */
  forceModel(equipmentId, mu, cov) {
    this.models.set(equipmentId, { mu, cov });
  }
}

// Export as a singleton
module.exports = new MLAnomalyService();
