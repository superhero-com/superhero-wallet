import { IInputMessage } from '@/types';
import { tg } from '@/popup/plugins/i18n';

// TODO: in the future we might rely on the error codes instead
// "//" symbol is a chosen splitter
const splitter = '//';
const WARNING_RULES_WORDING = [
  tg('validation.addressNotSameAs', [splitter]),
  tg('validation.maxValueVault', [splitter]),
];

export function getMessageByFieldName(errorField?: string): IInputMessage {
  if (!errorField) {
    return { status: 'success' };
  }
  if (WARNING_RULES_WORDING.some((rule) => {
    const splittedRule = rule.split(splitter);
    return errorField.startsWith(splittedRule[0]) && errorField.endsWith(splittedRule[1]);
  })) {
    return { status: 'warning', text: errorField };
  }
  return { status: 'error', text: errorField };
}
