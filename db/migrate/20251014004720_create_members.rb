class CreateMembers < ActiveRecord::Migration[8.0]
  def change
    create_table :members do |t|
      t.string :name, null: false
      t.string :email, null: false
      t.string :role, null: false, default: "member"
      t.string :status, null: false, default: "invited"
      t.bigint :invited_by_id

      t.timestamps
    end

    add_index :members, :email, unique: true
    add_index :members, :role
    add_index :members, :status
    add_index :members, :invited_by_id
    add_foreign_key :members, :members, column: :invited_by_id
  end
end
