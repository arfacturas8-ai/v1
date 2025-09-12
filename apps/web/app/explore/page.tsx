"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";

interface Community {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  category: string;
  isPublic: boolean;
  avatar?: string;
}

export default function ExplorePage() {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const categories = ["all", "technology", "gaming", "crypto", "art", "music", "general"];

  useEffect(() => {
    const fetchCommunities = async () => {
      try {
        const response = await api.getCommunities();
        if (response.success) {
          setCommunities(response.data || []);
        }
      } catch (error) {
        console.error("Failed to fetch communities:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCommunities();
  }, []);

  const filteredCommunities = communities.filter((community) => {
    const matchesSearch = community.name.toLowerCase().includes(search.toLowerCase()) ||
                         community.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === "all" || community.category === selectedCategory;
    return matchesSearch && matchesCategory && community.isPublic;
  });

  const mockCommunities: Community[] = [
    {
      id: "1",
      name: "CRYB Developers",
      description: "Community for CRYB platform developers and contributors",
      memberCount: 1247,
      category: "technology",
      isPublic: true,
    },
    {
      id: "2", 
      name: "Crypto Traders",
      description: "Discuss cryptocurrency trading strategies and market analysis",
      memberCount: 3891,
      category: "crypto",
      isPublic: true,
    },
    {
      id: "3",
      name: "Gaming Central",
      description: "For gamers to discuss the latest games, share strategies, and find teammates",
      memberCount: 2156,
      category: "gaming",
      isPublic: true,
    },
    {
      id: "4",
      name: "Digital Artists",
      description: "Showcase your digital art, get feedback, and collaborate with other artists",
      memberCount: 891,
      category: "art", 
      isPublic: true,
    },
  ];

  const displayCommunities = filteredCommunities.length > 0 ? filteredCommunities : mockCommunities;

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-gray-800 bg-gray-900/95 backdrop-blur supports-[backdrop-filter]:bg-gray-900/60">
        <div className="container flex h-16 items-center">
          <div className="mr-4 flex">
            <Link href="/" className="mr-6 flex items-center space-x-2">
              <span className="font-bold text-xl text-white">CRYB</span>
            </Link>
          </div>
          <div className="flex flex-1 items-center justify-end space-x-4">
            <nav className="flex items-center space-x-4">
              <Link href="/dashboard">
                <Button variant="ghost" className="text-white hover:text-brand-primary">
                  Dashboard
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="brand">Sign In</Button>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="container py-8 space-y-8">
        {/* Page Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-white">Explore Communities</h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Discover amazing communities, connect with like-minded people, and join conversations that matter to you.
          </p>
        </div>

        {/* Search and Filters */}
        <div className="space-y-4">
          <div className="max-w-md mx-auto">
            <Input
              placeholder="Search communities..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-gray-800 border-gray-700 text-white placeholder-gray-400"
            />
          </div>
          
          <div className="flex flex-wrap gap-2 justify-center">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "brand" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className={selectedCategory === category ? "" : "text-gray-400 border-gray-600 hover:text-white hover:border-brand-primary"}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </Button>
            ))}
          </div>
        </div>

        {/* Communities Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="bg-gray-800 border-gray-700 p-6">
                <div className="animate-pulse space-y-4">
                  <div className="h-4 bg-gray-700 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-700 rounded"></div>
                  <div className="h-3 bg-gray-700 rounded w-1/2"></div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayCommunities.map((community) => (
              <Card key={community.id} className="bg-gray-800 border-gray-700 hover:border-brand-primary transition-colors">
                <div className="p-6 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <h3 className="font-semibold text-white text-lg">{community.name}</h3>
                      <Badge variant="outline" className="text-brand-primary border-brand-primary">
                        {community.category}
                      </Badge>
                    </div>
                  </div>
                  
                  <p className="text-gray-400 text-sm">{community.description}</p>
                  
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-500">
                      {community.memberCount.toLocaleString()} members
                    </div>
                    <Button size="sm" variant="brand">
                      Join Community
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {displayCommunities.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-white mb-2">No communities found</h3>
            <p className="text-gray-400">Try adjusting your search or filter criteria</p>
          </div>
        )}

        {/* Create Community CTA */}
        <div className="text-center py-8 border-t border-gray-800">
          <h3 className="text-xl font-semibold text-white mb-2">Don't see what you're looking for?</h3>
          <p className="text-gray-400 mb-4">Create your own community and bring people together around your interests</p>
          <Button variant="brand" size="lg">
            Create Community
          </Button>
        </div>
      </main>
    </div>
  );
}