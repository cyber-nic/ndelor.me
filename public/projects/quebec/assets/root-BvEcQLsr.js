import{r as i,j as t}from"./jsx-runtime-D5FwP9M8.js";import{u as m,a as f,b as y,c as x,_ as g,O as S,M as j,L as w,S as k}from"./components-CKm2L6ko.js";/**
 * @remix-run/react v2.15.2
 *
 * Copyright (c) Remix Software Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.md file in the root directory of this source tree.
 *
 * @license MIT
 */let a="positions";function M({getKey:e,...l}){let{isSpaMode:c}=m(),o=f(),u=y();x({getKey:e,storageKey:a});let p=i.useMemo(()=>{if(!e)return null;let s=e(o,u);return s!==o.key?s:null},[]);if(c)return null;let h=((s,d)=>{if(!window.history.state||!window.history.state.key){let r=Math.random().toString(32).slice(2);window.history.replaceState({key:r},"")}try{let n=JSON.parse(sessionStorage.getItem(s)||"{}")[d||window.history.state.key];typeof n=="number"&&window.scrollTo(0,n)}catch(r){console.error(r),sessionStorage.removeItem(s)}}).toString();return i.createElement("script",g({},l,{suppressHydrationWarning:!0,dangerouslySetInnerHTML:{__html:`(${h})(${JSON.stringify(a)}, ${JSON.stringify(p)})`}}))}const O=()=>[{rel:"preconnect",href:"https://fonts.googleapis.com"},{rel:"preconnect",href:"https://fonts.gstatic.com",crossOrigin:"anonymous"},{rel:"stylesheet",href:"https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap"}];function I({children:e}){return t.jsxs("html",{"data-theme":"dim",lang:"en",children:[t.jsxs("head",{children:[t.jsx("base",{href:"/projects/quebec/"}),t.jsx("meta",{charSet:"utf-8"}),t.jsx("meta",{name:"viewport",content:"width=device-width, initial-scale=1"}),t.jsx(j,{}),t.jsx(w,{})]}),t.jsxs("body",{children:[e,t.jsx(M,{}),t.jsx(k,{})]})]})}function R(){return t.jsx(S,{})}function _(){return t.jsx("p",{children:"Loading..."})}export{_ as HydrateFallback,I as Layout,R as default,O as links};
