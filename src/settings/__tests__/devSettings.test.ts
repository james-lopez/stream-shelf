import { settingsFromQuery } from '../devSettings';

it('reads source, latency and failure rate from the query string', () => {
  expect(settingsFromQuery('?source=fixtures&latency=1500&fail=0.25')).toEqual({
    source: 'fixtures',
    latencyMs: 1500,
    failureRate: 0.25,
  });
});

it('ignores missing and out-of-range values', () => {
  expect(settingsFromQuery('')).toEqual({});
  expect(settingsFromQuery('?source=cloud&latency=-5&fail=3')).toEqual({});
});
