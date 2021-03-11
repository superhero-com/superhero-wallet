import stampit from '@stamp/it';
import { HDWALLET_METHODS } from '../popup/utils/constants';
import walletController from './wallet-controller';

const PopupConnection = stampit({
  init({ id, connection = {}, actions = {}, props = {} }) {
    this.id = id;
    this.connection = connection;
    this.actions = actions;
    this.props = props;
  },
  methods: {
    async messageHandler(msg) {
      const typeToAction = {
        ACTION_DENY: 'deny',
        ACTION_ACCEPT: 'accept',
      };

      if (HDWALLET_METHODS.includes(msg.type)) {
        this.postMessage({ uuid: msg.uuid, res: await walletController[msg.type](msg.payload) });
      } else if (msg.type === 'POPUP_INFO') {
        this.postMessage({ uuid: msg.uuid, res: this.props });
      } else if (typeToAction[msg.type]) {
        if (this.actions[typeToAction[msg.type]])
          this.actions[typeToAction[msg.type]](msg.payload || false);
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

export default stampit({
  init() {
    this.popups = new Map();
  },
  methods: {
    addPopup(id) {
      this.popups.set(id, PopupConnection({ id }));
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
    setProps(id, aepp) {
      const popup = this.getPopup(id);
      popup.props = aepp;
      this.popups.set(id, popup);
    },
    removePopup(id) {
      this.popups.delete(id);
    },
  },
})();
