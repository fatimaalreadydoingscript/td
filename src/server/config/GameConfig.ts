export const GameConfig = {
	DEBUG: true,

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

	SpawnRingRadius: 70,
	SpawnMinHeight: 8,
	SpawnMaxHeight: 20,

	BaseSpawnMin: 2,
	BaseSpawnMax: 5,

	FishSpinSpeed: 0.9,
	FishDescentSpeed: 1.4,

	BaseMoneyPerKill: 10,
	BaseExpPerKill: 5,
};

export type GameConfigType = typeof GameConfig;
