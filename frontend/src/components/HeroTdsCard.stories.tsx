import type { Meta, StoryObj } from "@storybook/react";
import { HeroTdsCard } from "./HeroTdsCard";

const meta: Meta<typeof HeroTdsCard> = {
  title: "Dashboard/HeroTdsCard",
  component: HeroTdsCard,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    currentPpm: {
      control: { type: "range", min: 0, max: 2000, step: 10 },
      description: "Nilai TDS/EC sensor saat ini dalam PPM",
    },
    temperatureC: {
      control: { type: "number", min: 10, max: 45, step: 0.5 },
      description: "Suhu larutan nutrisi (°C)",
    },
    targetPpm: {
      control: { type: "number", min: 200, max: 2000, step: 50 },
      description: "Target nutrisi sesuai resep (PPM)",
    },
    tolerancePpm: {
      control: { type: "number", min: 10, max: 150, step: 5 },
      description: "Ambang batas toleransi (+/- PPM)",
    },
    isRefillConfirmed: {
      control: "boolean",
      description: "Status konfirmasi refill tangki",
    },
    hasActiveRecipe: {
      control: "boolean",
      description: "Apakah ada resep aktif yang dipilih",
    },
    onStartBatch: { action: "onStartBatch clicked" },
    onOpenRecipeModal: { action: "onOpenRecipeModal clicked" },
  },
};

export default meta;
type Story = StoryObj<typeof HeroTdsCard>;

export const InTolerance: Story = {
  args: {
    currentPpm: 1200,
    temperatureC: 25.4,
    targetPpm: 1200,
    tolerancePpm: 50,
    isRefillConfirmed: true,
    hasActiveRecipe: true,
  },
};

export const BelowTarget: Story = {
  args: {
    currentPpm: 850,
    temperatureC: 26.1,
    targetPpm: 1200,
    tolerancePpm: 50,
    isRefillConfirmed: true,
    hasActiveRecipe: true,
  },
};

export const AboveTarget: Story = {
  args: {
    currentPpm: 1450,
    temperatureC: 25.0,
    targetPpm: 1200,
    tolerancePpm: 50,
    isRefillConfirmed: true,
    hasActiveRecipe: true,
  },
};

export const LockedSafety: Story = {
  args: {
    currentPpm: 600,
    temperatureC: 24.8,
    targetPpm: 1200,
    tolerancePpm: 50,
    isRefillConfirmed: false,
    hasActiveRecipe: false,
  },
};
