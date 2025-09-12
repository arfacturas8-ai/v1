"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useChatStore } from "@/lib/stores/use-chat-store";
import { useRouter } from "next/navigation";
import { Server } from "@/lib/types";
import { Search, Users, Hash, Volume2, Shield, Star, TrendingUp } from "lucide-react";

const mockPublicServers: Server[] = [
  {
    id: 'public-1',
    name: 'CRYB Official',
    description: 'The official CRYB community server. Join to get updates, chat with the team, and connect with other users!',
    icon: '🚀',
    banner: null,
    ownerId: 'admin-1',
    isPublic: true,
    memberCount: 15420,
    createdAt: new Date('2024-01-01'),
    inviteCode: 'cryb-official',
    roles: [],
    members: [],
    channels: [
      { id: 'ch-1', name: 'announcements', type: 'announcement' as any, serverId: 'public-1', position: 0, isNsfw: false, createdAt: new Date(), permissions: [] },
      { id: 'ch-2', name: 'general', type: 'text' as any, serverId: 'public-1', position: 1, isNsfw: false, createdAt: new Date(), permissions: [] },
      { id: 'ch-3', name: 'feedback', type: 'text' as any, serverId: 'public-1', position: 2, isNsfw: false, createdAt: new Date(), permissions: [] },
    ]
  },
  {
    id: 'public-2',
    name: 'Crypto Trading Hub',
    description: 'Discuss cryptocurrency trading strategies, share market analysis, and connect with fellow traders.',
    icon: '📈',
    banner: null,
    ownerId: 'user-crypto',
    isPublic: true,
    memberCount: 8945,
    createdAt: new Date('2024-02-10'),
    inviteCode: 'crypto-hub',
    roles: [],
    members: [],
    channels: [
      { id: 'ch-4', name: 'market-analysis', type: 'text' as any, serverId: 'public-2', position: 0, isNsfw: false, createdAt: new Date(), permissions: [] },
      { id: 'ch-5', name: 'trading-signals', type: 'text' as any, serverId: 'public-2', position: 1, isNsfw: false, createdAt: new Date(), permissions: [] },
    ]
  },
  {
    id: 'public-3',
    name: 'Gaming Collective',
    description: 'A community for gamers to find teammates, share gameplay, and discuss the latest games.',
    icon: '🎮',
    banner: null,
    ownerId: 'user-gamer',
    isPublic: true,
    memberCount: 12680,
    createdAt: new Date('2024-01-20'),
    inviteCode: 'gaming-collective',
    roles: [],
    members: [],
    channels: [
      { id: 'ch-6', name: 'general-gaming', type: 'text' as any, serverId: 'public-3', position: 0, isNsfw: false, createdAt: new Date(), permissions: [] },
      { id: 'ch-7', name: 'lfg-looking-for-group', type: 'text' as any, serverId: 'public-3', position: 1, isNsfw: false, createdAt: new Date(), permissions: [] },
      { id: 'ch-8', name: 'Gaming Voice', type: 'voice' as any, serverId: 'public-3', position: 2, isNsfw: false, createdAt: new Date(), permissions: [] },
    ]
  },
  {
    id: 'public-4',
    name: 'Tech Innovators',
    description: 'A space for developers, designers, and tech enthusiasts to share knowledge and collaborate on projects.',
    icon: '💻',
    banner: null,
    ownerId: 'user-tech',
    isPublic: true,
    memberCount: 6742,
    createdAt: new Date('2024-03-05'),
    inviteCode: 'tech-innovators',
    roles: [],
    members: [],
    channels: [
      { id: 'ch-9', name: 'development', type: 'text' as any, serverId: 'public-4', position: 0, isNsfw: false, createdAt: new Date(), permissions: [] },
      { id: 'ch-10', name: 'project-showcase', type: 'text' as any, serverId: 'public-4', position: 1, isNsfw: false, createdAt: new Date(), permissions: [] },
    ]
  },
  {
    id: 'public-5',
    name: 'Art & Creative',
    description: 'Share your artwork, get feedback from the community, and collaborate with other artists.',
    icon: '🎨',
    banner: null,
    ownerId: 'user-artist',
    isPublic: true,
    memberCount: 4123,
    createdAt: new Date('2024-02-28'),
    inviteCode: 'art-creative',
    roles: [],
    members: [],
    channels: [
      { id: 'ch-11', name: 'artwork-showcase', type: 'text' as any, serverId: 'public-5', position: 0, isNsfw: false, createdAt: new Date(), permissions: [] },
      { id: 'ch-12', name: 'feedback-critique', type: 'text' as any, serverId: 'public-5', position: 1, isNsfw: false, createdAt: new Date(), permissions: [] },
    ]
  },
  {
    id: 'public-6',
    name: 'Study Group',
    description: 'Students helping students. Share notes, form study groups, and ace your exams together.',
    icon: '📚',
    banner: null,
    ownerId: 'user-student',
    isPublic: true,
    memberCount: 9876,
    createdAt: new Date('2024-01-15'),
    inviteCode: 'study-group',
    roles: [],
    members: [],
    channels: [
      { id: 'ch-13', name: 'general-study', type: 'text' as any, serverId: 'public-6', position: 0, isNsfw: false, createdAt: new Date(), permissions: [] },
      { id: 'ch-14', name: 'exam-prep', type: 'text' as any, serverId: 'public-6', position: 1, isNsfw: false, createdAt: new Date(), permissions: [] },
    ]
  }
];

