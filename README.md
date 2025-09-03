# acx-tools

CLI tools for ACX workflow management and blockchain exploration.

## Installation

```bash
npm install -g .
```

## Commands

### Transaction & Address Explorer
- `acx-tools tx <chain> <txHash>` - Open transaction in block explorer
- `acx-tools address <chain> <address>` - Open address in block explorer

### Chain Information
- `acx-tools chain <input>` - Translate between chain names and IDs
- `acx-tools chains` - List all available chains

### Deposit Status
- `acx-tools deposit <txHash>` - Get deposit status by transaction hash
- `acx-tools deposit <depositId> <originChainId>` - Get deposit status by ID

### Contract Explorer
- `acx-tools spoke-pool <chain>` - Open SpokePool contract in block explorer
- `acx-tools hub-pool` - Open HubPool contract in mainnet block explorer

## Examples

```bash
# Open transaction on Arbitrum
acx-tools tx arbitrum 0x123...

# Check deposit status
acx-tools deposit 0x456...
```