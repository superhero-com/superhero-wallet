import { fadeAnimation } from '@/popup/animations';

describe('fadeAnimation', () => {
  it('crossfades both route elements for the same duration without moving them', () => {
    const enteringEl = document.createElement('div');
    const leavingEl = document.createElement('div');

    const animation = fadeAnimation(document.createElement('div'), { enteringEl, leavingEl });
    const [entering, leaving] = animation.childAnimations;

    expect(animation.childAnimations).toHaveLength(2);
    expect(entering.elements).toEqual([enteringEl]);
    expect(leaving.elements).toEqual([leavingEl]);
    expect([entering.getDuration(), leaving.getDuration()]).toEqual([100, 100]);
    expect(entering.getKeyframes()).toEqual([
      { offset: 0, opacity: 0 },
      { offset: 1, opacity: 1 },
    ]);
    expect(leaving.getKeyframes()).toEqual([
      { offset: 0, opacity: 1 },
      { offset: 1, opacity: 0 },
    ]);
  });

  it.each(['enteringEl', 'leavingEl'])('handles an absent route element when only %s is provided', (key) => {
    const element = document.createElement('div');
    const animation = fadeAnimation(document.createElement('div'), { [key]: element });

    expect(animation.childAnimations).toHaveLength(1);
    expect(animation.childAnimations[0].elements).toEqual([element]);
    expect(animation.childAnimations[0].getDuration()).toBe(100);
  });

  it('handles an empty outlet without adding element animations', () => {
    const animation = fadeAnimation(document.createElement('div'), {});

    expect(animation.childAnimations).toHaveLength(0);
  });
});
