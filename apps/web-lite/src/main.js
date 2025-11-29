// Simple, fast, no framework version
const API_URL = 'https://api.cryb.ai';

// Router
function router() {
    const path = window.location.pathname;
    const app = document.getElementById('root');
    
    if (path === '/' || path === '/index.html') {
        renderHomePage(app);
    } else if (path.startsWith('/communities')) {
        renderCommunitiesPage(app);
    } else if (path.startsWith('/chat')) {
        renderChatPage(app);
    } else {
        renderHomePage(app);
    }
}

// Header component
function renderHeader() {
    return `
        <header class="sticky top-0 z-50 bg-white border-b shadow-sm">
            <div class="container mx-auto px-4 h-16 flex items-center justify-between">
                <div class="flex items-center space-x-6">
                    <a href="/" class="flex items-center space-x-2">
                        <div class="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full flex items-center justify-center">
                            <span class="text-white font-bold">C</span>
                        </div>
                        <span class="font-bold text-xl">CRYB</span>
                    </a>
                    <nav class="hidden md:flex space-x-4">
                        <a href="/" class="text-gray-700 hover:text-blue-500">Home</a>
                        <a href="/communities" class="text-gray-700 hover:text-blue-500">Communities</a>
                        <a href="/chat" class="text-gray-700 hover:text-blue-500">Discord</a>
                    </nav>
                </div>
                <div class="flex items-center space-x-3">
                    <button class="px-4 py-2 text-sm border border-blue-500 text-blue-500 rounded hover:bg-blue-50">Log In</button>
                    <button class="px-4 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600">Sign Up</button>
                </div>
            </div>
        </header>
    `;
}

