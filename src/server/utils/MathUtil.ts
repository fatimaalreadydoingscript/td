export namespace MathUtil {
	export function clamp(value: number, min: number, max: number): number {
		if (value < min) return min;
		if (value > max) return max;
		return value;
	}

	export function lerp(a: number, b: number, t: number): number {
		return a + (b - a) * clamp(t, 0, 1);
	}

	export function randomFloat(min: number, max: number): number {
		return min + math.random() * (max - min);
	}

	export function randomInt(min: number, max: number): number {
		return math.random(min, max);
	}

	export function distanceSquared(a: Vector3, b: Vector3): number {
		const dx = a.X - b.X;
		const dy = a.Y - b.Y;
		const dz = a.Z - b.Z;
		return dx * dx + dy * dy + dz * dz;
	}

	export function distance(a: Vector3, b: Vector3): number {
		return math.sqrt(distanceSquared(a, b));
	}

	export function moveToward(current: Vector3, target: Vector3, speed: number, dt: number): Vector3 {
		const dir = target.sub(current);
		const dist = dir.Magnitude;
		if (dist <= 0.01) return target;
		const step = math.min(speed * dt, dist);
		return current.add(dir.Unit.mul(step));
	}

	export function randomOnCircle(radius: number): Vector3 {
		const angle = math.random() * math.pi * 2;
		return new Vector3(math.cos(angle) * radius, 0, math.sin(angle) * radius);
	}

	export function randomInCircle(radius: number): Vector3 {
		const r = math.sqrt(math.random()) * radius;
		const angle = math.random() * math.pi * 2;
		return new Vector3(math.cos(angle) * r, 0, math.sin(angle) * r);
	}
}
