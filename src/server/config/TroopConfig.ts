import { EffectType } from "../models/EffectModel";

export interface TroopUpgrade {
	readonly level: number;
	readonly cost: number;
	readonly health: number;
	readonly damage: number;
	readonly speed: number;
	readonly range: number;
	readonly cooldown: number;
	readonly modelName: string;
}

export interface TroopDefinition {
	readonly id: string;
	readonly displayName: string;
	readonly hotkey: number;
	readonly cost: number;
	readonly effects: ReadonlyArray<EffectType>;
	readonly upgrades: ReadonlyArray<TroopUpgrade>;
}

export const TroopConfig: ReadonlyArray<TroopDefinition> = [
	{
		id: "swordsman",
		displayName: "Swordsman",
		hotkey: 1,
		cost: 50,
		effects: [],
		upgrades: [
			{
				level: 1,
				cost: 0,
				health: 120,
				damage: 15,
				speed: 0,
				range: 5,
				cooldown: 1.0,
				modelName: "SwordsmanLv1",
			},
			{
				level: 2,
				cost: 75,
				health: 200,
				damage: 25,
				speed: 0,
				range: 5,
				cooldown: 0.9,
				modelName: "SwordsmanLv2",
			},
			{
				level: 3,
				cost: 150,
				health: 350,
				damage: 45,
				speed: 0,
				range: 6,
				cooldown: 0.8,
				modelName: "SwordsmanLv3",
			},
		],
	},
	{
		id: "archer",
		displayName: "Archer",
		hotkey: 2,
		cost: 80,
		effects: [],
		upgrades: [
			{
				level: 1,
				cost: 0,
				health: 80,
				damage: 20,
				speed: 0,
				range: 18,
				cooldown: 1.2,
				modelName: "ArcherLv1",
			},
			{
				level: 2,
				cost: 100,
				health: 130,
				damage: 35,
				speed: 0,
				range: 22,
				cooldown: 1.0,
				modelName: "ArcherLv2",
			},
			{
				level: 3,
				cost: 200,
				health: 210,
				damage: 60,
				speed: 0,
				range: 26,
				cooldown: 0.85,
				modelName: "ArcherLv3",
			},
		],
	},
	{
		id: "mage",
		displayName: "Mage",
		hotkey: 3,
		cost: 120,
		effects: ["burn"],
		upgrades: [
			{
				level: 1,
				cost: 0,
				health: 70,
				damage: 30,
				speed: 0,
				range: 16,
				cooldown: 1.5,
				modelName: "MageLv1",
			},
			{
				level: 2,
				cost: 150,
				health: 110,
				damage: 55,
				speed: 0,
				range: 20,
				cooldown: 1.2,
				modelName: "MageLv2",
			},
			{
				level: 3,
				cost: 300,
				health: 180,
				damage: 90,
				speed: 0,
				range: 24,
				cooldown: 1.0,
				modelName: "MageLv3",
			},
		],
	},
];

export const TroopConfigMap = new Map<string, TroopDefinition>(
	TroopConfig.map((def) => [def.id, def]),
);
