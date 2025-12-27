import React, { useState, memo } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  Gamepad, Music, Film, Book, Code, Palette, Heart,
  Utensils, Plane, Camera, Dumbbell, Briefcase, TrendingUp
} from 'lucide-react'
import { useResponsive } from '../hooks/useResponsive'

/**
 * CategoryBrowsePage Component
 * Browse content by categories
 */
const CategoryBrowsePage = () => {
  const { isMobile, isTablet } = useResponsive()
  const navigate = useNavigate()
  const [selectedCategory, setSelectedCategory] = useState(null)

  const categories = [
    { id: 'gaming', name: 'Gaming', icon: Gamepad, color: 'from-purple-500 to-blue-500', count: 15234 },
    { id: 'music', name: 'Music', icon: Music, color: 'from-pink-500 to-[#000000]', count: 12893 },
    { id: 'movies', name: 'Movies & TV', icon: Film, color: 'from-red-500 to-pink-500', count: 9876 },
    { id: 'books', name: 'Books', icon: Book, color: 'from-orange-500 to-red-500', count: 7654 },
    { id: 'tech', name: 'Technology', icon: Code, color: 'from-[#000000] to-cyan-500', count: 18392 },
    { id: 'art', name: 'Art & Design', icon: Palette, color: 'from-yellow-500 to-orange-500', count: 11234 },
    { id: 'lifestyle', name: 'Lifestyle', icon: Heart, color: 'from-pink-500 to-red-500', count: 8912 },
    { id: 'food', name: 'Food & Cooking', icon: Utensils, color: 'from-green-500 to-yellow-500', count: 9543 },
    { id: 'travel', name: 'Travel', icon: Plane, color: 'from-cyan-500 to-blue-500', count: 6789 },
    { id: 'photography', name: 'Photography', icon: Camera, color: 'from-gray-500 to-gray-700', count: 5432 },
    { id: 'fitness', name: 'Fitness', icon: Dumbbell, color: 'from-green-500 to-emerald-500', count: 7321 },
    { id: 'business', name: 'Business', icon: Briefcase, color: 'from-[#000000] to-[#000000]', count: 10234 }
  ]

  const trendingTopics = [
    { id: 1, name: 'AI Art Generation', category: 'tech', posts: 1234 },
    { id: 2, name: 'Indie Games 2024', category: 'gaming', posts: 987 },
    { id: 3, name: 'Film Photography', category: 'photography', posts: 756 },
    { id: 4, name: 'Home Workouts', category: 'fitness', posts: 654 }
  ]

  return (
    <div className="min-h-screen bg-rgb(var(--color-neutral-50)) pt-20" role="main" aria-label="Category browse page">
      <div className={`max-w-7xl mx-auto ${isMobile ? 'px-4 py-8' : 'px-6 py-12'}`}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className={`${isMobile ? 'text-3xl' : 'text-5xl'} font-bold mb-4 bg-gradient-to-r from-[#000000] to-[#000000] bg-clip-text text-transparent`}>
            Browse Categories
          </h1>
          <p className={`${isMobile ? 'text-base' : 'text-xl'} text-secondary`}>
            Discover content that interests you
          </p>
        </motion.div>

        {/* Trending Topics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="flex items-center gap-3 mb-6">
            <TrendingUp style={{ width: "24px", height: "24px", flexShrink: 0 }} />
            <h2 className="text-2xl font-bold text-primary">Trending Topics</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {trendingTopics.map((topic, index) => (
              <motion.div
                key={topic.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => navigate(`/tag/${topic.name.toLowerCase().replace(/\s+/g, '-')}`)}
                className="p-6 bg-white rounded-2xl shadow-sm border border-rgb(var(--color-neutral-200)) hover:border-[#000000]/50 transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-primary">{topic.name}</h3>
                  <span className="text-[#000000] font-bold">#{index + 1}</span>
                </div>
                <p className="text-sm text-secondary">{topic.posts.toLocaleString()} posts</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {categories.map((category, index) => {
            const Icon = category.icon
            return (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.05, y: -5 }}
                onClick={() => navigate(`/category/${category.id}`)}
                className="relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all cursor-pointer group"
              >
                {/* Gradient Background */}
                <div className={`absolute inset-0 bg-gradient-to-br ${category.color} opacity-90 group-hover:opacity-100 transition-opacity`} />

                {/* Content */}
                <div className={`relative ${isMobile ? 'p-6 h-40' : 'p-8 h-48'} flex flex-col items-center justify-center text-white`}>
                  <Icon className={`${isMobile ? 'w-12 h-12 mb-3' : 'w-16 h-16 mb-4'}`} />
                  <h3 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold mb-2 text-center`}>{category.name}</h3>
                  <p className="text-sm opacity-90">
                    {category.count.toLocaleString()} communities
                  </p>
                </div>

                {/* Hover Effect */}
                <div style={{background: "var(--bg-primary)"}} className="absolute inset-0 /20 opacity-0 group-hover:opacity-100 transition-opacity" />
              </motion.div>
            )
          })}
        </div>

        {/* Popular Communities by Category */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-16"
        >
          <h2 className="text-2xl font-bold mb-6 text-primary">
            Popular Communities
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { name: 'Gaming Legends', category: 'Gaming', members: '125K', icon: '🎮' },
              { name: 'Music Producers', category: 'Music', members: '89K', icon: '🎵' },
              { name: 'Tech Innovators', category: 'Technology', members: '156K', icon: '💻' },
              { name: 'Food Lovers', category: 'Food', members: '78K', icon: '🍕' },
              { name: 'World Travelers', category: 'Travel', members: '92K', icon: '✈️' },
              { name: 'Art Collective', category: 'Art', members: '67K', icon: '🎨' }
            ].map((community, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + index * 0.1 }}
                className={`${isMobile ? 'p-4' : 'p-6'} bg-white rounded-2xl shadow-sm border border-rgb(var(--color-neutral-200)) hover:border-[#000000]/50 transition-all cursor-pointer`}
              >
                <div className="flex items-center gap-4 mb-3">
                  <div className={`${isMobile ? 'text-3xl' : 'text-4xl'}`}>{community.icon}</div>
                  <div className="flex-1">
                    <h3 className={`${isMobile ? 'text-sm' : 'text-base'} font-semibold text-primary`}>{community.name}</h3>
                    <p className="text-xs text-secondary">{community.category}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-secondary">{community.members} members</span>
                  <button className={`${isMobile ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm'} bg-gradient-to-r from-[#000000] to-[#000000] hover:opacity-90 text-white rounded-lg transition-colors`}>
                    Join
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default memo(CategoryBrowsePage)

