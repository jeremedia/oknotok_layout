class Layout < ApplicationRecord
  belongs_to :owner, class_name: "Member"
  belongs_to :last_saved_by, class_name: "Member", optional: true

  has_many :brackets, dependent: :destroy
  has_many :beams, dependent: :destroy
  has_many :layout_components, dependent: :destroy

  enum :mode, { real_inventory: "real_inventory", unlimited: "unlimited" }, validate: true
  enum :status, { draft: "draft", live: "live", archived: "archived" }, validate: true

  validates :name, presence: true
  validates :owner, presence: true
  validates :status, presence: true
  validates :mode, presence: true
  validate :validate_real_inventory_capacity, if: :real_inventory?

  accepts_nested_attributes_for :layout_components, allow_destroy: true

  after_commit :sync_inventory_reservations, on: %i[create update]
  before_destroy :release_inventory_reservations

  def reserved_inventory_snapshot
    super.presence || {}
  end

  private

  def validate_real_inventory_capacity
    InventoryReservationService.new(self).shortages.each do |message|
      errors.add(:base, message)
    end
  end

  def sync_inventory_reservations
    result = InventoryReservationService.new(self).sync!
    return if result.success?

    result.errors.each { |error| errors.add(:base, error) }
    raise ActiveRecord::RecordInvalid.new(self)
  end

  def release_inventory_reservations
    result = InventoryReservationService.new(self).release!
    return if result.success?

    result.errors.each { |error| errors.add(:base, error) }
    throw(:abort)
  end
end
