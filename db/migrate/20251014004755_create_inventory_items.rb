class CreateInventoryItems < ActiveRecord::Migration[8.0]
  def change
    create_table :inventory_items do |t|
      t.string :name, null: false
      t.string :category, null: false
      t.string :sku
      t.integer :on_hand, null: false, default: 0
      t.integer :reserved, null: false, default: 0
      t.text :notes
      t.boolean :active, null: false, default: true

      t.timestamps
    end

    add_index :inventory_items, %i[category name], unique: true
    add_index :inventory_items, :active
  end
end
