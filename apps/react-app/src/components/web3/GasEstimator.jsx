import React, { useState, useEffect, useCallback } from 'react';
import { 
  Zap, 
  Clock, 
  TrendingUp, 
  Info, 
  RefreshCw, 
  AlertTriangle,
  DollarSign,
  Fuel,
  Timer
} from 'lucide-react';
import Button from '../ui/Button';
import { formatTokenAmount, formatUSDValue } from '../../utils/web3Utils';
import { getErrorMessage } from '../../utils/errorUtils'

const GAS_PRESETS = {
  SLOW: {
    id: 'slow',
    name: 'Slow',
    icon: <Clock style={{
  height: '16px',
  width: '16px'
}} />,
    description: 'Lower cost, longer wait time',
    multiplier: 0.9,
    estimatedTime: '5-10 minutes',
    savings: '10-20%',
    color: 'text-muted'
  },
  STANDARD: {
    id: 'standard',
    name: 'Standard',
    icon: <Zap style={{
  height: '16px',
  width: '16px'
}} />,
    description: 'Balanced cost and speed',
    multiplier: 1.0,
    estimatedTime: '2-5 minutes',
    savings: null,
    color: 'text-accent-primary'
  },
  FAST: {
    id: 'fast',
    name: 'Fast',
    icon: <TrendingUp style={{
  height: '16px',
  width: '16px'
}} />,
    description: 'Higher cost, faster confirmation',
    multiplier: 1.25,
    estimatedTime: '30 seconds - 2 minutes',
    savings: null,
    color: 'text-warning'
  },
  CUSTOM: {
    id: 'custom',
    name: 'Custom',
    icon: <Fuel style={{
  height: '16px',
  width: '16px'
}} />,
    description: 'Set your own gas price',
    multiplier: 1.0,
    estimatedTime: 'Variable',
    savings: null,
    color: 'text-info'
  }
};

