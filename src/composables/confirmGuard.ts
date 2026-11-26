import { onBeforeUnmount, onMounted, ref } from 'vue';
import { IS_EXTENSION, IS_SIDE_PANEL, RUNNING_IN_POPUP } from '@/constants';

/** Longer than a double click. */
export const CONFIRM_GUARD_DELAY = 500;

/** A new approval can appear under a click meant for the dapp. */
export function useConfirmGuard(isEnabled = IS_SIDE_PANEL || (IS_EXTENSION && RUNNING_IN_POPUP)) {
  const isConfirmBlocked = ref(isEnabled);
  let timeout: ReturnType<typeof setTimeout> | undefined;

  /** Clicks keep it blocked: a dapp may ask for many, to have one land on the approval */
  function unblockLater() {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      window.removeEventListener('pointerdown', unblockLater, true);
      isConfirmBlocked.value = false;
    }, CONFIRM_GUARD_DELAY);
  }

  onMounted(() => {
    if (isEnabled) {
      window.addEventListener('pointerdown', unblockLater, true);
      unblockLater();
    }
  });

  onBeforeUnmount(() => {
    clearTimeout(timeout);
    window.removeEventListener('pointerdown', unblockLater, true);
  });

  return { isConfirmBlocked };
}
