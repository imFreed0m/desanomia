import type { Meta, StoryObj } from "@storybook/react";
import { ActiveRecipeCard } from "./ActiveRecipeCard";

const meta: Meta<typeof ActiveRecipeCard> = {
	title: "Dashboard/ActiveRecipeCard",
	component: ActiveRecipeCard,
	parameters: {
		layout: "padded",
	},
	tags: ["autodocs"],
	argTypes: {
		tankName: { control: "text" },
		onOpenCreateModal: { action: "onOpenCreateModal clicked" },
		onOpenListModal: { action: "onOpenListModal clicked" },
	},
};

export default meta;
type Story = StoryObj<typeof ActiveRecipeCard>;

export const WithActiveRecipe: Story = {
	args: {
		tankName: "Tangki A (Mixer-1)",
		recipe: {
			id: "rcp-01",
			tankPairId: "pair-01",
			name: "Formula Vegetatif Selada",
			targetPpm: 1200,
			tolerancePpm: 50,
			ratioA_mL: 75,
			ratioB_mL: 75,
			phMin: 5.5,
			phMax: 6.5,
			tags: ["vegetatif", "selada"],
			isActive: true,
		},
	},
};

export const EmptyRecipe: Story = {
	args: {
		tankName: "Tangki B (Mixer-2)",
		recipe: undefined,
	},
};
