"use strict";(self["webpackChunksuperhero_wallet"]=self["webpackChunksuperhero_wallet"]||[]).push([[86],{30279:(e,t,n)=>{n.r(t),n.d(t,{default:()=>f});var c=n(66252);function o(e,t,n,o,i,a){var u=(0,c.up)("BtnBox"),s=(0,c.up)("AccountDetailsNavigation"),l=(0,c.up)("AccountDetailsBase");return(0,c.wg)(),(0,c.j4)(l,{class:"account-details"},{buttons:(0,c.w5)((function(){return[e.isNodeMainnet&&e.UNFINISHED_FEATURES?((0,c.wg)(),(0,c.j4)(u,{key:0,icon:e.CreditCardIcon,text:e.$t("common.buy"),href:e.activeAccountSimplexLink,disabled:!e.isOnline},null,8,["icon","text","href","disabled"])):(0,c.kq)("",!0),e.isNodeTestnet?((0,c.wg)(),(0,c.j4)(u,{key:1,icon:e.FaucetIcon,text:e.$t("common.faucet"),href:e.activeAccountFaucetUrl},null,8,["icon","text","href"])):(0,c.kq)("",!0),e.isAeAccount&&e.IS_CORDOVA&&(e.isNodeMainnet||e.isNodeTestnet)?((0,c.wg)(),(0,c.j4)(u,{key:2,icon:e.GlobeSmallIcon,text:e.$t("common.browser"),to:{name:e.ROUTE_APPS_BROWSER}},null,8,["icon","text","to"])):(0,c.kq)("",!0)]})),navigation:(0,c.w5)((function(){return[(0,c.Wm)(s)]})),_:1})}var i=n(33907),a=n(79323),u=n(16982),s=n(28243),l=n(12102),r=n(40200),A=n(39091),d=n(71921),S=n(66506),v=n(59285),m=n(91586),p=n(94308);const I=(0,c.aZ)({name:a.Un,components:{BtnBox:A.Z,AccountDetailsNavigation:r.Z,AccountDetailsBase:l.Z},setup:function(){var e=(0,i.oR)(),t=(0,u.Rc)(),n=t.isOnline,o=(0,u.cn)({store:e}),l=o.isNodeMainnet,r=o.isNodeTestnet,A=(0,u.xe)({store:e}),I=A.activeAccount,N=A.activeAccountSimplexLink,_=A.activeAccountFaucetUrl,f=(0,c.Fl)((function(){return I.value.protocol===a.DJ}));return{CreditCardIcon:d.Z,SwapIcon:S.Z,FaucetIcon:v.Z,GlobeSmallIcon:m.Z,AE_DEX_URL:s.GF,IS_CORDOVA:a.gJ,IS_IOS:a.cj,isOnline:n,isNodeMainnet:l,isNodeTestnet:r,activeAccount:I,activeAccountSimplexLink:N,activeAccountFaucetUrl:_,isAeAccount:f,UNFINISHED_FEATURES:!1,ROUTE_APPS_BROWSER:p.gs}}});var N=n(83744);const _=(0,N.Z)(I,[["render",o]]),f=_}}]);