"use strict";(self["webpackChunksuperhero_wallet"]=self["webpackChunksuperhero_wallet"]||[]).push([[4551],{34620:(e,t,n)=>{n.d(t,{x:()=>h});var a=n(95383),r=n(70068),o=n(34916),s=(n(53921),n(27495),n(25440),n(42762),n(98992),n(72577),n(3949),n(81454),n(62953),n(3296),n(27208),n(48408),n(76918),n(28706),n(50113),n(51629),n(62062),n(15086),n(23288),n(62010),n(79432),n(26099),n(38781),n(47764),n(23500),n(14603),n(47566),n(98721),n(50953)),u=n(20641),i=n(48156),l=n(81268),c=n(93909),d=n(18743),v=n(96881),m=n(84560),f=n(53611),p=n(69264),A=n(96605),b=function(e,t,n,a){function r(e){return e instanceof n?e:new n((function(t){t(e)}))}return new(n||(n=Promise))((function(n,o){function s(e){try{i(a.next(e))}catch(t){o(t)}}function u(e){try{i(a["throw"](e))}catch(t){o(t)}}function i(e){e.done?n(e.value):r(e.value).then(s,u)}i((a=a.apply(e,t||[])).next())}))};function h(e){var t=e.transferData,n=e.getSelectedAssetValue,h=(0,s.KR)(t),g=(0,s.KR)(null),y=(0,s.KR)(null),S=(0,i.s9)(),x=S.t,k=(0,c.U)(),w=k.openDefaultModal,T=k.openScanQrModal,F=(0,l.mN)(),C=F.errors,E=F.validate,I=F.validateField,_=(0,p.t)(),O=_.saveTransferSendFormModel,M=(0,A.S)(),P=M.accountAssets,R=(0,u.EW)((function(){return["address","amount"].some((function(e){return"error"===(0,v.sY)(C.value[e]).status}))}));function B(){h.value.payload=""}function D(e){h.value.selectedAsset=e}function N(e,t){var n=e.account,a=e.amount,r=e.payload,o=e.token,s={},u=t?t(o,h.value.selectedAsset):null;return u&&(s.selectedAsset=u),n&&(s.address=n),a&&(s.amount=a),r&&(s.payload=r),s}function L(e){return b(this,void 0,void 0,(0,o.A)().mark((function t(){var a;return(0,o.A)().wrap((function(t){while(1)switch(t.prev=t.next){case 0:return a=N(e,n),h.value=Object.assign(Object.assign({},h.value),a),t.next=4,(0,u.dY)();case 4:Object.keys(a).forEach((function(e){return I(e)}));case 5:case"end":return t.stop()}}),t)})))}function W(){var e,t;return b(this,void 0,void 0,(0,o.A)().mark((function n(){var s,u,i;return(0,o.A)().wrap((function(n){while(1)switch(n.prev=n.next){case 0:return n.next=2,T({title:x("pages.send.scanAddress",{assetName:null===(e=h.value.selectedAsset)||void 0===e?void 0:e.name})}).then((function(e){return e}))["catch"]((function(e){return e instanceof f.yr&&O(h.value),null}));case 2:if(s=n.sent,"{"!==(null===s||void 0===s?void 0:s.trim().charAt(0))){n.next=29;break}u=null,n.prev=5,u=JSON.parse(s),n.next=15;break;case 9:return n.prev=9,n.t0=n["catch"](5),d.p8||m.A.write(n.t0),h.value.address=void 0,w({title:x("modals.invalid-qr-code.msg"),icon:"critical"}),n.abrupt("return");case 15:if(i=P.value.find((function(e){var t=e.contractId;return t===u.tokenContract})),i){n.next=20;break}return h.value.address=void 0,w({msg:x("modals.insufficient-balance.msg")}),n.abrupt("return");case 20:return h.value.selectedAsset=i,h.value.address=u.tokenContract,h.value.amount=(0,v.Y9)(u.amount,-((null===(t=h.value.selectedAsset)||void 0===t?void 0:t.decimals)||-0)).toString(),g.value=u.invoiceId,y.value=u.invoiceContract,n.next=27,E();case 27:n.next=33;break;case 29:if(s){n.next=31;break}return n.abrupt("return");case 31:L(Object.fromEntries((0,r.A)(new URL((0,v.Ks)(s)?s:"".concat(d.yS,"/account?account=").concat(s.replace("?","&"))).searchParams.entries()).map((function(e){var t=(0,a.A)(e,2),n=t[0],r=t[1];return[n,r]})))),g.value=null;case 33:h.value.address||(h.value.address=void 0);case 34:case"end":return n.stop()}}),n,null,[[5,9]])})))}return{formModel:h,errors:C,hasError:R,invoiceId:g,invoiceContract:y,scanTransferQrCode:W,clearPayload:B,handleAssetChange:D,validate:E,updateFormModelValues:L}}},71522:(e,t,n)=>{n.d(t,{A:()=>d});n(62010);var a=n(20641),r=n(90033);function o(e,t,n,o,s,u){var i=(0,a.g2)("Avatar"),l=(0,a.g2)("AddressFormatted");return(0,a.uX)(),(0,a.CE)("div",{class:(0,r.C4)(["avatar-with-chain-name",{"only-name":(n.name||!n.showAddress)&&!n.hideAvatar}])},[n.hideAvatar?(0,a.Q3)("",!0):((0,a.uX)(),(0,a.Wv)(i,(0,a.v6)({key:0},e.$attrs,{size:n.avatarSize,address:n.address}),null,16,["size","address"])),n.name||!n.showAddress?((0,a.uX)(),(0,a.CE)("div",{key:1,class:(0,r.C4)(["chain-name",{centered:n.hideAvatar}])},(0,r.v_)(n.name),3)):((0,a.uX)(),(0,a.Wv)(l,(0,a.v6)({key:2},e.$attrs,{address:n.address,columns:""}),null,16,["address"]))],2)}var s=n(93271),u=n(15059);const i={components:{AddressFormatted:u.A,Avatar:s.A},props:{address:{type:String,required:!0},name:{type:String,default:""},hideAvatar:Boolean,avatarSize:{type:String,default:"md"},showAddress:Boolean}};var l=n(66262);const c=(0,l.A)(i,[["render",o],["__scopeId","data-v-80ede450"]]),d=c},81282:(e,t,n)=>{n.d(t,{A:()=>h,g:()=>f});var a=n(20641),r=n(53751),o={class:"relative"};function s(e,t,n,s,u,i){var l=(0,a.g2)("BtnMain"),c=(0,a.g2)("Modal");return(0,a.uX)(),(0,a.Wv)(c,{class:"transfer-send-base","has-close-button":"","from-bottom":"","no-padding-bottom":e.currentStep===e.TRANSFER_SEND_STEPS.form,onClose:t[2]||(t[2]=function(t){return e.$emit("close")})},{footer:(0,a.k6)((function(){return[e.showEditButton?((0,a.uX)(),(0,a.Wv)(l,{key:0,variant:"muted",text:e.$t("common.edit"),class:"button-action-secondary","data-cy":"edit",onClick:t[0]||(t[0]=function(t){return e.$emit("step-prev")})},null,8,["text"])):(0,a.Q3)("",!0),(0,a.bF)(l,{class:"button-action-primary",disabled:!e.isOnline||e.sendingDisabled,icon:e.primaryButtonIcon,text:e.primaryButtonText,"data-cy":"next-step-button",onClick:t[1]||(t[1]=function(t){return e.$emit("step-next")})},null,8,["disabled","icon","text"])]})),default:(0,a.k6)((function(){return[(0,a.Lk)("div",o,[(0,a.bF)(r.eB,{name:"fade-between"},{default:(0,a.k6)((function(){return[(0,a.RG)(e.$slots,"content",{},void 0,!0)]})),_:3})])]})),_:3},8,["no-padding-bottom"])}n(74423),n(21699);var u=n(48156),i=n(18743),l=n(39918),c=n(80386),d=n(22781),v=n(82988),m=n(55312),f={resolve:{type:Function,default:function(){return null}},address:{type:String,default:void 0},amount:{type:String,default:""},payload:{type:String,default:""}};const p=(0,a.pM)({name:"TransferSendBase",components:{Modal:v.A,BtnMain:m.A},props:{customPrimaryButtonText:{type:String,default:""},currentStep:{type:String,required:!0},sendingDisabled:Boolean,hideArrowSendIcon:Boolean},emits:["close","step-prev","step-next"],setup:function(e){var t=(0,u.s9)(),n=t.t,r=(0,l.w5)(),o=r.isOnline,s=(0,l.oV)(),v=s.isActiveAccountAirGap,m=(0,a.EW)((function(){return[i.x0.review,i.x0.reviewTip,i.x0.airGapSign].includes(e.currentStep)})),f=(0,a.EW)((function(){return[i.x0.review,i.x0.airGapSign].includes(e.currentStep)})),p=(0,a.EW)((function(){return e.currentStep===i.x0.review&&v.value})),A=(0,a.EW)((function(){return e.customPrimaryButtonText?e.customPrimaryButtonText:f.value?n("common.send"):n("common.next")})),b=(0,a.EW)((function(){return!f.value||p.value||e.hideArrowSendIcon?null:c.A}));return{isOnline:o,primaryButtonText:A,primaryButtonIcon:b,showEditButton:m,showSendButton:f,ArrowSendIcon:c.A,QrScanIcon:d.A,TRANSFER_SEND_STEPS:i.x0}}});var A=n(66262);const b=(0,A.A)(p,[["render",s],["__scopeId","data-v-bf95a638"]]),h=b},12263:(e,t,n)=>{n.d(t,{A:()=>p});var a=n(20641),r=n(90033),o={class:"transaction-speed-picker"},s={class:"radio-wrapper"},u={key:0,class:"completion-time"};function i(e,t,n,i,l,c){var d=(0,a.g2)("RadioButton");return(0,a.uX)(),(0,a.CE)("div",o,[(0,a.Lk)("div",s,[((0,a.uX)(!0),(0,a.CE)(a.FK,null,(0,a.pI)(e.feeList,(function(t,n){return(0,a.uX)(),(0,a.Wv)(d,{key:n,value:e.modelValue===n,label:t.label,"has-label-effect":"",onInput:function(t){return e.handleInput(n)}},null,8,["value","label","onInput"])})),128))]),e.UNFINISHED_FEATURES?((0,a.uX)(),(0,a.CE)("p",u,(0,r.v_)(e.$t("modals.send.transactionWillBeCompleted",{time:e.secondsToRelativeTime(e.feeList[e.modelValue].time,!0)})),1)):(0,a.Q3)("",!0)])}n(2892);var l=n(96881),c=n(18743),d=n(36231);const v=(0,a.pM)({components:{RadioButton:d.A},props:{feeList:{type:Array,required:!0,validate:function(e){return 3===e.length}},modelValue:{type:Number,default:1}},emits:["update:modelValue"],setup:function(e,t){var n=t.emit;function a(e){n("update:modelValue",e)}return{UNFINISHED_FEATURES:c.s4,secondsToRelativeTime:l.Aq,handleInput:a}}});var m=n(66262);const f=(0,m.A)(v,[["render",i],["__scopeId","data-v-7236139c"]]),p=f},75324:(e,t,n)=>{n.d(t,{A:()=>S});n(62010),n(9868);var a=n(20641),r={class:"transfer-review-base"},o={key:0},s={key:0};function u(e,t,n,u,i,l){var c=(0,a.g2)("ModalHeader"),d=(0,a.g2)("AvatarWithChainName"),v=(0,a.g2)("DetailsItem"),m=(0,a.g2)("TokenAmount"),f=(0,a.g2)("PayloadDetails"),p=(0,a.g2)("Loader");return(0,a.uX)(),(0,a.CE)("div",r,[(0,a.bF)(c,{title:e.title,subtitle:e.withoutSubtitle?null:e.subtitle,"no-padding":e.noHeaderPadding},{title:(0,a.k6)((function(){return[e.$slots.title?((0,a.uX)(),(0,a.CE)("div",o,[(0,a.RG)(e.$slots,"title",{},void 0,!0)])):(0,a.Q3)("",!0)]})),_:3},8,["title","subtitle","no-padding"]),(0,a.RG)(e.$slots,"subheader",{},void 0,!0),(0,a.bF)(v,{label:e.senderLabel,"data-cy":"review-sender"},{value:(0,a.k6)((function(){return[(0,a.bF)(d,{address:e.activeAccount.address,name:e.activeAccount.name,"show-address":!e.isRecipientName},null,8,["address","name","show-address"])]})),_:1},8,["label"]),e.$slots.recipient?((0,a.uX)(),(0,a.CE)("div",s,[(0,a.RG)(e.$slots,"recipient",{},void 0,!0)])):((0,a.uX)(),(0,a.Wv)(v,{key:1,class:"details-item","data-cy":"review-recipient",label:e.$t("pages.send.recipient")},{value:(0,a.k6)((function(){return[(0,a.bF)(d,{address:e.transferData.address,name:e.avatarName,"show-address":!e.avatarName},null,8,["address","name","show-address"])]})),_:1},8,["label"])),(0,a.bF)(v,{label:e.amountLabel,class:"details-item"},{value:(0,a.k6)((function(){var t;return[(0,a.bF)(m,{amount:+e.transferData.amount,symbol:e.tokenSymbol,protocol:e.protocol,"hide-fiat":!e.showFiat,price:null===(t=e.transferData.selectedAsset)||void 0===t?void 0:t.price,"data-cy":"review-amount"},null,8,["amount","symbol","protocol","hide-fiat","price"])]})),_:1},8,["label"]),(0,a.RG)(e.$slots,"additional-fee",{},void 0,!0),(0,a.bF)(v,{class:"details-item",label:e.feeLabel},{value:(0,a.k6)((function(){return[(0,a.bF)(m,{amount:+e.transferData.fee.toFixed(),symbol:e.baseTokenSymbol,protocol:e.protocol,"high-precision":"","data-cy":"review-fee"},null,8,["amount","symbol","protocol"])]})),_:1},8,["label"]),(0,a.RG)(e.$slots,"total",{},void 0,!0),(0,a.bF)(f,{class:"details-item","data-cy":"review-payload",payload:e.transferData.payload},null,8,["payload"]),e.loading?((0,a.uX)(),(0,a.Wv)(p,{key:2})):(0,a.Q3)("",!0)])}var i=n(67283),l=n(39918),c=n(95891),d=n(2205),v=n(90863),m=n(50369),f=n(34440),p=n(71522),A=n(40919),b=n(60447);const h=(0,a.pM)({name:"TransferReviewBase",components:{PayloadDetails:b.A,ModalHeader:A.A,AvatarWithChainName:p.A,DetailsItem:m.A,Loader:v.A,TokenAmount:f.A},props:{title:{type:String,default:(0,d.tg)("pages.send.reviewtx")},subtitle:{type:String,default:(0,d.tg)("pages.send.checkalert")},senderLabel:{type:String,default:(0,d.tg)("pages.send.sender")},amountLabel:{type:String,default:(0,d.tg)("common.amount")},feeLabel:{type:String,default:(0,d.tg)("transaction.fee")},baseTokenSymbol:{type:String,required:!0},transferData:{type:Object,required:!0},protocol:{type:String,required:!0},recipientAddress:{type:String,default:null},avatarName:{type:String,default:null},noHeaderPadding:Boolean,withoutSubtitle:Boolean,loading:Boolean,showFiat:Boolean},setup:function(e){var t=(0,l.oV)(),n=t.activeAccount,r=(0,a.EW)((function(){return e.recipientAddress&&(0,i.wJ)(e.recipientAddress)})),o=(0,a.EW)((function(){var t;return(null===(t=e.transferData.selectedAsset)||void 0===t?void 0:t.symbol)||"-"}));return{AE_CONTRACT_ID:c.cK,isRecipientName:r,tokenSymbol:o,activeAccount:n}}});var g=n(66262);const y=(0,g.A)(h,[["render",u],["__scopeId","data-v-65a6f3bb"]]),S=y},55717:(e,t,n)=>{n.d(t,{A:()=>k});var a=n(20641),r={class:"transfer-send-recipient"},o={class:"buttons"},s={key:0,class:"status"};function u(e,t,n,u,i,l){var c=(0,a.g2)("BtnIcon"),d=(0,a.g2)("FormAccountInput"),v=(0,a.g2)("Field"),m=(0,a.g2)("UrlStatus");return(0,a.uX)(),(0,a.CE)("div",r,[(0,a.bF)(v,{name:"address","model-value":e.modelValue,"validate-on-mount":!!e.modelValue,rules:Object.assign({required:!0,address_not_same_as:[e.activeAccount.address,e.protocol]},e.validationRules)},{default:(0,a.k6)((function(n){var r=n.field;return[(0,a.bF)(d,(0,a.v6)(r,{"model-value":e.modelValue,name:"address","data-cy":"address","show-help":"","show-message-help":"",protocol:e.protocol,label:e.$t("modals.send.recipientLabel"),placeholder:e.placeholder,message:e.addressMessage,"onUpdate:modelValue":t[2]||(t[2]=function(t){return e.$emit("update:modelValue",t)}),onHelp:t[3]||(t[3]=function(t){return e.showRecipientHelp()})}),{"label-after":(0,a.k6)((function(){return[(0,a.Lk)("div",o,[(0,a.bF)(c,{icon:e.AddressBookIcon,"data-cy":"address-book-button",onClick:t[0]||(t[0]=function(t){return e.selectFromAddressBook()})},null,8,["icon"]),(0,a.bF)(c,{icon:e.QrScanIcon,"data-cy":"scan-button",onClick:t[1]||(t[1]=function(t){return e.$emit("openQrModal")})},null,8,["icon"])])]})),_:2},1040,["model-value","protocol","label","placeholder","message"])]})),_:1},8,["model-value","validate-on-mount","rules"]),e.isTipUrl?((0,a.uX)(),(0,a.CE)("div",s,[(0,a.bF)(m,{status:e.urlStatus},null,8,["status"])])):(0,a.Q3)("",!0)])}var i=n(34916),l=(n(16280),n(76918),n(26099),n(81268)),c=n(96881),d=n(18743),v=n(39918),m=n(76329),f=n(51718),p=n(54748),A=n(22781),b=n(91718),h=n(47512),g=function(e,t,n,a){function r(e){return e instanceof n?e:new n((function(t){t(e)}))}return new(n||(n=Promise))((function(n,o){function s(e){try{i(a.next(e))}catch(t){o(t)}}function u(e){try{i(a["throw"](e))}catch(t){o(t)}}function i(e){e.done?n(e.value):r(e.value).then(s,u)}i((a=a.apply(e,t||[])).next())}))};const y=(0,a.pM)({components:{FormAccountInput:h.A,UrlStatus:f.A,Field:l.D0,BtnIcon:p.A},props:{isTipUrl:Boolean,modelValue:{type:String,default:""},placeholder:{type:String,default:""},protocol:{type:String,required:!0},validationRules:{type:Object,default:function(){return{}}},errors:{type:Object,required:!0}},emits:["openQrModal","update:modelValue"],setup:function(e,t){var n=t.emit,r=(0,a.EW)((function(){return e.protocol===d.yv.aeternity})),o=(0,v.U8)(),s=o.openModal,u=(0,v.oV)(),l=u.activeAccount,f=(0,m.NC)({ensureFetchedOnInit:r.value}),p=f.getTippingUrlStatus,h=(0,a.EW)((function(){return p(e.modelValue)})),y=(0,a.EW)((function(){if(e.isTipUrl)switch(h.value){case"verified":return{status:"success",text:"",hideMessage:!0};case"not-secure":case"not-verified":return{status:"warning",text:"",hideMessage:!0};case"blacklisted":return{status:"error",text:"",hideMessage:!0};default:throw new Error("Unknown url status: ".concat(h.value))}return(0,c.sY)(e.errors.address)}));function S(){s(d.R$,{protocol:e.protocol})}function x(){return g(this,void 0,void 0,(0,i.A)().mark((function e(){var t;return(0,i.A)().wrap((function(e){while(1)switch(e.prev=e.next){case 0:return e.next=2,s(d.tA);case 2:t=e.sent,t&&n("update:modelValue",t);case 4:case"end":return e.stop()}}),e)})))}return{QrScanIcon:A.A,AddressBookIcon:b.A,urlStatus:h,activeAccount:l,addressMessage:y,showRecipientHelp:S,selectFromAddressBook:x}}});var S=n(66262);const x=(0,S.A)(y,[["render",u],["__scopeId","data-v-677dbd89"]]),k=x},10483:(e,t,n)=>{n.d(t,{A:()=>p});n(62010);var a=n(20641),r={class:"transfer-send-base"},o={class:"account-row"};function s(e,t,n,s,u,i){var l=(0,a.g2)("ModalHeader"),c=(0,a.g2)("AccountItem"),d=(0,a.g2)("TokenAmount"),v=(0,a.g2)("DetailsItem");return(0,a.uX)(),(0,a.CE)("div",r,[e.$slots.header?(0,a.RG)(e.$slots,"header",{key:0},void 0,!0):((0,a.uX)(),(0,a.CE)(a.FK,{key:1},[(0,a.bF)(l,{title:e.customTitle||e.$t("modals.send.sendTitle")},null,8,["title"]),(0,a.Lk)("div",o,[(0,a.bF)(c,{address:e.activeAccount.address,protocol:e.activeAccount.protocol,name:e.activeAccount.name,size:"md"},null,8,["address","protocol","name"])])],64)),(0,a.RG)(e.$slots,"recipient",{},void 0,!0),(0,a.RG)(e.$slots,"amount",{},void 0,!0),(0,a.RG)(e.$slots,"extra",{},void 0,!0),(0,a.bF)(v,{label:e.maxFee?e.$t("transaction.estimatedFee"):e.$t("transaction.fee")},{value:(0,a.k6)((function(){return[(0,a.bF)(d,{amount:e.fee,symbol:e.feeSymbol,protocol:e.protocol,"blink-on-change":"","data-cy":"review-fee"},null,8,["amount","symbol","protocol"])]})),_:1},8,["label"]),e.maxFee?((0,a.uX)(),(0,a.Wv)(v,{key:2,label:e.$t("transaction.maxFee")},{value:(0,a.k6)((function(){return[(0,a.bF)(d,{amount:e.maxFee,symbol:e.feeSymbol,protocol:e.protocol,"blink-on-change":"","data-cy":"review-max-fee"},null,8,["amount","symbol","protocol"])]})),_:1},8,["label"])):(0,a.Q3)("",!0)])}n(2892);var u=n(39918),i=n(50369),l=n(34440),c=n(40919),d=n(33521);const v=(0,a.pM)({name:"TransferSendFormBase",components:{ModalHeader:c.A,AccountItem:d.A,DetailsItem:i.A,TokenAmount:l.A},props:{fee:{type:Number,default:0},maxFee:{type:Number,default:void 0},feeSymbol:{type:String,required:!0},customTitle:{type:String,default:""},protocol:{type:String,required:!0}},setup:function(){var e=(0,u.oV)(),t=e.activeAccount;return{activeAccount:t}}});var m=n(66262);const f=(0,m.A)(v,[["render",s],["__scopeId","data-v-cdc4500e"]]),p=f},2915:(e,t,n)=>{n.d(t,{A:()=>c});var a=n(20641),r=n(90033);function o(e,t,n,o,s,u){var i=(0,a.g2)("BtnPlain");return(0,a.uX)(),(0,a.Wv)(i,{class:(0,r.C4)(["max-button",{chosen:e.isMax}]),text:e.$t("common.max"),onClick:t[0]||(t[0]=function(t){return e.$emit("click")})},null,8,["class","text"])}var s=n(77389);const u=(0,a.pM)({name:"BtnMaxAmount",components:{BtnPlain:s.A},props:{isMax:Boolean},emits:["click"]});var i=n(66262);const l=(0,i.A)(u,[["render",o],["__scopeId","data-v-a1d25678"]]),c=l},14555:(e,t,n)=>{n.r(t),n.d(t,{default:()=>j});var a=n(20641);function r(e,t,n,r,o,s){var u=(0,a.g2)("TransferSendBase");return(0,a.uX)(),(0,a.Wv)(u,{"current-step":e.currentStep,"sending-disabled":e.error||!e.transferData.address||!e.transferData.amount,onClose:e.resolve,onStepNext:e.proceedToNextStep,onStepPrev:e.editTransfer},{content:(0,a.k6)((function(){return[((0,a.uX)(),(0,a.Wv)((0,a.$y)(e.currentStepConfig.component),{ref:"currentRenderedComponent","transfer-data":e.transferData,"onUpdate:transferData":t[0]||(t[0]=function(t){return e.transferData=t}),onSuccess:e.currentStepConfig.onSuccess,onError:t[1]||(t[1]=function(t){return e.error=t})},null,40,["transfer-data","onSuccess"]))]})),_:1},8,["current-step","sending-disabled","onClose","onStepNext","onStepPrev"])}var o=n(41856),s=n(50953),u=n(18743),i=n(39918),l=n(81282);function c(e,t,n,r,o,s){var u=(0,a.g2)("TokenAmount"),i=(0,a.g2)("DetailsItem"),l=(0,a.g2)("TransferReviewBase");return(0,a.uX)(),(0,a.Wv)(l,{"base-token-symbol":e.ETH_COIN_SYMBOL,"transfer-data":e.transferData,loading:e.loading,protocol:e.PROTOCOLS.ethereum,"show-fiat":e.isSelectedAssetEthCoin,class:"transfer-review"},{total:(0,a.k6)((function(){return[e.isSelectedAssetEthCoin?((0,a.uX)(),(0,a.Wv)(i,{key:0,label:e.$t("common.total"),class:"details-item"},{value:(0,a.k6)((function(){return[(0,a.bF)(u,{amount:+e.transferData.total,symbol:e.ETH_COIN_SYMBOL,protocol:e.PROTOCOLS.ethereum,"data-cy":"review-total","high-precision":""},null,8,["amount","symbol","protocol"])]})),_:1},8,["label"])):(0,a.Q3)("",!0)]})),_:1},8,["base-token-symbol","transfer-data","loading","protocol","show-fiat"])}var d=n(34916),v=(n(44114),n(2892),n(26099),n(75220)),m=n(48156),f=n(87087),p=n(92032),A=n(75324),b=n(50369),h=n(34440),g=n(84560),y=function(e,t,n,a){function r(e){return e instanceof n?e:new n((function(t){t(e)}))}return new(n||(n=Promise))((function(n,o){function s(e){try{i(a.next(e))}catch(t){o(t)}}function u(e){try{i(a["throw"](e))}catch(t){o(t)}}function i(e){e.done?n(e.value):r(e.value).then(s,u)}i((a=a.apply(e,t||[])).next())}))};const S=(0,a.pM)({name:"EthTransferReview",components:{TokenAmount:h.A,DetailsItem:b.A,TransferReviewBase:A.A},model:{prop:"transferData"},props:{transferData:{type:Object,required:!0}},setup:function(e,t){var n=t.emit,r=(0,m.s9)(),o=r.t,l=(0,v.rd)(),c=(0,i.mv)(),A=c.homeRouteName,b=(0,i.oV)(),h=b.getLastActiveProtocolAccount,S=(0,i.rb)(),x=S.addAccountPendingTransaction,k=(0,s.KR)(!1),w=f.C.getAdapter(u.yv.ethereum),T=(0,a.EW)((function(){var t,n;return(null===(n=null===(t=e.transferData)||void 0===t?void 0:t.selectedAsset)||void 0===n?void 0:n.contractId)===w.coinContractId}));function F(e){g.A.write({title:o("modals.transaction-failed.title"),message:e||o("modals.transaction-failed.msg"),type:"api-response",modal:!0})}function C(){var t;return y(this,void 0,void 0,(0,d.A)().mark((function a(){var r,o,s,i,c,v,m;return(0,d.A)().wrap((function(a){while(1)switch(a.prev=a.next){case 0:if(r=e.transferData,o=r.amount,s=r.address,i=r.selectedAsset,o&&s&&i){a.next=3;break}return a.abrupt("return");case 3:if(k.value=!0,v=h(u.yv.ethereum),a.prev=5,T.value){a.next=12;break}return a.next=9,null===(t=w.transferToken)||void 0===t?void 0:t.call(w,o,s,i.contractId,{fromAccount:null===v||void 0===v?void 0:v.address,maxPriorityFeePerGas:e.transferData.maxPriorityFeePerGas,maxFeePerGas:e.transferData.maxFeePerGas});case 9:c=a.sent,a.next=15;break;case 12:return a.next=14,w.spend(Number(o),s,{fromAccount:null===v||void 0===v?void 0:v.address,maxPriorityFeePerGas:e.transferData.maxPriorityFeePerGas,maxFeePerGas:e.transferData.maxFeePerGas});case 14:c=a.sent;case 15:c&&(m={hash:c.hash,pending:!0,transactionOwner:null===v||void 0===v?void 0:v.address,protocol:u.yv.ethereum,tx:{amount:Number(o),callerId:null===v||void 0===v?void 0:v.address,contractId:i.contractId,senderId:null===v||void 0===v?void 0:v.address,type:T.value?"SpendTx":"ContractCallTx",function:"transfer",recipientId:s,arguments:[],fee:0}},x(null===v||void 0===v?void 0:v.address,m)),a.next=22;break;case 18:return a.prev=18,a.t0=a["catch"](5),F(a.t0.message),a.abrupt("return");case 22:return a.prev=22,k.value=!1,a.finish(22);case 25:l.push({name:A.value}),n("success");case 27:case"end":return a.stop()}}),a,null,[[5,18,22,25]])})))}return{PROTOCOLS:u.yv,ETH_COIN_SYMBOL:p.xU,loading:k,isSelectedAssetEthCoin:T,submit:C}}});var x=n(66262);const k=(0,x.A)(S,[["render",c],["__scopeId","data-v-9fa3acd0"]]),w=k;n(76918),n(23288),n(38781);var T=n(53751);function F(e,t,n,r,o,s){var u=(0,a.g2)("TransferSendRecipient"),i=(0,a.g2)("BtnMaxAmount"),l=(0,a.g2)("TransferSendAmount"),c=(0,a.g2)("TransactionSpeedPicker"),d=(0,a.g2)("DetailsItem"),v=(0,a.g2)("TransferSendFormBase");return(0,a.uX)(),(0,a.Wv)(v,(0,a.v6)(e.$attrs,{"transfer-data":e.transferData,fee:e.numericFee,"max-fee":e.numericMaxFee,"fee-symbol":e.ETH_COIN_SYMBOL,protocol:e.PROTOCOLS.ethereum,"custom-title":e.$t("modals.send.sendAsset",{name:e.ETH_PROTOCOL_NAME}),class:"transfer-send-form"}),{recipient:(0,a.k6)((function(){return[(0,a.bF)(u,{modelValue:e.formModel.address,"onUpdate:modelValue":t[0]||(t[0]=function(t){return e.formModel.address=t}),modelModifiers:{trim:!0},placeholder:e.recipientPlaceholderText,errors:e.errors,protocol:e.PROTOCOLS.ethereum,"validation-rules":{account_address:[e.PROTOCOLS.ethereum]},onOpenQrModal:t[1]||(t[1]=function(t){return e.scanTransferQrCode()})},null,8,["modelValue","placeholder","errors","protocol","validation-rules"])]})),amount:(0,a.k6)((function(){return[(0,a.bF)(l,{modelValue:e.formModel.amount,"onUpdate:modelValue":[t[2]||(t[2]=function(t){return e.formModel.amount=t}),t[3]||(t[3]=function(t){return e.shouldUseMaxAmount=!1})],errors:e.errors,"selected-asset":e.formModel.selectedAsset,protocol:e.PROTOCOLS.ethereum,"blink-on-change":e.shouldUseMaxAmount,"validation-rules":Object.assign(Object.assign({},+e.balance.minus(e.maxFee)>0?{max_value:e.max}:{}),{enough_coin:[e.maxFee.toString(),e.ETH_COIN_SYMBOL]}),onAssetSelected:e.handleAssetChange},{"label-after":(0,a.k6)((function(){return[(0,a.bF)(i,{"is-max":e.shouldUseMaxAmount,onClick:e.toggleMaxAmount},null,8,["is-max","onClick"])]})),_:1},8,["modelValue","errors","selected-asset","protocol","blink-on-change","validation-rules","onAssetSelected"])]})),extra:(0,a.k6)((function(){return[(0,a.bo)((0,a.bF)(d,{label:e.$t("modals.send.transactionSpeed")},{value:(0,a.k6)((function(){return[(0,a.bF)(c,{modelValue:e.feeSelectedIndex,"onUpdate:modelValue":t[4]||(t[4]=function(t){return e.feeSelectedIndex=t}),"fee-list":e.feeList},null,8,["modelValue","fee-list"])]})),_:1},8,["label"]),[[T.aG,e.activeNetwork.type!==e.NETWORK_TYPE_TESTNET]])]})),_:1},16,["transfer-data","fee","max-fee","fee-symbol","protocol","custom-title"])}n(98992),n(72577),n(28706),n(50113),n(9868);var C=n(60346),E=n(6635),I=n(34620),_=n(96881);function O(e){var t=e.formModel,n=e.fee,r=(0,i.ty)(),o=r.balance,s=(0,a.EW)((function(){var e,n,a=f.C.getAdapter(u.yv.ethereum);return(null===(n=null===(e=t.value)||void 0===e?void 0:e.selectedAsset)||void 0===n?void 0:n.contractId)===a.coinContractId})),l=(0,a.EW)((function(){var e,n;return new C.A((0,_.Y9)(null===(e=t.value.selectedAsset)||void 0===e?void 0:e.amount,-((null===(n=t.value.selectedAsset)||void 0===n?void 0:n.decimals)||-0))||0)})),c=(0,a.EW)((function(){if(o.value&&s.value){var e=o.value.minus(n.value);return(e.isPositive()?e:0).toString()}return l.value.toString()}));return{max:c}}var M=n(36311),P=n(57870),R=n(10483),B=n(55717),D=n(18381),N=n(12263),L=n(2915),W=function(e,t,n,a){function r(e){return e instanceof n?e:new n((function(t){t(e)}))}return new(n||(n=Promise))((function(n,o){function s(e){try{i(a.next(e))}catch(t){o(t)}}function u(e){try{i(a["throw"](e))}catch(t){o(t)}}function i(e){e.done?n(e.value):r(e.value).then(s,u)}i((a=a.apply(e,t||[])).next())}))};const $=(0,a.pM)({name:"EthTransferSendForm",components:{BtnMaxAmount:L.A,TransactionSpeedPicker:N.A,DetailsItem:b.A,TransferSendAmount:D.A,TransferSendRecipient:B.A,TransferSendFormBase:R.A},model:{prop:"transferData"},props:{transferData:{type:Object,required:!0}},emits:["update:transferData","success","error"],setup:function(e,t){var n=this,r=t.emit,o=(0,v.lq)(),l=(0,m.s9)(),c=l.t,A=(0,i.fI)(),b=A.activeNetwork,h=(0,i.ZN)(),g=h.marketData,y=(0,i.ty)(),S=y.balance,x=(0,i.oV)(),k=x.activeAccount,w=(0,E.u)(),T=w.fee,F=w.maxFee,R=w.feeList,B=w.feeSelectedIndex,D=w.maxFeePerGas,N=w.maxPriorityFeePerGas,L=w.updateFeeList,$=(0,i.Sr)(),V=$.accountAssets,G=(0,M.G)(),X=G.ethActiveNetworkSettings;function U(e,t){return e?V.value.find((function(t){var n=t.contractId;return n===e})):t?void 0:f.C.getAdapter(u.yv.ethereum).getDefaultCoin(g.value,+S.value)}var j=(0,I.x)({transferData:e.transferData,getSelectedAssetValue:U}),H=j.formModel,Q=j.errors,q=j.hasError,K=j.invoiceId,Y=j.invoiceContract,z=j.scanTransferQrCode,J=j.handleAssetChange,Z=j.updateFormModelValues,ee=(0,s.KR)(!1),te=O({formModel:H,fee:F}),ne=te.max,ae=(0,a.EW)((function(){return+T.value.toFixed()})),re=(0,a.EW)((function(){return+F.value.toFixed()})),oe="".concat(c("modals.send.recipientPlaceholderProtocol",{name:u.yv.ethereum})," ").concat(c("modals.send.recipientPlaceholderENS"));function se(){var e,t,n,o=Object.assign(Object.assign({},H.value),{fee:T.value,maxFeePerGas:null===(e=D.value)||void 0===e?void 0:e.toFormat(p.hj),maxPriorityFeePerGas:null===(t=N.value)||void 0===t?void 0:t.toFormat(p.hj),total:ae.value+ +((null===(n=H.value)||void 0===n?void 0:n.amount)||0),invoiceId:K.value,invoiceContract:Y.value});return r("update:transferData",o),(0,a.dY)()}function ue(){return W(this,void 0,void 0,(0,d.A)().mark((function e(){return(0,d.A)().wrap((function(e){while(1)switch(e.prev=e.next){case 0:if(q.value){e.next=4;break}return e.next=3,se();case 3:r("success");case 4:case"end":return e.stop()}}),e)})))}function ie(){ee.value=!ee.value,ee.value&&(H.value.amount=ne.value)}function le(){var t,n,a,r=new C.A(H.value.amount);if("ethereum"!==(null===(t=e.transferData.selectedAsset)||void 0===t?void 0:t.contractId)&&r.gt(0)&&H.value.address){var o=X.value.nodeUrl;return(0,P.b)(null===(n=H.value.selectedAsset)||void 0===n?void 0:n.contractId,H.value.address,null===(a=k.value)||void 0===a?void 0:a.address,r,o)}}var ce=null;return(0,a.sV)((function(){var t;ce=(0,_.mX)((function(){return W(n,void 0,void 0,(0,d.A)().mark((function e(){return(0,d.A)().wrap((function(e){while(1)switch(e.prev=e.next){case 0:return e.t0=L,e.next=3,le();case 3:e.t1=e.sent,(0,e.t0)(e.t1);case 5:case"end":return e.stop()}}),e)})))}),5e3);var a=o.query;Z(Object.assign(Object.assign({},a),{token:a.token||(null===(t=e.transferData.selectedAsset)||void 0===t?void 0:t.contractId)}))})),(0,a.hi)((function(){ce&&clearInterval(ce)})),(0,a.wB)((function(){return H.value.selectedAsset}),(function(){return W(n,void 0,void 0,(0,d.A)().mark((function e(){return(0,d.A)().wrap((function(e){while(1)switch(e.prev=e.next){case 0:return e.t0=L,e.next=3,le();case 3:e.t1=e.sent,(0,e.t0)(e.t1);case 5:case"end":return e.stop()}}),e)})))})),(0,a.wB)(ne,(function(e){ee.value&&(H.value.amount=e)})),(0,a.wB)(q,(function(e){return r("error",e)}),{deep:!0}),(0,a.wB)(H,(function(){se()}),{deep:!0}),{ETH_PROTOCOL_NAME:p.Dz,ETH_COIN_SYMBOL:p.xU,PROTOCOLS:u.yv,NETWORK_TYPE_TESTNET:u.Oj,formModel:H,activeNetwork:b,maxFee:F,feeList:R,recipientPlaceholderText:oe,feeSelectedIndex:B,numericFee:ae,numericMaxFee:re,errors:Q,balance:S,max:ne,shouldUseMaxAmount:ee,scanTransferQrCode:z,handleAssetChange:J,submit:ue,toggleMaxAmount:ie}}}),V=(0,x.A)($,[["render",F]]),G=V,X=(0,a.pM)({name:u.iP,components:{TransferSendBase:l.A},props:Object.assign(Object.assign({},l.g),{tokenContractId:{type:String,default:null}}),setup:function(e){var t=(0,i.Y7)(),n=t.getProtocolAvailableTokens,r=(0,a.EW)((function(){return n(u.yv.ethereum)})),l=(0,s.KR)(),c=(0,s.KR)(u.x0.form),d=(0,s.KR)(!1),v=(0,s.KR)({address:e.address,amount:e.amount,payload:e.payload,selectedAsset:e.tokenContractId?r.value[e.tokenContractId]:void 0});function m(){l.value.submit()}function f(){c.value=u.x0.review}function p(){d.value=!1,c.value=u.x0.form}var A=(0,o.A)((0,o.A)({},u.x0.form,{component:G,onSuccess:f}),u.x0.review,{component:w,onSuccess:e.resolve}),b=(0,a.EW)((function(){return A[c.value]}));return{TRANSFER_SEND_STEPS:u.x0,currentRenderedComponent:l,steps:A,currentStep:c,error:d,transferData:v,currentStepConfig:b,proceedToNextStep:m,editTransfer:p}}}),U=(0,x.A)(X,[["render",r]]),j=U}}]);