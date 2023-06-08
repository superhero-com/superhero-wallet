import { ref } from 'vue';
import { Clipboard } from '@capacitor/clipboard';
import { handleUnknownError } from '@/utils';

function fallbackCopyTextToClipboard(text: string) {
  const textarea = document.createElement('textarea');
  textarea.value = text;

  // Avoid scrolling to bottom
  textarea.style.top = '0';
  textarea.style.left = '0';
  textarea.style.position = 'fixed';

  document.body.appendChild(textarea);
  textarea.focus();

  if (navigator.userAgent.match(/ipad|ipod|iphone/i)) {
    textarea.contentEditable = 'true';
    textarea.readOnly = true;

    const range = document.createRange();

    range.selectNodeContents(textarea);

    const selection = window.getSelection();
    if (selection) {
      selection.removeAllRanges();
      selection.addRange(range);
    }
    textarea.setSelectionRange(0, 999999);
  } else {
    textarea.select();
  }

  document.execCommand('copy');
  document.body.removeChild(textarea);
}

export interface UseCopyOptions {
  timeout?: number
}

export function useCopy({
  timeout = 1000,
}: UseCopyOptions = {}) {
  const copied = ref(false);

  /**
   * Copy text to device clipboard.
   */
  async function copy(text?: string) {
    if (text) {
      try {
        if (Clipboard) {
          Clipboard.write({ string: text });
        } else if (navigator.clipboard) {
          await navigator.clipboard.writeText(text);
        } else {
          fallbackCopyTextToClipboard(text);
        }

        copied.value = true;
        setTimeout(() => {
          copied.value = false;
        }, timeout);
      } catch (error) {
        handleUnknownError(error);
      }
    }
  }

  return {
    copied,
    copy,
  };
}
