import { shallowMount } from '@vue/test-utils';
import Vuex from 'vuex';
import Vue from 'vue';
import AccountCard from '../../src/popup/router/components/AccountCard.vue';

Vue.use(Vuex);

const store = new Vuex.Store({
  state: {
    cardMinified: false,
  },
});

describe('Account card', () => {
  [{ idx: 0, className: 'account-card' }, { idx: 1, className: 'first-subaccount' }, { idx: 2, className: 'subaccount' }]
    .forEach(({ idx, className }) => it('should render account card with proper class', () => {
      const wrapper = shallowMount(AccountCard, {
        mocks: {
          $store: store,
        },
        propsData: {
          idx,
          color: '#1161FE',
          shift: 0,
        },
      });
      expect(wrapper.classes()).toContain(className);
    }));
});
