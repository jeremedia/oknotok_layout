class Beam < ApplicationRecord
  # Constants
  VALID_BEAM_TYPES = %w[upright crossbeam].freeze
  VALID_LENGTHS = [8, 12].freeze
  VALID_SOCKET_NAMES = %w[+x -x +y -y +z -z].freeze

  # Associations
  belongs_to :layout
  belongs_to :start_bracket, class_name: "Bracket", inverse_of: :started_beams
  belongs_to :end_bracket, class_name: "Bracket", optional: true, inverse_of: :ended_beams # optional: true allows this to be nil

  # Basic validations
  validates :beam_type, presence: true,
                        inclusion: { in: VALID_BEAM_TYPES, message: "%{value} is not a valid beam type" }
  validates :length, presence: true,
                     inclusion: { in: VALID_LENGTHS, message: "%{value} is not a valid length (must be 8 or 12)" }
  validates :start_socket, presence: true,
                           inclusion: { in: VALID_SOCKET_NAMES, message: "%{value} is not a valid socket name" }
  validates :end_socket, inclusion: { in: VALID_SOCKET_NAMES, message: "%{value} is not a valid socket name", allow_nil: true }
  validates :layout, presence: true
  validates :start_bracket, presence: true

  # Custom validations
  validate :beam_type_matches_configuration
  validate :brackets_in_same_layout
  validate :sockets_are_available
  validate :upright_beam_consistency

  private

  # Ensures beam configuration matches its type (upright vs crossbeam)
  def beam_type_matches_configuration
    case beam_type
    when "upright"
      if end_bracket.present?
        errors.add(:end_bracket, "must be nil for upright beams")
      end
      if end_socket.present?
        errors.add(:end_socket, "must be nil for upright beams")
      end
      if length != 8
        errors.add(:length, "must be 8 feet for upright beams")
      end
      if start_socket != "-y"
        errors.add(:start_socket, "must be '-y' (bottom socket) for upright beams")
      end
    when "crossbeam"
      if end_bracket.blank?
        errors.add(:end_bracket, "must be present for crossbeam beams")
      end
      if end_socket.blank?
        errors.add(:end_socket, "must be present for crossbeam beams")
      end
      if length != 12
        errors.add(:length, "must be 12 feet for crossbeam beams")
      end
    end
  end

  # Ensures both brackets belong to the same layout
  def brackets_in_same_layout
    return unless start_bracket && end_bracket && layout

    if start_bracket.layout_id != layout.id
      errors.add(:start_bracket, "must belong to the same layout")
    end

    if end_bracket.layout_id != layout.id
      errors.add(:end_bracket, "must belong to the same layout")
    end
  end

  # Ensures the sockets being used are not already occupied by another beam
  def sockets_are_available
    return unless layout && start_bracket && start_socket

    # Check start socket availability
    conflicting_beam = layout.beams.where.not(id: id).find do |other_beam|
      (other_beam.start_bracket_id == start_bracket.id && other_beam.start_socket == start_socket) ||
      (other_beam.end_bracket_id == start_bracket.id && other_beam.end_socket == start_socket)
    end

    if conflicting_beam
      errors.add(:start_socket, "socket '#{start_socket}' on bracket #{start_bracket.id} is already occupied by beam #{conflicting_beam.id}")
    end

    # Check end socket availability (if applicable)
    if end_bracket && end_socket
      conflicting_beam = layout.beams.where.not(id: id).find do |other_beam|
        (other_beam.start_bracket_id == end_bracket.id && other_beam.start_socket == end_socket) ||
        (other_beam.end_bracket_id == end_bracket.id && other_beam.end_socket == end_socket)
      end

      if conflicting_beam
        errors.add(:end_socket, "socket '#{end_socket}' on bracket #{end_bracket.id} is already occupied by beam #{conflicting_beam.id}")
      end
    end
  end

  # Additional consistency checks for upright beams
  def upright_beam_consistency
    return unless beam_type == "upright" && start_bracket

    # Ensure upright's bracket Y position matches the beam length
    expected_y = length
    actual_y = start_bracket.y

    unless actual_y.between?(expected_y - 0.5, expected_y + 0.5)
      errors.add(:base, "Upright beam length (#{length}ft) should match bracket Y position (#{actual_y}ft)")
    end
  end
end
