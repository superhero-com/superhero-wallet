import { defineRule, configure } from 'vee-validate';
import { localize } from '@vee-validate/i18n';
import { required } from '@vee-validate/rules';
import BigNumber from 'bignumber.js';
import { debounce } from 'lodash-es';
import { Encoding, isAddressValid } from '@aeternity/aepp-sdk-13';
import { i18n } from './languages';
import {
  isNotFoundError,
  getAddressByNameEntry,
  checkAensName,
  validateTipUrl,
  isValidURL,
} from '../../popup/utils';
import { AENS_DOMAIN } from '../../popup/utils/constants';
import { useBalances, useCurrencies, useSdk13 } from '../../composables';

defineRule('url', (url) => isValidURL(url));
defineRule('required', required);
defineRule('account', (value) => Crypto.isAddressValid(value) || checkAensName(value));
defineRule('account_address', (value) => Crypto.isAddressValid(value, Encoding.AccountAddress));
defineRule('name', (value) => checkAensName(`${value}${AENS_DOMAIN}`));
defineRule('min_value', (value, [arg]) => BigNumber(value).isGreaterThanOrEqualTo(arg));
defineRule('min_value_exclusive', (value, [arg]) => value && BigNumber(value).isGreaterThan(arg));
defineRule('max_value', (value, [arg]) => value && BigNumber(value).isLessThanOrEqualTo(arg));
defineRule('max_value_vault', (value, [arg]) => BigNumber(value).isLessThanOrEqualTo(arg));
defineRule('max_len', (value, [maxLength]) => value && value.length <= maxLength);

configure({
  generateMessage: localize('en', {
    messages: {
      url: () => i18n.global.t('validation.url'),
      required: () => i18n.global.t('validation.required'),
      account: () => i18n.global.t('validation.address'),
      account_address: () => i18n.global.t('validation.invalidAddress'),
      name: () => i18n.global.t('validation.name'),
      name_registered_address: () => i18n.global.t('validation.nameRegisteredAddress'),
      name_unregistered: () => i18n.global.t('validation.nameUnregistered'),
      not_same_as: () => i18n.global.t('validation.notSameAs'),
      token_to_an_address: () => i18n.global.t('validation.tokenToAnAddress'),
      min_value: ({ rule }) => i18n.global.t('validation.minValue', [rule.params[0]]),
      min_value_exclusive: ({ rule }) => i18n.global.t('validation.minValueExclusive', [rule.params[0]]),
      max_value: ({ rule }) => i18n.global.t('validation.maxValue', [rule.params[0]]),
      max_value_vault: ({ rule }) => i18n.global.t('validation.maxValueVault', [rule.params[0]]),
      max_len: ({ rule }) => i18n.global.t('validation.maxLength', [rule.params[0]]),
      enough_ae: () => i18n.global.t('validation.enoughAe'),
      enough_ae_signer: () => i18n.global.t('validation.enoughAeSigner'),
      not_token: () => i18n.global.t('validation.notToken'),
      name_registered_address_or_url: () => i18n.global.t('validation.invalidAddressChainUrl'),
      min_tip_amount: () => i18n.global.t('pages.tipPage.minAmountError'),
      invalid_hostname: () => i18n.global.t('pages.network.error.invalidHostname'),
      network_name: () => i18n.global.t('pages.network.error.enterName'),
      network_exists: () => i18n.global.t('pages.network.error.networkExists'),
    },
  }),
});

export default (store) => {
  const { balance, updateBalances } = useBalances({ store });
  const { minTipAmount } = useCurrencies({ withoutPolling: true });
  const { getSdk } = useSdk13({ store });

  const NAME_STATES = {
    REGISTERED: Symbol('name state: registered'),
    REGISTERED_ADDRESS: Symbol('name state: registered and points to address'),
    UNREGISTERED: Symbol('name state: unregistered'),
    NOT_SAME: Symbol('name state: not same as provided'),
  };

  const checkNameDebounced = debounce(
    async (name, expectedNameState, comparedAddress, { resolve, reject }) => {
      try {
        const sdk = await getSdk();
        const nameEntry = await sdk.api.getNameEntryByName(name);
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

  defineRule('name_registered_address', (value) => (checkAensName(value)
    ? checkNameRegisteredAddress(value)
    : isAddressValid(value)));

  defineRule('token_to_an_address',
    (value, [isToken]) => (
      !checkAensName(value)
      || (checkAensName(value) && !isToken)
    ),
    { params: ['isToken'] });

  defineRule('not_same_as', (nameOrAddress, [comparedAddress]) => {
    if (!checkAensName(nameOrAddress)) return nameOrAddress !== comparedAddress;
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

  defineRule('name_registered_address_or_url', (value) => (checkAensName(value)
    ? checkNameRegisteredAddress(value)
    : isAddressValid(value) || validateTipUrl(value)));

  defineRule('invalid_hostname', (value) => {
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

  defineRule('network_exists', (name, [index, networks]) => {
    const networkWithSameName = networks[name];
    return (
      !networkWithSameName
      || (index !== undefined && networkWithSameName?.index === index)
    );
  });
};
