#!/usr/bin/env node

import { Command } from 'commander';
import { exec } from 'child_process';
import { PUBLIC_NETWORKS, TOKEN_SYMBOLS_MAP } from '@across-protocol/constants';
import { DEPLOYMENTS } from '@across-protocol/contracts';
import { version } from '../package.json';

const program = new Command();

program
  .name('acx-tools')
  .description('CLI tools for ACX workflow management')
  .version(version);

function findChainByName(chainName: string) {
  const normalizedInput = chainName.toLowerCase().replace(/[-_\s]/g, '');
  
  for (const [chainId, network] of Object.entries(PUBLIC_NETWORKS)) {
    const normalizedNetworkName = network.name.toLowerCase().replace(/[-_\s]/g, '');
    if (normalizedNetworkName.includes(normalizedInput) || normalizedInput.includes(normalizedNetworkName)) {
      return { chainId: parseInt(chainId), network };
    }
  }
  
  return null;
}

function findChainById(chainId: number) {
  const network = PUBLIC_NETWORKS[chainId];
  return network ? { chainId, network } : null;
}

function findTokenBySymbol(tokenSymbol: string, chainId: number) {
  const normalizedSymbol = tokenSymbol.toUpperCase();

  // Find token in TOKEN_SYMBOLS_MAP
  const tokenInfo = TOKEN_SYMBOLS_MAP[normalizedSymbol as keyof typeof TOKEN_SYMBOLS_MAP];

  if (!tokenInfo) {
    return null;
  }

  // Get the address for the specific chain
  const address = tokenInfo.addresses[chainId];

  if (!address) {
    return null;
  }

  return {
    symbol: tokenInfo.symbol,
    decimals: tokenInfo.decimals,
    address,
    name: tokenInfo.name
  };
}

function processDepositData(data: any) {
  console.log(JSON.stringify(data, null, 2));
  
  if (data.depositTxHash && data.originChainId) {
    const originChain = findChainById(data.originChainId);
    if (originChain) {
      const depositUrl = `${originChain.network.blockExplorer}/tx/${data.depositTxHash}`;
      console.log(`\nDeposit: ${depositUrl}`);
    }
  }
  
  if (data.fillTx && data.destinationChainId) {
    const destinationChain = findChainById(data.destinationChainId);
    if (destinationChain) {
      const fillUrl = `${destinationChain.network.blockExplorer}/tx/${data.fillTx}`;
      console.log(`Fill: ${fillUrl}`);
    }
  }
  
  if (data.status === "refunded" && data.depositRefundTxHash && data.originChainId) {
    const originChain = findChainById(data.originChainId);
    if (originChain) {
      const refundUrl = `${originChain.network.blockExplorer}/tx/${data.depositRefundTxHash}`;
      console.log(`Refund: ${refundUrl}`);
    }
  }
}

program
  .command('tx')
  .description('Open transaction in block explorer')
  .argument('<chain>', 'Chain name or chain ID (e.g., mainnet, arbitrum, 1, 42161)')
  .argument('<txHash>', 'Transaction hash')
  .action((chain: string, txHash: string) => {
    const isNumeric = /^\d+$/.test(chain);
    let result;
    
    if (isNumeric) {
      const chainId = parseInt(chain);
      result = findChainById(chainId);
    } else {
      result = findChainByName(chain);
    }
    
    if (!result) {
      console.error(`Chain "${chain}" not found. Available chains:`);
      Object.values(PUBLIC_NETWORKS)
        .slice(0, 10)
        .forEach(network => console.log(`  - ${network.name}`));
      console.log('  ... and more');
      process.exit(1);
    }
    
    const { network } = result;
    const txUrl = `${network.blockExplorer}/tx/${txHash}`;
    
    console.log(`Opening: ${txUrl}`);
    
    const command = process.platform === 'darwin' 
      ? `open -a "Brave Browser" "${txUrl}"`
      : process.platform === 'win32'
      ? `start chrome "${txUrl}"`
      : `google-chrome "${txUrl}"`;
    
    exec(command, (error) => {
      if (error) {
        console.error('Failed to open browser:', error.message);
        console.log('URL:', txUrl);
      }
    });
  });

