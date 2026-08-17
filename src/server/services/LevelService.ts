import { GameConfig } from "../config/GameConfig";
import { Stopwatch } from "../utils/Timer";

export interface LevelState {
	elapsedSeconds: number;
	elapsedMinutes: number;
	healthMultiplier: number;
	spawnRateMultiplier: number;
	bossUnlocked: boolean;
	siegeUnlocked: boolean;
	siegeActive: boolean;
	siegeCount: number;
	bossCount: number;
}

const DEBUG = GameConfig.DEBUG;

export class LevelService {
	private stopwatch = new Stopwatch();
	private siegeCount = 0;
	private bossCount = 0;
	private lastSiegeTime = 0;
	private lastBossTime = 0;
	private lastBubbleTime = 0;
	private unlockPrimed = false;

	private onSiegeTrigger: (() => void) | undefined;
	private onBossTrigger: (() => void) | undefined;
	private onBubbleTrigger: (() => void) | undefined;

	start(): void {
		this.stopwatch.start();
		if (DEBUG) print("[LevelService] Game timer started.");
	}

	stop(): void {
		this.stopwatch.stop();
	}

	onSiege(callback: () => void): void {
		this.onSiegeTrigger = callback;
	}

	onBoss(callback: () => void): void {
		this.onBossTrigger = callback;
	}

	onBubble(callback: () => void): void {
		this.onBubbleTrigger = callback;
	}

	update(_dt: number): void {
		const elapsed = this.stopwatch.getElapsed();
		const minutes = elapsed / 60;
		const unlockMinutes = GameConfig.BossUnlockMinutes;

		if (minutes >= unlockMinutes) {
			// Measure the first interval from the unlock moment. Left at 0, both
			// counters would already exceed their interval and fire on the very
			// first tick past the unlock.
			if (!this.unlockPrimed) {
				this.unlockPrimed = true;
				this.lastBossTime = elapsed;
				this.lastSiegeTime = elapsed;
			}

			if (elapsed - this.lastBossTime >= GameConfig.BossInterval) {
				this.lastBossTime = elapsed;
				this.bossCount++;
				if (DEBUG) print(`[LevelService] Boss trigger #${this.bossCount} at ${math.floor(minutes)}m.`);
				if (this.onBossTrigger) this.onBossTrigger();
			}

			if (elapsed - this.lastSiegeTime >= GameConfig.SiegeInterval) {
				this.lastSiegeTime = elapsed;
				this.siegeCount++;
				if (DEBUG) print(`[LevelService] Siege trigger #${this.siegeCount} at ${math.floor(minutes)}m.`);
				if (this.onSiegeTrigger) this.onSiegeTrigger();
			}
		}

		if (elapsed - this.lastBubbleTime >= GameConfig.BubbleInterval) {
			this.lastBubbleTime = elapsed;
			if (DEBUG) print(`[LevelService] Bubble trigger at ${math.floor(minutes)}m.`);
			if (this.onBubbleTrigger) this.onBubbleTrigger();
		}
	}

	getState(): LevelState {
		const elapsed = this.stopwatch.getElapsed();
		const minutes = elapsed / 60;
		const unlockMinutes = GameConfig.BossUnlockMinutes;

		const healthMultiplier = 1 + math.floor(minutes) * GameConfig.HealthScaling;

		// The bonus applies only while a siege is running, not forever after the first one.
		const siegeActive = this.siegeCount > 0 && elapsed - this.lastSiegeTime < GameConfig.SiegeDuration;

		let spawnRateMultiplier = 1;
		if (siegeActive) {
			spawnRateMultiplier += GameConfig.SiegeFirstBonus + (this.siegeCount - 1) * GameConfig.SiegeScaling;
		}

		return {
			elapsedSeconds: elapsed,
			elapsedMinutes: minutes,
			healthMultiplier,
			spawnRateMultiplier,
			bossUnlocked: minutes >= unlockMinutes,
			siegeUnlocked: minutes >= GameConfig.SiegeUnlockMinutes,
			siegeActive,
			siegeCount: this.siegeCount,
			bossCount: this.bossCount,
		};
	}

	getSiegeRemaining(): number {
		if (this.siegeCount === 0) return 0;
		return math.max(0, GameConfig.SiegeDuration - (this.stopwatch.getElapsed() - this.lastSiegeTime));
	}

	getSiegeCount(): number {
		return this.siegeCount;
	}

	getBossCount(): number {
		return this.bossCount;
	}
}
