--!nocheck
-- One-off Studio scaffold. Paste into the Command Bar and press Enter.
--
-- Creates the instances the game code requires but Rojo does not manage:
--   ReplicatedStorage.Assets.{Enemies,Towers,Troops}
--   Workspace.Plots.Plot1.{Spawner,SpawnerLeft,SpawnerRight,PlacementArea,Core}
--
-- Placeholder parts only — swap in real art later by replacing each Model's
-- contents and re-setting its PrimaryPart. Safe to run repeatedly: anything
-- that already exists is left untouched.

local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Workspace = game:GetService("Workspace")

local created, skipped = 0, 0

local function folder(parent, name)
	local existing = parent:FindFirstChild(name)
	if existing then
		return existing
	end
	local f = Instance.new("Folder")
	f.Name = name
	f.Parent = parent
	created += 1
	return f
end

-- A Model whose PrimaryPart is set. ModelLoader.getPrimaryPart rejects models
-- without one, so this is the part that actually matters.
local function placeholderModel(parent, name, size, color)
	if parent:FindFirstChild(name) then
		skipped += 1
		return parent[name]
	end

	local model = Instance.new("Model")
	model.Name = name

	local part = Instance.new("Part")
	part.Name = "Root"
	part.Size = size
	part.Color = color
	part.Anchored = true
	part.CanCollide = false
	part.TopSurface = Enum.SurfaceType.Smooth
	part.BottomSurface = Enum.SurfaceType.Smooth
	part.Parent = model

	model.PrimaryPart = part
	model.Parent = parent
	created += 1
	return model
end

local function marker(parent, name, size, position, color, transparency)
	if parent:FindFirstChild(name) then
		skipped += 1
		return parent[name]
	end
	local p = Instance.new("Part")
	p.Name = name
	p.Size = size
	p.Position = position
	p.Color = color
	p.Transparency = transparency or 0
	p.Anchored = true
	p.CanCollide = false
	p.TopSurface = Enum.SurfaceType.Smooth
	p.BottomSurface = Enum.SurfaceType.Smooth
	p.Parent = parent
	created += 1
	return p
end

-- ─── Assets ──────────────────────────────────────────────────────────────────

local assets = folder(ReplicatedStorage, "Assets")
local enemies = folder(assets, "Enemies")
local towers = folder(assets, "Towers")
local troops = folder(assets, "Troops")

-- Sizes/colors mirror the scale and color fields in EnemyConfig.ts.
local ENEMIES = {
	{ "GoblinModel", 0.85, Color3.fromRGB(100, 200, 80) },
	{ "OrcModel", 1.3, Color3.fromRGB(80, 130, 60) },
	{ "SkeletonModel", 0.9, Color3.fromRGB(220, 220, 210) },
	{ "TrollModel", 1.8, Color3.fromRGB(60, 100, 60) },
	{ "LichModel", 2.5, Color3.fromRGB(140, 60, 200) },
	{ "DragonModel", 3.2, Color3.fromRGB(200, 50, 40) },
}

for _, e in ENEMIES do
	local name, scale, color = e[1], e[2], e[3]
	placeholderModel(enemies, name, Vector3.new(2 * scale, 3 * scale, 2 * scale), color)
end

local TOWERS = {
	{ "ArcherTower", Color3.fromRGB(80, 140, 255) },
	{ "FireTower", Color3.fromRGB(255, 100, 40) },
	{ "IceTower", Color3.fromRGB(120, 220, 255) },
	{ "PoisonTower", Color3.fromRGB(160, 255, 80) },
	{ "CannonTower", Color3.fromRGB(200, 200, 200) },
}

for _, t in TOWERS do
	placeholderModel(towers, t[1], Vector3.new(4, 8, 4), t[2])
end

-- Levels get progressively taller so upgrades are visually obvious.
local TROOPS = {
	{ "Swordsman", Color3.fromRGB(210, 180, 120) },
	{ "Archer", Color3.fromRGB(120, 200, 140) },
	{ "Mage", Color3.fromRGB(170, 120, 230) },
}

for _, t in TROOPS do
	for level = 1, 3 do
		placeholderModel(troops, `{t[1]}Lv{level}`, Vector3.new(2, 3 + level * 0.6, 2), t[2])
	end
end

-- ─── Plot ────────────────────────────────────────────────────────────────────
-- Ring spawns sit 70 studs out (GameConfig.SpawnRingRadius), so the pad is
-- sized generously enough to build inside that radius.

local plots = folder(Workspace, "Plots")

local plot1 = plots:FindFirstChild("Plot1")
if not plot1 then
	plot1 = Instance.new("Model")
	plot1.Name = "Plot1"
	plot1.Parent = plots
	created += 1
end

local pad = marker(plot1, "PlacementArea", Vector3.new(120, 1, 120), Vector3.new(0, 0, 0), Color3.fromRGB(70, 80, 70))
if pad then
	pad.CanCollide = true
end

marker(plot1, "Core", Vector3.new(10, 10, 10), Vector3.new(0, 5.5, 0), Color3.fromRGB(255, 210, 90))

-- PlotService.hideMarker makes these invisible at runtime; they are visible
-- here only so you can position them in Studio.
marker(plot1, "Spawner", Vector3.new(4, 4, 4), Vector3.new(0, 20, -70), Color3.fromRGB(255, 80, 80), 0.5)
marker(plot1, "SpawnerLeft", Vector3.new(4, 4, 4), Vector3.new(-70, 20, 0), Color3.fromRGB(255, 80, 80), 0.5)
marker(plot1, "SpawnerRight", Vector3.new(4, 4, 4), Vector3.new(70, 20, 0), Color3.fromRGB(255, 80, 80), 0.5)

print(`[Scaffold] Done — {created} instance(s) created, {skipped} already existed.`)
