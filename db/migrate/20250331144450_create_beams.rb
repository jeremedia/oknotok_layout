class CreateBeams < ActiveRecord::Migration[8.0]
  def change
    create_table :beams do |t|
      t.references :layout, null: false, foreign_key: true
      t.string :beam_type
      t.integer :length
      t.references :start_bracket, null: false, foreign_key: { to_table: :brackets }
      t.references :end_bracket, null: true, foreign_key: { to_table: :brackets }
      t.string :start_socket, null: false
      t.string :end_socket, null: true

      t.timestamps
    end
  end
end
