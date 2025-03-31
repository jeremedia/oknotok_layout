class CreateBrackets < ActiveRecord::Migration[8.0]
  def change
    create_table :brackets do |t|
      t.references :layout, null: false, foreign_key: true
      t.float :x
      t.float :y
      t.float :z
      t.string :type

      t.timestamps
    end
  end
end
