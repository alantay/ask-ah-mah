# Recipe quality benchmark

This benchmark compares the production recipe path across supported GPT-5.6 models and reasoning efforts. It uses the real chat system prompt, a canned pantry per fixture, and the same tool loop as `/api/chat`. The default remains the production `gpt-5.6-luna` model.

When multiple models are selected, their execution order alternates across cases and repetitions so one model is not always measured first.

It is deliberately opt-in because every sample makes a paid OpenAI API call. Running the command without `--run` only prints the matrix.

```bash
# Inspect the default 108-call matrix without calling the API
pnpm benchmark:recipes

# Useful first run: 2 fixtures × low/medium × 1 repetition = 4 calls
pnpm benchmark:recipes -- --smoke --run

# Full run: 12 fixtures × low/medium/high × 3 repetitions = 108 calls
pnpm benchmark:recipes -- --run

# Fair model comparison: same effort and fixtures, 12 calls per model
pnpm benchmark:recipes -- --models gpt-5.6-luna,gpt-5.6-terra \
  --efforts low --reps 1 --run

# Target a measured disagreement before increasing repetitions
pnpm benchmark:recipes -- --cases classic-carbonara,mayonnaise-emulsion \
  --efforts low,medium,high --reps 5 --run
```

Generated artifacts are written to `.scratch/recipe-benchmarks/<timestamp>/`:

- `results.json` contains every raw output, configuration, token count, tool call, and deterministic check.
- `report.md` compares valid recipe rate, deterministic checks, latency, and tokens by model and effort.
- `blind-review.md` hides model configuration and provides a 1–5 human scoring rubric for culinary judgment.

## What the checks mean

The automated checks cover schema validity, exact recipe-block count, fixture constraints, tag validity, ingredient uniqueness, step-use references, scalable quantities, and likely unused ingredients. Some are warnings because natural references such as “the sauce” cannot be resolved reliably without another model.

They cannot establish whether a recipe tastes good. Review `blind-review.md` before opening the analytical report, and score safety, technique, likely flavour, clarity, constraint fit, and overall preference. Prefer the lowest effort that is practically tied on both blind review and deterministic checks.
