import { RunService } from "@rbxts/services";
import { PlotService } from "./PlotService";
import { LevelService } from "./LevelService";
import { SpawnService } from "./SpawnService";
import { EnemyService } from "./EnemyService";
import { TowerService } from "./TowerService";
import { TroopService } from "./TroopService";
import { CombatService } from "./CombatService";
import { EffectService } from "./EffectService";
import { EconomyService } from "./EconomyService";
import { BossService } from "./BossService";
import { SiegeService } from "./SiegeService";
import { BubbleService } from "./BubbleService";
import { PlacementController } from "../controllers/PlacementController";
import { InputController } from "../controllers/InputController";
import { GameConfig } from "../config/GameConfig";
import { EnemyInstance } from "../models/EnemyModel";

const DEBUG = GameConfig.DEBUG;

export class GameService {
	private plotService: PlotService;
	private levelService: LevelService;
	private enemyService: EnemyService;
	private spawnService: SpawnService;
	private towerService: TowerService;
	private troopService: TroopService;
	private effectService: EffectService;
	private economyService: EconomyService;
	private combatService: CombatService;
	private bossService: BossService;
	private siegeService: SiegeService;
	private bubbleService: BubbleService;
	private placementController: PlacementController;
	private inputController: InputController;

	constructor() {
		this.plotService = new PlotService();
		this.levelService = new LevelService();
		this.enemyService = new EnemyService();
		this.towerService = new TowerService();
		this.troopService = new TroopService();
		this.effectService = new EffectService(this.enemyService);
		this.economyService = new EconomyService();

		this.spawnService = new SpawnService(this.plotService, this.enemyService, this.levelService);

		this.combatService = new CombatService(
			this.enemyService,
			this.towerService,
			this.troopService,
			this.effectService,
			this.economyService,
			this.plotService,
		);

		this.bossService = new BossService(this.spawnService, this.plotService, this.levelService);
		this.siegeService = new SiegeService(this.levelService);
		this.bubbleService = new BubbleService(this.plotService, this.levelService, this.enemyService);

		this.placementController = new PlacementController(
			this.towerService,
			this.troopService,
			this.economyService,
			this.plotService,
		);

		this.inputController = new InputController(this.placementController);
	}

	start(): void {
		this.plotService.initialize();
		this.economyService.initialize();
		this.bossService.initialize();
		this.siegeService.initialize();
		this.bubbleService.initialize();
		this.inputController.initialize();
		this.spawnService.start();
		this.levelService.start();

		RunService.Heartbeat.Connect((dt) => this.update(dt));

		if (DEBUG) print("[GameService] Game started.");
	}

	private update(dt: number): void {
		this.levelService.update(dt);
		this.spawnService.update(dt);

		this.enemyService.update(dt, (enemy: EnemyInstance) => {
			return this.combatService.getTargetPositionForEnemy(enemy);
		});

		this.combatService.update(dt);
		this.siegeService.update(dt);
		this.bubbleService.update(dt);
	}
}
