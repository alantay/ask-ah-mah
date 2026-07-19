# Issue tracker: GitHub

Issues and PRDs for this repo live as GitHub issues. Use the `gh` CLI for all operations.

## Conventions

- **Create an issue**: `gh issue create --title "..." --body "..."`. Use a heredoc for multi-line bodies.
- **Read an issue**: `gh issue view <number> --comments`, filtering comments by `jq` and also fetching labels.
- **List issues**: `gh issue list --state open --json number,title,body,labels,comments --jq '[.[] | {number, title, body, labels: [.labels[].name], comments: [.comments[].body]}]'` with appropriate `--label` and `--state` filters.
- **Comment on an issue**: `gh issue comment <number> --body "..."`
- **Apply / remove labels**: `gh issue edit <number> --add-label "..."` / `--remove-label "..."`
- **Close**: `gh issue close <number> --comment "..."`

Infer the repo from `git remote -v` — `gh` does this automatically when run inside a clone.

## When a skill says "publish to the issue tracker"

Create a GitHub issue.

## When a skill says "fetch the relevant ticket"

Run `gh issue view <number> --comments`.

## Wayfinding operations

`gh` cannot reliably set GitHub's native issue-dependency edges, so a wayfinder map expresses its structure by **labels + body conventions**, and the frontier is a **query**, not a stored list.

- **Map** — an issue labelled `wayfinder:map`. Its body is the low-res index (Destination, Notes, Decisions so far, Not yet specified, Out of scope). It does **not** list open tickets.
- **Ticket** — a child issue labelled `wayfinder:ticket` plus one type label (`wayfinder:research` / `wayfinder:prototype` / `wayfinder:grilling` / `wayfinder:task`). Its body carries two lines: `Map: #<map>` and `Blocked by: #a, #b` (or `—` when unblocked).
- **Claim** — assign the ticket to yourself before working it. An open, unassigned ticket is unclaimed.
- **Frontier query** — the frontier is open `wayfinder:ticket` issues for a map that are **unassigned** and whose every `Blocked by:` issue is **closed**. The command below is only a **candidate query** — it lists the map's open tickets; you still have to apply the unassigned + closed-blockers filter yourself. Replace `<map>` with the numeric map ID (e.g. `445`):

  ```sh
  gh issue list --state open --label wayfinder:ticket \
    --json number,title,body,assignees \
    --jq '[.[] | select(.body | test("(^|\\n)Map: #<map>(\\r?\\n|$)"))]'
  ```

  The `test(...)` regex anchors the whole `Map:` line so `#12` doesn't match `#123`. From the candidates, drop any with a non-empty `assignees`, then drop any whose `Blocked by:` numbers aren't all closed (check each with `gh issue view <n> --json state`). What remains is the frontier.
- **Resolve** — post the answer as a comment, `gh issue close` the ticket, and append a one-line pointer to the map's *Decisions so far*.
