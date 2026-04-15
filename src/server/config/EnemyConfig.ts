export interface EnemyDefinition {
	readonly id: string;
	readonly displayName: string;
	readonly health: number;
	readonly speed: number;
	readonly damage: number;
	readonly attackCooldown: number;
	readonly moneyReward: number;
	readonly expReward: number;
	readonly weight: number;
	readonly isBoss: boolean;
	readonly modelName: string;
}

export const EnemyConfig: ReadonlyArray<EnemyDefinition> = [
	{
		id: "goblin",
		displayName: "Goblin",
		health: 60,
		speed: 14,
		damage: 8,
		attackCooldown: 1.2,
		moneyReward: 8,
		expReward: 4,
		weight: 50,
		isBoss: false,
		modelName: "GoblinModel",
	},
	{
		id: "orc",
		displayName: "Orc",
		health: 150,
		speed: 9,
		damage: 20,
		attackCooldown: 1.8,
		moneyReward: 18,
		expReward: 9,
		weight: 30,
		isBoss: false,
		modelName: "OrcModel",
	},
	{
		id: "skeleton",
		displayName: "Skeleton",
		health: 90,
		speed: 12,
		damage: 12,
		attackCooldown: 1.0,
		moneyReward: 12,
		expReward: 6,
		weight: 40,
		isBoss: false,
		modelName: "SkeletonModel",
	},
	{
		id: "troll",
		displayName: "Troll",
		health: 400,
		speed: 6,
		damage: 45,
		attackCooldown: 2.5,
		moneyReward: 40,
		expReward: 20,
		weight: 10,
		isBoss: false,
		modelName: "TrollModel",
	},
	{
		id: "boss_lich",
		displayName: "Lich King",
		health: 5000,
		speed: 5,
		damage: 100,
		attackCooldown: 3.0,
		moneyReward: 500,
		expReward: 250,
		weight: 1,
		isBoss: true,
		modelName: "LichModel",
	},
	{
		id: "boss_dragon",
		displayName: "Dragon",
		health: 8000,
		speed: 7,
		damage: 150,
		attackCooldown: 2.5,
		moneyReward: 800,
		expReward: 400,
		weight: 1,
		isBoss: true,
		modelName: "DragonModel",
	},
];

export const EnemyConfigMap = new Map<string, EnemyDefinition>(
	EnemyConfig.map((def) => [def.id, def]),
);
