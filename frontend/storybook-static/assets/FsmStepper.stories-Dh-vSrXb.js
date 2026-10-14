import{F as d}from"./FsmStepper-DkAlXR6l.js";import"./jsx-runtime-DFAAy_2V.js";import"./index-Bc2G9s8g.js";const T={title:"Dashboard/FsmStepper",component:d,parameters:{layout:"padded"},tags:["autodocs"],argTypes:{currentState:{control:"select",options:["IDLE","FILLING_WATER","CHECK_BASE","DOSING","MIXING","STABILIZING","MEASURING_TDS","EVAL_GATE","TOPUP_DOSE","DISTRIBUTING","BATCH_DEPLETED","BATCH_PAUSED_INSPECTION","FAULT_LATCHED"]},stepIndex:{control:{type:"number",min:0,max:10}},totalSteps:{control:{type:"number",min:1,max:10}},stateDurationSec:{control:"number"},estimatedTotalSec:{control:"number"}}},t={args:{currentState:"IDLE",stepIndex:0,totalSteps:8,stateDurationSec:0,estimatedTotalSec:420}},e={args:{currentState:"MIXING",stepIndex:4,totalSteps:8,stateDurationSec:65,estimatedTotalSec:420}},a={args:{currentState:"FAULT_LATCHED",stepIndex:5,totalSteps:8,stateDurationSec:15,estimatedTotalSec:420}};var r,s,n;t.parameters={...t.parameters,docs:{...(r=t.parameters)==null?void 0:r.docs,source:{originalSource:`{
  args: {
    currentState: "IDLE",
    stepIndex: 0,
    totalSteps: 8,
    stateDurationSec: 0,
    estimatedTotalSec: 420
  }
}`,...(n=(s=t.parameters)==null?void 0:s.docs)==null?void 0:n.source}}};var o,c,S;e.parameters={...e.parameters,docs:{...(o=e.parameters)==null?void 0:o.docs,source:{originalSource:`{
  args: {
    currentState: "MIXING",
    stepIndex: 4,
    totalSteps: 8,
    stateDurationSec: 65,
    estimatedTotalSec: 420
  }
}`,...(S=(c=e.parameters)==null?void 0:c.docs)==null?void 0:S.source}}};var p,m,u;a.parameters={...a.parameters,docs:{...(p=a.parameters)==null?void 0:p.docs,source:{originalSource:`{
  args: {
    currentState: "FAULT_LATCHED",
    stepIndex: 5,
    totalSteps: 8,
    stateDurationSec: 15,
    estimatedTotalSec: 420
  }
}`,...(u=(m=a.parameters)==null?void 0:m.docs)==null?void 0:u.source}}};const D=["Idle","MixingNutrients","FaultState"];export{a as FaultState,t as Idle,e as MixingNutrients,D as __namedExportsOrder,T as default};
