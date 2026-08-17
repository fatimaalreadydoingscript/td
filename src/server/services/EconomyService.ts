import { Players } from "@rbxts/services";
import { GameConfig } from "../config/GameConfig";

interface PlayerEconomy {
	money: number;
	exp: number;
	totalMoneyEarned: number;
	totalExpEarned: number;
}

const DEBUG = GameConfig.DEBUG;

export class EconomyService {
	private ledger = new Map<number, PlayerEconomy>();

	initialize(): void {
		Players.PlayerAdded.Connect((player) => {
			this.ledger.set(player.UserId, {
				money: GameConfig.DEBUG ? 999999 : 0,
				exp: 0,
				totalMoneyEarned: 0,
				totalExpEarned: 0,
			});
			if (DEBUG) print(`[EconomyService] Ledger created for ${player.Name}.`);
		});

		Players.PlayerRemoving.Connect((player) => {
			this.ledger.delete(player.UserId);
		});

		for (const player of Players.GetPlayers()) {
			this.ledger.set(player.UserId, {
				money: GameConfig.DEBUG ? 999999 : 0,
				exp: 0,
				totalMoneyEarned: 0,
				totalExpEarned: 0,
			});
		}
	}

	rewardKill(player: Player, money: number, exp: number): void {
		const ledger = this.ledger.get(player.UserId);
		if (!ledger) return;

		ledger.money += money;
		ledger.exp += exp;
		ledger.totalMoneyEarned += money;
		ledger.totalExpEarned += exp;

		if (DEBUG) print(`[EconomyService] ${player.Name} earned ${money}g ${exp}xp. Total: ${ledger.money}g ${ledger.exp}xp.`);
	}

	spendMoney(player: Player, amount: number): boolean {
		const ledger = this.ledger.get(player.UserId);
		if (!ledger || ledger.money < amount) return false;

		ledger.money -= amount;
		if (DEBUG) print(`[EconomyService] ${player.Name} spent ${amount}g. Remaining: ${ledger.money}g.`);
		return true;
	}

	getMoney(player: Player): number {
		return this.ledger.get(player.UserId)?.money ?? 0;
	}

	getExp(player: Player): number {
		return this.ledger.get(player.UserId)?.exp ?? 0;
	}

	canAfford(player: Player, amount: number): boolean {
		return this.getMoney(player) >= amount;
	}

	getLedger(player: Player): Readonly<PlayerEconomy> | undefined {
		return this.ledger.get(player.UserId);
	}
}
