class AddPlotSizeToLayouts < ActiveRecord::Migration[8.0]
  def change
    add_column :layouts, :plot_width, :integer, default: 50, null: false
    add_column :layouts, :plot_depth, :integer, default: 50, null: false
  end
end
