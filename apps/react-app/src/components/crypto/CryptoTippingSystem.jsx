import React, { useState, useEffect } from 'react';
import { Card, Button, Badge, Progress, Dialog, Select, Textarea } from '@radix-ui/themes';
import { 
  Gift, Heart, Coffee, Star, Zap, DollarSign,
  Send, Bell, CheckCircle, AlertCircle, Copy,
  TrendingUp, Users, Clock, ExternalLink,
  Coins, Crown, Award, Target, Plus
} from 'lucide-react';
import { cryptoPaymentService, PAYMENT_TYPES } from '../../services/cryptoPaymentService.js';
import { walletManager } from '../../lib/web3/WalletManager.js';

// Predefined tip amounts and messages
const TIP_PRESETS = {
  SMALL: {
    amounts: { CRYB: '5', ETH: '0.001', USDC: '2' },
    emoji: '☕',
    label: 'Coffee',
    message: 'Thanks for the great content!'
  },
  MEDIUM: {
    amounts: { CRYB: '25', ETH: '0.01', USDC: '10' },
    emoji: '🍕',
    label: 'Pizza',
    message: 'Love your work, keep it up!'
  },
  LARGE: {
    amounts: { CRYB: '100', ETH: '0.05', USDC: '50' },
    emoji: '🚀',
    label: 'Rocket',
    message: 'This content is amazing!'
  },
  CUSTOM: {
    amounts: { CRYB: '', ETH: '', USDC: '' },
    emoji: '💎',
    label: 'Custom',
    message: ''
  }
};

// Quick reaction tips
const REACTION_TIPS = [
  { emoji: '❤️', amount: '1', message: 'Love this!' },
  { emoji: '🔥', amount: '2', message: 'Fire content!' },
  { emoji: '💯', amount: '5', message: 'Perfect!' },
  { emoji: '🚀', amount: '10', message: 'To the moon!' },
  { emoji: '💎', amount: '25', message: 'Diamond hands!' }
];

