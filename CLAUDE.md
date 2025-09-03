# CLAUDE.md - Project Context

## Project Overview
`acx-tools` is a CLI tool for ACX (Across Protocol) workflow management and blockchain exploration. It provides commands to interact with Across Protocol contracts and explore blockchain data.

## Key Dependencies
- `@across-protocol/constants` - Network configuration and chain data
- `@across-protocol/contracts` - Contract deployments and addresses (exports `DEPLOYMENTS` object)
- `commander` - CLI framework
- `tsx` - TypeScript execution

## Project Structure
- `src/index.ts` - Main CLI application with all commands
- `package.json` - Project configuration with global binary setup
- `README.md` - User documentation

## Available Commands
1. **Transaction/Address Explorer**: `tx`, `address` - Open blockchain explorers
2. **Chain Info**: `chain`, `chains` - Chain ID/name translation and listing
3. **Deposit Status**: `deposit` - Query Across Protocol deposit status
4. **Contract Explorer**: `spoke-pool`, `hub-pool` - Open contract pages in block explorers

## Contract Integration
- Uses `DEPLOYMENTS` from `@across-protocol/contracts` to get contract addresses
- SpokePool contracts exist on multiple chains
- HubPool contract only exists on mainnet (chainId: 1)
- Structure: `DEPLOYMENTS[chainId][contractName].address`

## Shell Integration
- Global installation via `npm install -g .`
- Shell aliases configured in `~/.zshrc`:
  - `spoke` → `acx-tools spoke-pool`
  - `hub` → `acx-tools hub-pool`

## Build Process
- TypeScript compilation: `npm run build`
- Development: `npm run dev` (uses tsx)
- Global install after changes: `npm install -g .`

## Code Patterns
- Uses existing `findChainByName()` and `findChainById()` helper functions
- Follows same browser opening pattern across all commands (Chrome on macOS)
- Consistent error handling with process.exit(1) on failures
- Uses `PUBLIC_NETWORKS` from constants for chain data and block explorer URLs