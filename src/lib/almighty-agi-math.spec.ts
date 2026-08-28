import test from 'ava';

import { adaptiveAlternatingRefinement, ALMIGHTY_AGI_MATH, arctanSeries } from './almighty-agi-math';

test('arctan alternating series converges with a trace', (t) => {
  const result = arctanSeries(0.5, 1e-12, 1000);
  t.true(result.converged);
  t.true(Math.abs(result.estimate - Math.atan(0.5)) < 1e-10);
  t.true(result.trace.length > 1);
  t.is(ALMIGHTY_AGI_MATH.sourceConcept, 'GREGORY_MACLAURIN_ARCTAN_ALTERNATING_SERIES');
});

test('arctan series enforces its convergence domain', (t) => {
  t.throws(() => arctanSeries(1.1), { message: 'ALMIGHTY_AGI_ARCTAN_SERIES_DOMAIN' });
});

test('adaptive refinement is bounded and traceable', (t) => {
  const states = adaptiveAlternatingRefinement({
    initial: 0,
    maxIterations: 20,
    tolerance: 0.000001,
    evaluate: (value) => -Math.abs(3 - value),
    refine: (value, direction, iteration) => value + direction * (1 / iteration),
  });
  t.true(states.length <= 20);
  t.true(states.length > 0);
  t.true(states.every((state) => Number.isFinite(state.score)));
});
