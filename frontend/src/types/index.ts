export interface TankPair {
	id: string;
	name: string;
	cropName: string;
	drum1MaxL: number;
	drum2MaxL: number;
	currentL1: number;
	currentL2: number;
	isRefillConfirmed: boolean;
	activeRecipeId?: string;
	status: "active" | "standby" | "empty";
}

export interface Recipe {
	id: string;
	tankPairId: string;
	name: string;
	targetPpm: number;
	tolerancePpm: number;
	ratioA_mL: number;
	ratioB_mL: number;
	phMin: number;
	phMax: number;
	tags: string[];
	isActive: boolean;
}

export interface ScheduleItem {
	id: string;
	tankPairId: string;
	date: string; // YYYY-MM-DD
	time: string; // HH:mm
	repeat: "none" | "daily" | "2days" | "3days";
	recipeName: string;
	volumeL: number;
	status: "ready" | "scheduled" | "completed" | "cancelled";
}

export interface ActuatorState {
	sv1Water: boolean;
	pp1Peristaltic: boolean;
	m1Mixer: boolean;
	pDist: boolean;
	interlockReason?: string;
}

export type FsmState =
	| "IDLE"
	| "FILLING_WATER"
	| "CHECK_BASE"
	| "DOSING"
	| "MIXING"
	| "STABILIZING"
	| "MEASURING_TDS"
	| "EVAL_GATE"
	| "TOPUP_DOSE"
	| "DISTRIBUTING"
	| "BATCH_DEPLETED"
	| "BATCH_PAUSED_INSPECTION"
	| "FAULT_LATCHED";
