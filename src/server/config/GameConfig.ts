export const GameConfig = {
	DEBUG: true,

	MaxEnemies: 150,
	SpawnRate: 1.5,
	HealthScaling: 0.08,
	SiegeScaling: 0.03,
	SiegeFirstBonus: 0.5,
	SiegeDuration: 90,
	BossInterval: 600,
	SiegeInterval: 600,
	BubbleInterval: 600,
	BubbleDuration: 60,
	BossUnlockMinutes: 30,
	SiegeUnlockMinutes: 30,

	SpawnRadius: 8,
	SpawnHeightOffset: 12,

	BaseSpawnMin: 2,
	BaseSpawnMax: 5,

	BaseMoneyPerKill: 10,
	BaseExpPerKill: 5,
};

export type GameConfigType = typeof GameConfig;
