import { ServerStorage } from "@rbxts/services";

const assetsRoot = ServerStorage.WaitForChild("Assets") as Folder;
const enemyAssets = assetsRoot.WaitForChild("Enemies") as Folder;
const towerAssets = assetsRoot.WaitForChild("Towers") as Folder;
const troopAssets = assetsRoot.WaitForChild("Troops") as Folder;

function cloneModel(folder: Folder, modelName: string): Model | undefined {
	const template = folder.FindFirstChild(modelName) as Model | undefined;
	if (!template) {
		warn(`[ModelLoader] Model '${modelName}' not found in ${folder.GetFullName()}`);
		return undefined;
	}
	return template.Clone();
}

function getPrimaryPart(model: Model): BasePart | undefined {
	const primary = model.PrimaryPart;
	if (!primary) {
		warn(`[ModelLoader] Model '${model.Name}' has no PrimaryPart set.`);
		return undefined;
	}
	return primary;
}

export namespace ModelLoader {
	export function spawnEnemy(modelName: string, position: Vector3, parent: Instance): BasePart | undefined {
		const model = cloneModel(enemyAssets, modelName);
		if (!model) return undefined;

		const primary = getPrimaryPart(model);
		if (!primary) {
			model.Destroy();
			return undefined;
		}

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

		model.PivotTo(new CFrame(position));
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

		model.PivotTo(new CFrame(position));
		model.Parent = parent;
		return primary;
	}

	export function swapTroopModel(oldPart: BasePart, newModelName: string, parent: Instance): BasePart | undefined {
		const oldModel = oldPart.Parent;
		const position = oldPart.Position;

		const newModel = cloneModel(troopAssets, newModelName);
		if (!newModel) return undefined;

		const newPrimary = getPrimaryPart(newModel);
		if (!newPrimary) {
			newModel.Destroy();
			return undefined;
		}

		newModel.PivotTo(new CFrame(position));
		newModel.Parent = parent;

		if (oldModel && oldModel.IsA("Model")) {
			oldModel.Destroy();
		} else {
			oldPart.Destroy();
		}

		return newPrimary;
	}
}
