import { IInputMessage } from '@/types';
import { tg } from '@/popup/plugins/i18n';
import { BTC_SYMBOL } from '@/protocols/bitcoin/config';

// TOOD: in the future we might rely on the error codes instead
const nonAlphabeticCharsRegExp = /[^\p{L}]/gu;

const WARNING_RULES_WORDING = [
  tg('validation.notSameAs').replace(nonAlphabeticCharsRegExp, ''),
  tg('validation.maxValueVault').replace(nonAlphabeticCharsRegExp, ''),
];

export function getMessageByFieldName(errorField?: string): IInputMessage {
  if (!errorField) {
    return { status: 'success' };
  }
  if (WARNING_RULES_WORDING.includes(
    errorField.replace(nonAlphabeticCharsRegExp, '')
      .replace(BTC_SYMBOL, '')
      .replace(tg('common.tokens'), ''),
  )) {
    return { status: 'warning', text: errorField };
  }
  return { status: 'error', text: errorField };
}
