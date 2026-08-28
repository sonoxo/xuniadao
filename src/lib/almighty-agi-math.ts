export interface AlternatingSeriesStep {
  readonly iteration: number;
  readonly term: number;
  readonly estimate: number;
  readonly absoluteTerm: number;
  readonly converged: boolean;
}

export interface AlternatingSeriesResult {
  readonly input: number;
  readonly estimate: number;
  readonly iterations: number;
  readonly finalAbsoluteTerm: number;
  readonly converged: boolean;
  readonly trace: readonly AlternatingSeriesStep[];
}

export interface AdaptiveRefinementState<T> {
  readonly iteration: number;
  readonly value: T;
  readonly score: number;
  readonly correction: number;
  readonly converged: boolean;
}

export interface AdaptiveRefinementOptions<T> {
  readonly initial: T;
  readonly maxIterations: number;
  readonly tolerance: number;
  readonly evaluate: (value: T) => number;
  readonly refine: (value: T, direction: 1 | -1, iteration: number) => T;
}

/**
 * Gregory/Maclaurin alternating series for arctan(x):
 * arctan(x) = x - x^3/3 + x^5/5 - ...
 *
 * For |x| <= 1, the magnitude of the next omitted term bounds the truncation
 * error of the alternating series. This implementation exposes the full trace
 * so higher-level agents can learn from convergence behavior instead of only
 * receiving the final scalar.
 */
export const arctanSeries = (
  input: number,
  tolerance = 1e-10,
  maxIterations = 100000,
): AlternatingSeriesResult => {
  if (!Number.isFinite(input)) throw new Error('ALMIGHTY_AGI_ARCTAN_INPUT_REQUIRED');
  if (Math.abs(input) > 1) throw new Error('ALMIGHTY_AGI_ARCTAN_SERIES_DOMAIN');
  if (!(tolerance > 0) || !Number.isFinite(tolerance)) throw new Error('ALMIGHTY_AGI_TOLERANCE_INVALID');
  if (!Number.isInteger(maxIterations) || maxIterations < 1) throw new Error('ALMIGHTY_AGI_ITERATION_LIMIT_INVALID');

  let estimate = 0;
  const trace: AlternatingSeriesStep[] = [];

  for (let n = 0; n < maxIterations; n += 1) {
    const denominator = 2 * n + 1;
    const sign = n % 2 === 0 ? 1 : -1;
    const term = sign * Math.pow(input, denominator) / denominator;
    estimate += term;
    const absoluteTerm = Math.abs(term);
    const converged = absoluteTerm <= tolerance;
    trace.push({ iteration: n + 1, term, estimate, absoluteTerm, converged });
    if (converged) {
      return {
        input,
        estimate,
        iterations: n + 1,
        finalAbsoluteTerm: absoluteTerm,
        converged: true,
        trace,
      };
    }
  }

  const finalAbsoluteTerm = trace.length === 0 ? Number.POSITIVE_INFINITY : trace[trace.length - 1].absoluteTerm;
  return {
    input,
    estimate,
    iterations: trace.length,
    finalAbsoluteTerm,
    converged: false,
    trace,
  };
};

/**
 * Generalizes the alternating-correction idea into a bounded optimization loop.
 * The direction flips when the score fails to improve, preventing one-way drift
 * and forcing explicit convergence against a tolerance and iteration budget.
 */
export const adaptiveAlternatingRefinement = <T>(options: AdaptiveRefinementOptions<T>): readonly AdaptiveRefinementState<T>[] => {
  if (!Number.isInteger(options.maxIterations) || options.maxIterations < 1) throw new Error('ALMIGHTY_AGI_ITERATION_LIMIT_INVALID');
  if (!(options.tolerance > 0) || !Number.isFinite(options.tolerance)) throw new Error('ALMIGHTY_AGI_TOLERANCE_INVALID');

  const states: AdaptiveRefinementState<T>[] = [];
  let current = options.initial;
  let currentScore = options.evaluate(current);
  if (!Number.isFinite(currentScore)) throw new Error('ALMIGHTY_AGI_SCORE_INVALID');
  let direction: 1 | -1 = 1;

  for (let iteration = 1; iteration <= options.maxIterations; iteration += 1) {
    const candidate = options.refine(current, direction, iteration);
    const candidateScore = options.evaluate(candidate);
    if (!Number.isFinite(candidateScore)) throw new Error('ALMIGHTY_AGI_SCORE_INVALID');
    const correction = candidateScore - currentScore;
    const improved = candidateScore > currentScore;

    if (improved) {
      current = candidate;
      currentScore = candidateScore;
    } else {
      direction = direction === 1 ? -1 : 1;
    }

    const converged = Math.abs(correction) <= options.tolerance;
    states.push({
      iteration,
      value: current,
      score: currentScore,
      correction,
      converged,
    });
    if (converged) break;
  }

  return states;
};

export const ALMIGHTY_AGI_MATH = {
  id: 'ALMIGHTY-AGI-MATH',
  version: '0.1.0',
  sourceConcept: 'GREGORY_MACLAURIN_ARCTAN_ALTERNATING_SERIES',
  principles: [
    'BOUNDED_ITERATION',
    'ALTERNATING_CORRECTION',
    'CONVERGENCE_TOLERANCE',
    'ERROR_SIGNAL',
    'TRACEABLE_REFINEMENT',
    'NO_UNBOUNDED_SELF_MODIFICATION',
  ] as const,
} as const;
