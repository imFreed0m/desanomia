import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Check, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Recipe, TankPair } from "../types";

interface RecipeModalProps {
	isOpen: boolean;
	onClose: () => void;
	tanks: TankPair[];
	activeTankId: string;
	recipes: Recipe[];
	onSaveRecipe: (recipe: Recipe) => void;
	onSelectActiveRecipe: (recipeId: string) => void;
	onDeleteRecipe: (recipeId: string) => void;
}

export const RecipeModal: React.FC<RecipeModalProps> = ({
	isOpen,
	onClose,
	tanks,
	activeTankId,
	recipes,
	onSaveRecipe,
	onSelectActiveRecipe,
	onDeleteRecipe,
}) => {
	const [mode, setMode] = useState<"create" | "list">("create");
	const [name, setName] = useState("");
	const [tankPairId, setTankPairId] = useState(activeTankId);
	const [targetPpm, setTargetPpm] = useState(1250);
	const [tolerancePpm, setTolerancePpm] = useState(50);
	const [ratioA, setRatioA] = useState(5);
	const [ratioB, setRatioB] = useState(5);
	const [phMin, setPhMin] = useState(5.8);
	const [phMax, setPhMax] = useState(6.5);
	const [tags, setTags] = useState("Generatif, Buah");

	const handleSave = (e: React.FormEvent) => {
		e.preventDefault();
		if (!name.trim()) {
			toast.warning("Nama resep tidak boleh kosong!");
			return;
		}

		const newRecipe: Recipe = {
			id: `rec_${Date.now()}`,
			tankPairId,
			name,
			targetPpm,
			tolerancePpm,
			ratioA_mL: ratioA,
			ratioB_mL: ratioB,
			phMin,
			phMax,
			tags: tags
				.split(",")
				.map((t) => t.trim())
				.filter(Boolean),
			isActive: true,
		};

		onSaveRecipe(newRecipe);
		toast.success(`Resep "${name}" berhasil disimpan dan diaktifkan.`);
		onClose();
	};

	const currentTankRecipes = recipes.filter((r) => r.tankPairId === tankPairId);

	return (
		<Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
			<DialogContent className="!max-w-[640px] !rounded-3xl !p-6">
				<DialogHeader className="sr-only">
					<DialogTitle>Formula Resep Pupuk</DialogTitle>
				</DialogHeader>

				<div className="select-none">
					{/* Header */}
					<div className="flex items-center justify-between pb-3 border-b border-slate-100">
						<div>
							<h3 className="text-[18px] font-bold text-text-primary leading-tight font-display">
								Formula Resep Pupuk
							</h3>
							<p className="text-[12px] text-text-secondary font-body">
								Konfigurasi nutrisi spesifik per pasangan tangki
							</p>
						</div>

						<RadioGroup
							value={mode}
							onValueChange={(val) => setMode(val as "create" | "list")}
							className="flex flex-row gap-1 bg-slate-100 rounded-full p-1"
						>
							<label
								htmlFor="mode-create"
								className={`cursor-pointer px-3 py-1 rounded-full text-[12px] font-semibold transition-colors ${
									mode === "create"
										? "bg-white text-text-primary shadow-sm"
										: "text-text-secondary"
								}`}
							>
								<RadioGroupItem
									id="mode-create"
									value="create"
									className="sr-only"
								/>
								+ Buat Baru
							</label>
							<label
								htmlFor="mode-list"
								className={`cursor-pointer px-3 py-1 rounded-full text-[12px] font-semibold transition-colors ${
									mode === "list"
										? "bg-white text-text-primary shadow-sm"
										: "text-text-secondary"
								}`}
							>
								<RadioGroupItem
									id="mode-list"
									value="list"
									className="sr-only"
								/>
								Daftar ({currentTankRecipes.length})
							</label>
						</RadioGroup>
					</div>

					{mode === "create" ? (
						<form onSubmit={handleSave} className="space-y-3.5 mt-4">
							<div className="grid grid-cols-2 gap-3">
								<div>
									<label className="text-[10px] font-mono uppercase text-text-muted font-bold block mb-1">
										Nama Pupuk / Resep
									</label>
									<Input
										placeholder="Contoh: AB-Mix Tomat Generatif"
										value={name}
										onChange={(e) => setName(e.target.value)}
										className="rounded-xl py-1.5"
									/>
								</div>

								<div>
									<label className="text-[10px] font-mono uppercase text-text-muted font-bold block mb-1">
										Pasangan Tangki Target
									</label>
									<Select value={tankPairId} onValueChange={setTankPairId}>
										<SelectTrigger className="w-full rounded-xl">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											{tanks.map((t) => (
												<SelectItem key={t.id} value={t.id}>
													{t.name} ({t.cropName})
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
							</div>

							<div className="grid grid-cols-3 gap-3">
								<div>
									<label className="text-[10px] font-mono uppercase text-text-muted font-bold block mb-1">
										Target PPM
									</label>
									<Input
										type="number"
										value={targetPpm}
										onChange={(e) =>
											setTargetPpm(Number(e.target.value) || 0)
										}
										className="w-full rounded-xl"
									/>
								</div>

								<div>
									<label className="text-[10px] font-mono uppercase text-text-muted font-bold block mb-1">
										Toleransi (± ppm)
									</label>
									<Input
										type="number"
										value={tolerancePpm}
										onChange={(e) =>
											setTolerancePpm(Number(e.target.value) || 0)
										}
										className="w-full rounded-xl"
									/>
								</div>

								<div>
									<label className="text-[10px] font-mono uppercase text-text-muted font-bold block mb-1">
										Rasio A:B (mL/L)
									</label>
									<div className="flex items-center gap-1">
										<Input
											type="number"
											value={ratioA}
											onChange={(e) => setRatioA(Number(e.target.value) || 0)}
											className="w-1/2 rounded-xl text-center"
										/>
										<span>:</span>
										<Input
											type="number"
											value={ratioB}
											onChange={(e) => setRatioB(Number(e.target.value) || 0)}
											className="w-1/2 rounded-xl text-center"
										/>
									</div>
								</div>
							</div>

							<div className="grid grid-cols-2 gap-3">
								<div>
									<label className="text-[10px] font-mono uppercase text-text-muted font-bold block mb-1">
										Rentang pH (Min - Max)
									</label>
									<div className="flex items-center gap-2">
										<Input
											type="number"
											step={0.1}
											value={phMin}
											onChange={(e) => setPhMin(Number(e.target.value) || 0)}
											className="w-1/2 rounded-xl"
										/>
										<span>-</span>
										<Input
											type="number"
											step={0.1}
											value={phMax}
											onChange={(e) => setPhMax(Number(e.target.value) || 0)}
											className="w-1/2 rounded-xl"
										/>
									</div>
								</div>

								<div>
									<label className="text-[10px] font-mono uppercase text-text-muted font-bold block mb-1">
										Tag Nutrisi / Fase
									</label>
									<Input
										placeholder="Koma pisah: Generatif, High-K"
										value={tags}
										onChange={(e) => setTags(e.target.value)}
										className="rounded-xl py-1.5"
									/>
								</div>
							</div>

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
									<span>Simpan & Aktifkan Formula</span>
								</button>
							</div>
						</form>
					) : (
						<div className="space-y-2 mt-4 max-h-[360px] overflow-y-auto pr-1">
							{currentTankRecipes.length === 0 ? (
								<div className="text-center py-8 text-text-muted text-[13px]">
									Belum ada resep untuk tangki ini. Silakan buat resep baru.
								</div>
							) : (
								currentTankRecipes.map((r) => (
									<div
										key={r.id}
										className={`p-3 rounded-2xl border transition-all flex items-center justify-between ${
											r.isActive
												? "bg-blue-50/80 border-blue-300 shadow-xs"
												: "bg-slate-50 border-slate-200/80 hover:bg-slate-100"
										}`}
									>
										<div>
											<div className="flex items-center gap-2">
												<h5 className="text-[14px] font-bold text-text-primary">
													{r.name}
												</h5>
												{r.isActive && (
													<span className="text-[9.5px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
														Aktif Saat Ini
													</span>
												)}
											</div>
											<p className="text-[11px] font-mono text-text-muted mt-0.5">
												Target {r.targetPpm} ± {r.tolerancePpm} ppm • Rasio{" "}
												{r.ratioA_mL}:{r.ratioB_mL} • pH {r.phMin}-{r.phMax}
											</p>
										</div>

										<div className="flex items-center gap-2">
											{!r.isActive && (
												<button
													type="button"
													onClick={() => {
														onSelectActiveRecipe(r.id);
														toast.success(
															`Resep "${r.name}" dipilih sebagai resep aktif.`,
														);
													}}
													className="px-3 py-1 rounded-full text-[11px] font-bold text-primary-container bg-white border border-blue-200 hover:bg-blue-50 shadow-xs"
												>
													Pilih Aktif
												</button>
											)}
											<button
												type="button"
												onClick={() => {
													onDeleteRecipe(r.id);
													toast.info(`Resep "${r.name}" dihapus.`);
												}}
												className="p-1.5 rounded-full text-slate-400 hover:text-red-500 hover:bg-red-50"
												title="Hapus Resep"
											>
												<Trash2 className="w-4 h-4" />
											</button>
										</div>
									</div>
								))
							)}
						</div>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
};
