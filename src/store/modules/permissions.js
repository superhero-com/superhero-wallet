import Vue from 'vue';
import { getState } from '../plugins/persistState';
import { LIMIT_KEY } from '../../popup/utils/constants';
import { aettosToAe } from '../../popup/utils/helper';

export const setLimitLeft = async (limitLeft, firstAskedOn) =>
  browser.storage.local.set({
    [LIMIT_KEY]: { limitLeft, firstAskedOn },
  });

export const getLimitLeft = async () => (await browser.storage.local.get(LIMIT_KEY))[LIMIT_KEY];

export const checkPermissions = async (method, params = {}) => {
  const permissionsMethods = {
    'connection.open': 'address',
    'address.subscribe': 'address',
    'message.sign': 'messageSign',
    'transaction.sign': 'transactionSignLimit',
  };

  const { permissions } = await getState();
  const value = permissions?.[permissionsMethods[method]];

  if (typeof value !== 'number') return value;

  const { amount = 0, fee = 0, nameFee = 0 } = params;
  let { limitLeft = value, firstAskedOn = new Date().toJSON() } = (await getLimitLeft()) || {};

  if (new Date() - new Date(firstAskedOn) >= 24 * 60 * 60 * 1000) {
    firstAskedOn = new Date().toJSON();
    limitLeft = value;
  }
  limitLeft -= aettosToAe(amount + fee + nameFee);
  if (limitLeft < 0) limitLeft = 0;
  await setLimitLeft(limitLeft, firstAskedOn);

  return limitLeft === 0;
};

export default {
  namespaced: true,

  state: {
    address: true,
    messageSign: true,
    transactionSignLimit: 0,
  },

  mutations: {
    setPermissionValue(state, { name, value }) {
      Vue.set(state, name, value);
    },
  },
};
