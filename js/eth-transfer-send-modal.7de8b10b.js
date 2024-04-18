"use strict";(self["webpackChunksuperhero_wallet"]=self["webpackChunksuperhero_wallet"]||[]).push([[551],{38341:(e,t,n)=>{n.r(t),n.d(t,{default:()=>H});var r=n(20641);function a(e,t,n,a,o,u){var s=(0,r.g2)("TransferSendBase");return(0,r.uX)(),(0,r.Wv)(s,{"current-step":e.currentStep,"sending-disabled":e.error||!e.transferData.address||!e.transferData.amount,onClose:e.resolve,onStepNext:e.proceedToNextStep,onStepPrev:e.editTransfer},{content:(0,r.k6)((function(){return[((0,r.uX)(),(0,r.Wv)((0,r.$y)(e.currentStepConfig.component),{ref:"currentRenderedComponent",transferData:e.transferData,"onUpdate:transferData":t[0]||(t[0]=function(t){return e.transferData=t}),onSuccess:e.currentStepConfig.onSuccess,onError:t[1]||(t[1]=function(t){return e.error=t})},null,40,["transferData","onSuccess"]))]})),_:1},8,["current-step","sending-disabled","onClose","onStepNext","onStepPrev"])}var o=n(1287),u=n(50953),s=n(65563),l=n(67440),i=n(42346);function c(e,t,n,a,o,u){var s=(0,r.g2)("TokenAmount"),l=(0,r.g2)("DetailsItem"),i=(0,r.g2)("TransferReviewBase");return(0,r.uX)(),(0,r.Wv)(i,{"base-token-symbol":e.ETH_COIN_SYMBOL,"transfer-data":e.transferData,loading:e.loading,protocol:e.PROTOCOLS.ethereum,"show-fiat":e.isSelectedAssetEthCoin,class:"transfer-review"},{total:(0,r.k6)((function(){return[e.isSelectedAssetEthCoin?((0,r.uX)(),(0,r.Wv)(l,{key:0,label:e.$t("common.total"),class:"details-item"},{value:(0,r.k6)((function(){return[(0,r.bF)(s,{amount:+e.transferData.total,symbol:e.ETH_COIN_SYMBOL,protocol:e.PROTOCOLS.ethereum,"data-cy":"review-total","high-precision":""},null,8,["amount","symbol","protocol"])]})),_:1},8,["label"])):(0,r.Q3)("",!0)]})),_:1},8,["base-token-symbol","transfer-data","loading","protocol","show-fiat"])}var d=n(2327),f=(n(44114),n(2892),n(26099),n(75220)),v=n(46992),m=n(32118),p=n(7595),x=n(60831),h=n(67311),S=n(75303),A=function(e,t,n,r){function a(e){return e instanceof n?e:new n((function(t){t(e)}))}return new(n||(n=Promise))((function(n,o){function u(e){try{l(r.next(e))}catch(t){o(t)}}function s(e){try{l(r["throw"](e))}catch(t){o(t)}}function l(e){e.done?n(e.value):a(e.value).then(u,s)}l((r=r.apply(e,t||[])).next())}))};const P=(0,r.pM)({name:"EthTransferReview",components:{TokenAmount:S.A,DetailsItem:h.A,TransferReviewBase:x.A},model:{prop:"transferData"},props:{transferData:{type:Object,required:!0}},setup:function(e,t){var n=t.emit,a=(0,v.s9)(),o=a.t,i=(0,f.rd)(),c=(0,l.mv)(),x=c.homeRouteName,h=(0,l.U8)(),S=h.openDefaultModal,P=(0,l.oV)(),b=P.getLastActiveProtocolAccount,g=(0,l.rb)(),y=g.addAccountPendingTransaction,T=(0,u.KR)(!1),O=m.C.getAdapter(s.yv.ethereum),w=(0,r.EW)((function(){var t,n;return(null===(n=null===(t=e.transferData)||void 0===t?void 0:t.selectedAsset)||void 0===n?void 0:n.contractId)===O.coinContractId}));function F(e){S({title:o("modals.transaction-failed.msg"),icon:"critical",msg:e})}function k(){var t;return A(this,void 0,void 0,(0,d.A)().mark((function r(){var a,o,u,l,c,f,v;return(0,d.A)().wrap((function(r){while(1)switch(r.prev=r.next){case 0:if(a=e.transferData,o=a.amount,u=a.address,l=a.selectedAsset,o&&u&&l){r.next=3;break}return r.abrupt("return");case 3:if(T.value=!0,f=b(s.yv.ethereum),r.prev=5,w.value){r.next=12;break}return r.next=9,null===(t=O.transferToken)||void 0===t?void 0:t.call(O,Number(o),u,l.contractId,{fromAccount:null===f||void 0===f?void 0:f.address,maxPriorityFeePerGas:e.transferData.maxPriorityFeePerGas,maxFeePerGas:e.transferData.maxFeePerGas});case 9:c=r.sent,r.next=15;break;case 12:return r.next=14,O.spend(Number(o),u,{fromAccount:null===f||void 0===f?void 0:f.address,maxPriorityFeePerGas:e.transferData.maxPriorityFeePerGas,maxFeePerGas:e.transferData.maxFeePerGas});case 14:c=r.sent;case 15:c&&(v={hash:c.hash,pending:!0,transactionOwner:null===f||void 0===f?void 0:f.address,protocol:s.yv.ethereum,tx:{amount:Number(o),callerId:null===f||void 0===f?void 0:f.address,contractId:l.contractId,senderId:null===f||void 0===f?void 0:f.address,type:w.value?"SpendTx":"ContractCallTx",function:"transfer",recipientId:u,arguments:[],fee:0}},y(null===f||void 0===f?void 0:f.address,v)),r.next=22;break;case 18:throw r.prev=18,r.t0=r["catch"](5),F(r.t0.message),r.t0;case 22:return r.prev=22,T.value=!1,r.finish(22);case 25:i.push({name:x.value}),n("success");case 27:case"end":return r.stop()}}),r,null,[[5,18,22,25]])})))}return{PROTOCOLS:s.yv,ETH_COIN_SYMBOL:p.xU,loading:T,isSelectedAssetEthCoin:w,submit:k}}});var b=n(66262);const g=(0,b.A)(P,[["render",c],["__scopeId","data-v-038e842f"]]),y=g;n(76918),n(23288),n(38781);var T=n(53751);function O(e,t,n,a,o,u){var s=(0,r.g2)("TransferSendRecipient"),l=(0,r.g2)("BtnMaxAmount"),i=(0,r.g2)("TransferSendAmount"),c=(0,r.g2)("TransactionSpeedPicker"),d=(0,r.g2)("DetailsItem"),f=(0,r.g2)("TransferSendFormBase");return(0,r.uX)(),(0,r.Wv)(f,(0,r.v6)(e.$attrs,{"transfer-data":e.transferData,fee:e.numericFee,"max-fee":e.numericMaxFee,"fee-symbol":e.ETH_COIN_SYMBOL,protocol:e.PROTOCOLS.ethereum,"custom-title":e.$t("modals.send.sendAsset",{name:e.ETH_COIN_NAME}),class:"transfer-send-form"}),{recipient:(0,r.k6)((function(){return[(0,r.bF)(s,{modelValue:e.formModel.address,"onUpdate:modelValue":t[0]||(t[0]=function(t){return e.formModel.address=t}),modelModifiers:{trim:!0},placeholder:e.recipientPlaceholderText,errors:e.errors,protocol:e.PROTOCOLS.ethereum,"validation-rules":{account_address:[e.PROTOCOLS.ethereum]},onOpenQrModal:e.openScanQrModal},null,8,["modelValue","placeholder","errors","protocol","validation-rules","onOpenQrModal"])]})),amount:(0,r.k6)((function(){return[(0,r.bF)(i,{modelValue:e.formModel.amount,"onUpdate:modelValue":[t[1]||(t[1]=function(t){return e.formModel.amount=t}),t[2]||(t[2]=function(t){return e.shouldUseMaxAmount=!1})],errors:e.errors,"selected-asset":e.formModel.selectedAsset,protocol:e.PROTOCOLS.ethereum,"blink-on-change":e.shouldUseMaxAmount,"validation-rules":Object.assign(Object.assign({},+e.balance.minus(e.maxFee)>0?{max_value:e.max}:{}),{enough_coin:[e.maxFee.toString(),e.ETH_COIN_SYMBOL]}),onAssetSelected:e.handleAssetChange},{"label-after":(0,r.k6)((function(){return[(0,r.bF)(l,{"is-max":e.shouldUseMaxAmount,onClick:e.toggleMaxAmount},null,8,["is-max","onClick"])]})),_:1},8,["modelValue","errors","selected-asset","protocol","blink-on-change","validation-rules","onAssetSelected"])]})),extra:(0,r.k6)((function(){return[(0,r.bo)((0,r.bF)(d,{label:e.$t("modals.send.transactionSpeed")},{value:(0,r.k6)((function(){return[(0,r.bF)(c,{modelValue:e.feeSelectedIndex,"onUpdate:modelValue":t[3]||(t[3]=function(t){return e.feeSelectedIndex=t}),"fee-list":e.feeList},null,8,["modelValue","fee-list"])]})),_:1},8,["label"]),[[T.aG,e.activeNetwork.type!==e.NETWORK_TYPE_TESTNET]])]})),_:1},16,["transfer-data","fee","max-fee","fee-symbol","protocol","custom-title"])}n(28706),n(50113),n(9868);var w=n(37061),F=n(38653),k=n(60346),C=n(28388),E=function(e,t,n,r){function a(e){return e instanceof n?e:new n((function(t){t(e)}))}return new(n||(n=Promise))((function(n,o){function u(e){try{l(r.next(e))}catch(t){o(t)}}function s(e){try{l(r["throw"](e))}catch(t){o(t)}}function l(e){e.done?n(e.value):a(e.value).then(u,s)}l((r=r.apply(e,t||[])).next())}))},M={slow:1,medium:1.5,fast:2};function I(){var e=(0,C.G)(),t=e.ethActiveNetworkSettings,n=(0,v.s9)(),a=n.t,o=(0,u.KR)(0),s=(0,u.KR)(new k.A(0)),l=(0,u.KR)(new k.A(0)),i=(0,u.KR)(new k.A(0)),c=(0,r.EW)((function(){return l.value.multipliedBy(M.slow)})),f=(0,r.EW)((function(){return l.value.multipliedBy(M.medium)})),m=(0,r.EW)((function(){return l.value.multipliedBy(M.fast)})),x=(0,r.EW)((function(){return[{fee:s.value.plus(c.value).multipliedBy(p.un),time:300,label:a("common.transferSpeed.slow"),maxPriorityFee:c.value,maxFeePerGas:i.value.plus(c.value)},{fee:s.value.plus(f.value).multipliedBy(p.un),time:180,label:a("common.transferSpeed.medium"),maxPriorityFee:f.value,maxFeePerGas:i.value.plus(f.value)},{fee:s.value.plus(m.value).multipliedBy(p.un),time:30,label:a("common.transferSpeed.fast"),maxPriorityFee:m.value,maxFeePerGas:i.value.plus(m.value)}]})),h=(0,r.EW)((function(){return x.value[o.value].fee})),S=(0,r.EW)((function(){return x.value[o.value].maxFeePerGas})),A=(0,r.EW)((function(){return x.value[o.value].maxPriorityFee}));function P(){return E(this,void 0,void 0,(0,d.A)().mark((function e(){var n,r,a;return(0,d.A)().wrap((function(e){while(1)switch(e.prev=e.next){case 0:return n=t.value.nodeUrl,r=new w.PT(n),e.next=4,r.calculateFeeData();case 4:a=e.sent,s.value=new k.A((0,F.kX)(a.baseFeePerGas,"ether")),i.value=new k.A((0,F.kX)(a.maxFeePerGas,"ether")),l.value=new k.A((0,F.kX)(a.maxPriorityFeePerGas,"ether"));case 8:case"end":return e.stop()}}),e)})))}return{fee:h,feeList:x,feeSelectedIndex:o,maxFeePerGas:S,maxPriorityFeePerGas:A,updateFeeList:P}}var D=n(92350),_=n(31189);function N(e){var t=e.formModel,n=e.fee,a=(0,l.ty)(),o=a.balance,u=(0,r.EW)((function(){var e,n,r=m.C.getAdapter(s.yv.ethereum);return(null===(n=null===(e=t.value)||void 0===e?void 0:e.selectedAsset)||void 0===n?void 0:n.contractId)===r.coinContractId})),i=(0,r.EW)((function(){var e,n;return new k.A((0,_.Y9)(null===(e=t.value.selectedAsset)||void 0===e?void 0:e.amount,-((null===(n=t.value.selectedAsset)||void 0===n?void 0:n.decimals)||-0))||0)})),c=(0,r.EW)((function(){if(o.value&&u.value){var e=o.value.minus(n.value);return(e.isPositive()?e:0).toString()}return i.value.toString()}));return{max:c}}var R=n(1756),B=n(43863),G=n(29682),W=n(14117),L=n(70654),j=function(e,t,n,r){function a(e){return e instanceof n?e:new n((function(t){t(e)}))}return new(n||(n=Promise))((function(n,o){function u(e){try{l(r.next(e))}catch(t){o(t)}}function s(e){try{l(r["throw"](e))}catch(t){o(t)}}function l(e){e.done?n(e.value):a(e.value).then(u,s)}l((r=r.apply(e,t||[])).next())}))};const V=(0,r.pM)({name:"EthTransferSendForm",components:{BtnMaxAmount:L.A,TransactionSpeedPicker:W.A,DetailsItem:h.A,TransferSendAmount:G.A,TransferSendRecipient:B.A,TransferSendFormBase:R.A},model:{prop:"transferData"},props:{transferData:{type:Object,required:!0}},emits:["update:transferData","success","error"],setup:function(e,t){var n=t.emit,a=(0,f.lq)(),o=(0,v.s9)(),i=o.t,c=(0,l.fI)(),x=c.activeNetwork,h=(0,l.ZN)(),S=h.marketData,A=(0,l.ty)(),P=A.balance,b=I(),g=b.fee,y=b.feeList,T=b.feeSelectedIndex,O=b.maxFeePerGas,w=b.maxPriorityFeePerGas,F=b.updateFeeList,k=(0,l.Sr)(),C=k.accountAssets;function E(e,t){return e?C.value.find((function(t){var n=t.contractId;return n===e})):t?void 0:m.C.getAdapter(s.yv.ethereum).getDefaultCoin(S.value,+P.value)}var M=(0,D.x)({transferData:e.transferData,getSelectedAssetValue:E}),R=M.formModel,B=M.errors,G=M.hasError,W=M.invoiceId,L=M.invoiceContract,V=M.openScanQrModal,K=M.handleAssetChange,U=M.updateFormModelValues,Y=(0,u.KR)(!1),X=(0,r.EW)((function(){return O.value.multipliedBy(p.un)})),H=N({formModel:R,fee:X}),Q=H.max,$=(0,r.EW)((function(){return+g.value.toFixed()})),q=(0,r.EW)((function(){return+X.value.toFixed()})),Z="".concat(i("modals.send.recipientPlaceholderProtocol",{name:s.yv.ethereum})," ").concat(i("modals.send.recipientPlaceholderENS"));function z(){var e,t,a,o=Object.assign(Object.assign({},R.value),{fee:g.value,maxFeePerGas:null===(e=O.value)||void 0===e?void 0:e.toFormat(p.hj),maxPriorityFeePerGas:null===(t=w.value)||void 0===t?void 0:t.toFormat(p.hj),total:$.value+ +((null===(a=R.value)||void 0===a?void 0:a.amount)||0),invoiceId:W.value,invoiceContract:L.value});return n("update:transferData",o),(0,r.dY)()}function J(){return j(this,void 0,void 0,(0,d.A)().mark((function e(){return(0,d.A)().wrap((function(e){while(1)switch(e.prev=e.next){case 0:if(G.value){e.next=4;break}return e.next=3,z();case 3:n("success");case 4:case"end":return e.stop()}}),e)})))}function ee(){Y.value=!Y.value,Y.value&&(R.value.amount=Q.value)}var te=null;return(0,r.sV)((function(){var t;te=(0,_.mX)((function(){F()}),5e3);var n=a.query;U(Object.assign(Object.assign({},n),{token:n.token||(null===(t=e.transferData.selectedAsset)||void 0===t?void 0:t.contractId)}))})),(0,r.hi)((function(){te&&clearInterval(te)})),(0,r.wB)(Q,(function(e){Y.value&&(R.value.amount=e)})),(0,r.wB)(G,(function(e){return n("error",e)}),{deep:!0}),(0,r.wB)(R,(function(){z()}),{deep:!0}),{ETH_COIN_NAME:p.Sf,ETH_COIN_SYMBOL:p.xU,PROTOCOLS:s.yv,NETWORK_TYPE_TESTNET:s.Oj,formModel:R,activeNetwork:x,maxFee:X,feeList:y,recipientPlaceholderText:Z,feeSelectedIndex:T,numericFee:$,numericMaxFee:q,errors:B,balance:P,max:Q,shouldUseMaxAmount:Y,openScanQrModal:V,handleAssetChange:K,submit:J,toggleMaxAmount:ee}}}),K=(0,b.A)(V,[["render",O]]),U=K,Y=(0,r.pM)({name:s.iP,components:{TransferSendBase:i.A},props:Object.assign(Object.assign({},i.g),{tokenContractId:{type:String,default:null}}),setup:function(e){var t=(0,l.Y7)(),n=t.getProtocolAvailableTokens,a=(0,r.EW)((function(){return n(s.yv.ethereum)})),i=(0,u.KR)(),c=(0,u.KR)(s.x0.form),d=(0,u.KR)(!1),f=(0,u.KR)({address:e.address,amount:e.amount,payload:e.payload,selectedAsset:e.tokenContractId?a.value[e.tokenContractId]:void 0});function v(){i.value.submit()}function m(){c.value=s.x0.review}function p(){d.value=!1,c.value=s.x0.form}var x=(0,o.A)((0,o.A)({},s.x0.form,{component:U,onSuccess:m}),s.x0.review,{component:y,onSuccess:e.resolve}),h=(0,r.EW)((function(){return x[c.value]}));return{TRANSFER_SEND_STEPS:s.x0,currentRenderedComponent:i,steps:x,currentStep:c,error:d,transferData:f,currentStepConfig:h,proceedToNextStep:v,editTransfer:p}}}),X=(0,b.A)(Y,[["render",a]]),H=X}}]);