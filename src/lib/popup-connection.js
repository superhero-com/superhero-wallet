import stampit from '@stamp/it';
import { HDWALLET_METHODS } from '../popup/utils/constants';

export const PopupConnections = stampit({
  methods: {
        init() {
            this.popups = new Map()
        },
        addPopup(id, controller) {
      this.popups.set(id, PopupConnection({ id, controller }));
      return this.getPopup(id);
    },
        getPopup(id) {
            return this.popups.get(id)
        },
        addActions(id, actions) {
            const popup = this.getPopup(id)
            popup.actions = actions
            this.popups.set(id, popup)
        },
        addConnection(id, port) {
            const popup = this.getPopup(id)
            popup.connection = port
            popup.setMessageListener()
      popup.shareAeppInfo();
      this.popups.set(id, popup);
    },
        setAeppInfo(id, aepp) {
      const popup = this.getPopup(id);
      popup.aeppInfo = aepp;
      this.popups.set(id, popup);
    },
  },
});

export const PopupConnection = stampit({
    init({ id, connection = {}, actions = {}, controller, aeppInfo = {}}) {
    this.id = id;
    this.connection = connection;
    this.actions = actions;
    this.controller = controller;
    this.aeppInfo = aeppInfo;
  },
    methods: {
        messageHandler(msg) {
      console.log('incomming', msg);
      if (HDWALLET_METHODS.includes(msg.type)) {
                this.controller[msg.type](msg.payload).then((res) => {
                    this.postMessage({ uuid: msg.uuid, res })
                })
            } else if(msg.action && (msg.action == "deny" || msg.action == "accept")){
                this.actions[msg.action]()
            }
        },
        setMessageListener() {
            this.connection.onMessage.addListener(this.messageHandler.bind(this))
        },
        shareAeppInfo() {
            this.postMessage({...this.aeppInfo, type: "POPUP_INFO" })
        },
        postMessage(msg) {
            console.log("outgoing", msg)
            this.connection.postMessage(msg)
        }
    }

