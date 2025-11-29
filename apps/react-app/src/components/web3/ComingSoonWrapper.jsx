import React from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { Sparkles, ArrowRight, Clock, Zap } from 'lucide-react';

function ComingSoonWrapper({
  children,
  isEnabled = false,
  feature = 'Web3 Feature',
  title,
  description,
  expectedDate = 'Q2 2025',
  onJoinWaitlist,
  showPreview = false
}) {
  // Check environment variable override for development
  const isDevelopment = import.meta.env.DEV;
  const enableWeb3Features = import.meta.env.VITE_ENABLE_WEB3_FEATURES === 'true';
  
  // Enable features if explicitly enabled, in development mode, or env var is set
  const shouldShowFeature = isEnabled || (isDevelopment && enableWeb3Features);

  if (shouldShowFeature) {
    return <>{children}</>;
  }

  // Show coming soon overlay
  return (
    <div style={{
  position: 'relative'
}}>
      {/* Optional preview in background (blurred) */}
      {showPreview && (
        <div style={{
  position: 'absolute'
}}>
          {children}
        </div>
      )}
      
      {/* Coming Soon Overlay */}
      <div style={{
  position: 'relative'
}}>
        <Card style={{
  border: '1px solid rgba(255, 255, 255, 0.1)'
}}>
          <div style={{
  textAlign: 'center'
}}>
            <div style={{
  display: 'flex',
  justifyContent: 'center'
}}>
              <div style={{
  position: 'relative'
}}>
                <div style={{
  borderRadius: '50%'
}}>
                  <Sparkles style={{
  height: '48px',
  width: '48px'
}} />
                </div>
                <div style={{
  position: 'absolute'
}}>
                  <span style={{
  display: 'inline-flex',
  alignItems: 'center',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '50%',
  fontWeight: '500'
}}>
                    <Clock style={{
  height: '12px',
  width: '12px'
}} />
                    Soon
                  </span>
                </div>
              </div>
            </div>
            
            <h3 style={{
  fontWeight: 'bold'
}}>
              {title || `${feature} Coming Soon`}
            </h3>
            
            <p style={{
  textAlign: 'center'
}}>
              {description || 
                `We're building amazing ${feature.toLowerCase()} functionality. Be the first to know when it's ready!`
              }
            </p>
          </div>
          
          <div style={{
  textAlign: 'center'
}}>
            {/* Expected Launch */}
            <div style={{
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '12px'
}}>
              <div style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
}}>
                <Zap style={{
  height: '16px',
  width: '16px'
}} />
                <span style={{
  fontWeight: '500'
}}>Expected Launch: {expectedDate}</span>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div style={{
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center'
}}>
              <Button 
                onClick={onJoinWaitlist}
                className="btn-primary bg-gradient-to-r from-accent-primary to-accent-secondary hover:from-accent-primary/80 hover:to-accent-secondary/80"
              >
                Join Waitlist
                <ArrowRight style={{
  height: '16px',
  width: '16px'
}} />
              </Button>
              
              <Button className="btn-secondary border-accent-primary/20">
                Learn More
              </Button>
            </div>
            
            {/* Development Note */}
            {isDevelopment && (
              <div style={{
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '12px',
  textAlign: 'left'
}}>
                <p className="text-sm text-muted">
                  <strong>Development Mode:</strong> Set{' '}
                  <code style={{
  borderRadius: '4px'
}}>
                    VITE_ENABLE_WEB3_FEATURES=true
                  </code>{' '}
                  to enable Web3 features for testing.
                </p>
              </div>
            )}
            
            {/* Feature Preview Badge */}
            {showPreview && (
              <div className="pt-lg border-t border-muted">
                <span style={{
  borderRadius: '50%'
}}>
                  Feature Preview Available
                </span>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

// Hook to check if Web3 features are enabled
export function useWeb3FeatureFlag() {
  const isDevelopment = import.meta.env.DEV;
  const enableWeb3Features = import.meta.env.VITE_ENABLE_WEB3_FEATURES === 'true';
  
  return {
    isEnabled: isDevelopment && enableWeb3Features,
    isDevelopment,
    enableWeb3Features
  };
}

// Higher-order component for Web3 features
export function withComingSoon(WrappedComponent, options = {}) {
  return function ComingSoonHOC(props) {
    const { isEnabled } = useWeb3FeatureFlag();
    
    return (
      <ComingSoonWrapper isEnabled={isEnabled} {...options}>
        <WrappedComponent {...props} />
      </ComingSoonWrapper>
    );
  };
}




export default ComingSoonWrapper
