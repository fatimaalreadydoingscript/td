import { Players, ReplicatedStorage } from "@rbxts/services";
import { PlacementController } from "./PlacementController";
import { TroopConfig } from "../config/TroopConfig";
import { GameConfig } from "../config/GameConfig";

const DEBUG = GameConfig.DEBUG;

export class InputController {
	private placementController: PlacementController;
	private remotes: Folder;

	constructor(placementController: PlacementController) {
		this.placementController = placementController;

		let remotesFolder = ReplicatedStorage.FindFirstChild("Remotes") as Folder | undefined;
		if (!remotesFolder) {
			remotesFolder = new Instance("Folder");
			remotesFolder.Name = "Remotes";
			remotesFolder.Parent = ReplicatedStorage;
		}
		this.remotes = remotesFolder;
	}

	initialize(): void {
		this.setupPlaceTowerRemote();
		this.setupPlaceTroopRemote();
		this.setupUpgradeTroopRemote();
		if (DEBUG) print("[InputController] Remotes initialized.");
	}

	private setupPlaceTowerRemote(): void {
		let remote = this.remotes.FindFirstChild("PlaceTower") as RemoteFunction | undefined;
		if (!remote) {
			remote = new Instance("RemoteFunction");
			remote.Name = "PlaceTower";
			remote.Parent = this.remotes;
		}

		remote.OnServerInvoke = (player: Player, towerId: unknown, position: unknown): boolean => {
			if (typeIs(towerId, "string") && typeIs(position, "Vector3")) {
				return this.placementController.placeTower(player, towerId, position);
			}
			if (DEBUG) warn(`[InputController] PlaceTower: invalid args from ${player.Name}.`);
			return false;
		};
	}

	private setupPlaceTroopRemote(): void {
		let remote = this.remotes.FindFirstChild("PlaceTroop") as RemoteFunction | undefined;
		if (!remote) {
			remote = new Instance("RemoteFunction");
			remote.Name = "PlaceTroop";
			remote.Parent = this.remotes;
		}

		remote.OnServerInvoke = (player: Player, troopId: unknown, snapPosition: unknown): boolean => {
			if (typeIs(troopId, "string") && typeIs(snapPosition, "Vector3")) {
				return this.placementController.placeTroop(player, troopId, snapPosition);
			}
			if (DEBUG) warn(`[InputController] PlaceTroop: invalid args from ${player.Name}.`);
			return false;
		};
	}

	private setupUpgradeTroopRemote(): void {
		let remote = this.remotes.FindFirstChild("UpgradeTroop") as RemoteFunction | undefined;
		if (!remote) {
			remote = new Instance("RemoteFunction");
			remote.Name = "UpgradeTroop";
			remote.Parent = this.remotes;
		}

		remote.OnServerInvoke = (player: Player, troopUid: unknown): boolean => {
			if (typeIs(troopUid, "string")) {
				return this.placementController.upgradeTroop(player, troopUid);
			}
			if (DEBUG) warn(`[InputController] UpgradeTroop: invalid args from ${player.Name}.`);
			return false;
		};
	}

	getTroopHotkeyMap(): Map<number, string> {
		const map = new Map<number, string>();
		for (const def of TroopConfig) {
			map.set(def.hotkey, def.id);
		}
		return map;
	}
}
