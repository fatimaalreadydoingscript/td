import { Workspace } from "@rbxts/services";
import { TroopInstance } from "../models/TroopModel";
import { TroopDefinition, TroopConfigMap } from "../config/TroopConfig";
import { GameConfig } from "../config/GameConfig";

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

		const part = new Instance("Part");
		part.Name = def.id;
		part.Size = new Vector3(3, 5, 3);
		part.CFrame = new CFrame(snapPosition);
		part.Anchored = true;
		part.CanCollide = true;
		part.Parent = this.troopFolder;

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

		troop.upgradeLevel = nextLevel;
		troop.maxHealth = nextUpgrade.health;
		troop.health = nextUpgrade.health;
		troop.damage = nextUpgrade.damage;
		troop.range = nextUpgrade.range;
		troop.cooldown = nextUpgrade.cooldown;

		if (DEBUG) print(`[TroopService] Upgraded troop ${uid} to level ${nextLevel}.`);
		return true;
	}

	remove(uid: string): void {
		const troop = this.troops.get(uid);
		if (!troop) return;

		troop.part.Destroy();
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
