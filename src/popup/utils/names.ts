import { toASCII, toUnicode } from 'tr46';

const options = {
  checkJoiners: true,
  checkHyphens: true,
  checkBidi: true,
  useSTD3ASCIIRules: true,
  processingOption: 'nontransitional',
};

export const nameToPunycode = (name: string): string => toASCII(name, options);

export const punycodeToName = (name: string): string => name
  ? toUnicode(name, options)?.domain
  : name;
