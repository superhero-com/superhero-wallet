import { encodeParameters } from 'web3-eth-abi';
import {
  hexToBytes,
  isHexStrict,
  keccak256,
  utf8ToBytes,
} from 'web3-utils';

interface ITypedDataField {
  name: string;
  type: string;
}

export interface ITypedData {
  types: Record<string, ITypedDataField[]>;
  primaryType: string;
  domain: Record<string, unknown>;
  message: Record<string, unknown>;
}

type Types = ITypedData['types'];

const ZERO_HASH = `0x${'0'.repeat(64)}`;

function findTypeDependencies(type: string, types: Types, found = new Set<string>()) {
  const [baseType] = type.match(/^\w*/)!;
  if (found.has(baseType) || !types[baseType]) return found;
  found.add(baseType);
  types[baseType].forEach((field) => findTypeDependencies(field.type, types, found));
  return found;
}

function encodeType(primaryType: string, types: Types): string {
  if (!types[primaryType]) throw new Error(`No type definition specified: ${primaryType}`);
  const dependencies = findTypeDependencies(primaryType, types);
  dependencies.delete(primaryType);
  return [primaryType, ...[...dependencies].sort()]
    .map((type) => `${type}(${types[type].map((field) => `${field.type} ${field.name}`).join(',')})`)
    .join('');
}

/** By the types of one `hashTypedData` call, so each type is hashed once, not per struct */
const typeHashes = new WeakMap<Types, Map<string, string>>();

function hashType(type: string, types: Types): string {
  if (!typeHashes.has(types)) typeHashes.set(types, new Map());
  const hashes = typeHashes.get(types)!;
  if (!hashes.has(type)) hashes.set(type, keccak256(utf8ToBytes(encodeType(type, types))));
  return hashes.get(type)!;
}

/** `keccak256` would read a text that looks like hex as bytes, so text is encoded here. */
function hashDynamic(value: unknown, isText: boolean): string {
  if (typeof value !== 'string') throw new Error(`Expected a string, got ${JSON.stringify(value)}`);
  return keccak256(isText ? utf8ToBytes(value) : hexToBytes(value));
}

/**
 * Where MetaMask coerces a value (e.g. `"false"` to `true`) this throws instead,
 * so that what gets signed is always what the user was shown.
 */
function encodeField(types: Types, name: string, type: string, value: unknown): [string, unknown] {
  if (types[type]) {
    // eslint-disable-next-line no-use-before-define
    return ['bytes32', value == null ? ZERO_HASH : hashStruct(type, value, types)];
  }
  if (value === undefined) throw new Error(`Missing value for field ${name} of type ${type}`);
  if (type.endsWith(']')) {
    const itemType = type.slice(0, type.lastIndexOf('['));
    const length = type.slice(type.lastIndexOf('[') + 1, -1);
    if (!Array.isArray(value) || (length && value.length !== Number(length))) {
      throw new Error(`Expected ${type} for field ${name}`);
    }
    const items = value.map((item) => encodeField(types, name, itemType, item));
    return ['bytes32', keccak256(encodeParameters(items.map(([t]) => t), items.map(([, v]) => v)))];
  }
  if (type === 'string') return ['bytes32', hashDynamic(value ?? '', true)];
  if (type === 'bytes') return ['bytes32', hashDynamic(value, !isHexStrict(value as string))];
  // `encodeParameters` pads "0x1" to 0x10…, not to the 0x01 the user reads
  if (/^bytes\d+$/.test(type) && !(typeof value === 'string' && /^0x([\da-f]{2})*$/i.test(value))) {
    throw new Error(`Expected whole bytes in hex for field ${name}`);
  }
  if (type === 'bool' && typeof value !== 'boolean') {
    throw new Error(`Expected a boolean for field ${name}`);
  }
  // A mixed-case address with a wrong checksum is still accepted, as in MetaMask.
  if (type === 'address' && typeof value === 'string') return [type, value.toLowerCase()];
  return [type, value];
}

function encodeData(type: string, data: unknown, types: Types): string {
  const typeHash = hashType(type, types);
  if (!data || typeof data !== 'object') throw new Error(`Expected an object for ${type}`);
  const fields = types[type].map((field) => (
    encodeField(types, field.name, field.type, (data as Record<string, unknown>)[field.name])
  ));
  return encodeParameters(
    ['bytes32', ...fields.map(([t]) => t)],
    [typeHash, ...fields.map(([, v]) => v)],
  );
}

function hashStruct(type: string, data: unknown, types: Types): string {
  return keccak256(encodeData(type, data, types));
}

function withDomainType(types: Types): Types {
  return { EIP712Domain: [], ...types };
}

/** The value without the fields its type doesn't declare */
function pickDeclared(type: string, value: unknown, types: Types): unknown {
  // A declared type wins over the array suffix, as in `encodeField`
  if (!types[type] && type.endsWith(']') && Array.isArray(value)) {
    const itemType = type.slice(0, type.lastIndexOf('['));
    return value.map((item) => pickDeclared(itemType, item, types));
  }
  if (!types[type] || !value || typeof value !== 'object') return value;
  return Object.fromEntries(types[type].map((field) => [
    field.name,
    pickDeclared(field.type, (value as Record<string, unknown>)[field.name], types),
  ]));
}

/** What `hashTypedData` signs, for the user to read: an undeclared field is not signed */
export function getSignedTypedData({
  types, primaryType, domain, message,
}: ITypedData) {
  const typesWithDomain = withDomainType(types);
  return {
    primaryType,
    domain: pickDeclared('EIP712Domain', domain, typesWithDomain),
    message: primaryType === 'EIP712Domain'
      ? undefined
      : pickDeclared(primaryType, message, typesWithDomain),
  };
}

/** The EIP-712 hash `eth_signTypedData_v4` signs, as `@metamask/eth-sig-util` V4 computes it. */
export function hashTypedData({
  types, primaryType, domain, message,
}: ITypedData): string {
  const typesWithDomain = withDomainType(types);
  const parts = [hashStruct('EIP712Domain', domain, typesWithDomain)];
  if (primaryType !== 'EIP712Domain') {
    parts.push(hashStruct(primaryType, message, typesWithDomain));
  }
  return keccak256(`0x1901${parts.map((part) => part.slice(2)).join('')}`);
}
