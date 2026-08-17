import { ReplicatedStorage } from "@rbxts/services";

const ASSET_WAIT_SECONDS = 10;

// An untimed WaitForChild here hangs the whole server silently: this module is
// imported by Enemy/Tower/TroopService, so the require chain from main.server
// never reaches GameService.start(). Fail loudly instead.
function requireFolder(parent: Instance, name: string): Folder {
	const found = parent.WaitForChild(name, ASSET_WAIT_SECONDS) as Folder | undefined;
	if (!found) {
		error(
			`[ModelLoader] '${name}' was not found under ${parent.GetFullName()} within ${ASSET_WAIT_SECONDS}s. ` +
				`The game cannot start without it. Expected ReplicatedStorage.Assets with Enemies, Towers and Troops folders inside.`,
		);
	}
	return found;
}

const assetsRoot = requireFolder(ReplicatedStorage, "Assets");
const enemyAssets = requireFolder(assetsRoot, "Enemies");
const towerAssets = requireFolder(assetsRoot, "Towers");
const troopAssets = requireFolder(assetsRoot, "Troops");

function cloneModel(folder: Folder, modelName: string): Model | undefined {
	const template = folder.FindFirstChild(modelName, true) as Model | undefined;
	if (!template) {
		warn(`[ModelLoader] Model '${modelName}' not found in ${folder.GetFullName()}`);
		return undefined;
	}
	return template.Clone();
}

function getPrimaryPart(model: Model): BasePart | undefined {
	const primary = model.PrimaryPart;
	if (primary) return primary;

	// Fall back to any BasePart rather than rejecting the model outright — a
	// forgotten PrimaryPart is the most common reason art fails to place.
	const fallback = model.FindFirstChildWhichIsA("BasePart", true);
	if (fallback) {
		model.PrimaryPart = fallback;
		warn(`[ModelLoader] Model '${model.Name}' has no PrimaryPart; falling back to '${fallback.Name}'.`);
		return fallback;
	}

	warn(`[ModelLoader] Model '${model.Name}' has no BasePart to use as a PrimaryPart.`);
	return undefined;
}

function anchorModel(model: Model): void {
	for (const desc of model.GetDescendants()) {
		if (desc.IsA("BasePart")) {
			desc.Anchored = true;
			desc.CanCollide = false;
		}
	}
}

function placeOnSurface(model: Model, surfacePos: Vector3): void {
	model.PivotTo(new CFrame(surfacePos));
	const [boxCF, boxSize] = model.GetBoundingBox();
	const bottomY = boxCF.Position.Y - boxSize.Y / 2;
	const lift = surfacePos.Y - bottomY;
	model.PivotTo(new CFrame(new Vector3(surfacePos.X, surfacePos.Y + lift, surfacePos.Z)));
}

export namespace ModelLoader {
	// Enemies spawn in mid-air — no surface snapping, but must be anchored
	export function spawnEnemy(modelName: string, position: Vector3, parent: Instance): BasePart | undefined {
		const model = cloneModel(enemyAssets, modelName);
		if (!model) return undefined;

		const primary = getPrimaryPart(model);
		if (!primary) {
			model.Destroy();
			return undefined;
		}

		anchorModel(model);
		model.PivotTo(new CFrame(position));
		model.Parent = parent;
		return primary;
	}

	export function despawnModel(part: BasePart): void {
		const model = part.Parent;
		if (model && model.IsA("Model")) {
			model.Destroy();
		} else {
			part.Destroy();
		}
	}

	export function poolEnemy(part: BasePart): void {
		const model = part.Parent;
		if (model && model.IsA("Model")) {
			model.PivotTo(new CFrame(new Vector3(0, -500, 0)));
		}
	}

	export function respawnEnemy(part: BasePart, position: Vector3): void {
		const model = part.Parent;
		if (model && model.IsA("Model")) {
			model.PivotTo(new CFrame(position));
			for (const desc of model.GetDescendants()) {
				if (desc.IsA("BasePart")) {
					desc.Anchored = true;
					desc.CanCollide = false;
				}
			}
		}
	}

	export function placeTower(modelName: string, position: Vector3, parent: Instance): BasePart | undefined {
		const model = cloneModel(towerAssets, modelName);
		if (!model) return undefined;

		const primary = getPrimaryPart(model);
		if (!primary) {
			model.Destroy();
			return undefined;
		}

		anchorModel(model);
		placeOnSurface(model, position);
		model.Parent = parent;
		return primary;
	}

	export function placeTroop(modelName: string, position: Vector3, parent: Instance): BasePart | undefined {
		const model = cloneModel(troopAssets, modelName);
		if (!model) return undefined;

		const primary = getPrimaryPart(model);
		if (!primary) {
			model.Destroy();
			return undefined;
		}

		anchorModel(model);
		placeOnSurface(model, position);
		model.Parent = parent;
		return primary;
	}

	export function swapTroopModel(oldPart: BasePart, newModelName: string, parent: Instance): BasePart | undefined {
		const oldModel = oldPart.Parent;

		// Recover the ground the old model stood on. Passing its part position
		// straight to placeOnSurface would lift the replacement a second time,
		// so each upgrade would raise the troop off the floor.
		let surfacePos = oldPart.Position;
		if (oldModel && oldModel.IsA("Model")) {
			const [boxCF, boxSize] = oldModel.GetBoundingBox();
			surfacePos = new Vector3(boxCF.Position.X, boxCF.Position.Y - boxSize.Y / 2, boxCF.Position.Z);
		}

		const newModel = cloneModel(troopAssets, newModelName);
		if (!newModel) return undefined;

		const newPrimary = getPrimaryPart(newModel);
		if (!newPrimary) {
			newModel.Destroy();
			return undefined;
		}

		anchorModel(newModel);
		placeOnSurface(newModel, surfacePos);
		newModel.Parent = parent;

		if (oldModel && oldModel.IsA("Model")) {
			oldModel.Destroy();
		} else {
			oldPart.Destroy();
		}

		return newPrimary;
	}
}
