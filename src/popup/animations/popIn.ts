import { PAGE_TRANSITION_DURATION } from '@/constants';
import { createAnimation } from '@ionic/vue';

export const popInAnimation = (_: Element, opts: { enteringEl: Element, leavingEl: Element }) => {
  const enteringAnimation = createAnimation()
    .addElement(opts.enteringEl)
    .fromTo('opacity', 0, 1)
    .fromTo('transform', 'translateY(70%)', 'translateY(0px)')
    .duration(PAGE_TRANSITION_DURATION);

  const leavingAnimation = createAnimation()
    .addElement(opts.leavingEl)
    .fromTo('opacity', 1, 0)
    .duration(PAGE_TRANSITION_DURATION);

  const animation = createAnimation()
    .addAnimation(enteringAnimation)
    .addAnimation(leavingAnimation);

  return animation;
};
