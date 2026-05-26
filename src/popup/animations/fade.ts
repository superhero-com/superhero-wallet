import { createAnimation } from '@ionic/vue';
import type { IonAnimationBuilder } from '@/types';

const ANIMATION_DURATION = 100;

export const fadeAnimation: IonAnimationBuilder = (
  baseEl: Element,
  opts: { enteringEl?: Element; leavingEl?: Element },
) => {
  const animation = createAnimation();

  if (opts.enteringEl) {
    const enteringAnimation = createAnimation()
      .addElement(opts.enteringEl)
      .fromTo('opacity', 0, 1)
      .duration(ANIMATION_DURATION);

    animation.addAnimation(enteringAnimation);
  }

  if (opts.leavingEl) {
    const leavingAnimation = createAnimation()
      .addElement(opts.leavingEl)
      .fromTo('opacity', 1, 0);

    animation.addAnimation(leavingAnimation);
  }

  return animation;
};
