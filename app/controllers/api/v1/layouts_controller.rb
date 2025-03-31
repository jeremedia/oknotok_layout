# app/controllers/api/v1/layouts_controller.rb
class Api::V1::LayoutsController < ActionController::API
  before_action :set_layout, only: [:show, :update, :destroy] # Add this callback

  # GET /api/v1/layouts
  def index
    layouts = Layout.all
    render json: layouts
  end

  # GET /api/v1/layouts/:id
  def show
    render json: @layout # @layout is set by the before_action
  end

  # POST /api/v1/layouts
  def create
    @layout = Layout.new(layout_params)

    if @layout.save
      render json: @layout, status: :created # Render the created layout, status 201
    else
      render json: { errors: @layout.errors.full_messages }, status: :unprocessable_entity # Render errors, status 422
    end
  end

  # PATCH/PUT /api/v1/layouts/:id
  def update
    if @layout.update(layout_params)
      render json: @layout # Render the updated layout, status 200 (default)
    else
      render json: { errors: @layout.errors.full_messages }, status: :unprocessable_entity # Render errors, status 422
    end
  end

  # DELETE /api/v1/layouts/:id
  def destroy
    # The dependent: :destroy associations on the Layout model will handle deleting brackets/beams
    if @layout.destroy
      head :no_content # Respond with status 204 No Content
    else
      # This might happen if a before_destroy callback fails, though unlikely here
      render json: { errors: @layout.errors.full_messages }, status: :unprocessable_entity
    end
  end

  private

  # Use callbacks to share common setup or constraints between actions.
  def set_layout
    @layout = Layout.find(params[:id])
  rescue ActiveRecord::RecordNotFound
    render json: { error: "Layout not found" }, status: :not_found
  end

  # Only allow a list of trusted parameters through.
  def layout_params
    params.require(:layout).permit(:name, :description)
    # Later, you might accept nested attributes for brackets/beams here if you design your API that way
  end
end