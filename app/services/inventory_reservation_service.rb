class InventoryReservationService
  Result = Data.define(:success?, :errors)

  def initialize(layout)
    @layout = layout
    reset_component_cache
  end

  def shortages
    reset_component_cache
    return [] unless layout.real_inventory?

    missing_inventory_messages + overage_messages
  end

  def sync!
    layout.real_inventory? ? reserve! : release!
  end

  def reserve!
    reset_component_cache
    return failure(shortages) if shortages.any?

    ActiveRecord::Base.transaction do
      release_existing_reservations!
      apply_new_reservations!
      persist_snapshot!(snapshot_for(layout_components_by_item))
    end

    success
  rescue ActiveRecord::RecordInvalid => e
    failure([e.message])
  end

  def release!
    reset_component_cache
    ActiveRecord::Base.transaction do
      previous_reservations.each do |item_id, qty|
        next if qty.zero?

        inventory_item = InventoryItem.lock.find(item_id)
        inventory_item.update!(reserved: inventory_item.reserved - qty)
      end

      persist_snapshot!({})
    end

    success
  rescue ActiveRecord::RecordInvalid => e
    failure([e.message])
  end

  def recalculate!
    reserve!
  end

  def switch_mode!(target_mode)
    target = target_mode.to_s
    return success if target == layout.mode

    result = case target
             when "unlimited"
               switch_to_unlimited!
             when "real_inventory"
               switch_to_real_inventory!
             else
               failure(["Unsupported mode #{target}"])
             end

    layout.reload if result.success?
    result
  end

  def remaining_inventory_details
    return {} unless layout.real_inventory?

    layout_components_by_item.each_with_object({}) do |(item, required), memo|
      next unless item

      memo[item.id.to_s] = {
        "on_hand" => item.on_hand,
        "reserved" => item.reserved,
        "available" => item.on_hand - item.reserved,
        "required" => required
      }
    end
  end

  private

  attr_reader :layout

  def switch_to_unlimited!
    ActiveRecord::Base.transaction do
      layout.update!(mode: :unlimited)
      release_existing_reservations!
      layout.update!(reserved_inventory_snapshot: {})
    end

    success
  end

  def switch_to_real_inventory!
    previous_mode = layout.mode
    layout.mode = :real_inventory
    result = reserve!
    if result.success?
      layout.update_column(:mode, "real_inventory") if layout.persisted?
      success
    else
      layout.mode = previous_mode
      result
    end
  end

  def missing_inventory_messages
    layout.layout_components.select { |component| component.inventory_item.blank? }.map do |component|
      "component #{component.variant} requires an inventory item when layout is in real inventory mode"
    end
  end

  def overage_messages
    layout_components_by_item.each_with_object([]) do |(item, required), messages|
      available = available_quantity_for(item)
      next if required <= available

      messages << "not enough #{item.name} available (required #{required}, available #{available})"
    end
  end

  def layout_components_by_item
    @layout_components_by_item ||= layout.layout_components.each_with_object(Hash.new(0)) do |component, memo|
      next unless (item = component.inventory_item)

      memo[item] += component.quantity.to_i
    end
  end

  def available_quantity_for(item)
    item.on_hand - item.reserved + previous_reservations.fetch(item.id, 0)
  end

  def previous_reservations
    @previous_reservations ||= layout.reserved_inventory_snapshot.to_h.transform_keys(&:to_i)
  end

  def snapshot_for(map)
    map.each_with_object({}) do |(item, qty), snapshot|
      snapshot[item.id.to_s] = qty
    end
  end

  def release_existing_reservations!
    previous_reservations.each do |item_id, qty|
      next if qty.zero?

      inventory_item = InventoryItem.lock.find(item_id)
      inventory_item.update!(reserved: inventory_item.reserved - qty)
    end
  end

  def apply_new_reservations!
    layout_components_by_item.each do |item, qty|
      inventory_item = InventoryItem.lock.find(item.id)
      inventory_item.update!(reserved: inventory_item.reserved + qty)
    end
  end

  def persist_snapshot!(snapshot)
    return unless layout.persisted?

    layout.update_columns(reserved_inventory_snapshot: snapshot, updated_at: Time.current)
    layout.assign_attributes(reserved_inventory_snapshot: snapshot)
  end

  def success
    Result.new(success?: true, errors: [])
  end

  def failure(messages)
    Result.new(success?: false, errors: Array(messages))
  end

  def reset_component_cache
    layout.layout_components.includes(:inventory_item).load
    @layout_components_by_item = nil
  end
end
