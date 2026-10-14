import type { Meta, StoryObj } from "@storybook/react";
import App from "../App";

const meta: Meta<typeof App> = {
  title: "Pages/FullDashboard",
  component: App,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof App>;

export const DefaultKioskView: Story = {
  render: () => (
    <div style={{ width: "1920px", height: "1080px", overflow: "hidden" }}>
      <App />
    </div>
  ),
};
