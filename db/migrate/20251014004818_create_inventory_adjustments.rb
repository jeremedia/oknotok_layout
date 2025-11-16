class CreateInventoryAdjustments < ActiveRecord::Migration[8.0]
  def change
    create_table :inventory_adjustments do |t|
      t.references :inventory_item, null: false, foreign_key: true
      t.bigint :admin_id, null: false
      t.integer :change, null: false
      t.text :reason, null: false
      t.datetime :applied_at, null: false

      t.timestamps
    end

    add_index :inventory_adjustments, :admin_id
    add_foreign_key :inventory_adjustments, :members, column: :admin_id
  end
end
