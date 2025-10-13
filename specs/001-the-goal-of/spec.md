# Feature Specification: OKNOTOK Layout Designer Core Experience

**Feature Branch**: `[001-the-goal-of]`  
**Created**: 2025-10-13  
**Status**: Draft  
**Input**: User description: "The goal of the app is allowing myself and my OKNOTOK campmates to design camp layouts using our actual materials: custom steel brackets that accept 4x4 and 6x6 lumber, both with the actual inventory and "unlimited" inventory options. The layouts should be savable, browsable, versionable with accounts for members. Admins invite/manage users and manage inventory. Layouts can toggle between consuming real inventory and free design mode. Versioning is simple revision history with timestamps and authors."  
**Test Charter**: Each user story MUST document the tests that will fail first (models, serializers, system) and the preview evidence required for parity.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Plan a Layout Using Actual Inventory (Priority: P1)

Camp designer signs in, selects the real-inventory mode, and drafts a layout that uses only the steel brackets, beams, and lumber currently available.

**Why this priority**: Guarantees the crew can plan the physical camp build without overcommitting scarce materials.

**Independent Test**: Extend `test/models/layout_test.rb` and `test/serializers/layout_serializer_test.rb` to fail when inventory reservations exceed stock; add `test/system/layout_inventory_mode_test.rb` capturing screenshots of the real-inventory preview.

**Acceptance Scenarios**:

1. **Given** a signed-in camp member and current inventory counts, **When** they design a layout in real-inventory mode, **Then** the system reserves only available brackets and lumber and shows remaining counts.
2. **Given** inventory is insufficient for a component, **When** the member attempts to place it, **Then** the system blocks the placement and explains which material is short.

---

### User Story 2 - Experiment in Unlimited Design Mode (Priority: P2)

Camp designer duplicates or starts a layout in unlimited mode to explore concepts without changing inventory reservations.

**Why this priority**: Enables creative iteration while keeping the real build plan safe.

**Independent Test**: Add failing tests in `test/models/layout_mode_test.rb` so unlimited copies never decrement inventory; expand `test/system/layout_unlimited_mode_test.rb` with previews showing unlimited components flagged as conceptual.

**Acceptance Scenarios**:

1. **Given** a saved layout, **When** the member switches to unlimited mode, **Then** the system frees any reserved materials and clearly marks the layout as conceptual.
2. **Given** an unlimited layout, **When** the member duplicates it back to real-inventory mode, **Then** the system rechecks availability and highlights conflicts before saving.

---

### User Story 3 - Browse and Restore Layout Versions (Priority: P3)

Camp members need to review prior revisions of a layout, understand who changed what, and optionally roll back.

**Why this priority**: Maintains accountability and lets the team revert to proven configurations before a build.

**Independent Test**: Introduce failing tests in `test/models/layout_version_test.rb` to confirm version metadata (author, timestamp, notes) is stored; add `test/system/layout_version_history_test.rb` verifying the history view and restoration flow.

**Acceptance Scenarios**:

1. **Given** multiple saved revisions, **When** a member opens the version history, **Then** the system lists each version with timestamp, author, and summary note.
2. **Given** a prior revision, **When** the member restores it, **Then** the system creates a new revision capturing the rollback and preserves previous history.

---

### User Story 4 - Admin Manage Membership and Inventory (Priority: P3)

Admin invites new campmates, adjusts their access, and maintains the roster of brackets and lumber on hand.

**Why this priority**: Protects data integrity and ensures material counts reflect reality before designers plan builds.

**Independent Test**: Add failing controller tests in `test/controllers/admin/invitations_controller_test.rb` for invite flows and `test/controllers/admin/inventory_items_controller_test.rb` for inventory updates; include `test/system/admin_inventory_audit_test.rb` capturing before/after counts.

**Acceptance Scenarios**:

1. **Given** an admin, **When** they invite a new member, **Then** the system emails the invite and shows the pending user in the member list until acceptance.
2. **Given** inventory adjustments (e.g., new bracket delivery), **When** the admin updates counts, **Then** the system records who made the change and applies it immediately to real-inventory layouts.

---

### Edge Cases

- Real-inventory layout is opened by two members simultaneously; the system must reconcile reservations without double-counting.
- A member toggles from unlimited to real inventory when counts are now depleted; the system must block save and surface actionable guidance.
- Admin removes a material type currently used in saved layouts; the system must warn and prevent orphaned components while keeping previews functional.

## Layout Parity Evidence *(mandatory)*

- Fixtures or factories: Extend `test/fixtures/layouts.yml`, `test/fixtures/inventory_items.yml`, and add representative `test/fixtures/layout_versions.yml`.
- Preview capture plan: Record Turbo preview screenshots for real vs. unlimited modes and version history comparisons in `/specs/001-the-goal-of/previews/`.
- Validation command: `bin/rails test test/models/layout_test.rb test/serializers/layout_serializer_test.rb test/system/layout_inventory_mode_test.rb test/system/layout_version_history_test.rb`.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST let authenticated members create, edit, and save camp layouts composed of steel brackets and lumber elements.
- **FR-002**: Members MUST be able to toggle any layout between real-inventory mode and unlimited mode, with clear status indicators in the workspace and previews.
- **FR-003**: In real-inventory mode, the system MUST validate availability, reserve materials per layout, and expose remaining counts in real time.
- **FR-004**: Unlimited mode MUST ignore inventory reservations while preventing those layouts from affecting stock calculations.
- **FR-005**: Every saved change MUST record a revision with timestamp, author, summary note, and allow restoration of prior versions without data loss.
- **FR-006**: Browsing layouts MUST support filtering by member, mode (real vs. unlimited), and latest revision date.
- **FR-007**: Admin users MUST invite, activate, deactivate, and manage member roles while viewing an audit trail of membership changes.
- **FR-008**: Admin users MUST adjust inventory counts, add or retire material types, and review a change log tying adjustments to admins and timestamps.

### Key Entities *(include if feature involves data)*

- **Layout**: Represents a camp configuration with metadata (name, mode, owner, status), associated components (brackets, beams, lumber placements), and links to current reservations.
- **Inventory Item**: Tracks material type (steel bracket variant, 4x4 lumber, 6x6 lumber), quantity on hand, reserved counts, and audit history of adjustments.
- **Layout Version**: Snapshot of a layout at a point in time capturing author, timestamp, summary message, mode, and component composition for restoration.
- **Member**: Account with role (admin or member), invitation status, and activity history related to layouts and inventory changes.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 90% of real-inventory layout saves succeed on the first attempt because the system surfaces shortages before submission.
- **SC-002**: Designers can switch between real and unlimited modes in under 5 seconds, with clear status messaging observed in usability testing.
- **SC-003**: At least 80% of layout revisions in the first build cycle include an author and note, demonstrating consistent history tracking.
- **SC-004**: Admin audits show inventory discrepancies reduced by 50% compared with pre-app planning sessions, measured over the first event season.

## Assumptions

- PaperTrail (or equivalent audit tooling) remains available to power revision history logging without additional licensing.
- Email delivery infrastructure exists for member invitations and notifications.
- Inventory counts entered by admins are treated as the source of truth; the app does not integrate with external asset trackers in this release.
