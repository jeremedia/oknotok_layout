---
description: "Task list for OKNOTOK Layout Designer Core Experience implementation"
---

# Tasks: OKNOTOK Layout Designer Core Experience

**Input**: Design documents from `/specs/001-the-goal-of/`  
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Every user story MUST start with failing tests committed first (`bin/rails test`), including fixture/serializer coverage for parity and system tests when UI changes apply.

**Organization**: Tasks are grouped by user story so each slice can ship independently with verified parity evidence.

## Format: `[ID] [P?] [Story] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Always list parity-verification tasks (tests, fixtures, previews) before implementation work
- Include exact Rails paths (`app/models`, `app/controllers`, `app/javascript/controllers`, `test/...`) in descriptions
- Reference required commands explicitly (`bin/dev`, `bin/rails db:prepare`, `bin/rails test`)

## Phase 1: Environment & Parity Setup (Shared Infrastructure)

- [x] T001 Run `bin/rails db:prepare` to ensure the database is aligned with current schema before adding new migrations.
- [x] T002 Create `specs/001-the-goal-of/previews/.keep` so automated screenshots from system tests have a committed destination.

---

## Phase 2: Foundational Domain Work (Blocks All Stories)

- [x] T003 Generate and implement `db/migrate/*_create_members.rb` establishing roles, statuses, and invitation tracking per `data-model.md`.
- [x] T004 Generate and implement `db/migrate/*_create_inventory_items.rb` and `db/migrate/*_create_inventory_adjustments.rb` defining columns from `data-model.md` (on_hand, reserved, change audit).
- [x] T005 Generate and implement `db/migrate/*_create_layouts.rb` and `db/migrate/*_create_layout_components.rb` with enums, references, and JSON payloads described in `data-model.md`.
- [x] T006 Run `bin/rails db:migrate` and verify schema additions in `db/schema.rb`.
- [x] T007 Define `app/models/inventory_item.rb` and `app/models/inventory_adjustment.rb` with associations, validations, and audit hooks.
- [x] T008 Define `app/models/layout.rb` and `app/models/layout_component.rb` with enums, associations, and placeholders for reservation integration.
- [x] T009 Create `app/models/member.rb` with role/status enums plus relationships the stories rely on.
- [x] T010 Create `app/services/inventory_reservation_service.rb` with public methods for reserving, releasing, and recalculating counts (no-op implementations returning TODOs for now).
- [x] T011 Seed baseline admin and inventory records in `db/seeds.rb` to support manual QA and future automated tests.

---

## Phase 3: User Story 1 - Plan a Layout Using Actual Inventory (Priority: P1) 🎯 MVP

**Goal**: Deliver real-inventory layouts that reserve materials and expose remaining counts.

**Independent Test**: `bin/rails test test/models/layout_test.rb test/serializers/layout_serializer_test.rb test/system/layout_inventory_mode_test.rb`

### Tests for User Story 1 (MANDATORY, fail first)

- [x] T012 [US1] Extend `test/fixtures/inventory_items.yml` and `test/fixtures/layouts.yml` with real-inventory scenarios covering shortages and success cases.
- [x] T013 [P] [US1] Add failing reservation validations to `test/models/layout_test.rb` asserting counts cannot exceed inventory.
- [x] T014 [P] [US1] Add failing parity assertions to `test/serializers/layout_serializer_test.rb` for remaining inventory fields.
- [x] T015 [P] [US1] Create `test/system/layout_inventory_mode_test.rb` that drives the Turbo UI and captures screenshots into `specs/001-the-goal-of/previews/real-inventory.png`.

### Implementation for User Story 1

- [x] T016 [US1] Flesh out `app/services/inventory_reservation_service.rb` to reserve/release counts within database transactions.
- [x] T017 [US1] Update `app/models/layout.rb` and `app/models/layout_component.rb` to call the reservation service on create/update/destroy and expose remaining counts.
- [x] T018 [US1] Register `resources :layouts, only: [:index, :show, :create, :update]` in `config/routes.rb`.
- [x] T019 [US1] Implement real-inventory flows in `app/controllers/layouts_controller.rb` (index filters, create/update with reservation error handling).
- [x] T020 [US1] Build `app/serializers/layout_serializer.rb` to serialize components plus `reserved_inventory_snapshot`.
- [x] T021 [US1] Update Turbo templates under `app/views/layouts/` to display remaining counts and reservation errors.
- [x] T022 [US1] Add `app/javascript/controllers/layout_mode_controller.js` to surface real-time inventory indicators in the preview.
- [x] T023 [US1] Run `bin/rails test test/models/layout_test.rb test/serializers/layout_serializer_test.rb test/system/layout_inventory_mode_test.rb` and attach the screenshot reference to spec notes.

**Checkpoint**: Real-inventory planning ready with deterministic tests and preview evidence.

---

## Phase 4: User Story 2 - Experiment in Unlimited Design Mode (Priority: P2)

**Goal**: Allow designers to explore layouts without affecting inventory while keeping conceptual status visible.

**Independent Test**: `bin/rails test test/models/layout_mode_test.rb test/system/layout_unlimited_mode_test.rb`

### Tests for User Story 2 (MANDATORY)

