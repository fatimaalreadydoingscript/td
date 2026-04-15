import { EffectType } from "../models/EffectModel";

export interface TowerDefinition {
	readonly id: string;
	readonly displayName: string;
	readonly cost: number;
	readonly damage: number;
	readonly range: number;
	readonly cooldown: number;
	readonly effects: ReadonlyArray<EffectType>;
	readonly modelName: string;
}

export const TowerConfig: ReadonlyArray<TowerDefinition> = [
	{
		id: "archer",
		displayName: "Archer Tower",
		cost: 100,
		damage: 25,
		range: 20,
		cooldown: 1.0,
		effects: [],
		modelName: "ArcherTower",
	},
	{
		id: "fire",
		displayName: "Fire Tower",
		cost: 200,
		damage: 18,
		range: 16,
		cooldown: 0.8,
		effects: ["burn"],
		modelName: "FireTower",
	},
	{
		id: "ice",
		displayName: "Ice Tower",
		cost: 180,
		damage: 15,
		range: 18,
		cooldown: 1.2,
		effects: ["slow"],
		modelName: "IceTower",
	},
	{
		id: "poison",
		displayName: "Poison Tower",
		cost: 250,
		damage: 10,
		range: 14,
		cooldown: 0.9,
		effects: ["toxic"],
		modelName: "PoisonTower",
	},
	{
		id: "cannon",
		displayName: "Cannon Tower",
		cost: 350,
		damage: 80,
		range: 22,
		cooldown: 2.5,
		effects: [],
		modelName: "CannonTower",
	},
];

export const TowerConfigMap = new Map<string, TowerDefinition>(
	TowerConfig.map((def) => [def.id, def]),
);
