import { onBeforeUnmount, onMounted, ref } from 'vue';
import { IS_EXTENSION, IS_SIDE_PANEL, RUNNING_IN_POPUP } from '@/constants';

/** Longer than a double click. */
export const CONFIRM_GUARD_DELAY = 500;

/** A new approval can appear under a click meant for the dapp. */
export function useConfirmGuard(isEnabled = IS_SIDE_PANEL || (IS_EXTENSION && RUNNING_IN_POPUP)) {
  const isConfirmBlocked = ref(isEnabled);
  let timeout: ReturnType<typeof setTimeout> | undefined;

  onMounted(() => {
    if (isEnabled) {
      timeout = setTimeout(() => { isConfirmBlocked.value = false; }, CONFIRM_GUARD_DELAY);
    }
  });

  onBeforeUnmount(() => clearTimeout(timeout));

  return { isConfirmBlocked };
}
