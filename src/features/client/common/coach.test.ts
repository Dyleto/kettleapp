import { describe, expect, it } from 'vitest';
import { coachVoice } from './coach';

describe('coachVoice', () => {
  it('nomme le coach par son prénom quand il est seul', () => {
    expect(coachVoice([{ firstName: 'Julie' }])).toEqual({
      inline: 'Julie',
      opening: 'Julie',
    });
  });

  it('deux coachs : « ton coach », plutôt qu’en nommer un au hasard', () => {
    expect(coachVoice([{ firstName: 'Julie' }, { firstName: 'Marc' }])).toEqual(
      { inline: 'ton coach', opening: 'Ton coach' }
    );
  });

  it('sans prénom, ou sans coach : « ton coach »', () => {
    expect(coachVoice([{ firstName: '  ' }]).inline).toBe('ton coach');
    expect(coachVoice([]).opening).toBe('Ton coach');
    expect(coachVoice().inline).toBe('ton coach');
  });
});
