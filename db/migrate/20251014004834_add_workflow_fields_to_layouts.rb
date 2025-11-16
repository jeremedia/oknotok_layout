class AddWorkflowFieldsToLayouts < ActiveRecord::Migration[8.0]
  def change
    add_column :layouts, :mode, :string, null: false, default: "real_inventory"
    add_column :layouts, :status, :string, null: false, default: "draft"
    add_reference :layouts, :owner, null: true, foreign_key: { to_table: :members }
    add_column :layouts, :last_saved_by_id, :bigint
    add_column :layouts, :summary_note, :text
    add_column :layouts, :reserved_inventory_snapshot, :jsonb, null: false, default: {}
    add_column :layouts, :metadata, :jsonb, null: false, default: {}

    add_index :layouts, :mode
    add_index :layouts, :status
    add_index :layouts, :last_saved_by_id
    add_foreign_key :layouts, :members, column: :last_saved_by_id
  end
end
