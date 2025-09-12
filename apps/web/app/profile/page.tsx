"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/lib/stores/use-auth-store";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Settings, Edit2, Trophy, MessageSquare, ThumbsUp, Calendar } from "lucide-react";
import { api } from "@/lib/api";
import { UserStatus } from "@/lib/types";

interface UserStats {
  totalPosts: number;
  totalComments: number;
  totalKarma: number;
  postKarma: number;
  commentKarma: number;
  awardKarma: number;
  joinedAt: string;
}

export default function ProfilePage() {
  const { user, isAuthenticated, updateUser, logout } = useAuthStore();
  const router = useRouter();
  
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [formData, setFormData] = useState({
    displayName: "",
    username: "",
    email: "",
    status: UserStatus.ONLINE,
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    
    if (user) {
      setFormData({
        displayName: user.displayName || "",
        username: user.username,
        email: user.email,
        status: user.status,
      });
      
      // Load user stats (mock data for now)
      setStats({
        totalPosts: 42,
        totalComments: 156,
        totalKarma: 1247,
        postKarma: 892,
        commentKarma: 312,
        awardKarma: 43,
        joinedAt: user.createdAt.toISOString(),
      });
    }
  }, [isAuthenticated, user, router]);

  const handleSave = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const response = await api.updateProfile({
        displayName: formData.displayName,
        status: formData.status,
      });
      
      if (response.success && response.data) {
        updateUser(response.data);
        setIsEditing(false);
      }
    } catch (error) {
      console.error("Failed to update profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await api.logout();
      logout();
      router.push("/");
    } catch (error) {
      console.error("Logout failed:", error);
      // Logout anyway
      logout();
      router.push("/");
    }
  };

  if (!isAuthenticated || !user) {
    return null;
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getStatusColor = (status: UserStatus) => {
    switch (status) {
      case UserStatus.ONLINE:
        return "bg-green-500";
      case UserStatus.IDLE:
        return "bg-yellow-500";
      case UserStatus.DND:
        return "bg-red-500";
      case UserStatus.INVISIBLE:
      case UserStatus.OFFLINE:
        return "bg-gray-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={() => router.back()}
              className="text-gray-300 border-gray-600 hover:bg-gray-800"
            >
              ← Back
            </Button>
            <h1 className="text-3xl font-bold text-white">User Profile</h1>
          </div>
          <Button
            variant="destructive"
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700"
          >
            Sign Out
          </Button>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="relative">
                    <Avatar className="w-24 h-24">
                      <AvatarImage src={user.avatar} alt={user.username} />
                      <AvatarFallback className="text-2xl bg-blue-600 text-white">
                        {user.displayName?.[0] || user.username[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div 
                      className={`absolute -bottom-1 -right-1 w-6 h-6 ${getStatusColor(user.status)} rounded-full border-2 border-gray-800`}
                    />
                  </div>
                </div>
                <CardTitle className="text-white">
                  {user.displayName || user.username}
                </CardTitle>
                <p className="text-gray-400">@{user.username}</p>
                <div className="flex justify-center space-x-2 mt-2">
                  <Badge variant="secondary" className="bg-blue-600 text-white">
                    Gold Member
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Status</span>
                  <span className="text-white capitalize">{user.status}</span>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Member Since</span>
                  <span className="text-white">
                    {formatDate(user.createdAt.toISOString())}
                  </span>
                </div>

                <Separator className="bg-gray-700" />

                {stats && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Trophy className="w-4 h-4 text-yellow-500" />
                        <span className="text-gray-400 text-sm">Total Karma</span>
                      </div>
                      <span className="text-lg font-bold text-yellow-500">
                        {stats.totalKarma.toLocaleString()}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <MessageSquare className="w-4 h-4 text-blue-500" />
                        <span className="text-gray-400 text-sm">Posts</span>
                      </div>
                      <span className="text-white">
                        {stats.totalPosts}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <ThumbsUp className="w-4 h-4 text-green-500" />
                        <span className="text-gray-400 text-sm">Comments</span>
                      </div>
                      <span className="text-white">
                        {stats.totalComments}
                      </span>
                    </div>
                  </div>
                )}

                <Button
                  onClick={() => setIsEditing(!isEditing)}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  <Edit2 className="w-4 h-4 mr-2" />
                  {isEditing ? "Cancel" : "Edit Profile"}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList className="grid w-full grid-cols-4 bg-gray-800">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="activity">Activity</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
                <TabsTrigger value="preferences">Preferences</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                {isEditing ? (
                  <Card className="bg-gray-800 border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-white">Edit Profile</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="displayName" className="text-gray-300">
                          Display Name
                        </Label>
                        <Input
                          id="displayName"
                          value={formData.displayName}
                          onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                          className="bg-gray-700 border-gray-600 text-white"
                          placeholder="Your display name"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="username" className="text-gray-300">
                          Username
                        </Label>
                        <Input
                          id="username"
                          value={formData.username}
                          disabled
                          className="bg-gray-700 border-gray-600 text-gray-400"
                        />
                        <p className="text-sm text-gray-500 mt-1">
                          Username cannot be changed
                        </p>
                      </div>
                      
                      <div>
                        <Label htmlFor="email" className="text-gray-300">
                          Email
                        </Label>
                        <Input
                          id="email"
                          value={formData.email}
                          disabled
                          className="bg-gray-700 border-gray-600 text-gray-400"
                        />
                        <p className="text-sm text-gray-500 mt-1">
                          Email changes require verification
                        </p>
                      </div>

                      <div className="flex space-x-3 pt-4">
                        <Button
                          onClick={handleSave}
                          disabled={loading}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          {loading ? "Saving..." : "Save Changes"}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setIsEditing(false)}
                          className="border-gray-600 text-gray-300 hover:bg-gray-800"
                        >
                          Cancel
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="bg-gray-800 border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-white">Account Overview</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-gray-400">Display Name</Label>
                          <p className="text-white">{user.displayName || "Not set"}</p>
                        </div>
                        <div>
                          <Label className="text-gray-400">Username</Label>
                          <p className="text-white">@{user.username}</p>
                        </div>
                        <div>
                          <Label className="text-gray-400">Email</Label>
                          <p className="text-white">{user.email}</p>
                        </div>
                        <div>
                          <Label className="text-gray-400">Status</Label>
                          <p className="text-white capitalize">{user.status}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {stats && (
                  <Card className="bg-gray-800 border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-white">Karma Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-500">
                            {stats.postKarma}
                          </div>
                          <div className="text-sm text-gray-400">Post Karma</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-500">
                            {stats.commentKarma}
                          </div>
                          <div className="text-sm text-gray-400">Comment Karma</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-yellow-500">
                            {stats.awardKarma}
                          </div>
                          <div className="text-sm text-gray-400">Award Karma</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="activity">
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white">Recent Activity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-400">Recent posts and comments will appear here.</p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="settings">
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white">Account Settings</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-400">Privacy and security settings.</p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="preferences">
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white">User Preferences</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-400">Notification and display preferences.</p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}