import{e as ce,w as W,aX as pe,bM as k,Q as le,b as B,bN as d,aT as c,aR as w,bO as _,aS as g,bQ as F,bP as C,bT as T,bR as de,bW as X,bX as Z,cq as ue,r as me,b$ as P,c0 as ve,cH as we,ce as ge,bU as he}from"./vendor-BSWI3H7t.js";import{a8 as fe,a as Y,s as _e,u as Ie,aK as Ae,j as q,dM as z,dN as G,df as ye,dO as be,dP as J,l as x,ab as Se,dQ as K,ao as Ee,bn as $e,bU as Re,t as Ce,aa as ke,_ as L,dR as ee,be as Be,dS as ne,dT as te,c2 as Le,p as Oe,aP as Ue,bW as Pe,dU as Ne,dV as Q,d8 as Te,dW as He}from"./index-DzDi9ShH.js";import{C as De}from"./circle-close-LAmECWtz.js";const We={uuid:"010f6849-a205-46a9-a721-c6ca943d479a",name:"Superhero Wallet",icon:"data:image/svg+xml,%3Csvg%20data-v-d6e638c8%3D%22%22%20viewBox%3D%220%200%2034%2024%22%20fill%3D%22none%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20class%3D%22icon%20home-icon%22%3E%3Cpath%20fill-rule%3D%22evenodd%22%20clip-rule%3D%22evenodd%22%20d%3D%22M0%208.09196L9.00282%200H24.9972L34%208.09196L17.0479%2024L0%208.09196ZM10.0085%202.48276H14.893L25.3324%2012.7356L17%2020.5517L3.73521%208.13794L10.0085%202.48276Z%22%20fill%3D%22%231161fe%22%3E%3C%2Fpath%3E%3C%2Fsvg%3E",rdns:"wallet.superhero.com"},qe=`/**
 * Injected into every page the in-app browser loads: an EIP-1193/EIP-6963 provider
 * and a relay for AEX-2 messages. It is injected as is, not bundled.
 *
 * Every frame of the page can reach the native bridge, so each message carries a token
 * that only this closure knows. The session string is replaced before injection.
 */
((session) => {
  // The page may have navigated since \`loadstop\`; the token must not reach another origin.
  if (window.location.origin !== session.origin) return;

  if (window.superheroInAppBrowser) {
    window.superheroInAppBrowser.connect(session.token);
    return;
  }

  const bridge = window.cordova_iab || window.webkit.messageHandlers.cordova_iab;
  let { token } = session;
  const send = (message) => bridge.postMessage(JSON.stringify({ ...message, token }));

  Object.defineProperty(window, 'superheroInAppBrowser', {
    value: Object.freeze({
      connect(newToken) {
        token = newToken;
        send({ kind: 'ready', isNew: false });
      },
    }),
  });
  send({ kind: 'ready', isNew: true });

  const listeners = {};
  const pendingRequests = {};
  let lastRequestId = 0;

  window.addEventListener('message', ({ data, source }) => {
    if (source !== window || !data) return;
    if (data.type === 'to_waellet' && data.data) {
      send({ kind: 'aepp', data: data.data });
    } else if (data.superheroInAppBrowser === 'response' && pendingRequests[data.id]) {
      const { resolve, reject } = pendingRequests[data.id];
      delete pendingRequests[data.id];
      if (data.error) {
        reject(Object.assign(new Error(data.error.message), data.error));
      } else {
        resolve(data.result);
      }
    } else if (data.superheroInAppBrowser === 'event') {
      (listeners[data.event] || []).forEach((listener) => listener(data.data));
    }
  });

  const provider = {
    isSuperheroWallet: true,
    isConnected: () => true,
    request({ method, params }) {
      lastRequestId += 1;
      const id = lastRequestId;
      return new Promise((resolve, reject) => {
        pendingRequests[id] = { resolve, reject };
        send({
          kind: 'request',
          id,
          method,
          params,
        });
      });
    },
    on(event, listener) {
      listeners[event] = [...(listeners[event] || []), listener];
      return provider;
    },
    removeListener(event, listener) {
      listeners[event] = (listeners[event] || []).filter((item) => item !== listener);
      return provider;
    },
  };

  if (window.ethereum === undefined) window.ethereum = provider;
  const announce = () => window.dispatchEvent(new CustomEvent('eip6963:announceProvider', {
    detail: Object.freeze({ info: Object.freeze(session.providerInfo), provider }),
  }));
  window.addEventListener('eip6963:requestProvider', announce);
  announce();
  window.dispatchEvent(new Event('ethereum#initialized'));
})('__SUPERHERO_SESSION__');
`,Fe="beforeload=get,zoomcontrols=no",je="'__SUPERHERO_SESSION__'",Me=3e3;function Ve(e){const o=e.startsWith("superhero://wc")?new URL(e).searchParams.get("uri"):e;return o?.startsWith("wc:")?o:void 0}let N;function ze(){const{getAeSdk:e}=fe(),{activeAccount:o}=Y(),{isAuthenticated:h}=_e(),{modalsOpen:l}=x(),{activeNetwork:f}=Ie(),{permissions:m}=Se(),{connect:p,wcSession:i}=Ae();function a(A){N?.();const v=window.cordova.InAppBrowser.open(A,"_blank",Fe),O=ce();let u,I,r,b=0,S,E,U={accounts:[],chainId:""};function H(){v.close()}function D(n,s){const t=JSON.stringify(n);v.executeScript({code:`window.location.origin === ${t} && window.postMessage(${JSON.stringify(s)}, ${t});`})}function j(){if(b+=1,clearInterval(E),S=void 0,r){const{sdk:n,id:s}=r;r=void 0,n.removeRpcClient(s)}}function M(n,s){let t;const y={connect(R,ie){S=R,t=ie},disconnect(){const R=!!r;clearInterval(E),S=void 0,r=void 0,t?.(),R&&M(n,s)},isConnected:()=>!!S,sendMessage:R=>D(s,{type:"to_aepp",data:R})},$=n.addRpcClient(y);r={sdk:n,id:$},E=ye(()=>{n._getClient($).status===pe.WAITING_FOR_CONNECTION_REQUEST?n.shareWalletInfo($):clearInterval(E)},Me)}async function se(n){j();const s=b,t=await e();s===b&&M(t,n)}async function V(n){const[{result:s},{result:t}]=await Promise.all([z(n,G.getAccounts,{}),z(n,G.getChainId,{})]);return{accounts:s,chainId:t}}async function oe(){if(!u)return;const{origin:n}=u,{accounts:s,chainId:t}=await V(n);if(u?.origin!==n)return;const y=($,R)=>D(n,{superheroInAppBrowser:"event",event:$,data:R});t!==U.chainId&&y(K.chainChanged,t),s.join()!==U.accounts.join()&&y(K.accountsChanged,s),U={accounts:s,chainId:t}}async function ae(n,s){const t=!s&&u?.origin===n.origin;u=n,!(t&&r)&&(await se(n.origin),U=await V(n.origin))}async function re(n,{id:s,method:t,params:y}){const $=await be(n,t,y);D(n,{superheroInAppBrowser:"response",id:s,...$})}v.addEventListener("loadstop",({url:n})=>{const{origin:s,protocol:t}=new URL(n);if(t!=="https:"&&t!=="http:")return;I={token:crypto.randomUUID(),origin:s};const y=JSON.stringify({...I,providerInfo:We});v.executeScript({code:qe.replace(je,()=>y)})}),v.addEventListener("message",({data:n})=>{I&&n.kind==="ready"&&n.token===I.token?(ae(I,n.isNew).catch(q),I=void 0):u&&n.token===u.token&&(n.kind==="aepp"&&n.data?.jsonrpc==="2.0"&&S?.(n.data,u.origin),n.kind==="request"&&re(u.origin,n).catch(q))}),v.addEventListener("beforeload",({url:n},s)=>{const t=Ve(n);t?i.value||p(t,!0):/^https?:/.test(n)&&s(n)}),v.addEventListener("exit",()=>{O.stop(),j(),u=void 0,I=void 0,N===H&&(N=void 0)}),O.run(()=>{W(()=>l.value.length>0,n=>n?v.hide():v.show()),W(h,n=>!n&&H()),W([()=>o.value.globalIdx,()=>f.value.name,m,J],()=>!J.value&&oe().catch(q),{deep:!0})}),N=H}return{openInAppBrowser:a}}const Ge=k({components:{BtnClose:Re,Truncate:$e,AccountSelector:Ee},setup(){const e=le(),{homeRouteName:o}=Ce(),{isLoggedIn:h,activeAccount:l,setActiveAccountByGlobalIdx:f}=Y(),m=B(()=>h.value?o.value:ke);function p(a){a&&f(a.globalIdx)}function i(){e.navigate(`/${m.value}`,"back","push")}return{activeAccount:l,selectAccount:p,close:i}}}),Je={class:"apps-browser-header"},Ke={class:"title"};function Qe(e,o,h,l,f,m){const p=d("AccountSelector"),i=d("Truncate"),a=d("BtnClose");return c(),w("div",Je,[_(p,{"model-value":e.activeAccount.address,"avatar-only":"",onSelectAccount:e.selectAccount},null,8,["model-value","onSelectAccount"]),g("div",Ke,[_(i,{str:e.$t("pages.titles.appsBrowser"),class:"text"},null,8,["str"])]),_(a,{"data-cy":"btn-close",class:"btn-close",onClick:e.close},null,8,["onClick"])])}const Xe=L(Ge,[["render",Qe],["__scopeId","data-v-f4fd3f61"]]),Ze=k({name:"AppsBrowserListItem",props:{name:{type:String,required:!0},image:{type:String,default:null}},setup(e){return{imageUrl:B(()=>ee(e.image))}}}),Ye={class:"apps-browser-list-item",type:"button"},xe={class:"app-image-wrapper"},en=["src","alt"],nn=["textContent"];function tn(e,o,h,l,f,m){return c(),w("button",Ye,[g("div",xe,[e.imageUrl?(c(),w("img",{key:0,src:e.imageUrl,class:"app-image",alt:e.$t("common.altDappFavicon")},null,8,en)):F("",!0)]),g("div",{class:"app-name",textContent:C(e.name)},null,8,nn)])}const sn=L(Ze,[["render",tn],["__scopeId","data-v-58e760e8"]]),on=k({name:"AppsBrowserHistoryListItem",components:{IconWrapper:Be},props:{url:{type:String,required:!0},title:{type:String,default:null},image:{type:String,default:null}},setup(e){return{imageUrl:B(()=>ee(e.image)),GlobeSmallIcon:ne}}}),an={class:"app-image-wrapper"},rn=["src","alt"],cn={class:"app-info"},pn={key:0,class:"app-title"},ln={class:"app-url"};function dn(e,o,h,l,f,m){const p=d("IconWrapper");return c(),w("button",{class:de(["apps-browser-history-list-item",{"no-title":!e.title}]),type:"button"},[g("div",an,[e.image?(c(),w("img",{key:0,src:e.imageUrl,class:"app-image",alt:e.$t("common.altDappFavicon")},null,8,rn)):(c(),T(p,{key:1,icon:e.GlobeSmallIcon,class:"app-image default","is-full":""},null,8,["icon"]))]),g("div",cn,[e.title?(c(),w("div",pn,C(e.title),1)):F("",!0),g("div",ln,C(e.url),1)])],2)}const un=L(on,[["render",dn],["__scopeId","data-v-5bcc4e16"]]),mn=k({name:"AppsBrowserHistory",components:{AppsBrowserHistoryListItem:un},emits:["select-app"],setup(){const{history:e}=te();return{hasHistory:B(()=>e.value.length>0),history:e}}}),vn={key:0,class:"apps-browser-history"},wn={class:"apps-browser-history-title"},gn={class:"apps-browser-list"};function hn(e,o,h,l,f,m){const p=d("AppsBrowserHistoryListItem");return e.hasHistory?(c(),w("div",vn,[g("div",wn,C(e.$t("pages.appsBrowser.recentApps")),1),g("div",gn,[(c(!0),w(X,null,Z(e.history,i=>(c(),w("div",{key:i.cleanPath},[_(p,{title:i.title,image:i.image,url:i.url,onClick:a=>e.$emit("select-app",i)},null,8,["title","image","url","onClick"])]))),128))])])):F("",!0)}const fn=L(mn,[["render",hn],["__scopeId","data-v-718aaede"]]),_n=k({components:{PageWrapper:Pe,AppsBrowserListItem:sn,AppsBrowserHeader:Xe,AppsBrowserHistory:fn,InputField:Ue,BtnIcon:Oe,Field:ue,BackToTop:Le},setup(){const{addHistoryItem:e}=te(),{openModal:o,modalsOpen:h}=x();ze();const l=me(""),f=Ne.filter(({isFeatured:a})=>a),m=B(()=>!!h.value.find(a=>a.name===Q));function p(a){o(Q).then(()=>{const A=Te(a.url).toString();He(A),e({...a,url:A}),l.value=""},()=>{})}function i(a,A){l.value.length>0&&!A&&!m.value&&((a?.target).blur(),p({url:l.value}))}return{customAppURL:l,featuredDapps:f,onSelectApp:p,CloseIcon:De,GlobeSmallIcon:ne,isWarningModalOpened:m,handleEnter:i}}}),In={class:"apps-browser"},An={class:"apps-browser-popular-apps"},yn={class:"apps-browser-list"};function bn(e,o,h,l,f,m){const p=d("AppsBrowserHeader"),i=d("BtnIcon"),a=d("InputField"),A=d("Field"),v=d("AppsBrowserListItem"),O=d("AppsBrowserHistory"),u=d("BackToTop"),I=d("PageWrapper");return c(),T(I,null,{header:P(()=>[_(p)]),default:P(()=>[g("div",In,[_(A,{modelValue:e.customAppURL,"onUpdate:modelValue":o[0]||(o[0]=r=>e.customAppURL=r),name:"customAppURL",rules:{url:e.customAppURL.length>0}},{default:P(({field:r,errorMessage:b,resetField:S})=>[_(a,ve(r,{"model-value":e.customAppURL,class:"input-url",type:"url","show-message-help":"",placeholder:e.$t("pages.appsBrowser.inputPlaceholder"),message:b,onKeydown:we(ge(E=>e.handleEnter(E,b),["stop"]),["enter"])}),{after:P(()=>[e.customAppURL.length?(c(),T(i,{key:1,size:"sm",icon:e.CloseIcon,onClick:E=>S({value:""})},null,8,["icon","onClick"])):(c(),T(he(e.GlobeSmallIcon),{key:0}))]),_:2},1040,["model-value","placeholder","message","onKeydown"])]),_:1},8,["modelValue","rules"]),g("div",An,C(e.$t("pages.appsBrowser.popularApps")),1),g("div",yn,[(c(!0),w(X,null,Z(e.featuredDapps,r=>(c(),w("div",{key:r.name,class:"apps-browser-card"},[_(v,{name:r.name,image:r.image,onClick:b=>e.onSelectApp(r)},null,8,["name","image","onClick"])]))),128))]),_(O,{onSelectApp:e.onSelectApp},null,8,["onSelectApp"])]),_(u)]),_:1})}const Rn=L(_n,[["render",bn],["__scopeId","data-v-5d812ba6"]]);export{Rn as default};
