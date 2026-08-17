import { Players, UserInputService, ReplicatedStorage, Workspace, RunService } from "@rbxts/services";

const player = Players.LocalPlayer;
const camera = Workspace.CurrentCamera!;
const mouse = player.GetMouse();

const remotes = ReplicatedStorage.WaitForChild("Remotes");
const placeTowerRemote = remotes.WaitForChild("PlaceTower") as RemoteFunction;
const placeTroopRemote = remotes.WaitForChild("PlaceTroop") as RemoteFunction;

const assetsRoot = ReplicatedStorage.WaitForChild("Assets") as Folder;
const towerAssets = assetsRoot.WaitForChild("Towers") as Folder;
const troopAssets = assetsRoot.WaitForChild("Troops") as Folder;

// ─── Registry ─────────────────────────────────────────────────────────────────

interface PlacementEntry {
	readonly label: string;
	readonly kind: "tower" | "troop";
	readonly id: string;
	readonly modelName: string;
	readonly range: number;
	readonly rangeColor: Color3;
}

const KEYBINDS = new Map<Enum.KeyCode, PlacementEntry>([
	[Enum.KeyCode.One,   { label: "Swordsman",   kind: "troop", id: "swordsman", modelName: "SwordsmanLv1", range: 5,  rangeColor: Color3.fromRGB(80,  220, 80)  }],
	[Enum.KeyCode.Two,   { label: "Archer",       kind: "troop", id: "archer",    modelName: "ArcherLv1",    range: 18, rangeColor: Color3.fromRGB(80,  220, 80)  }],
	[Enum.KeyCode.Three, { label: "Mage",         kind: "troop", id: "mage",      modelName: "MageLv1",      range: 16, rangeColor: Color3.fromRGB(80,  220, 80)  }],
	[Enum.KeyCode.Four,  { label: "Archer Tower", kind: "tower", id: "archer",    modelName: "ArcherTower",  range: 20, rangeColor: Color3.fromRGB(80,  140, 255) }],
	[Enum.KeyCode.Five,  { label: "Fire Tower",   kind: "tower", id: "fire",      modelName: "FireTower",    range: 16, rangeColor: Color3.fromRGB(255, 100, 40)  }],
	[Enum.KeyCode.Six,   { label: "Ice Tower",    kind: "tower", id: "ice",       modelName: "IceTower",     range: 18, rangeColor: Color3.fromRGB(120, 220, 255) }],
	[Enum.KeyCode.Seven, { label: "Poison Tower", kind: "tower", id: "poison",    modelName: "PoisonTower",  range: 14, rangeColor: Color3.fromRGB(160, 255, 80)  }],
	[Enum.KeyCode.Eight, { label: "Cannon Tower", kind: "tower", id: "cannon",    modelName: "CannonTower",  range: 22, rangeColor: Color3.fromRGB(200, 200, 200) }],
]);

// ─── State ────────────────────────────────────────────────────────────────────

let activeEntry: PlacementEntry | undefined;
let ghostModel: Model | undefined;
let rangePart: Part | undefined;
let renderConnection: RBXScriptConnection | undefined;

// ─── Ghost helpers ────────────────────────────────────────────────────────────

function applyGhostAppearance(model: Model): void {
	for (const desc of model.GetDescendants()) {
		if (desc.IsA("BasePart")) {
			desc.Transparency = 0.5;
			desc.CanCollide = false;
			desc.CastShadow = false;
			desc.Anchored = true;
		}
		if (desc.IsA("Decal") || desc.IsA("Texture") || desc.IsA("SpecialMesh")) {
			// keep visuals, just leave as-is
		}
	}
}

function cloneGhost(entry: PlacementEntry): Model | undefined {
	const folder = entry.kind === "tower" ? towerAssets : troopAssets;
	const template = folder.FindFirstChild(entry.modelName, true) as Model | undefined;
	if (!template) {
		warn(`[Ghost] Model '${entry.modelName}' not found in ReplicatedStorage.Assets.${entry.kind === "tower" ? "Towers" : "Troops"}`);
		return undefined;
	}
	const clone = template.Clone();
	applyGhostAppearance(clone);
	clone.Name = "PlacementGhost";
	clone.Parent = Workspace;
	return clone;
}

