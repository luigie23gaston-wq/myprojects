// Laravel Echo Setup for WebSocket (Reverb) with Long Polling Fallback
// This file sets up real-time messaging with WebSocket support

// Check if Echo is available (requires Vite compilation)
let useWebSocket = false;
let echoChannel = null;

// Initialize WebSocket connection
function initializeWebSocket(userId) {
    try {
        // Check if Echo is loaded from Vite
        if (typeof window.Echo !== 'undefined' && window.Echo) {
            console.log('[WebSocket] Attempting to connect to Reverb server at ws://localhost:8080...');
            
            // Subscribe to private chat channel
            echoChannel = window.Echo.private(`chat.${userId}`);
            
            // Listen for new messages
            echoChannel.listen('.message.sent', (data) => {
                console.log('[WebSocket] New message received:', data);
                
                // Check if message is for current conversation
                if (data.sender_id === window.currentChatUserId) {
                    const senderData = {
                        username: data.sender.username,
                        image: data.sender.image,
                        initial: data.sender.firstname 
                            ? data.sender.firstname.charAt(0).toUpperCase() 
                            : data.sender.username.charAt(0).toUpperCase()
                    };
                    
                    // Append message to chat (defined in landing.js)
                    if (typeof window.appendMessage === 'function') {
                        window.appendMessage(data, false, senderData);
                    }
                    
                    // Update last message ID
                    if (data.id > window.lastMessageId) {
                        window.lastMessageId = data.id;
                    }
                }
                
                // Refresh conversations list (if function exists)
                if (typeof window.loadConversations === 'function') {
                    window.loadConversations();
                }
            });
            
            // Connection status handlers
            if (window.Echo.connector && window.Echo.connector.pusher) {
                window.Echo.connector.pusher.connection.bind('connected', () => {
                    console.log('[WebSocket] ✓ Connected to Reverb server');
                    useWebSocket = true;
                    
                    // Stop long polling if WebSocket is active
                    if (window.isPolling) {
                        console.log('[WebSocket] Stopping long polling (WebSocket active)');
                        window.isPolling = false;
                    }
                });
                
                window.Echo.connector.pusher.connection.bind('error', (err) => {
                    console.warn('[WebSocket] ✗ Connection error - Reverb may not be running');
                    console.warn('[WebSocket] To start Reverb: php artisan reverb:start');
                    useWebSocket = false;
                    
                    // Fallback to long polling
                    if (!window.isPolling && window.currentChatUserId) {
                        console.log('[WebSocket] Falling back to optimized long polling');
                        window.isPolling = true;
                        if (typeof window.pollForMessages === 'function') {
                            window.pollForMessages(window.lastMessageId);
                        }
                    }
                });
                
                window.Echo.connector.pusher.connection.bind('disconnected', () => {
                    console.warn('[WebSocket] Disconnected from server');
                    useWebSocket = false;
                    
                    // Fallback to long polling
                    if (!window.isPolling && window.currentChatUserId) {
                        console.log('[WebSocket] Falling back to optimized long polling');
                        window.isPolling = true;
                        if (typeof window.pollForMessages === 'function') {
                            window.pollForMessages(window.lastMessageId);
                        }
                    }
                });
                
                // Handle connection unavailable (Reverb not running)
                window.Echo.connector.pusher.connection.bind('unavailable', () => {
                    console.warn('[WebSocket] ✗ Reverb server unavailable at ws://localhost:8080');
                    console.warn('[WebSocket] Using optimized long polling instead');
                    useWebSocket = false;
                });
            }
            
            return true;
        } else {
            console.warn('[WebSocket] Echo not available, using long polling only');
            return false;
        }
    } catch (error) {
        console.error('[WebSocket] Initialization failed:', error.message);
        console.warn('[WebSocket] Using optimized long polling as fallback');
        return false;
    }
}

// Clean up WebSocket connection
function disconnectWebSocket() {
    if (echoChannel) {
        try {
            console.log('[WebSocket] Disconnecting channel');
            echoChannel.stopListening('.message.sent');
            window.Echo.leave(echoChannel.name);
            echoChannel = null;
        } catch (error) {
            console.error('[WebSocket] Disconnect error:', error);
        }
    }
}

// Export to window for access from landing.js
window.initializeWebSocket = initializeWebSocket;
window.disconnectWebSocket = disconnectWebSocket;
window.isWebSocketActive = () => useWebSocket;

console.log('[WebSocket] Echo setup loaded');