program
  .command('address')
  .description('Open address in block explorer')
  .argument('<chain>', 'Chain name or chain ID (e.g., mainnet, arbitrum, 1, 42161)')
  .argument('<address>', 'Address to view')
  .action((chain: string, address: string) => {
    const isNumeric = /^\d+$/.test(chain);
    let result;
    
    if (isNumeric) {
      const chainId = parseInt(chain);
      result = findChainById(chainId);
    } else {
      result = findChainByName(chain);
    }
    
    if (!result) {
      console.error(`Chain "${chain}" not found. Available chains:`);
      Object.values(PUBLIC_NETWORKS)
        .slice(0, 10)
        .forEach(network => console.log(`  - ${network.name}`));
      console.log('  ... and more');
      process.exit(1);
    }
    
    const { network } = result;
    const addressUrl = `${network.blockExplorer}/address/${address}`;
    
    console.log(`Opening: ${addressUrl}`);
    
    const command = process.platform === 'darwin' 
      ? `open -a "Brave Browser" "${addressUrl}"`
      : process.platform === 'win32'
      ? `start chrome "${addressUrl}"`
      : `google-chrome "${addressUrl}"`;
    
    exec(command, (error) => {
      if (error) {
        console.error('Failed to open browser:', error.message);
        console.log('URL:', addressUrl);
      }
    });
  });

program
  .command('chain')
  .description('Translate between chain names and chain IDs')
  .argument('<input>', 'Chain name or chain ID')
  .action((input: string) => {
    const isNumeric = /^\d+$/.test(input);
    
    if (isNumeric) {
      const chainId = parseInt(input);
      const result = findChainById(chainId);
      
      if (!result) {
        console.error(`Chain ID "${chainId}" not found.`);
        process.exit(1);
      }
      
      console.log(`Chain ID: ${result.chainId}`);
      console.log(`Chain Name: ${result.network.name}`);
    } else {
      const result = findChainByName(input);
      
      if (!result) {
        console.error(`Chain "${input}" not found. Available chains:`);
        Object.values(PUBLIC_NETWORKS)
          .slice(0, 10)
          .forEach(network => console.log(`  - ${network.name}`));
        console.log('  ... and more');
        process.exit(1);
      }
      
      console.log(`Chain Name: ${result.network.name}`);
      console.log(`Chain ID: ${result.chainId}`);
    }
  });

program
  .command('chains')
  .description('List all available chains')
  .action(() => {
    console.log('Available chains:');
    Object.entries(PUBLIC_NETWORKS)
      .sort(([, a], [, b]) => a.name.localeCompare(b.name))
      .forEach(([chainId, network]) => {
        console.log(`  ${network.name.padEnd(20)} (ID: ${chainId})`);
      });
  });

program
  .command('deposit')
  .description('Get deposit status')
  .argument('<input...>', 'Either depositTxnRef (single string) or depositId and originChainId (two numbers)')
  .action(async (inputs: string[]) => {
    if (inputs.length === 1) {
      const depositTxnRef = inputs[0];
      
      if (/^\d+$/.test(depositTxnRef)) {
        console.error('Single argument must be a transaction hash (depositTxnRef), not a number.');
        console.error('Usage: acx-tools deposit <txHash> OR acx-tools deposit <depositId> <originChainId>');
        process.exit(1);
      }
      
      const url = `https://indexer.api.across.to/deposit/status?depositTxnRef=${depositTxnRef}`;
      console.log(`Fetching: ${url}\n`);
      
      try {
        const response = await fetch(url);
        if (!response.ok) {
          console.error(`API Error: ${response.status} ${response.statusText}`);
          process.exit(1);
        }
        
        const data = await response.json();
        processDepositData(data);
      } catch (error) {
        console.error('Failed to fetch deposit status:', error instanceof Error ? error.message : error);
        process.exit(1);
      }
    } else if (inputs.length === 2) {
      const [depositIdStr, originChainIdStr] = inputs;
      
      if (!/^\d+$/.test(depositIdStr) || !/^\d+$/.test(originChainIdStr)) {
        console.error('When using two arguments, both must be numbers (depositId and originChainId).');
        console.error('Usage: acx-tools deposit <txHash> OR acx-tools deposit <depositId> <originChainId>');
        process.exit(1);
      }
      
      const depositId = depositIdStr;
      const originChainId = originChainIdStr;
      const url = `https://indexer.api.across.to/deposit/status?depositId=${depositId}&originChainId=${originChainId}`;
      console.log(`Fetching: ${url}\n`);
      
      try {
        const response = await fetch(url);
        if (!response.ok) {
          console.error(`API Error: ${response.status} ${response.statusText}`);
          process.exit(1);
        }
        
        const data = await response.json();
        processDepositData(data);
      } catch (error) {
        console.error('Failed to fetch deposit status:', error instanceof Error ? error.message : error);
        process.exit(1);
      }
    } else {
      console.error('Invalid number of arguments.');
      console.error('Usage: acx-tools deposit <txHash> OR acx-tools deposit <depositId> <originChainId>');
      process.exit(1);
    }
  });

