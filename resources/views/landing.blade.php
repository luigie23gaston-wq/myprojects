<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="csrf-token" content="{{ csrf_token() }}">
        <title>YlaChat - Chat</title>
        <link rel="icon" type="image/png" href="{{ asset('YlaChat.png') }}">
        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=figtree:400,600&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="{{ asset('css/landing.css') }}">
    </head>
    <body>
        <!-- Landing Page -->
        <div class="landing-page">
            <nav class="navbar">
                <div class="navbar-left">
                    <div class="navbar-logo">
                        <img src="{{ asset('YlaChat.png') }}" alt="YlaChat">
                    </div>
                    <a href="{{ route('landing') }}" class="nav-item">Home</a>
                </div>
                <div class="user-menu">
                    <span class="user-status-indicator" id="userStatusIndicator">🟢 Online</span>
                    <div class="user-profile-image">
                        @if(Auth::user()->image)
                            <img src="{{ asset('storage/' . Auth::user()->image) }}" alt="Profile">
                        @else
                            <div class="user-profile-placeholder">{{ strtoupper(substr(Auth::user()->firstname, 0, 1)) }}</div>
                        @endif
                    </div>
                    <span class="username" id="displayUsername">{{ Auth::user()->username }}</span>
                    <div style="position: relative;">
                        <span class="gear-icon" id="gearIcon">⚙️</span>
                        <div class="dropdown hidden" id="dropdown">
                            <a href="{{ route('profile') }}">Profile</a>
                            <a href="#" id="logoutLink">Logout</a>
                        </div>
                    </div>
                </div>
            </nav>

            <!-- Chat Application Container -->
            <div class="chat-container">
                <!-- Sidebar Toggle Button (Mobile) -->
                <button class="sidebar-toggle" id="sidebarToggle">
                    <span class="hamburger-icon">☰</span>
                </button>

                <!-- Left Panel: Sidebar -->
                <div class="sidebar" id="sidebar">
                    <div class="sidebar-header">
                        <h2>Chats</h2>
                        <div class="header-actions">
                            <button class="collapse-btn" id="collapseBtn">☰</button>
                        </div>
                    </div>
                    <div class="search-container">
                        <input type="text" class="search-input" placeholder="Search chats..." id="sidebarSearch">
                        <span class="search-icon">🔍</span>
                    </div>
                    <div class="chat-list">
                        <!-- Conversations will be loaded dynamically via JavaScript -->
                    </div>
                </div>

                <!-- Right Panel: Main Chat -->
                <div class="main-chat">
                    <!-- Chat Header -->
                    <div class="chat-header">
                        <div class="contact-info">
                            <div class="contact-avatar">
                                <div class="avatar-placeholder">💬</div>
                            </div>
                            <div class="contact-details">
                                <div class="contact-name">Select a conversation</div>
                                <div class="contact-status" id="contactStatus">🟢 Online</div>
                            </div>
                        </div>
                        <div class="chat-actions">
                            <div class="chat-search-container" id="chatSearchContainer">
                                <input type="text" class="chat-search-input hidden" placeholder="Search messages..." id="chatSearchInput">
                                <button class="action-btn search-toggle-btn" id="searchToggleBtn">🔍</button>
                            </div>
                            <div class="settings-dropdown-container">
                                <button class="action-btn" id="settingsBtn">⋮</button>
                                <div class="settings-dropdown hidden" id="settingsDropdown">
                                    <div class="settings-dropdown-item" data-action="status">📊 Status</div>
                                    <div class="settings-dropdown-item" data-action="bubble-color">🎨 Bubble Color</div>
                                    <div class="settings-dropdown-item" data-action="appearance">🌈 Appearance</div>
                                    <div class="settings-dropdown-item danger" data-action="trash">🗑️ Trash</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Message Area -->
                    <div class="message-area">
                        <div class="empty-state">
                            <div class="empty-icon">💬</div>
                            <div class="empty-text">Select a conversation to start chatting</div>
                            <div class="empty-subtext">Choose from your existing conversations or search for new users</div>
                        </div>
                    </div>

                    <!-- Message Input -->
                    <div class="message-input">
                        <button class="attach-btn">📎</button>
                        <input type="text" class="input-field" placeholder="Type a message..." id="messageInput">
                        <button class="send-btn" id="sendBtn">Send</button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Logout Confirmation Modal -->
        <div class="modal" id="logoutModal">
            <div class="modal-content">
                <h3>Are you sure you want to logout?</h3>
                <div class="modal-buttons">
                    <button class="btn-confirm" id="confirmLogout">Yes</button>
                    <button class="btn-cancel" id="cancelLogout">No</button>
                </div>
            </div>
        </div>

        <!-- Status Modal -->
        <div class="modal" id="statusModal">
            <div class="modal-content">
                <h3>Select Your Status</h3>
                <div class="status-options">
                    <div class="status-option" data-status="online">🟢 Online</div>
                    <div class="status-option" data-status="busy">🔴 Busy</div>
                    <div class="status-option" data-status="offline">⚫ Offline</div>
                </div>
                <div class="modal-buttons">
                    <button class="btn-cancel" id="cancelStatus">Cancel</button>
                </div>
            </div>
        </div>

        <!-- Bubble Color Modal -->
        <div class="modal" id="bubbleColorModal">
            <div class="modal-content">
                <h3>Customize Bubble Colors</h3>
                <div class="modal-form-group">
                    <label for="bubbleBgColor">Background Color</label>
                    <input type="color" id="bubbleBgColor" value="#87ceeb">
                </div>
                <div class="modal-form-group">
                    <label for="bubbleTextColor">Text Color</label>
                    <input type="color" id="bubbleTextColor" value="#ffffff">
                </div>
                <div class="modal-buttons">
                    <button class="btn-confirm" id="applyBubbleColors">Apply</button>
                    <button class="btn-cancel" id="cancelBubbleColors">Cancel</button>
                </div>
            </div>
        </div>

        <!-- Appearance Modal -->
        <div class="modal" id="appearanceModal">
            <div class="modal-content">
                <h3>Customize Appearance</h3>
                <div class="modal-form-group">
                    <label for="sidebarBgColor">Sidebar Background Color</label>
                    <input type="color" id="sidebarBgColor" value="#ffffff">
                </div>
                <div class="modal-form-group">
                    <label for="chatBgColor">Chat Area Background Color</label>
                    <input type="color" id="chatBgColor" value="#f8f9fa">
                </div>
                <div class="modal-buttons">
                    <button class="btn-confirm" id="applyAppearance">Apply</button>
                    <button class="btn-cancel" id="cancelAppearance">Cancel</button>
                </div>
            </div>
        </div>

        <!-- Trash Confirmation Modal -->
        <div class="modal" id="trashModal">
            <div class="modal-content">
                <h3>Delete Conversation?</h3>
                <p>Are you sure you want to delete this conversation? This action cannot be undone.</p>
                <div class="modal-buttons">
                    <button class="btn-danger" id="confirmTrash">Delete</button>
                    <button class="btn-cancel" id="cancelTrash">Cancel</button>
                </div>
            </div>
        </div>

        <!-- Toast Notification -->
        <div class="toast" id="toast"></div>

        <!-- Vite Assets for WebSocket (Laravel Echo) -->
        @vite(['resources/js/app.js'])
        
        <!-- Echo Setup for WebSocket -->
        <script src="{{ asset('js/echo-setup.js') }}"></script>
        
        <!-- Main Landing JS -->
        <script src="{{ asset('js/landing.js') }}"></script>
        
        <!-- Initialize WebSocket for current user -->
        <script>
            // Initialize WebSocket connection for authenticated user
            const currentAuthUserId = {{ Auth::id() }};
            
            document.addEventListener('DOMContentLoaded', function() {
                // Try to initialize WebSocket
                const wsInitialized = initializeWebSocket(currentAuthUserId);
                
                if (!wsInitialized) {
                    console.log('[App] WebSocket not available, using optimized long polling');
                }
            });
        </script>
    </body>
</html>
