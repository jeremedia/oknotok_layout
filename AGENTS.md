# Repository Guidelines

## Project Structure & Module Organization
The Rails application lives in `app/`, with domain logic in `app/models`, Turbo-ready Haml views under `app/views`, and API serializers in `app/serializers`. Stimulus controllers and other JavaScript entrypoints belong in `app/javascript`, while Tailwind sources reside in `app/assets/stylesheets` and compile to `app/assets/builds`. Reusable Ruby helpers should go in `lib/`, environment configuration in `config/`, and database schema, seeds, and migrations in `db/`. Keep user-facing static assets inside `public/`, and use `test/` for fixtures, integration specs, and system tests.

## Build, Test, and Development Commands
Run `bin/dev` for the full developer stack: Rails server plus esbuild and Tailwind watchers from `Procfile.dev`. Use `bin/rails server` when you only need the web process, and `bin/rails db:prepare` before first boot or after pulling schema changes. Front-end bundles can be rebuilt on demand with `yarn build` and `yarn build:css`. Run the Ruby test suite via `bin/rails test`, target system tests with `bin/rails test:system`, and lint security or style issues with `bundle exec brakeman` and `bundle exec rubocop`.

## Coding Style & Naming Conventions
Follow standard Ruby style: two-space indentation, `snake_case` for methods and variables, `CamelCase` for classes and modules. Haml partials live in `app/views/**/_partial.html.haml`, and Stimulus controllers use `kebab-case_controller.js`. Scope Tailwind classes through component-specific wrappers to avoid global bleed. Before opening a pull request, format and lint with `bundle exec rubocop`; commit only files that pass.

## Testing Guidelines
Minitest powers the suite in `test/`. Add controller and integration tests under the matching directory names, and exercise UI flows with system tests that inherit from `ApplicationSystemTestCase`. Name tests to reflect behavior (`test_fetches_layout_preview`), keep fixtures minimal, and prefer factories embedded in setup blocks for complex data. Run `bin/rails test` locally and ensure new features include at least one automated check; document any gaps in the pull request.

## Commit & Pull Request Guidelines
Commits in this repo use short, descriptive statements (e.g., `add haml serializer`). Write messages in the imperative mood and scope them to a single logical change. For pull requests, include a concise summary, testing notes (`bin/rails test` output), and links to related issues or tickets. Attach screenshots or recordings when UI changes are involved, and call out any migrations or manual steps reviewers must execute.
