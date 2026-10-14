import type { Meta, StoryObj } from "@storybook/react";
import { TopHeader } from "./TopHeader";

const meta: Meta<typeof TopHeader> = {
  title: "Dashboard/TopHeader",
  component: TopHeader,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
  argTypes: {
    activeTankName: { control: "text" },
    activeCropName: { control: "text" },
    wsOnline: { control: "boolean" },
    currentTimeWib: { control: "text" },
    unreadAlertsCount: { control: "number" },
    onEmergencyStop: { action: "Emergency Stop clicked" },
  },
};

export default meta;
type Story = StoryObj<typeof TopHeader>;

export const OnlineNormal: Story = {
  args: {
    activeTankName: "Tangki A (Mixer-1)",
    activeCropName: "Selada Romaine",
    wsOnline: true,
    currentTimeWib: "14:35 WIB",
    unreadAlertsCount: 0,
  },
};

export const WithAlertsAndOffline: Story = {
  args: {
    activeTankName: "Tangki B (Mixer-2)",
    activeCropName: "Bayam Merah",
    wsOnline: false,
    currentTimeWib: "15:10 WIB",
    unreadAlertsCount: 3,
  },
};
