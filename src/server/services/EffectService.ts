import { EffectType, BurnEffect, SlowEffect, ToxicEffect } from "../models/EffectModel";
import { EnemyService } from "./EnemyService";
import { GameConfig } from "../config/GameConfig";

const DEBUG = GameConfig.DEBUG;

const BURN_DPS = 8;
const BURN_DURATION = 4;
const BURN_TICK = 1;
const SLOW_MULTIPLIER = 0.5;
const SLOW_DURATION = 3;
const TOXIC_DPS_PER_STACK = 5;
const TOXIC_DURATION = 6;
const TOXIC_TICK = 1;
const TOXIC_MAX_STACKS = 8;

export class EffectService {
	private enemyService: EnemyService;

	constructor(enemyService: EnemyService) {
		this.enemyService = enemyService;
	}

	applyEffect(enemyUid: string, effectType: EffectType): void {
		const enemy = this.enemyService.getEnemy(enemyUid);
		if (!enemy || enemy.state !== "alive") return;

		const now = os.clock();

		if (effectType === "burn") {
			const burn: BurnEffect = {
				type: "burn",
				dps: BURN_DPS,
				duration: BURN_DURATION,
				startTime: now,
				lastTick: now,
			};
			enemy.effects.burn = burn;
			if (DEBUG) print(`[EffectService] Applied burn to ${enemyUid}.`);
		} else if (effectType === "slow") {
			const slow: SlowEffect = {
				type: "slow",
				multiplier: SLOW_MULTIPLIER,
				duration: SLOW_DURATION,
				startTime: now,
			};
			enemy.effects.slow = slow;
			this.enemyService.applySlow(enemyUid, SLOW_MULTIPLIER);
			if (DEBUG) print(`[EffectService] Applied slow to ${enemyUid}.`);
		} else if (effectType === "toxic") {
			if (enemy.effects.toxic) {
				const toxic = enemy.effects.toxic;
				toxic.stacks = math.min(toxic.stacks + 1, TOXIC_MAX_STACKS);
				toxic.startTime = now;
			} else {
				const toxic: ToxicEffect = {
					type: "toxic",
					dpsPerStack: TOXIC_DPS_PER_STACK,
					duration: TOXIC_DURATION,
					startTime: now,
					lastTick: now,
					stacks: 1,
				};
				enemy.effects.toxic = toxic;
			}
			if (DEBUG) print(`[EffectService] Applied toxic (stacks=${enemy.effects.toxic?.stacks}) to ${enemyUid}.`);
		}
	}

	update(dt: number, onDamage: (uid: string, amount: number) => void): void {
		const now = os.clock();

		this.enemyService.getAllEnemies().forEach((enemy, uid) => {
			if (enemy.state !== "alive") return;

			const effects = enemy.effects;

			if (effects.burn) {
				const burn = effects.burn;
				if (now - burn.startTime >= burn.duration) {
					enemy.effects.burn = undefined;
				} else if (now - burn.lastTick >= BURN_TICK) {
					burn.lastTick = now;
					onDamage(uid, burn.dps);
				}
			}

			if (effects.slow) {
				const slow = effects.slow;
				if (now - slow.startTime >= slow.duration) {
					enemy.effects.slow = undefined;
					this.enemyService.clearSlow(uid);
				}
			}

			if (effects.toxic) {
				const toxic = effects.toxic;
				if (now - toxic.startTime >= toxic.duration) {
					enemy.effects.toxic = undefined;
				} else if (now - toxic.lastTick >= TOXIC_TICK) {
					toxic.lastTick = now;
					const toxicDamage = toxic.dpsPerStack * toxic.stacks;
					onDamage(uid, toxicDamage);
				}
			}
		});
	}
}
