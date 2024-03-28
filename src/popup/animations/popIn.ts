import { createAnimation } from '@ionic/vue';
import type { IonAnimationBuilder } from '@/types';
import { PAGE_TRANSITION_DURATION } from '@/constants';

export const popInAnimation: IonAnimationBuilder = (
  baseEl: Element,
  opts: { enteringEl: Element; leavingEl: Element },
) => {
  const enteringAnimation = createAnimation()
    .addElement(opts.enteringEl)
    .fromTo('opacity', 0, 1)
    .fromTo('transform', 'translateY(70%)', 'translateY(0px)')
    .duration(PAGE_TRANSITION_DURATION);

  const leavingAnimation = createAnimation()
    .addElement(opts.leavingEl)
    .addElement(document.querySelector('#header') as HTMLElement)
    .fromTo('opacity', 1, 0)
    .beforeStyles({ filter: 'blur(5px)' })
    .afterClearStyles(['filter'])
    .duration(PAGE_TRANSITION_DURATION);

  const animation = createAnimation()
    .addAnimation(enteringAnimation)
    .addAnimation(leavingAnimation);

  return animation;
};