function buildRangeDisc(entry: PlacementEntry): Part {
	const diameter = entry.range * 2;
	const part = new Instance("Part");
	part.Name = "PlacementRange";
	part.Shape = Enum.PartType.Cylinder;
	part.Size = new Vector3(0.15, diameter, diameter);
	part.Anchored = true;
	part.CanCollide = false;
	part.CastShadow = false;
	part.Color = entry.rangeColor;
	part.Transparency = 0.65;
	part.Material = Enum.Material.Neon;
	part.Parent = Workspace;
	return part;
}

// ─── Raycast ─────────────────────────────────────────────────────────────────

function getMouseWorldPos(): Vector3 | undefined {
	const excludes: Instance[] = [];
	if (ghostModel) excludes.push(ghostModel);
	if (rangePart) excludes.push(rangePart);
	const char = player.Character;
	if (char) excludes.push(char);

	const params = new RaycastParams();
	params.FilterType = Enum.RaycastFilterType.Exclude;
	params.FilterDescendantsInstances = excludes;

	const unitRay = camera.ScreenPointToRay(mouse.X, mouse.Y);
	const result = Workspace.Raycast(unitRay.Origin, unitRay.Direction.mul(1000), params);
	return result ? result.Position : undefined;
}

// ─── Start / cancel ───────────────────────────────────────────────────────────

function cancelPlacement(): void {
	if (ghostModel) { ghostModel.Destroy(); ghostModel = undefined; }
	if (rangePart)  { rangePart.Destroy();  rangePart = undefined;  }
	if (renderConnection) { renderConnection.Disconnect(); renderConnection = undefined; }
	activeEntry = undefined;
	mouse.Icon = "";
}

function startPlacement(entry: PlacementEntry): void {
	cancelPlacement();

	const ghost = cloneGhost(entry);
	if (!ghost) {
		warn(`[Placement] Cannot start placement — ghost model missing for '${entry.modelName}'`);
		return;
	}

	activeEntry = entry;
	ghostModel = ghost;
	rangePart = buildRangeDisc(entry);
	mouse.Icon = "rbxasset://textures/GunCursor.png";

	print(`[Placement] '${entry.label}' — LMB to place, RMB/Esc to cancel`);

	renderConnection = RunService.RenderStepped.Connect(() => {
		const pos = getMouseWorldPos();
		if (!pos || !ghostModel || !ghostModel.PrimaryPart || !rangePart) return;

		// Place pivot at surface, then lift so feet touch the ground
		ghostModel.PivotTo(new CFrame(pos));
		const [boxCF, boxSize] = ghostModel.GetBoundingBox();
		const bottomY = boxCF.Position.Y - boxSize.Y / 2;
		const lift = pos.Y - bottomY;
		ghostModel.PivotTo(new CFrame(new Vector3(pos.X, pos.Y + lift, pos.Z)));

		// Range disc sits flat on the surface directly under the model
		rangePart.CFrame = new CFrame(new Vector3(pos.X, pos.Y + 0.05, pos.Z))
			.mul(CFrame.Angles(0, 0, math.pi / 2));
	});
}

// ─── Input ───────────────────────────────────────────────────────────────────

UserInputService.InputBegan.Connect((input, gameProcessed) => {
	if (gameProcessed) return;

	if (input.KeyCode === Enum.KeyCode.Escape) {
		cancelPlacement();
		return;
	}

	const entry = KEYBINDS.get(input.KeyCode);
	if (entry !== undefined) {
		startPlacement(entry);
	}
});

mouse.Button1Down.Connect(() => {
	if (!activeEntry) return;

	const pos = getMouseWorldPos();
	if (!pos) {
		warn("[Placement] No surface hit — point your cursor at the ground");
		return;
	}

	const entry = activeEntry;
	cancelPlacement();

	if (entry.kind === "tower") {
		const ok = placeTowerRemote.InvokeServer(entry.id, pos) as boolean;
		print(`[Placement] Tower '${entry.label}': ${ok ? "placed ✓" : "FAILED — check server output for reason"}`);
	} else {
		const ok = placeTroopRemote.InvokeServer(entry.id, pos) as boolean;
		print(`[Placement] Troop '${entry.label}': ${ok ? "placed ✓" : "FAILED — check server output for reason"}`);
	}
});

mouse.Button2Down.Connect(() => {
	if (activeEntry) cancelPlacement();
});

print("[Client] Ready | 1:Swordsman 2:Archer 3:Mage | 4:Archer 5:Fire 6:Ice 7:Poison 8:Cannon | LMB=Place RMB/Esc=Cancel");
