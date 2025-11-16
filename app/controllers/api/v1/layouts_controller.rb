module Api
  module V1
    class LayoutsController < ActionController::API
      include Devise::Controllers::Helpers

      # before_action :authenticate_member!
      before_action :set_layout, only: %i[show update destroy toggle_mode duplicate]

      # Override current_member to use admin user (ID 1) when auth is disabled
      def current_member
        @current_member ||= Member.find_by(id: 1) || Member.first
      end

      def index
        layouts = Layout.includes(:layout_components)
        render json: layouts, each_serializer: LayoutSerializer
      end

      def show
        render json: @layout, serializer: LayoutSerializer
      end

      def create
        @layout = Layout.new(layout_params)
        apply_member_context(@layout)

        if persist_with_reservations(@layout)
          render json: @layout, serializer: LayoutSerializer, status: :created
        else
          render json: { errors: @layout.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def update
        @layout.assign_attributes(layout_params)
        apply_member_context(@layout)

        if persist_with_reservations(@layout)
          render json: @layout, serializer: LayoutSerializer
        else
          render json: { errors: @layout.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def destroy
        @layout.destroy
        head :no_content
      end

      def toggle_mode
        target_mode = params.require(:mode)
        result = reservation_service(@layout).switch_mode!(target_mode)

        if result.success?
          render json: @layout.reload, serializer: LayoutSerializer
        else
          render json: { errors: result.errors }, status: :unprocessable_entity
        end
      end

      def duplicate
        target_mode = params.require(:mode)
        duplicate_layout = @layout.dup
        duplicate_layout.name = params[:name].presence || "#{@layout.name} Copy"
        duplicate_layout.mode = target_mode
        duplicate_layout.status = :draft
        duplicate_layout.layout_components = @layout.layout_components.map do |component|
          component.dup.tap do |dup|
            dup.inventory_item_id = component.inventory_item_id if target_mode == "real_inventory"
          end
        end
        apply_member_context(duplicate_layout)

        if persist_with_reservations(duplicate_layout)
          render json: duplicate_layout, serializer: LayoutSerializer, status: :created
        else
          render json: { errors: duplicate_layout.errors.full_messages }, status: :unprocessable_entity
        end
      end

      private

      def persist_with_reservations(layout)
        layout.save
      rescue ActiveRecord::RecordInvalid => e
        layout.errors.add(:base, e.message)
        false
      end

      def reservation_service(layout)
        InventoryReservationService.new(layout)
      end

      def apply_member_context(layout)
        member = current_member
        layout.owner ||= member
        layout.last_saved_by = member
      end

      def set_layout
        @layout = Layout.includes(:layout_components).find(params[:id])
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
    end
  end
end
