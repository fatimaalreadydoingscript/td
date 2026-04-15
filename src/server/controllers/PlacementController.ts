import { Players } from "@rbxts/services";
import { TowerService } from "../services/TowerService";
import { TroopService } from "../services/TroopService";
import { EconomyService } from "../services/EconomyService";
import { PlotService } from "../services/PlotService";
import { TowerConfigMap } from "../config/TowerConfig";
import { TroopConfigMap } from "../config/TroopConfig";
import { GameConfig } from "../config/GameConfig";

const DEBUG = GameConfig.DEBUG;

export class PlacementController {
	private towerService: TowerService;
	private troopService: TroopService;
	private economyService: EconomyService;
	private plotService: PlotService;

	constructor(
		towerService: TowerService,
		troopService: TroopService,
		economyService: EconomyService,
		plotService: PlotService,
	) {
		this.towerService = towerService;
		this.troopService = troopService;
		this.economyService = economyService;
		this.plotService = plotService;
	}

	placeTower(player: Player, towerId: string, position: Vector3): boolean {
		const def = TowerConfigMap.get(towerId);
		if (!def) {
			if (DEBUG) warn(`[PlacementController] Unknown tower id '${towerId}'.`);
			return false;
		}

		const plot = this.plotService.getPlotByPlayer(player);
		if (!plot) {
			if (DEBUG) warn(`[PlacementController] ${player.Name} has no plot.`);
			return false;
		}

		if (!this.plotService.isPositionInPlot(plot.id, position)) {
			if (DEBUG) warn(`[PlacementController] Position outside plot bounds for ${player.Name}.`);
			return false;
		}

		if (!this.economyService.canAfford(player, def.cost)) {
			if (DEBUG) warn(`[PlacementController] ${player.Name} cannot afford tower '${towerId}' (cost: ${def.cost}).`);
			return false;
		}

		const tower = this.towerService.place(def, plot.id, tostring(player.UserId), position);
		if (!tower) return false;

		this.economyService.spendMoney(player, def.cost);
		if (DEBUG) print(`[PlacementController] ${player.Name} placed tower '${towerId}'.`);
		return true;
	}

	placeTroop(player: Player, troopId: string, snapPosition: Vector3): boolean {
		const def = TroopConfigMap.get(troopId);
		if (!def) {
			if (DEBUG) warn(`[PlacementController] Unknown troop id '${troopId}'.`);
			return false;
		}

		const plot = this.plotService.getPlotByPlayer(player);
		if (!plot) {
			if (DEBUG) warn(`[PlacementController] ${player.Name} has no plot.`);
			return false;
		}

		if (!this.plotService.isPositionInPlot(plot.id, snapPosition)) {
			if (DEBUG) warn(`[PlacementController] Snap position outside plot bounds for ${player.Name}.`);
			return false;
		}

		if (!this.economyService.canAfford(player, def.cost)) {
			if (DEBUG) warn(`[PlacementController] ${player.Name} cannot afford troop '${troopId}' (cost: ${def.cost}).`);
			return false;
		}

		const troop = this.troopService.place(def, plot.id, tostring(player.UserId), snapPosition);
		if (!troop) return false;

		this.economyService.spendMoney(player, def.cost);
		if (DEBUG) print(`[PlacementController] ${player.Name} placed troop '${troopId}'.`);
		return true;
	}

	upgradeTroop(player: Player, troopUid: string): boolean {
		const troop = this.troopService.getTroop(troopUid);
		if (!troop) return false;

		const plot = this.plotService.getPlotByPlayer(player);
		if (!plot || troop.plotId !== plot.id) return false;

		const def = TroopConfigMap.get(troop.definitionId);
		if (!def) return false;

		const nextLevel = troop.upgradeLevel + 1;
		const nextUpgrade = def.upgrades.find((u) => u.level === nextLevel);
		if (!nextUpgrade) {
			if (DEBUG) warn(`[PlacementController] Troop ${troopUid} already at max level.`);
			return false;
		}

		if (!this.economyService.canAfford(player, nextUpgrade.cost)) {
			if (DEBUG) warn(`[PlacementController] ${player.Name} cannot afford upgrade (cost: ${nextUpgrade.cost}).`);
			return false;
		}

		this.economyService.spendMoney(player, nextUpgrade.cost);
		this.troopService.upgrade(troopUid);

		if (DEBUG) print(`[PlacementController] ${player.Name} upgraded troop ${troopUid} to level ${nextLevel}.`);
		return true;
	}
}
