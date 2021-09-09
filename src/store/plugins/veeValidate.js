import Vue from 'vue';
import { Validator, install as VeeValidate } from 'vee-validate/dist/vee-validate.minimal.esm';
import { required } from 'vee-validate/dist/rules.esm';
import { debounce } from 'lodash-es';
import { Crypto } from '@aeternity/aepp-sdk';
import { i18n } from './languages';
import {
  isNotFoundError,
  getAddressByNameEntry,
  checkAensName,
} from '../../popup/utils/helper';

Vue.use(VeeValidate);

Validator.extend('required', required);

Validator.localize('en', {
  messages: {
    required: () => i18n.t('validation.required'),
    account: () => i18n.t('validation.address'),
    name_registered_address: () => i18n.t('validation.nameRegisteredAddress'),
    name_unregistered: () => i18n.t('validation.nameUnregistered'),
    not_same_as: () => i18n.t('validation.notSameAs'),
  },
});

export default (store) => {
  const NAME_STATES = {
    REGISTERED: Symbol('name state: registered'),
    REGISTERED_ADDRESS: Symbol('name state: registered and points to address'),
    UNREGISTERED: Symbol('name state: unregistered'),
    NOT_SAME: Symbol('name state: not same as provided'),
  };

  const checkNameDebounced = debounce(
    async (name, expectedNameState, comparedAddress, { resolve, reject }) => {
      try {
        const nameEntry = await store.state.sdk.api.getNameEntryByName(name);
        const address = getAddressByNameEntry(nameEntry);
        resolve(({
          [NAME_STATES.REGISTERED]: true,
          [NAME_STATES.REGISTERED_ADDRESS]: !!address,
          [NAME_STATES.UNREGISTERED]: false,
          [NAME_STATES.NOT_SAME]: comparedAddress !== address,
        }[expectedNameState]));
      } catch (error) {
        if (!isNotFoundError(error)) reject(error);
        else {
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

  const checkNameRegisteredAddress = (value) => checkName(NAME_STATES.REGISTERED_ADDRESS)(
    value, [],
  );

  Validator.extend('name_unregistered', checkName(NAME_STATES.UNREGISTERED));
  Validator.extend('name_registered_address', (value) => Crypto.isAddressValid(value) || checkNameRegisteredAddress(value));
  Validator.extend('not_same_as', (nameOrAddress, [comparedAddress]) => {
    if (!checkAensName(nameOrAddress)) return nameOrAddress !== comparedAddress;
    return checkName(NAME_STATES.NOT_SAME)(nameOrAddress, [comparedAddress]);
  });
  Validator.extend('account', (value) => Crypto.isAddressValid(value) || checkAensName(value));
};
