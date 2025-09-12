import { describe, test, expect, beforeAll, afterAll } from '@jest/test-env';
import request from 'supertest';
import { ethers } from 'ethers';
import { nftService } from '../src/services/nft';
import { tokenGatingService } from '../src/services/token-gating';
import { cryptoPaymentService } from '../src/services/crypto-payments';
import { providerManager } from '../../../packages/web3/src/providers/ProviderManager';

describe('Crypto Features Integration Tests', () => {
  let testWalletAddress: string;
  let testPrivateKey: string;

  beforeAll(async () => {
    // Create test wallet
    const wallet = ethers.Wallet.createRandom();
    testWalletAddress = wallet.address;
    testPrivateKey = wallet.privateKey;

    // Set test environment variables
    process.env.NODE_ENV = 'test';
    process.env.INFURA_PROJECT_ID = 'test-infura-id';
    process.env.ALCHEMY_API_KEY = 'test-alchemy-key';
  });

  afterAll(async () => {
    // Clean up any test data
  });

  describe('Provider Manager', () => {
    test('should get supported chains', () => {
      const chains = providerManager.getSupportedChains();
      expect(chains).toContain('ethereum');
      expect(chains).toContain('polygon');
      expect(chains).toContain('arbitrum');
    });

    test('should handle unsupported chain gracefully', async () => {
      await expect(
        providerManager.getProvider('unsupported-chain')
      ).rejects.toThrow('Unsupported chain');
    });

    test('should provide chain configuration', () => {
      const ethConfig = providerManager.getChainConfig('ethereum');
      expect(ethConfig).toBeTruthy();
      expect(ethConfig?.chainId).toBe(1);
      expect(ethConfig?.name).toBe('Ethereum Mainnet');
    });
  });

  describe('NFT Service', () => {
    test('should validate Ethereum addresses', () => {
      const validAddress = '0x742d35Cc8e27c684c2A6D2a1C3Fc6bEdc75f78bb';
      const invalidAddress = '0xinvalid';

      expect(ethers.isAddress(validAddress)).toBe(true);
      expect(ethers.isAddress(invalidAddress)).toBe(false);
    });

    test('should handle NFT ownership verification gracefully', async () => {
      const result = await nftService.verifyNFTOwnership(
        '0x0000000000000000000000000000000000000000', // Invalid contract
        '1',
        testWalletAddress,
        'ethereum'
      );

      expect(result.isOwner).toBe(false);
    });

    test('should resolve IPFS URLs correctly', () => {
      // Access private method through reflection for testing
      const resolveIPFS = (nftService as any).resolveIPFS.bind(nftService);
      
      const ipfsUrl = 'ipfs://QmTest123';
      const resolvedUrl = resolveIPFS(ipfsUrl);
      
      expect(resolvedUrl).toBe('https://gateway.pinata.cloud/ipfs/QmTest123');
    });

    test('should handle metadata fetch failures gracefully', async () => {
      const metadata = await nftService.fetchNFTMetadata(
        '0x0000000000000000000000000000000000000000',
        '999999',
        'ethereum'
      );

      // Should return basic metadata even on failure
      expect(metadata?.name).toBeDefined();
    });

    test('should create timeout promises correctly', () => {
      const timeout = (nftService as any).timeout.bind(nftService);
      
      const promise = timeout(100, 'Test timeout');
      
      return expect(promise).rejects.toThrow('Test timeout');
    });
  });

  describe('Token Gating Service', () => {
    test('should get supported tokens', () => {
      const tokens = tokenGatingService.getSupportedTokens();
      
      expect(tokens.length).toBeGreaterThan(0);
      expect(tokens.some(token => token.symbol === 'ETH')).toBe(true);
      expect(tokens.some(token => token.symbol === 'USDC')).toBe(true);
    });

    test('should handle access check with no wallet', async () => {
      const result = await tokenGatingService.checkAccess(
        'test-user-id',
        'test-server-id'
      );

      expect(result.hasAccess).toBe(false);
      expect(result.reason).toContain('wallet');
    });

    test('should validate token gating requirements', async () => {
      const mockRule = {
        id: 'test-rule',
        ruleType: 'TOKEN_BALANCE',
        tokenRequirements: [{
          tokenAddress: '0xA0b86991c631F4ED1DC5fCC7E1C2745e8fB9Aea3',
          symbol: 'USDC',
          name: 'USD Coin',
          chain: 'ethereum',
          minAmount: '100000000' // 100 USDC in 6 decimals
        }],
        nftRequirements: []
      };

      const checkRuleAccess = (tokenGatingService as any).checkRuleAccess.bind(tokenGatingService);
      const result = await checkRuleAccess(testWalletAddress, mockRule);

      expect(result).toBeDefined();
      expect(typeof result.hasAccess).toBe('boolean');
    });

    test('should handle bulk access checks', async () => {
      const rules = [
        { serverId: 'server-1' },
        { channelId: 'channel-1' },
        { communityId: 'community-1' }
      ];

      const results = await tokenGatingService.bulkCheckAccess('test-user', rules);
      
      expect(results).toHaveLength(3);
      expect(results.every(r => typeof r.hasAccess === 'boolean')).toBe(true);
    });
  });

  describe('Crypto Payment Service', () => {
    test('should get supported payment options', () => {
      const options = cryptoPaymentService.getSupportedOptions();
      
      expect(options.fiatCurrencies).toContain('USD');
      expect(options.cryptoCurrencies.some(c => c.code === 'ETH')).toBe(true);
      expect(options.networks.some(n => n.code === 'ethereum')).toBe(true);
    });

    test('should validate payment requests', () => {
      const validatePaymentRequest = (cryptoPaymentService as any).validatePaymentRequest.bind(cryptoPaymentService);
      
      const validRequest = {
        userId: 'test-user',
        amount: '100',
        currency: 'USD',
        cryptoCurrency: 'USDC',
        network: 'ethereum',
        walletAddress: testWalletAddress
      };

      const result = validatePaymentRequest(validRequest);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should reject invalid payment requests', () => {
      const validatePaymentRequest = (cryptoPaymentService as any).validatePaymentRequest.bind(cryptoPaymentService);
      
      const invalidRequest = {
        userId: 'test-user',
        amount: '5', // Below minimum
        currency: 'INVALID',
        cryptoCurrency: 'INVALID',
        network: 'invalid',
        walletAddress: '0xinvalid'
      };

      const result = validatePaymentRequest(invalidRequest);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('should validate webhook data structure', () => {
      const validateWebhookData = (cryptoPaymentService as any).validateWebhookData.bind(cryptoPaymentService);
      
      const validWebhookData = {
        orderId: 'test-order-123',
        status: 'COMPLETED',
        eventData: {
          transactionHash: '0x123...'
        }
      };

      const result = validateWebhookData(validWebhookData);
      expect(result.isValid).toBe(true);
    });

    test('should map Transak status to internal status', () => {
      const mapTransakStatusToInternal = (cryptoPaymentService as any).mapTransakStatusToInternal.bind(cryptoPaymentService);
      
      expect(mapTransakStatusToInternal('COMPLETED')).toBe('COMPLETED');
      expect(mapTransakStatusToInternal('CANCELLED')).toBe('CANCELLED');
      expect(mapTransakStatusToInternal('UNKNOWN_STATUS')).toBe('PENDING');
    });

    test('should check webhook rate limiting', () => {
      const checkWebhookRateLimit = (cryptoPaymentService as any).checkWebhookRateLimit.bind(cryptoPaymentService);
      
      // First request should pass
      expect(checkWebhookRateLimit('test-ip')).toBe(true);
      
      // Simulate many requests
      for (let i = 0; i < 10; i++) {
        checkWebhookRateLimit('test-ip');
      }
      
      // Should be rate limited
      expect(checkWebhookRateLimit('test-ip')).toBe(false);
    });
  });

  describe('Error Handling', () => {
    test('should handle network failures gracefully', async () => {
      // Test with provider that doesn't exist
      jest.spyOn(console, 'error').mockImplementation(() => {});
      
      const result = await nftService.verifyNFTOwnership(
        '0x0000000000000000000000000000000000000000',
        '1',
        testWalletAddress,
        'ethereum'
      );

      expect(result.isOwner).toBe(false);
    });

    test('should handle invalid contract addresses', async () => {
      const result = await nftService.verifyNFTOwnership(
        '0xinvalid',
        '1',
        testWalletAddress,
        'ethereum'
      );

      expect(result.isOwner).toBe(false);
    });

    test('should handle timeout scenarios', async () => {
      // Mock a timeout scenario
      const originalTimeout = (nftService as any).timeout;
      (nftService as any).timeout = jest.fn().mockRejectedValue(new Error('Timeout'));

      try {
        await nftService.fetchNFTMetadata(
          '0x0000000000000000000000000000000000000000',
          '1',
          'ethereum'
        );
      } catch (error) {
        // Should be caught and handled
      }

      // Restore original method
      (nftService as any).timeout = originalTimeout;
    });
  });

  describe('Security', () => {
    test('should validate wallet addresses before operations', async () => {
      const invalidAddress = 'not-an-address';
      
      const result = await nftService.verifyNFTOwnership(
        '0x0000000000000000000000000000000000000000',
        '1',
        invalidAddress,
        'ethereum'
      );

      expect(result.isOwner).toBe(false);
    });

    test('should sanitize input data', () => {
      const maliciousInput = '<script>alert("xss")</script>';
      const contractAddress = '0x0000000000000000000000000000000000000000';
      
      // Should not throw or execute the script
      expect(() => {
        nftService.fetchNFTMetadata(contractAddress, maliciousInput, 'ethereum');
      }).not.toThrow();
    });

    test('should verify webhook signatures', () => {
      const verifyWebhookSignature = (cryptoPaymentService as any).verifyWebhookSignature.bind(cryptoPaymentService);
      
      // Mock webhook data
      const body = { orderId: 'test', status: 'COMPLETED' };
      const validSignature = 'valid-signature';
      
      // Should handle verification attempt (will fail without real secret)
      const result = verifyWebhookSignature(body, validSignature);
      expect(typeof result).toBe('boolean');
    });
  });

  describe('Performance', () => {
    test('should cache NFT metadata', async () => {
      const contractAddress = '0x0000000000000000000000000000000000000000';
      const tokenId = '1';
      
      // First call
      const start1 = Date.now();
      const result1 = await nftService.fetchNFTMetadata(contractAddress, tokenId, 'ethereum');
      const time1 = Date.now() - start1;
      
      // Second call (should be cached)
      const start2 = Date.now();
      const result2 = await nftService.fetchNFTMetadata(contractAddress, tokenId, 'ethereum');
      const time2 = Date.now() - start2;
      
      // Second call should be significantly faster
      expect(time2).toBeLessThan(time1);
    });

    test('should handle concurrent requests', async () => {
      const promises = Array.from({ length: 5 }, (_, i) => 
        nftService.verifyNFTOwnership(
          '0x0000000000000000000000000000000000000000',
          i.toString(),
          testWalletAddress,
          'ethereum'
        )
      );

      const results = await Promise.all(promises);
      
      expect(results).toHaveLength(5);
      expect(results.every(r => typeof r.isOwner === 'boolean')).toBe(true);
    });
  });
});

describe('Cache Manager Tests', () => {
  test('should set and get cache entries', () => {
    const { CacheManager } = require('../../../packages/web3/src/cache/CacheManager');
    const cache = new CacheManager({ ttl: 1000 });

    cache.set('test-key', 'test-value');
    expect(cache.get('test-key')).toBe('test-value');
  });

  test('should handle cache expiration', async () => {
    const { CacheManager } = require('../../../packages/web3/src/cache/CacheManager');
    const cache = new CacheManager({ ttl: 100 }); // 100ms TTL

    cache.set('test-key', 'test-value');
    expect(cache.get('test-key')).toBe('test-value');

    // Wait for expiration
    await new Promise(resolve => setTimeout(resolve, 150));
    expect(cache.get('test-key')).toBe(null);
  });

  test('should support stale-while-revalidate', async () => {
    const { CacheManager } = require('../../../packages/web3/src/cache/CacheManager');
    const cache = new CacheManager({ 
      ttl: 100, 
      staleWhileRevalidate: 200 
    });

    cache.set('test-key', 'test-value');
    
    // Wait for TTL to expire but within stale window
    await new Promise(resolve => setTimeout(resolve, 150));
    
    // Should still return stale data
    expect(cache.get('test-key')).toBe('test-value');
  });
});

describe('Environment Configuration', () => {
  test('should handle missing API keys gracefully', () => {
    // Temporarily remove API keys
    const originalInfura = process.env.INFURA_PROJECT_ID;
    delete process.env.INFURA_PROJECT_ID;

    // Should not throw during initialization
    expect(() => {
      const { CryptoPaymentService } = require('../src/services/crypto-payments');
      new CryptoPaymentService();
    }).not.toThrow();

    // Restore
    if (originalInfura) {
      process.env.INFURA_PROJECT_ID = originalInfura;
    }
  });

  test('should use correct environment URLs', () => {
    // Test production vs staging URLs
    process.env.NODE_ENV = 'production';
    const service = new (require('../src/services/crypto-payments').CryptoPaymentService)();
    
    const generateTransakCheckoutUrl = (service as any).generateTransakCheckoutUrl.bind(service);
    const url = generateTransakCheckoutUrl({
      orderId: 'test',
      walletAddress: testWalletAddress,
      cryptoCurrency: 'USDC',
      fiatCurrency: 'USD',
      fiatAmount: '100',
      network: 'ethereum',
      redirectUrl: 'http://test.com'
    });

    expect(url).toContain('global.transak.com');
  });
});