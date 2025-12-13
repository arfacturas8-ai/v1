import React, { useState } from 'react';
import { X, Copy, Mail, Link as LinkIcon, Check, Send, Users } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';

interface InviteFriendsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userInviteCode?: string;
}

export function InviteFriendsModal({ isOpen, onClose, userInviteCode = 'CRYB-DEMO-CODE' }: InviteFriendsModalProps) {
  const [copied, setCopied] = useState(false);
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const inviteUrl = `https://platform.cryb.ai/signup?invite=${userInviteCode}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setSending(true);
    try {
      // Mock API call to send invitation
      // In production: await api.post('/api/invitations/send', { email, inviteCode: userInviteCode });
      await new Promise(resolve => setTimeout(resolve, 1000));

      setSent(true);
      setTimeout(() => {
        setSent(false);
        setEmail('');
      }, 2000);
    } catch (err) {
      console.error('Failed to send invitation:', err);
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-[#141414] border border-white/10 rounded-2xl shadow-2xl">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-r from-[#58a6ff] to-[#a371f7] flex items-center justify-center">
              <Users className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Invite Friends to CRYB</h2>
            <p className="text-sm text-gray-400">
              Share the platform with friends and build your community together
            </p>
          </div>

          {/* Invitation Link Section */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Your Invitation Link
            </label>
            <div className="flex gap-2">
              <div className="flex-1 px-4 py-3 bg-[#0D0D0D] border border-white/10 rounded-lg text-sm text-gray-300 font-mono overflow-x-auto whitespace-nowrap">
                {inviteUrl}
              </div>
              <Button
                variant="outline"
                size="lg"
                onClick={handleCopy}
                className="bg-[#0D0D0D] border-white/20 text-white hover:bg-white/5 flex-shrink-0"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                  </>
                )}
              </Button>
            </div>
            {copied && (
              <p className="mt-2 text-xs text-green-500 flex items-center gap-1">
                <Check className="w-3 h-3" />
                Copied to clipboard!
              </p>
            )}
          </div>

          {/* Send via Email Section */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Send Invitation via Email
            </label>
            <form onSubmit={handleSendInvite} className="flex gap-2">
              <Input
                type="email"
                placeholder="friend@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                leftIcon={<Mail className="w-4 h-4" />}
                disabled={sending || sent}
                required
              />
              <Button
                type="submit"
                variant="outline"
                size="lg"
                loading={sending}
                disabled={sending || sent || !email}
                className="bg-gradient-to-r from-[#58a6ff] to-[#a371f7] border-0 text-white hover:opacity-90 flex-shrink-0"
              >
                {sent ? (
                  <>
                    <Check className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                  </>
                )}
              </Button>
            </form>
            {sent && (
              <p className="mt-2 text-xs text-green-500 flex items-center gap-1">
                <Check className="w-3 h-3" />
                Invitation sent successfully!
              </p>
            )}
          </div>

          {/* Stats Section */}
          <div className="p-4 bg-gradient-to-r from-[#58a6ff]/10 to-[#a371f7]/10 border border-[#58a6ff]/20 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 mb-1">Invitations Sent</p>
                <p className="text-2xl font-bold text-white">0</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400 mb-1">Friends Joined</p>
                <p className="text-2xl font-bold text-[#58a6ff]">0</p>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-white/10">
              <p className="text-xs text-gray-400">
                💡 <strong className="text-white">Pro tip:</strong> Share your link on social media to reach more people!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default InviteFriendsModal;
