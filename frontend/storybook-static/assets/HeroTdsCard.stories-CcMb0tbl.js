import{H as f}from"./HeroTdsCard-B4QCmvGY.js";import"./jsx-runtime-DFAAy_2V.js";import"./index-Bc2G9s8g.js";import"./createLucideIcon-CS0JafeY.js";const v={title:"Dashboard/HeroTdsCard",component:f,parameters:{layout:"centered"},tags:["autodocs"],argTypes:{currentPpm:{control:{type:"range",min:0,max:2e3,step:10},description:"Nilai TDS/EC sensor saat ini dalam PPM"},temperatureC:{control:{type:"number",min:10,max:45,step:.5},description:"Suhu larutan nutrisi (°C)"},targetPpm:{control:{type:"number",min:200,max:2e3,step:50},description:"Target nutrisi sesuai resep (PPM)"},tolerancePpm:{control:{type:"number",min:10,max:150,step:5},description:"Ambang batas toleransi (+/- PPM)"},isRefillConfirmed:{control:"boolean",description:"Status konfirmasi refill tangki"},hasActiveRecipe:{control:"boolean",description:"Apakah ada resep aktif yang dipilih"},onStartBatch:{action:"onStartBatch clicked"},onOpenRecipeModal:{action:"onOpenRecipeModal clicked"}}},e={args:{currentPpm:1200,temperatureC:25.4,targetPpm:1200,tolerancePpm:50,isRefillConfirmed:!0,hasActiveRecipe:!0}},r={args:{currentPpm:850,temperatureC:26.1,targetPpm:1200,tolerancePpm:50,isRefillConfirmed:!0,hasActiveRecipe:!0}},t={args:{currentPpm:1450,temperatureC:25,targetPpm:1200,tolerancePpm:50,isRefillConfirmed:!0,hasActiveRecipe:!0}},a={args:{currentPpm:600,temperatureC:24.8,targetPpm:1200,tolerancePpm:50,isRefillConfirmed:!1,hasActiveRecipe:!1}};var n,o,s;e.parameters={...e.parameters,docs:{...(n=e.parameters)==null?void 0:n.docs,source:{originalSource:`{
  args: {
    currentPpm: 1200,
    temperatureC: 25.4,
    targetPpm: 1200,
    tolerancePpm: 50,
    isRefillConfirmed: true,
    hasActiveRecipe: true
  }
}`,...(s=(o=e.parameters)==null?void 0:o.docs)==null?void 0:s.source}}};var i,c,p;r.parameters={...r.parameters,docs:{...(i=r.parameters)==null?void 0:i.docs,source:{originalSource:`{
  args: {
    currentPpm: 850,
    temperatureC: 26.1,
    targetPpm: 1200,
    tolerancePpm: 50,
    isRefillConfirmed: true,
    hasActiveRecipe: true
  }
}`,...(p=(c=r.parameters)==null?void 0:c.docs)==null?void 0:p.source}}};var m,l,u;t.parameters={...t.parameters,docs:{...(m=t.parameters)==null?void 0:m.docs,source:{originalSource:`{
  args: {
    currentPpm: 1450,
    temperatureC: 25.0,
    targetPpm: 1200,
    tolerancePpm: 50,
    isRefillConfirmed: true,
    hasActiveRecipe: true
  }
}`,...(u=(l=t.parameters)==null?void 0:l.docs)==null?void 0:u.source}}};var d,P,g;a.parameters={...a.parameters,docs:{...(d=a.parameters)==null?void 0:d.docs,source:{originalSource:`{
  args: {
    currentPpm: 600,
    temperatureC: 24.8,
    targetPpm: 1200,
    tolerancePpm: 50,
    isRefillConfirmed: false,
    hasActiveRecipe: false
  }
}`,...(g=(P=a.parameters)==null?void 0:P.docs)==null?void 0:g.source}}};const S=["InTolerance","BelowTarget","AboveTarget","LockedSafety"];export{t as AboveTarget,r as BelowTarget,e as InTolerance,a as LockedSafety,S as __namedExportsOrder,v as default};
