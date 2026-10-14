# Configuration and Project Documentation

This reference supports the configuration contract. Create a root `frontend-architecture.config.json` by adapting `assets/frontend-architecture.config.json` when bootstrapping or when the project owner asks for configuration. Do not replace an existing user-authored configuration without preserving its values.

## Configuration rules

- `auto` means detect/infer from repository and task context, not randomly choose.
- Explicit values win over inferred defaults, unless incompatible with the selected framework; explain compatibility conflicts.
- Configuration should be a small preference/decision record, not a duplicate of every package setting.
- If a key is unknown, do not silently assume it has effect. Preserve it only if the user's config parser supports extension fields and document the behavior.

## ARCHITECTURE.md contents

Write only decisions that match the actual implementation:

1. Framework, project profile, runtime/rendering approach.
2. Key directory responsibilities and ownership boundaries.
3. Styling strategy, token layers, responsive typography, font loading, and theme choice (including if themes are intentionally absent).
4. Motion engine and whether initialization is centralized, component-owned, or hybrid; document how dynamic content is handled.
5. State-management and API patterns, with conditions for adding more infrastructure.
6. Relevant scripts and commands.
7. Configurable overrides and material deviations from defaults.
8. Checks performed and any known constraints, if useful.

Never say a test passed unless it was run and passed. Keep `README.md` focused on project purpose, install/start commands, and day-to-day usage.
