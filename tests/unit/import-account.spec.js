import { mount } from '@vue/test-utils';
import { i18n } from '../../src/store/plugins/languages';
import AccountImport from '../../src/popup/components/Modals/AccountImport.vue';

jest.mock('vuex', () => ({
  useStore: jest.fn(() => ({
    state: {},
    getters: {},
    commit: jest.fn(),
  })),
}));

jest.mock('vue-router', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
  })),
}));

describe('ImportAccount', () => { // TODO: rewrite test
  [
    {
      name: 'input empty',
      value: '',
    },
    {
      name: 'input one letter',
      value: 's',
    },
    {
      name: 'input 12 words',
      value: 'mystery mystery mystery mystery mystery mystery mystery mystery mystery mystery mystery mystery',
    },
    {
      name: 'input correct seed phrase of 12 words',
      value: 'media view gym mystery all fault truck target envelope kit drop fade',
      correct: true,
    },
    {
      name: 'input correct seed phrase of 18 words',
      value: 'lonely asset near deputy child echo biology talk receive pen alcohol habit myth retreat rebel grief twenty nothing',
      correct: true,
    },
    {
      name: 'input correct seed phrase of 24 words',
      value: 'draft cruise tenant ride extend rose urban mean sponsor quit friend indoor door mean toe donate journey minute annual rough give giggle motion zebra',
      correct: true,
    },
    {
      name: 'input correct phrase with spaces',
      value: 'media view gym mystery                 all fault truck target envelope kit drop fade',
      correct: true,
    },
  ].forEach((test) => it(test.name, async () => {
    const wrapper = mount(AccountImport, {
      global: {
        plugins: [i18n],
        mocks: {
          t: () => 'locale-specific-text',
          $t: () => 'locale-specific-text',
        },
      },
      props: {
        show: true,
        resolve: () => null,
        reject: () => null,
      },
    });

    if (test.value) {
      await wrapper.find('[data-cy=field-mnemonic] textarea').setValue(test.value);
      await wrapper.find('[data-cy=btn-import]').trigger('click');
      expect(wrapper.find('[data-cy=input-field-message]').exists()).toBe(!test.correct);
    } else {
      expect(wrapper.find('[data-cy=btn-import].disabled').exists()).toBeTruthy();
    }
  }));
});
