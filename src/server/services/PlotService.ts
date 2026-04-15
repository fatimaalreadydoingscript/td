import { Players, Workspace } from "@rbxts/services";
import { GameConfig } from "../config/GameConfig";

export interface PlotData {
	readonly id: string;
	readonly owner: Player;
	readonly plotInstance: Model;
	readonly spawner: BasePart;
	readonly placementArea: BasePart;
	readonly core: BasePart;
}

const DEBUG = GameConfig.DEBUG;

export class PlotService {
	private plots = new Map<string, PlotData>();
	private playerPlots = new Map<number, string>();

	initialize(): void {
		const plotsFolder = Workspace.FindFirstChild("Plots") as Folder | undefined;
		if (!plotsFolder) {
			if (DEBUG) warn("[PlotService] No 'Plots' folder found in Workspace.");
			return;
		}

		Players.PlayerAdded.Connect((player) => this.assignPlot(player));
		Players.PlayerRemoving.Connect((player) => this.releasePlot(player));

		for (const existingPlayer of Players.GetPlayers()) {
			this.assignPlot(existingPlayer);
		}

		if (DEBUG) print("[PlotService] Initialized.");
	}

	private assignPlot(player: Player): void {
		const plotsFolder = Workspace.FindFirstChild("Plots") as Folder | undefined;
		if (!plotsFolder) return;

		for (const child of plotsFolder.GetChildren()) {
			const plotModel = child as Model;
			const plotId = plotModel.Name;

			if (this.plots.has(plotId)) continue;

			const spawner = plotModel.FindFirstChild("Spawner") as BasePart | undefined;
			const placementArea = plotModel.FindFirstChild("PlacementArea") as BasePart | undefined;
			const core = plotModel.FindFirstChild("Core") as BasePart | undefined;

			if (!spawner || !placementArea || !core) {
				if (DEBUG) warn(`[PlotService] Plot '${plotId}' is missing required parts.`);
				continue;
			}

			const plotData: PlotData = {
				id: plotId,
				owner: player,
				plotInstance: plotModel,
				spawner,
				placementArea,
				core,
			};

			this.plots.set(plotId, plotData);
			this.playerPlots.set(player.UserId, plotId);

			if (DEBUG) print(`[PlotService] Assigned plot '${plotId}' to ${player.Name}.`);
			return;
		}

		if (DEBUG) warn(`[PlotService] No available plot for ${player.Name}.`);
	}

	private releasePlot(player: Player): void {
		const plotId = this.playerPlots.get(player.UserId);
		if (!plotId) return;

		this.plots.delete(plotId);
		this.playerPlots.delete(player.UserId);

		if (DEBUG) print(`[PlotService] Released plot '${plotId}' from ${player.Name}.`);
	}

	getPlotByPlayer(player: Player): PlotData | undefined {
		const plotId = this.playerPlots.get(player.UserId);
		if (!plotId) return undefined;
		return this.plots.get(plotId);
	}

	getPlotById(plotId: string): PlotData | undefined {
		return this.plots.get(plotId);
	}

	getAllPlots(): ReadonlyArray<PlotData> {
		const result: PlotData[] = [];
		this.plots.forEach((plot) => result.push(plot));
		return result;
	}

	isPositionInPlot(plotId: string, position: Vector3): boolean {
		const plot = this.plots.get(plotId);
		if (!plot) return false;

		const area = plot.placementArea;
		const size = area.Size;
		const cf = area.CFrame;
		const localPos = cf.PointToObjectSpace(position);

		return (
			math.abs(localPos.X) <= size.X / 2 &&
			math.abs(localPos.Z) <= size.Z / 2
		);
	}
}
