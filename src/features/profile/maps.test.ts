import { describe, expect, it } from 'vitest';
import { mapDirectionsUrl, mapEmbedUrl, mapQuery } from './maps';

describe('maps', () => {
  it('composes a query from address + city + country, skipping blanks', () => {
    expect(mapQuery({ address: 'Stephansplatz 1', city: 'Vienna', country: 'Austria' })).toBe(
      'Stephansplatz 1, Vienna, Austria',
    );
    expect(mapQuery({ address: '   ', city: 'Vienna', country: '' })).toBe('Vienna');
    expect(mapQuery({})).toBe('');
  });

  it('builds a keyless "open in maps" link', () => {
    expect(mapDirectionsUrl('Vienna, Austria')).toBe(
      'https://www.google.com/maps/search/?api=1&query=Vienna%2C%20Austria',
    );
  });

  it('returns no embed url when no Maps key is configured', () => {
    expect(mapEmbedUrl('Vienna')).toBeNull();
  });
});