const CryptoTippingSystem = ({ 
  recipientAddress, 
  recipientName = 'User',
  contentId = null,
  contentType = 'post',
  embedded = false 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState('SMALL');
  const [selectedToken, setSelectedToken] = useState('CRYB');
  const [customAmount, setCustomAmount] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [tipHistory, setTipHistory] = useState([]);
  const [totalTipped, setTotalTipped] = useState(0);
  const [cryptoPrices, setCryptoPrices] = useState({});
  const [quickTipSent, setQuickTipSent] = useState(null);
  const [notifications, setNotifications] = useState([]);

  // Load tip history and prices
  useEffect(() => {
    loadTipHistory();
    loadCryptoPrices();
    
    // Listen for tip notifications
    const handleTipNotification = (event) => {
      if (event.detail.type === PAYMENT_TYPES.TIP) {
        addNotification(event.detail);
      }
    };

    window.addEventListener('cryptoPaymentUpdate', handleTipNotification);
    return () => window.removeEventListener('cryptoPaymentUpdate', handleTipNotification);
  }, [recipientAddress]);

  const loadTipHistory = () => {
    const history = cryptoPaymentService.getTransactionsByType(PAYMENT_TYPES.TIP)
      .filter(tip => tip.recipient === recipientAddress)
      .slice(0, 10);
    
    setTipHistory(history);
    
    // Calculate total tipped
    const total = history.reduce((sum, tip) => {
      const amount = parseFloat(tip.amount) || 0;
      const price = cryptoPrices[tip.token] || 1;
      return sum + (amount * price);
    }, 0);
    
    setTotalTipped(total);
  };

  const loadCryptoPrices = async () => {
    try {
      const prices = await cryptoPaymentService.getCryptoPrices();
      setCryptoPrices(prices);
    } catch (error) {
      console.error('Failed to load crypto prices:', error);
    }
  };

  const addNotification = (tip) => {
    const notification = {
      id: Date.now(),
      type: 'tip_received',
      amount: tip.amount,
      token: tip.token,
      sender: tip.sender,
      message: tip.metadata?.message || '',
      timestamp: Date.now()
    };
    
    setNotifications(prev => [notification, ...prev.slice(0, 4)]);
    
    // Auto-remove notification after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
    }, 5000);
  };

  const handleQuickTip = async (reaction) => {
    if (!walletManager.isConnected) {
      await walletManager.connect();
      return;
    }

    try {
      setIsProcessing(true);
      
      const result = await cryptoPaymentService.tipUser(
        recipientAddress,
        reaction.amount,
        selectedToken,
        reaction.message
      );

      setQuickTipSent(reaction.emoji);
      setTimeout(() => setQuickTipSent(null), 2000);
      
      loadTipHistory();
    } catch (error) {
      console.error('Quick tip error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCustomTip = async () => {
    if (!walletManager.isConnected) {
      await walletManager.connect();
      return;
    }

    try {
      setIsProcessing(true);
      
      const preset = TIP_PRESETS[selectedPreset];
      const amount = selectedPreset === 'CUSTOM' 
        ? customAmount 
        : preset.amounts[selectedToken];
      const message = selectedPreset === 'CUSTOM' 
        ? customMessage 
        : preset.message;

      const result = await cryptoPaymentService.tipUser(
        recipientAddress,
        amount,
        selectedToken,
        message
      );

      setIsOpen(false);
      setCustomAmount('');
      setCustomMessage('');
      loadTipHistory();
    } catch (error) {
      console.error('Custom tip error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const formatAmount = (amount, token) => {
    const num = parseFloat(amount);
    return `${num.toLocaleString()} ${token}`;
  };

  const formatUSDValue = (amount, token) => {
    const price = cryptoPrices[token] || 0;
    const usdValue = parseFloat(amount) * price;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(usdValue);
  };

  // Embedded Quick Actions
  if (embedded) {
    return (
      <div style={{
  display: 'flex',
  alignItems: 'center'
}}>
        {/* Quick Reaction Tips */}
        <div style={{
  display: 'flex'
}}>
          {REACTION_TIPS.slice(0, 3).map((reaction, index) => (
            <Button
              key={index}
              variant="ghost"
              size="sm"
              onClick={() => handleQuickTip(reaction)}
              disabled={isProcessing}
              className={`hover:bg-yellow-50 ${
                quickTipSent === reaction.emoji ? 'bg-yellow-100 animate-pulse' : ''
              }`}
            >
              <span className="text-lg">{reaction.emoji}</span>
              <span className="ml-1 text-xs">{reaction.amount}</span>
            </Button>
          ))}
        </div>

        {/* Tip Button */}
        <Button
          size="sm"
          onClick={() => setIsOpen(true)}
          disabled={isProcessing}
        >
          <Gift style={{
  width: '16px',
  height: '16px'
}} />
          Tip
        </Button>

        {/* Tip Modal */}
        <TipModal />
        
        {/* Notifications */}
        <TipNotifications />
      </div>
    );
  }

  // Full Tipping Interface
  const TipModal = () => (
    <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
      <Dialog.Content className="max-w-md">
        <Dialog.Title style={{
  fontWeight: '600'
}}>
          Send Tip to {recipientName}
        </Dialog.Title>

        <div className="space-y-4">
          {/* Preset Selection */}
          <div>
            <label style={{
  display: 'block',
  fontWeight: '500'
}}>Choose Amount</label>
            <div style={{
  display: 'grid',
  gap: '8px'
}}>
              {Object.entries(TIP_PRESETS).map(([key, preset]) => (
                <Button
                  key={key}
                  variant={selectedPreset === key ? 'solid' : 'outline'}
                  onClick={() => setSelectedPreset(key)}
                  style={{
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: '12px',
  height: '64px'
}}
                >
                  <span className="text-lg">{preset.emoji}</span>
                  <span className="text-xs">{preset.label}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Token Selection */}
          <div>
            <label style={{
  display: 'block',
  fontWeight: '500'
}}>Token</label>
            <Select.Root value={selectedToken} onValueChange={setSelectedToken}>
              <Select.Trigger style={{
  width: '100%'
}}>
                <Select.Value />
              </Select.Trigger>
              <Select.Content>
                <Select.Item value="CRYB">CRYB</Select.Item>
                <Select.Item value="ETH">ETH</Select.Item>
                <Select.Item value="USDC">USDC</Select.Item>
              </Select.Content>
            </Select.Root>
          </div>

          {/* Amount Display/Input */}
          <div>
            <label style={{
  display: 'block',
  fontWeight: '500'
}}>Amount</label>
            {selectedPreset === 'CUSTOM' ? (
              <input
                type="number"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                style={{
  width: '100%',
  padding: '12px',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '12px'
}}
                placeholder={`0.00 ${selectedToken}`}
                step="0.01"
                min="0"
              />
            ) : (
              <div style={{
  background: 'rgba(22, 27, 34, 0.6)',
  padding: '12px',
  borderRadius: '12px'
}}>
                <p style={{
  fontWeight: '600'
}}>
                  {formatAmount(TIP_PRESETS[selectedPreset].amounts[selectedToken], selectedToken)}
                </p>
                <p style={{
  color: '#c9d1d9'
}}>
                  ≈ {formatUSDValue(TIP_PRESETS[selectedPreset].amounts[selectedToken], selectedToken)}
                </p>
              </div>
            )}
          </div>

          {/* Message */}
          <div>
            <label style={{
  display: 'block',
  fontWeight: '500'
}}>Message (Optional)</label>
            {selectedPreset === 'CUSTOM' ? (
              <Textarea
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder="Add a personal message..."
                rows={3}
                maxLength={200}
              />
            ) : (
              <div style={{
  background: 'rgba(22, 27, 34, 0.6)',
  padding: '12px',
  borderRadius: '12px'
}}>
                <p className="text-sm italic">"{TIP_PRESETS[selectedPreset].message}"</p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div style={{
  display: 'flex',
  justifyContent: 'flex-end'
}}>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCustomTip}
              disabled={isProcessing || (!customAmount && selectedPreset === 'CUSTOM')}
            >
              {isProcessing ? (
                <>
                  <div style={{
  borderRadius: '50%',
  height: '16px',
  width: '16px'
}}></div>
                  Sending...
                </>
              ) : (
                <>
                  <Send style={{
  width: '16px',
  height: '16px'
}} />
                  Send Tip
                </>
              )}
            </Button>
          </div>
        </div>
      </Dialog.Content>
    </Dialog.Root>
  );

  // Tip Notifications Component
  const TipNotifications = () => (
    <div style={{
  position: 'fixed'
}}>
      {notifications.map((notification) => (
        <Card key={notification.id} style={{
  padding: '12px'
}}>
          <div style={{
  display: 'flex',
  alignItems: 'center'
}}>
            <Gift style={{
  width: '16px',
  height: '16px'
}} />
            <div style={{
  flex: '1'
}}>
              <p style={{
  fontWeight: '500'
}}>
                Tip Received!
              </p>
              <p className="text-xs text-green-600">
                {formatAmount(notification.amount, notification.token)} from {notification.sender.slice(0, 6)}...
              </p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card style={{
  padding: '24px'
}}>
        <div style={{
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start'
}}>
          <div>
            <h2 style={{
  fontWeight: 'bold'
}}>Crypto Tipping</h2>
            <p style={{
  color: '#c9d1d9'
}}>Support creators with cryptocurrency tips</p>
          </div>
          
          <div style={{
  textAlign: 'right'
}}>
            <p style={{
  color: '#c9d1d9'
}}>Total Tips Sent</p>
            <p style={{
  fontWeight: '600'
}}>{formatUSDValue(totalTipped.toString(), 'USD')}</p>
          </div>
        </div>
      </Card>

      {/* Quick Tip Actions */}
      <Card style={{
  padding: '24px'
}}>
        <h3 style={{
  fontWeight: '600'
}}>Quick Tips</h3>
        <div style={{
  display: 'grid',
  gap: '8px'
}}>
          {REACTION_TIPS.map((reaction, index) => (
            <Button
              key={index}
              variant="outline"
              onClick={() => handleQuickTip(reaction)}
              disabled={isProcessing}
              style={{
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  height: '80px'
}}
            >
              <span className="text-2xl">{reaction.emoji}</span>
              <div style={{
  textAlign: 'center'
}}>
                <p style={{
  fontWeight: '500'
}}>{reaction.amount} CRYB</p>
                <p style={{
  color: '#c9d1d9'
}}>
                  {formatUSDValue(reaction.amount, 'CRYB')}
                </p>
              </div>
            </Button>
          ))}
        </div>
      </Card>

      {/* Custom Tip */}
      <Card style={{
  padding: '24px'
}}>
        <div style={{
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center'
}}>
          <h3 style={{
  fontWeight: '600'
}}>Custom Tip</h3>
          <Button onClick={() => setIsOpen(true)}>
            <Plus style={{
  width: '16px',
  height: '16px'
}} />
            Send Custom Tip
          </Button>
        </div>
        
        <p style={{
  color: '#c9d1d9'
}}>
          Create a personalized tip with custom amount and message
        </p>
      </Card>

      {/* Tip Statistics */}
      <Card style={{
  padding: '24px'
}}>
        <h3 style={{
  fontWeight: '600'
}}>Tipping Statistics</h3>
        <div style={{
  display: 'grid',
  gap: '16px'
}}>
          <div style={{
  textAlign: 'center'
}}>
            <div style={{
  fontWeight: 'bold'
}}>{tipHistory.length}</div>
            <div style={{
  color: '#c9d1d9'
}}>Tips Sent</div>
          </div>
          <div style={{
  textAlign: 'center'
}}>
            <div style={{
  fontWeight: 'bold'
}}>{formatUSDValue(totalTipped.toString(), 'USD')}</div>
            <div style={{
  color: '#c9d1d9'
}}>Total Value</div>
          </div>
          <div style={{
  textAlign: 'center'
}}>
            <div style={{
  fontWeight: 'bold'
}}>
              {tipHistory.length > 0 ? formatUSDValue((totalTipped / tipHistory.length).toString(), 'USD') : '$0.00'}
            </div>
            <div style={{
  color: '#c9d1d9'
}}>Average Tip</div>
          </div>
        </div>
      </Card>

      {/* Recent Tips */}
      <Card style={{
  padding: '24px'
}}>
        <h3 style={{
  fontWeight: '600'
}}>Recent Tips</h3>
        {tipHistory.length > 0 ? (
          <div className="space-y-3">
            {tipHistory.slice(0, 5).map((tip, index) => (
              <div key={index} style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '12px',
  background: 'rgba(22, 27, 34, 0.6)',
  borderRadius: '12px'
}}>
                <div style={{
  display: 'flex',
  alignItems: 'center'
}}>
                  <Gift style={{
  width: '16px',
  height: '16px'
}} />
                  <div>
                    <p style={{
  fontWeight: '500'
}}>
                      {formatAmount(tip.amount, tip.token)}
                    </p>
                    <p style={{
  color: '#c9d1d9'
}}>
                      {tip.metadata?.message || 'No message'}
                    </p>
                  </div>
                </div>
                
                <div style={{
  textAlign: 'right'
}}>
                  <p style={{
  fontWeight: '500'
}}>
                    {formatUSDValue(tip.amount, tip.token)}
                  </p>
                  <p style={{
  color: '#c9d1d9'
}}>
                    {new Date(tip.timestamp).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{
  textAlign: 'center',
  paddingTop: '32px',
  paddingBottom: '32px'
}}>
            <Gift style={{
  width: '48px',
  height: '48px',
  color: '#c9d1d9'
}} />
            <p style={{
  color: '#c9d1d9'
}}>No tips sent yet</p>
            <p style={{
  color: '#c9d1d9'
}}>Start supporting creators with your first tip!</p>
          </div>
        )}
      </Card>

      {/* Tip Modal */}
      <TipModal />
      
      {/* Notifications */}
      <TipNotifications />

      <style jsx>{`
        @keyframes slide-in-right {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};




export default TIP_PRESETS
