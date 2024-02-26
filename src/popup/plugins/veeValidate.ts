import { defineRule } from 'vee-validate';
import { required } from '@vee-validate/rules';
import BigNumber from 'bignumber.js';
import { debounce } from 'lodash-es';
import { isAddressValid } from '@aeternity/aepp-sdk';
import { NameEntry } from '@aeternity/aepp-sdk/es/apis/node';
import {
  INetwork,
  NetworkType,
  ObjectValues,
  Protocol,
} from '@/types';
import {
  NETWORK_NAME_MAINNET,
  NETWORK_NAME_TESTNET,
  PROTOCOLS,
} from '@/constants';
import { isNotFoundError, isUrlValid } from '@/utils';
import { ProtocolAdapterFactory } from '@/lib/ProtocolAdapterFactory';
import { useBalances, useCurrencies, useAeSdk } from '@/composables';
import { tg } from '@/popup/plugins/i18n';
import { getAddressByNameEntry, isAensNameValid } from '@/protocols/aeternity/helpers';
import { AE_AENS_DOMAIN, AE_SYMBOL } from '@/protocols/aeternity/config';

defineRule(
  'required',
  (value: string) => required(value) || tg('validation.required'),
);

defineRule(
  'url',
  (value: string) => !value || isUrlValid(value) || tg('validation.url'),
);

defineRule(
  'account',
  (value: string) => isAddressValid(value) || isAensNameValid(value) || tg('validation.address'),
);

/**
 * `networkType` is required for the Bitcoin Address validation because same account has different
 * address on the mainnet and testnet.
 */
defineRule(
  'account_address',
  (value: string, [protocol, networkType]: [Protocol, NetworkType]) => (
    ProtocolAdapterFactory
      .getAdapter(protocol)
      .isAccountAddressValid(value, networkType)
    || tg('validation.addressGeneric', { protocol })
  ),
);

defineRule(
  'min_value',
  (value: string, [arg]: [number]) => (
    BigNumber(value).isGreaterThanOrEqualTo(arg)
    || tg('validation.minValue', [arg])
  ),
);

defineRule(
  'min_value_exclusive',
  (value: string, [arg]: [number]) => (
    (value && BigNumber(value).isGreaterThan(arg))
    || tg('validation.minValueExclusive', [arg])
  ),
);

defineRule(
  'max_value',
  (value: string, [arg]: [number]) => (
    (value && BigNumber(value).isLessThanOrEqualTo(arg))
    || tg('validation.maxValue', [arg])
  ),
);

defineRule(
  'max_redeem',
  (value: string, [arg]: [number]) => (
    (value && BigNumber(value).isLessThanOrEqualTo(arg))
    || tg('validation.maxRedeem', [arg])
  ),
);

defineRule(
  'max_value_vault',
  (value: string, [arg]: [number]) => (
    BigNumber(value).isLessThanOrEqualTo(arg)
    || tg('validation.maxValueVault', [arg])
  ),
);

defineRule(
  'max_len',
  (value: string, [arg]: [number]) => (value && value.length <= arg) || tg('validation.maxLength', [arg]),
);

defineRule(
  'network_exists',
  (value: string, [customNetworks, savedNetworkName]: [INetwork[], string]) => {
    if (
      [NETWORK_NAME_MAINNET, NETWORK_NAME_TESTNET].includes(value)
      || (value !== savedNetworkName && customNetworks.find(({ name }) => name === value))
    ) {
      return tg('pages.network.error.networkExists');
    }
    return true;
  },
);

defineRule(
  'is_hex_format',
  (value: string) => (
    (
      value.toString().startsWith('0x')
      && value.length >= 3
      && parseInt(value.slice(2), 16).toString(16) === value.slice(2).toLowerCase()
    )
    || tg('validation.hexFormat')
  ),
);

