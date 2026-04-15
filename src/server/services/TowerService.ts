import { Workspace } from "@rbxts/services";
import { TowerInstance } from "../models/TowerModel";
import { TowerDefinition } from "../config/TowerConfig";
import { GameConfig } from "../config/GameConfig";

const DEBUG = GameConfig.DEBUG;
let uidCounter = 0;

function generateUid(): string {
	uidCounter++;
	return `tower_${uidCounter}`;
}

export class TowerService {
	private towers = new Map<string, TowerInstance>();
	private towerFolder: Folder;

	constructor() {
		this.towerFolder = new Instance("Folder");
		this.towerFolder.Name = "Towers";
		this.towerFolder.Parent = Workspace;
	}

	place(def: TowerDefinition, plotId: string, ownerId: string, position: Vector3): TowerInstance {
		const part = new Instance("Part");
		part.Name = def.id;
		part.Size = new Vector3(4, 6, 4);
		part.CFrame = new CFrame(position);
		part.Anchored = true;
		part.CanCollide = true;
		part.Parent = this.towerFolder;

		const instance: TowerInstance = {
			uid: generateUid(),
			definitionId: def.id,
			plotId,
			ownerId,
			part,
			damage: def.damage,
			range: def.range,
			cooldown: def.cooldown,
			lastFireTime: 0,
			effects: def.effects,
			isActive: true,
		};

		this.towers.set(instance.uid, instance);
		if (DEBUG) print(`[TowerService] Placed '${def.id}' (uid=${instance.uid}) on plot '${plotId}'.`);
		return instance;
	}

	remove(uid: string): void {
		const tower = this.towers.get(uid);
		if (!tower) return;

		tower.part.Destroy();
		this.towers.delete(uid);
		if (DEBUG) print(`[TowerService] Removed tower uid=${uid}.`);
	}

	getTower(uid: string): TowerInstance | undefined {
		return this.towers.get(uid);
	}

	getAllTowers(): ReadonlyMap<string, TowerInstance> {
		return this.towers;
	}

	getTowersOnPlot(plotId: string): TowerInstance[] {
		const result: TowerInstance[] = [];
		this.towers.forEach((t) => {
			if (t.plotId === plotId && t.isActive) result.push(t);
		});
		return result;
	}

	canFire(uid: string): boolean {
		const tower = this.towers.get(uid);
		if (!tower || !tower.isActive) return false;
		return os.clock() - tower.lastFireTime >= tower.cooldown;
	}

	recordFire(uid: string): void {
		const tower = this.towers.get(uid);
		if (!tower) return;
		tower.lastFireTime = os.clock();
	}
}
