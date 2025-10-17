# Add Container Runtime Auto-Detection

## Why

The project currently hardcodes `podman` in bun scripts, which breaks for developers using Docker. This creates friction for contributors and limits portability across different development environments.

## What Changes

- Add a container runtime detection script that checks for Podman availability first, then falls back to Docker
- Update bun scripts to use the detection script instead of hardcoded `podman` commands
- Ensure backward compatibility with existing Podman-based workflows
- Provide clear error messages when neither runtime is available

## Impact

- **Affected specs**: `container-runtime-detection` (new capability)
- **Affected code**: 
  - `package.json` - Update `dev:db-up`, `dev:db-down`, `dev:clean` scripts
  - New script file for runtime detection (e.g., `scripts/detect-container-runtime.sh` or similar)
- **Breaking changes**: None - this is backward compatible
- **Benefits**: 
  - Improved developer experience for Docker users
  - Maintains existing Podman-first preference
  - Reduces setup friction for new contributors
