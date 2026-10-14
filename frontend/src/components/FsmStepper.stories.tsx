import type { Meta, StoryObj } from "@storybook/react";
import { FsmStepper } from "./FsmStepper";

const meta: Meta<typeof FsmStepper> = {
  title: "Dashboard/FsmStepper",
  component: FsmStepper,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
  argTypes: {
    currentState: {
      control: "select",
      options: [
        "IDLE",
        "FILLING_WATER",
        "CHECK_BASE",
        "DOSING",
        "MIXING",
        "STABILIZING",
        "MEASURING_TDS",
        "EVAL_GATE",
        "TOPUP_DOSE",
        "DISTRIBUTING",
        "BATCH_DEPLETED",
        "BATCH_PAUSED_INSPECTION",
        "FAULT_LATCHED",
      ],
    },
    stepIndex: { control: { type: "number", min: 0, max: 10 } },
    totalSteps: { control: { type: "number", min: 1, max: 10 } },
    stateDurationSec: { control: "number" },
    estimatedTotalSec: { control: "number" },
  },
};

export default meta;
type Story = StoryObj<typeof FsmStepper>;

export const Idle: Story = {
  args: {
    currentState: "IDLE",
    stepIndex: 0,
    totalSteps: 8,
    stateDurationSec: 0,
    estimatedTotalSec: 420,
  },
};

export const MixingNutrients: Story = {
  args: {
    currentState: "MIXING",
    stepIndex: 4,
    totalSteps: 8,
    stateDurationSec: 65,
    estimatedTotalSec: 420,
  },
};

export const FaultState: Story = {
  args: {
    currentState: "FAULT_LATCHED",
    stepIndex: 5,
    totalSteps: 8,
    stateDurationSec: 15,
    estimatedTotalSec: 420,
  },
};
