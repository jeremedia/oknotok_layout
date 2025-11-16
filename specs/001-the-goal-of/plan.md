# Implementation Plan: OKNOTOK Layout Designer Core Experience

**Branch**: `001-the-goal-of` | **Date**: 2025-10-13 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/001-the-goal-of/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Enable OKNOTOK camp members to design, save, and iterate on camp layouts using real inventory reservations or unlimited concept mode, while admins manage membership and material counts. Research confirmed inventory reservation patterns, mode toggling expectations, and clarified that automated version rollback will wait until a Rails 8–compatible solution exists.

## Technical Context

**Language/Version**: Ruby 3.4.1 (Rails 8 defaults)  
**Primary Dependencies**: Hotwire (Turbo & Stimulus), TailwindCSS, ActiveRecord  
**Storage**: PostgreSQL managed via Rails migrations  
**Testing**: Minitest via `bin/rails test` (models, serializers, system)  
**Target Platform**: Web (Rails server + Turbo front end)  
**Project Type**: Rails monolith  
**Performance Goals**: Layout previews render <1s at P95 for typical camp footprints  
**Constraints**: Controllers stay thin, domain logic belongs in models/services, run `bin/dev` for asset builds, capture last editor metadata for accountability  
**Scale/Scope**: Designers manage shared inventory for a single camp season; expect dozens of layouts with frequent mode toggles

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Layout Parity & Traceability**: Expand fixtures in `test/fixtures/layouts.yml`, create parity-focused serializer tests, and capture Turbo preview screenshots (real vs. unlimited) stored under `specs/001-the-goal-of/previews/`.
- **Rails Boundaries & Focused Logic**: Keep inventory validation and reservation logic in models/services, use controllers for orchestration, serializers for layout contracts, and Stimulus controllers for mode toggles and preview messaging.
- **Test-First Reliability**: Author failing tests first: `test/models/layout_test.rb`, `test/models/inventory_item_test.rb`, `test/serializers/layout_serializer_test.rb`, and system tests for inventory/unlimited workflows before implementation; always run focused suites via `bin/rails test` plus targeted system tests.
- **Live Preview Discipline**: Develop with `bin/dev` to ensure Tailwind and esbuild outputs reflect mode indicators; document preview URLs and capture screenshots during QA reviews.
- **Versioned Change Control**: Introduce migrations for inventory tables, record change notes in release documentation, and document the manual workflow for capturing last-editor metadata until automated rollback becomes available.

**Post-Design Confirmation**: Research established reservation strategy, mode transitions, and clarified the deferral of automated version rollback; design artifacts include tests/fixtures guidance and preview capture plan, satisfying constitution gates with the noted deferral.

## Project Structure

### Documentation (this feature)

```
specs/001-the-goal-of/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```
app/
├── controllers/
├── models/
├── serializers/
├── javascript/controllers/
└── views/

app/assets/
├── stylesheets/
└── builds/

config/
├── routes.rb
├── application.rb
└── environments/

db/
├── migrate/
└── seeds.rb

test/
├── controllers/
├── models/
├── system/
└── fixtures/
```

**Structure Decision**: Work centers on `app/models/` (Layout, InventoryItem, InventoryAdjustment, Member), `app/controllers/` (layouts, admin inventory, memberships), `app/serializers/` for layout contracts, `app/javascript/controllers/` for mode toggles, corresponding Turbo views, and supporting tests/fixtures.

## Complexity Tracking

*Fill ONLY if Constitution Check has violations that must be justified*

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
|  |  |  |
