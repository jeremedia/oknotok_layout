require "ostruct"

class LayoutsController < ApplicationController
  before_action :set_layout, only: %i[show update toggle_mode duplicate]

  def index
    load_dashboard_lists

    respond_to do |format|
      format.html
      format.json { render json: @layouts, each_serializer: LayoutSerializer }
    end
  end

  def show
    respond_to do |format|
      format.html
      format.json { render json: @layout, serializer: LayoutSerializer }
    end
  end

  def create
    @layout = Layout.new(layout_params)
    assign_member_context(@layout)

    if @layout.save
      respond_to do |format|
        format.html { redirect_to layout_path(@layout), notice: "Layout created" }
        format.json { render json: @layout, serializer: LayoutSerializer, status: :created }
      end
    else
      load_dashboard_lists
      respond_with_errors(:index)
    end
  end

  def update
    @layout.assign_attributes(layout_params)
    assign_member_context(@layout)

    if @layout.save
      respond_to do |format|
        format.html { redirect_to layout_path(@layout), notice: "Layout updated" }
        format.json { render json: @layout, serializer: LayoutSerializer }
      end
    else
      load_dashboard_lists
      respond_with_errors(:show)
    end
  end

  def toggle_mode
    target_mode = params.require(:mode)
    result = InventoryReservationService.new(@layout).switch_mode!(target_mode)

    if result.success?
      respond_to do |format|
        format.html { redirect_to layouts_path, notice: "Layout mode updated to #{target_mode.humanize}" }
        format.json { render json: @layout.reload, serializer: LayoutSerializer }
      end
    else
      flash[:alert] = result.errors.to_sentence
      respond_to do |format|
        format.html { redirect_to layouts_path, status: :unprocessable_entity }
        format.json { render json: { errors: result.errors }, status: :unprocessable_entity }
      end
    end
  end

  def duplicate
    target_mode = params.require(:mode)
    duplicate_layout = build_duplicate_layout(@layout, target_mode)
    assign_member_context(duplicate_layout)

    if duplicate_layout.save
      respond_to do |format|
        format.html { redirect_to layout_path(duplicate_layout), notice: "Layout duplicated in #{target_mode.humanize} mode" }
        format.json { render json: duplicate_layout, serializer: LayoutSerializer, status: :created }
      end
    else
      respond_to do |format|
        format.html do
          flash[:alert] = duplicate_layout.errors.full_messages.to_sentence
          redirect_to layouts_path, status: :unprocessable_entity
        end
        format.json { render json: { errors: duplicate_layout.errors.full_messages }, status: :unprocessable_entity }
      end
    end
  end

  private

  def load_dashboard_lists
    @layouts = Layout.includes(layout_components: :inventory_item).order(:name)
    @inventory_balances = InventoryItem.order(:name).map do |item|
      OpenStruct.new(
        id: item.id,
        name: item.name,
        on_hand: item.on_hand,
        reserved: item.reserved,
        available: item.on_hand - item.reserved
      )
    end
  end

  def respond_with_errors(template)
    respond_to do |format|
      format.html do
        flash.now[:alert] = @layout.errors.full_messages.to_sentence
        render template, status: :unprocessable_entity
      end
      format.json { render json: { errors: @layout.errors.full_messages }, status: :unprocessable_entity }
    end
  end

  def set_layout
    @layout = Layout.includes(layout_components: :inventory_item).find(params[:id])
  end

  def layout_params
    params.require(:layout).permit(
      :name,
      :description,
      :mode,
      :status,
      :summary_note,
      :plot_width,
      :plot_depth,
      layout_components_attributes: %i[
        id
        component_type
        variant
        quantity
        notes
        inventory_item_id
        _destroy
      ]
    )
  end

  def assign_member_context(layout)
    member = current_member
    layout.owner ||= member
    layout.last_saved_by = member
  end

  def build_duplicate_layout(layout, target_mode)
    layout.dup.tap do |duplicate|
      duplicate.name = params[:name].presence || "#{layout.name} Copy"
      duplicate.mode = target_mode
      duplicate.status = :draft
      duplicate.layout_components = layout.layout_components.map do |component|
        component.dup.tap do |dup|
          dup.inventory_item_id = component.inventory_item_id if target_mode.to_s == "real_inventory"
        end
      end
    end
  end
end
