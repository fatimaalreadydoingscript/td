import { EnemyService } from "./EnemyService";
import { TowerService } from "./TowerService";
import { TroopService } from "./TroopService";
import { EffectService } from "./EffectService";
import { EconomyService } from "./EconomyService";
import { PlotService } from "./PlotService";
import { MathUtil } from "../utils/MathUtil";
import { GameConfig } from "../config/GameConfig";

const DEBUG = GameConfig.DEBUG;
const ENEMY_STUN_DURATION = 0.6;

export class CombatService {
	private enemyService: EnemyService;
	private towerService: TowerService;
	private troopService: TroopService;
	private effectService: EffectService;
	private economyService: EconomyService;
	private plotService: PlotService;

	constructor(
		enemyService: EnemyService,
		towerService: TowerService,
		troopService: TroopService,
		effectService: EffectService,
		economyService: EconomyService,
		plotService: PlotService,
	) {
		this.enemyService = enemyService;
		this.towerService = towerService;
		this.troopService = troopService;
		this.effectService = effectService;
		this.economyService = economyService;
		this.plotService = plotService;
	}

	update(dt: number): void {
		this.processTowerAttacks();
		this.processTroopAttacks();
		this.processEnemyAttacks();
		this.effectService.update(dt, (uid, dmg) => this.applyDamageToEnemy(uid, dmg));
	}

	private processTowerAttacks(): void {
		this.towerService.getAllTowers().forEach((tower, towerUid) => {
			if (!tower.isActive) return;
			if (!this.towerService.canFire(towerUid)) return;

			const target = this.findNearestEnemy(tower.plotId, tower.part.Position, tower.range);
			if (!target) return;

			this.towerService.recordFire(towerUid);
			this.applyDamageToEnemy(target, tower.damage);

			for (const effect of tower.effects) {
				this.effectService.applyEffect(target, effect);
			}
		});
	}

	private processTroopAttacks(): void {
		this.troopService.getAllTroops().forEach((troop, troopUid) => {
			if (!troop.isActive) return;
			if (!this.troopService.canFire(troopUid)) return;

			const target = this.findNearestEnemy(troop.plotId, troop.part.Position, troop.range);
			if (!target) return;

			this.troopService.recordFire(troopUid);
			troop.targetId = target;
			this.applyDamageToEnemy(target, troop.damage);

			for (const effect of troop.effects) {
				this.effectService.applyEffect(target, effect);
			}
		});
	}

	private processEnemyAttacks(): void {
		const now = os.clock();

		this.enemyService.getAllEnemies().forEach((enemy, enemyUid) => {
			if (enemy.state !== "alive") return;
			if (now - enemy.lastAttackTime < enemy.attackCooldown) return;

			const troopsOnPlot = this.troopService.getTroopsOnPlot(enemy.plotId);
			let closestTroop: string | undefined;
			let closestDist = enemy.baseSpeed * 2;

			for (const troop of troopsOnPlot) {
				if (!troop.isActive) continue;
				const dist = MathUtil.distance(enemy.part.Position, troop.part.Position);
				if (dist < closestDist) {
					closestDist = dist;
					closestTroop = troop.uid;
				}
			}

			if (closestTroop) {
				enemy.lastAttackTime = now;
				const dead = this.troopService.applyDamage(closestTroop, enemy.damage);
				this.troopService.applyStun(closestTroop, ENEMY_STUN_DURATION);

				if (dead) {
					this.troopService.remove(closestTroop);
					if (DEBUG) print(`[CombatService] Troop ${closestTroop} died from enemy ${enemyUid}.`);
				}
			}
		});
	}

	private applyDamageToEnemy(uid: string, amount: number): void {
		const dead = this.enemyService.applyDamage(uid, amount);
		if (!dead) return;

		const killed = this.enemyService.kill(uid);
		if (!killed) return;

		const plot = this.plotService.getPlotById(killed.plotId);
		if (!plot) return;

		this.economyService.rewardKill(plot.owner, killed.moneyReward, killed.expReward);
		if (DEBUG) print(`[CombatService] Enemy ${uid} killed. Rewarded ${killed.moneyReward}g ${killed.expReward}xp.`);
	}

	private findNearestEnemy(plotId: string, position: Vector3, range: number): string | undefined {
		const enemies = this.enemyService.getAliveEnemiesOnPlot(plotId);
		let nearest: string | undefined;
		let nearestDistSq = range * range;

		for (const enemy of enemies) {
			const distSq = MathUtil.distanceSquared(position, enemy.part.Position);
			if (distSq <= nearestDistSq) {
				nearestDistSq = distSq;
				nearest = enemy.uid;
			}
		}

		return nearest;
	}

	getTargetPositionForEnemy(enemy: { plotId: string; part: BasePart }): Vector3 | undefined {
		const plot = this.plotService.getPlotById(enemy.plotId);
		if (!plot) return undefined;

		const troops = this.troopService.getTroopsOnPlot(enemy.plotId);
		let closestPos: Vector3 | undefined;
		let closestDist = math.huge;

		for (const troop of troops) {
			if (!troop.isActive) continue;
			const dist = MathUtil.distance(enemy.part.Position, troop.part.Position);
			if (dist < closestDist) {
				closestDist = dist;
				closestPos = troop.part.Position;
			}
		}

		if (closestPos && closestDist < 40) return closestPos;
		return plot.core.Position;
	}
}
