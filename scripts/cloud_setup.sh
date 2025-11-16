#!/bin/bash

# OKNOTOK Layout Designer Cloud Setup for Claude Code on the web
#
# PREREQUISITES (configure in claude.ai/code environment settings):
# 1. Network Access: "Full internet access" (for package downloads)
# 2. Environment Variables: (none required for basic operation)
#
# This script only runs in remote environments (CLAUDE_CODE_REMOTE=true)

# Logging function
log() {
  echo "[cloud_setup.sh] $*" >&2
}

# Error handler
handle_error() {
  log "❌ ERROR on line $1: Command failed"
  log "Last command: $BASH_COMMAND"
  exit 1
}

# Set up error handling (but don't exit on first error)
trap 'handle_error $LINENO' ERR

# Only run in Claude Code on the web (remote environments)
# Allow --force flag for manual testing
if [ "$1" = "--force" ]; then
  log "⚠️  Running in FORCE mode (bypassing CLAUDE_CODE_REMOTE check)"
elif [ "$CLAUDE_CODE_REMOTE" != "true" ]; then
  log "Skipping cloud setup - running locally (CLAUDE_CODE_REMOTE != 'true')"
  log "To run manually: $0 --force"
  exit 0
fi

log "🚀 Setting up OKNOTOK Layout Designer for Claude Code on the web..."
log "Working directory: $(pwd)"
log "Script location: ${BASH_SOURCE[0]}"

# Verify Ruby version (should be pre-installed)
log "✓ Ruby version: $(ruby -v)"

# Install gems (required each session as gems don't persist)
log "📦 Installing Ruby gems..."
bundle install --jobs=4 --retry=3 2>&1 | while read line; do log "  $line"; done || {
  log "❌ Bundle install failed!"
  exit 1
}

# Install Node packages for asset compilation
if [ -f "package.json" ]; then
  log "📦 Installing Node packages..."
  if command -v yarn &> /dev/null; then
    yarn install 2>&1 | while read line; do log "  $line"; done || {
      log "⚠️  Yarn install failed, trying npm..."
      npm install 2>&1 | while read line; do log "  $line"; done
    }
  else
    npm install 2>&1 | while read line; do log "  $line"; done
  fi
fi

# Setup PostgreSQL (pre-installed but needs initialization per session)
log "🗄️  Setting up PostgreSQL..."

# Check if PostgreSQL cluster exists
if ! pg_lsclusters 2>/dev/null | grep -q "16.*main"; then
  log "   Creating PostgreSQL cluster..."
  pg_dropcluster --stop 16 main 2>/dev/null || true
  pg_createcluster --locale=C.UTF-8 16 main || {
    log "❌ Failed to create PostgreSQL cluster"
    exit 1
  }
fi

# Configure PostgreSQL authentication (change all peer auth to trust)
if [ -f /etc/postgresql/16/main/pg_hba.conf ]; then
  if grep -q "peer" /etc/postgresql/16/main/pg_hba.conf; then
    log "   Configuring authentication (peer → trust)..."
    # Change all local peer authentication to trust (handles variable whitespace)
    sed -i 's/^\(local\s\+.*\)peer\s*$/\1trust/' /etc/postgresql/16/main/pg_hba.conf || {
      log "⚠️  Failed to update pg_hba.conf (may need sudo)"
    }
  fi
else
  log "⚠️  pg_hba.conf not found at expected location"
fi

# Ensure /tmp has correct permissions for PostgreSQL socket
chmod 1777 /tmp 2>/dev/null || log "⚠️  Could not set /tmp permissions"

# Disable SSL for local development (avoids SSL key permission issues)
if [ -f /etc/postgresql/16/main/postgresql.conf ]; then
  if ! grep -q "^ssl = off" /etc/postgresql/16/main/postgresql.conf; then
    log "   Disabling SSL for local development..."
    sed -i "s/^#*ssl = on/ssl = off/" /etc/postgresql/16/main/postgresql.conf || {
      log "⚠️  Could not disable SSL (may need sudo)"
    }
  fi
fi

# Start PostgreSQL if not running
if ! pg_isready -q 2>/dev/null; then
  log "   Starting PostgreSQL..."
  pg_ctlcluster 16 main start || {
    log "❌ Failed to start PostgreSQL cluster"
    log "   Trying alternative method..."
    sudo service postgresql start || {
      log "❌ All PostgreSQL start methods failed"
      exit 1
    }
  }
  sleep 2

  # Verify PostgreSQL is actually running
  if ! pg_isready -q 2>/dev/null; then
    log "❌ PostgreSQL failed to start"
    exit 1
  fi
  log "   ✓ PostgreSQL started successfully"
fi

# Create root superuser if it doesn't exist
if ! psql -U postgres -d postgres -tAc "SELECT 1 FROM pg_roles WHERE rolname='root'" 2>/dev/null | grep -q 1; then
  log "   Creating root database user..."
  psql -U postgres -d postgres -c "CREATE USER root WITH SUPERUSER CREATEDB CREATEROLE LOGIN;" 2>/dev/null || {
    log "⚠️  Could not create root user (may already exist)"
  }
fi

# Setup database
log "🗄️  Setting up Rails databases..."
if ! bin/rails db:version 2>/dev/null; then
  log "   Creating databases..."
  bin/rails db:create || {
    log "❌ Failed to create databases"
    exit 1
  }
fi

log "   Running migrations..."
bin/rails db:migrate || {
  log "❌ Failed to run migrations"
  exit 1
}

# Setup test database
log "🧪 Preparing test database..."
RAILS_ENV=test bin/rails db:prepare || {
  log "❌ Failed to prepare test database"
  exit 1
}

# Build assets
log "🎨 Building assets..."
if [ -f "package.json" ]; then
  if command -v yarn &> /dev/null; then
    log "   Building JavaScript assets..."
    yarn build 2>&1 | while read line; do log "  $line"; done || log "⚠️  JavaScript build failed"

    log "   Building CSS assets..."
    yarn build:css 2>&1 | while read line; do log "  $line"; done || log "⚠️  CSS build failed"
  else
    log "   Building JavaScript assets..."
    npm run build 2>&1 | while read line; do log "  $line"; done || log "⚠️  JavaScript build failed"

    log "   Building CSS assets..."
    npm run build:css 2>&1 | while read line; do log "  $line"; done || log "⚠️  CSS build failed"
  fi
fi

log "✅ Cloud setup complete!"
log "   PostgreSQL: $(pg_isready)"
log "   Database: $(bin/rails db:version 2>&1 | grep 'Current version' || echo 'Ready')"
log "   Ruby gems: $(bundle check 2>&1 | head -1)"
log "   Setup completed in $SECONDS seconds"
exit 0
