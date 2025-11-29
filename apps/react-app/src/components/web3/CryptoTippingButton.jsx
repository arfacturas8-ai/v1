import React, { useState } from 'react';
import { Coins, Heart, Gift } from 'lucide-react'
import Button from '../ui/Button';
import ComingSoonWrapper from './ComingSoonWrapper';

const TIP_AMOUNTS = [
  { amount: 0.001, label: '0.001 ETH', usd: 3.5 },
  { amount: 0.005, label: '0.005 ETH', usd: 17.5 },
  { amount: 0.01, label: '0.01 ETH', usd: 35 },
  { amount: 0.05, label: '0.05 ETH', usd: 175 }
];

function CryptoTippingButton({
  recipientAddress,
  recipientName,
  size = 'md',
  variant = 'primary',
  showAmount = true,
  showUSD = true,
  className = ''
}) {
  const [selectedAmount, setSelectedAmount] = useState(TIP_AMOUNTS[1]);
  const [isCustomAmount, setIsCustomAmount] = useState(false);
  const [customAmount, setCustomAmount] = useState('');
  const [showTipModal, setShowTipModal] = useState(false);
  const [isTipping, setIsTipping] = useState(false);

  const handleTip = async (amount) => {
    try {
      setIsTipping(true);
      
      // Simulate tipping process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      
      // Show success message
      alert(`Successfully tipped ${amount} ETH!`);
      setShowTipModal(false);
      
    } catch (error) {
      console.error('Tip failed:', error);
      alert('Tip failed. Please try again.');
    } finally {
      setIsTipping(false);
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'px-sm py-xs text-sm';
      case 'lg':
        return 'px-lg py-md text-lg';
      default:
        return 'px-md py-sm text-base';
    }
  };

  // The actual tipping functionality component
  const TippingContent = () => (
    <div style={{
  position: 'relative'
}}>
      <Button
        onClick={() => setShowTipModal(true)}
        className={`btn ${variant === 'secondary' ? 'btn-secondary' : 'btn-primary'} ${getSizeClasses()} ${className}`}
      >
        <Coins style={{
  height: '16px',
  width: '16px'
}} />
        Tip Crypto
        {showAmount && selectedAmount && (
          <span className="ml-sm">
            {selectedAmount.label}
            {showUSD && (
              <span className="text-xs opacity-75 ml-xs">
                (${selectedAmount.usd})
              </span>
            )}
          </span>
        )}
      </Button>

      {/* Tip Modal */}
      {showTipModal && (
        <div style={{
  position: 'fixed',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
}}>
          <div style={{
  borderRadius: '12px',
  width: '100%',
  overflow: 'auto'
}}>
            {/* Header */}
            <div className="p-lg border-b border-muted">
              <div style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between'
}}>
                <div style={{
  display: 'flex',
  alignItems: 'center'
}}>
                  <div style={{
  borderRadius: '50%'
}}>
                    <Gift style={{
  height: '20px',
  width: '20px'
}} />
                  </div>
                  <div>
                    <h3 style={{
  fontWeight: '600'
}}>Send Crypto Tip</h3>
                    {recipientName && (
                      <p className="text-sm text-muted">To: {recipientName}</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setShowTipModal(false)}
                  style={{
  borderRadius: '12px'
}}
                >
                  ×
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-lg space-y-lg">
              {/* Amount Selection */}
              <div>
                <label style={{
  display: 'block',
  fontWeight: '500'
}}>
                  Select Amount
                </label>
                <div style={{
  display: 'grid'
}}>
                  {TIP_AMOUNTS.map((tip) => (
                    <button
                      key={tip.amount}
                      onClick={() => {
                        setSelectedAmount(tip);
                        setIsCustomAmount(false);
                      }}
                      style={{
  borderRadius: '12px',
  border: '1px solid rgba(255, 255, 255, 0.1)'
}}
                    >
                      <div style={{
  fontWeight: '500'
}}>{tip.label}</div>
                      <div className="text-xs text-muted">${tip.usd}</div>
                    </button>
                  ))}
                </div>

                {/* Custom Amount */}
                <div>
                  <label style={{
  display: 'flex',
  alignItems: 'center'
}}>
                    <input
                      type="radio"
                      checked={isCustomAmount}
                      onChange={() => setIsCustomAmount(true)}
                      className="text-accent-primary"
                    />
                    <span className="text-sm">Custom Amount</span>
                  </label>
                  {isCustomAmount && (
                    <div style={{
  display: 'flex'
}}>
                      <input
                        type="number"
                        step="0.001"
                        placeholder="0.000"
                        value={customAmount}
                        onChange={(e) => setCustomAmount(e.target.value)}
                        style={{
  flex: '1',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '12px'
}}
                      />
                      <span style={{
  borderRadius: '12px'
}}>ETH</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Tip Message */}
              <div>
                <label style={{
  display: 'block',
  fontWeight: '500'
}}>
                  Message (Optional)
                </label>
                <textarea
                  placeholder="Say something nice..."
                  style={{
  width: '100%',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '12px'
}}
                  rows="3"
                />
              </div>

              {/* Summary */}
              <div style={{
  borderRadius: '12px'
}}>
                <div style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between'
}}>
                  <span className="text-muted">Amount:</span>
                  <span style={{
  fontWeight: '500'
}}>
                    {isCustomAmount ? `${customAmount || '0'} ETH` : selectedAmount.label}
                  </span>
                </div>
                <div style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between'
}}>
                  <span className="text-muted">USD Value:</span>
                  <span className="text-primary">
                    ${isCustomAmount ? (parseFloat(customAmount || 0) * 3500).toFixed(2) : selectedAmount.usd}
                  </span>
                </div>
                <div style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between'
}}>
                  <span className="text-muted">Gas Fee:</span>
                  <span className="text-primary">~$5.00</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div style={{
  display: 'flex'
}}>
              <Button
                onClick={() => setShowTipModal(false)}
                style={{
  flex: '1'
}}
              >
                Cancel
              </Button>
              <Button
                onClick={() => handleTip(isCustomAmount ? customAmount : selectedAmount.amount)}
                disabled={isTipping || (isCustomAmount && !customAmount)}
                style={{
  flex: '1'
}}
              >
                {isTipping ? (
                  <>
                    <div style={{
  width: '16px',
  height: '16px',
  borderRadius: '50%'
}}></div>
                    Sending...
                  </>
                ) : (
                  <>
                    <Heart style={{
  height: '16px',
  width: '16px'
}} />
                    Send Tip
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <ComingSoonWrapper
      feature="Crypto Tipping"
      title="Crypto Tips Coming Soon!"
      description="Show appreciation to creators by sending cryptocurrency tips directly from CRYB."
      expectedDate="Q2 2025"
      showPreview={true}
    >
      <TippingContent />
    </ComingSoonWrapper>
  );
}



export default CryptoTippingButton;