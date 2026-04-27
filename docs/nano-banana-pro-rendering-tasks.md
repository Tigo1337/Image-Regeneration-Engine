# Nano Banana Pro Rendering Improvement Tasks

## Prompt-System Audit (Current State)

The rendering quality is currently driven by:

1. `constructRoomScenePrompt` in `shared/prompt-logic.ts`, which already includes strong constraint blocks for:
   - perspective lock,
   - preserved-object lock,
   - creativity-level transformation gates,
   - outpaint/upscale context instructions.
2. `generateRoomRedesign` in `server/gemini.ts`, which packages:
   - main image,
   - preservation reference images,
   - style inspiration images,
   - optional technical drawing,
   into one multimodal request to **gemini-3-pro-image-preview (Nano Banana Pro)**.
3. Route-level prompt augmentation in `server/routes/design.ts`, which conditionally injects:
   - smart-zoom constraints,
   - 3D forensic structure analysis,
   - additional hard constraints when references/drawings are present.

This architecture is strong, but several improvements can increase model adherence, realism, and consistency.

---

## Proposed Task Backlog

### Task 1 — Replace long monolithic prompts with section-tagged prompt contracts
**Goal:** Improve instruction following consistency by reducing ambiguity and instruction collisions.

**What to implement**
- Refactor prompt assembly into explicit tagged blocks like:
  - `[ROLE]`
  - `[SCENE_CONSTRAINTS]`
  - `[PRESERVE_OBJECT]`
  - `[STYLE_TARGET]`
  - `[LIGHTING]`
  - `[NEGATIVE_PROMPT]`
  - `[OUTPUT_SPEC]`
- Keep each block short and deterministic.
- Avoid repeating conflicting requirements (for example, repeated perspective lock lines).

**Why this helps Nano Banana Pro**
- The model responds better when constraints are grouped and non-redundant.
- Tagged contracts reduce instruction dilution in long, highly verbose prompts.

**Primary files**
- `shared/prompt-logic.ts`
- `server/routes/design.ts`

---

### Task 2 — Add a dynamic “conflict resolver” for creativity vs preservation
**Goal:** Prevent over-stylization when preservation is strict, and prevent under-transformation when creativity is high.

**What to implement**
- Add a policy layer before final prompt creation:
  - If `creativityLevel=1`, force a stricter preservation profile and disable any structural rewrite language.
  - If `creativityLevel>=3`, downgrade hard pixel-lock wording to geometry-and-placement lock only (except protected objects).
- Encode this as a single policy function to avoid route-specific drift.

**Why this helps Nano Banana Pro**
- Reduces contradictory directives currently present in some combinations.
- Encourages predictable behavior across creativity modes.

**Primary files**
- `shared/prompt-logic.ts`
- `server/routes/design.ts`
- `server/routes/modify.ts`

---

### Task 3 — Introduce model-facing negative prompt taxonomy
**Goal:** Reduce common rendering artifacts (warped hardware, floating objects, texture repetition, inconsistent shadows).

**What to implement**
- Add reusable negative prompt sets by scenario:
  - **Global photorealism negatives**
  - **Architecture/perspective negatives**
  - **Material consistency negatives**
  - **Object integrity negatives**
- Inject only relevant negatives based on user options and generation mode.

**Why this helps Nano Banana Pro**
- Helps suppress common failure modes without overconstraining the positive prompt.

**Primary files**
- `shared/prompt-logic.ts`
- `server/lib/prompt-utils.ts`

---

### Task 4 — Add two-pass generation for high-fidelity mode
**Goal:** Improve realism and object coherence for `High Fidelity (2K)` and `Ultra (4K)`.

**What to implement**
- Pass A: composition + geometry establishment at lower cost.
- Pass B: refinement pass with strict detail prompts and the output from Pass A as input.
- Gate this flow only for higher quality tiers.

**Why this helps Nano Banana Pro**
- Separating composition from detail refinement often improves final realism and reduces geometry drift.

**Primary files**
- `server/routes/design.ts`
- `server/gemini.ts`

---

### Task 5 — Build automatic prompt self-critique and repair loop
**Goal:** Catch poor prompts before calling generation.

