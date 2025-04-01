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

ActiveRecord::Schema[8.0].define(version: 2025_04_01_000131) do
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

  create_table "layouts", force: :cascade do |t|
    t.string "name"
    t.text "description"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.integer "plot_width", default: 50, null: false
    t.integer "plot_depth", default: 50, null: false
  end

  add_foreign_key "beams", "brackets", column: "end_bracket_id"
  add_foreign_key "beams", "brackets", column: "start_bracket_id"
  add_foreign_key "beams", "layouts"
  add_foreign_key "brackets", "layouts"
end
