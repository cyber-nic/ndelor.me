import{W as E,X as b,Y as P,e as N,Z as q,_ as H,$ as M,i as $,a0 as L,R as B,a1 as C,a2 as j,a3 as T,n as w,m as k,l as G,u as p,a4 as K,a5 as Q,a6 as X,a7 as Z,a8 as x,a9 as z,Q as F,q as J,G as U,k as R,K as ee,x as re}from"./runtime.Ci6AZbhU.js";import{b as te}from"./disclose-version.CAucfrl3.js";const ae=["touchstart","touchmove"];function ne(e){return ae.includes(e)}let A=!1;function se(){A||(A=!0,document.addEventListener("reset",e=>{Promise.resolve().then(()=>{var r;if(!e.defaultPrevented)for(const a of e.target.elements)(r=a.__on_r)==null||r.call(a)})},{capture:!0}))}function I(e){var r=P,a=N;E(null),b(null);try{return e()}finally{E(r),b(a)}}function ce(e,r,a,i=a){e.addEventListener(r,()=>I(a));const n=e.__on_r;n?e.__on_r=()=>{n(),i(!0)}:e.__on_r=()=>i(!0),se()}const ie=new Set,D=new Set;function oe(e,r,a,i){function n(t){if(i.capture||y.call(r,t),!t.cancelBubble)return I(()=>a.call(this,t))}return e.startsWith("pointer")||e.startsWith("touch")||e==="wheel"?H(()=>{r.addEventListener(e,n,i)}):r.addEventListener(e,n,i),n}function _e(e,r,a,i,n){var t={capture:i,passive:n},u=oe(e,r,a,t);(r===document.body||r===window||r===document)&&q(()=>{r.removeEventListener(e,u,t)})}function y(e){var O;var r=this,a=r.ownerDocument,i=e.type,n=((O=e.composedPath)==null?void 0:O.call(e))||[],t=n[0]||e.target,u=0,d=e.__root;if(d){var c=n.indexOf(d);if(c!==-1&&(r===document||r===window)){e.__root=r;return}var h=n.indexOf(r);if(h===-1)return;c<=h&&(u=c)}if(t=n[u]||e.target,t!==r){M(e,"currentTarget",{configurable:!0,get(){return t||a}});var m=P,f=N;E(null),b(null);try{for(var s,o=[];t!==null;){var l=t.assignedSlot||t.parentNode||t.host||null;try{var _=t["__"+i];if(_!==void 0&&!t.disabled)if($(_)){var[W,...Y]=_;W.apply(t,[e,...Y])}else _.call(t,e)}catch(g){s?o.push(g):s=g}if(e.cancelBubble||l===r||l===null)break;t=l}if(s){for(let g of o)queueMicrotask(()=>{throw g});throw s}}finally{e.__root=r,delete e.currentTarget,E(m),b(f)}}}function de(e,r){var a=r==null?"":typeof r=="object"?r+"":r;a!==(e.__t??(e.__t=e.nodeValue))&&(e.__t=a,e.nodeValue=a==null?"":a+"")}function ue(e,r){return V(e,r)}function he(e,r){L(),r.intro=r.intro??!1;const a=r.target,i=R,n=p;try{for(var t=B(a);t&&(t.nodeType!==8||t.data!==C);)t=j(t);if(!t)throw T;w(!0),k(t),G();const u=V(e,{...r,anchor:t});if(p===null||p.nodeType!==8||p.data!==K)throw Q(),T;return w(!1),u}catch(u){if(u===T)return r.recover===!1&&X(),L(),Z(a),w(!1),ue(e,r);throw u}finally{w(i),k(n)}}const v=new Map;function V(e,{target:r,anchor:a,props:i={},events:n,context:t,intro:u=!0}){L();var d=new Set,c=f=>{for(var s=0;s<f.length;s++){var o=f[s];if(!d.has(o)){d.add(o);var l=ne(o);r.addEventListener(o,y,{passive:l});var _=v.get(o);_===void 0?(document.addEventListener(o,y,{passive:l}),v.set(o,1)):v.set(o,_+1)}}};c(x(ie)),D.add(c);var h=void 0,m=z(()=>{var f=a??r.appendChild(F());return J(()=>{if(t){U({});var s=re;s.c=t}n&&(i.$$events=n),R&&te(f,null),h=e(f,i)||{},R&&(N.nodes_end=p),t&&ee()}),()=>{var l;for(var s of d){r.removeEventListener(s,y);var o=v.get(s);--o===0?(document.removeEventListener(s,y),v.delete(s)):v.set(s,o)}D.delete(c),f!==a&&((l=f.parentNode)==null||l.removeChild(f))}});return S.set(h,m),h}let S=new WeakMap;function ve(e,r){const a=S.get(e);return a?(S.delete(e),a(r)):Promise.resolve()}export{se as a,_e as e,he as h,ce as l,ue as m,de as s,ve as u};