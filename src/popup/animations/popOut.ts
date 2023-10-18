import { PAGE_TRANSITION_DURATION } from '@/constants';
import { createAnimation } from '@ionic/vue';

export const popOutAnimation = (_: Element, opts: { enteringEl: Element, leavingEl: Element }) => {
  const enteringAnimation = createAnimation()
    .addElement(opts.enteringEl)
    .fromTo('opacity', 0, 1)
    .duration(PAGE_TRANSITION_DURATION);

  const leavingAnimation = createAnimation()
    .addElement(opts.leavingEl)
    .fromTo('opacity', 1, 0)
    .fromTo('transform', 'translateY(0)', 'translateY(70%)')
    .duration(PAGE_TRANSITION_DURATION);

  const animation = createAnimation()
    .addAnimation(enteringAnimation)
    .addAnimation(leavingAnimation);

  return animation;
};
