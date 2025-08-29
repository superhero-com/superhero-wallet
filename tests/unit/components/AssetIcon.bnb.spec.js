import { mount } from '@vue/test-utils';
import AssetIcon from '../../../src/popup/components/AssetIcon.vue';
import { ICON_SIZES, PROTOCOLS } from '../../../src/constants';

describe('AssetIcon - BNB icon rendering', () => {
  it('renders BNB icon by contractId (svg rendered, no img placeholder)', () => {
    const wrapper = mount(AssetIcon, {
      props: {
        asset: {
          name: 'BNB',
          symbol: 'BNB',
          contractId: 'bnb',
          protocol: PROTOCOLS.bnb,
        },
        iconSize: ICON_SIZES.md,
      },
    });
    expect(wrapper.find('img.asset-icon').exists()).toBe(false);
    expect(wrapper.find('svg').exists()).toBe(true);
  });

  it('falls back to coin icon when no contractId using protocol default coin', () => {
    const wrapper = mount(AssetIcon, {
      props: {
        asset: {
          name: 'BNB',
          symbol: 'BNB',
          protocol: PROTOCOLS.bnb,
        },
        iconSize: ICON_SIZES.md,
      },
    });
    expect(wrapper.find('img.asset-icon').exists()).toBe(false);
    expect(wrapper.find('svg').exists()).toBe(true);
  });
});