export default () => {
  const { balance, updateBalances } = useBalances();
  const { currencyRates } = useCurrencies({ withoutPolling: true });
  const { getAeSdk } = useAeSdk();

  const NAME_STATES = {
    REGISTERED: Symbol('name state: registered'),
    REGISTERED_ADDRESS: Symbol('name state: registered and points to address'),
    UNREGISTERED: Symbol('name state: unregistered'),
    NOT_SAME: Symbol('name state: not same as provided'),
  };

  const checkNameDebounced = debounce(
    async (name, expectedNameState, comparedAddress, { resolve, reject }) => {
      try {
        const aeSdk = await getAeSdk();
        const nameEntry = (await aeSdk.api.getNameEntryByName(name)) as any as NameEntry;
        const address = getAddressByNameEntry(nameEntry);
        resolve(({
          [NAME_STATES.REGISTERED]: true,
          [NAME_STATES.REGISTERED_ADDRESS]: !!address,
          [NAME_STATES.UNREGISTERED]: false,
          [NAME_STATES.NOT_SAME]: comparedAddress !== address,
        }[expectedNameState]));
      } catch (error) {
        if (!isNotFoundError(error)) {
          reject(error);
        } else {
          resolve(
            expectedNameState === NAME_STATES.UNREGISTERED
            || expectedNameState === NAME_STATES.NOT_SAME,
          );
        }
      }
    },
    300,
    { leading: true },
  );

  let lastName: string;
  function checkName(expectedNameState: ObjectValues<typeof NAME_STATES>) {
    return (name: string, [comparedAddress]: string[]): Promise<boolean> => new Promise(
      (resolve, reject) => {
        if (name === lastName) {
          checkNameDebounced.flush();
        }
        lastName = name;
        checkNameDebounced(name, expectedNameState, comparedAddress, { resolve, reject });
      },
    );
  }

  const checkNameRegisteredAddress = async (value: string) => {
    try {
      return isAddressValid(value) || await checkName(NAME_STATES.REGISTERED_ADDRESS)(value, []);
    } catch (error) {
      return false;
    }
  };

  defineRule(
    'ae_min_tip_amount',
    (value: string) => {
      const aeMinTipAmount = 0.01 / (currencyRates.value?.[PROTOCOLS.aeternity].usd || 1);
      return BigNumber(value).isGreaterThan(aeMinTipAmount) || tg('pages.tipPage.minAmountError');
    },
  );

  defineRule(
    'aens_name',
    (value: string) => isAensNameValid(`${value}${AE_AENS_DOMAIN}`) || tg('validation.name'),
  );

  defineRule(
    'aens_name_unregistered',
    async (value: string) => (
      (await checkName(NAME_STATES.UNREGISTERED)(`${value}.chain`, []))
      || tg('validation.nameUnregistered')
    ),
  );

  defineRule(
    'aens_name_registered_or_address',
    async (value: string) => {
      const isValid = isAensNameValid(value)
        ? await checkNameRegisteredAddress(value)
        : isAddressValid(value);
      return isValid || tg('validation.nameRegisteredAddress');
    },
  );

  defineRule(
    'aens_name_registered_or_address_or_url',
    async (value: string) => {
      const isValid = isAensNameValid(value)
        ? await checkNameRegisteredAddress(value)
        : isAddressValid(value) || isUrlValid(value);
      return isValid || tg('validation.invalidAddressChainUrl');
    },
  );

  /**
   * AEX-9 tokens can be sent only to an address
   */
  defineRule(
    'token_to_an_address',
    (value: string, [isToken]: [boolean]) => (
      !isAensNameValid(value)
      || (isAensNameValid(value) && !isToken)
      || tg('validation.tokenToAnAddress')
    ),
  );

  defineRule(
    'address_not_same_as',
    (value: string, [comparedAddress, protocol]: [string, Protocol]) => (
      value !== comparedAddress
      || tg('validation.addressNotSameAs', [(protocol)
        ? ProtocolAdapterFactory.getAdapter(protocol).protocolSymbol
        : tg('common.tokens')])
    ),
  );

  defineRule(
    'enough_coin',
    async (value: string, [amount, coinSymbol]: [number, string]) => {
      await updateBalances(); // TODO add debounce to avoid firing to often
      return balance.value.isGreaterThanOrEqualTo(amount) || tg('validation.enoughCoin', [coinSymbol || AE_SYMBOL]);
    },
  );

  defineRule(
    'enough_ae_signer',
    async (value: string, [arg]: [number]) => {
      await updateBalances(); // TODO add debounce to avoid firing to often
      return balance.value.isGreaterThanOrEqualTo(arg) || tg('validation.enoughAeSigner');
    },
  );

  defineRule(
    'does_not_exceed_decimals',
    (value: string, [decimals]: [number]) => (
      !value
      || BigNumber(value).dp()! <= decimals
      || tg('validation.doesNotExceedDecimals', [decimals])
    ),
  );
};
