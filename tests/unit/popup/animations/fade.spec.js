import { fadeAnimation } from '@/popup/animations';

const mockAnimations = [];

function mockCreateAnimation() {
  const animation = {
    addElement: jest.fn(() => animation),
    fromTo: jest.fn(() => animation),
    duration: jest.fn(() => animation),
    addAnimation: jest.fn(() => animation),
  };

  mockAnimations.push(animation);
  return animation;
}

jest.mock('@ionic/vue', () => ({
  createAnimation: jest.fn(mockCreateAnimation),
}));

describe('fadeAnimation', () => {
  beforeEach(() => {
    mockAnimations.length = 0;
  });

  it('animates both route elements when Ionic provides them', () => {
    const enteringEl = document.createElement('div');
    const leavingEl = document.createElement('div');

    const animation = fadeAnimation(document.createElement('div'), { enteringEl, leavingEl });

    expect(mockAnimations[1].addElement).toHaveBeenCalledWith(enteringEl);
    expect(mockAnimations[2].addElement).toHaveBeenCalledWith(leavingEl);
    expect(animation.addAnimation).toHaveBeenCalledTimes(2);
  });

  it('does not pass undefined elements to Ionic animations', () => {
    const enteringEl = document.createElement('div');

    const animation = fadeAnimation(document.createElement('div'), { enteringEl });

    expect(mockAnimations[1].addElement).toHaveBeenCalledWith(enteringEl);
    expect(mockAnimations.some(({ addElement }) => addElement.mock.calls.some(
      ([element]) => element === undefined,
    ))).toBe(false);
    expect(animation.addAnimation).toHaveBeenCalledTimes(1);
  });
});