- [x] T024 [US2] Extend `test/fixtures/layouts.yml` with unlimited-mode fixtures and conceptual badges.
- [x] T025 [P] [US2] Add `test/models/layout_mode_test.rb` verifying unlimited mode never touches inventory counts.
- [x] T026 [P] [US2] Add `test/system/layout_unlimited_mode_test.rb` ensuring badges appear and reserves release screenshot saved to `specs/001-the-goal-of/previews/unlimited-mode.png`.

### Implementation for User Story 2

- [x] T027 [US2] Extend `app/services/inventory_reservation_service.rb` with a mode toggle API releasing reservations and recalculating conflicts.
- [x] T028 [US2] Add `post :toggle_mode` and `post :duplicate` member routes for layouts in `config/routes.rb`.
- [x] T029 [US2] Implement toggle and duplicate actions in the layouts controller per `contracts/layouts.openapi.yml`.
- [x] T030 [US2] Update `app/serializers/layout_serializer.rb` with conceptual status flags for unlimited mode.
- [x] T031 [US2] Update `app/views/layouts/` templates and `app/javascript/controllers/layout_mode_controller.js` to show conceptual badges and warnings when switching back to real inventory.
- [x] T032 [US2] Run `bin/rails test test/models/layout_mode_test.rb test/system/layout_unlimited_mode_test.rb` and store preview evidence link.

**Checkpoint**: Unlimited mode operational with clear user messaging and inventory untouched.

---

## Phase 5: User Story 3 - Admin Manage Membership and Inventory (Priority: P3)

**Goal**: Empower admins to invite members and audit/update inventory with change logs.

**Independent Test**: `bin/rails test test/controllers/admin/invitations_controller_test.rb test/controllers/admin/inventory_items_controller_test.rb test/system/admin_inventory_audit_test.rb`

### Tests for User Story 3 (MANDATORY)

- [x] T033 [US3] Add fixtures for admin/member users and inventory adjustments in `test/fixtures/members.yml` and `test/fixtures/inventory_adjustments.yml`.
- [x] T034 [P] [US3] Implement `test/controllers/admin/invitations_controller_test.rb` covering invite, accept, and deactivate flows.
- [x] T035 [P] [US3] Implement `test/controllers/admin/inventory_items_controller_test.rb` ensuring adjustments persist and audit entries recorded.
- [x] T036 [P] [US3] Create `test/system/admin_inventory_audit_test.rb` walking through invite + inventory update UI with screenshot saved to `specs/001-the-goal-of/previews/admin-inventory.png`.

### Implementation for User Story 3

- [x] T037 [US3] Add admin namespace routes in `config/routes.rb` for memberships and inventory dashboards.
- [x] T038 [US3] Implement `app/controllers/admin/invitations_controller.rb` and mailer views (`app/views/admin/invitations_mailer/`) to manage invites.
- [x] T039 [US3] Implement `app/controllers/admin/inventory_items_controller.rb` plus supporting views (`app/views/admin/inventory_items/`) and change log display.
- [x] T040 [US3] Update `app/models/member.rb` with role/status scopes and invitation lifecycle helpers.
- [x] T041 [US3] Run `bin/rails test test/controllers/admin/invitations_controller_test.rb test/controllers/admin/inventory_items_controller_test.rb test/system/admin_inventory_audit_test.rb` capturing evidence of audit logs.

**Checkpoint**: Admin workflows operational with invite + inventory governance.

---

## Phase N: Polish & Cross-Cutting Concerns

- [ ] T042 Update `specs/001-the-goal-of/quickstart.md` and project README with new workflows, commands, and preview evidence locations.
- [ ] T043 [P] Run `bundle exec rubocop` and address any style violations introduced.
- [ ] T044 Run full regression `bin/rails test` and archive final preview screenshots in `specs/001-the-goal-of/previews/`.

---

## Dependencies & Execution Order

- **Setup (Phase 1)** → **Foundational (Phase 2)** → unlocks User Stories.
- **US1 (Real Inventory)** must complete before US2 (mode toggles) and US3 (admin governance) to ensure core layout model solid.
- **US2** depends on reservation logic from US1 but does not block US3 once toggles exist.
- **US3** relies on inventory entities and member roles delivered in earlier phases.
- Polish executes after targeted user stories reach checkpoints.

## Parallel Execution Examples

- **US1**: After fixtures (T012) land, tests T013–T015 can run in parallel; implementation tasks touching separate layers (`app/services`, `app/controllers`, `app/views`) can split once service contract (T016) exists.
- **US2**: While T027 updates the service, UI updates (T031) can proceed in parallel with serializer changes (T030) after toggle route (T028) is defined.
- **US3**: Admin invite work (T038) and inventory controller work (T039) can progress in parallel once routes (T037) are staged.

## Implementation Strategy

### MVP First (User Story 1 Only)
1. Complete Phase 1–2 to establish infrastructure (T001–T011).
2. Land US1 tests (T012–T015) and implementations (T016–T023).
3. Validate with targeted test run and preview evidence for real inventory.

### Incremental Delivery
1. Ship US1 as MVP.
2. Add US2 for unlimited experimentation once inventory reservations are proven.
3. Deliver US3 admin governance to close the loop on membership and inventory audits.

### Parallel Team Strategy
1. One developer owns reservation service + models while another handles controller/view work within US1 after tests fail.
2. Post-US1, parallelize US2 (mode toggles) and US3 (admin governance) as they modify separate surfaces.
3. Assign dedicated owner to polish tasks while others wrap story-specific work.
