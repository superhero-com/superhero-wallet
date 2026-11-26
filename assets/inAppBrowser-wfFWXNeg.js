import{r as e}from"./rolldown-runtime-Bjp52BOI.js";import{Nr as t,do as n,so as r}from"./vendor-Cc4nLXwW.js";import{$t as i,Ii as a,Tr as o,dn as s,en as c,fn as l,gn as u,ji as d,na as f,pn as p,ta as m,un as h,vr as g,xr as _}from"./index-0exM044p.js";var v={uuid:`010f6849-a205-46a9-a721-c6ca943d479a`,name:`Superhero Wallet`,icon:`data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2296%22%20height%3D%2296%22%20viewBox%3D%22-3%20-8%2040%2040%22%3E%3Cpath%20fill%3D%22%231161fe%22%20fill-rule%3D%22evenodd%22%20d%3D%22M0%208.092%209.003%200h15.994L34%208.092%2017.048%2024%200%208.092zm10.008-5.61h4.885l10.44%2010.254L17%2020.552%203.735%208.138l6.274-5.655z%22%2F%3E%3C%2Fsvg%3E`,rdns:`wallet.superhero.com`},y=`/**
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
`,b=e({useInAppBrowser:()=>E}),x=`beforeload=get,zoomcontrols=no`,S=`'__SUPERHERO_SESSION__'`,C=3e3;function w(e){let t=e.startsWith(`superhero://wc`)?new URL(e).searchParams.get(`uri`):e;return t?.startsWith(`wc:`)?t:void 0}var T;function E(){let{getAeSdk:e}=i(),{activeAccount:b}=c(),{isAuthenticated:E}=_(),{modalsOpen:D}=o(),{activeNetwork:O}=g(),{permissions:k}=u(),{connect:A,wcSession:j}=h();function M(i){T?.();let o=window.cordova.InAppBrowser.open(i,`_blank`,x),c=n(),u,h,g,_=0,M,N,P={accounts:[],chainId:``};function F(){o.close()}function I(e,t){let n=JSON.stringify(e);o.executeScript({code:`window.location.origin === ${n} && window.postMessage(${JSON.stringify(t)}, ${n});`})}function L(){if(_+=1,clearInterval(N),M=void 0,g){let{sdk:e,id:t}=g;g=void 0,e.removeRpcClient(t)}}function R(e,n){let r,i=e.addRpcClient({connect(e,t){M=e,r=t},disconnect(){let t=!!g;clearInterval(N),M=void 0,g=void 0,r?.(),t&&R(e,n)},isConnected:()=>!!M,sendMessage:e=>I(n,{type:`to_aepp`,data:e})});g={sdk:e,id:i},N=d(()=>{e._getClient(i).status===t.WAITING_FOR_CONNECTION_REQUEST?e.shareWalletInfo(i):clearInterval(N)},C)}async function z(t){L();let n=_,r=await e();n===_&&R(r,t)}async function B(e){let[{result:t},{result:n}]=await Promise.all([s(e,m.getAccounts,{}),s(e,m.getChainId,{})]);return{accounts:t,chainId:n}}async function V(){if(!u)return;let{origin:e}=u,{accounts:t,chainId:n}=await B(e);if(u?.origin!==e)return;let r=(t,n)=>I(e,{superheroInAppBrowser:`event`,event:t,data:n});n!==P.chainId&&r(f.chainChanged,n),t.join()!==P.accounts.join()&&r(f.accountsChanged,t),P={accounts:t,chainId:n}}async function H(e,t){let n=!t&&u?.origin===e.origin;u=e,n&&g||(await z(e.origin),P=await B(e.origin))}async function U(e,{id:t,method:n,params:r}){I(e,{superheroInAppBrowser:`response`,id:t,...await l(e,n,r)})}o.addEventListener(`loadstop`,({url:e})=>{let{origin:t,protocol:n}=new URL(e);if(n!==`https:`&&n!==`http:`)return;h={token:crypto.randomUUID(),origin:t};let r=JSON.stringify({...h,providerInfo:v});o.executeScript({code:y.replace(S,()=>r)})}),o.addEventListener(`message`,({data:e})=>{h&&e.kind===`ready`&&e.token===h.token?(H(h,e.isNew).catch(a),h=void 0):u&&e.token===u.token&&(e.kind===`aepp`&&e.data?.jsonrpc===`2.0`&&M?.(e.data,u.origin),e.kind===`request`&&U(u.origin,e).catch(a))}),o.addEventListener(`beforeload`,({url:e},t)=>{let n=w(e);n?j.value||A(n,!0):/^https?:/.test(e)&&t(e)}),o.addEventListener(`exit`,()=>{c.stop(),L(),u=void 0,h=void 0,T===F&&(T=void 0)}),c.run(()=>{r(()=>D.value.length>0,e=>e?o.hide():o.show()),r(E,e=>!e&&F()),r([()=>b.value.globalIdx,()=>O.value.name,k,p],()=>!p.value&&V().catch(a),{deep:!0})}),T=F}return{openInAppBrowser:M}}export{E as n,b as t};