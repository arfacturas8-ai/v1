import React, { useState, useEffect } from 'react'
import { Star, Eye, TrendingUp, Grid3x3, List, ExternalLink } from 'lucide-react'

function NFTPreview() {
  const [activeTab, setActiveTab] = useState('collection')
  const [viewMode, setViewMode] = useState('grid')
  const [selectedNFT, setSelectedNFT] = useState(null)
  const [filterBy, setFilterBy] = useState('all')

  // Mock NFT data
  const mockNFTs = [
    {
      id: 1,
      name: 'Bored Ape #1234',
      collection: 'Bored Ape Yacht Club',
      image: '🐵',
      rarity: 'Rare',
      price: '15.2 ETH',
      usdPrice: '$24,320',
      traits: ['Golden Fur', 'Laser Eyes', 'Crown'],
      verified: true,
      isProfilePic: true
    },
    {
      id: 2,
      name: 'CryptoPunk #5678',
      collection: 'CryptoPunks',
      image: '👾',
      rarity: 'Ultra Rare',
      price: '89.5 ETH',
      usdPrice: '$143,200',
      traits: ['Alien', 'Cap Forward', 'Pipe'],
      verified: true,
      isProfilePic: false
    },
    {
      id: 3,
      name: 'Azuki #9012',
      collection: 'Azuki',
      image: '🌸',
      rarity: 'Common',
      price: '8.7 ETH',
      usdPrice: '$13,920',
      traits: ['Pink Hair', 'Hoodie', 'Headphones'],
      verified: true,
      isProfilePic: false
    },
    {
      id: 4,
      name: 'Doodle #3456',
      collection: 'Doodles',
      image: '🎨',
      rarity: 'Rare',
      price: '5.3 ETH',
      usdPrice: '$8,480',
      traits: ['Blue Body', 'Bucket Hat', 'Glasses'],
      verified: true,
      isProfilePic: false
    }
  ]

  const collections = [
    {
      name: 'Bored Ape Yacht Club',
      count: 1,
      floorPrice: '15.2 ETH',
      icon: '🐵'
    },
    {
      name: 'CryptoPunks',
      count: 1,
      floorPrice: '89.5 ETH',
      icon: '👾'
    },
    {
      name: 'Azuki',
      count: 1,
      floorPrice: '8.7 ETH',
      icon: '🌸'
    },
    {
      name: 'Doodles',
      count: 1,
      floorPrice: '5.3 ETH',
      icon: '🎨'
    }
  ]

  const filteredNFTs = mockNFTs.filter(nft => {
    if (filterBy === 'all') return true
    if (filterBy === 'profile') return nft.isProfilePic
    if (filterBy === 'rare') return nft.rarity === 'Rare' || nft.rarity === 'Ultra Rare'
    return true
  })

  const setAsProfilePic = (nft) => {
    // Reset all NFTs
    mockNFTs.forEach(item => item.isProfilePic = false)
    // Set selected NFT as profile pic
    nft.isProfilePic = true
    setSelectedNFT(null)
  }

  return (
    <div className="card p-2xl">
      {/* Header */}
      <div style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between'
}}>
        <div>
          <h3 style={{
  fontWeight: 'bold'
}}>Your NFT Collection</h3>
          <p className="text-secondary">Manage and showcase your digital assets</p>
        </div>
        
        <div style={{
  display: 'flex',
  alignItems: 'center'
}}>
          <div style={{
  borderRadius: '50%'
}}>
            <span style={{
  fontWeight: '500'
}}>4 NFTs</span>
          </div>
          <div style={{
  borderRadius: '50%'
}}>
            <span style={{
  fontWeight: '500'
}}>$190K Total</span>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={{
  display: 'flex'
}}>
        <button
          onClick={() => setActiveTab('collection')}
          style={{
  fontWeight: '500'
}}
        >
          Collection
        </button>
        <button
          onClick={() => setActiveTab('collections')}
          style={{
  fontWeight: '500'
}}
        >
          By Collection
        </button>
        <button
          onClick={() => setActiveTab('activity')}
          style={{
  fontWeight: '500'
}}
        >
          Activity
        </button>
      </div>

      {/* Collection View */}
      {activeTab === 'collection' && (
        <div>
          {/* Controls */}
          <div style={{
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  justifyContent: 'space-between'
}}>
            <div style={{
  display: 'flex',
  alignItems: 'center'
}}>
              <select
                value={filterBy}
                onChange={(e) => setFilterBy(e.target.value)}
                className="input px-md py-sm text-sm"
              >
                <option value="all">All NFTs</option>
                <option value="profile">Profile Pic</option>
                <option value="rare">Rare Only</option>
              </select>
              
              <div style={{
  display: 'flex',
  alignItems: 'center'
}}>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`btn-icon ${viewMode === 'grid' ? 'bg-accent-primary/20 text-accent-light' : ''}`}
                >
                  <Grid3x3 style={{
  height: '16px',
  width: '16px'
}} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`btn-icon ${viewMode === 'list' ? 'bg-accent-primary/20 text-accent-light' : ''}`}
                >
                  <List style={{
  height: '16px',
  width: '16px'
}} />
                </button>
              </div>
            </div>
            
            <div className="text-sm text-muted">
              {filteredNFTs.length} of {mockNFTs.length} NFTs
            </div>
          </div>

          {/* NFTs Grid */}
          {viewMode === 'grid' ? (
            <div style={{
  display: 'grid'
}}>
              {filteredNFTs.map((nft) => (
                <div
                  key={nft.id}
                  className={`card p-lg group cursor-pointer hover:border-accent-primary/30 transition-all duration-200 ${
                    nft.isProfilePic ? 'border-accent-primary/50 bg-accent-primary/5' : ''
                  }`}
                  onClick={() => setSelectedNFT(nft)}
                >
                  {/* NFT Image */}
                  <div style={{
  position: 'relative'
}}>
                    <div style={{
  borderRadius: '12px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
}}>
                      {nft.image}
                    </div>
                    
                    {/* Badges */}
                    <div style={{
  position: 'absolute',
  display: 'flex',
  flexDirection: 'column'
}}>
                      {nft.verified && (
                        <div style={{
  paddingTop: '0px',
  paddingBottom: '0px',
  borderRadius: '4px'
}}>
                          ✓ Verified
                        </div>
                      )}
                      {nft.isProfilePic && (
                        <div style={{
  paddingTop: '0px',
  paddingBottom: '0px',
  borderRadius: '4px'
}}>
                          Profile Pic
                        </div>
                      )}
                    </div>
                    
                    {/* Rarity */}
                    <div style={{
  position: 'absolute'
}}>
                      <div style={{
  paddingTop: '0px',
  paddingBottom: '0px',
  borderRadius: '4px'
}}>
                        {nft.rarity}
                      </div>
                    </div>
                  </div>
                  
                  {/* NFT Info */}
                  <div>
                    <h4 style={{
  fontWeight: '600'
}}>{nft.name}</h4>
                    <p className="text-sm text-muted mb-md truncate">{nft.collection}</p>
                    
                    <div style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between'
}}>
                      <div>
                        <div style={{
  fontWeight: '500'
}}>{nft.price}</div>
                        <div className="text-muted">{nft.usdPrice}</div>
                      </div>
                      <div style={{
  display: 'flex',
  alignItems: 'center'
}}>
                        <Eye style={{
  height: '12px',
  width: '12px'
}} />
                        <TrendingUp style={{
  height: '12px',
  width: '12px'
}} />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* NFTs List View */
            <div className="space-y-md">
              {filteredNFTs.map((nft) => (
                <div
                  key={nft.id}
                  style={{
  display: 'flex',
  alignItems: 'center'
}}
                  onClick={() => setSelectedNFT(nft)}
                >
                  <div className="text-4xl">{nft.image}</div>
                  
                  <div style={{
  flex: '1'
}}>
                    <div style={{
  display: 'flex',
  alignItems: 'center'
}}>
                      <h4 style={{
  fontWeight: '600'
}}>{nft.name}</h4>
                      {nft.verified && <span className="text-success text-sm">✓</span>}
                      {nft.isProfilePic && (
                        <span style={{
  paddingTop: '0px',
  paddingBottom: '0px',
  borderRadius: '4px'
}}>
                          Profile Pic
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted">{nft.collection}</p>
                  </div>
                  
                  <div style={{
  textAlign: 'right'
}}>
                    <div style={{
  fontWeight: '500'
}}>{nft.price}</div>
                    <div className="text-sm text-muted">{nft.usdPrice}</div>
                  </div>
                  
                  <div style={{
  borderRadius: '4px'
}}>
                    {nft.rarity}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Collections View */}
      {activeTab === 'collections' && (
        <div className="space-y-md">
          {collections.map((collection, index) => (
            <div key={index} style={{
  display: 'flex',
  alignItems: 'center'
}}>
              <div className="text-4xl">{collection.icon}</div>
              
              <div style={{
  flex: '1'
}}>
                <h4 style={{
  fontWeight: '600'
}}>{collection.name}</h4>
                <p className="text-sm text-muted">{collection.count} NFT{collection.count !== 1 ? 's' : ''}</p>
              </div>
              
              <div style={{
  textAlign: 'right'
}}>
                <div className="text-sm text-muted">Floor Price</div>
                <div style={{
  fontWeight: '500'
}}>{collection.floorPrice}</div>
              </div>
              
              <button className="btn-icon">
                <ExternalLink style={{
  height: '16px',
  width: '16px'
}} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Activity View */}
      {activeTab === 'activity' && (
        <div className="space-y-md">
          <div className="card p-lg">
            <div style={{
  display: 'flex',
  alignItems: 'center'
}}>
              <div style={{
  width: '12px',
  height: '12px',
  borderRadius: '50%'
}}></div>
              <div style={{
  flex: '1'
}}>
                <div style={{
  fontWeight: '500'
}}>Set as Profile Picture</div>
                <div className="text-sm text-muted">Bored Ape #1234 • 2 hours ago</div>
              </div>
            </div>
          </div>
          
          <div className="card p-lg">
            <div style={{
  display: 'flex',
  alignItems: 'center'
}}>
              <div style={{
  width: '12px',
  height: '12px',
  borderRadius: '50%'
}}></div>
              <div style={{
  flex: '1'
}}>
                <div style={{
  fontWeight: '500'
}}>NFT Received</div>
                <div className="text-sm text-muted">Doodle #3456 • 1 day ago</div>
              </div>
            </div>
          </div>
          
          <div className="card p-lg">
            <div style={{
  display: 'flex',
  alignItems: 'center'
}}>
              <div style={{
  width: '12px',
  height: '12px',
  borderRadius: '50%'
}}></div>
              <div style={{
  flex: '1'
}}>
                <div style={{
  fontWeight: '500'
}}>Collection Updated</div>
                <div className="text-sm text-muted">Azuki #9012 metadata refreshed • 3 days ago</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* NFT Detail Modal */}
      {selectedNFT && (
        <div style={{
  position: 'fixed',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
}}>
          <div style={{
  width: '100%'
}}>
            <div style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between'
}}>
              <h3 style={{
  fontWeight: 'bold'
}}>NFT Details</h3>
              <button 
                onClick={() => setSelectedNFT(null)}
                className="btn-icon"
              >
                ✕
              </button>
            </div>
            
            <div style={{
  textAlign: 'center'
}}>
              <div className="text-8xl mb-lg">{selectedNFT.image}</div>
              <h4 style={{
  fontWeight: '600'
}}>{selectedNFT.name}</h4>
              <p className="text-secondary">{selectedNFT.collection}</p>
            </div>
            
            <div className="space-y-md mb-lg">
              <div style={{
  display: 'flex',
  justifyContent: 'space-between'
}}>
                <span className="text-muted">Price:</span>
                <span style={{
  fontWeight: '500'
}}>{selectedNFT.price}</span>
              </div>
              <div style={{
  display: 'flex',
  justifyContent: 'space-between'
}}>
                <span className="text-muted">USD Value:</span>
                <span className="text-primary">{selectedNFT.usdPrice}</span>
              </div>
              <div style={{
  display: 'flex',
  justifyContent: 'space-between'
}}>
                <span className="text-muted">Rarity:</span>
                <span className={`${
                  selectedNFT.rarity === 'Ultra Rare' ? 'text-error' :
                  selectedNFT.rarity === 'Rare' ? 'text-warning' :
                  'text-info'
                }`}>{selectedNFT.rarity}</span>
              </div>
            </div>
            
            <div className="mb-lg">
              <h5 style={{
  fontWeight: '500'
}}>Traits:</h5>
              <div style={{
  display: 'flex',
  flexWrap: 'wrap'
}}>
                {selectedNFT.traits.map((trait, index) => (
                  <span key={index} style={{
  borderRadius: '4px'
}}>
                    {trait}
                  </span>
                ))}
              </div>
            </div>
            
            <div style={{
  display: 'flex'
}}>
              {!selectedNFT.isProfilePic ? (
                <button 
                  onClick={() => setAsProfilePic(selectedNFT)}
                  style={{
  flex: '1'
}}
                >
                  <Star style={{
  height: '16px',
  width: '16px'
}} />
                  Set as Profile Pic
                </button>
              ) : (
                <div style={{
  flex: '1',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '12px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
}}>
                  <Star style={{
  height: '16px',
  width: '16px'
}} />
                  <span style={{
  fontWeight: '500'
}}>Current Profile Pic</span>
                </div>
              )}
              
              <button className="btn btn-secondary">
                <ExternalLink style={{
  height: '16px',
  width: '16px'
}} />
                View on OpenSea
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}




export default NFTPreview
