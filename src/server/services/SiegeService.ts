import { LevelService } from "./LevelService";
import { GameConfig } from "../config/GameConfig";

const DEBUG = GameConfig.DEBUG;

export class SiegeService {
	private levelService: LevelService;
	private wasActive = false;

	constructor(levelService: LevelService) {
		this.levelService = levelService;
	}

	initialize(): void {
		this.levelService.onSiege(() => this.triggerSiege());
	}

	update(_dt: number): void {
		const active = this.isActive();

		if (this.wasActive && !active) {
			if (DEBUG) print(`[SiegeService] Siege #${this.levelService.getSiegeCount()} ended.`);
		}

		this.wasActive = active;
	}

	private triggerSiege(): void {
		this.wasActive = true;
		const count = this.levelService.getSiegeCount();
		if (DEBUG) print(`[SiegeService] Siege #${count} started. Duration: ${GameConfig.SiegeDuration}s.`);
	}

	// LevelService owns the siege window — these read from it rather than
	// tracking a second copy on a different clock.
	isActive(): boolean {
		return this.levelService.getState().siegeActive;
	}

	getSpawnMultiplier(): number {
		return this.levelService.getState().spawnRateMultiplier;
	}

	getRemainingTime(): number {
		return this.levelService.getSiegeRemaining();
	}
}
