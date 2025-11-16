Rails.application.routes.draw do
  devise_for :members
  resources :layouts, only: [:index, :show, :create, :update] do
    member do
      post :toggle_mode
      post :duplicate
    end
  end

  resources :layout_viewer, only: [:index, :show], path: 'designer'

  namespace :admin do
    resources :members, only: [:index, :update]
    resources :invitations, only: [:create]
    resources :inventory_items, only: [:index, :update] do
      resources :adjustments, only: [:create], module: :inventory_items
    end
  end

  namespace :api do
    namespace :v1 do
      resources :layouts do
        member do
          post :toggle_mode
          post :duplicate
          delete :clear
        end
        resources :brackets, only: [:index, :create]
        resources :beams, only: [:index, :create]
      end

      resources :brackets, only: [:show, :update, :destroy]
      resources :beams, only: [:show, :update, :destroy]
    end
  end

  root "layouts#index"
end
