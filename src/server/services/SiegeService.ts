import { LevelService } from "./LevelService";
import { GameConfig } from "../config/GameConfig";
import { Timer } from "../utils/Timer";

const DEBUG = GameConfig.DEBUG;

export class SiegeService {
	private levelService: LevelService;
	private activeSiege = false;
	private siegeEndTime = 0;
	private siegeTimer: Timer;

	constructor(levelService: LevelService) {
		this.levelService = levelService;
		this.siegeTimer = new Timer(GameConfig.SiegeDuration);
	}

	initialize(): void {
		this.levelService.onSiege(() => this.triggerSiege());
	}

	update(_dt: number): void {
		if (!this.activeSiege) return;

		if (os.clock() >= this.siegeEndTime) {
			this.activeSiege = false;
			const count = this.levelService.getSiegeCount();
			if (DEBUG) print(`[SiegeService] Siege #${count} ended.`);
		}
	}

	private triggerSiege(): void {
		this.activeSiege = true;
		this.siegeEndTime = os.clock() + GameConfig.SiegeDuration;
		const count = this.levelService.getSiegeCount();
		if (DEBUG) print(`[SiegeService] Siege #${count} started. Duration: ${GameConfig.SiegeDuration}s.`);
	}

	isActive(): boolean {
		return this.activeSiege;
	}

	getSpawnMultiplier(): number {
		if (!this.activeSiege) return 1;
		const count = this.levelService.getSiegeCount();
		return 1 + GameConfig.SiegeFirstBonus + (count - 1) * GameConfig.SiegeScaling;
	}

	getRemainingTime(): number {
		if (!this.activeSiege) return 0;
		return math.max(0, this.siegeEndTime - os.clock());
	}
}
