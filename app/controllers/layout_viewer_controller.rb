class LayoutViewerController < ApplicationController
  def show

  end

  def index
    @layouts = Layout.all
  end
end
