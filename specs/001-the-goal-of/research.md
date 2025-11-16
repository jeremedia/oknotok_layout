# Research Findings: OKNOTOK Layout Designer Core Experience

## Inventory Reservation Strategy
- **Decision**: Use optimistic reservation on layout save with transactional checks that decrement available quantities per component only in real-inventory mode.
- **Rationale**: Matches Rails best practices (ActiveRecord transactions) and keeps reads fast; conflicts surface with clear validation errors before commit.
- **Alternatives considered**: 
  - *Pessimistic locking*: Prevents conflicts but harms collaboration and requires long-running locks.
  - *Background reservation queue*: Adds complexity and latency not needed for small team usage.

## Mode Toggling Between Real and Unlimited
- **Decision**: Persist a `mode` attribute on layouts with transition service that releases or reapplies reservations and surfaces conflicts during toggles.
- **Rationale**: Centralizes mode logic, ensures consistent behavior through models/serializers, and simplifies preview messaging.
- **Alternatives considered**:
  - *Separate models per mode*: Duplicates logic and complicates version history.
  - *Session-only toggles*: Loses intent when sharing layouts and breaks parity requirements.

## Revision Accountability (Interim Approach)
- **Decision**: Track last editing member and summary notes directly on `layouts` while deferring automated rollback until a Rails 8–compatible versioning library is available.
- **Rationale**: Provides accountability signals immediately and avoids depending on unsupported PaperTrail releases.
- **Alternatives considered**:
  - *Custom revision tables today*: Adds maintenance overhead without clear rollback tooling.
  - *Waiting to ship layout planning*: Blocks critical workflows on an external dependency.

## Admin Inventory Management
- **Decision**: Provide admin-only interface with change logs capturing before/after counts and notes, backed by dedicated `InventoryAdjustment` records.
- **Rationale**: Aligns with constitution's traceability principle and keeps dependencies limited to first-party models.
- **Alternatives considered**:
  - *Untracked spreadsheet exports*: Breaks audit trail, conflicts with governance.
  - *Email-based approvals*: Slower workflow and harder to integrate with layout updates.

## Preview Evidence Capture
- **Decision**: Use system tests with `take_screenshot` to save preview artifacts for both modes, stored under `specs/001-the-goal-of/previews/`.
- **Rationale**: Automates parity evidence, integrates with existing Rails system test helpers, and meets constitution guardrails.
- **Alternatives considered**:
  - *Manual screenshots*: Risk of drift and missing documentation.
  - *Third-party visual testing services*: Overkill for current scope and introduces external cost.
