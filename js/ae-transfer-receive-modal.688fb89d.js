"use strict";(self["webpackChunksuperhero_wallet"]=self["webpackChunksuperhero_wallet"]||[]).push([[766],{14050:(e,t,s)=>{s.r(t),s.d(t,{default:()=>v});var a=s(66252);function n(e,t,s,n,i,c){var u=(0,a.up)("TransferReceiveBase");return(0,a.wg)(),(0,a.j4)(u,(0,a.dG)(e.$attrs,{heading:e.isMultisig?e.$t("modals.receiveMultisig.title"):e.$t("modals.receive.title",{name:e.$t("modals.receive.funds")}),"account-address":e.activeAccountAddress,"account-name":e.activeAccountName,tokens:e.availableTokens,"disable-asset-selection":e.isMultisig}),null,16,["heading","account-address","account-name","tokens","disable-asset-selection"])}s(68309);var i=s(33907),c=s(79323),u=s(16982),l=s(62724);const o=(0,a.aZ)({name:c.wC,components:{TransferReceiveBase:l.Z},props:{isMultisig:Boolean},setup:function(e){var t=(0,i.oR)(),s=(0,u.Bo)({store:t,pollOnce:!0}),n=s.activeMultisigAccountId,c=(0,u.xe)({store:t}),l=c.activeAccount,o=(0,a.Fl)((function(){return t.state.fungibleTokens.availableTokens})),r=(0,a.Fl)((function(){return e.isMultisig?n.value:l.value.address})),d=(0,a.Fl)((function(){return e.isMultisig?void 0:l.value.name}));return{availableTokens:o,activeAccountAddress:r,activeAccountName:d}}});var r=s(83744);const d=(0,r.Z)(o,[["render",n]]),v=d}}]);