class BeamSerializer < ActiveModel::Serializer
  attributes :id, :beam_type, :length, :start_bracket_id, :end_bracket_id, :start_socket, :end_socket, :layout_id, :has_side_panel
  # You could optionally include belongs_to :start_bracket / :end_bracket if needed
end