program
  .command('spoke-pool')
  .description('Open SpokePool contract in block explorer')
  .argument('<chain>', 'Chain name or chain ID (e.g., mainnet, arbitrum, 1, 42161)')
  .action((chain: string) => {
    const isNumeric = /^\d+$/.test(chain);
    let result;
    
    if (isNumeric) {
      const chainId = parseInt(chain);
      result = findChainById(chainId);
    } else {
      result = findChainByName(chain);
    }
    
    if (!result) {
      console.error(`Chain "${chain}" not found. Available chains:`);
      Object.values(PUBLIC_NETWORKS)
        .slice(0, 10)
        .forEach(network => console.log(`  - ${network.name}`));
      console.log('  ... and more');
      process.exit(1);
    }
    
    const { chainId, network } = result;
    const spokePoolAddress = DEPLOYMENTS[chainId.toString()]?.contracts?.SpokePool?.address;
    
    if (!spokePoolAddress) {
      console.error(`SpokePool contract not found on ${network.name} (chain ID: ${chainId})`);
      process.exit(1);
    }
    
    const contractUrl = `${network.blockExplorer}/address/${spokePoolAddress}`;
    
    console.log(`Opening SpokePool on ${network.name}: ${contractUrl}`);
    
    const command = process.platform === 'darwin' 
      ? `open -a "Brave Browser" "${contractUrl}"`
      : process.platform === 'win32'
      ? `start chrome "${contractUrl}"`
      : `google-chrome "${contractUrl}"`;
    
    exec(command, (error) => {
      if (error) {
        console.error('Failed to open browser:', error.message);
        console.log('URL:', contractUrl);
      }
    });
  });

program
  .command('hub-pool')
  .description('Open HubPool contract in mainnet block explorer')
  .action(() => {
    const mainnetChainId = '1';
    const hubPoolAddress = DEPLOYMENTS[mainnetChainId]?.contracts?.HubPool?.address;

    if (!hubPoolAddress) {
      console.error('HubPool contract not found on mainnet');
      process.exit(1);
    }

    const mainnetNetwork = PUBLIC_NETWORKS[1];
    const contractUrl = `${mainnetNetwork.blockExplorer}/address/${hubPoolAddress}`;

    console.log(`Opening HubPool on mainnet: ${contractUrl}`);

    const command = process.platform === 'darwin'
      ? `open -a "Brave Browser" "${contractUrl}"`
      : process.platform === 'win32'
      ? `start chrome "${contractUrl}"`
      : `google-chrome "${contractUrl}"`;

    exec(command, (error) => {
      if (error) {
        console.error('Failed to open browser:', error.message);
        console.log('URL:', contractUrl);
      }
    });
  });

