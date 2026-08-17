import { Players, Workspace } from "@rbxts/services";
import { GameConfig } from "../config/GameConfig";

export interface PlotData {
	readonly id: string;
	readonly owner: Player | undefined;
	readonly plotInstance: Model;
	readonly spawner: BasePart;
	readonly laneSpawners: BasePart[];
	readonly placementArea: BasePart;
	readonly core: BasePart;
}

const DEBUG = GameConfig.DEBUG;

function hideMarker(part: BasePart): void {
	part.Transparency = 1;
	part.CanCollide = false;
}

export class PlotService {
	private plots = new Map<string, PlotData>();
	private playerPlots = new Map<number, string>();

	initialize(): void {
		const plotsFolder = Workspace.FindFirstChild("Plots") as Folder | undefined;
		if (!plotsFolder) {
			if (DEBUG) warn("[PlotService] No 'Plots' folder found in Workspace.");
			return;
		}

		// Register all plots immediately — no player required
		for (const child of plotsFolder.GetChildren()) {
			this.registerPlot(child as Model);
		}

		// Assign ownership when players join (optional, for future use)
		Players.PlayerAdded.Connect((player) => this.assignOwner(player));
		Players.PlayerRemoving.Connect((player) => this.releaseOwner(player));
		for (const player of Players.GetPlayers()) {
			this.assignOwner(player);
		}

		if (DEBUG) print(`[PlotService] Initialized — ${this.plots.size()} plot(s) registered.`);
	}

	private registerPlot(plotModel: Model): void {
		const plotId = plotModel.Name;

		const spawner       = plotModel.FindFirstChild("Spawner")       as BasePart | undefined;
		const placementArea = plotModel.FindFirstChild("PlacementArea") as BasePart | undefined;
		const core          = plotModel.FindFirstChild("Core")          as BasePart | undefined;

		if (!spawner || !placementArea || !core) {
			if (DEBUG) warn(`[PlotService] Plot '${plotId}' is missing Spawner, PlacementArea, or Core.`);
			return;
		}

		hideMarker(spawner);

		const laneSpawners: BasePart[] = [];
		const left  = plotModel.FindFirstChild("SpawnerLeft")  as BasePart | undefined;
		const right = plotModel.FindFirstChild("SpawnerRight") as BasePart | undefined;
		if (left)  { hideMarker(left);  laneSpawners.push(left); }
		if (right) { hideMarker(right); laneSpawners.push(right); }

		this.plots.set(plotId, {
			id: plotId,
			owner: undefined,
			plotInstance: plotModel,
			spawner,
			laneSpawners,
			placementArea,
			core,
		});

		if (DEBUG) print(`[PlotService] Registered plot '${plotId}'.`);
	}

	private assignOwner(player: Player): void {
		for (const [plotId, plot] of this.plots) {
			if (plot.owner !== undefined) continue;

			this.plots.set(plotId, { ...plot, owner: player });
			this.playerPlots.set(player.UserId, plotId);

			if (DEBUG) print(`[PlotService] Player '${player.Name}' owns plot '${plotId}'.`);
			return;
		}
	}

	private releaseOwner(player: Player): void {
		const plotId = this.playerPlots.get(player.UserId);
		if (!plotId) return;

		const plot = this.plots.get(plotId);
		if (plot) this.plots.set(plotId, { ...plot, owner: undefined });
		this.playerPlots.delete(player.UserId);

		if (DEBUG) print(`[PlotService] Released ownership of plot '${plotId}'.`);
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

		const localPos = plot.placementArea.CFrame.PointToObjectSpace(position);
		return (
			math.abs(localPos.X) <= plot.placementArea.Size.X / 2 &&
			math.abs(localPos.Z) <= plot.placementArea.Size.Z / 2
		);
	}
}
