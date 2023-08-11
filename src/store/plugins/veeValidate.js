import { defineRule, configure } from 'vee-validate';
import { localize } from '@vee-validate/i18n';
import { required } from '@vee-validate/rules';
import BigNumber from 'bignumber.js';
import { debounce } from 'lodash-es';
import { Encoding, isAddressValid } from '@aeternity/aepp-sdk';
import { NETWORK_NAME_MAINNET, NETWORK_NAME_TESTNET } from '@/constants';
import { isNotFoundError, isUrlValid } from '@/utils';
import { useBalances, useCurrencies, useAeSdk } from '@/composables';
import { getAddressByNameEntry, isAensNameValid } from '@/protocols/aeternity/helpers';
import { AE_AENS_DOMAIN } from '@/protocols/aeternity/config';
import { tg } from './languages';

defineRule('url', (url) => isUrlValid(url));
defineRule('required', required);
defineRule('account', (value) => isAddressValid(value) || isAensNameValid(value));
defineRule('account_address', (value) => isAddressValid(value, Encoding.AccountAddress));
defineRule('name', (value) => isAensNameValid(`${value}${AE_AENS_DOMAIN}`));
defineRule('min_value', (value, [arg]) => BigNumber(value).isGreaterThanOrEqualTo(arg));
defineRule('min_value_exclusive', (value, [arg]) => value && BigNumber(value).isGreaterThan(arg));
defineRule('max_value', (value, [arg]) => value && BigNumber(value).isLessThanOrEqualTo(arg));
defineRule('max_value_vault', (value, [arg]) => BigNumber(value).isLessThanOrEqualTo(arg));
defineRule('max_len', (value, [maxLength]) => value && value.length <= maxLength);

configure({
  generateMessage: localize('en', {
    messages: {
      url: () => tg('validation.url'),
      required: () => tg('validation.required'),
      account: () => tg('validation.address'),
      account_address: () => tg('validation.invalidAddress'),
      name: () => tg('validation.name'),
      name_registered_address: () => tg('validation.nameRegisteredAddress'),
      name_unregistered: () => tg('validation.nameUnregistered'),
      not_same_as: () => tg('validation.notSameAs'),
      token_to_an_address: () => tg('validation.tokenToAnAddress'),
      min_value: ({ rule }) => tg('validation.minValue', [rule.params[0]]),
      min_value_exclusive: ({ rule }) => tg('validation.minValueExclusive', [rule.params[0]]),
      max_value: ({ rule }) => tg('validation.maxValue', [rule.params[0]]),
      max_value_vault: ({ rule }) => tg('validation.maxValueVault', [rule.params[0]]),
      max_len: ({ rule }) => tg('validation.maxLength', [rule.params[0]]),
      enough_ae: () => tg('validation.enoughAe'),
      enough_ae_signer: () => tg('validation.enoughAeSigner'),
      not_token: () => tg('validation.notToken'),
      name_registered_address_or_url: () => tg('validation.invalidAddressChainUrl'),
      min_tip_amount: () => tg('pages.tipPage.minAmountError'),
      invalid_hostname: () => tg('pages.network.error.invalidHostname'),
      network_name: () => tg('pages.network.error.enterName'),
      network_exists: () => tg('pages.network.error.networkExists'),
    },
  }),
});

export default (store) => {
  const { balance, updateBalances } = useBalances({ store });
  const { minTipAmount } = useCurrencies({ store, withoutPolling: true });
  const { getAeSdk } = useAeSdk({ store });

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
        const nameEntry = await aeSdk.api.getNameEntryByName(name);
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

  let lastName;
  const checkName = (expectedNameState) => (name, [comparedAddress]) => new Promise(
    (resolve, reject) => {
      if (name === lastName) checkNameDebounced.flush();
      lastName = name;
      checkNameDebounced(name, expectedNameState, comparedAddress, { resolve, reject });
    },
  );

  const checkNameRegisteredAddress = async (value) => {
    try {
      return isAddressValid(value) || await checkName(NAME_STATES.REGISTERED_ADDRESS)(
        value, [],
      );
    } catch (error) {
      return false;
    }
  };

  defineRule('min_tip_amount', (value) => BigNumber(value).isGreaterThan(minTipAmount.value));

  defineRule('name_unregistered', (value) => checkName(NAME_STATES.UNREGISTERED)(`${value}.chain`, []));

  defineRule('name_registered_address', (value) => (isAensNameValid(value)
    ? checkNameRegisteredAddress(value)
    : isAddressValid(value)));

  defineRule('token_to_an_address',
    (value, [isToken]) => (
      !isAensNameValid(value)
      || (isAensNameValid(value) && !isToken)
    ),
    { params: ['isToken'] });

  defineRule('not_same_as', (nameOrAddress, [comparedAddress]) => {
    if (!isAensNameValid(nameOrAddress)) return nameOrAddress !== comparedAddress;
    return checkName(NAME_STATES.NOT_SAME)(nameOrAddress, [comparedAddress]);
  });

  defineRule('enough_ae', async (_, [arg]) => {
    await updateBalances();
    return balance.value.isGreaterThanOrEqualTo(arg);
  });

  defineRule('enough_ae_signer', async (_, [arg]) => {
    await updateBalances();
    return balance.value.isGreaterThanOrEqualTo(arg);
  });

  defineRule('name_registered_address_or_url', (value) => (isAensNameValid(value)
    ? checkNameRegisteredAddress(value)
    : isAddressValid(value) || isUrlValid(value)));

  defineRule('invalid_hostname', (value) => {
    if (!value) {
      return true;
    }
    try {
      const _url = new URL(value);
      return !!_url.hostname;
    } catch (error) {
      return false;
    }
  });

  defineRule('network_name', (value) => ({
    valid: !!value,
    data: {
      required: true,
    },
  }), {
    computesRequired: true,
  });

  defineRule('network_exists', (name, customNetworks) => {
    const networkWithSameName = customNetworks[name];
    return (
      ![NETWORK_NAME_MAINNET, NETWORK_NAME_TESTNET].includes(name)
      && (
        !networkWithSameName
        || (index !== undefined && networkWithSameName?.index === index)
      )
    );
  });
};
