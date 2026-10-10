#!/usr/bin/env bash
# PreToolUse hook: the git stash is shared by every worktree, and other agents work in
# parallel worktrees, so stashing can hand one agent's changes to another.
command=$(jq -r '.tool_input.command // empty')
stash_calls=$(grep -oE '(^|[^[:alnum:]_-])git([[:space:]]+-C[[:space:]]+[^[:space:]]+)?[[:space:]]+stash([[:space:]]+[[:alnum:]-]+)?' <<<"$command")
if [[ -n "$stash_calls" ]] && grep -vEq 'stash[[:space:]]+(list|show)$' <<<"$stash_calls"; then
  echo 'git stash is shared by every worktree. Set work aside with a WIP commit instead.' >&2
  exit 2
fi
