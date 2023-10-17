import { openPopup, getPopup, removePopup } from '../../../src/background/popupHandler';
import {
  POPUP_TYPE_SIGN,
  POPUP_TYPE_RAW_SIGN,
  POPUP_TYPE_MESSAGE_SIGN,
} from '../../../src/constants';
import { STUB_TX_BASE_64 } from '../../../src/constants/stubs';
import { AE_DEX_URL } from '../../../src/protocols/aeternity/config';

const mockCreate = jest.fn(() => true);
const mockGetUrl = jest.fn((text) => text);

const testAeppUrl = 'http://test.com';

global.browser = {
  tabs: {
    query: () => [],
    remove: () => undefined,
  },
  windows: {
    create: mockCreate,
  },
  runtime: {
    getURL: mockGetUrl,
  },
};

/**
 * @property params - `IPopupProps` interface
 */
const testCases = [{
  name: 'supported transaction',
  params: {
    txBase64: STUB_TX_BASE_64,
    tx: {
      params: {
      },
    },
  },
  type: POPUP_TYPE_SIGN,
  resultType: POPUP_TYPE_SIGN,
  propsField: 'txBase64',
}, {
  name: 'supported transaction with a connected aepp',
  params: {
    txBase64: STUB_TX_BASE_64,
    tx: {
      params: {
      },
    },
  },
  type: POPUP_TYPE_SIGN,
  resultType: POPUP_TYPE_SIGN,
  propsField: 'tx',
  connectedAepp: {
    connection: {
      port: {
        sender: {
          url: AE_DEX_URL,
        },
      },
    },
  },
}, {
  name: 'unsupported transaction',
  // encoded gaAttachTx
  params: {
    txBase64: 'tx_+O1QAaEByqPFadmQk4sGtyDiquosAZyKJNmherKOhheVIEYTLCITuIv4iUYDoIMndi6iAoqQltixF/3A6WlN0+rWVAan4LvFLy2pEJlhwLhcuDv+RNZEHwA3ADcAGg6CPwEDP/5s8lcLADcCFwcXdwAIPAIE+wNNTm90IGluIEF1dGggY29udGV4dAEBAJsvAhFE1kQfEWluaXQRbPJXCyVhdXRob3JpemWCLwCFNy4xLjAAoGzyVwsKFZm3CCkeUKo9rxPQx/JIS8M33a0kE6N/1KAJgwcAA4ZIjzqPaAAATIQ7msoAhysRRNZEHz+4yEN3',
  },
  type: POPUP_TYPE_RAW_SIGN,
  resultType: POPUP_TYPE_RAW_SIGN,
  propsField: 'txBase64',
}, {
  name: 'message',
  params: {
    message: '4eae1b1a-0152-4e74-8af1-375ed1e9e75d-3ce9aff199e1aa9018e8cb4f2334eb717cf3799f6dff3f77279e98bf06b4183a-GET_CONSENT-1681222330475-2-0-0',
  },
  type: POPUP_TYPE_MESSAGE_SIGN,
  resultType: POPUP_TYPE_MESSAGE_SIGN,
  propsField: 'message',
}];

describe('popupHandler', () => {
  testCases.forEach(({
    name, params, type, resultType, propsField, connectedAepp = null,
  }, index) => it(
    `should be able to create, get, remove popup for signing a/an ${name}`,
    async () => {
      openPopup(type, connectedAepp ?? testAeppUrl, params);
      await new Promise((r) => setTimeout(r, 50));
      const call = mockCreate.mock.calls[index][0];
      const queryParams = Object.fromEntries(new URLSearchParams(call.url.split('?')[1]).entries());
      expect(queryParams.type).toEqual(resultType);
      expect(queryParams.url).toEqual(`${connectedAepp ? AE_DEX_URL : testAeppUrl}/`);
      expect(getPopup(queryParams.id).props[propsField]).toBeTruthy();
      removePopup(queryParams.id);
      expect(getPopup(queryParams.id)).toBeFalsy();
    },
  ));
});