// Home page
async function renderHomePage(container) {
    container.innerHTML = renderHeader() + '<div class="container mx-auto px-4 py-6"><div class="loading">Loading posts...</div></div>';
    
    try {
        console.log('Fetching posts from:', `${API_URL}/api/v1/posts`);
        const response = await fetch(`${API_URL}/api/v1/posts`);
        console.log('Response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Data received:', data);
        const posts = data.data?.items || data.data || [];
        
        console.log('Posts to render:', posts.length);
        
        if (posts.length === 0) {
            container.innerHTML = renderHeader() + `
                <div class="container mx-auto px-4 py-6">
                    <div class="bg-yellow-100 p-4 rounded">
                        <p>No posts found. API returned empty data.</p>
                        <pre>${JSON.stringify(data, null, 2)}</pre>
                    </div>
                </div>
            `;
            return;
        }
        
        const postsHTML = posts.map(post => `
            <div class="bg-white rounded-lg shadow p-6 mb-4 hover:shadow-lg transition-shadow">
                <div class="flex gap-4">
                    <div class="flex flex-col items-center">
                        <button class="text-gray-400 hover:text-blue-500">▲</button>
                        <span class="font-semibold">${post.score || 0}</span>
                        <button class="text-gray-400 hover:text-blue-500">▼</button>
                    </div>
                    <div class="flex-1">
                        <div class="text-sm text-gray-600 mb-1">
                            r/${post.community?.name || 'general'} • Posted by u/${post.author?.username || 'user'}
                        </div>
                        <h2 class="text-xl font-semibold mb-2">${post.title}</h2>
                        <p class="text-gray-700 mb-3">${post.content}</p>
                        <div class="flex gap-4 text-sm text-gray-600">
                            <button class="hover:text-blue-500">💬 ${post._count?.comments || 0} Comments</button>
                            <button class="hover:text-blue-500">🔗 Share</button>
                            <button class="hover:text-blue-500">🔖 Save</button>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
        
        container.innerHTML = renderHeader() + `
            <div class="container mx-auto px-4 py-6">
                <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div class="lg:col-span-2">
                        <h1 class="text-2xl font-bold mb-6">Hot Posts</h1>
                        ${postsHTML}
                    </div>
                    <div>
                        <div class="bg-white rounded-lg shadow p-6">
                            <h3 class="font-semibold mb-4">Popular Communities</h3>
                            <div class="space-y-2">
                                <div class="flex justify-between">
                                    <a href="#" class="text-blue-500 hover:underline">r/announcements</a>
                                    <span class="text-sm text-gray-500">15k members</span>
                                </div>
                                <div class="flex justify-between">
                                    <a href="#" class="text-blue-500 hover:underline">r/cryptocurrency</a>
                                    <span class="text-sm text-gray-500">98k members</span>
                                </div>
                                <div class="flex justify-between">
                                    <a href="#" class="text-blue-500 hover:underline">r/gaming</a>
                                    <span class="text-sm text-gray-500">45k members</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Error fetching posts:', error);
        container.innerHTML = renderHeader() + `<div class="container mx-auto px-4 py-6">
            <div class="text-red-500">Error loading posts: ${error.message}</div>
            <div class="text-sm text-gray-600 mt-2">API URL: ${API_URL}/api/v1/posts</div>
            <button onclick="location.reload()" class="mt-4 px-4 py-2 bg-blue-500 text-white rounded">Retry</button>
        </div>`;
    }
}

// Communities page
async function renderCommunitiesPage(container) {
    container.innerHTML = renderHeader() + '<div class="container mx-auto px-4 py-6"><div class="loading">Loading communities...</div></div>';
    
    try {
        const response = await fetch(`${API_URL}/api/v1/communities`);
        const data = await response.json();
        const communities = data.data?.items || [];
        
        const communitiesHTML = communities.map(comm => `
            <div class="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
                <h3 class="text-xl font-semibold mb-2">r/${comm.name}</h3>
                <p class="text-gray-600 mb-3">${comm.description || 'No description'}</p>
                <div class="flex justify-between items-center">
                    <span class="text-sm text-gray-500">${comm._count?.members || 0} members</span>
                    <button class="px-4 py-2 bg-blue-500 text-white rounded text-sm hover:bg-blue-600">Join</button>
                </div>
            </div>
        `).join('');
        
        container.innerHTML = renderHeader() + `
            <div class="container mx-auto px-4 py-6">
                <h1 class="text-2xl font-bold mb-6">All Communities</h1>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    ${communitiesHTML}
                </div>
            </div>
        `;
    } catch (error) {
        container.innerHTML = renderHeader() + '<div class="container mx-auto px-4 py-6"><div class="text-red-500">Error loading communities</div></div>';
    }
}

// Chat page
function renderChatPage(container) {
    container.innerHTML = renderHeader() + `
        <div class="flex h-[calc(100vh-64px)]">
            <!-- Server list -->
            <div class="w-20 bg-gray-900 flex flex-col items-center py-3 space-y-2">
                <div class="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold cursor-pointer hover:rounded-xl transition-all">C</div>
            </div>
            
            <!-- Channel sidebar -->
            <div class="w-60 bg-gray-800 text-white">
                <div class="p-4 border-b border-gray-700">
                    <h3 class="font-semibold">CRYB Community</h3>
                </div>
                <div class="p-2">
                    <div class="text-xs text-gray-400 uppercase mb-2">Text Channels</div>
                    <div class="px-2 py-1 hover:bg-gray-700 rounded cursor-pointer"># general</div>
                    <div class="px-2 py-1 hover:bg-gray-700 rounded cursor-pointer"># announcements</div>
                    <div class="px-2 py-1 hover:bg-gray-700 rounded cursor-pointer"># crypto-discussion</div>
                </div>
            </div>
            
            <!-- Chat area -->
            <div class="flex-1 bg-gray-700 flex flex-col">
                <div class="p-4 border-b border-gray-600 text-white">
                    <h3 class="font-semibold"># general</h3>
                </div>
                <div class="flex-1 p-4 overflow-y-auto">
                    <div class="mb-4">
                        <div class="flex items-start space-x-3">
                            <div class="w-10 h-10 bg-orange-500 rounded-full"></div>
                            <div>
                                <div class="text-white font-semibold">Admin <span class="text-xs text-gray-400">Today at 12:00 PM</span></div>
                                <p class="text-gray-300">Welcome to CRYB chat! This is where our community connects in real-time.</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="p-4 border-t border-gray-600">
                    <input type="text" placeholder="Message #general" class="w-full px-4 py-2 bg-gray-600 text-white rounded placeholder-gray-400">
                </div>
            </div>
            
            <!-- Member list -->
            <div class="w-60 bg-gray-800 text-white p-4">
                <div class="text-xs text-gray-400 uppercase mb-2">Online — 3</div>
                <div class="space-y-2">
                    <div class="flex items-center space-x-2">
                        <div class="w-8 h-8 bg-orange-500 rounded-full"></div>
                        <span>Admin</span>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', router);
window.addEventListener('popstate', router);

// Handle navigation
document.addEventListener('click', (e) => {
    if (e.target.tagName === 'A' && e.target.href.startsWith(window.location.origin)) {
        e.preventDefault();
        history.pushState(null, '', e.target.href);
        router();
    }
});