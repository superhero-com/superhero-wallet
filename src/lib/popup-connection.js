import stampit from '@stamp/it';
import { HDWALLET_METHODS } from '../popup/utils/constants';

export const PopupConnections = stampit({
  methods: {
    init() {
      this.popups = new Map();
    },
    addPopup(id, controller) {
      this.popups.set(id, PopupConnection({ id, controller }));
      return this.getPopup(id);
    },
    getPopup(id) {
      return this.popups.get(id);
    },
    addActions(id, actions) {
      const popup = this.getPopup(id);
      popup.actions = actions;
      this.popups.set(id, popup);
    },
    addConnection(id, port) {
      const popup = this.getPopup(id);
      popup.connection = port;
      popup.setMessageListener();
      this.popups.set(id, popup);
      popup.connection.onDisconnect.addListener(() => {
        this.removePopup(id);
      });
    },
    setAeppInfo(id, aepp) {
      const popup = this.getPopup(id);
      popup.aeppInfo = aepp;
      this.popups.set(id, popup);
    },
    removePopup(id) {
      this.popups.delete(id);
    },
  },
});

export const PopupConnection = stampit({
  init({ id, connection = {}, actions = {}, controller, aeppInfo = {} }) {
    this.id = id;
    this.connection = connection;
    this.actions = actions;
    this.controller = controller;
    this.aeppInfo = aeppInfo;
  },
  methods: {
    async messageHandler(msg) {
      const typeToAction = {
        ACTION_DENY: 'deny',
        ACTION_ACCEPT: 'accept',
      };

      if (HDWALLET_METHODS.includes(msg.type)) {
        this.postMessage({ uuid: msg.uuid, res: await this.controller[msg.type](msg.payload) });
      } else if (msg.type === 'POPUP_INFO') {
        this.postMessage({ uuid: msg.uuid, res: this.aeppInfo });
      } else if (typeToAction[msg.type]) {
        if (this.actions[typeToAction[msg.type]]) this.actions[typeToAction[msg.type]](msg.payload ? msg.payload : false);
        this.actions.resolve(typeToAction[msg.type] !== 'deny');
      }
    },
    setMessageListener() {
      this.connection.onMessage.addListener(this.messageHandler.bind(this));
    },
    postMessage(msg) {
      this.connection.postMessage(msg);
    },
  },
});
