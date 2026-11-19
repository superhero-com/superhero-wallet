import en from '@/popup/locales/en-US.json';
import zh from '@/popup/locales/zh-CN.json';

/** Each text by its path, e.g. `warnings.approveAll` */
function flatten(messages: object, prefix = ''): [string, string][] {
  return Object.entries(messages).flatMap(([key, value]) => (typeof value === 'object'
    ? flatten(value, `${prefix}${key}.`)
    : [[`${prefix}${key}`, value]]));
}

const placeholders = (text: string) => (text.match(/\{\w+\}/g) ?? []).sort();

describe('the texts of the EVM call summary', () => {
  it('are translated to Chinese, with the same placeholders', () => {
    const translations = Object.fromEntries(flatten(zh.modals.evmCallSummary));

    flatten(en.modals.evmCallSummary).forEach(([path, text]) => {
      expect(translations[path], path).toBeTypeOf('string');
      expect(placeholders(translations[path]), path).toEqual(placeholders(text));
    });
    expect(Object.keys(translations)).toHaveLength(flatten(en.modals.evmCallSummary).length);
  });
});
