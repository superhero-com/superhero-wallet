"use strict";(self["webpackChunksuperhero_wallet"]=self["webpackChunksuperhero_wallet"]||[]).push([[3838],{7047:(n,t,e)=>{e.r(t),e.d(t,{default:()=>T});var a=e(20641),o={class:"transaction-details"};function r(n,t,e,r,u,s){var i=(0,a.g2)("TransactionAssetRows"),c=(0,a.g2)("TransactionDetailsBase"),l=(0,a.g2)("IonContent"),v=(0,a.g2)("IonPage");return(0,a.uX)(),(0,a.Wv)(v,null,{default:(0,a.k6)((function(){return[(0,a.bF)(l,{class:"ion-padding ion-content-bg"},{default:(0,a.k6)((function(){return[(0,a.Lk)("div",o,[n.transaction?((0,a.uX)(),(0,a.Wv)(c,{key:0,transaction:n.transaction,amount:n.amount,"amount-total":n.amountTotal,fee:n.fee,hash:n.hash,protocol:n.PROTOCOLS.bitcoin,"show-header":""},{tokens:(0,a.k6)((function(){return[(0,a.bF)(i,{assets:n.assets,"is-rounded":!!n.assets,protocol:n.PROTOCOLS.bitcoin,"icon-size":"rg","multiple-rows":""},null,8,["assets","is-rounded","protocol"])]})),_:1},8,["transaction","amount","amount-total","fee","hash","protocol"])):(0,a.Q3)("",!0)])]})),_:1})]})),_:1})}var u=e(34916),s=(e(44114),e(26099),e(50953)),i=e(75220),c=e(57007),l=e(18743),v=e(69549),d=e(87087),f=e(85854),h=e(74731),p=e(19923),m=e(48397),w=e(26481),k=function(n,t,e,a){function o(n){return n instanceof e?n:new e((function(t){t(n)}))}return new(e||(e=Promise))((function(e,r){function u(n){try{i(a.next(n))}catch(t){r(t)}}function s(n){try{i(a["throw"](n))}catch(t){r(t)}}function i(n){n.done?e(n.value):o(n.value).then(u,s)}i((a=a.apply(n,t||[])).next())}))};const b=(0,a.pM)({components:{TransactionDetailsBase:m.A,TransactionAssetRows:w.A,IonContent:c.W9,IonPage:c.AO},setup:function(){var n=this,t=(0,i.rd)(),e=(0,i.lq)(),o=(0,v.mv)(),r=o.setLoaderVisible,c=e.params.hash,m=e.params.transactionOwner,w=d.C.getAdapter(l.yv.bitcoin),b=(0,s.KR)(),O=(0,a.EW)((function(){var n,t;return(null===(t=null===(n=b.value)||void 0===n?void 0:n.tx)||void 0===t?void 0:t.senderId)!==m})),g=(0,a.EW)((function(){var n,t;return(null===(t=null===(n=b.value)||void 0===n?void 0:n.tx)||void 0===t?void 0:t.fee)||0})),T=(0,a.EW)((function(){var n,t;return(null===(t=null===(n=b.value)||void 0===n?void 0:n.tx)||void 0===t?void 0:t.amount)||0})),x=(0,a.EW)((function(){var n;return(null===(n=b.value)||void 0===n?void 0:n.tx)?(0,p.nG)(b.value,O.value):0})),A=(0,a.EW)((function(){return O.value?l.NX.received:l.NX.sent})),C=(0,a.EW)((function(){return[{amount:T.value,symbol:h.HF,name:h.NS,isReceived:A.value===l.NX.received,contractId:w.coinContractId}]}));return(0,a.wB)(b,(function(n){r(!n)}),{immediate:!0}),(0,a.sV)((function(){return k(n,void 0,void 0,(0,u.A)().mark((function n(){return(0,u.A)().wrap((function(n){while(1)switch(n.prev=n.next){case 0:return n.prev=0,n.next=3,w.fetchTransactionByHash(c,m);case 3:b.value=n.sent,n.next=10;break;case 6:n.prev=6,n.t0=n["catch"](0),r(!1),t.push({name:f.hN});case 10:case"end":return n.stop()}}),n,null,[[0,6]])})))})),{PROTOCOLS:l.yv,amount:T,amountTotal:x,fee:g,hash:c,assets:C,transaction:b}}});var O=e(66262);const g=(0,O.A)(b,[["render",r]]),T=g}}]);