class Layout < ApplicationRecord
  # Associations
  has_many :brackets, dependent: :destroy # If a layout is deleted, delete its brackets
  has_many :beams, dependent: :destroy    # If a layout is deleted, delete its beams

  # Validations
  validates :name, presence: true, length: { minimum: 1, maximum: 255 }
  validates :plot_width, presence: true,
                         numericality: { only_integer: true, greater_than_or_equal_to: 50 }
  validates :plot_depth, presence: true,
                         numericality: { only_integer: true, greater_than_or_equal_to: 50 }

  # Custom validations
  validate :plot_dimensions_are_multiples_of_50
  validate :plot_dimensions_within_reasonable_limits

  private

  # Ensures plot dimensions are in 50-foot increments for structural consistency
  def plot_dimensions_are_multiples_of_50
    if plot_width.present? && plot_width % 50 != 0
      errors.add(:plot_width, "must be a multiple of 50 feet")
    end

    if plot_depth.present? && plot_depth % 50 != 0
      errors.add(:plot_depth, "must be a multiple of 50 feet")
    end
  end

  # Prevents unreasonably large layouts that could cause performance issues
  def plot_dimensions_within_reasonable_limits
    max_dimension = 1000 # 1000 feet max per dimension

    if plot_width.present? && plot_width > max_dimension
      errors.add(:plot_width, "cannot exceed #{max_dimension} feet")
    end

    if plot_depth.present? && plot_depth > max_dimension
      errors.add(:plot_depth, "cannot exceed #{max_dimension} feet")
    end
  end
end