**What to implement**
- Add a lightweight “prompt QA” function that checks for:
  - contradictory constraints,
  - duplicate critical lines,
  - missing preserved element description,
  - style descriptions that are too vague.
- Auto-rewrite only when confidence is high; otherwise fallback to original prompt.

**Why this helps Nano Banana Pro**
- Cleaner prompts improve adherence and reduce random degradation.

**Primary files**
- `server/lib/prompt-utils.ts`
- `shared/prompt-logic.ts`

---

### Task 6 — Add measurable rendering scorecards and telemetry
**Goal:** Move prompt tuning from subjective feedback to measurable outcomes.

**What to implement**
- Extend `prompt_logs.parameters` with metrics fields:
  - preservation pass/fail,
  - perspective alignment score,
  - material realism score,
  - user rating.
- Add offline evaluation scripts to compare prompt variants.

**Why this helps Nano Banana Pro**
- Enables data-driven prompt improvements instead of one-off manual tweaks.

**Primary files**
- `shared/schema.ts`
- `server/routes/design.ts`
- `server/storage.ts`

---

### Task 7 — Strengthen multi-image role assignment (reference vs inspiration vs blueprint)
**Goal:** Prevent style images from accidentally overriding geometry constraints.

**What to implement**
- Explicitly assign each input image a role token:
  - `ROLE=PRESERVE_GEOMETRY`
  - `ROLE=STYLE_ONLY`
  - `ROLE=GROUND_TRUTH_DIMENSIONS`
- Prepend compact role text immediately before each image part.
- Add hard precedence rules in prompt text and metadata.

**Why this helps Nano Banana Pro**
- Better multimodal disambiguation reduces geometry contamination from mood-board inputs.

**Primary files**
- `server/gemini.ts`
- `server/routes/design.ts`

---

### Task 8 — Add deterministic seed/variation strategy for batch generation
**Goal:** Get controllable variety without random quality collapse.

**What to implement**
- Add optional seed/variation controls in request schema.
- In batch mode, vary stylistic attributes systematically (lighting temperature, accent materials, decor density) while preserving geometry constraints.
- Persist seed metadata per result for reproducibility.

**Why this helps Nano Banana Pro**
- Produces more useful batch outputs and easier reruns of successful generations.

**Primary files**
- `shared/schema.ts`
- `server/routes/design.ts`

---

### Task 9 — Add post-generation validation and selective retry
**Goal:** Automatically reject outputs that violate critical constraints.

**What to implement**
- Add a vision-based validator pass for:
  - preserved object position drift,
  - gross perspective mismatch,
  - severe material artifacts.
- Retry with an adjusted repair prompt only when validation fails.

**Why this helps Nano Banana Pro**
- Raises floor quality without requiring manual reruns.

**Primary files**
- `server/gemini.ts`
- `server/routes/design.ts`
- `server/image-utils.ts`

---

### Task 10 — Introduce specialized prompt presets per job type
**Goal:** Stop using one generalized prompt style for all scenarios.

**What to implement**
- Add separate prompt presets for:
  - full room redesign,
  - strict element edit,
  - outpainting expansion,
  - style transfer only,
  - premium photorealistic marketing render.
- Keep each preset compact and purpose-built.

**Why this helps Nano Banana Pro**
- Scenario-specific prompts improve precision and reduce unintended side effects.

**Primary files**
- `shared/prompt-logic.ts`
- `server/routes/modify.ts`
- `server/routes/design.ts`

---

## Suggested Implementation Order (Highest ROI First)

1. Task 1 (section-tagged prompt contracts)
2. Task 2 (conflict resolver)
3. Task 7 (multi-image role assignment)
4. Task 3 (negative taxonomy)
5. Task 6 (telemetry + scorecards)
6. Task 9 (validation + retry)
7. Task 4 (two-pass high-fidelity)
8. Task 10 (preset families)
9. Task 8 (seed strategy)
10. Task 5 (self-critique loop)

---

## Acceptance Criteria Snapshot

For the first rollout (Tasks 1+2+7), consider it successful if:

- Preserved-object drift complaints decrease by at least 30%.
- “Wrong geometry copied from inspiration image” complaints decrease by at least 40%.
- First-attempt user satisfaction (no rerun needed) increases by at least 20%.
- Prompt token length drops without quality loss in A/B tests.
