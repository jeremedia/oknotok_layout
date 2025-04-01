class AddPanelFlagToBeams < ActiveRecord::Migration[8.0]
  def change
    add_column :beams, :has_side_panel, :boolean, default: false, null: false
  end
end
