"use strict";(self["webpackChunksuperhero_wallet"]=self["webpackChunksuperhero_wallet"]||[]).push([[3875],{34620:(e,t,n)=>{n.d(t,{x:()=>S});var a=n(95383),r=n(70068),o=n(34916),s=(n(76918),n(28706),n(50113),n(51629),n(62062),n(15086),n(23288),n(62010),n(53921),n(79432),n(26099),n(27495),n(38781),n(47764),n(25440),n(42762),n(23500),n(62953),n(3296),n(27208),n(48408),n(14603),n(47566),n(98721),n(50953)),i=n(20641),u=n(48156),l=n(15261),c=n(93909),d=n(37772),v=n(96881),m=n(84560),p=n(53611),f=n(69264),b=n(96605),A=function(e,t,n,a){function r(e){return e instanceof n?e:new n((function(t){t(e)}))}return new(n||(n=Promise))((function(n,o){function s(e){try{u(a.next(e))}catch(t){o(t)}}function i(e){try{u(a["throw"](e))}catch(t){o(t)}}function u(e){e.done?n(e.value):r(e.value).then(s,i)}u((a=a.apply(e,t||[])).next())}))};function S(e){var t=e.transferData,n=e.getSelectedAssetValue,S=(0,s.KR)(t),g=(0,s.KR)(null),y=(0,s.KR)(null),h=(0,u.s9)(),w=h.t,T=(0,c.U)(),x=T.openDefaultModal,k=T.openScanQrModal,O=(0,l.mN)(),C=O.errors,_=O.validate,B=O.validateField,E=(0,f.t)(),F=E.saveTransferSendFormModel,R=(0,b.S)(),M=R.accountAssets,I=(0,i.EW)((function(){return["address","amount"].some((function(e){return"error"===(0,v.sY)(C.value[e]).status}))}));function D(){S.value.payload=""}function N(e){S.value.selectedAsset=e}function P(e,t){var n=e.account,a=e.amount,r=e.payload,o=e.token,s={},i=t?t(o,S.value.selectedAsset):null;return i&&(s.selectedAsset=i),n&&(s.address=n),a&&(s.amount=a),r&&(s.payload=r),s}function L(e){return A(this,void 0,void 0,(0,o.A)().mark((function t(){var a;return(0,o.A)().wrap((function(t){while(1)switch(t.prev=t.next){case 0:return a=P(e,n),S.value=Object.assign(Object.assign({},S.value),a),t.next=4,(0,i.dY)();case 4:Object.keys(a).forEach((function(e){return B(e)}));case 5:case"end":return t.stop()}}),t)})))}function $(){var e,t;return A(this,void 0,void 0,(0,o.A)().mark((function n(){var s,i,u;return(0,o.A)().wrap((function(n){while(1)switch(n.prev=n.next){case 0:return n.next=2,k({title:w("pages.send.scanAddress",{assetName:null===(e=S.value.selectedAsset)||void 0===e?void 0:e.name})}).then((function(e){return e}))["catch"]((function(e){return e instanceof p.yr&&F(S.value),null}));case 2:if(s=n.sent,"{"!==(null===s||void 0===s?void 0:s.trim().charAt(0))){n.next=29;break}i=null,n.prev=5,i=JSON.parse(s),n.next=15;break;case 9:return n.prev=9,n.t0=n["catch"](5),d.p8||m.A.write(n.t0),S.value.address=void 0,x({title:w("modals.invalid-qr-code.msg"),icon:"critical"}),n.abrupt("return");case 15:if(u=M.value.find((function(e){var t=e.contractId;return t===i.tokenContract})),u){n.next=20;break}return S.value.address=void 0,x({msg:w("modals.insufficient-balance.msg")}),n.abrupt("return");case 20:return S.value.selectedAsset=u,S.value.address=i.tokenContract,S.value.amount=(0,v.Y9)(i.amount,-((null===(t=S.value.selectedAsset)||void 0===t?void 0:t.decimals)||-0)).toString(),g.value=i.invoiceId,y.value=i.invoiceContract,n.next=27,_();case 27:n.next=33;break;case 29:if(s){n.next=31;break}return n.abrupt("return");case 31:L(Object.fromEntries((0,r.A)(new URL((0,v.Ks)(s)?s:"".concat(d.yS,"/account?account=").concat(s.replace("?","&"))).searchParams.entries()).map((function(e){var t=(0,a.A)(e,2),n=t[0],r=t[1];return[n,r]})))),g.value=null;case 33:S.value.address||(S.value.address=void 0);case 34:case"end":return n.stop()}}),n,null,[[5,9]])})))}return{formModel:S,errors:C,hasError:I,invoiceId:g,invoiceContract:y,scanTransferQrCode:$,clearPayload:D,handleAssetChange:N,validate:_,updateFormModelValues:L}}},71522:(e,t,n)=>{n.d(t,{A:()=>d});n(62010);var a=n(20641),r=n(90033);function o(e,t,n,o,s,i){var u=(0,a.g2)("Avatar"),l=(0,a.g2)("AddressFormatted");return(0,a.uX)(),(0,a.CE)("div",{class:(0,r.C4)(["avatar-with-chain-name",{"only-name":(n.name||!n.showAddress)&&!n.hideAvatar}])},[n.hideAvatar?(0,a.Q3)("",!0):((0,a.uX)(),(0,a.Wv)(u,(0,a.v6)({key:0},e.$attrs,{size:n.avatarSize,address:n.address}),null,16,["size","address"])),n.name||!n.showAddress?((0,a.uX)(),(0,a.CE)("div",{key:1,class:(0,r.C4)(["chain-name",{centered:n.hideAvatar}])},(0,r.v_)(n.name),3)):((0,a.uX)(),(0,a.Wv)(l,(0,a.v6)({key:2},e.$attrs,{address:n.address,columns:""}),null,16,["address"]))],2)}var s=n(93271),i=n(15059);const u={components:{AddressFormatted:i.A,Avatar:s.A},props:{address:{type:String,required:!0},name:{type:String,default:""},hideAvatar:Boolean,avatarSize:{type:String,default:"md"},showAddress:Boolean}};var l=n(66262);const c=(0,l.A)(u,[["render",o],["__scopeId","data-v-80ede450"]]),d=c},81282:(e,t,n)=>{n.d(t,{A:()=>S,g:()=>p});var a=n(20641),r=n(53751),o={class:"relative"};function s(e,t,n,s,i,u){var l=(0,a.g2)("BtnMain"),c=(0,a.g2)("Modal");return(0,a.uX)(),(0,a.Wv)(c,{class:"transfer-send-base","has-close-button":"","from-bottom":"","no-padding-bottom":e.currentStep===e.TRANSFER_SEND_STEPS.form,onClose:t[2]||(t[2]=function(t){return e.$emit("close")})},{footer:(0,a.k6)((function(){return[e.showEditButton?((0,a.uX)(),(0,a.Wv)(l,{key:0,variant:"muted",text:e.$t("common.edit"),class:"button-action-secondary","data-cy":"edit",onClick:t[0]||(t[0]=function(t){return e.$emit("step-prev")})},null,8,["text"])):(0,a.Q3)("",!0),(0,a.bF)(l,{class:"button-action-primary",disabled:!e.isOnline||e.sendingDisabled,icon:e.primaryButtonIcon,text:e.primaryButtonText,"data-cy":"next-step-button",onClick:t[1]||(t[1]=function(t){return e.$emit("step-next")})},null,8,["disabled","icon","text"])]})),default:(0,a.k6)((function(){return[(0,a.Lk)("div",o,[(0,a.bF)(r.eB,{name:"fade-between"},{default:(0,a.k6)((function(){return[(0,a.RG)(e.$slots,"content",{},void 0,!0)]})),_:3})])]})),_:3},8,["no-padding-bottom"])}n(74423),n(21699);var i=n(48156),u=n(37772),l=n(8580),c=n(80386),d=n(22781),v=n(82988),m=n(55312),p={resolve:{type:Function,default:function(){return null}},address:{type:String,default:void 0},amount:{type:String,default:""},payload:{type:String,default:""}};const f=(0,a.pM)({name:"TransferSendBase",components:{Modal:v.A,BtnMain:m.A},props:{customPrimaryButtonText:{type:String,default:""},currentStep:{type:String,required:!0},sendingDisabled:Boolean,hideArrowSendIcon:Boolean},emits:["close","step-prev","step-next"],setup:function(e){var t=(0,i.s9)(),n=t.t,r=(0,l.w5)(),o=r.isOnline,s=(0,l.oV)(),v=s.isActiveAccountAirGap,m=(0,a.EW)((function(){return[u.x0.review,u.x0.reviewTip,u.x0.airGapSign].includes(e.currentStep)})),p=(0,a.EW)((function(){return[u.x0.review,u.x0.airGapSign].includes(e.currentStep)})),f=(0,a.EW)((function(){return e.currentStep===u.x0.review&&v.value})),b=(0,a.EW)((function(){return e.customPrimaryButtonText?e.customPrimaryButtonText:p.value?n("common.send"):n("common.next")})),A=(0,a.EW)((function(){return!p.value||f.value||e.hideArrowSendIcon?null:c.A}));return{isOnline:o,primaryButtonText:b,primaryButtonIcon:A,showEditButton:m,showSendButton:p,ArrowSendIcon:c.A,QrScanIcon:d.A,TRANSFER_SEND_STEPS:u.x0}}});var b=n(66262);const A=(0,b.A)(f,[["render",s],["__scopeId","data-v-bf95a638"]]),S=A},12263:(e,t,n)=>{n.d(t,{A:()=>f});var a=n(20641),r=n(90033),o={class:"transaction-speed-picker"},s={class:"radio-wrapper"},i={key:0,class:"completion-time"};function u(e,t,n,u,l,c){var d=(0,a.g2)("RadioButton");return(0,a.uX)(),(0,a.CE)("div",o,[(0,a.Lk)("div",s,[((0,a.uX)(!0),(0,a.CE)(a.FK,null,(0,a.pI)(e.feeList,(function(t,n){return(0,a.uX)(),(0,a.Wv)(d,{key:n,value:e.modelValue===n,label:t.label,"has-label-effect":"",onInput:function(t){return e.handleInput(n)}},null,8,["value","label","onInput"])})),128))]),e.UNFINISHED_FEATURES?((0,a.uX)(),(0,a.CE)("p",i,(0,r.v_)(e.$t("modals.send.transactionWillBeCompleted",{time:e.secondsToRelativeTime(e.feeList[e.modelValue].time,!0)})),1)):(0,a.Q3)("",!0)])}n(2892);var l=n(96881),c=n(37772),d=n(36231);const v=(0,a.pM)({components:{RadioButton:d.A},props:{feeList:{type:Array,required:!0,validate:function(e){return 3===e.length}},modelValue:{type:Number,default:1}},emits:["update:modelValue"],setup:function(e,t){var n=t.emit;function a(e){n("update:modelValue",e)}return{UNFINISHED_FEATURES:c.s4,secondsToRelativeTime:l.Aq,handleInput:a}}});var m=n(66262);const p=(0,m.A)(v,[["render",u],["__scopeId","data-v-7236139c"]]),f=p},75324:(e,t,n)=>{n.d(t,{A:()=>h});n(62010),n(9868);var a=n(20641),r={class:"transfer-review-base"},o={key:0},s={key:0};function i(e,t,n,i,u,l){var c=(0,a.g2)("ModalHeader"),d=(0,a.g2)("AvatarWithChainName"),v=(0,a.g2)("DetailsItem"),m=(0,a.g2)("TokenAmount"),p=(0,a.g2)("PayloadDetails"),f=(0,a.g2)("Loader");return(0,a.uX)(),(0,a.CE)("div",r,[(0,a.bF)(c,{title:e.title,subtitle:e.withoutSubtitle?null:e.subtitle,"no-padding":e.noHeaderPadding},{title:(0,a.k6)((function(){return[e.$slots.title?((0,a.uX)(),(0,a.CE)("div",o,[(0,a.RG)(e.$slots,"title",{},void 0,!0)])):(0,a.Q3)("",!0)]})),_:3},8,["title","subtitle","no-padding"]),(0,a.RG)(e.$slots,"subheader",{},void 0,!0),(0,a.bF)(v,{label:e.senderLabel,"data-cy":"review-sender"},{value:(0,a.k6)((function(){return[(0,a.bF)(d,{address:e.activeAccount.address,name:e.activeAccount.name,"show-address":!e.isRecipientName},null,8,["address","name","show-address"])]})),_:1},8,["label"]),e.$slots.recipient?((0,a.uX)(),(0,a.CE)("div",s,[(0,a.RG)(e.$slots,"recipient",{},void 0,!0)])):((0,a.uX)(),(0,a.Wv)(v,{key:1,class:"details-item","data-cy":"review-recipient",label:e.$t("pages.send.recipient")},{value:(0,a.k6)((function(){return[(0,a.bF)(d,{address:e.transferData.address,name:e.avatarName,"show-address":!e.avatarName},null,8,["address","name","show-address"])]})),_:1},8,["label"])),(0,a.bF)(v,{label:e.amountLabel,class:"details-item"},{value:(0,a.k6)((function(){var t;return[(0,a.bF)(m,{amount:+e.transferData.amount,symbol:e.tokenSymbol,protocol:e.protocol,"hide-fiat":!e.showFiat,price:null===(t=e.transferData.selectedAsset)||void 0===t?void 0:t.price,"data-cy":"review-amount"},null,8,["amount","symbol","protocol","hide-fiat","price"])]})),_:1},8,["label"]),(0,a.RG)(e.$slots,"additional-fee",{},void 0,!0),(0,a.bF)(v,{class:"details-item",label:e.feeLabel},{value:(0,a.k6)((function(){return[(0,a.bF)(m,{amount:+e.transferData.fee.toFixed(),symbol:e.baseTokenSymbol,protocol:e.protocol,"high-precision":"","data-cy":"review-fee"},null,8,["amount","symbol","protocol"])]})),_:1},8,["label"]),(0,a.RG)(e.$slots,"total",{},void 0,!0),(0,a.bF)(p,{class:"details-item","data-cy":"review-payload",payload:e.transferData.payload},null,8,["payload"]),e.loading?((0,a.uX)(),(0,a.Wv)(f,{key:2})):(0,a.Q3)("",!0)])}var u=n(67283),l=n(8580),c=n(95891),d=n(2205),v=n(90863),m=n(6095),p=n(34440),f=n(71522),b=n(40919),A=n(60447);const S=(0,a.pM)({name:"TransferReviewBase",components:{PayloadDetails:A.A,ModalHeader:b.A,AvatarWithChainName:f.A,DetailsItem:m.A,Loader:v.A,TokenAmount:p.A},props:{title:{type:String,default:(0,d.tg)("pages.send.reviewtx")},subtitle:{type:String,default:(0,d.tg)("pages.send.checkalert")},senderLabel:{type:String,default:(0,d.tg)("pages.send.sender")},amountLabel:{type:String,default:(0,d.tg)("common.amount")},feeLabel:{type:String,default:(0,d.tg)("transaction.fee")},baseTokenSymbol:{type:String,required:!0},transferData:{type:Object,required:!0},protocol:{type:String,required:!0},recipientAddress:{type:String,default:null},avatarName:{type:String,default:null},noHeaderPadding:Boolean,withoutSubtitle:Boolean,loading:Boolean,showFiat:Boolean},setup:function(e){var t=(0,l.oV)(),n=t.activeAccount,r=(0,a.EW)((function(){return e.recipientAddress&&(0,u.wJ)(e.recipientAddress)})),o=(0,a.EW)((function(){var t;return(null===(t=e.transferData.selectedAsset)||void 0===t?void 0:t.symbol)||"-"}));return{AE_CONTRACT_ID:c.cK,isRecipientName:r,tokenSymbol:o,activeAccount:n}}});var g=n(66262);const y=(0,g.A)(S,[["render",i],["__scopeId","data-v-65a6f3bb"]]),h=y},55717:(e,t,n)=>{n.d(t,{A:()=>T});var a=n(20641),r={class:"transfer-send-recipient"},o={class:"buttons"},s={key:0,class:"status"};function i(e,t,n,i,u,l){var c=(0,a.g2)("BtnIcon"),d=(0,a.g2)("FormAccountInput"),v=(0,a.g2)("Field"),m=(0,a.g2)("UrlStatus");return(0,a.uX)(),(0,a.CE)("div",r,[(0,a.bF)(v,{name:"address","model-value":e.modelValue,"validate-on-mount":!!e.modelValue,rules:Object.assign({required:!0,address_not_same_as:[e.activeAccount.address,e.protocol]},e.validationRules)},{default:(0,a.k6)((function(n){var r=n.field;return[(0,a.bF)(d,(0,a.v6)(r,{"model-value":e.modelValue,name:"address","data-cy":"address","show-help":"","show-message-help":"",protocol:e.protocol,label:e.$t("modals.send.recipientLabel"),placeholder:e.placeholder,message:e.addressMessage,"onUpdate:modelValue":t[2]||(t[2]=function(t){return e.$emit("update:modelValue",t)}),onHelp:t[3]||(t[3]=function(t){return e.showRecipientHelp()})}),{"label-after":(0,a.k6)((function(){return[(0,a.Lk)("div",o,[(0,a.bF)(c,{icon:e.AddressBookIcon,"data-cy":"address-book-button",onClick:t[0]||(t[0]=function(t){return e.selectFromAddressBook()})},null,8,["icon"]),(0,a.bF)(c,{icon:e.QrScanIcon,"data-cy":"scan-button",onClick:t[1]||(t[1]=function(t){return e.$emit("openQrModal")})},null,8,["icon"])])]})),_:2},1040,["model-value","protocol","label","placeholder","message"])]})),_:1},8,["model-value","validate-on-mount","rules"]),e.isTipUrl?((0,a.uX)(),(0,a.CE)("div",s,[(0,a.bF)(m,{status:e.urlStatus},null,8,["status"])])):(0,a.Q3)("",!0)])}var u=n(34916),l=(n(16280),n(76918),n(26099),n(15261)),c=n(96881),d=n(37772),v=n(8580),m=n(76329),p=n(51718),f=n(54748),b=n(22781),A=n(91718),S=n(47512),g=function(e,t,n,a){function r(e){return e instanceof n?e:new n((function(t){t(e)}))}return new(n||(n=Promise))((function(n,o){function s(e){try{u(a.next(e))}catch(t){o(t)}}function i(e){try{u(a["throw"](e))}catch(t){o(t)}}function u(e){e.done?n(e.value):r(e.value).then(s,i)}u((a=a.apply(e,t||[])).next())}))};const y=(0,a.pM)({components:{FormAccountInput:S.A,UrlStatus:p.A,Field:l.D0,BtnIcon:f.A},props:{isTipUrl:Boolean,modelValue:{type:String,default:""},placeholder:{type:String,default:""},protocol:{type:String,required:!0},validationRules:{type:Object,default:function(){return{}}},errors:{type:Object,required:!0}},emits:["openQrModal","update:modelValue"],setup:function(e,t){var n=t.emit,r=(0,a.EW)((function(){return e.protocol===d.yv.aeternity})),o=(0,v.U8)(),s=o.openModal,i=(0,v.oV)(),l=i.activeAccount,p=(0,m.NC)({ensureFetchedOnInit:r.value}),f=p.getTippingUrlStatus,S=(0,a.EW)((function(){return f(e.modelValue)})),y=(0,a.EW)((function(){if(e.isTipUrl)switch(S.value){case"verified":return{status:"success",text:"",hideMessage:!0};case"not-secure":case"not-verified":return{status:"warning",text:"",hideMessage:!0};case"blacklisted":return{status:"error",text:"",hideMessage:!0};default:throw new Error("Unknown url status: ".concat(S.value))}return(0,c.sY)(e.errors.address)}));function h(){s(d.R$,{protocol:e.protocol})}function w(){return g(this,void 0,void 0,(0,u.A)().mark((function e(){var t;return(0,u.A)().wrap((function(e){while(1)switch(e.prev=e.next){case 0:return e.next=2,s(d.tA);case 2:t=e.sent,t&&n("update:modelValue",t);case 4:case"end":return e.stop()}}),e)})))}return{QrScanIcon:b.A,AddressBookIcon:A.A,urlStatus:S,activeAccount:l,addressMessage:y,showRecipientHelp:h,selectFromAddressBook:w}}});var h=n(66262);const w=(0,h.A)(y,[["render",i],["__scopeId","data-v-677dbd89"]]),T=w},10483:(e,t,n)=>{n.d(t,{A:()=>f});n(62010);var a=n(20641),r={class:"transfer-send-base"},o={class:"account-row"};function s(e,t,n,s,i,u){var l=(0,a.g2)("ModalHeader"),c=(0,a.g2)("AccountItem"),d=(0,a.g2)("TokenAmount"),v=(0,a.g2)("DetailsItem");return(0,a.uX)(),(0,a.CE)("div",r,[e.$slots.header?(0,a.RG)(e.$slots,"header",{key:0},void 0,!0):((0,a.uX)(),(0,a.CE)(a.FK,{key:1},[(0,a.bF)(l,{title:e.customTitle||e.$t("modals.send.sendTitle")},null,8,["title"]),(0,a.Lk)("div",o,[(0,a.bF)(c,{address:e.activeAccount.address,protocol:e.activeAccount.protocol,name:e.activeAccount.name,size:"md"},null,8,["address","protocol","name"])])],64)),(0,a.RG)(e.$slots,"recipient",{},void 0,!0),(0,a.RG)(e.$slots,"amount",{},void 0,!0),(0,a.RG)(e.$slots,"extra",{},void 0,!0),(0,a.bF)(v,{label:e.maxFee?e.$t("transaction.estimatedFee"):e.$t("transaction.fee")},{value:(0,a.k6)((function(){return[(0,a.bF)(d,{amount:e.fee,symbol:e.feeSymbol,protocol:e.protocol,"blink-on-change":"","data-cy":"review-fee"},null,8,["amount","symbol","protocol"])]})),_:1},8,["label"]),e.maxFee?((0,a.uX)(),(0,a.Wv)(v,{key:2,label:e.$t("transaction.maxFee")},{value:(0,a.k6)((function(){return[(0,a.bF)(d,{amount:e.maxFee,symbol:e.feeSymbol,protocol:e.protocol,"blink-on-change":"","data-cy":"review-max-fee"},null,8,["amount","symbol","protocol"])]})),_:1},8,["label"])):(0,a.Q3)("",!0)])}n(2892);var i=n(8580),u=n(6095),l=n(34440),c=n(40919),d=n(33521);const v=(0,a.pM)({name:"TransferSendFormBase",components:{ModalHeader:c.A,AccountItem:d.A,DetailsItem:u.A,TokenAmount:l.A},props:{fee:{type:Number,default:0},maxFee:{type:Number,default:void 0},feeSymbol:{type:String,required:!0},customTitle:{type:String,default:""},protocol:{type:String,required:!0}},setup:function(){var e=(0,i.oV)(),t=e.activeAccount;return{activeAccount:t}}});var m=n(66262);const p=(0,m.A)(v,[["render",s],["__scopeId","data-v-cdc4500e"]]),f=p},2915:(e,t,n)=>{n.d(t,{A:()=>c});var a=n(20641),r=n(90033);function o(e,t,n,o,s,i){var u=(0,a.g2)("BtnPlain");return(0,a.uX)(),(0,a.Wv)(u,{class:(0,r.C4)(["max-button",{chosen:e.isMax}]),text:e.$t("common.max"),onClick:t[0]||(t[0]=function(t){return e.$emit("click")})},null,8,["class","text"])}var s=n(77389);const i=(0,a.pM)({name:"BtnMaxAmount",components:{BtnPlain:s.A},props:{isMax:Boolean},emits:["click"]});var u=n(66262);const l=(0,u.A)(i,[["render",o],["__scopeId","data-v-a1d25678"]]),c=l},58227:(e,t,n)=>{n.r(t),n.d(t,{default:()=>Q});var a=n(20641);function r(e,t,n,r,o,s){var i=(0,a.g2)("TransferSendBase");return(0,a.uX)(),(0,a.Wv)(i,{protocol:e.PROTOCOLS.bitcoin,"current-step":e.currentStep,"sending-disabled":e.error||!e.transferData.address||!e.transferData.amount,onClose:e.resolve,onStepNext:e.proceedToNextStep,onStepPrev:e.editTransfer},{content:(0,a.k6)((function(){return[((0,a.uX)(),(0,a.Wv)((0,a.$y)(e.currentStepConfig.component),{ref:"currentRenderedComponent",transferData:e.transferData,"onUpdate:transferData":t[0]||(t[0]=function(t){return e.transferData=t}),onSuccess:e.currentStepConfig.onSuccess,onError:t[1]||(t[1]=function(t){return e.error=t})},null,40,["transferData","onSuccess"]))]})),_:1},8,["protocol","current-step","sending-disabled","onClose","onStepNext","onStepPrev"])}var o=n(41856),s=n(50953),i=n(37772),u=n(87087),l=n(8580),c=n(81282);function d(e,t,n,r,o,s){var i=(0,a.g2)("TokenAmount"),u=(0,a.g2)("DetailsItem"),l=(0,a.g2)("TransferReviewBase");return(0,a.uX)(),(0,a.Wv)(l,{"base-token-symbol":e.BTC_SYMBOL,"transfer-data":e.transferData,loading:e.loading,"show-fiat":"",protocol:e.PROTOCOLS.bitcoin,class:"transfer-review"},{total:(0,a.k6)((function(){return[(0,a.bF)(u,{label:e.$t("common.total"),class:"details-item"},{value:(0,a.k6)((function(){return[(0,a.bF)(i,{amount:+e.transferData.total,symbol:e.BTC_SYMBOL,"high-precision":"",protocol:e.PROTOCOLS.bitcoin,"data-cy":"review-total"},null,8,["amount","symbol","protocol"])]})),_:1},8,["label"])]})),_:1},8,["base-token-symbol","transfer-data","loading","protocol"])}var v=n(34916),m=(n(74423),n(44114),n(2892),n(26099),n(21699),n(75220)),p=n(48156),f=n(75324),b=n(6095),A=n(34440),S=n(74731),g=n(60346),y=function(e,t,n,a){function r(e){return e instanceof n?e:new n((function(t){t(e)}))}return new(n||(n=Promise))((function(n,o){function s(e){try{u(a.next(e))}catch(t){o(t)}}function i(e){try{u(a["throw"](e))}catch(t){o(t)}}function u(e){e.done?n(e.value):r(e.value).then(s,i)}u((a=a.apply(e,t||[])).next())}))};const h=(0,a.pM)({name:"BtcTransferReview",components:{TokenAmount:A.A,DetailsItem:b.A,TransferReviewBase:f.A},model:{prop:"transferData"},props:{transferData:{type:Object,required:!0}},setup:function(e,t){var n=t.emit,a=(0,p.s9)(),r=a.t,o=(0,m.rd)(),c=(0,l.mv)(),d=c.homeRouteName,f=(0,l.U8)(),b=f.openDefaultModal,A=(0,l.oV)(),h=A.activeAccount,w=A.getLastActiveProtocolAccount,T=(0,l.rb)(),x=T.addAccountPendingTransaction,k=(0,s.KR)(!1);function O(e){b({title:r("modals.transaction-failed.title"),icon:"critical",msg:e,textCenter:!0})}function C(e){var t=document.createElement("textarea");return t.textContent=e,t.innerHTML}function _(t){var n,a=t.amount,o=t.recipient;t.selectedAsset;return y(this,void 0,void 0,(0,v.A)().mark((function t(){var s,l,c,d;return(0,v.A)().wrap((function(t){while(1)switch(t.prev=t.next){case 0:return s=u.C.getAdapter(i.yv.bitcoin),t.prev=1,k.value=!0,t.next=5,s.spend((0,g.A)(a).toNumber(),o,Object.assign({fee:null===(n=e.transferData.fee)||void 0===n?void 0:n.toNumber()},h.value));case 5:return l=t.sent,c=l.hash,t.abrupt("return",c);case 10:throw t.prev=10,t.t0=t["catch"](1),d=C(t.t0.message),d.includes("dust")?O(r("modals.transaction-failed.dustError")):O(d),t.t0;case 15:return t.prev=15,k.value=!1,t.finish(15);case 18:case"end":return t.stop()}}),t,null,[[1,10,15,18]])})))}function B(){var t,a;return y(this,void 0,void 0,(0,v.A)().mark((function r(){var s,u,l,c,m,p,f;return(0,v.A)().wrap((function(r){while(1)switch(r.prev=r.next){case 0:if(s=e.transferData,u=s.amount,l=s.address,c=s.selectedAsset,u&&l&&c){r.next=3;break}return r.abrupt("return");case 3:return r.next=5,_({amount:u,recipient:l,selectedAsset:c});case 5:m=r.sent,m&&(p=w(i.yv.bitcoin),f={hash:m,pending:!0,transactionOwner:null===p||void 0===p?void 0:p.address,protocol:i.yv.bitcoin,tx:{amount:Number(u),callerId:null===p||void 0===p?void 0:p.address,contractId:c.contractId,senderId:null===p||void 0===p?void 0:p.address,type:"SpendTx",recipientId:l,arguments:[],fee:null!==(a=null===(t=e.transferData.fee)||void 0===t?void 0:t.toNumber())&&void 0!==a?a:0}},x(null===p||void 0===p?void 0:p.address,f)),o.push({name:d.value}),n("success");case 9:case"end":return r.stop()}}),r)})))}return{PROTOCOLS:i.yv,BTC_SYMBOL:S.HF,loading:k,submit:B}}});var w=n(66262);const T=(0,w.A)(h,[["render",d],["__scopeId","data-v-4efd4083"]]),x=T;n(76918),n(23288),n(38781);var k=n(53751);function O(e,t,n,r,o,s){var i=(0,a.g2)("TransferSendRecipient"),u=(0,a.g2)("BtnMaxAmount"),l=(0,a.g2)("TransferSendAmount"),c=(0,a.g2)("TransactionSpeedPicker"),d=(0,a.g2)("DetailsItem"),v=(0,a.g2)("TransferSendFormBase");return(0,a.uX)(),(0,a.Wv)(v,(0,a.v6)(e.$attrs,{"transfer-data":e.transferData,fee:e.numericFee,"fee-symbol":e.BTC_SYMBOL,protocol:e.PROTOCOLS.bitcoin,"custom-title":e.$t("modals.send.sendAsset",{name:e.BTC_PROTOCOL_NAME}),class:"transfer-send-form"}),{recipient:(0,a.k6)((function(){return[(0,a.bF)(i,{modelValue:e.formModel.address,"onUpdate:modelValue":t[0]||(t[0]=function(t){return e.formModel.address=t}),modelModifiers:{trim:!0},placeholder:e.$t("modals.send.recipientPlaceholderProtocol",{name:e.PROTOCOLS.bitcoin}),errors:e.errors,protocol:e.PROTOCOLS.bitcoin,"validation-rules":{account_address:[e.PROTOCOLS.bitcoin,e.activeNetwork.type]},onOpenQrModal:t[1]||(t[1]=function(t){return e.scanTransferQrCode()})},null,8,["modelValue","placeholder","errors","protocol","validation-rules"])]})),amount:(0,a.k6)((function(){return[(0,a.bF)(l,{modelValue:e.formModel.amount,"onUpdate:modelValue":t[2]||(t[2]=function(t){return e.formModel.amount=t}),errors:e.errors,"selected-asset":e.formModel.selectedAsset,readonly:"",protocol:e.PROTOCOLS.bitcoin,"validation-rules":Object.assign(Object.assign(Object.assign({},+e.balance.minus(e.fee)>0?{max_value:e.max.toString()}:{}),{enough_coin:[e.fee.toString(),e.BTC_SYMBOL]}),e.activeNetwork.type===e.NETWORK_TYPE_TESTNET?{}:{min_value_exclusive:e.toBitcoin(e.DUST_AMOUNT)}),onAssetSelected:e.handleAssetChange},{"label-after":(0,a.k6)((function(){var t,n;return[(0,a.bF)(u,{"is-max":(null===(n=null===(t=e.formModel)||void 0===t?void 0:t.amount)||void 0===n?void 0:n.toString())===e.max.toString(),onClick:e.setMaxAmount},null,8,["is-max","onClick"])]})),_:1},8,["modelValue","errors","selected-asset","protocol","validation-rules","onAssetSelected"])]})),extra:(0,a.k6)((function(){return[(0,a.bo)((0,a.bF)(d,{label:e.$t("modals.send.transactionSpeed")},{value:(0,a.k6)((function(){return[(0,a.bF)(c,{modelValue:e.feeSelectedIndex,"onUpdate:modelValue":t[3]||(t[3]=function(t){return e.feeSelectedIndex=t}),"fee-list":e.feeList},null,8,["modelValue","fee-list"])]})),_:1},8,["label"]),[[k.aG,e.activeNetwork.type!==e.NETWORK_TYPE_TESTNET]])]})),_:1},16,["transfer-data","fee","fee-symbol","protocol","custom-title"])}n(9868);var C=n(14673),_=n(34620),B=n(96881),E=n(84560),F=n(88712),R=n(10483),M=n(55717),I=n(18381),D=n(12263),N=n(2915),P=n(68953),L=n(34394),$=n(95554),W=function(e,t,n,a){function r(e){return e instanceof n?e:new n((function(t){t(e)}))}return new(n||(n=Promise))((function(n,o){function s(e){try{u(a.next(e))}catch(t){o(t)}}function i(e){try{u(a["throw"](e))}catch(t){o(t)}}function u(e){e.done?n(e.value):r(e.value).then(s,i)}u((a=a.apply(e,t||[])).next())}))};const V=(0,a.pM)({name:"BtcTransferSendForm",components:{BtnMaxAmount:N.A,TransactionSpeedPicker:D.A,DetailsItem:b.A,TransferSendAmount:I.A,TransferSendRecipient:M.A,TransferSendFormBase:R.A},model:{prop:"transferData"},props:{transferData:{type:Object,required:!0}},emits:["update:transferData","success","error"],setup:function(e,t){var n=t.emit,r=u.C.getAdapter(i.yv.bitcoin),o=(0,m.lq)(),c=(0,p.s9)(),d=c.t,f=(0,l.fI)(),b=f.activeNetwork,A=(0,l.ty)(),y=A.balance,h=(0,l.oV)(),w=h.activeAccount,T=(0,s.KR)(!1),x=(0,s.KR)(!1),k=(0,_.x)({transferData:e.transferData}),O=k.formModel,R=k.errors,M=k.hasError,I=k.invoiceId,D=k.invoiceContract,N=k.clearPayload,V=k.handleAssetChange,X=k.scanTransferQrCode,U=k.updateFormModelValues,j=(0,s.KR)(1),K=(0,s.KR)(new g.A(2e-5)),Q=(0,s.KR)(new g.A(2e-5)),q=(0,s.KR)(new g.A(2e-5)),Y=(0,a.EW)((function(){return[{fee:K.value,time:3540,label:d("common.transferSpeed.slow")},{fee:Q.value,time:600,label:d("common.transferSpeed.medium")},{fee:q.value,time:25,label:d("common.transferSpeed.fast")}]})),G=(0,a.EW)((function(){return Y.value[j.value].fee})),H=(0,a.EW)((function(){return+G.value.toFixed()})),z=(0,a.EW)((function(){return y.value.minus(G.value)}));function J(){var e,t=Object.assign(Object.assign({},O.value),{fee:G.value,total:H.value+ +((null===(e=O.value)||void 0===e?void 0:e.amount)||0),invoiceId:I.value,invoiceContract:D.value});return n("update:transferData",t),(0,a.dY)()}function Z(){return W(this,void 0,void 0,(0,v.A)().mark((function e(){return(0,v.A)().wrap((function(e){while(1)switch(e.prev=e.next){case 0:if(M.value){e.next=4;break}return e.next=3,J();case 3:n("success");case 4:case"end":return e.stop()}}),e)})))}function ee(){O.value.amount=z.value.isPositive()?z.value.toString():"0"}function te(){return W(this,void 0,void 0,(0,v.A)().mark((function e(){var t,n,a,o,s;return(0,v.A)().wrap((function(e){while(1)switch(e.prev=e.next){case 0:return e.prev=0,e.next=3,r.constructAndSignTx(0,O.value.address||w.value.address,Object.assign({fee:0},w.value));case 3:return t=e.sent.virtualSize(),n=b.value.protocols.bitcoin.nodeUrl,e.next=7,(0,B.x6)("".concat(n,"/fee-estimates"));case 7:a=e.sent["5"],o=new g.A(.5),s=new g.A(Math.ceil(a*t)),K.value=new g.A((0,C.toBitcoin)(Math.ceil(s.minus(s.times(o)).toNumber()))),Q.value=new g.A((0,C.toBitcoin)(s.toNumber()*(b.value.type===i.Oj?2:1))),q.value=new g.A((0,C.toBitcoin)(Math.ceil(s.plus(s.times(o)).toNumber()))),e.next=18;break;case 15:e.prev=15,e.t0=e["catch"](0),E.A.write(e.t0);case 18:case"end":return e.stop()}}),e,null,[[0,15]])})))}var ne=null;return(0,a.sV)((function(){ne=(0,B.mX)((function(){te()}),5e3);var e=o.query;U(Object.assign(Object.assign({},e),{token:e.token}))})),(0,a.hi)((function(){ne&&clearInterval(ne)})),(0,a.wB)(M,(function(e){return n("error",e)}),{deep:!0}),(0,a.wB)(O,(function(){J()}),{deep:!0}),{INFO_BOX_TYPES:F.F,BTC_PROTOCOL_NAME:S.NS,BTC_SYMBOL:S.HF,DUST_AMOUNT:S.uR,PROTOCOLS:i.yv,NETWORK_TYPE_TESTNET:i.Oj,hasMultisigTokenWarning:T,formModel:O,isUrlTippingEnabled:x,activeNetwork:b,fee:G,feeList:Y,feeSelectedIndex:j,numericFee:H,activeAccount:w,errors:R,balance:y,max:z,clearPayload:N,scanTransferQrCode:X,handleAssetChange:V,EditIcon:P.A,DeleteIcon:L.A,PlusCircleIcon:$.A,submit:Z,setMaxAmount:ee,toBitcoin:C.toBitcoin}}}),X=(0,w.A)(V,[["render",O]]),U=X,j=(0,a.pM)({name:i.iP,components:{TransferSendBase:c.A},props:c.g,setup:function(e){var t=(0,l.ZN)(),n=t.marketData,r=(0,l.ty)(),c=r.balance,d=(0,s.KR)(),v=(0,s.KR)(i.x0.form),m=(0,s.KR)(!1),p=(0,s.KR)({address:e.address,amount:e.amount,payload:e.payload,selectedAsset:u.C.getAdapter(i.yv.bitcoin).getDefaultCoin(n.value,+c.value)});function f(){d.value.submit()}function b(){v.value=i.x0.review}function A(){m.value=!1,v.value=i.x0.form}var S=(0,o.A)((0,o.A)({},i.x0.form,{component:U,onSuccess:b}),i.x0.review,{component:x,onSuccess:e.resolve}),g=(0,a.EW)((function(){return S[v.value]}));return{TRANSFER_SEND_STEPS:i.x0,PROTOCOLS:i.yv,currentRenderedComponent:d,steps:S,currentStep:v,error:m,transferData:p,currentStepConfig:g,proceedToNextStep:f,editTransfer:A}}}),K=(0,w.A)(j,[["render",r]]),Q=K}}]);