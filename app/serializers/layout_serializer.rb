class LayoutSerializer < ActiveModel::Serializer
  attributes :id,
             :name,
             :description,
             :mode,
             :status,
             :summary_note,
             :reserved_inventory_snapshot,
             :remaining_inventory,
             :conceptual,
             :plot_width,
             :plot_depth,
             :created_at,
             :updated_at

  has_many :brackets
  has_many :beams
  has_many :layout_components

  def reserved_inventory_snapshot
    object.reserved_inventory_snapshot.transform_keys(&:to_s)
  end

  def remaining_inventory
    InventoryReservationService.new(object).remaining_inventory_details
  end

  def conceptual
    object.unlimited?
  end
end