function GasEstimator({
  transaction,
  onGasEstimateChange,
  initialPreset = 'standard',
  showAdvanced = false,
  className = ''
}) {
  const [selectedPreset, setSelectedPreset] = useState(initialPreset);
  const [customGasPrice, setCustomGasPrice] = useState(25);
  const [customGasLimit, setCustomGasLimit] = useState(21000);
  const [gasData, setGasData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(showAdvanced);
  const [ethPrice, setEthPrice] = useState(2000); // Mock ETH price

  // Mock network conditions
  const [networkStatus, setNetworkStatus] = useState({
    congestion: 'medium', // low, medium, high
    avgBlockTime: 12,
    pendingTxs: 150000,
    baseFee: 15.5
  });

  useEffect(() => {
    estimateGas();
  }, [transaction]);

  useEffect(() => {
    if (gasData && selectedPreset !== 'custom') {
      const preset = GAS_PRESETS[selectedPreset.toUpperCase()];
      const adjustedGasPrice = gasData.standardGasPrice * preset.multiplier;
      updateGasEstimate(adjustedGasPrice, gasData.gasLimit);
    }
  }, [selectedPreset, gasData]);

  useEffect(() => {
    if (selectedPreset === 'custom') {
      updateGasEstimate(customGasPrice, customGasLimit);
    }
  }, [customGasPrice, customGasLimit, selectedPreset]);

  const estimateGas = async () => {
    if (!transaction) return;

    try {
      setIsLoading(true);
      setError(null);

      // Simulate gas estimation API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Mock gas estimation based on transaction type
      let gasLimit = 21000; // Standard transfer
      
      switch (transaction.type) {
        case 'transfer':
        case 'send':
          gasLimit = 21000;
          break;
        case 'contract':
        case 'swap':
          gasLimit = 150000;
          break;
        case 'nft':
          gasLimit = 85000;
          break;
        case 'stake':
          gasLimit = 200000;
          break;
        default:
          gasLimit = 50000;
      }

      // Add complexity multiplier
      if (transaction.data || transaction.contractInteraction) {
        gasLimit *= 1.5;
      }

      const mockGasData = {
        gasLimit: Math.floor(gasLimit),
        slowGasPrice: 18,
        standardGasPrice: 25,
        fastGasPrice: 35,
        baseFee: networkStatus.baseFee,
        priorityFee: 2.5,
        networkCongestion: networkStatus.congestion,
        estimatedTimes: {
          slow: '5-10 minutes',
          standard: '2-5 minutes',
          fast: '30 seconds - 2 minutes'
        }
      };

      setGasData(mockGasData);
      
      // Set initial gas estimate
      updateGasEstimate(mockGasData.standardGasPrice, mockGasData.gasLimit);

    } catch (err) {
      setError('Failed to estimate gas. Please try again.');
      console.error('Gas estimation error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const updateGasEstimate = useCallback((gasPrice, gasLimit) => {
    const gasFee = (gasPrice * gasLimit) / 1e9; // Convert to ETH
    const usdFee = gasFee * ethPrice;
    
    const estimate = {
      gasPrice: gasPrice,
      gasLimit: gasLimit,
      fee: gasFee.toFixed(6),
      feeUSD: usdFee,
      maxFee: (gasFee * 1.2).toFixed(6), // 20% buffer for price volatility
      preset: selectedPreset,
      estimatedTime: GAS_PRESETS[selectedPreset.toUpperCase()]?.estimatedTime || 'Unknown'
    };

    if (onGasEstimateChange) {
      onGasEstimateChange(estimate);
    }
  }, [selectedPreset, ethPrice, onGasEstimateChange]);

  const handlePresetSelect = (presetId) => {
    setSelectedPreset(presetId);
    setError(null);
  };

  const refreshGasEstimate = () => {
    estimateGas();
  };

  const getNetworkStatusColor = () => {
    switch (networkStatus.congestion) {
      case 'low':
        return 'text-success';
      case 'medium':
        return 'text-warning';
      case 'high':
        return 'text-error';
      default:
        return 'text-muted';
    }
  };

  const getNetworkStatusIcon = () => {
    switch (networkStatus.congestion) {
      case 'low':
        return '🟢';
      case 'medium':
        return '🟡';
      case 'high':
        return '🔴';
      default:
        return '⚪';
    }
  };

  if (isLoading) {
    return (
      <div style={{
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '12px',
  padding: '16px'
}}>
        <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '12px'
}}>
          <RefreshCw style={{
  height: '20px',
  width: '20px'
}} />
          <h4 style={{
  fontWeight: '600'
}}>Estimating Gas Fees...</h4>
        </div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} style={{
  borderRadius: '12px',
  padding: '12px'
}}>
              <div style={{
  height: '16px',
  borderRadius: '4px'
}} />
              <div style={{
  height: '12px',
  borderRadius: '4px'
}} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '12px',
  padding: '16px'
}}>
        <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '12px'
}}>
          <AlertTriangle style={{
  height: '20px',
  width: '20px'
}} />
          <h4 style={{
  fontWeight: '600'
}}>Gas Estimation Failed</h4>
        </div>
        <p className="text-sm text-error/80 mb-4">{typeof error === "string" ? error : getErrorMessage(error, "")}</p>
        <Button onClick={refreshGasEstimate} size="sm" variant="secondary">
          <RefreshCw style={{
  height: '12px',
  width: '12px'
}} />
          Try Again
        </Button>
      </div>
    );
  }

  if (!gasData) return null;

  return (
    <div style={{
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '12px',
  padding: '16px'
}}>
      {/* Header */}
      <div style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between'
}}>
        <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '12px'
}}>
          <Fuel style={{
  height: '20px',
  width: '20px'
}} />
          <h4 style={{
  fontWeight: '600'
}}>Gas Fee Options</h4>
        </div>
        <button
          onClick={refreshGasEstimate}
          className="text-muted hover:text-primary transition-colors"
          title="Refresh gas estimates"
        >
          <RefreshCw style={{
  height: '16px',
  width: '16px'
}} />
        </button>
      </div>

      {/* Network Status */}
      <div style={{
  borderRadius: '12px',
  padding: '12px'
}}>
        <div style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between'
}}>
          <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
}}>
            <span className="text-sm">{getNetworkStatusIcon()}</span>
            <span className="text-muted">Network:</span>
            <span style={{
  fontWeight: '500'
}}>
              {networkStatus.congestion.charAt(0).toUpperCase() + networkStatus.congestion.slice(1)} congestion
            </span>
          </div>
          <div className="text-muted">
            Base: {networkStatus.baseFee} gwei
          </div>
        </div>
        {networkStatus.congestion === 'high' && (
          <div className="mt-2 text-xs text-warning">
            <Info style={{
  height: '12px',
  width: '12px'
}} />
            High network activity may cause delays
          </div>
        )}
      </div>

      {/* Gas Preset Options */}
      <div className="space-y-2 mb-4">
        {Object.values(GAS_PRESETS).map((preset) => {
          const isSelected = selectedPreset === preset.id;
          const gasPrice = preset.id === 'custom' ? customGasPrice : 
                          gasData.standardGasPrice * preset.multiplier;
          const fee = (gasPrice * gasData.gasLimit) / 1e9;
          const feeUSD = fee * ethPrice;

          return (
            <button
              key={preset.id}
              onClick={() => handlePresetSelect(preset.id)}
              style={{
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '12px',
  borderRadius: '12px',
  border: '1px solid rgba(255, 255, 255, 0.1)'
}}
            >
              <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '12px'
}}>
                <div className={preset.color}>
                  {preset.icon}
                </div>
                <div style={{
  textAlign: 'left'
}}>
                  <div style={{
  fontWeight: '500'
}}>{preset.name}</div>
                  <div className="text-xs text-muted">{preset.description}</div>
                </div>
              </div>
              <div style={{
  textAlign: 'right'
}}>
                <div style={{
  fontWeight: '500'
}}>
                  {fee.toFixed(6)} ETH
                </div>
                <div className="text-xs text-muted">
                  {formatUSDValue(feeUSD)}
                </div>
                {preset.savings && (
                  <div className="text-xs text-success">
                    Save {preset.savings}
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Custom Gas Inputs */}
      {selectedPreset === 'custom' && (
        <div style={{
  borderRadius: '12px',
  padding: '16px'
}}>
          <h5 style={{
  fontWeight: '500'
}}>Custom Gas Settings</h5>
          
          <div style={{
  display: 'grid',
  gap: '12px'
}}>
            <div>
              <label style={{
  display: 'block'
}}>Gas Price (gwei)</label>
              <input
                type="number"
                value={customGasPrice}
                onChange={(e) => setCustomGasPrice(Number(e.target.value))}
                min="1"
                step="0.1"
                style={{
  width: '100%',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '4px',
  paddingLeft: '12px',
  paddingRight: '12px',
  paddingTop: '8px',
  paddingBottom: '8px'
}}
              />
            </div>
            <div>
              <label style={{
  display: 'block'
}}>Gas Limit</label>
              <input
                type="number"
                value={customGasLimit}
                onChange={(e) => setCustomGasLimit(Number(e.target.value))}
                min="21000"
                step="1000"
                style={{
  width: '100%',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '4px',
  paddingLeft: '12px',
  paddingRight: '12px',
  paddingTop: '8px',
  paddingBottom: '8px'
}}
              />
            </div>
          </div>

          <div className="text-xs text-muted">
            <Info style={{
  height: '12px',
  width: '12px'
}} />
            Setting gas too low may cause transaction failure
          </div>
        </div>
      )}

      {/* Advanced Options Toggle */}
      <button
        onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
        style={{
  width: '100%'
}}
      >
        {showAdvancedOptions ? 'Hide' : 'Show'} Advanced Options
      </button>

      {/* Advanced Gas Information */}
      {showAdvancedOptions && (
        <div style={{
  borderRadius: '12px',
  padding: '16px'
}}>
          <div style={{
  display: 'grid',
  gap: '16px'
}}>
            <div>
              <span className="text-muted">Base Fee:</span>
              <div className="font-mono">{gasData.baseFee} gwei</div>
            </div>
            <div>
              <span className="text-muted">Priority Fee:</span>
              <div className="font-mono">{gasData.priorityFee} gwei</div>
            </div>
            <div>
              <span className="text-muted">Gas Limit:</span>
              <div className="font-mono">{gasData.gasLimit.toLocaleString()}</div>
            </div>
            <div>
              <span className="text-muted">Block Time:</span>
              <div className="font-mono">{networkStatus.avgBlockTime}s</div>
            </div>
          </div>

          <div className="border-t border-muted/20 pt-3">
            <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
}}>
              <Timer style={{
  height: '12px',
  width: '12px'
}} />
              Estimated Confirmation Times
            </div>
            <div className="space-y-1 text-xs">
              <div style={{
  display: 'flex',
  justifyContent: 'space-between'
}}>
                <span>Slow (90% confidence):</span>
                <span>{gasData.estimatedTimes.slow}</span>
              </div>
              <div style={{
  display: 'flex',
  justifyContent: 'space-between'
}}>
                <span>Standard (95% confidence):</span>
                <span>{gasData.estimatedTimes.standard}</span>
              </div>
              <div style={{
  display: 'flex',
  justifyContent: 'space-between'
}}>
                <span>Fast (99% confidence):</span>
                <span>{gasData.estimatedTimes.fast}</span>
              </div>
            </div>
          </div>

          <div className="text-xs text-muted">
            <Info style={{
  height: '12px',
  width: '12px'
}} />
            Gas prices are dynamic and may change before transaction confirmation
          </div>
        </div>
      )}

      {/* Gas Savings Tip */}
      {networkStatus.congestion === 'high' && (
        <div style={{
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '12px',
  padding: '12px'
}}>
          <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
}}>
            <DollarSign style={{
  height: '16px',
  width: '16px'
}} />
            <span style={{
  fontWeight: '500'
}}>Gas Savings Tip</span>
          </div>
          <p className="text-xs text-warning/80 mt-1">
            Network congestion is high. Consider waiting for off-peak hours or using the slow option to save on fees.
          </p>
        </div>
      )}
    </div>
  );
}

// Compact gas fee display component
export function GasFeeDisplay({ gasEstimate, showDetails = false, className = '' }) {
  if (!gasEstimate) return null;

  return (
    <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
}}>
      <Fuel style={{
  height: '16px',
  width: '16px'
}} />
      <span className="text-muted">Gas:</span>
      <span style={{
  fontWeight: '500'
}}>
        {gasEstimate.fee} ETH
      </span>
      {showDetails && gasEstimate.feeUSD && (
        <span className="text-muted">
          (≈{formatUSDValue(gasEstimate.feeUSD)})
        </span>
      )}
      <span className="text-xs text-muted">
        {gasEstimate.preset}
      </span>
    </div>
  );
}



export default GasEstimator;