export default function ServersPage() {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState("all");
  const { addServer, selectServer } = useChatStore();
  const router = useRouter();

  const filteredServers = React.useMemo(() => {
    return mockPublicServers.filter(server => {
      const matchesSearch = server.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          server.description?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    });
  }, [searchQuery]);

  const handleJoinServer = (server: Server) => {
    // Add server to user's server list
    addServer(server);
    
    // Select the server and navigate to chat
    selectServer(server.id);
    router.push('/chat');
  };

  const formatMemberCount = (count: number) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    }
    return count.toString();
  };

  const getTextChannelCount = (server: Server) => {
    return server.channels.filter(ch => ch.type === 'text' || ch.type === 'announcement').length;
  };

  const getVoiceChannelCount = (server: Server) => {
    return server.channels.filter(ch => ch.type === 'voice' || ch.type === 'stage_voice').length;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800">
      {/* Header */}
      <div className="bg-gray-900/80 backdrop-blur-sm border-b border-gray-800">
        <div className="container mx-auto px-6 py-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">
              Discover Communities
            </h1>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Find the perfect server to connect with people who share your interests
            </p>
          </div>
          
          {/* Search and filters */}
          <div className="max-w-2xl mx-auto">
            <div className="relative mb-6">
              <Search className="absolute left-4 top-3.5 h-5 w-5 text-gray-400" />
              <Input
                placeholder="Search servers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 bg-gray-800 border-gray-700 text-white placeholder-gray-400"
              />
            </div>
            
            {/* Quick stats */}
            <div className="flex justify-center gap-6 text-sm text-gray-400 mb-6">
              <span className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                {mockPublicServers.length} servers available
              </span>
              <span className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                {mockPublicServers.reduce((sum, s) => sum + s.memberCount, 0).toLocaleString()} total members
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Server grid */}
      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServers.map((server) => (
            <Card key={server.id} className="bg-gray-800 border-gray-700 hover:border-gray-600 transition-all duration-200 hover:shadow-lg hover:shadow-gray-900/20">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center text-2xl">
                    {server.icon || '🌟'}
                  </div>
                  <div>
                    <CardTitle className="text-white text-lg leading-tight">
                      {server.name}
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="bg-gray-700 text-gray-300 text-xs">
                        <Users className="w-3 h-3 mr-1" />
                        {formatMemberCount(server.memberCount)}
                      </Badge>
                      {server.memberCount > 10000 && (
                        <Badge variant="outline" className="border-yellow-500 text-yellow-400 text-xs">
                          <Star className="w-3 h-3 mr-1" />
                          Popular
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <CardDescription className="text-gray-400 text-sm line-clamp-3">
                  {server.description || "Join this community to connect with like-minded people!"}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="py-3">
                <div className="flex items-center gap-4 text-sm text-gray-400">
                  <div className="flex items-center gap-1">
                    <Hash className="w-4 h-4" />
                    <span>{getTextChannelCount(server)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Volume2 className="w-4 h-4" />
                    <span>{getVoiceChannelCount(server)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Shield className="w-4 h-4" />
                    <span>Safe</span>
                  </div>
                </div>
              </CardContent>
              
              <CardFooter className="pt-3">
                <Button 
                  onClick={() => handleJoinServer(server)}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                >
                  Join Server
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {filteredServers.length === 0 && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-white mb-2">
              No servers found
            </h3>
            <p className="text-gray-400">
              Try adjusting your search query to find more communities
            </p>
          </div>
        )}

        {/* Create server CTA */}
        <div className="mt-16">
          <Separator className="bg-gray-800 mb-8" />
          <div className="text-center">
            <h3 className="text-2xl font-bold text-white mb-4">
              Can't find what you're looking for?
            </h3>
            <p className="text-gray-400 mb-6">
              Create your own server and build the community you want to see
            </p>
            <Button size="lg" className="bg-green-600 hover:bg-green-700 text-white">
              Create Your Server
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}