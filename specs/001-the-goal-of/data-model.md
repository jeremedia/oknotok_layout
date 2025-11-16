# Data Model: OKNOTOK Layout Designer Core Experience

## Layout
- **Purpose**: Represents a camp layout configuration with structural components and inventory usage.
- **Key Fields**:
  - `id` (uuid)
  - `name` (string, required, unique per owner)
  - `mode` (enum: `real_inventory`, `unlimited`)
  - `status` (enum: `draft`, `live`, `archived`)
  - `summary_note` (text, optional, captured per revision)
  - `owner_id` (foreign key to Member)
  - `last_saved_by_id` (foreign key to Member)
  - `reserved_inventory_snapshot` (jsonb, stores counts when in real mode)
  - `metadata` (jsonb, optional tags/notes)
- **Relationships**:
  - `has_many :layout_components` (dependent destroy)
  - `belongs_to :owner`, class `Member`
- **Validations**:
  - Presence of `name`, `mode`, `owner_id`
  - Mode transitions enforce inventory availability when switching to `real_inventory`
  - Unique name scoped to owner for quick lookup
- **State Transitions**:
  - Mode transitions managed via service: `unlimited → real_inventory` requires reservation checks; `real_inventory → unlimited` releases reservations.
  - Status transitions: `draft → live → archived`; archived layouts become read-only.

## LayoutComponent
- **Purpose**: Individual bracket/beam/lumber placements that make up a layout.
- **Key Fields**:
  - `id` (uuid)
  - `layout_id`
  - `component_type` (enum: `steel_bracket`, `beam_4x4`, `beam_6x6`)
  - `variant` (string, matches inventory SKU or bracket type)
  - `quantity` (integer, ≥1)
  - `position_data` (jsonb, stores coordinates/orientation)
  - `notes` (text, optional)
- **Relationships**:
  - `belongs_to :layout`
  - `belongs_to :inventory_item`, optional when in unlimited mode
- **Validations**:
  - Presence of `component_type`, `quantity`, `position_data`
  - Quantity cannot exceed available inventory when layout mode is `real_inventory`
- **State Transitions**:
  - Adjusts reserved counts on create/update/destroy when parent layout is in real mode.

## InventoryItem
- **Purpose**: Tracks stock levels for materials available to the camp.
- **Key Fields**:
  - `id` (uuid)
  - `name` (string, e.g., “Steel Bracket A”)
  - `category` (enum: `bracket`, `lumber_4x4`, `lumber_6x6`)
  - `sku` (string, optional identifier)
  - `on_hand` (integer, ≥0)
  - `reserved` (integer, ≥0)
  - `notes` (text, optional)
  - `active` (boolean)
- **Relationships**:
  - `has_many :layout_components`
  - `has_many :inventory_adjustments`
- **Validations**:
  - `on_hand` ≥ `reserved`
  - `name` unique per category
- **State Transitions**:
  - Admin adjustments create `InventoryAdjustment` records and update `on_hand`.
  - Layout reservations adjust `reserved`.

## InventoryAdjustment
- **Purpose**: Audit log of changes admins make to inventory.
- **Key Fields**:
  - `id` (uuid)
  - `inventory_item_id`
  - `admin_id` (Member)
  - `change` (integer, positive or negative)
  - `reason` (text)
  - `applied_at` (datetime)
- **Relationships**:
  - `belongs_to :inventory_item`
  - `belongs_to :admin`, class `Member`
- **Validations**:
  - Presence of `change`, `reason`
  - Resulting `on_hand` cannot fall below zero

## Member
- **Purpose**: Authenticated user with role-based permissions.
- **Key Fields**:
  - `id` (uuid)
  - `name` (string)
  - `email` (string, unique)
  - `role` (enum: `admin`, `member`)
  - `status` (enum: `invited`, `active`, `inactive`)
  - `invited_by_id` (Member)
- **Relationships**:
  - `has_many :layouts`, foreign key `owner_id`
  - `has_many :inventory_adjustments`, foreign key `admin_id`
- **Validations**:
  - Presence of `email`, `name`, `role`
  - Invitation flow ensures invited users cannot access layout editing until activation.
- **State Transitions**:
  - Admins transition members through invitation lifecycle; inactive members lose edit permissions but keep ownership metadata.
