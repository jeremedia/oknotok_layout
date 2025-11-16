# Quickstart: OKNOTOK Layout Designer Core Experience

## Prerequisites
- Ruby 3.4.1 with Bundler installed
- PostgreSQL service running locally
- Node/Yarn to support `bin/dev` asset pipeline

## Environment Setup
1. `bin/rails db:prepare` — ensures inventory/layout tables exist.
2. Seed baseline inventory and admin user via `bin/rails db:seed` (to be extended for this feature).
3. Start live preview tooling with `bin/dev` to run Rails server, esbuild, and Tailwind watchers.

## Running Tests
- Core regression: `bin/rails test test/models/layout_test.rb test/models/inventory_item_test.rb`
- Serializer parity: `bin/rails test test/serializers/layout_serializer_test.rb`
- System parity & screenshots: `bin/rails test test/system/layout_inventory_mode_test.rb test/system/layout_unlimited_mode_test.rb`
- Full sweep before PR: `bin/rails test`

## Common Workflows
### Design a Layout in Real Inventory Mode
1. Sign in as a member.
2. Create layout → choose “Real Inventory” mode.
3. Place components; watch remaining counts in sidebar.
4. Save layout; confirm reservations reflected in inventory list.

### Switch to Unlimited Mode for Concepting
1. Open existing layout.
2. Use “Switch to Unlimited” control.
3. Confirm badge indicates conceptual status and inventory reservations release.

### Admin Inventory Adjustment
1. Sign in as admin.
2. Navigate to Inventory dashboard.
3. Adjust counts or add new material type.
4. Provide reason note; verify log entry recorded.

## Screenshot & Evidence Capture
- During system tests, call `take_screenshot` to store previews under `specs/001-the-goal-of/previews/`.
- Attach evidence paths or thumbnails in PR descriptions.
