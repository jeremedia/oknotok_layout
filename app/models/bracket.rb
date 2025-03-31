class Bracket < ApplicationRecord
  belongs_to :layout

  # A bracket can be the start point for many beams
  has_many :started_beams, class_name: "Beam", foreign_key: "start_bracket_id", dependent: :destroy, inverse_of: :start_bracket

  # A bracket can be the end point for many beams
  has_many :ended_beams, class_name: "Beam", foreign_key: "end_bracket_id", dependent: :destroy, inverse_of: :end_bracket

end
