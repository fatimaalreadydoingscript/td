import { Workspace } from "@rbxts/services";
import { PlotService } from "./PlotService";
import { LevelService } from "./LevelService";
import { EnemyService } from "./EnemyService";
import { MathUtil } from "../utils/MathUtil";
import { GameConfig } from "../config/GameConfig";

const DEBUG = GameConfig.DEBUG;
const BUBBLE_SPEED = 12;
const BUBBLE_SPEED_BOOST = 2.0;
const BUBBLE_RADIUS = 4;
// Re-applied every frame an enemy is inside the bubble; lapses shortly after it leaves.
const BUBBLE_BOOST_LINGER = 0.25;

interface BubbleInstance {
	readonly id: string;
	part: BasePart;
	readonly plotId: string;
	readonly targetPosition: Vector3;
	expiresAt: number;
}

let bubbleCounter = 0;

export class BubbleService {
	private bubbles = new Map<string, BubbleInstance>();
	private bubbleFolder: Folder;
	private plotService: PlotService;
	private levelService: LevelService;
	private enemyService: EnemyService;

	constructor(plotService: PlotService, levelService: LevelService, enemyService: EnemyService) {
		this.plotService = plotService;
		this.levelService = levelService;
		this.enemyService = enemyService;

		this.bubbleFolder = new Instance("Folder");
		this.bubbleFolder.Name = "Bubbles";
		this.bubbleFolder.Parent = Workspace;
	}

	initialize(): void {
		this.levelService.onBubble(() => this.spawnBubblesOnAllPlots());
	}

	update(dt: number): void {
		const now = os.clock();
		const toRemove: string[] = [];

		this.bubbles.forEach((bubble, id) => {
			if (now >= bubble.expiresAt) {
				toRemove.push(id);
				return;
			}

			const newPos = MathUtil.moveToward(bubble.part.Position, bubble.targetPosition, BUBBLE_SPEED, dt);
			bubble.part.CFrame = new CFrame(newPos);

			this.enemyService.getAliveEnemiesOnPlot(bubble.plotId).forEach((enemy) => {
				const dist = MathUtil.distance(enemy.part.Position, bubble.part.Position);
				if (dist <= BUBBLE_RADIUS) {
					this.enemyService.applyBoost(enemy.uid, BUBBLE_SPEED_BOOST, BUBBLE_BOOST_LINGER);
				}
			});
		});

		for (const id of toRemove) {
			this.despawnBubble(id);
		}
	}

	private spawnBubblesOnAllPlots(): void {
		for (const plot of this.plotService.getAllPlots()) {
			this.spawnBubble(plot.id);
		}
	}

	private spawnBubble(plotId: string): void {
		const plot = this.plotService.getPlotById(plotId);
		if (!plot) return;

		bubbleCounter++;
		const id = `bubble_${bubbleCounter}`;

		const part = new Instance("Part");
		part.Name = "Bubble";
		part.Shape = Enum.PartType.Ball;
		part.Size = new Vector3(BUBBLE_RADIUS * 2, BUBBLE_RADIUS * 2, BUBBLE_RADIUS * 2);
		part.CFrame = new CFrame(plot.spawner.Position.add(new Vector3(0, 5, 0)));
		part.Anchored = true;
		part.CanCollide = false;
		part.Transparency = 0.6;
		part.BrickColor = new BrickColor("Cyan");
		part.Parent = this.bubbleFolder;

		const bubble: BubbleInstance = {
			id,
			part,
			plotId,
			targetPosition: plot.core.Position,
			expiresAt: os.clock() + GameConfig.BubbleDuration,
		};

		this.bubbles.set(id, bubble);
		if (DEBUG) print(`[BubbleService] Bubble spawned on plot '${plotId}'.`);
	}

	private despawnBubble(id: string): void {
		const bubble = this.bubbles.get(id);
		if (!bubble) return;

		bubble.part.Destroy();
		this.bubbles.delete(id);
		if (DEBUG) print(`[BubbleService] Bubble '${id}' despawned.`);
	}

	getActiveBubbleCount(): number {
		return this.bubbles.size();
	}
}
