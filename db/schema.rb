# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.0].define(version: 2025_10_14_043456) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"

  create_table "beams", force: :cascade do |t|
    t.bigint "layout_id", null: false
    t.string "beam_type"
    t.integer "length"
    t.bigint "start_bracket_id", null: false
    t.bigint "end_bracket_id"
    t.string "start_socket", null: false
    t.string "end_socket"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.boolean "has_side_panel", default: false, null: false
    t.index ["end_bracket_id"], name: "index_beams_on_end_bracket_id"
    t.index ["layout_id"], name: "index_beams_on_layout_id"
    t.index ["start_bracket_id"], name: "index_beams_on_start_bracket_id"
  end

  create_table "brackets", force: :cascade do |t|
    t.bigint "layout_id", null: false
    t.float "x"
    t.float "y"
    t.float "z"
    t.string "type"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["layout_id"], name: "index_brackets_on_layout_id"
  end

  create_table "inventory_adjustments", force: :cascade do |t|
    t.bigint "inventory_item_id", null: false
    t.bigint "admin_id", null: false
    t.integer "change", null: false
    t.text "reason", null: false
    t.datetime "applied_at", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["admin_id"], name: "index_inventory_adjustments_on_admin_id"
    t.index ["inventory_item_id"], name: "index_inventory_adjustments_on_inventory_item_id"
  end

  create_table "inventory_items", force: :cascade do |t|
    t.string "name", null: false
    t.string "category", null: false
    t.string "sku"
    t.integer "on_hand", default: 0, null: false
    t.integer "reserved", default: 0, null: false
    t.text "notes"
    t.boolean "active", default: true, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["active"], name: "index_inventory_items_on_active"
    t.index ["category", "name"], name: "index_inventory_items_on_category_and_name", unique: true
  end

  create_table "layout_components", force: :cascade do |t|
    t.bigint "layout_id", null: false
    t.string "component_type", null: false
    t.string "variant", null: false
    t.integer "quantity", default: 1, null: false
    t.jsonb "position_data", default: {}, null: false
    t.text "notes"
    t.bigint "inventory_item_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["inventory_item_id"], name: "index_layout_components_on_inventory_item_id"
    t.index ["layout_id", "component_type"], name: "index_layout_components_on_layout_id_and_component_type"
    t.index ["layout_id"], name: "index_layout_components_on_layout_id"
  end

  create_table "layouts", force: :cascade do |t|
    t.string "name"
    t.text "description"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.integer "plot_width", default: 50, null: false
    t.integer "plot_depth", default: 50, null: false
    t.string "mode", default: "real_inventory", null: false
    t.string "status", default: "draft", null: false
    t.bigint "owner_id"
    t.bigint "last_saved_by_id"
    t.text "summary_note"
    t.jsonb "reserved_inventory_snapshot", default: {}, null: false
    t.jsonb "metadata", default: {}, null: false
    t.index ["last_saved_by_id"], name: "index_layouts_on_last_saved_by_id"
    t.index ["mode"], name: "index_layouts_on_mode"
    t.index ["owner_id"], name: "index_layouts_on_owner_id"
    t.index ["status"], name: "index_layouts_on_status"
  end

  create_table "members", force: :cascade do |t|
    t.string "name", null: false
    t.string "email", null: false
    t.string "role", default: "member", null: false
    t.string "status", default: "invited", null: false
    t.bigint "invited_by_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "encrypted_password", default: "", null: false
    t.string "reset_password_token"
    t.datetime "reset_password_sent_at"
    t.datetime "remember_created_at"
    t.index ["email"], name: "index_members_on_email", unique: true
    t.index ["invited_by_id"], name: "index_members_on_invited_by_id"
    t.index ["reset_password_token"], name: "index_members_on_reset_password_token", unique: true
    t.index ["role"], name: "index_members_on_role"
    t.index ["status"], name: "index_members_on_status"
  end

  add_foreign_key "beams", "brackets", column: "end_bracket_id"
  add_foreign_key "beams", "brackets", column: "start_bracket_id"
  add_foreign_key "beams", "layouts"
  add_foreign_key "brackets", "layouts"
  add_foreign_key "inventory_adjustments", "inventory_items"
  add_foreign_key "inventory_adjustments", "members", column: "admin_id"
  add_foreign_key "layout_components", "inventory_items"
  add_foreign_key "layout_components", "layouts"
  add_foreign_key "layouts", "members", column: "last_saved_by_id"
  add_foreign_key "layouts", "members", column: "owner_id"
  add_foreign_key "members", "members", column: "invited_by_id"
end
