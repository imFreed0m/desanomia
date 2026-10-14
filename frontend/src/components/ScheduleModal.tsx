import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { AlertTriangle, Calendar as CalendarIcon, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Recipe, ScheduleItem, TankPair } from "../types";

interface ScheduleModalProps {
	isOpen: boolean;
	onClose: () => void;
	schedules: ScheduleItem[];
	tanks: TankPair[];
	recipes: Recipe[];
	onSaveSchedule: (schedule: ScheduleItem) => void;
	onDeleteSchedule?: (id: string) => void;
}

export const ScheduleModal: React.FC<ScheduleModalProps> = ({
	isOpen,
	onClose,
	schedules,
	tanks,
	recipes,
	onSaveSchedule,
}) => {
	const [date, setDate] = useState("2026-10-14");
	const [time, setTime] = useState("07:00");
	const [repeat, setRepeat] = useState<"none" | "daily" | "2days" | "3days">(
		"daily",
	);
	const [tankPairId, setTankPairId] = useState(tanks[0]?.id || "tank_1");
	const [recipeId, setRecipeId] = useState(recipes[0]?.id || "");
	const [volumeL, setVolumeL] = useState(140);
	const [overwriteConfirmed, setOverwriteConfirmed] = useState(false);

	// Conflict Detection: check if chosen date already has a schedule for a DIFFERENT tank pair
	const conflictingSchedule = schedules.find(
		(s) => s.date === date && s.tankPairId !== tankPairId,
	);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		if (conflictingSchedule && !overwriteConfirmed) {
			toast.error(
				"Terdapat jadwal tangki lain pada tanggal ini! Centang konfirmasi overwrite untuk melanjutkan.",
			);
			return;
		}

		const selectedRecipe = recipes.find((r) => r.id === recipeId);

		const newSchedule: ScheduleItem = {
			id: `sch_${Date.now()}`,
			tankPairId,
			date,
			time,
			repeat,
			recipeName: selectedRecipe ? selectedRecipe.name : "Formula Standar",
			volumeL,
			status: "ready",
		};

		onSaveSchedule(newSchedule);
		toast.success(
			`Jadwal fertigasi untuk ${date} pukul ${time} berhasil dipasang.`,
		);
		onClose();
	};

	return (
		<Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
			<DialogContent className="!max-w-[680px] !rounded-3xl !p-6">
				<DialogHeader className="sr-only">
					<DialogTitle>Kalender & Penjadwalan Fertigasi</DialogTitle>
				</DialogHeader>

				<div className="select-none">
					{/* Header */}
					<div className="flex items-center justify-between pb-3 border-b border-slate-100">
						<div className="flex items-center gap-2.5">
							<div className="w-9 h-9 rounded-full bg-blue-50 text-primary-container flex items-center justify-center border border-blue-200/70">
								<CalendarIcon className="w-5 h-5 text-primary-container" />
							</div>
							<div>
								<h3 className="text-[18px] font-bold text-text-primary leading-tight font-display">
									Kalender & Penjadwalan Fertigasi
								</h3>
								<p className="text-[12px] text-text-secondary font-body">
									Atur jadwal irigasi dan pemilihan tangki otomatis
								</p>
							</div>
						</div>
					</div>

					<form onSubmit={handleSubmit} className="space-y-4 mt-4">
						<div className="grid grid-cols-3 gap-3">
							<div>
								<label className="text-[10px] font-mono uppercase text-text-muted font-bold block mb-1">
									Tanggal Eksekusi
								</label>
								<Input
									type="date"
									value={date}
									onChange={(e) => {
										setDate(e.target.value);
										setOverwriteConfirmed(false);
									}}
									className="w-full rounded-xl"
								/>
							</div>

							<div>
								<label className="text-[10px] font-mono uppercase text-text-muted font-bold block mb-1">
									Waktu (WIB ≥ NOW)
								</label>
								<Input
									type="time"
									value={time}
									onChange={(e) => setTime(e.target.value || "07:00")}
									className="w-full rounded-xl"
								/>
							</div>

							<div>
								<label className="text-[10px] font-mono uppercase text-text-muted font-bold block mb-1">
									Frekuensi Pengulangan
								</label>
								<Select
									value={repeat}
									onValueChange={(val) =>
										setRepeat(val as "none" | "daily" | "2days" | "3days")
									}
								>
									<SelectTrigger className="w-full rounded-xl">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="daily">Setiap Hari</SelectItem>
										<SelectItem value="2days">Setiap 2 Hari</SelectItem>
										<SelectItem value="3days">Setiap 3 Hari</SelectItem>
										<SelectItem value="none">Satu Kali Saja</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</div>

						<div className="grid grid-cols-2 gap-3">
							<div>
								<label className="text-[10px] font-mono uppercase text-text-muted font-bold block mb-1">
									Target Pasangan Tangki
								</label>
								<Select
									value={tankPairId}
									onValueChange={(val) => {
										setTankPairId(val);
										setOverwriteConfirmed(false);
									}}
								>
									<SelectTrigger className="w-full rounded-xl">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{tanks.map((t) => (
											<SelectItem key={t.id} value={t.id}>
												{t.name}: {t.cropName}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>

							<div>
								<label className="text-[10px] font-mono uppercase text-text-muted font-bold block mb-1">
									Formula Resep Diterapkan
								</label>
								<Select
									value={recipeId || undefined}
									onValueChange={setRecipeId}
									disabled={recipes.length === 0}
								>
									<SelectTrigger className="w-full rounded-xl">
										<SelectValue placeholder="Pilih resep..." />
									</SelectTrigger>
									<SelectContent>
										{recipes.map((r) => (
											<SelectItem key={r.id} value={r.id}>
												{r.name} ({r.targetPpm} ppm)
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						</div>

						<div>
							<label className="text-[10px] font-mono uppercase text-text-muted font-bold block mb-1">
								Target Volume Dosis Batch (Liter Air Baku)
							</label>
							<Input
								type="number"
								value={volumeL}
								onChange={(e) => setVolumeL(Number(e.target.value) || 140)}
								max={140}
								min={10}
								className="w-full rounded-xl font-mono font-bold"
							/>
						</div>

						{/* Conflict Overwrite Detection Banner */}
						{conflictingSchedule && (
							<Alert className="rounded-2xl border-amber-300 bg-amber-50">
								<AlertTriangle className="h-4 w-4 text-amber-600" />
								<AlertTitle className="text-amber-900">
									Peringatan Bentrok Jadwal Tangki!
								</AlertTitle>
								<AlertDescription>
									<div className="mt-1">
										<p className="text-[11px] text-amber-900 leading-snug">
											Pada tanggal <strong>{date}</strong> sudah ada jadwal
											untuk{" "}
											<strong className="underline">
												{conflictingSchedule.recipeName}
											</strong>
											. Menjadwalkan batch ini akan menimpa (overwrite)
											tangki tersebut.
										</p>
										<div className="mt-2 flex items-center gap-2">
											<Checkbox
												id="overwrite-confirm"
												checked={overwriteConfirmed}
												onCheckedChange={(checked) =>
													setOverwriteConfirmed(checked === true)
												}
											/>
											<label
												htmlFor="overwrite-confirm"
												className="text-[11.5px] font-bold text-amber-950 cursor-pointer"
											>
												Saya mengerti dan setuju untuk overwrite jadwal di
												tanggal ini
											</label>
										</div>
									</div>
								</AlertDescription>
							</Alert>
						)}

						<div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
							<button
								type="button"
								onClick={onClose}
								className="px-4 py-2 rounded-full text-[13px] font-semibold text-text-secondary hover:text-text-primary bg-slate-100 hover:bg-slate-200/80 transition-colors"
							>
								Batal
							</button>
							<button
								type="submit"
								className="px-6 py-2 rounded-full text-[13px] font-bold text-white bg-primary-container hover:bg-blue-700 transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
							>
								<Check className="w-4 h-4" />
								<span>Simpan & Pasang Jadwal</span>
							</button>
						</div>
					</form>
				</div>
			</DialogContent>
		</Dialog>
	);
};
