class Bracket < ApplicationRecord
  # Associations
  belongs_to :layout

  # A bracket can be the start point for many beams
  has_many :started_beams, class_name: "Beam", foreign_key: "start_bracket_id", dependent: :destroy, inverse_of: :start_bracket

  # A bracket can be the end point for many beams
  has_many :ended_beams, class_name: "Beam", foreign_key: "end_bracket_id", dependent: :destroy, inverse_of: :end_bracket

  # Validations
  validates :x, presence: true, numericality: true
  validates :y, presence: true, numericality: { greater_than_or_equal_to: 0 }
  validates :z, presence: true, numericality: true
  validates :layout, presence: true

  # Custom validations
  validate :within_layout_bounds
  validate :not_overlapping_with_existing_bracket

  private

  # Ensures bracket is positioned within the layout's plot boundaries
  def within_layout_bounds
    return unless layout && x.present? && z.present?

    half_width = layout.plot_width / 2.0
    half_depth = layout.plot_depth / 2.0

    if x.abs > half_width
      errors.add(:x, "must be within layout bounds (#{-half_width} to #{half_width} feet)")
    end

    if z.abs > half_depth
      errors.add(:z, "must be within layout bounds (#{-half_depth} to #{half_depth} feet)")
    end
  end

  # Prevents creating brackets too close to existing ones (within 1 foot tolerance)
  # This helps avoid accidental duplicate placements
  def not_overlapping_with_existing_bracket
    return unless layout && x.present? && y.present? && z.present?

    tolerance = 1.0 # 1 foot tolerance

    overlapping = layout.brackets.where.not(id: id).find do |other_bracket|
      distance = Math.sqrt(
        (x - other_bracket.x)**2 +
        (y - other_bracket.y)**2 +
        (z - other_bracket.z)**2
      )
      distance < tolerance
    end

    if overlapping
      errors.add(:base, "A bracket already exists at this position (within #{tolerance} foot)")
    end
  end
end
