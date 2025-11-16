# Cloud Setup for Claude Code on the Web

This project is configured to run automatically in Claude Code's cloud VM environment.

## How It Works

When you start a Claude Code session on the web:

1. Your repository is cloned into an isolated VM
2. The `SessionStart` hook (`.claude/settings.json`) triggers
3. `scripts/cloud_setup.sh` runs automatically
4. Dependencies are installed and databases are prepared
5. Claude is ready to work with a fully configured environment

## What Gets Installed

The cloud setup script handles:

- **Ruby Gems**: `bundle install` with all dependencies from Gemfile
- **Node Packages**: `yarn install` for JavaScript tooling
- **PostgreSQL**:
  - Creates and configures PostgreSQL 16 cluster
  - Sets up authentication
  - Creates databases and runs migrations
- **Assets**: Pre-builds JavaScript and CSS for faster development

## Configuration Files

### `.claude/settings.json`

Defines the SessionStart hook that runs on every new cloud session:

```json
{
  "hooks": {
    "SessionStart": [
      {
        "matcher": "startup",
        "hooks": [
          {
            "type": "command",
            "command": "\"$CLAUDE_PROJECT_DIR\"/scripts/cloud_setup.sh"
          }
        ]
      }
    ]
  }
}
```

### `scripts/cloud_setup.sh`

The initialization script that:
- Detects cloud vs. local environment via `$CLAUDE_CODE_REMOTE`
- Installs all dependencies
- Configures PostgreSQL
- Prepares databases (development and test)
- Builds frontend assets

## Environment Variables

Configure these at [claude.ai/code](https://claude.ai/code) if needed:

| Variable | Purpose | Required |
|----------|---------|----------|
| (none currently) | - | - |

Add future API keys or secrets here as needed.

## Network Access

Configure network settings at claude.ai/code:

- **Recommended**: "Full internet access" for package downloads
- **Alternative**: "Limited" with allowlist for specific package registries

## Testing Locally

The cloud setup script skips automatically when run on your local machine.

To test the script logic locally:

```bash
./scripts/cloud_setup.sh --force
```

⚠️ **Warning**: This will attempt to configure PostgreSQL on your local machine.

## Troubleshooting

### Bundle Install Fails
- Check Gemfile.lock compatibility
- Verify Ruby version matches `.ruby-version`

### PostgreSQL Issues
- VM should have PostgreSQL 16 pre-installed
- Script creates cluster automatically
- Check logs in SessionStart output

### Asset Build Fails
- Verify `package.json` scripts are correct
- Check that yarn/npm is available in VM

## VM Specifications

Anthropic's cloud VMs include:

- **Ruby**: 3.1.6, 3.2.6, 3.3.6 (with gem, bundler, rbenv)
- **PostgreSQL**: 16
- **Node.js**: Latest LTS
- **Build Tools**: Common development toolchains

## Security

- Each session runs in an isolated VM
- Limited network access (configurable)
- GitHub credentials are scoped to repository access only
- Environment variables are session-specific

## References

- [Claude Code on the Web Docs](https://code.claude.com/docs/en/claude-code-on-the-web)
- [SessionStart Hooks Guide](https://code.claude.com/docs/en/hooks)
