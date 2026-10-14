import type { Meta, StoryObj } from "@storybook/react";
import { ActuatorBar } from "./ActuatorBar";

const meta: Meta<typeof ActuatorBar> = {
  title: "Dashboard/ActuatorBar",
  component: ActuatorBar,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof ActuatorBar>;

export const AllStandby: Story = {
  args: {
    actuators: {
      sv1Water: false,
      pp1Peristaltic: false,
      m1Mixer: false,
      pDist: false,
    },
  },
};

export const ActiveDosingAndMixing: Story = {
  args: {
    actuators: {
      sv1Water: true,
      pp1Peristaltic: true,
      m1Mixer: true,
      pDist: false,
    },
  },
};

export const DistributionOnly: Story = {
  args: {
    actuators: {
      sv1Water: false,
      pp1Peristaltic: false,
      m1Mixer: false,
      pDist: true,
    },
  },
};
