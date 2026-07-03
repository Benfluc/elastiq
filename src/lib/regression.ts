// Ordinary Least Squares regression, in-browser.
// Solves β = (XᵀX)⁻¹ Xᵀy via Gauss-Jordan elimination on the augmented matrix.

export type RegressionResult = {
  coefficients: number[]; // [intercept, β1, β2, ...]
  featureNames: string[]; // names aligned with β1..βk (no intercept)
  rSquared: number;
  n: number;
  k: number;
  yMean: number;
  useLogLog: boolean;
  // For log-log we store on the log scale; predictions must convert.
};

function invert(matrix: number[][]): number[][] {
  const n = matrix.length;
  const a = matrix.map((row, i) => [
    ...row,
    ...Array.from({ length: n }, (_, j) => (i === j ? 1 : 0)),
  ]);
  for (let i = 0; i < n; i++) {
    let pivot = a[i][i];
    let swap = i;
    for (let r = i + 1; r < n; r++) {
      if (Math.abs(a[r][i]) > Math.abs(pivot)) {
        pivot = a[r][i];
        swap = r;
      }
    }
    if (Math.abs(pivot) < 1e-12) throw new Error("Matriz singular — colunas colineares ou dados insuficientes.");
    if (swap !== i) [a[i], a[swap]] = [a[swap], a[i]];
    const p = a[i][i];
    for (let j = 0; j < 2 * n; j++) a[i][j] /= p;
    for (let r = 0; r < n; r++) {
      if (r === i) continue;
      const factor = a[r][i];
      if (factor === 0) continue;
      for (let j = 0; j < 2 * n; j++) a[r][j] -= factor * a[i][j];
    }
  }
  return a.map((row) => row.slice(n));
}

export function fitOLS(params: {
  X: number[][]; // n x k (no intercept column)
  y: number[];
  featureNames: string[];
  useLogLog: boolean;
}): RegressionResult {
  const { X, y, featureNames, useLogLog } = params;
  const n = y.length;
  const k = featureNames.length;
  if (n < k + 2) throw new Error(`Poucas observações (${n}) para ${k} variáveis. Envie mais dados.`);

  // Add intercept column
  const Xi = X.map((row) => [1, ...row]);
  const kk = k + 1;

  // XᵀX
  const XtX: number[][] = Array.from({ length: kk }, () => Array(kk).fill(0));
  const Xty: number[] = Array(kk).fill(0);
  for (let i = 0; i < n; i++) {
    for (let a = 0; a < kk; a++) {
      Xty[a] += Xi[i][a] * y[i];
      for (let b = 0; b < kk; b++) XtX[a][b] += Xi[i][a] * Xi[i][b];
    }
  }
  const inv = invert(XtX);
  const beta = Array(kk).fill(0);
  for (let a = 0; a < kk; a++) {
    let s = 0;
    for (let b = 0; b < kk; b++) s += inv[a][b] * Xty[b];
    beta[a] = s;
  }

  // R²
  const yMean = y.reduce((s, v) => s + v, 0) / n;
  let ssRes = 0;
  let ssTot = 0;
  for (let i = 0; i < n; i++) {
    let yhat = beta[0];
    for (let j = 0; j < k; j++) yhat += beta[j + 1] * X[i][j];
    ssRes += (y[i] - yhat) ** 2;
    ssTot += (y[i] - yMean) ** 2;
  }
  const rSquared = ssTot > 0 ? 1 - ssRes / ssTot : 0;

  return {
    coefficients: beta,
    featureNames,
    rSquared,
    n,
    k,
    yMean,
    useLogLog,
  };
}

// Predict on original scale. If log-log, features/target were logs → exp() output.
export function predict(model: RegressionResult, featureValues: number[]): number {
  let yhat = model.coefficients[0];
  const xs = model.useLogLog
    ? featureValues.map((v) => (v > 0 ? Math.log(v) : Number.NaN))
    : featureValues;
  for (let j = 0; j < model.k; j++) yhat += model.coefficients[j + 1] * xs[j];
  return model.useLogLog ? Math.exp(yhat) : yhat;
}
