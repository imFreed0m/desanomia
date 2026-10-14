import type { Meta, StoryObj } from "@storybook/react";
import { ScheduleCalendarCard } from "./ScheduleCalendarCard";

const meta: Meta<typeof ScheduleCalendarCard> = {
	title: "Dashboard/ScheduleCalendarCard",
	component: ScheduleCalendarCard,
	parameters: {
		layout: "padded",
	},
	tags: ["autodocs"],
	argTypes: {
		selectedDate: { control: "text" },
		onOpenScheduleModal: { action: "onOpenScheduleModal clicked" },
		onSelectDate: { action: "onSelectDate clicked" },
	},
};

export default meta;
type Story = StoryObj<typeof ScheduleCalendarCard>;

export const DefaultUpcoming: Story = {
	args: {
		selectedDate: "2026-10-14",
		schedules: [
			{
				id: "sch-01",
				tankPairId: "pair-01",
				recipeName: "Nutrisi Pagi Selada",
				date: "2026-10-14",
				time: "06:30",
				repeat: "none",
				volumeL: 15,
				status: "completed",
			},
			{
				id: "sch-02",
				tankPairId: "pair-01",
				recipeName: "Top-up Sore Selada",
				date: "2026-10-14",
				time: "16:00",
				repeat: "daily",
				volumeL: 10,
				status: "scheduled",
			},
			{
				id: "sch-03",
				tankPairId: "pair-02",
				recipeName: "Siklus Pagi Bayam Merah",
				date: "2026-10-15",
				time: "07:00",
				repeat: "none",
				volumeL: 20,
				status: "scheduled",
			},
		],
	},
};

export const NoSchedules: Story = {
	args: {
		selectedDate: "2026-10-14",
		schedules: [],
	},
};
