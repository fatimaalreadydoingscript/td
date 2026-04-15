import { SpawnService } from "./SpawnService";
import { PlotService } from "./PlotService";
import { LevelService } from "./LevelService";
import { GameConfig } from "../config/GameConfig";

const DEBUG = GameConfig.DEBUG;

export class BossService {
	private spawnService: SpawnService;
	private plotService: PlotService;
	private levelService: LevelService;

	constructor(spawnService: SpawnService, plotService: PlotService, levelService: LevelService) {
		this.spawnService = spawnService;
		this.plotService = plotService;
		this.levelService = levelService;
	}

	initialize(): void {
		this.levelService.onBoss(() => this.triggerBoss());
	}

	private triggerBoss(): void {
		const plots = this.plotService.getAllPlots();
		for (const plot of plots) {
			this.spawnService.spawnBoss(plot.id);
		}

		const state = this.levelService.getState();
		if (DEBUG) print(`[BossService] Boss wave #${state.bossCount} spawned on ${plots.size()} plots.`);
	}
}
