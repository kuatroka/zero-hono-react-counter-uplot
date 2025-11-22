# Implementation Tasks

## 1. Create Detection Script
- [x] 1.1 Create `scripts/detect-container-runtime.sh` with Podman-first detection logic
- [x] 1.2 Add executable permissions to the script
- [x] 1.3 Implement fallback to Docker when Podman is not available
- [x] 1.4 Add error handling for when neither runtime is found
- [x] 1.5 Test script on systems with Podman only
- [x] 1.6 Test script on systems with Docker only
- [x] 1.7 Test script on systems with both runtimes (should prefer Podman)
- [x] 1.8 **BUG FIX**: Add functional verification (not just installation check)
  - Added `is_podman_usable()` to verify `podman info` succeeds
  - Added `is_docker_usable()` to verify `docker info` succeeds
  - Fixes issue where Podman is installed but not running (e.g., no machine on macOS)

## 2. Update Package Scripts
- [x] 2.1 Update `dev:db-up` to use detection script
- [x] 2.2 Update `dev:db-down` to use detection script
- [x] 2.3 Update `dev:clean` to use detection script
- [x] 2.4 Ensure all scripts work with both Podman and Docker

## 3. Documentation
- [x] 3.1 Update README.md to mention automatic runtime detection
- [x] 3.2 Document the detection priority (Podman first, Docker fallback)
- [x] 3.3 Add troubleshooting section for runtime detection issues
- [x] 3.4 Update documentation to reflect functional verification
  - Added macOS-specific Podman setup instructions
  - Added Docker Desktop startup requirement
  - Updated troubleshooting with verification commands

## 4. Testing
- [x] 4.1 Verify database starts correctly with Podman
- [x] 4.2 Verify database starts correctly with Docker
- [x] 4.3 Verify clean script works with both runtimes
- [x] 4.4 Test error messages when neither runtime is available

## 5. Deployment
- [x] 5.1 Commit changes with descriptive message
- [x] 5.2 All functionality verified and working
