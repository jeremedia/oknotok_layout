class AddPerformanceIndexes < ActiveRecord::Migration[8.0]
  def change
    # Composite index for beams by layout and type (common query pattern)
    add_index :beams, [:layout_id, :beam_type], name: "index_beams_on_layout_and_type"

    # Composite index for brackets by layout and coordinates (spatial queries)
    add_index :brackets, [:layout_id, :x, :y, :z], name: "index_brackets_on_layout_and_position"

    # Index for beam socket queries (checking socket availability)
    add_index :beams, [:start_bracket_id, :start_socket], name: "index_beams_on_start_bracket_and_socket"
    add_index :beams, [:end_bracket_id, :end_socket], name: "index_beams_on_end_bracket_and_socket"

    # Index for finding beams by bracket (used in deletion cascades and validations)
    # Note: These may already be covered by foreign key indexes, but explicit is better
    unless index_exists?(:beams, :start_bracket_id)
      add_index :beams, :start_bracket_id
    end

    unless index_exists?(:beams, :end_bracket_id)
      add_index :beams, :end_bracket_id
    end

    # Index for layout name searches (if we add search functionality later)
    add_index :layouts, :name, name: "index_layouts_on_name"
  end
end
