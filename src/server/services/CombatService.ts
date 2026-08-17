import { Workspace } from "@rbxts/services";
import { EnemyService } from "./EnemyService";
import { TowerService } from "./TowerService";
import { TroopService } from "./TroopService";
import { EffectService } from "./EffectService";
import { EconomyService } from "./EconomyService";
import { PlotService } from "./PlotService";
import { MathUtil } from "../utils/MathUtil";
import { GameConfig } from "../config/GameConfig";

const DEBUG = GameConfig.DEBUG;

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
		this.processCoreCollisions();
		this.effectService.update(dt, (uid, dmg) => this.applyDamageToEnemy(uid, dmg));
	}

	private processCoreCollisions(): void {
		const overlapParams = new OverlapParams();
		overlapParams.FilterType = Enum.RaycastFilterType.Include;

		for (const plot of this.plotService.getAllPlots()) {
			const core = plot.core;
			overlapParams.FilterDescendantsInstances = [this.enemyService.getFolder()];

			const touching = Workspace.GetPartsInPart(core, overlapParams);
			for (const part of touching) {
				const uid = this.enemyService.getUidByPart(part as BasePart);
				if (!uid) continue;

				if (DEBUG) print(`[CombatService] Enemy ${uid} touched core on plot '${plot.id}'. Despawning.`);
				this.enemyService.despawn(uid);
			}
		}
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

	private applyDamageToEnemy(uid: string, amount: number): void {
		const dead = this.enemyService.applyDamage(uid, amount);
		if (!dead) return;

		const killed = this.enemyService.kill(uid);
		if (!killed) return;

		const plot = this.plotService.getPlotById(killed.plotId);
		if (!plot || !plot.owner) return;

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
		return plot.core.Position;
	}
}
