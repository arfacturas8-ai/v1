import React, { useState, useEffect } from 'react';
import { Card, Button, Badge, Tabs, Dialog, Select, Progress } from '@radix-ui/themes';
import {
  CreditCard, Wallet, DollarSign, Zap, AlertTriangle,
  CheckCircle, Clock, ExternalLink, Copy, Info, X,
  Coins, Shield, TrendingUp, RefreshCw, ArrowRight
} from 'lucide-react';
import { cryptoPaymentService, SUBSCRIPTION_TIERS, PAYMENT_TYPES } from '../../services/cryptoPaymentService.js';
import { walletManager } from '../../lib/web3/WalletManager.js';
import { useResponsive } from '../../hooks/useResponsive';
import { getErrorMessage } from '../../utils/errorUtils';

const CryptoPaymentModal = ({
  isOpen,
  onClose,
  paymentType = PAYMENT_TYPES.TIP,
  recipientAddress = null,
  amount = null,
  metadata = {}
}) => {
  const { isMobile, isTablet } = useResponsive();
  const [step, setStep] = useState('method'); // method, details, processing, complete
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [paymentDetails, setPaymentDetails] = useState({
    amount: amount || '',
    currency: 'USD',
    crypto: 'ETH',
    message: '',
    tier: 'BASIC',
    duration: 'monthly'
  });
  const [availableMethods, setAvailableMethods] = useState([]);
  const [cryptoPrices, setCryptoPrices] = useState({});
  const [fees, setFees] = useState({ platformFee: 0, gatewayFee: 0, total: 0 });
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');
  const [transactionResult, setTransactionResult] = useState(null);
  const [error, setError] = useState('');

  // Load available payment methods
  useEffect(() => {
    if (isOpen) {
      const methods = cryptoPaymentService.getAvailablePaymentMethods();
      setAvailableMethods(methods);
      loadCryptoPrices();
    }
  }, [isOpen]);

  // Calculate fees when method or amount changes
  useEffect(() => {
    if (selectedMethod && paymentDetails.amount) {
      const calculatedFees = cryptoPaymentService.calculateFees(
        parseFloat(paymentDetails.amount),
        selectedMethod
      );
      setFees(calculatedFees);
    }
  }, [selectedMethod, paymentDetails.amount]);

  const loadCryptoPrices = async () => {
    try {
      const prices = await cryptoPaymentService.getCryptoPrices();
      setCryptoPrices(prices);
    } catch (error) {
      console.error('Failed to load crypto prices:', error);
    }
  };

  const handleMethodSelect = (method) => {
    setSelectedMethod(method);
    setError('');

    // Set default crypto for method
    if (method.type === 'fiat_to_crypto') {
      setPaymentDetails(prev => ({
        ...prev,
        crypto: method.supportedCryptos?.[0] || 'ETH'
      }));
    } else if (method.type === 'direct_crypto') {
      setPaymentDetails(prev => ({
        ...prev,
        crypto: method.token
      }));
    }
  };

  const handlePaymentDetailsChange = (field, value) => {
    setPaymentDetails(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validatePaymentDetails = () => {
    if (!paymentDetails.amount || parseFloat(paymentDetails.amount) <= 0) {
      setError('Please enter a valid amount');
      return false;
    }

    if (paymentType === PAYMENT_TYPES.TIP && !recipientAddress) {
      setError('Recipient address is required for tips');
      return false;
    }

    if (selectedMethod?.type === 'direct_crypto' && !walletManager.isConnected) {
      setError('Please connect your wallet for crypto payments');
      return false;
    }

    return true;
  };

  const processPayment = async () => {
    if (!validatePaymentDetails()) return;

    setIsProcessing(true);
    setProcessingStatus('Initiating payment...');
    setError('');

    try {
      let result;

      switch (selectedMethod.type) {
        case 'fiat_to_crypto':
          setProcessingStatus('Opening payment gateway...');
          if (selectedMethod.provider === 'transak') {
            result = await cryptoPaymentService.buyWithTransak(
              paymentDetails.amount,
              paymentDetails.currency,
              paymentDetails.crypto,
              walletManager.account
            );
          } else if (selectedMethod.provider === 'moonpay') {
            result = await cryptoPaymentService.buyWithMoonPay(
              paymentDetails.amount,
              paymentDetails.currency,
              paymentDetails.crypto,
              walletManager.account
            );
          }
          break;

        case 'direct_crypto':
          setProcessingStatus('Processing blockchain transaction...');

          if (paymentType === PAYMENT_TYPES.SUBSCRIPTION) {
            result = await cryptoPaymentService.subscribeToPremium(
              paymentDetails.tier,
              paymentDetails.duration,
              paymentDetails.crypto
            );
          } else if (paymentType === PAYMENT_TYPES.TIP) {
            result = await cryptoPaymentService.tipUser(
              recipientAddress,
              paymentDetails.amount,
              paymentDetails.crypto,
              paymentDetails.message
            );
          } else if (paymentType === PAYMENT_TYPES.NFT_PURCHASE) {
            result = await cryptoPaymentService.purchaseNFT(
              metadata.nftContract,
              metadata.tokenId,
              paymentDetails.amount,
              paymentDetails.crypto
            );
          } else {
            result = await cryptoPaymentService.payWithCrypto(
              paymentDetails.crypto,
              paymentDetails.amount,
              recipientAddress,
              paymentType,
              metadata
            );
          }
          break;

        default:
          throw new Error('Unsupported payment method');
      }

      setTransactionResult(result);
      setStep('complete');
      setProcessingStatus('Payment completed successfully!');
    } catch (error) {
      console.error('Payment processing error:', error);
      setError(error.message || 'Payment failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const resetModal = () => {
    setStep('method');
    setSelectedMethod(null);
    setPaymentDetails({
      amount: amount || '',
      currency: 'USD',
      crypto: 'ETH',
      message: '',
      tier: 'BASIC',
      duration: 'monthly'
    });
    setError('');
    setIsProcessing(false);
    setTransactionResult(null);
  };

  const formatCurrency = (amount, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const getCryptoAmount = () => {
    if (!paymentDetails.amount || !cryptoPrices[paymentDetails.crypto]) return 0;
    const usdAmount = selectedMethod?.type === 'fiat_to_crypto'
      ? parseFloat(paymentDetails.amount)
      : parseFloat(paymentDetails.amount) * cryptoPrices[paymentDetails.crypto];
    return (usdAmount / cryptoPrices[paymentDetails.crypto]).toFixed(6);
  };

  // Method Selection Step
  const MethodSelectionStep = () => (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="text-lg sm:text-xl font-bold text-primary">Choose Payment Method</h2>
        <p className="text-sm sm:text-base text-secondary">Select how you'd like to pay</p>
      </div>

      <div className="space-y-3">
        {availableMethods.map((method, index) => (
          <div
            key={index}
            className="card-interactive p-4 cursor-pointer"
            onClick={() => handleMethodSelect(method)}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                {method.type === 'fiat_to_crypto' ? (
                  <CreditCard className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0 text-brand-primary" />
                ) : (
                  <Wallet className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0 text-brand-primary" />
                )}

                <div className="min-w-0">
                  <p className="text-sm sm:text-base font-semibold text-primary truncate">{method.name}</p>
                  <p className="text-xs sm:text-sm text-secondary truncate">
                    Fee: {method.fees.fiat ? `$${method.fees.fiat} + ` : ''}
                    {(method.fees.percentage * 100).toFixed(1)}%
                  </p>
                </div>
              </div>

              {method.type === 'fiat_to_crypto' && (
                <Badge variant="outline">Fiat</Badge>
              )}
              {method.type === 'direct_crypto' && (
                <Badge color="green">{method.token}</Badge>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 sm:justify-end">
        <button
          className="btn-secondary w-full sm:w-auto min-h-[44px]"
          onClick={onClose}
        >
          Cancel
        </button>
        <button
          className="btn-primary w-full sm:w-auto min-h-[44px]"
          onClick={() => setStep('details')}
          disabled={!selectedMethod}
        >
          Continue
          <ArrowRight className="w-4 h-4 ml-2" />
        </button>
      </div>
    </div>
  );

  // Payment Details Step
  const PaymentDetailsStep = () => (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="text-lg sm:text-xl font-bold text-primary">Payment Details</h2>
        <p className="text-sm sm:text-base text-secondary">Enter the payment information</p>
      </div>

      {/* Amount Input */}
      <div>
        <label className="block text-sm sm:text-base font-medium text-primary mb-2">
          Amount {selectedMethod?.type === 'fiat_to_crypto' ? `(${paymentDetails.currency})` : `(${paymentDetails.crypto})`}
        </label>
        <div className="relative">
          <input
            type="number"
            value={paymentDetails.amount}
            onChange={(e) => handlePaymentDetailsChange('amount', e.target.value)}
            className="input-primary"
            placeholder="0.00"
            step="0.01"
            min="0"
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-secondary text-sm sm:text-base">
            {selectedMethod?.type === 'fiat_to_crypto' ? paymentDetails.currency : paymentDetails.crypto}
          </div>
        </div>

        {paymentDetails.amount && cryptoPrices[paymentDetails.crypto] && (
          <p className="mt-2 text-xs sm:text-sm text-secondary">
            ≈ {getCryptoAmount()} {paymentDetails.crypto}
            {selectedMethod?.type === 'fiat_to_crypto' && (
              <span> (${(parseFloat(paymentDetails.amount) * cryptoPrices[paymentDetails.crypto]).toFixed(2)} USD)</span>
            )}
          </p>
        )}
      </div>

      {/* Currency Selection for Fiat */}
      {selectedMethod?.type === 'fiat_to_crypto' && (
        <div>
          <label className="block text-sm sm:text-base font-medium text-primary mb-2">Fiat Currency</label>
          <Select.Root
            value={paymentDetails.currency}
            onValueChange={(value) => handlePaymentDetailsChange('currency', value)}
          >
            <Select.Trigger className="w-full min-h-[44px]">
              <Select.Value />
            </Select.Trigger>
            <Select.Content>
              {selectedMethod.supportedCurrencies?.map(currency => (
                <Select.Item key={currency} value={currency}>
                  {currency}
                </Select.Item>
              ))}
            </Select.Content>
          </Select.Root>
        </div>
      )}

      {/* Crypto Selection */}
      <div>
        <label className="block text-sm sm:text-base font-medium text-primary mb-2">Cryptocurrency</label>
        <Select.Root
          value={paymentDetails.crypto}
          onValueChange={(value) => handlePaymentDetailsChange('crypto', value)}
          disabled={selectedMethod?.type === 'direct_crypto'}
        >
          <Select.Trigger className="w-full min-h-[44px]">
            <Select.Value />
          </Select.Trigger>
          <Select.Content>
            {selectedMethod?.type === 'fiat_to_crypto'
              ? selectedMethod.supportedCryptos?.map(crypto => (
                  <Select.Item key={crypto} value={crypto}>
                    {crypto}
                  </Select.Item>
                ))
              : Object.keys(cryptoPrices).map(crypto => (
                  <Select.Item key={crypto} value={crypto}>
                    {crypto}
                  </Select.Item>
                ))
            }
          </Select.Content>
        </Select.Root>
      </div>

      {/* Subscription Tier Selection */}
      {paymentType === PAYMENT_TYPES.SUBSCRIPTION && (
        <>
          <div>
            <label className="block text-sm sm:text-base font-medium text-primary mb-2">Subscription Tier</label>
            <Select.Root
              value={paymentDetails.tier}
              onValueChange={(value) => handlePaymentDetailsChange('tier', value)}
            >
              <Select.Trigger className="w-full min-h-[44px]">
                <Select.Value />
              </Select.Trigger>
              <Select.Content>
                {Object.entries(SUBSCRIPTION_TIERS).map(([key, tier]) => (
                  <Select.Item key={key} value={key}>
                    {tier.name} - ${tier.monthlyPriceUSD}/month
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Root>
          </div>

          <div>
            <label className="block text-sm sm:text-base font-medium text-primary mb-2">Billing Period</label>
            <Select.Root
              value={paymentDetails.duration}
              onValueChange={(value) => handlePaymentDetailsChange('duration', value)}
            >
              <Select.Trigger className="w-full min-h-[44px]">
                <Select.Value />
              </Select.Trigger>
              <Select.Content>
                <Select.Item value="monthly">Monthly</Select.Item>
                <Select.Item value="yearly">Yearly (17% off)</Select.Item>
              </Select.Content>
            </Select.Root>
          </div>
        </>
      )}

      {/* Message for Tips */}
      {paymentType === PAYMENT_TYPES.TIP && (
        <div>
          <label className="block text-sm sm:text-base font-medium text-primary mb-2">Message (Optional)</label>
          <textarea
            value={paymentDetails.message}
            onChange={(e) => handlePaymentDetailsChange('message', e.target.value)}
            className="input-primary resize-none"
            placeholder="Add a message with your tip..."
            rows={3}
            maxLength={200}
          />
          <p className="mt-1 text-xs sm:text-sm text-secondary">
            {paymentDetails.message.length}/200 characters
          </p>
        </div>
      )}

      {/* Fee Breakdown */}
      {fees.total > 0 && (
        <div className="card bg-tertiary">
          <h3 className="text-sm sm:text-base font-semibold text-primary mb-3">Fee Breakdown</h3>
          <div className="space-y-1 text-xs sm:text-sm">
            <div className="flex justify-between text-primary">
              <span>Amount:</span>
              <span>{formatCurrency(parseFloat(paymentDetails.amount || 0))}</span>
            </div>
            {fees.gatewayFee > 0 && (
              <div className="flex justify-between text-secondary">
                <span>Gateway Fee:</span>
                <span>{formatCurrency(fees.gatewayFee)}</span>
              </div>
            )}
            {fees.platformFee > 0 && (
              <div className="flex justify-between text-secondary">
                <span>Platform Fee:</span>
                <span>{formatCurrency(fees.platformFee)}</span>
              </div>
            )}
            <hr className="my-2 border-subtle" />
            <div className="flex justify-between font-semibold text-primary">
              <span>Total:</span>
              <span>{formatCurrency(parseFloat(paymentDetails.amount || 0) + fees.total)}</span>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 p-3 sm:p-4 border border-error bg-error-light rounded-xl">
          <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-error flex-shrink-0" />
          <span className="text-xs sm:text-sm text-error-dark">{typeof error === "string" ? error : getErrorMessage(error, "")}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 sm:justify-between">
        <button
          className="btn-secondary w-full sm:w-auto min-h-[44px]"
          onClick={() => setStep('method')}
        >
          Back
        </button>
        <button
          className="btn-primary w-full sm:w-auto min-h-[44px]"
          onClick={processPayment}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              Pay {formatCurrency(parseFloat(paymentDetails.amount || 0) + fees.total)}
              <Zap className="w-4 h-4 ml-2" />
            </>
          )}
        </button>
      </div>
    </div>
  );

  // Processing Step
  const ProcessingStep = () => (
    <div className="text-center space-y-6 py-4">
      <div className="mx-auto w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-brand-primary/10 flex items-center justify-center">
        <RefreshCw className="w-8 h-8 sm:w-10 sm:h-10 text-brand-primary animate-spin" />
      </div>

      <div className="space-y-2">
        <h2 className="text-lg sm:text-xl font-bold text-primary">Processing Payment</h2>
        <p className="text-sm sm:text-base text-secondary">{processingStatus}</p>
      </div>

      {selectedMethod?.type === 'fiat_to_crypto' && (
        <div className="p-4 sm:p-4 bg-info-light border border-info rounded-xl">
          <div className="flex items-center gap-3">
            <Info className="w-4 h-4 sm:w-5 sm:h-5 text-info-dark flex-shrink-0" />
            <span className="text-xs sm:text-sm text-info-dark">
              You will be redirected to {selectedMethod.provider} to complete your payment
            </span>
          </div>
        </div>
      )}

      {selectedMethod?.type === 'direct_crypto' && (
        <div className="p-4 sm:p-4 bg-warning-light border border-warning rounded-xl">
          <div className="flex items-center gap-3">
            <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-warning-dark flex-shrink-0" />
            <span className="text-xs sm:text-sm text-warning-dark">
              Please confirm the transaction in your wallet
            </span>
          </div>
        </div>
      )}
    </div>
  );

  // Complete Step
  const CompleteStep = () => (
    <div className="text-center space-y-6 py-4">
      <div className="mx-auto w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-success-light flex items-center justify-center">
        <CheckCircle className="w-8 h-8 sm:w-10 sm:h-10 text-success" />
      </div>

      <div className="space-y-2">
        <h2 className="text-lg sm:text-xl font-bold text-primary">Payment Successful!</h2>
        <p className="text-sm sm:text-base text-secondary">
          Your {paymentType} has been processed successfully
        </p>
      </div>

      {transactionResult?.transactionHash && (
        <div className="card text-left">
          <h3 className="text-sm sm:text-base font-semibold text-primary mb-3">Transaction Details</h3>
          <div className="space-y-2 text-xs sm:text-sm">
            <div className="flex items-center justify-between gap-2">
              <span className="text-secondary">Transaction Hash:</span>
              <div className="flex items-center gap-1">
                <span className="font-mono text-xs text-primary truncate max-w-[120px] sm:max-w-none">
                  {transactionResult.transactionHash.slice(0, 10)}...{transactionResult.transactionHash.slice(-8)}
                </span>
                <button
                  className="btn-ghost p-1 min-h-[32px] min-w-[32px]"
                  onClick={() => navigator.clipboard.writeText(transactionResult.transactionHash)}
                >
                  <Copy className="w-3 h-3" />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-secondary">Amount:</span>
              <span className="text-primary">{paymentDetails.amount} {paymentDetails.crypto}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-secondary">Status:</span>
              <Badge color="green">Confirmed</Badge>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2 sm:gap-3">
        <button
          className="btn-primary w-full min-h-[44px]"
          onClick={() => { onClose(); resetModal(); }}
        >
          Done
        </button>

        {transactionResult?.transactionHash && (
          <button
            className="btn-secondary w-full min-h-[44px]"
            onClick={() => window.open(`https://etherscan.io/tx/${transactionResult.transactionHash}`, '_blank')}
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            View on Explorer
          </button>
        )}
      </div>
    </div>
  );

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Content className="w-full max-w-md sm:max-w-lg rounded-2xl sm:rounded-3xl border border-subtle p-4 sm:p-6">
        <div className="flex justify-between items-center mb-4 sm:mb-6">
          <Dialog.Title className="text-lg sm:text-xl font-semibold text-primary">
            Crypto Payment
          </Dialog.Title>
          <button
            className="btn-ghost min-h-[44px] min-w-[44px]"
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Indicator */}
        <div className="mb-6">
          <div className="flex justify-between text-xs sm:text-sm text-secondary mb-2">
            <span className={step === 'method' ? 'text-brand-primary font-medium' : ''}>
              Method
            </span>
            <span className={step === 'details' ? 'text-brand-primary font-medium' : ''}>
              Details
            </span>
            <span className={step === 'processing' ? 'text-brand-primary font-medium' : ''}>
              Processing
            </span>
            <span className={step === 'complete' ? 'text-brand-primary font-medium' : ''}>
              Complete
            </span>
          </div>

          <Progress
            value={
              step === 'method' ? 25 :
              step === 'details' ? 50 :
              step === 'processing' ? 75 :
              step === 'complete' ? 100 : 0
            }
            className="h-2"
          />
        </div>

        {/* Step Content */}
        {step === 'method' && <MethodSelectionStep />}
        {step === 'details' && <PaymentDetailsStep />}
        {step === 'processing' && <ProcessingStep />}
        {step === 'complete' && <CompleteStep />}
      </Dialog.Content>
    </Dialog.Root>
  );
};




export default CryptoPaymentModal
