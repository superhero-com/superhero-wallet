"use strict";(self["webpackChunksuperhero_wallet"]=self["webpackChunksuperhero_wallet"]||[]).push([[64],{2114:(e,t,n)=>{n.d(t,{A:()=>b});var a=n(62118),o=n(25706),r=n(95822),s=(n(35666),n(33948),n(60285),n(41637),n(15306),n(41539),n(5212),n(73210),n(69826),n(96647),n(83710),n(39714),n(85827),n(78783),n(23157),n(92222),n(74916),n(2262)),l=n(66252),u=n(79150),i=n(12954),c=n(40223),d=n(79323),p=n(48854),m=n(36605),v=n(71584),f=function(e,t,n,a){function o(e){return e instanceof n?e:new n((function(t){t(e)}))}return new(n||(n=Promise))((function(n,r){function s(e){try{u(a.next(e))}catch(t){r(t)}}function l(e){try{u(a["throw"](e))}catch(t){r(t)}}function u(e){e.done?n(e.value):o(e.value).then(s,l)}u((a=a.apply(e,t||[])).next())}))};function b(e){var t=e.transferData,n=e.getSelectedAssetValue,b=e.protocol,y=(0,s.iH)(t),g=(0,s.iH)(null),w=(0,s.iH)(null),h=(0,u.QT)(),A=h.t,S=(0,c.o)(),C=S.openModal,I=S.openDefaultModal,k=(0,i.cI)(),x=k.errors,W=k.validate,F=(0,l.Fl)((function(){return["address","amount"].some((function(e){return"error"===(0,p.B)(x.value[e]).status}))}));function Z(){y.value.payload=""}function T(e){y.value.selectedAsset=e}function D(e,t){var n=e.account,a=e.amount,o=e.payload,r=e.token,s={},l=t?t(r,y.value.selectedAsset):null;return l&&(s.selectedAsset=l),n&&(s.address=n),a&&(s.amount=a),o&&(s.payload=o),s}function B(e){y.value=Object.assign(Object.assign({},y.value),D(e,n))}function R(e){var t;return f(this,void 0,void 0,regeneratorRuntime.mark((function n(){var s,l,u;return regeneratorRuntime.wrap((function(n){while(1)switch(n.prev=n.next){case 0:return n.next=2,C(d.U0,{title:A("pages.send.scanAddress",{protocolName:v.l.getAdapter(b).protocolName}),icon:"critical"});case 2:if(s=n.sent,"{"!==(null===s||void 0===s?void 0:s.trim().charAt(0))){n.next=29;break}l=null,n.prev=5,l=JSON.parse(s),n.next=15;break;case 9:return n.prev=9,n.t0=n["catch"](5),d.Mw||m.Z.write(n.t0),y.value.address=void 0,I({title:A("modals.invalid-qr-code.msg"),icon:"critical"}),n.abrupt("return");case 15:if(u=e.find((function(e){var t=e.value;return t===l.tokenContract})),u){n.next=20;break}return y.value.address=void 0,I({msg:A("modals.insufficient-balance.msg")}),n.abrupt("return");case 20:return y.value.selectedAsset=e.find((function(e){var t=e.value;return t===l.tokenContract})),y.value.address=l.tokenContract,y.value.amount=(0,p.Yt)(l.amount,-(null===(t=y.value.selectedAsset)||void 0===t?void 0:t.decimals)).toString(),g.value=l.invoiceId,w.value=l.invoiceContract,n.next=27,W();case 27:n.next=33;break;case 29:if(s){n.next=31;break}return n.abrupt("return");case 31:B((0,r.Z)(new URL(s.startsWith(v.l.getAdapter(b).getAccountPrefix())?"".concat(d.Bk,"/account?account=").concat(s.replace("?","&")):s).searchParams.entries()).reduce((function(e,t){var n=(0,o.Z)(t,2),r=n[0],s=n[1];return Object.assign(Object.assign({},e),(0,a.Z)({},r,s))}),{})),g.value=null;case 33:y.value.address||(y.value.address=void 0);case 34:case"end":return n.stop()}}),n,null,[[5,9]])})))}return{formModel:y,errors:x,hasError:F,invoiceId:g,invoiceContract:w,openScanQrModal:R,clearPayload:Z,handleAssetChange:T,validate:W,updateFormModelValues:B}}},14918:(e,t,n)=>{n.d(t,{Z:()=>d});var a=n(66252),o=n(3577),r={class:"modal-header"},s={key:0,class:"title text-heading-2"};function l(e,t,n,l,u,i){return(0,a.wg)(),(0,a.iD)("div",r,[n.title||e.$slots.title?((0,a.wg)(),(0,a.iD)("h2",s,[(0,a.WI)(e.$slots,"title",{},(function(){return[(0,a.Uk)((0,o.zw)(n.title),1)]}),!0)])):(0,a.kq)("",!0),n.subtitle||e.$slots.subtitle?((0,a.wg)(),(0,a.iD)("h3",{key:1,class:(0,o.C_)(["subtitle",{"with-margin":!n.disableSubtitleMargin}])},[(0,a.WI)(e.$slots,"subtitle",{},(function(){return[(0,a.Uk)((0,o.zw)(n.subtitle),1)]}),!0)],2)):(0,a.kq)("",!0)])}const u={props:{title:{type:String,default:""},subtitle:{type:String,default:""},disableSubtitleMargin:Boolean}};var i=n(83744);const c=(0,i.Z)(u,[["render",l],["__scopeId","data-v-0d2f2e9c"]]),d=c},62724:(e,t,n)=>{n.d(t,{Z:()=>$});var a=n(66252),o=n(3577),r={class:"transfer-receive","data-cy":"top-up-container"},s=["textContent"],l={class:"account-row"},u={class:"qrcode-wrapper"},i={class:"address"},c={class:"request-specific-amount"};function d(e,t,n,d,p,m){var v=(0,a.up)("AccountItem"),f=(0,a.up)("QrCode"),b=(0,a.up)("AddressFormatted"),y=(0,a.up)("Scrollable"),g=(0,a.up)("CopyText"),w=(0,a.up)("InputAmount"),h=(0,a.up)("Field"),A=(0,a.up)("BtnMain"),S=(0,a.up)("Modal");return(0,a.wg)(),(0,a.j4)(S,{class:"transfer-receive-base","has-close-button":"","from-bottom":"",onClose:t[3]||(t[3]=function(t){return e.resolve()})},{footer:(0,a.w5)((function(){return[(0,a.Wm)(A,{"data-cy":"copy",variant:e.IS_MOBILE_DEVICE?"muted":"primary",class:"btn-copy",text:e.copied?e.$t("modals.receive.copied"):e.$t("common.copy"),onClick:t[2]||(t[2]=function(t){return e.copyAddress()})},null,8,["variant","text"]),e.IS_MOBILE_DEVICE?((0,a.wg)(),(0,a.j4)(A,{key:0,class:"btn-share",icon:e.ShareIcon,onClick:e.share},{default:(0,a.w5)((function(){return[(0,a.Uk)((0,o.zw)(e.$t("modals.receive.share")),1)]})),_:1},8,["icon","onClick"])):(0,a.kq)("",!0)]})),default:(0,a.w5)((function(){return[(0,a._)("div",r,[(0,a._)("h2",{class:"text-heading-2 text-center",textContent:(0,o.zw)(e.heading)},null,8,s),(0,a._)("div",l,[(0,a.Wm)(v,{address:e.accountAddress,name:e.accountName,protocol:e.protocol},null,8,["address","name","protocol"])]),(0,a._)("div",u,[(0,a.Wm)(f,{value:e.accountAddressToCopy,size:180,class:"qrcode"},null,8,["value"])]),(0,a._)("div",i,[(0,a.Wm)(g,{class:"address-copy","hide-icon":"",disabled:"",copied:e.copied,onClick:t[0]||(t[0]=function(t){return e.copyAddress()})},{default:(0,a.w5)((function(){return[(0,a.Wm)(y,{class:"address-scrollable-area"},{default:(0,a.w5)((function(){return[(0,a.Wm)(b,{address:e.accountAddressToDisplay,"split-address":e.protocol===e.PROTOCOL_BITCOIN&&!e.amount},null,8,["address","split-address"])]})),_:1})]})),_:1},8,["copied"])]),(0,a._)("div",c,[(0,a.Wm)(h,{modelValue:e.amount,"onUpdate:modelValue":t[1]||(t[1]=function(t){return e.amount=t}),name:"amount",rules:{min_value_exclusive:0}},{default:(0,a.w5)((function(t){var n=t.field,o=t.errorMessage;return[(0,a.Wm)(w,(0,a.dG)(n,{"model-value":e.amount,name:"amount",label:e.$t("modals.receive.requestAmount"),message:o,"selected-asset":e.selectedAsset,readonly:e.disableAssetSelection,protocol:e.protocol,onAssetSelected:e.handleAssetChange}),null,16,["model-value","label","message","selected-asset","readonly","protocol","onAssetSelected"])]})),_:1},8,["modelValue"])])])]})),_:1})}n(35666),n(33948),n(41637),n(41539),n(9653),n(96647),n(83710),n(39714),n(92222),n(78783);var p=n(2262),m=n(33907),v=n(79150),f=n(12954),b=n(79323),y=n(84186),g=n(16982),w=n(48854),h=n(28243),A=n(71584),S=n(98866),C={ref:"canvas"};function I(e,t,n,o,r,s){return(0,a.wg)(),(0,a.iD)("div",C,null,512)}n(32564);var k=n(91915),x=n.n(k);const W="data:image/png;base64,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",F=(0,a.aZ)({name:"QrCode",props:{value:{type:String,required:!0},size:{type:Number,required:!0}},setup:function(e){var t=(0,p.iH)(),n=(0,p.iH)(),o=new(x())({data:e.value,width:e.size,height:e.size,margin:0,qrOptions:{typeNumber:10,mode:"Byte",errorCorrectionLevel:"M"},imageOptions:{hideBackgroundDots:!1,imageSize:.7,margin:0},image:W});return(0,a.YP)((function(){return e.value}),(function(e){n.value&&clearTimeout(n.value),n.value=setTimeout((function(){o.update({data:e})}),500)})),(0,a.bv)((function(){return o.append(t.value)})),{canvas:t}}});var Z=n(83744);const T=(0,Z.Z)(F,[["render",I]]),D=T;var B={class:"scrollable"},R={class:"scrollable-inner styled-scrollbar"};function L(e,t){return(0,a.wg)(),(0,a.iD)("div",B,[(0,a._)("div",R,[(0,a.WI)(e.$slots,"default",{},void 0,!0)])])}const M={},O=(0,Z.Z)(M,[["render",L],["__scopeId","data-v-a7c4f0d6"]]),N=O;var _=n(44423),j=n(42382),P=n(20706),V=n(43622),H=n(33170),q={width:"20",height:"20",viewBox:"0 0 20 20",fill:"none",xmlns:"http://www.w3.org/2000/svg",class:"icon"},E=(0,a._)("path",{d:"M10.6653 16.8209C11.0883 16.8209 11.419 16.6594 11.8266 16.2748L17.918 10.5603C18.218 10.2757 18.3333 9.94501 18.3333 9.66044C18.3333 9.36817 18.218 9.04515 17.918 8.76058L11.8266 3.08453C11.3806 2.6692 11.0883 2.5 10.6807 2.5C10.0654 2.5 9.62699 2.97685 9.62699 3.57676V6.3148H9.43471C4.12783 6.3148 1.66667 9.72197 1.66667 15.3057C1.66667 16.2825 2.08199 16.7901 2.62037 16.7901C3.028 16.7901 3.40487 16.6594 3.70482 16.0979C4.91233 13.8521 6.62745 13.0291 9.43471 13.0291H9.62699L9.62699 15.7826C9.62699 16.3825 10.0654 16.8209 10.6653 16.8209ZM11.1575 14.8366C11.0883 14.8366 11.0422 14.7904 11.0422 14.7135V11.8755C11.0422 11.6986 10.9652 11.6217 10.7883 11.6217H9.80388C6.28135 11.6217 4.03554 12.7369 3.1126 14.6597C3.08953 14.7058 3.06646 14.7289 3.03569 14.7289C3.00493 14.7289 2.98185 14.7058 2.98185 14.652C3.10491 10.9833 4.8508 7.71458 9.80388 7.71458H10.7883C10.9652 7.71458 11.0422 7.63767 11.0422 7.46078V4.55353C11.0422 4.48431 11.0883 4.43816 11.1575 4.43816C11.2037 4.43816 11.2498 4.46124 11.2883 4.49969L16.5413 9.51431C16.5951 9.57583 16.6182 9.61429 16.6182 9.66044C16.6182 9.70658 16.6028 9.74504 16.5413 9.80657L11.2806 14.775C11.2421 14.8135 11.196 14.8366 11.1575 14.8366Z",fill:"white"},null,-1),U=[E];function z(e,t){return(0,a.wg)(),(0,a.iD)("svg",q,U)}const G={},Q=(0,Z.Z)(G,[["render",z]]),X=Q;var J=function(e,t,n,a){function o(e){return e instanceof n?e:new n((function(t){t(e)}))}return new(n||(n=Promise))((function(n,r){function s(e){try{u(a.next(e))}catch(t){r(t)}}function l(e){try{u(a["throw"](e))}catch(t){r(t)}}function u(e){e.done?n(e.value):o(e.value).then(s,l)}u((a=a.apply(e,t||[])).next())}))};const Y=(0,a.aZ)({name:"TransferReceiveBase",components:{InputAmount:S.Z,Modal:_.Z,QrCode:D,BtnMain:j.Z,Scrollable:N,AddressFormatted:P.Z,CopyText:V.Z,AccountItem:H.Z,Field:f.gN},props:{resolve:{type:Function,default:function(){return null}},tokenContractId:{type:[String,Number],default:null},heading:{type:String,default:""},accountAddress:{type:String,default:null},accountName:{type:String,default:null},tokens:{type:Object,default:function(){return{}}},disableAssetSelection:Boolean,protocol:{type:String,default:b.DJ}},setup:function(e){var t=(0,m.oR)(),n=(0,v.QT)(),o=n.t,r=(0,g.xe)({store:t}),s=r.activeAccount,l=(0,g.FU)(),u=l.copied,i=l.copy,c=(0,p.iH)(""),d=(0,p.iH)(null);function f(e){var t,n;if(!c.value||+c.value<=0)return{};var a=(null===(t=d.value)||void 0===t?void 0:t.contractId)===h.ik?h.WJ:(null===(n=d.value)||void 0===n?void 0:n.contractId)||h.WJ,o={token:a,amount:c.value.toString()};return e?Object.assign(Object.assign({},o),{account:e}):o}function S(e){return e?y.t.createUrl("/account","transferSend",f(e)):""}var C=(0,a.Fl)((function(){return c.value&&+c.value>0?S(e.accountAddress):e.accountAddress})),I=(0,a.Fl)((function(){return c.value&&+c.value>0?"".concat(e.accountAddress,"?").concat(new URLSearchParams(f()).toString()):e.accountAddress}));function k(){return J(this,void 0,void 0,regeneratorRuntime.mark((function t(){var n,a,r,l,u;return regeneratorRuntime.wrap((function(t){while(1)switch(t.prev=t.next){case 0:return n=s.value.address,a=S(n),r=A.l.getAdapter(e.protocol),l=r.protocolName,u=c.value&&+c.value>0?o("modals.receive.shareTextNoAmount",{protocolName:l,address:n,walletLink:a}):o("modals.receive.shareTextWithAmount",{coinSymbol:A.l.getAdapter(e.protocol).getCoinSymbol(!1),protocolName:l,address:n,walletLink:a,amount:c.value}),t.next=6,(0,w.TM)(u);case 6:case"end":return t.stop()}}),t)})))}function x(e){d.value=e}function W(){i(C.value)}return function(){!e.disableAssetSelection&&e.tokenContractId&&e.tokens[e.tokenContractId]&&x(e.tokens[e.tokenContractId])}(),{PROTOCOL_BITCOIN:b.ou,IS_MOBILE_DEVICE:b.ry,ShareIcon:X,amount:c,selectedAsset:d,share:k,handleAssetChange:x,copyAddress:W,copied:u,activeAccount:s,accountAddressToDisplay:I,accountAddressToCopy:C}}}),K=(0,Z.Z)(Y,[["render",d],["__scopeId","data-v-c9d333f4"]]),$=K},69009:(e,t,n)=>{n.d(t,{Z:()=>b});var a=n(66252),o=n(49963),r={class:"relative"};function s(e,t,n,s,l,u){var i=(0,a.up)("BtnMain"),c=(0,a.up)("Modal");return(0,a.wg)(),(0,a.j4)(c,{class:"transfer-send-base","has-close-button":"","from-bottom":"","body-without-padding-bottom":e.currentStep===e.TRANSFER_SEND_STEPS.form,onClose:t[0]||(t[0]=function(t){return e.$emit("close")})},{footer:(0,a.w5)((function(){return[e.showEditButton?((0,a.wg)(),(0,a.j4)(i,{key:0,variant:"muted",text:e.$t("common.edit"),class:"button-action-secondary","data-cy":"edit",onClick:e.editTransfer},null,8,["text","onClick"])):(0,a.kq)("",!0),(0,a.Wm)(i,{class:"button-action-primary",disabled:!e.isConnected||e.primaryButtonDisabled,icon:e.showSendButton&&e.hideArrowSendIcon?e.ArrowSendIcon:null,text:e.primaryButtonText,"data-cy":"next-step-button",onClick:e.proceedToNextStep},null,8,["disabled","icon","text","onClick"])]})),default:(0,a.w5)((function(){return[(0,a._)("div",r,[(0,a.Wm)(o.uT,{name:"fade-between"},{default:(0,a.w5)((function(){return[(0,a.WI)(e.$slots,"content",{},void 0,!0)]})),_:3})])]})),_:3},8,["body-without-padding-bottom"])}n(26699),n(32023);var l=n(79150),u=n(32720),i=n(79323),c=n(66588),d=n(44423),p=n(42382);const m=(0,a.aZ)({name:"TransferSendBase",components:{Modal:d.Z,BtnMain:p.Z},props:{editTransfer:{type:Function,default:function(){return null}},proceedToNextStep:{type:Function,default:function(){return null}},customPrimaryButtonText:{type:String,default:""},currentStep:{type:String,required:!0},primaryButtonDisabled:Boolean,hideArrowSendIcon:Boolean},setup:function(e){var t=(0,l.QT)(),n=t.t,o=(0,u.X_)("isConnected"),r=(0,a.Fl)((function(){return[i.Nz.review,i.Nz.reviewTip].includes(e.currentStep)})),s=(0,a.Fl)((function(){return e.currentStep===i.Nz.review})),d=(0,a.Fl)((function(){return e.customPrimaryButtonText?e.customPrimaryButtonText:s.value?n("common.send"):n("common.next")}));return{isConnected:o,primaryButtonText:d,showEditButton:r,showSendButton:s,ArrowSendIcon:c.Z,TRANSFER_SEND_STEPS:i.Nz}}});var v=n(83744);const f=(0,v.Z)(m,[["render",s],["__scopeId","data-v-52fd5b0a"]]),b=f},12120:(e,t,n)=>{n.d(t,{Z:()=>h});n(68309),n(56977);var a=n(66252),o={class:"transfer-review-base"},r={key:0};function s(e,t,n,s,l,u){var i=(0,a.up)("ModalHeader"),c=(0,a.up)("AvatarWithChainName"),d=(0,a.up)("DetailsItem"),p=(0,a.up)("TokenAmount"),m=(0,a.up)("PayloadDetails"),v=(0,a.up)("Loader");return(0,a.wg)(),(0,a.iD)("div",o,[(0,a.Wm)(i,{title:e.title,subtitle:e.withoutSubtitle?null:e.$t("pages.send.checkalert")},null,8,["title","subtitle"]),(0,a.WI)(e.$slots,"subheader",{},void 0,!0),(0,a.Wm)(d,{label:e.senderLabel,"data-cy":"review-sender"},{value:(0,a.w5)((function(){return[(0,a.Wm)(c,{address:e.activeAccount.address,name:e.activeAccount.name,"show-address":!e.isRecipientName},null,8,["address","name","show-address"])]})),_:1},8,["label"]),e.$slots.recipient?((0,a.wg)(),(0,a.iD)("div",r,[(0,a.WI)(e.$slots,"recipient",{},void 0,!0)])):((0,a.wg)(),(0,a.j4)(d,{key:1,class:"details-item","data-cy":"review-recipient",label:e.$t("pages.send.recipient")},{value:(0,a.w5)((function(){return[(0,a.Wm)(c,{address:e.transferData.address,name:e.avatarName,"show-address":!e.avatarName},null,8,["address","name","show-address"])]})),_:1},8,["label"])),(0,a.Wm)(d,{label:e.amountLabel,class:"details-item"},{value:(0,a.w5)((function(){return[(0,a.Wm)(p,{amount:+e.transferData.amount,symbol:e.tokenSymbol,protocol:e.protocol,"hide-fiat":!e.showFiat},null,8,["amount","symbol","protocol","hide-fiat"])]})),_:1},8,["label"]),(0,a.WI)(e.$slots,"additional-fee",{},void 0,!0),(0,a.Wm)(d,{class:"details-item",label:e.$t("transaction.fee")},{value:(0,a.w5)((function(){return[(0,a.Wm)(p,{amount:+e.transferData.fee.toFixed(),symbol:e.baseTokenSymbol,protocol:e.protocol,"high-precision":"","data-cy":"review-fee"},null,8,["amount","symbol","protocol"])]})),_:1},8,["label"]),(0,a.WI)(e.$slots,"total",{},void 0,!0),(0,a.Wm)(m,{class:"details-item",payload:e.transferData.payload},null,8,["payload"]),e.loading?((0,a.wg)(),(0,a.j4)(v,{key:2})):(0,a.kq)("",!0)])}var l=n(33907),u=n(16982),i=n(28243),c=n(34601),d=n(57940),p=n(95951),m=n(73186),v=n(53695),f=n(14918),b=n(91103);const y=(0,a.aZ)({name:"TransferReviewBase",components:{PayloadDetails:b.Z,ModalHeader:f.Z,AvatarWithChainName:v.Z,DetailsItem:p.Z,TokenAmount:m.Z},props:{title:{type:String,default:(0,d.tg)("pages.send.reviewtx")},senderLabel:{type:String,default:(0,d.tg)("pages.send.sender")},amountLabel:{type:String,default:(0,d.tg)("common.amount")},baseTokenSymbol:{type:String,required:!0},transferData:{type:Object,required:!0},protocol:{type:String,required:!0},recipientAddress:{type:String,default:null},avatarName:{type:String,default:null},withoutSubtitle:Boolean,loading:Boolean,showFiat:Boolean},setup:function(e){var t=(0,l.oR)(),n=(0,u.xe)({store:t}),o=n.activeAccount,r=(0,a.Fl)((function(){return e.recipientAddress&&(0,c.qi)(e.recipientAddress)})),s=(0,a.Fl)((function(){var t;return(null===(t=e.transferData.selectedAsset)||void 0===t?void 0:t.symbol)||"-"}));return{AE_CONTRACT_ID:i.ik,isRecipientName:r,tokenSymbol:s,activeAccount:o}}});var g=n(83744);const w=(0,g.Z)(y,[["render",s],["__scopeId","data-v-2c4bcba8"]]),h=w},58663:(e,t,n)=>{n.d(t,{Z:()=>p});var a=n(66252),o={class:"transfer-send-amount"};function r(e,t,n,r,s,l){var u=(0,a.up)("InputAmount"),i=(0,a.up)("Field");return(0,a.wg)(),(0,a.iD)("div",o,[(0,a.Wm)(i,{ref:"amountField",name:"amount","model-value":e.modelValue,rules:Object.assign({required:!0,min_value_exclusive:0},e.validationRules)},{default:(0,a.w5)((function(n){var o=n.field;return[(0,a.Wm)(u,(0,a.dG)(o,{"model-value":e.modelValue,name:"amount","data-cy":"amount",class:"amount-input","show-tokens-with-balance":"",label:e.customLabel||e.$t("common.amount"),message:e.amountMessage,protocol:e.protocol,readonly:e.readonly,"selected-asset":e.selectedAsset,"onUpdate:modelValue":t[0]||(t[0]=function(t){return e.$emit("update:modelValue",t)}),onAssetSelected:t[1]||(t[1]=function(t){return e.$emit("assetSelected",t)})}),{"label-after":(0,a.w5)((function(){return[(0,a.WI)(e.$slots,"label-after",{},void 0,!0)]})),_:2},1040,["model-value","label","message","protocol","readonly","selected-asset"])]})),_:3},8,["model-value","rules"])])}var s=n(12954),l=n(98866),u=n(48854);const i=(0,a.aZ)({components:{InputAmount:l.Z,Field:s.gN},props:{modelValue:{type:String,default:""},validationRules:{type:Object,default:function(){}},selectedAsset:{type:Object,default:function(){}},errors:{type:Object,required:!0},customLabel:{type:String,default:""},readonly:Boolean,protocol:{type:String,required:!0}},emits:["update:modelValue","asset-selected"],setup:function(e){var t=(0,a.Fl)((function(){return(0,u.B)(e.errors.amount)}));return{amountMessage:t}}});var c=n(83744);const d=(0,c.Z)(i,[["render",r],["__scopeId","data-v-0cfda33e"]]),p=d},25244:(e,t,n)=>{n.d(t,{Z:()=>w});var a=n(66252),o=n(49963),r={class:"transfer-send-recipient"},s={class:"status"};function l(e,t,n,l,u,i){var c=(0,a.up)("QrScanIcon"),d=(0,a.up)("InputField"),p=(0,a.up)("Field"),m=(0,a.up)("UrlStatus");return(0,a.wg)(),(0,a.iD)("div",r,[(0,a.Wm)(p,{name:"address",rules:Object.assign({required:!0,not_same_as:[e.activeAccount.address,e.protocol]},e.validationRules)},{default:(0,a.w5)((function(n){var o=n.field;return[(0,a.Wm)(d,(0,a.dG)(o,{"model-value":e.modelValue,name:"address","data-cy":"address","show-help":"","show-message-help":"",label:e.$t("modals.send.recipientLabel"),placeholder:e.placeholder,message:e.addressMessage,"onUpdate:modelValue":t[1]||(t[1]=function(t){return e.$emit("update:modelValue",t)}),onHelp:t[2]||(t[2]=function(t){return e.showRecipientHelp()})}),{"label-after":(0,a.w5)((function(){return[(0,a._)("a",{class:"scan-button","data-cy":"scan-button",onClick:t[0]||(t[0]=function(t){return e.$emit("openQrModal")})},[(0,a.Wm)(c)])]})),_:2},1040,["model-value","label","placeholder","message"])]})),_:1},8,["rules"]),(0,a._)("div",s,[(0,a.wy)((0,a.Wm)(m,{status:e.urlStatus},null,8,["status"]),[[o.F8,e.isTipUrl]])])])}n(21703),n(96647);var u=n(33907),i=n(12954),c=n(48854),d=n(16982),p=n(98857),m=n(54022),v=n(83299),f=n(79323);const b=(0,a.aZ)({components:{InputField:m.Z,UrlStatus:p.Z,Field:i.gN,QrScanIcon:v.Z},props:{isTipUrl:Boolean,modelValue:{type:String,default:""},placeholder:{type:String,default:""},protocol:{type:String,default:f.DJ},validationRules:{type:Object,default:function(){}},errors:{type:Object,required:!0}},emits:["openQrModal"],setup:function(e){var t=(0,u.oR)(),n=(0,d.ol)(),o=n.openModal,r=(0,d.xe)({store:t}),s=r.activeAccount,l=(0,a.Fl)((function(){return t.getters["tipUrl/status"](e.modelValue)})),i=(0,a.Fl)((function(){if(e.isTipUrl)switch(l.value){case"verified":return{status:"success",text:"",hideMessage:!0};case"not-secure":return{status:"warning",text:"",hideMessage:!0};case"not-verified":return{status:"warning",text:"",hideMessage:!0};case"blacklisted":return{status:"error",text:"",hideMessage:!0};default:throw new Error("Unknown url status: ".concat(l.value))}return(0,c.B)(e.errors.address)}));function p(){o(f.WW,{protocol:e.protocol})}return{urlStatus:l,activeAccount:s,addressMessage:i,showRecipientHelp:p}}});var y=n(83744);const g=(0,y.Z)(b,[["render",l],["__scopeId","data-v-45b29158"]]),w=g},89234:(e,t,n)=>{n.d(t,{Z:()=>b});n(68309);var a=n(66252),o={class:"transfer-send-base"},r={class:"account-row"};function s(e,t,n,s,l,u){var i=(0,a.up)("ModalHeader"),c=(0,a.up)("AccountItem"),d=(0,a.up)("TokenAmount"),p=(0,a.up)("DetailsItem");return(0,a.wg)(),(0,a.iD)("div",o,[e.$slots.header?(0,a.WI)(e.$slots,"header",{key:0},void 0,!0):((0,a.wg)(),(0,a.iD)(a.HY,{key:1},[(0,a.Wm)(i,{title:e.customTitle||e.$t("modals.send.sendTitle")},null,8,["title"]),(0,a._)("div",r,[(0,a.Wm)(c,{address:e.activeAccount.address,protocol:e.activeAccount.protocol,name:e.activeAccount.name,size:"md"},null,8,["address","protocol","name"])])],64)),(0,a.WI)(e.$slots,"recipient",{},void 0,!0),(0,a.WI)(e.$slots,"amount",{},void 0,!0),(0,a.WI)(e.$slots,"extra",{},void 0,!0),(0,a.Wm)(p,{label:e.$t("transaction.fee")},{value:(0,a.w5)((function(){return[(0,a.Wm)(d,{amount:e.fee,symbol:e.feeSymbol,protocol:e.protocol,"data-cy":"review-fee"},null,8,["amount","symbol","protocol"])]})),_:1},8,["label"])])}n(9653);var l=n(33907),u=n(16982),i=n(95951),c=n(73186),d=n(14918),p=n(33170);const m=(0,a.aZ)({name:"TransferSendFormBase",components:{ModalHeader:d.Z,AccountItem:p.Z,DetailsItem:i.Z,TokenAmount:c.Z},props:{fee:{type:Number,default:0},feeSymbol:{type:String,required:!0},customTitle:{type:String,default:""},protocol:{type:String,required:!0}},setup:function(){var e=(0,l.oR)(),t=(0,u.xe)({store:e}),n=t.activeAccount;return{activeAccount:n}}});var v=n(83744);const f=(0,v.Z)(m,[["render",s],["__scopeId","data-v-73748b0e"]]),b=f}}]);