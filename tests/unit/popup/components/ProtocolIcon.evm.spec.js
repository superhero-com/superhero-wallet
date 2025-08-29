import { mount } from '@vue/test-utils';
import ProtocolIcon from '../../../../src/popup/components/ProtocolIcon.vue';
import { PROTOCOLS, ICON_SIZES } from '../../../../src/constants';

describe('ProtocolIcon - EVM modes', () => {
  it('single icon mode renders one icon for EVM protocol (ethereum)', () => {
    const wrapper = mount(ProtocolIcon, {
      props: {
        protocol: PROTOCOLS.ethereum,
        iconSize: ICON_SIZES.md,
        showSuperIcon: false,
      },
    });
    expect(wrapper.findAll('svg').length).toBe(1);
  });

  it('single icon mode renders one icon for EVM protocol (bnb)', () => {
    const wrapper = mount(ProtocolIcon, {
      props: {
        protocol: PROTOCOLS.bnb,
        iconSize: ICON_SIZES.md,
        showSuperIcon: false,
      },
    });
    expect(wrapper.findAll('svg').length).toBe(1);
  });

  it('super icon mode renders multiple EVM icons capped by maxVisibleIcons', () => {
    const wrapper = mount(ProtocolIcon, {
      props: {
        protocol: PROTOCOLS.ethereum,
        iconSize: ICON_SIZES.md,
        showSuperIcon: true,
        maxVisibleIcons: 1,
      },
    });
    expect(wrapper.findAll('.protocol-icon').length).toBeGreaterThanOrEqual(1);
    expect(wrapper.find('.evm-more-indicator').exists()).toBe(true);
  });
});
