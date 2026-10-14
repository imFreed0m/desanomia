import React, { useState } from "react";
import {
	TankPair,
	Recipe,
	ScheduleItem,
	ActuatorState,
	FsmState,
} from "./types";
import { LeftStage } from "./components/LeftStage";
import { TopHeader } from "./components/TopHeader";
import { HeroTdsCard } from "./components/HeroTdsCard";
import { ActiveRecipeCard } from "./components/ActiveRecipeCard";
import { FsmStepper } from "./components/FsmStepper";
import { ActuatorBar } from "./components/ActuatorBar";
import { ScheduleCalendarCard } from "./components/ScheduleCalendarCard";
import { RecipeModal } from "./components/RecipeModal";
import { ScheduleModal } from "./components/ScheduleModal";

const App: React.FC = () => {
	// State 1: 5 Tank Pairs (initial setup: tank 1 active, 2-5 empty/standby)
	const [tanks, setTanks] = useState<TankPair[]>([
		{
			id: "tank_1",
			name: "Pasangan Tangki 01",
			cropName: "Tomat Ceri (B1-B3)",
			drum1MaxL: 20,
			drum2MaxL: 140,
			currentL1: 0.0,
			currentL2: 0.0,
			isRefillConfirmed: false,
			activeRecipeId: "rec_1",
			status: "active",
		},
		{
			id: "tank_2",
			name: "Pasangan Tangki 02",
			cropName: "Paprika Bell (B4-B6)",
			drum1MaxL: 20,
			drum2MaxL: 140,
			currentL1: 0.0,
			currentL2: 0.0,
			isRefillConfirmed: false,
			status: "standby",
		},
		{
			id: "tank_3",
			name: "Pasangan Tangki 03",
			cropName: "Stroberi Hidroponik",
			drum1MaxL: 20,
			drum2MaxL: 140,
			currentL1: 0.0,
			currentL2: 0.0,
			isRefillConfirmed: false,
			status: "standby",
		},
		{
			id: "tank_4",
			name: "Pasangan Tangki 04",
			cropName: "Melon Golden",
			drum1MaxL: 20,
			drum2MaxL: 140,
			currentL1: 0.0,
			currentL2: 0.0,
			isRefillConfirmed: false,
			status: "standby",
		},
		{
			id: "tank_5",
			name: "Pasangan Tangki 05",
			cropName: "Selada Romaine",
			drum1MaxL: 20,
			drum2MaxL: 140,
			currentL1: 0.0,
			currentL2: 0.0,
			isRefillConfirmed: false,
			status: "standby",
		},
	]);

	const [activeTankId, setActiveTankId] = useState<string>("tank_1");
	const activeTank = tanks.find((t) => t.id === activeTankId) || tanks[0];

	// State 2: Recipes
	const [recipes, setRecipes] = useState<Recipe[]>([
		{
			id: "rec_1",
			tankPairId: "tank_1",
			name: "Resep AB-Mix Tomat Ceri Generatif",
			targetPpm: 1250,
			tolerancePpm: 50,
			ratioA_mL: 5,
			ratioB_mL: 5,
			phMin: 5.8,
			phMax: 6.5,
			tags: ["Generatif", "NPK 16-16-20"],
			isActive: true,
		},
	]);

	const activeRecipe = recipes.find(
		(r) => r.tankPairId === activeTank.id && r.isActive,
	);

	// State 3: Schedules
	const [schedules, setSchedules] = useState<ScheduleItem[]>([
		{
			id: "sch_1",
			tankPairId: "tank_1",
			date: "2026-10-14",
			time: "07:00",
			repeat: "daily",
			recipeName: "AB-Mix Tomat Ceri Generatif",
			volumeL: 140,
			status: "ready",
		},
		{
			id: "sch_2",
			tankPairId: "tank_1",
			date: "2026-10-14",
			time: "15:30",
			repeat: "daily",
			recipeName: "AB-Mix Tomat Ceri (Sore)",
			volumeL: 140,
			status: "scheduled",
		},
	]);

	const [selectedCalendarDate, setSelectedCalendarDate] =
		useState<string>("2026-10-14");

	// State 4: Sensor & Actuator Telemetry
	const [currentPpm] = useState<number>(activeRecipe?.targetPpm || 1248);
	const [temperatureC] = useState<number>(23.8);
	const [fsmState, setFsmState] = useState<FsmState>("IDLE");
	const [fsmStep, setFsmStep] = useState<number>(1);
	const [actuators, setActuators] = useState<ActuatorState>({
		sv1Water: false,
		pp1Peristaltic: false,
		m1Mixer: false,
		pDist: false,
	});

	// State 5: Modal states
	const [isRecipeModalOpen, setIsRecipeModalOpen] = useState(false);
	const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);

	// Handlers
	const handleToggleRefill = (tankId: string) => {
		setTanks((prev) =>
			prev.map((t) => {
				if (t.id === tankId) {
					const nextConfirmed = !t.isRefillConfirmed;
					return {
						...t,
						isRefillConfirmed: nextConfirmed,
						currentL1: nextConfirmed ? 20.0 : 0.0, // When confirmed full, sets to 20L
					};
				}
				return t;
			}),
		);
	};

	const handleSaveRecipe = (newRecipe: Recipe) => {
		setRecipes((prev) => {
			// Deactivate other recipes for the same tank pair
			const updated = prev.map((r) =>
				r.tankPairId === newRecipe.tankPairId ? { ...r, isActive: false } : r,
			);
			return [...updated, newRecipe];
		});
	};

	const handleSelectActiveRecipe = (recipeId: string) => {
		setRecipes((prev) =>
			prev.map((r) => {
				if (r.id === recipeId) {
					return { ...r, isActive: true };
				}
				if (r.tankPairId === activeTank.id) {
					return { ...r, isActive: false };
				}
				return r;
			}),
		);
	};

	const handleDeleteRecipe = (recipeId: string) => {
		setRecipes((prev) => prev.filter((r) => r.id !== recipeId));
	};

	const handleSaveSchedule = (newSchedule: ScheduleItem) => {
		setSchedules((prev) => {
			// Remove any conflicting schedule on the same date for different tanks if overwritten
			const filtered = prev.filter(
				(s) =>
					!(
						s.date === newSchedule.date &&
						s.tankPairId !== newSchedule.tankPairId
					),
			);
			return [...filtered, newSchedule];
		});
	};

	const handleDeleteSchedule = (id: string) => {
		setSchedules((prev) => prev.filter((s) => s.id !== id));
	};

	const handleStartBatch = () => {
		if (!activeTank.isRefillConfirmed || !activeRecipe) return;

		setFsmState("FILLING_WATER");
		setFsmStep(2);
		setActuators({
			sv1Water: true,
			pp1Peristaltic: false,
			m1Mixer: false,
			pDist: false,
		});

		// Simulate water fill into Drum 2
		setTanks((prev) =>
			prev.map((t) =>
				t.id === activeTank.id ? { ...t, currentL2: 140.0 } : t,
			),
		);
	};

	const handleEmergencyStop = () => {
		setFsmState("FAULT_LATCHED");
		setActuators({
			sv1Water: false,
			pp1Peristaltic: false,
			m1Mixer: false,
			pDist: false,
			interlockReason: "E-STOP DITEKAN OLEH OPERATOR",
		});
		alert("EMERGENCY STOP DIAKTIFKAN: Semua relai diputus dalam 0 ms!");
	};

	return (
		<div
			className="flex w-[1920px] h-[1080px] max-h-[1080px] overflow-hidden select-none bg-slate-950"
			data-oid="glcjtsh"
		>
			{/* LEFT PANE: 35% Deep Charcoal Hydraulic Reactor Stage (~672px) */}
			<LeftStage
				tanks={tanks}
				activeTank={activeTank}
				onSelectTank={(t) => setActiveTankId(t.id)}
				onToggleRefill={handleToggleRefill}
				data-oid="cywcgil"
			/>

			{/* RIGHT PANE: 65% Light Canvas (Aeros Bento Control Surface, ~1248px) */}
			<main
				className="w-[1248px] h-[1080px] max-h-[1080px] flex-shrink-0 bg-canvas-bg px-7 py-5 flex flex-col justify-between overflow-hidden box-border"
				style={{ borderTopLeftRadius: "36px", borderBottomLeftRadius: "36px" }}
				data-oid="k43phkp"
			>
				{/* Top Navigation Bar */}
				<TopHeader
					activeTankName={activeTank.name}
					activeCropName={activeTank.cropName}
					wsOnline={true}
					currentTimeWib="14 Oktober • 04:15 WIB"
					unreadAlertsCount={activeTank.isRefillConfirmed ? 0 : 1}
					onEmergencyStop={handleEmergencyStop}
					data-oid="eufs0zc"
				/>

				{/* Master Bento Grid: Fixed 1080p Viewport */}
				<div
					className="grid grid-cols-12 gap-4 items-stretch flex-1 min-h-0 my-2"
					data-oid="f6rg7_k"
				>
					{/* LEFT 7 COLS: Hero EC/TDS & Dedicated Active Recipe Card */}
					<div
						className="col-span-7 flex flex-col gap-3.5 h-full min-h-0"
						data-oid="n2089zp"
					>
						{/* Hero EC/TDS Card */}
						<HeroTdsCard
							currentPpm={currentPpm}
							temperatureC={temperatureC}
							targetPpm={activeRecipe?.targetPpm || 1250}
							tolerancePpm={activeRecipe?.tolerancePpm || 50}
							isRefillConfirmed={activeTank.isRefillConfirmed}
							hasActiveRecipe={!!activeRecipe}
							onStartBatch={handleStartBatch}
							onOpenRecipeModal={() => setIsRecipeModalOpen(true)}
							data-oid="mnx-c39"
						/>

						{/* Active Recipe Card */}
						<ActiveRecipeCard
							recipe={activeRecipe}
							tankName={activeTank.name}
							onOpenCreateModal={() => setIsRecipeModalOpen(true)}
							onOpenListModal={() => setIsRecipeModalOpen(true)}
							data-oid=":brnl.x"
						/>
					</div>

					{/* RIGHT 5 COLS: FSM Stepper, Streamlined Actuator Bar, and Calendar/Schedule */}
					<div
						className="col-span-5 flex flex-col gap-3.5 h-full min-h-0"
						data-oid="_quileo"
					>
						{/* FSM Process Stepper */}
						<FsmStepper
							currentState={fsmState}
							stepIndex={fsmStep}
							totalSteps={12}
							stateDurationSec={18}
							estimatedTotalSec={270}
							data-oid="ib4x654"
						/>

						{/* Streamlined Actuator Bar */}
						<ActuatorBar actuators={actuators} data-oid="xri.807" />

						{/* Schedule & Calendar Card */}
						<ScheduleCalendarCard
							schedules={schedules}
							onOpenScheduleModal={() => setIsScheduleModalOpen(true)}
							onSelectDate={setSelectedCalendarDate}
							selectedDate={selectedCalendarDate}
							data-oid="4wsw-gh"
						/>
					</div>
				</div>
			</main>

			{/* MODAL 1: Recipe Management */}
			<RecipeModal
				isOpen={isRecipeModalOpen}
				onClose={() => setIsRecipeModalOpen(false)}
				tanks={tanks}
				activeTankId={activeTank.id}
				recipes={recipes}
				onSaveRecipe={handleSaveRecipe}
				onSelectActiveRecipe={handleSelectActiveRecipe}
				onDeleteRecipe={handleDeleteRecipe}
				data-oid="wvoc649"
			/>

			{/* MODAL 2: Fertigation Schedule & Calendar */}
			<ScheduleModal
				isOpen={isScheduleModalOpen}
				onClose={() => setIsScheduleModalOpen(false)}
				schedules={schedules}
				tanks={tanks}
				recipes={recipes}
				onSaveSchedule={handleSaveSchedule}
				onDeleteSchedule={handleDeleteSchedule}
				data-oid="k0nsj6f"
			/>
		</div>
	);
};
export default App;
