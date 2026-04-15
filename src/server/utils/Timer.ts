export class Timer {
	private elapsed: number = 0;
	private readonly interval: number;
	private running: boolean = false;

	constructor(interval: number) {
		this.interval = interval;
	}

	start(): void {
		this.running = true;
		this.elapsed = 0;
	}

	stop(): void {
		this.running = false;
	}

	reset(): void {
		this.elapsed = 0;
	}

	tick(dt: number): boolean {
		if (!this.running) return false;
		this.elapsed += dt;
		if (this.elapsed >= this.interval) {
			this.elapsed -= this.interval;
			return true;
		}
		return false;
	}

	getElapsed(): number {
		return this.elapsed;
	}

	getProgress(): number {
		return math.clamp(this.elapsed / this.interval, 0, 1);
	}

	isRunning(): boolean {
		return this.running;
	}
}

export class Stopwatch {
	private startTime: number = 0;
	private running: boolean = false;
	private accumulated: number = 0;

	start(): void {
		if (!this.running) {
			this.startTime = os.clock();
			this.running = true;
		}
	}

	stop(): void {
		if (this.running) {
			this.accumulated += os.clock() - this.startTime;
			this.running = false;
		}
	}

	reset(): void {
		this.accumulated = 0;
		this.running = false;
	}

	getElapsed(): number {
		if (this.running) {
			return this.accumulated + (os.clock() - this.startTime);
		}
		return this.accumulated;
	}

	getElapsedMinutes(): number {
		return this.getElapsed() / 60;
	}
}
