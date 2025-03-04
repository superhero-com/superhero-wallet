import { IInputMessage } from '@/types';
import { tg } from '@/popup/plugins/i18n';

// TODO: in the future we might rely on the error codes instead
// "//" symbol is a chosen splitter
const splitter = '//';
// Some new validations also return further information on the error
// message that have to be ignored. These come after the "||"
const arraySplitter = '||';
const WARNING_RULES_WORDING = [
  tg('validation.addressNotSameAs', [splitter]),
  tg('validation.maxValueVault', [splitter]),
];

export function getMessageByFieldName(errorField?: string): IInputMessage {
  if (!errorField) {
    return { status: 'success' };
  }
  if (WARNING_RULES_WORDING.some((rule) => {
    const splittedRule = rule.split(arraySplitter)[0].split(splitter);
    const splittedErrorField = errorField?.split(arraySplitter)[0];
    return splittedErrorField.startsWith(splittedRule[0])
    && splittedErrorField.endsWith(splittedRule[1]);
  })) {
    return { status: 'warning', text: errorField };
  }
  return { status: 'error', text: errorField };
}
