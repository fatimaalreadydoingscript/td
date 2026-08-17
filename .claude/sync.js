#!/usr/bin/env node
/**
 * Two-device git sync for td.
 *
 * Driven by Claude Code hooks in .claude/settings.json:
 *   SessionStart -> `node .claude/sync.js pull`   (get the other device's work)
 *   Stop         -> `node .claude/sync.js push`   (publish this device's work)
 *
 * Written in Node rather than shell so it behaves identically on Windows,
 * macOS and Linux — hook commands run through whatever shell the OS provides,
 * and `&&` / `||` do not mean the same thing in PowerShell, cmd and sh.
 *
 * Safety rules this script follows:
 *   - never leaves the repo mid-rebase (aborts and reports instead)
 *   - never pushes when there is nothing to commit
 *   - never fails the session: problems are reported, not thrown
 */

const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const REPO = path.resolve(__dirname, "..");
const MODE = process.argv[2];

/** Run a git command. Returns { ok, out } and never throws. */
function git(...args) {
	const r = spawnSync("git", args, {
		cwd: REPO,
		encoding: "utf8",
		windowsHide: true,
	});
	return {
		ok: r.status === 0,
		out: `${r.stdout ?? ""}${r.stderr ?? ""}`.trim(),
	};
}

function say(msg) {
	process.stdout.write(`[sync] ${msg}\n`);
}

function warn(msg) {
	process.stderr.write(`[sync] ${msg}\n`);
}

/** Bail out quietly when this clone has no remote to sync against. */
function hasRemote() {
	return git("remote").out.length > 0;
}

/** A rebase left half-finished would break every later run — detect it. */
function rebaseInProgress() {
	const gitDir = git("rev-parse", "--git-dir");
	if (!gitDir.ok) return false;
	const dir = path.resolve(REPO, gitDir.out);
	return fs.existsSync(path.join(dir, "rebase-merge")) || fs.existsSync(path.join(dir, "rebase-apply"));
}

/** Commits on this branch that origin has not seen. 0 when there is no upstream. */
function unpushedCount() {
	const r = git("rev-list", "--count", "@{u}..HEAD");
	return r.ok ? Number(r.out) || 0 : 0;
}

function doPull() {
	if (!hasRemote()) return;

	const pulled = git("pull", "--rebase", "--autostash");
	if (pulled.ok) {
		if (pulled.out.includes("Already up to date")) {
			say("already up to date");
		} else {
			say("pulled the latest from origin");
			say("if dependencies changed, run: npm install");
		}
		return;
	}

	// Conflict or network failure. Restore a known-good state rather than
	// leaving the working tree mid-rebase.
	if (rebaseInProgress()) {
		git("rebase", "--abort");
		warn("PULL CONFLICT — the other device changed the same lines.");
		warn("Repo restored to its previous state. Resolve manually with:");
		warn("  git pull --rebase");
	} else {
		warn(`could not pull from origin: ${pulled.out.split("\n")[0]}`);
		warn("working offline is fine — your work still commits locally");
	}
}

function doPush() {
	if (!hasRemote()) return;

	git("add", "-A");

	// `diff --cached --quiet` exits 0 when nothing is staged.
	const nothingToCommit = git("diff", "--cached", "--quiet").ok;
	let summary;

	if (nothingToCommit) {
		// Still push if an earlier run committed but failed to publish —
		// otherwise unpushed work sits here invisibly until the next edit.
		if (unpushedCount() === 0) return; // genuinely in sync, stay silent
		summary = "earlier commit(s)";
	} else {
		const files = git("diff", "--cached", "--name-only").out.split("\n").filter(Boolean);
		summary =
			files.length === 1 ? files[0] : `${files.length} files (${path.basename(files[0])}, ...)`;

		const committed = git("commit", "-m", `auto-sync: ${summary}`);
		if (!committed.ok) {
			warn(`commit failed: ${committed.out.split("\n")[0]}`);
			return;
		}
	}

	// Integrate anything the other device pushed first, or the push is rejected.
	const rebased = git("pull", "--rebase", "--autostash");
	if (!rebased.ok) {
		if (rebaseInProgress()) git("rebase", "--abort");
		warn("committed locally, but could not merge origin's changes.");
		warn("Your work is safe in git. Resolve with: git pull --rebase");
		return;
	}

	const pushed = git("push");
	if (pushed.ok) {
		say(`pushed — ${summary}`);
	} else {
		warn(`committed locally, but push failed: ${pushed.out.split("\n")[0]}`);
		warn("your work is safe in git; it will push on the next run");
	}
}

if (MODE === "pull") doPull();
else if (MODE === "push") doPush();
else warn(`unknown mode "${MODE}" — expected "pull" or "push"`);
