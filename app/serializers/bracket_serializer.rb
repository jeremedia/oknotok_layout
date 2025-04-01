class BracketSerializer < ActiveModel::Serializer
  attributes :id, :x, :y, :z, :layout_id # Include necessary attributes
  # No need to include beams again here unless specifically needed
end