program
  .command('fees')
  .description('Get fee quote for bridging tokens via Across')
  .argument('<originChain>', 'Origin chain name or ID (e.g., base, arbitrum, 8453)')
  .argument('<destinationChain>', 'Destination chain name or ID (e.g., mainnet, optimism, 1)')
  .argument('<tokenSymbol>', 'Token symbol (e.g., USDC, ETH, WETH)')
  .argument('<amount>', 'Amount in human-readable format (e.g., 100 for 100 USDC)')
  .action(async (originChain: string, destinationChain: string, tokenSymbol: string, amountStr: string) => {
    // Resolve origin chain
    const isOriginNumeric = /^\d+$/.test(originChain);
    const originResult = isOriginNumeric
      ? findChainById(parseInt(originChain))
      : findChainByName(originChain);

    if (!originResult) {
      console.error(`Origin chain "${originChain}" not found.`);
      process.exit(1);
    }

    // Resolve destination chain
    const isDestNumeric = /^\d+$/.test(destinationChain);
    const destResult = isDestNumeric
      ? findChainById(parseInt(destinationChain))
      : findChainByName(destinationChain);

    if (!destResult) {
      console.error(`Destination chain "${destinationChain}" not found.`);
      process.exit(1);
    }

    const { chainId: originChainId } = originResult;
    const { chainId: destinationChainId } = destResult;

    // Resolve token on both chains
    const inputToken = findTokenBySymbol(tokenSymbol, originChainId);
    if (!inputToken) {
      console.error(`Token "${tokenSymbol}" not found on ${originResult.network.name} (chain ID: ${originChainId})`);
      process.exit(1);
    }

    const outputToken = findTokenBySymbol(tokenSymbol, destinationChainId);
    if (!outputToken) {
      console.error(`Token "${tokenSymbol}" not found on ${destResult.network.name} (chain ID: ${destinationChainId})`);
      process.exit(1);
    }

    // Convert human-readable amount to token's smallest unit
    const amountFloat = parseFloat(amountStr);
    if (isNaN(amountFloat) || amountFloat <= 0) {
      console.error(`Invalid amount: "${amountStr}". Must be a positive number.`);
      process.exit(1);
    }

    // Convert to smallest unit (e.g., 100 USDC -> 100000000 for 6 decimals)
    const amountInSmallestUnit = BigInt(Math.floor(amountFloat * Math.pow(10, inputToken.decimals))).toString();

    // Build API URL
    const apiUrl = new URL('https://app.across.to/api/suggested-fees');
    apiUrl.searchParams.append('inputToken', inputToken.address);
    apiUrl.searchParams.append('outputToken', outputToken.address);
    apiUrl.searchParams.append('originChainId', originChainId.toString());
    apiUrl.searchParams.append('destinationChainId', destinationChainId.toString());
    apiUrl.searchParams.append('amount', amountInSmallestUnit);

    console.log(`\nQuerying fees for ${amountStr} ${tokenSymbol}`);
    console.log(`Route: ${originResult.network.name} → ${destResult.network.name}`);
    console.log(`Fetching: ${apiUrl.toString()}\n`);

    try {
      const response = await fetch(apiUrl.toString());
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`API Error: ${response.status} ${response.statusText}`);
        console.error(errorText);
        process.exit(1);
      }

      const data = await response.json();

      // Format and display the response
      const totalRelayFeePct = parseFloat(data.totalRelayFee.pct) / 1e18;
      const lpFeePct = parseFloat(data.lpFee.pct) / 1e18;
      const capitalFeePct = parseFloat(data.relayerCapitalFee.pct) / 1e18;
      const gasFeePct = parseFloat(data.relayerGasFee.pct) / 1e18;

      const outputAmount = parseFloat(data.outputAmount) / Math.pow(10, outputToken.decimals);
      const totalFeeAmount = parseFloat(data.totalRelayFee.total) / Math.pow(10, inputToken.decimals);

      console.log('=== Fee Breakdown ===');
      console.log(`Total Relay Fee: ${(totalRelayFeePct * 100).toFixed(4)}% (${totalFeeAmount.toFixed(6)} ${inputToken.symbol})`);
      console.log(`  - LP Fee:      ${(lpFeePct * 100).toFixed(4)}%`);
      console.log(`  - Capital Fee: ${(capitalFeePct * 100).toFixed(4)}%`);
      console.log(`  - Gas Fee:     ${(gasFeePct * 100).toFixed(4)}%`);
      console.log('');
      console.log(`You will receive: ${outputAmount.toFixed(6)} ${outputToken.symbol}`);
      console.log(`Estimated fill time: ${data.estimatedFillTimeSec} seconds (~${Math.ceil(data.estimatedFillTimeSec / 60)} minutes)`);
      console.log('');
      console.log('=== Limits ===');
      console.log(`Min Deposit: ${(parseFloat(data.limits.minDeposit) / Math.pow(10, inputToken.decimals)).toFixed(6)} ${inputToken.symbol}`);
      console.log(`Max Deposit: ${(parseFloat(data.limits.maxDeposit) / Math.pow(10, inputToken.decimals)).toFixed(2)} ${inputToken.symbol}`);
      console.log(`Max Instant: ${(parseFloat(data.limits.maxDepositInstant) / Math.pow(10, inputToken.decimals)).toFixed(2)} ${inputToken.symbol}`);

      // Show raw JSON if user wants to see everything
      // console.log('\n=== Full Response ===');
      // console.log(JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Failed to fetch fees:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

program.parse();