/* eslint no-param-reassign: ["error", { "ignorePropertyModificationsFor": ["state"] }] */
export default {
  switchNetwork(state, payload) {
    state.current.network = payload;
  },
  setUserNetwork(state, { index, ...network }) {
    if (index !== undefined) {
      state.userNetworks[index] = network;
    } else {
      state.userNetworks.push(network);
    }
  },
  deleteUserNetwork(state, index) {
    state.userNetworks = state.userNetworks.filter((el, idx) => idx !== index);
  },
  setNodeStatus(state, payload) {
    state.nodeStatus = payload;
  },
  setNotificationSettings(state, payload) {
    state.notificationSettings = payload;
  },
  toggleNotificationSetting(state, type) {
    const index = state.notificationSettings.findIndex((n) => n.type === type);
    state.notificationSettings[index].checked = !state.notificationSettings[index].checked;
  },
  setChainNames(state, payload) {
    state.chainNames = payload;
  },
  setMnemonic(state, payload) {
    state.mnemonic = payload;
  },
  setBackedUpSeed(state) {
    state.backedUpSeed = true;
  },
  setSaveErrorLog(state, saveErrorLog) {
    state.saveErrorLog = saveErrorLog;
  },
  setLoginTargetLocation(state, location) {
    state.loginTargetLocation = location;
  },
  setQrScanner(state, payload) {
    state.qrScannerOpen = payload;
  },
  hideCard(state, name) {
    state.hiddenCards.push(name);
  },
};
