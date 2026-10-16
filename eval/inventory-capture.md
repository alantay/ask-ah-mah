# Pantry capture naming eval

Run `pnpm eval:inventory` to list the cases without making model calls.
Run `pnpm eval:inventory --run` to execute the opt-in live eval. It uses the
configured `MODEL` and production effort settings, costs API usage, and stays
outside Jest/CI. Each tool turn can make multiple model calls.

Eight inputs exercise three paths: freeform pantry parsing, pre-chat capture,
and the chat agent's add-inventory tool. The extractors use the production
prompt builders and input schema; the tool path uses the real chat system
prompt, add-tool description and schema with in-memory tool executors. There
are no database imports or writes. This checks the model's extraction behavior,
not the HTTP/auth layer or the pre-chat possession/checklist gates; the existing
unit tests cover those gates.

Checks compare complete singular names (ignoring case/order), reject invented
stock, preserve species/meat/form distinctions, and verify explicit quantities
and ingredient/kitchenware classification. All returned items and failures,
input cases, model/effort settings and prompt text are saved in ignored
`.scratch/inventory-capture/` JSON files. Failures or provider errors give a
nonzero exit status.

Re-score a saved run against the current checks without model calls:
`pnpm eval:inventory --rescore .scratch/inventory-capture/<run>.json`.
Count units `piece` and `pieces` are both accepted. Re-scoring leaves the
original artifact intact, so its original failure report is preserved.

The fixtures cover the reported fish example, an explicitly owned species,
minced beef/pork, dried/fresh chilli, unowned alternatives, negated/wished-for
items, preparation instructions and a quantity plus kitchenware entry. A pass
is evidence for these cases, not a guarantee for every phrasing.
