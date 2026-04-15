import { Workspace } from "@rbxts/services";
import { EnemyInstance, EnemyState } from "../models/EnemyModel";
import { EnemyDefinition } from "../config/EnemyConfig";
import { GameConfig } from "../config/GameConfig";
import { MathUtil } from "../utils/MathUtil";

const DEBUG = GameConfig.DEBUG;
let uidCounter = 0;

function generateUid(): string {
	uidCounter++;
	return `enemy_${uidCounter}`;
}

export class EnemyService {
	private enemies = new Map<string, EnemyInstance>();
	private pool: BasePart[] = [];
	private enemyFolder: Folder;

	constructor() {
		this.enemyFolder = new Instance("Folder");
		this.enemyFolder.Name = "Enemies";
		this.enemyFolder.Parent = Workspace;
	}

	spawn(def: EnemyDefinition, plotId: string, spawnPosition: Vector3, healthMultiplier: number): EnemyInstance | undefined {
		if (this.enemies.size() >= GameConfig.MaxEnemies) {
			if (DEBUG) warn("[EnemyService] Max enemy cap reached.");
			return undefined;
		}

		const part = this.acquirePart(def);
		part.CFrame = new CFrame(spawnPosition);

		const scaledHealth = math.floor(def.health * healthMultiplier);

		const instance: EnemyInstance = {
			uid: generateUid(),
			definitionId: def.id,
			plotId,
			part,
			health: scaledHealth,
			maxHealth: scaledHealth,
			speed: def.speed,
			baseSpeed: def.speed,
			damage: def.damage,
			attackCooldown: def.attackCooldown,
			lastAttackTime: 0,
			moneyReward: def.moneyReward,
			expReward: def.expReward,
			isBoss: def.isBoss,
			state: "alive",
			effects: {},
			isStunned: false,
			stunExpiry: 0,
			targetId: undefined,
		};

		this.enemies.set(instance.uid, instance);

		if (DEBUG) print(`[EnemyService] Spawned '${def.id}' (uid=${instance.uid}) on plot '${plotId}'.`);
		return instance;
	}

	despawn(uid: string): void {
		const instance = this.enemies.get(uid);
		if (!instance) return;

		instance.state = "pooled";
		this.enemies.delete(uid);
		this.returnPart(instance.part);

		if (DEBUG) print(`[EnemyService] Despawned enemy uid=${uid}.`);
	}

	kill(uid: string): EnemyInstance | undefined {
		const instance = this.enemies.get(uid);
		if (!instance || instance.state !== "alive") return undefined;

		instance.state = "dead";
		this.enemies.delete(uid);
		this.returnPart(instance.part);

		if (DEBUG) print(`[EnemyService] Killed enemy uid=${uid}.`);
		return instance;
	}

	update(dt: number, getTargetPosition: (enemy: EnemyInstance) => Vector3 | undefined): void {
		const now = os.clock();

		this.enemies.forEach((enemy) => {
			if (enemy.state !== "alive") return;

			if (enemy.isStunned && now < enemy.stunExpiry) return;
			if (enemy.isStunned) {
				enemy.isStunned = false;
			}

			const target = getTargetPosition(enemy);
			if (!target) return;

			const effectiveSpeed = enemy.speed;
			const newPos = MathUtil.moveToward(enemy.part.Position, target, effectiveSpeed, dt);
			enemy.part.CFrame = new CFrame(newPos);
		});
	}

	applyDamage(uid: string, amount: number): boolean {
		const enemy = this.enemies.get(uid);
		if (!enemy || enemy.state !== "alive") return false;

		enemy.health = math.max(0, enemy.health - amount);
		return enemy.health <= 0;
	}

	applyStun(uid: string, duration: number): void {
		const enemy = this.enemies.get(uid);
		if (!enemy || enemy.state !== "alive") return;
		enemy.isStunned = true;
		enemy.stunExpiry = os.clock() + duration;
	}

	setSpeed(uid: string, speed: number): void {
		const enemy = this.enemies.get(uid);
		if (!enemy) return;
		enemy.speed = speed;
	}

	resetSpeed(uid: string): void {
		const enemy = this.enemies.get(uid);
		if (!enemy) return;
		enemy.speed = enemy.baseSpeed;
	}

	getEnemy(uid: string): EnemyInstance | undefined {
		return this.enemies.get(uid);
	}

	getAllEnemies(): ReadonlyMap<string, EnemyInstance> {
		return this.enemies;
	}

	getAliveEnemiesOnPlot(plotId: string): EnemyInstance[] {
		const result: EnemyInstance[] = [];
		this.enemies.forEach((e) => {
			if (e.plotId === plotId && e.state === "alive") result.push(e);
		});
		return result;
	}

	getCount(): number {
		return this.enemies.size();
	}

	private acquirePart(def: EnemyDefinition): BasePart {
		if (this.pool.size() > 0) {
			const part = this.pool.pop()!;
			part.Size = new Vector3(3, 3, 3);
			part.Anchored = false;
			part.CanCollide = false;
			part.Transparency = 0;
			return part;
		}

		const part = new Instance("Part");
		part.Name = def.id;
		part.Size = new Vector3(3, 3, 3);
		part.Anchored = true;
		part.CanCollide = false;
		part.CastShadow = false;
		part.Parent = this.enemyFolder;
		return part;
	}

	private returnPart(part: BasePart): void {
		part.Anchored = true;
		part.CFrame = new CFrame(new Vector3(0, -500, 0));
		this.pool.push(part);
	}
}
