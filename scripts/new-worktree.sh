#!/usr/bin/env bash
# Create a git worktree under .worktrees/<branch> branched from origin/main,
# then wire up the untracked files a fresh worktree never gets: .env
# (symlinked to the main tree's, so secrets stay in one place) and the
# generated Prisma client + node_modules.
#
# Usage: scripts/new-worktree.sh <branch-name>
set -euo pipefail

if [ $# -ne 1 ]; then
  echo "Usage: $0 <branch-name>" >&2
  exit 1
fi

BRANCH="$1"
REPO_ROOT="$(git rev-parse --show-toplevel)"
WORKTREE_DIR="$REPO_ROOT/.worktrees/$BRANCH"

git -C "$REPO_ROOT" fetch origin main
git -C "$REPO_ROOT" worktree add "$WORKTREE_DIR" -b "$BRANCH" origin/main

ln -s "$REPO_ROOT/.env" "$WORKTREE_DIR/.env"

cd "$WORKTREE_DIR"
pnpm install
pnpm exec prisma generate

echo "Worktree ready at $WORKTREE_DIR"
