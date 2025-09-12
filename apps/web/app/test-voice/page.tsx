"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import { useSimpleVoiceStore } from "@/lib/stores/simple-voice-store";
import { useAuthStore } from "@/lib/stores/use-auth-store";
import { SimpleVoiceControls } from "@/components/voice/simple-voice-controls";
import { VoiceChannelButton } from "@/components/voice/voice-channel-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";

export default function TestVoicePage() {
  const { user, login } = useAuthStore();
  const { connect, disconnect, setAuth, isConnected, participants, error } = useSimpleVoiceStore();
  const { toast } = useToast();
  
  const [channelId, setChannelId] = useState("test-voice-channel");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    // Set auth if user is logged in
    if (user) {
      // For testing, we'll generate a test JWT token
      // In a real app, this would come from your authentication system
      const testToken = btoa(JSON.stringify({
        userId: user.id,
        username: user.username,
        exp: Date.now() + 86400000 // 24 hours
      }));
      setAuth(`Bearer ${testToken}`, user.id);
    }
  }, [user, setAuth]);

  const handleLogin = async () => {
    try {
      // This is a dummy login for testing
      const mockUser = {
        id: `user_${Date.now()}`,
        username: username || "testuser",
        displayName: username || "Test User",
        avatar: null,
        email: "",
        status: "online" as const,
        isVerified: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Mock login
      login(mockUser);
      
      toast({
        title: "Logged In",
        description: `Welcome, ${mockUser.displayName}!`,
      });
    } catch (error) {
      toast({
        title: "Login Failed",
        description: "Failed to log in",
        variant: "destructive",
      });
    }
  };

  const handleConnect = async () => {
    if (!user) {
      toast({
        title: "Not Logged In",
        description: "Please log in first",
        variant: "destructive",
      });
      return;
    }

    try {
      await connect(channelId);
      toast({
        title: "Connected",
        description: `Connected to voice channel: ${channelId}`,
      });
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: error instanceof Error ? error.message : "Failed to connect",
        variant: "destructive",
      });
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
      toast({
        title: "Disconnected",
        description: "Disconnected from voice channel",
      });
    } catch (error) {
      toast({
        title: "Disconnect Failed",
        description: error instanceof Error ? error.message : "Failed to disconnect",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Voice Chat Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!user ? (
            <div className="space-y-4">
              <div>
                <Label htmlFor="username">Username (for testing)</Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter a test username"
                />
              </div>
              <Button onClick={handleLogin}>Test Login</Button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-green-600">
                Logged in as: {user.displayName || user.username}
              </p>
              
              <div>
                <Label htmlFor="channelId">Channel ID</Label>
                <Input
                  id="channelId"
                  value={channelId}
                  onChange={(e) => setChannelId(e.target.value)}
                  placeholder="Enter channel ID to test"
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={handleConnect} disabled={isConnected}>
                  Connect to Voice
                </Button>
                <Button 
                  onClick={handleDisconnect} 
                  disabled={!isConnected}
                  variant="outline"
                >
                  Disconnect
                </Button>
              </div>

              {error && (
                <div className="p-3 bg-red-100 border border-red-300 rounded text-red-700">
                  <strong>Error:</strong> {error}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>Connected: {isConnected ? "Yes" : "No"}</p>
                    <p>Participants: {participants.length}</p>
                    <p>Channel: {channelId}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Channel Button Test</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <VoiceChannelButton
                      channelId={channelId}
                      channelName="Test Voice Channel"
                      channelType="VOICE"
                      participantCount={participants.length}
                    />
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Voice controls show when connected */}
      <SimpleVoiceControls />

      <Card>
        <CardHeader>
          <CardTitle>Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>First, do a "test login" with any username</li>
            <li>Enter a channel ID (or use the default)</li>
            <li>Click "Connect to Voice" to join the voice channel</li>
            <li>Open this page in another browser tab/window and repeat with a different username</li>
            <li>Both users should see each other in the participant list</li>
            <li>Use the microphone button to mute/unmute</li>
            <li>Test that voice activity detection works (speaking indicator)</li>
          </ol>
          
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
            <p className="text-sm text-blue-700">
              <strong>Note:</strong> Make sure your browser allows microphone access when prompted.
              You may need to test with HTTPS if running in production.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}