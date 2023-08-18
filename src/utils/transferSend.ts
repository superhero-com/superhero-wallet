import { IInputMessage } from '@/types';
import { tg } from '@/store/plugins/languages';

// TOOD: in the future we might rely on the error codes instead
const noneAlphabeticCharsRegExp = /[^\p{L}]/gu;

const WARNING_RULES_WORDING = [
  tg('validation.notSameAs').replace(noneAlphabeticCharsRegExp, ''),
  tg('validation.maxValueVault').replace(noneAlphabeticCharsRegExp, ''),
];

export function getMessageByFieldName(errorField?: string): IInputMessage {
  if (!errorField) {
    return { status: 'success' };
  }
  if (errorField && WARNING_RULES_WORDING.includes(errorField.replace(noneAlphabeticCharsRegExp, ''))) {
    return { status: 'warning', text: errorField };
  }
  if (errorField) {
    return { status: 'error', text: errorField };
  }
  return { status: 'success' };
}