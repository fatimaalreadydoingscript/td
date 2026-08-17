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
		this.plotService  = plotService;
		this.enemyService = enemyService;
		this.levelService = levelService;
		this.spawnTimer   = new Timer(GameConfig.SpawnRate);
	}

	start(): void {
		this.spawnTimer.start();
	}

	update(dt: number): void {
		if (!this.spawnTimer.tick(dt)) return;

		const state = this.levelService.getState();

		for (const plot of this.plotService.getAllPlots()) {
			const baseCount = MathUtil.randomInt(GameConfig.BaseSpawnMin, GameConfig.BaseSpawnMax);
			const count = math.max(1, math.floor(baseCount * state.spawnRateMultiplier));

			// ── Ring spawner (always active) ──────────────────────────────────
			for (let i = 0; i < count; i++) {
				const def = this.pickEnemy();
				if (!def) continue;
				const pos = this.ringSpawnPosition(plot.core.Position);
				this.enemyService.spawn(def, plot.id, pos, state.healthMultiplier);
			}

			// ── Lane spawners (left + right, if placed in Studio) ─────────────
			for (const laneSpawner of plot.laneSpawners) {
				for (let i = 0; i < count; i++) {
					const def = this.pickEnemy();
					if (!def) continue;
					const pos = this.laneSpawnPosition(laneSpawner.Position);
					this.enemyService.spawn(def, plot.id, pos, state.healthMultiplier);
				}
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

		const state = this.levelService.getState();
		const pos   = this.ringSpawnPosition(plot.core.Position);
		const enemy = this.enemyService.spawn(def, plotId, pos, state.healthMultiplier);

		if (enemy && DEBUG) print(`[SpawnService] Boss '${def.id}' spawned on plot '${plotId}'.`);
	}

	spawnBossAllPlots(): void {
		for (const plot of this.plotService.getAllPlots()) {
			this.spawnBoss(plot.id);
		}
	}

	// Bosses are never drawn by the regular spawner — they arrive only through
	// spawnBoss(), driven by the boss wave timer.
	private pickEnemy(): EnemyDefinition | undefined {
		return WeightedRandom.pickFiltered(EnemyConfig, (d) => !d.isBoss);
	}

	// Spawns on a random point along a 70-stud ring around the core
	private ringSpawnPosition(corePos: Vector3): Vector3 {
		const angle = math.random() * math.pi * 2;
		return new Vector3(
			corePos.X + math.cos(angle) * GameConfig.SpawnRingRadius,
			corePos.Y + MathUtil.randomFloat(GameConfig.SpawnMinHeight, GameConfig.SpawnMaxHeight),
			corePos.Z + math.sin(angle) * GameConfig.SpawnRingRadius,
		);
	}

	// Spawns directly at the lane spawner's position with a random height offset
	private laneSpawnPosition(spawnerPos: Vector3): Vector3 {
		return new Vector3(
			spawnerPos.X,
			spawnerPos.Y + MathUtil.randomFloat(GameConfig.SpawnMinHeight, GameConfig.SpawnMaxHeight),
			spawnerPos.Z,
		);
	}
}
