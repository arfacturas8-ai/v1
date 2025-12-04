/**
 * CRYB Delete Account Page
 * Comprehensive account deletion flow with warnings and confirmations
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  AlertTriangle,
  Trash2,
  CheckCircle2,
  X,
  Lock,
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input, Textarea } from '../../components/ui/input';
import { Switch } from '../../components/ui/switch';
import { Modal, ModalHeader, ModalTitle, ModalBody, ModalFooter } from '../../components/ui/modal';
import { cn } from '../../lib/utils';

interface FeedbackForm {
  reason: string;
  details: string;
  improvements: string;
  downloadData: boolean;
}

const DeleteAccountPage: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<'warning' | 'feedback' | 'confirm' | 'final'>('warning');
  const [password, setPassword] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [countdown, setCountdown] = useState(10);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showFinalConfirm, setShowFinalConfirm] = useState(false);

  const [feedback, setFeedback] = useState<FeedbackForm>({
    reason: '',
    details: '',
    improvements: '',
    downloadData: false,
  });

  const deletionReasons = [
    'I have privacy concerns',
    'I found a better alternative',
    'I am not using the platform anymore',
    'The platform is too complex',
    'I have too many accounts',
    'I am taking a break from crypto',
    'Other',
  ];

  useEffect(() => {
    if (step === 'final' && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [step, countdown]);

  const handleDelete = async () => {
    setIsDeleting(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsDeleting(false);
    setShowFinalConfirm(false);
    // Redirect to goodbye page or login
    navigate('/goodbye');
  };

  const canProceedToFeedback = true; // Could add validation here
  const canProceedToConfirm = feedback.reason !== '';
  const canDelete = password !== '' && confirmText.toLowerCase() === 'delete my account';

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/settings')}
              className="p-2 hover:bg-accent rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <h1 className="text-2xl font-bold">Delete Account</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Warning Step */}
        {step === 'warning' && (
          <div className="space-y-6">
            {/* Critical Warning */}
            <div className="bg-destructive/10 border-2 border-destructive/50 rounded-xl p-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-6 w-6 text-destructive flex-shrink-0 mt-0.5" />
                <div>
                  <h2 className="font-bold text-lg text-destructive mb-2">
                    Warning: This Action is Permanent
                  </h2>
                  <p className="text-sm text-destructive/90">
                    Deleting your account is irreversible. Once deleted, you will not be able to
                    recover your account, data, or any associated content.
                  </p>
                </div>
              </div>
            </div>

            {/* What Will Be Deleted */}
            <div className="bg-card border border-border rounded-xl p-6 space-y-4">
              <h2 className="font-semibold text-lg">What will be deleted:</h2>
              <div className="space-y-3">
                {[
                  'Your profile and all personal information',
                  'All posts, comments, and interactions',
                  'Your NFT collections and wallet connections',
                  'All saved content and bookmarks',
                  'Your followers and following lists',
                  'All messages and conversations',
                  'Transaction history and activity logs',
                  'Your username (may become available to others)',
                ].map((item, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <X className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* What Happens Next */}
            <div className="bg-card border border-border rounded-xl p-6 space-y-4">
              <h2 className="font-semibold text-lg">What happens next:</h2>
              <ol className="space-y-3 list-decimal list-inside">
                <li className="text-sm">
                  You'll be asked to provide feedback (optional but appreciated)
                </li>
                <li className="text-sm">You'll need to verify your password</li>
                <li className="text-sm">
                  Type a confirmation phrase to confirm deletion
                </li>
                <li className="text-sm">
                  Your account will be scheduled for permanent deletion
                </li>
                <li className="text-sm">
                  You'll have 30 days to cancel if you change your mind
                </li>
              </ol>
            </div>

            {/* Alternative Options */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-6 space-y-4">
              <h2 className="font-semibold text-lg text-blue-500">
                Consider these alternatives:
              </h2>
              <div className="space-y-3">
                <button
                  onClick={() => navigate('/settings/privacy')}
                  className="w-full p-4 bg-background border border-border rounded-lg hover:border-blue-500/50 transition-all text-left"
                >
                  <div className="font-medium">Adjust your privacy settings</div>
                  <div className="text-sm text-muted-foreground">
                    Control who can see your profile and content
                  </div>
                </button>
                <button
                  onClick={() => navigate('/settings/deactivate')}
                  className="w-full p-4 bg-background border border-border rounded-lg hover:border-blue-500/50 transition-all text-left"
                >
                  <div className="font-medium">Deactivate your account temporarily</div>
                  <div className="text-sm text-muted-foreground">
                    Take a break without losing your data
                  </div>
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => navigate('/settings')}
                className="flex-1"
              >
                Go Back
              </Button>
              <Button
                variant="destructive"
                onClick={() => setStep('feedback')}
                className="flex-1"
              >
                Continue to Delete
              </Button>
            </div>
          </div>
        )}

        {/* Feedback Step */}
        {step === 'feedback' && (
          <div className="space-y-6">
            <div className="bg-card border border-border rounded-xl p-6 space-y-4">
              <h2 className="font-semibold text-lg">Help us improve (Optional)</h2>
              <p className="text-sm text-muted-foreground">
                We're sorry to see you go. Your feedback helps us make CRYB better for everyone.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    What's your main reason for leaving?
                  </label>
                  <div className="space-y-2">
                    {deletionReasons.map((reason) => (
                      <button
                        key={reason}
                        onClick={() => setFeedback({ ...feedback, reason })}
                        className={cn(
                          'w-full p-3 rounded-lg border transition-all text-left',
                          feedback.reason === reason
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              'w-4 h-4 rounded-full border-2 flex items-center justify-center',
                              feedback.reason === reason
                                ? 'border-primary'
                                : 'border-muted-foreground'
                            )}
                          >
                            {feedback.reason === reason && (
                              <div className="w-2 h-2 rounded-full bg-primary" />
                            )}
                          </div>
                          <span className="text-sm">{reason}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <Textarea
                  label="Tell us more (Optional)"
                  placeholder="Any additional details you'd like to share..."
                  value={feedback.details}
                  onChange={(e) => setFeedback({ ...feedback, details: e.target.value })}
                  rows={4}
                />

                <Textarea
                  label="What could we do better? (Optional)"
                  placeholder="Your suggestions for improvement..."
                  value={feedback.improvements}
                  onChange={(e) =>
                    setFeedback({ ...feedback, improvements: e.target.value })
                  }
                  rows={4}
                />

                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div>
                    <div className="font-medium">Download my data</div>
                    <div className="text-sm text-muted-foreground">
                      Get a copy of your data before deletion
                    </div>
                  </div>
                  <Switch
                    checked={feedback.downloadData}
                    onCheckedChange={(checked) =>
                      setFeedback({ ...feedback, downloadData: checked })
                    }
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setStep('warning')}
                className="flex-1"
              >
                Back
              </Button>
              <Button
                variant="destructive"
                onClick={() => setStep('confirm')}
                disabled={!canProceedToConfirm}
                className="flex-1"
              >
                Continue
              </Button>
            </div>
          </div>
        )}

        {/* Confirmation Step */}
        {step === 'confirm' && (
          <div className="space-y-6">
            <div className="bg-destructive/10 border border-destructive/50 rounded-xl p-6">
              <div className="flex items-start gap-3">
                <Lock className="h-6 w-6 text-destructive flex-shrink-0 mt-0.5" />
                <div>
                  <h2 className="font-bold text-lg text-destructive mb-2">
                    Final Confirmation Required
                  </h2>
                  <p className="text-sm text-destructive/90">
                    To confirm deletion, please enter your password and type the confirmation
                    phrase exactly as shown.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-6 space-y-4">
              <Input
                type="password"
                label="Enter your password"
                placeholder="Your account password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Type "delete my account" to confirm
                </label>
                <Input
                  type="text"
                  placeholder="delete my account"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  required
                  error={
                    confirmText && confirmText.toLowerCase() !== 'delete my account'
                      ? 'Please type the exact phrase shown'
                      : undefined
                  }
                />
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setStep('feedback')}
                className="flex-1"
              >
                Back
              </Button>
              <Button
                variant="destructive"
                onClick={() => setStep('final')}
                disabled={!canDelete}
                className="flex-1"
              >
                Proceed to Final Step
              </Button>
            </div>
          </div>
        )}

        {/* Final Step with Countdown */}
        {step === 'final' && (
          <div className="space-y-6">
            <div className="bg-destructive/20 border-2 border-destructive rounded-xl p-8 text-center">
              <AlertTriangle className="h-16 w-16 text-destructive mx-auto mb-4" />
              <h2 className="font-bold text-2xl text-destructive mb-2">
                Last Chance to Cancel
              </h2>
              <p className="text-destructive/90 mb-6">
                Your account will be permanently deleted. This action cannot be undone.
              </p>

              <div className="flex items-center justify-center gap-4 mb-6">
                <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center border-2 border-destructive">
                  <span className="text-3xl font-bold text-destructive">{countdown}</span>
                </div>
              </div>

              <Button
                variant="destructive"
                size="lg"
                onClick={() => setShowFinalConfirm(true)}
                disabled={countdown > 0}
                fullWidth
                leftIcon={<Trash2 className="h-5 w-5" />}
              >
                {countdown > 0
                  ? `Wait ${countdown} seconds...`
                  : 'Delete My Account Permanently'}
              </Button>
            </div>

            <Button
              variant="outline"
              onClick={() => navigate('/settings')}
              fullWidth
              size="lg"
            >
              Cancel and Keep My Account
            </Button>
          </div>
        )}
      </div>

      {/* Final Confirmation Dialog */}
      <Modal
        open={showFinalConfirm}
        onOpenChange={setShowFinalConfirm}
        size="sm"
        disableOutsideClick
      >
        <ModalHeader>
          <ModalTitle>Are you absolutely sure?</ModalTitle>
        </ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-destructive mb-2">
                  This is your final warning!
                </p>
                <p className="text-muted-foreground">
                  Once you click "Delete Forever", your account and all associated data will be
                  permanently deleted. You will not be able to recover anything.
                </p>
              </div>
            </div>

            {feedback.downloadData && (
              <div className="flex items-start gap-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-500">
                  We'll email you a download link for your data within 24 hours.
                </div>
              </div>
            )}
          </div>
        </ModalBody>
        <ModalFooter justify="between">
          <Button
            variant="outline"
            onClick={() => setShowFinalConfirm(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            loading={isDeleting}
            leftIcon={<Trash2 className="h-4 w-4" />}
          >
            Delete Forever
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
};

export default DeleteAccountPage;
