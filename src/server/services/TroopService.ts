import { Workspace } from "@rbxts/services";
import { TroopInstance } from "../models/TroopModel";
import { TroopDefinition, TroopConfigMap } from "../config/TroopConfig";
import { GameConfig } from "../config/GameConfig";
import { ModelLoader } from "../utils/ModelLoader";

const DEBUG = GameConfig.DEBUG;
let uidCounter = 0;

function generateUid(): string {
	uidCounter++;
	return `troop_${uidCounter}`;
}

export class TroopService {
	private troops = new Map<string, TroopInstance>();
	private troopFolder: Folder;

	constructor() {
		this.troopFolder = new Instance("Folder");
		this.troopFolder.Name = "Troops";
		this.troopFolder.Parent = Workspace;
	}

	place(def: TroopDefinition, plotId: string, ownerId: string, snapPosition: Vector3): TroopInstance | undefined {
		const upgrade = def.upgrades[0];
		if (!upgrade) return undefined;

		const part = ModelLoader.placeTroop(upgrade.modelName, snapPosition, this.troopFolder);
		if (!part) {
			if (DEBUG) warn(`[TroopService] Failed to load model '${upgrade.modelName}' for troop '${def.id}'.`);
			return undefined;
		}

		const instance: TroopInstance = {
			uid: generateUid(),
			definitionId: def.id,
			plotId,
			ownerId,
			part,
			health: upgrade.health,
			maxHealth: upgrade.health,
			damage: upgrade.damage,
			range: upgrade.range,
			cooldown: upgrade.cooldown,
			lastFireTime: 0,
			upgradeLevel: 1,
			effects: def.effects,
			isStunned: false,
			stunExpiry: 0,
			isActive: true,
			targetId: undefined,
		};

		this.troops.set(instance.uid, instance);
		if (DEBUG) print(`[TroopService] Placed '${def.id}' (uid=${instance.uid}) on plot '${plotId}'.`);
		return instance;
	}

	upgrade(uid: string): boolean {
		const troop = this.troops.get(uid);
		if (!troop || !troop.isActive) return false;

		const def = TroopConfigMap.get(troop.definitionId);
		if (!def) return false;

		const nextLevel = troop.upgradeLevel + 1;
		const nextUpgrade = def.upgrades.find((u) => u.level === nextLevel);
		if (!nextUpgrade) return false;

		const newPart = ModelLoader.swapTroopModel(troop.part, nextUpgrade.modelName, this.troopFolder);
		if (!newPart) {
			if (DEBUG) warn(`[TroopService] Failed to swap model for troop ${uid} level ${nextLevel}.`);
			return false;
		}

		troop.part = newPart;
		troop.upgradeLevel = nextLevel;
		troop.maxHealth = nextUpgrade.health;
		troop.health = nextUpgrade.health;
		troop.damage = nextUpgrade.damage;
		troop.range = nextUpgrade.range;
		troop.cooldown = nextUpgrade.cooldown;

		if (DEBUG) print(`[TroopService] Upgraded troop ${uid} to level ${nextLevel}, model='${nextUpgrade.modelName}'.`);
		return true;
	}

	remove(uid: string): void {
		const troop = this.troops.get(uid);
		if (!troop) return;

		ModelLoader.despawnModel(troop.part);
		this.troops.delete(uid);
		if (DEBUG) print(`[TroopService] Removed troop uid=${uid}.`);
	}

	applyDamage(uid: string, amount: number): boolean {
		const troop = this.troops.get(uid);
		if (!troop || !troop.isActive) return false;

		troop.health = math.max(0, troop.health - amount);
		return troop.health <= 0;
	}

	applyStun(uid: string, duration: number): void {
		const troop = this.troops.get(uid);
		if (!troop) return;
		troop.isStunned = true;
		troop.stunExpiry = os.clock() + duration;
	}

	getTroop(uid: string): TroopInstance | undefined {
		return this.troops.get(uid);
	}

	getAllTroops(): ReadonlyMap<string, TroopInstance> {
		return this.troops;
	}

	getTroopsOnPlot(plotId: string): TroopInstance[] {
		const result: TroopInstance[] = [];
		this.troops.forEach((t) => {
			if (t.plotId === plotId && t.isActive) result.push(t);
		});
		return result;
	}

	canFire(uid: string): boolean {
		const troop = this.troops.get(uid);
		if (!troop || !troop.isActive) return false;
		if (troop.isStunned && os.clock() < troop.stunExpiry) return false;
		return os.clock() - troop.lastFireTime >= troop.cooldown;
	}

	recordFire(uid: string): void {
		const troop = this.troops.get(uid);
		if (!troop) return;
		troop.lastFireTime = os.clock();
	}
}
