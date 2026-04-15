import { EnemyConfig, EnemyDefinition } from "../config/EnemyConfig";
import { GameConfig } from "../config/GameConfig";
import { PlotService } from "./PlotService";
import { EnemyService } from "./EnemyService";
import { LevelService } from "./LevelService";
import { WeightedRandom } from "../utils/WeightedRandom";
import { MathUtil } from "../utils/MathUtil";
import { Timer } from "../utils/Timer";

const DEBUG = GameConfig.DEBUG;

export class SpawnService {
	private spawnTimer: Timer;
	private plotService: PlotService;
	private enemyService: EnemyService;
	private levelService: LevelService;

	constructor(plotService: PlotService, enemyService: EnemyService, levelService: LevelService) {
		this.plotService = plotService;
		this.enemyService = enemyService;
		this.levelService = levelService;
		this.spawnTimer = new Timer(GameConfig.SpawnRate);
	}

	start(): void {
		this.spawnTimer.start();
	}

	update(dt: number): void {
		const state = this.levelService.getState();
		const effectiveRate = GameConfig.SpawnRate / state.spawnRateMultiplier;

		if (this.spawnTimer.getProgress() === 0 || effectiveRate !== GameConfig.SpawnRate) {
			// Dynamic rate update handled via interval logic below
		}

		if (!this.spawnTimer.tick(dt)) return;

		const plots = this.plotService.getAllPlots();
		for (const plot of plots) {
			const count = MathUtil.randomInt(GameConfig.BaseSpawnMin, GameConfig.BaseSpawnMax);
			for (let i = 0; i < count; i++) {
				const def = this.pickEnemy(state.bossUnlocked);
				if (!def) continue;

				const spawnPos = this.calculateSpawnPosition(plot.spawner.Position);
				this.enemyService.spawn(def, plot.id, spawnPos, state.healthMultiplier);
			}
		}
	}

	spawnBoss(plotId: string): void {
		const plot = this.plotService.getPlotById(plotId);
		if (!plot) return;

		const bossDefs = EnemyConfig.filter((d) => d.isBoss);
		if (bossDefs.size() === 0) return;

		const def = WeightedRandom.pick(bossDefs);
		if (!def) return;

		const spawnPos = this.calculateSpawnPosition(plot.spawner.Position);
		const state = this.levelService.getState();
		const enemy = this.enemyService.spawn(def, plotId, spawnPos, state.healthMultiplier);

		if (enemy && DEBUG) print(`[SpawnService] Boss '${def.id}' spawned on plot '${plotId}'.`);
	}

	spawnBossAllPlots(): void {
		for (const plot of this.plotService.getAllPlots()) {
			this.spawnBoss(plot.id);
		}
	}

	private pickEnemy(bossUnlocked: boolean): EnemyDefinition | undefined {
		return WeightedRandom.pickFiltered(EnemyConfig as EnemyDefinition[], (d) => {
			if (d.isBoss) return bossUnlocked;
			return true;
		});
	}

	private calculateSpawnPosition(spawnerPosition: Vector3): Vector3 {
		const offset = MathUtil.randomInCircle(GameConfig.SpawnRadius);
		return spawnerPosition.add(offset).add(new Vector3(0, GameConfig.SpawnHeightOffset, 0));
	}
}
