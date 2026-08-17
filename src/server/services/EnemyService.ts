import { Workspace } from "@rbxts/services";
import { EnemyInstance, EnemyState } from "../models/EnemyModel";
import { EnemyDefinition } from "../config/EnemyConfig";
import { GameConfig } from "../config/GameConfig";
import { MathUtil } from "../utils/MathUtil";
import { ModelLoader } from "../utils/ModelLoader";

const DEBUG = GameConfig.DEBUG;
let uidCounter = 0;

function generateUid(): string {
	uidCounter++;
	return `enemy_${uidCounter}`;
}

export class EnemyService {
	private enemies = new Map<string, EnemyInstance>();
	private pool = new Map<string, BasePart[]>();
	private partToUid = new Map<BasePart, string>();
	private enemyFolder: Folder;

	constructor() {
		this.enemyFolder = new Instance("Folder");
		this.enemyFolder.Name = "Enemies";
		this.enemyFolder.Parent = Workspace;
	}

	spawn(
		def: EnemyDefinition,
		plotId: string,
		spawnPosition: Vector3,
		healthMultiplier: number,
	): EnemyInstance | undefined {
		const part = this.acquirePart(def, spawnPosition);
		if (!part) return undefined;

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
			spawnTime: os.clock(),
			hoverY: spawnPosition.Y,
		};

		this.enemies.set(instance.uid, instance);
		this.partToUid.set(part, instance.uid);
		if (DEBUG) print(`[EnemyService] Spawned '${def.id}' (uid=${instance.uid}) on plot '${plotId}'.`);
		return instance;
	}

	despawn(uid: string): void {
		const instance = this.enemies.get(uid);
		if (!instance) return;

		instance.state = "pooled";
		this.enemies.delete(uid);
		this.partToUid.delete(instance.part);
		this.returnToPool(instance.definitionId, instance.part);
		if (DEBUG) print(`[EnemyService] Despawned enemy uid=${uid}.`);
	}

	kill(uid: string): EnemyInstance | undefined {
		const instance = this.enemies.get(uid);
		if (!instance || instance.state !== "alive") return undefined;

		instance.state = "dead";
		this.enemies.delete(uid);
		this.partToUid.delete(instance.part);
		this.returnToPool(instance.definitionId, instance.part);
		if (DEBUG) print(`[EnemyService] Killed enemy uid=${uid}.`);
		return instance;
	}

	getUidByPart(part: BasePart): string | undefined {
		return this.partToUid.get(part);
	}

	update(dt: number, getTargetPosition: (enemy: EnemyInstance) => Vector3 | undefined): void {
		const now          = os.clock();
		const descentSpeed = 1.5;

		this.enemies.forEach((enemy) => {
			if (enemy.state !== "alive") return;
			if (enemy.isStunned) {
				if (now < enemy.stunExpiry) return;
				enemy.isStunned = false;
			}

			const target = getTargetPosition(enemy);
			if (!target) return;

			const cur = enemy.part.Position;

			const newX = MathUtil.moveToward(
				new Vector3(cur.X, 0, cur.Z),
				new Vector3(target.X, 0, target.Z),
				enemy.speed,
				dt,
			);
			const newY = cur.Y > target.Y
				? math.max(target.Y, cur.Y - descentSpeed * dt)
				: cur.Y;

			const finalPos = new Vector3(newX.X, newY, newX.Z);
			const toCore   = new Vector3(target.X - finalPos.X, 0, target.Z - finalPos.Z);

			const model = enemy.part.Parent;
			if (model && model.IsA("Model")) {
				const cf = toCore.Magnitude > 0.01
					? CFrame.lookAt(finalPos, finalPos.add(toCore))
					: new CFrame(finalPos);
				model.PivotTo(cf);
			} else {
				enemy.part.CFrame = new CFrame(finalPos);
			}
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

	getFolder(): Folder {
		return this.enemyFolder;
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

	private acquirePart(def: EnemyDefinition, position: Vector3): BasePart | undefined {
		const poolBucket = this.pool.get(def.id);

		if (poolBucket && poolBucket.size() > 0) {
			const part = poolBucket.pop()!;
			ModelLoader.respawnEnemy(part, position);
			return part;
		}

		return ModelLoader.spawnEnemy(def.modelName, position, this.enemyFolder);
	}

	private returnToPool(defId: string, part: BasePart): void {
		ModelLoader.poolEnemy(part);

		let bucket = this.pool.get(defId);
		if (!bucket) {
			bucket = [];
			this.pool.set(defId, bucket);
		}
		bucket.push(part);
	}
}
