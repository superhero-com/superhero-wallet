/* eslint no-param-reassign: ["error", { "ignorePropertyModificationsFor": ["state"] }] */
export default {
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
};
