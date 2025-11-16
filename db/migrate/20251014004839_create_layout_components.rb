class CreateLayoutComponents < ActiveRecord::Migration[8.0]
  def change
    create_table :layout_components do |t|
      t.references :layout, null: false, foreign_key: true
      t.string :component_type, null: false
      t.string :variant, null: false
      t.integer :quantity, null: false, default: 1
      t.jsonb :position_data, null: false, default: {}
      t.text :notes
      t.references :inventory_item, null: true, foreign_key: true

      t.timestamps
    end

    add_index :layout_components, %i[layout_id component_type]
  end
end
