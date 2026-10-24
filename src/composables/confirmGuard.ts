import { onBeforeUnmount, onMounted, ref } from 'vue';
import { IS_SIDE_PANEL } from '@/constants';

/** Longer than a double click. */
export const CONFIRM_GUARD_DELAY = 500;

/**
 * The side panel shows a dapp's request next to the website, the moment it arrives,
 * so a dapp can time it to appear under the cursor. Keeps the confirmation blocked
 * for a moment, so that a click meant for the website can't confirm it.
 * Popup windows open elsewhere and are not blocked.
 */
export function useConfirmGuard(isEnabled = IS_SIDE_PANEL) {
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
