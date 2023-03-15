import { v4 as uuid } from 'uuid';

const popups = {};

export const getAeppUrl = (v) => new URL(v.connection.port.sender.url);

export const showPopup = async (aepp, type, params) => {
  const id = uuid();
  const { href, protocol, host } = typeof aepp === 'object' ? getAeppUrl(aepp) : new URL(aepp);
  const tabs = await browser.tabs.query({ active: true });
  tabs.forEach(({ url: tabURL, id: tabId }) => {
    const tabUrl = new URL(tabURL);
    if (
      tabUrl.searchParams.get('type') === 'connectConfirm'
      && decodeURIComponent(tabUrl.searchParams.get('url')) === href
    ) {
      browser.tabs.remove(tabId);
    }
  });

  const extUrl = browser.runtime.getURL('./index.html');
  const popupUrl = `${extUrl}?id=${id}&type=${type}&url=${encodeURIComponent(href)}`;
  const popupWindow = await browser.windows.create({
    url: popupUrl,
    type: 'popup',
    height: 600,
    width: 375,
  });

  return new Promise((resolve, reject) => {
    if (!popupWindow) reject();
    popups[id] = {
      actions: { resolve, reject },
      props: {
        app: {
          url: href,
          icons: aepp?.icons || [],
          name: aepp?.name || host,
          protocol,
          host,
        },
        ...(params?.message && { message: params.message }),
        ...(params?.txObject && { transaction: params.txObject }),
      },
    };
  });
};

export const removePopup = (id) => delete popups[id];

export const getPopup = (id) => popups[id];
