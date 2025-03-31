class Beam < ApplicationRecord
  belongs_to :layout
  belongs_to :start_bracket, class_name: "Bracket", inverse_of: :started_beams
  belongs_to :end_bracket, class_name: "Bracket", optional: true, inverse_of: :ended_beams # optional: true allows this to be nil

  # Add validations, e.g.:
  validates :beam_type, presence: true, inclusion: { in: %w[upright crossbeam], message: "%{value} is not a valid beam type" }
  validates :length, presence: true, inclusion: { in: [8, 12], message: "%{value} is not a valid length (must be 8 or 12)" }
  validates :start_socket, presence: true # You might want more specific validation for socket names later
end
