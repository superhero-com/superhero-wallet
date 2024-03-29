import { createAnimation } from '@ionic/vue';
import type { IonAnimationBuilder } from '@/types';

const ANIMATION_DURATION = 100;

export const fadeAnimation: IonAnimationBuilder = (
  baseEl: Element,
  opts: { enteringEl: Element; leavingEl: Element },
) => {
  const enteringAnimation = createAnimation()
    .addElement(opts.enteringEl)
    .fromTo('opacity', 0, 1)
    .duration(ANIMATION_DURATION);

  const leavingAnimation = createAnimation()
    .addElement(opts.leavingEl)
    .fromTo('opacity', 1, 0);

  const animation = createAnimation()
    .addAnimation(enteringAnimation)
    .addAnimation(leavingAnimation);

  return animation;
};
