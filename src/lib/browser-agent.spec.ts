import test from 'ava';
import { GLASS_ONION_LAYER, routeGlassOnion } from './glass-onion-layer';

test('authenticated browser command and policy are locked', t => {
  t.is(GLASS_ONION_LAYER.browserCommand, '/glass browse');
  t.true(GLASS_ONION_LAYER.invariants.authenticatedBrowserLocalProfileOnly);
  t.false(GLASS_ONION_LAYER.invariants.browserCredentialExport);
  t.false(GLASS_ONION_LAYER.invariants.browserRawCookieExport);
  t.false(GLASS_ONION_LAYER.invariants.browserPasswordExtraction);
  t.true(GLASS_ONION_LAYER.invariants.browserConsequentialActionsRequireHumanApproval);
});

test('authenticated browser routes local read browsing with provenance', t => {
  const route = routeGlassOnion({
    objective: 'Read an authenticated dashboard through the local managed Chrome profile',
    capability: 'AUTHENTICATED_BROWSER',
    targets: ['xunia', 'zyra', 'va3lm'],
    provenance: ['local-managed-chrome-profile'],
  });

  t.is(route.decision, 'ALLOW');
  t.true(route.pipeline.includes('CHROME_SESSION_REUSE'));
  t.true(route.pipeline.includes('AUTHENTICATED_PAGE_READ'));
  t.true(route.pipeline.includes('ZYRA_ACTION_GATE'));
});

test('authenticated browser requires provenance', t => {
  const route = routeGlassOnion({
    objective: 'Read an authenticated page',
    capability: 'AUTHENTICATED_BROWSER',
    targets: ['xunia', 'zyra'],
  });

  t.is(route.decision, 'REVIEW');
  t.true(route.reasons.includes('PROVENANCE_REQUIRED_FOR_INTELLIGENCE_PROMOTION'));
});
