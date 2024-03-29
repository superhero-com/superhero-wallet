import JsonBig from '@aeternity/json-bigint';
import BigNumber from 'bignumber.js';

const jsonBig = JsonBig({ storeAsString: true });

const convertValuesToBigNumbers = (value) => {
  if (typeof value === 'object' && value !== null && value.constructor === Object) {
    return Object.fromEntries(Object.entries(value)
      .map(([key, _value]) => [key, convertValuesToBigNumbers(_value)])
      .map(([k, v]) => [k, v]));
  }
  if (Array.isArray(value)) {
    return value.map((item) => convertValuesToBigNumbers(item));
  }
  if (typeof value === 'string' && BigNumber(value).toString(10) === value) {
    const bn = BigNumber(value);
    bn.toJSON = () => bn.toString(10);
    return bn;
  }
  return value.toString();
};

export default {
  stringify: (object, ...args) => jsonBig.stringify(convertValuesToBigNumbers(object), ...args),
  parse: jsonBig.parse,
};
