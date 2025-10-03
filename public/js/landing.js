// Get CSRF token
const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute('content');

// Toast notification
const toast = document.getElementById('toast');

// Toast notification function
function showToast(message, type = 'success') {
    toast.textContent = message;
    toast.className = 'toast show';
    if (type === 'error') {
        toast.classList.add('error');
    }
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Prevent back button navigation
history.pushState(null, null, location.href);
window.onpopstate = function () {
    history.go(1);
};

// Landing page elements
const gearIcon = document.getElementById('gearIcon');
const dropdown = document.getElementById('dropdown');
const logoutLink = document.getElementById('logoutLink');
const logoutModal = document.getElementById('logoutModal');
const confirmLogout = document.getElementById('confirmLogout');
const cancelLogout = document.getElementById('cancelLogout');

// Dropdown toggle
gearIcon.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdown.classList.toggle('hidden');
});

// Close dropdown when clicking outside
document.addEventListener('click', () => {
    if (!dropdown.classList.contains('hidden')) {
        dropdown.classList.add('hidden');
    }
});

dropdown.addEventListener('click', (e) => {
    e.stopPropagation();
});

// Logout functionality
logoutLink.addEventListener('click', (e) => {
    e.preventDefault();
    dropdown.classList.add('hidden');
    logoutModal.classList.add('active');
});

cancelLogout.addEventListener('click', () => {
    logoutModal.classList.remove('active');
});

confirmLogout.addEventListener('click', () => {
    // Send logout request to server
    fetch('/logout', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': csrfToken
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            window.location.href = data.redirect;
        }
    })
    .catch(error => {
        console.error('Error:', error);
        window.location.href = '/';
    });
});

// Close modal when clicking outside
logoutModal.addEventListener('click', (e) => {
    if (e.target === logoutModal) {
        logoutModal.classList.remove('active');
    }
});

// Chat Application Functionality
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const messageArea = document.querySelector('.message-area');
const userItems = document.querySelectorAll('.user-item');
const sidebar = document.getElementById('sidebar');
const collapseBtn = document.getElementById('collapseBtn');
const sidebarToggle = document.getElementById('sidebarToggle');
const sidebarSearch = document.getElementById('sidebarSearch');
const chatSearchInput = document.getElementById('chatSearchInput');
const searchToggleBtn = document.getElementById('searchToggleBtn');

// Chat state
let currentChatUserId = null;
let currentChatUserData = null; // Store current contact's data (name, image, etc.)
let currentUserData = null; // Store logged-in user's data
let lastMessageId = 0;
let isPolling = false;

// Get current user data from the page
document.addEventListener('DOMContentLoaded', () => {
    const userProfileImg = document.querySelector('.user-profile-image img');
    const userProfilePlaceholder = document.querySelector('.user-profile-placeholder');
    const username = document.getElementById('displayUsername').textContent;
    
    currentUserData = {
        username: username,
        image: userProfileImg ? userProfileImg.src : null,
        initial: userProfilePlaceholder ? userProfilePlaceholder.textContent : username.charAt(0).toUpperCase()
    };
    
    // Apply saved appearance colors after DOM is loaded
    const savedSidebarBg = localStorage.getItem('sidebarBgColor');
    const savedChatBg = localStorage.getItem('chatBgColor');
    if (savedSidebarBg || savedChatBg) {
        applyAppearanceStyles(
            savedSidebarBg || '#ffffff',
            savedChatBg || '#f8f9fa'
        );
    }
});

// Sidebar search functionality - Search for users
sidebarSearch.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    
    // First filter existing conversations
    userItems.forEach(item => {
        const userName = item.querySelector('.user-name').textContent.toLowerCase();
        const lastMessage = item.querySelector('.last-message').textContent.toLowerCase();
        
        if (userName.includes(searchTerm) || lastMessage.includes(searchTerm)) {
            item.style.display = 'flex';
        } else {
            item.style.display = 'none';
        }
    });
    
    // If search term is at least 2 characters, search for new users
    if (searchTerm.length >= 2) {
        searchUsers(searchTerm);
    } else {
        // Clear search results
        const searchResults = document.getElementById('searchResults');
        if (searchResults) {
            searchResults.remove();
        }
    }
});

// Search for users in the database
function searchUsers(searchTerm) {
    fetch(`/api/chat/search?q=${encodeURIComponent(searchTerm)}`, {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
            'X-CSRF-TOKEN': csrfToken
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            displaySearchResults(data.users);
        }
    })
    .catch(error => {
        console.error('Search error:', error);
    });
}

// Display search results
function displaySearchResults(users) {
    // Remove existing search results
    let searchResults = document.getElementById('searchResults');
    if (searchResults) {
        searchResults.remove();
    }
    
    if (users.length === 0) return;
    
    // Create search results container
    searchResults = document.createElement('div');
    searchResults.id = 'searchResults';
    searchResults.className = 'search-results';
    
    users.forEach(user => {
        const resultItem = document.createElement('div');
        resultItem.className = 'search-result-item';
        
        const initial = user.firstname ? user.firstname.charAt(0).toUpperCase() : user.username.charAt(0).toUpperCase();
        const displayName = user.firstname && user.lastname ? `${user.firstname} ${user.lastname}` : user.username;
        
        resultItem.innerHTML = `
            <div class="user-avatar">
                ${user.image ? 
                    `<img src="/storage/${user.image}" alt="${displayName}">` :
                    `<div class="avatar-placeholder">${initial}</div>`
                }
            </div>
            <div class="user-info">
                <div class="user-name">${displayName}</div>
                <div class="user-email">${user.email}</div>
            </div>
            ${!user.has_conversation ? '<div class="add-icon">+</div>' : ''}
        `;
        
        resultItem.addEventListener('click', () => {
            if (!user.has_conversation) {
                addConversation(user.id, displayName, initial, user.image);
            } else {
                loadConversation(user.id);
            }
            searchResults.remove();
            sidebarSearch.value = '';
        });
        
        searchResults.appendChild(resultItem);
    });
    
    // Insert after search input
    sidebarSearch.parentElement.insertAdjacentElement('afterend', searchResults);
}

// Add conversation with a new user
function addConversation(userId, displayName, initial, userImage) {
    fetch('/api/chat/add-conversation', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': csrfToken
        },
        body: JSON.stringify({ contact_id: userId })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Store current chat user data
            currentChatUserData = {
                username: displayName,
                image: userImage ? `/storage/${userImage}` : null,
                initial: initial
            };
            
            // Update chat header with profile image
            document.querySelector('.contact-name').textContent = displayName;
            const contactAvatar = document.querySelector('.contact-avatar');
            if (userImage) {
                contactAvatar.innerHTML = `<img src="/storage/${userImage}" alt="${displayName}">`;
            } else {
                contactAvatar.innerHTML = `<div class="avatar-placeholder">${initial}</div>`;
            }
            
            // Load the conversation
            loadConversation(userId);
            // Reload conversations list
            loadConversations();
        }
    })
    .catch(error => {
        console.error('Add conversation error:', error);
    });
}

// Chat search toggle functionality
searchToggleBtn.addEventListener('click', () => {
    chatSearchInput.classList.toggle('hidden');
    searchToggleBtn.classList.toggle('active');
    
    if (!chatSearchInput.classList.contains('hidden')) {
        chatSearchInput.focus();
    } else {
        chatSearchInput.value = '';
        // Clear any search highlighting
        highlightSearchResults('');
    }
});

// Chat search functionality
chatSearchInput.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    highlightSearchResults(searchTerm);
});

// Function to highlight search results in messages
function highlightSearchResults(searchTerm) {
    const messages = messageArea.querySelectorAll('.message-text');
    
    messages.forEach(message => {
        const originalText = message.getAttribute('data-original') || message.textContent;
        
        if (!message.getAttribute('data-original')) {
            message.setAttribute('data-original', originalText);
        }
        
        if (searchTerm === '') {
            message.innerHTML = originalText;
            message.closest('.message').style.opacity = '1';
        } else {
            const regex = new RegExp(`(${searchTerm})`, 'gi');
            const highlightedText = originalText.replace(regex, '<mark style="background-color: #87ceeb; color: #fff; padding: 2px 4px; border-radius: 3px;">$1</mark>');
            message.innerHTML = highlightedText;
            
            // Dim messages that don't match
            if (originalText.toLowerCase().includes(searchTerm)) {
                message.closest('.message').style.opacity = '1';
            } else {
                message.closest('.message').style.opacity = '0.3';
            }
        }
    });
}

// Close chat search when clicking outside
document.addEventListener('click', (e) => {
    if (!chatSearchInput.classList.contains('hidden')) {
        if (!e.target.closest('.chat-search-container')) {
            chatSearchInput.classList.add('hidden');
            searchToggleBtn.classList.remove('active');
            chatSearchInput.value = '';
            highlightSearchResults('');
        }
    }
});

// Sidebar collapse functionality (Desktop)
collapseBtn.addEventListener('click', () => {
    sidebar.classList.toggle('collapsed');
    
    // Update button icon
    if (sidebar.classList.contains('collapsed')) {
        collapseBtn.textContent = '☰';
    } else {
        collapseBtn.textContent = '☰';
    }
});

// Sidebar toggle functionality (Mobile)
sidebarToggle.addEventListener('click', () => {
    sidebar.classList.toggle('active');
});

// Close sidebar when clicking outside on mobile
document.addEventListener('click', (e) => {
    if (window.innerWidth <= 599) {
        if (!sidebar.contains(e.target) && !sidebarToggle.contains(e.target)) {
            sidebar.classList.remove('active');
        }
    }
});

// Close sidebar when selecting a chat on mobile
userItems.forEach(item => {
    item.addEventListener('click', function() {
        if (window.innerWidth <= 599) {
            sidebar.classList.remove('active');
        }
    });
});

// Send message functionality
function sendMessage() {
    const messageText = messageInput.value.trim();
    
    if (messageText === '' || !currentChatUserId) return;
    
    // Disable send button and input to prevent duplicate sends
    sendBtn.disabled = true;
    messageInput.disabled = true;
    const originalBtnText = sendBtn.textContent;
    sendBtn.textContent = 'Sending...';
    
    // Send message to backend
    fetch('/api/chat/send', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': csrfToken
        },
        body: JSON.stringify({
            receiver_id: currentChatUserId,
            message: messageText
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Append message to UI
            appendMessage(data.message, true);
            
            // Clear input
            messageInput.value = '';
            
            // Update last message ID
            if (data.message.id > lastMessageId) {
                lastMessageId = data.message.id;
            }
        }
    })
    .catch(error => {
        console.error('Send message error:', error);
    })
    .finally(() => {
        // Re-enable send button and input
        sendBtn.disabled = false;
        messageInput.disabled = false;
        sendBtn.textContent = originalBtnText;
        messageInput.focus();
    });
}

// Append message to message area
function appendMessage(message, isOwn = false, senderData = null) {
    // Remove empty state if it exists
    const emptyState = messageArea.querySelector('.empty-state');
    if (emptyState) {
        emptyState.remove();
    }
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isOwn ? 'outgoing' : 'incoming'}`;
    
    // Handle timestamp - support both database format and current time
    let messageTime;
    if (message.created_at) {
        const date = new Date(message.created_at);
        // Check if date is valid
        if (!isNaN(date.getTime())) {
            messageTime = date.toLocaleTimeString('en-US', { 
                hour: 'numeric', 
                minute: '2-digit',
                hour12: true 
            });
        } else {
            // If invalid, use current time
            messageTime = new Date().toLocaleTimeString('en-US', { 
                hour: 'numeric', 
                minute: '2-digit',
                hour12: true 
            });
        }
    } else {
        // If no created_at, use current time
        messageTime = new Date().toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true 
        });
    }
    
    // Get user data for avatar
    let userData;
    if (isOwn) {
        // Current user's message
        userData = currentUserData;
    } else {
        // Contact's message - use senderData if provided, otherwise use currentChatUserData
        userData = senderData || currentChatUserData || {
            username: 'User',
            image: null,
            initial: 'U'
        };
    }
    
    // Create avatar HTML
    let avatarHTML;
    if (userData.image && !userData.image.includes('null')) {
        avatarHTML = `<img src="${userData.image}" alt="${userData.username || 'User'}">`;
    } else {
        avatarHTML = `<div class="message-avatar-placeholder">${userData.initial || 'U'}</div>`;
    }
    
    messageDiv.innerHTML = `
        <div class="message-avatar">
            ${avatarHTML}
        </div>
        <div class="message-content">
            <div class="message-bubble">
                <div class="message-text">${escapeHtml(message.message)}</div>
                <div class="message-timestamp">${messageTime}</div>
            </div>
        </div>
    `;
    
    messageArea.appendChild(messageDiv);
    messageArea.scrollTop = messageArea.scrollHeight;
}

// Show empty state in message area
function showEmptyState() {
    messageArea.innerHTML = `
        <div class="empty-state">
            <div class="empty-icon">💬</div>
            <div class="empty-text">You have no messages</div>
            <div class="empty-subtext">Start the conversation by sending a message</div>
        </div>
    `;
}

// Redis-based Long Polling - Only waits for notifications
function pollForMessages(lastId) {
    if (!isPolling) return;
    
    fetch(`/api/chat/poll?last_message_id=${lastId}`, {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
            'X-CSRF-TOKEN': csrfToken
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success && data.has_new_messages) {
            // New messages available - fetch them from database
            fetchAndDisplayMessages(lastId);
        } else {
            // Timeout - continue polling
            pollForMessages(data.latest_id || lastId);
        }
    })
    .catch(error => {
        console.error('Polling error:', error);
        // Retry after 2 seconds
        setTimeout(() => pollForMessages(lastId), 2000);
    });
}

// Fetch and display new messages (separate database query)
function fetchAndDisplayMessages(lastId) {
    fetch(`/api/chat/fetch-since?last_message_id=${lastId}`, {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
            'X-CSRF-TOKEN': csrfToken
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success && data.messages.length > 0) {
            // Display new messages
            data.messages.forEach(msg => {
                // Only show messages for current chat
                if (msg.sender_id === currentChatUserId) {
                    // Prepare sender data
                    const senderData = msg.sender ? {
                        username: msg.sender.username,
                        image: msg.sender.image ? `/storage/${msg.sender.image}` : null,
                        initial: msg.sender.firstname ? msg.sender.firstname.charAt(0).toUpperCase() : msg.sender.username.charAt(0).toUpperCase()
                    } : null;
                    
                    appendMessage(msg, false, senderData);
                }
            });
            
            // Update last message ID
            if (data.latest_id > lastMessageId) {
                lastMessageId = data.latest_id;
            }
        }
        
        // Restart polling with the latest ID
        pollForMessages(data.latest_id || lastId);
    })
    .catch(error => {
        console.error('Fetch messages error:', error);
        // Continue polling even if fetch fails
        pollForMessages(lastId);
    });
}

// Load conversation messages
function loadConversation(userId) {
    currentChatUserId = userId;
    
    fetch(`/api/chat/messages/${userId}`, {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
            'X-CSRF-TOKEN': csrfToken
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Clear message area
            messageArea.innerHTML = '';
            
            // Check if there are messages
            if (data.messages.length === 0) {
                // Show empty state
                showEmptyState();
            } else {
                // Display messages
                data.messages.forEach(msg => {
                    const isOwn = msg.sender_id !== userId;
                    // No sender data needed here as we already have currentChatUserData
                    appendMessage(msg, isOwn);
                    
                    // Update last message ID
                    if (msg.id > lastMessageId) {
                        lastMessageId = msg.id;
                    }
                });
            }
            
            // Start polling if not already polling
            if (!isPolling) {
                isPolling = true;
                pollForMessages(lastMessageId);
            }
        }
    })
    .catch(error => {
        console.error('Load messages error:', error);
    });
}

// Load conversations list
function loadConversations() {
    fetch('/api/chat/conversations', {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
            'X-CSRF-TOKEN': csrfToken
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            displayConversations(data.conversations);
        }
    })
    .catch(error => {
        console.error('Load conversations error:', error);
    });
}

// Display conversations in sidebar
function displayConversations(conversations) {
    const chatList = document.querySelector('.chat-list');
    chatList.innerHTML = '';
    
    // Check if there are no conversations
    if (conversations.length === 0) {
        chatList.innerHTML = `
            <div class="no-conversations">
                <div class="no-conversations-icon">👥</div>
                <div class="no-conversations-text">No conversations yet</div>
                <div class="no-conversations-subtext">Search for users to start chatting</div>
            </div>
        `;
        return;
    }
    
    conversations.forEach(conv => {
        const userItem = document.createElement('div');
        userItem.className = 'user-item';
        userItem.dataset.userId = conv.id;
        
        const initial = conv.firstname ? conv.firstname.charAt(0).toUpperCase() : conv.username.charAt(0).toUpperCase();
        const displayName = conv.firstname && conv.lastname ? `${conv.firstname} ${conv.lastname}` : conv.username;
        
        userItem.innerHTML = `
            <div class="user-avatar">
                ${conv.image ? 
                    `<img src="/storage/${conv.image}" alt="${displayName}">` :
                    `<div class="avatar-placeholder">${initial}</div>`
                }
            </div>
            <div class="user-details">
                <div class="user-header">
                    <span class="user-name">${displayName}</span>
                    <span class="message-time">${conv.last_message_time || ''}</span>
                </div>
                <div class="last-message">${conv.last_message || 'No messages yet'}</div>
            </div>
            ${conv.unread_count > 0 ? `<span class="unread-badge">${conv.unread_count}</span>` : ''}
        `;
        
        userItem.addEventListener('click', function() {
            // Remove active class from all items
            document.querySelectorAll('.user-item').forEach(i => i.classList.remove('active'));
            
            // Add active class to clicked item
            this.classList.add('active');
            
            // Store current chat user data
            currentChatUserData = {
                username: conv.username,
                image: conv.image ? `/storage/${conv.image}` : null,
                initial: initial
            };
            
            // Update chat header
            document.querySelector('.contact-name').textContent = displayName;
            const contactAvatar = document.querySelector('.contact-avatar');
            if (conv.image) {
                contactAvatar.innerHTML = `<img src="/storage/${conv.image}" alt="${displayName}">`;
            } else {
                contactAvatar.innerHTML = `<div class="avatar-placeholder">${initial}</div>`;
            }
            
            // Load conversation
            loadConversation(conv.id);
            
            // Remove unread badge
            const badge = this.querySelector('.unread-badge');
            if (badge) {
                badge.remove();
            }
            
            // Close sidebar on mobile
            if (window.innerWidth <= 599) {
                sidebar.classList.remove('active');
            }
        });
        
        chatList.appendChild(userItem);
    });
    
    // Add UserChat element if there are conversations
    if (conversations.length > 0) {
        const userChatElement = document.createElement('div');
        userChatElement.className = 'user-chat';
        userChatElement.innerHTML = `
            <div class="user-chat-icon">💬</div>
            <div class="user-chat-info">
                <div class="user-chat-title">Messages</div>
                <div class="user-chat-subtitle">You have messages</div>
            </div>
        `;
        
        userChatElement.addEventListener('click', function() {
            // Show empty state with "You have Messages" text
            messageArea.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">💬</div>
                    <div class="empty-text">You have Messages.</div>
                    <div class="empty-subtext">Select a conversation to continue chatting</div>
                </div>
            `;
            
            // Clear current chat user data
            currentChatUserId = null;
            currentChatUserData = null;
            
            // Update chat header to show no user selected
            document.querySelector('.contact-name').textContent = 'Select a conversation';
            document.querySelector('.contact-avatar').innerHTML = '<div class="avatar-placeholder">💬</div>';
            
            // Remove active class from all conversation items
            document.querySelectorAll('.user-item').forEach(item => item.classList.remove('active'));
        });
        
        chatList.appendChild(userChatElement);
    }
}

// Initialize conversations on page load
document.addEventListener('DOMContentLoaded', () => {
    loadConversations();
});

// Helper function to escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Send button click
sendBtn.addEventListener('click', sendMessage);

// Enter key to send
messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

// User item click to switch chats
userItems.forEach(item => {
    item.addEventListener('click', function() {
        // Remove active class from all items
        userItems.forEach(i => i.classList.remove('active'));
        
        // Add active class to clicked item
        this.classList.add('active');
        
        // Get user data
        const userId = this.dataset.userId;
        const userName = this.querySelector('.user-name').textContent;
        
        // Update chat header
        document.querySelector('.contact-name').textContent = userName;
        
        const avatarElement = this.querySelector('.user-avatar').cloneNode(true);
        document.querySelector('.contact-avatar').innerHTML = avatarElement.innerHTML;
        
        // Load conversation
        if (userId) {
            loadConversation(userId);
        }
        
        // Remove unread badge if exists
        const badge = this.querySelector('.unread-badge');
        if (badge) {
            badge.remove();
        }
        
        // Close sidebar on mobile
        if (window.innerWidth <= 599) {
            sidebar.classList.remove('active');
        }
    });
});

// Settings Dropdown Functionality
const settingsBtn = document.getElementById('settingsBtn');
const settingsDropdown = document.getElementById('settingsDropdown');
const statusModal = document.getElementById('statusModal');
const bubbleColorModal = document.getElementById('bubbleColorModal');
const appearanceModal = document.getElementById('appearanceModal');
const trashModal = document.getElementById('trashModal');

// Toggle settings dropdown
settingsBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    settingsDropdown.classList.toggle('hidden');
});

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
    if (!settingsDropdown.classList.contains('hidden') && 
        !settingsDropdown.contains(e.target) && 
        e.target !== settingsBtn) {
        settingsDropdown.classList.add('hidden');
    }
});

// Handle dropdown item clicks
document.querySelectorAll('.settings-dropdown-item').forEach(item => {
    item.addEventListener('click', (e) => {
        const action = e.currentTarget.dataset.action;
        settingsDropdown.classList.add('hidden');
        
        switch(action) {
            case 'status':
                statusModal.classList.add('active');
                break;
            case 'bubble-color':
                bubbleColorModal.classList.add('active');
                break;
            case 'appearance':
                appearanceModal.classList.add('active');
                break;
            case 'trash':
                trashModal.classList.add('active');
                break;
        }
    });
});

// Status Modal Functionality
const statusOptions = document.querySelectorAll('.status-option');
const cancelStatus = document.getElementById('cancelStatus');
const contactStatus = document.getElementById('contactStatus');
const userStatusIndicator = document.getElementById('userStatusIndicator');

let currentStatus = 'online'; // Default status

// Load saved status from localStorage
const savedStatus = localStorage.getItem('userStatus') || 'online';
const savedStatusText = localStorage.getItem('userStatusText') || '🟢 Online';
currentStatus = savedStatus;
if (userStatusIndicator) {
    userStatusIndicator.textContent = savedStatusText;
}

statusOptions.forEach(option => {
    option.addEventListener('click', (e) => {
        // Remove selected class from all options
        statusOptions.forEach(opt => opt.classList.remove('selected'));
        
        // Add selected class to clicked option
        e.currentTarget.classList.add('selected');
        
        // Get the selected status
        const status = e.currentTarget.dataset.status;
        currentStatus = status;
        
        // Get the status text with emoji
        const statusText = e.currentTarget.textContent.trim();
        
        // Save to localStorage
        localStorage.setItem('userStatus', status);
        localStorage.setItem('userStatusText', statusText);
        
        // Update the navbar status indicator
        if (userStatusIndicator) {
            userStatusIndicator.textContent = statusText;
        }
        
        // Update the contact status display
        contactStatus.textContent = `Status: ${statusText}`;
        
        // Show toast notification
        showToast(`Status changed to ${statusText}`);
        
        // Close modal
        setTimeout(() => {
            statusModal.classList.remove('active');
        }, 300);
    });
});

cancelStatus.addEventListener('click', () => {
    statusModal.classList.remove('active');
});

// Close status modal when clicking outside
statusModal.addEventListener('click', (e) => {
    if (e.target === statusModal) {
        statusModal.classList.remove('active');
    }
});

// Bubble Color Modal Functionality
const bubbleBgColor = document.getElementById('bubbleBgColor');
const bubbleTextColor = document.getElementById('bubbleTextColor');
const applyBubbleColors = document.getElementById('applyBubbleColors');
const cancelBubbleColors = document.getElementById('cancelBubbleColors');

// Load saved bubble colors from localStorage
const savedBubbleBg = localStorage.getItem('bubbleBgColor') || '#87ceeb';
const savedBubbleText = localStorage.getItem('bubbleTextColor') || '#ffffff';
bubbleBgColor.value = savedBubbleBg;
bubbleTextColor.value = savedBubbleText;

// Apply saved colors on page load
applyBubbleColorStyles(savedBubbleBg, savedBubbleText);

applyBubbleColors.addEventListener('click', () => {
    const bgColor = bubbleBgColor.value;
    const textColor = bubbleTextColor.value;
    
    // Save to localStorage
    localStorage.setItem('bubbleBgColor', bgColor);
    localStorage.setItem('bubbleTextColor', textColor);
    
    // Apply the colors
    applyBubbleColorStyles(bgColor, textColor);
    
    // Show toast notification
    showToast('Bubble colors updated successfully!');
    
    // Close modal
    bubbleColorModal.classList.remove('active');
});

function applyBubbleColorStyles(bgColor, textColor) {
    // Create or update style element
    let styleEl = document.getElementById('bubble-color-style');
    if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = 'bubble-color-style';
        document.head.appendChild(styleEl);
    }
    
    styleEl.textContent = `
        .message.outgoing .message-bubble {
            background: ${bgColor} !important;
            color: ${textColor} !important;
        }
    `;
}

cancelBubbleColors.addEventListener('click', () => {
    bubbleColorModal.classList.remove('active');
});

// Close bubble color modal when clicking outside
bubbleColorModal.addEventListener('click', (e) => {
    if (e.target === bubbleColorModal) {
        bubbleColorModal.classList.remove('active');
    }
});

// Appearance Modal Functionality
const sidebarBgColor = document.getElementById('sidebarBgColor');
const chatBgColor = document.getElementById('chatBgColor');
const applyAppearance = document.getElementById('applyAppearance');
const cancelAppearance = document.getElementById('cancelAppearance');

// Load saved appearance colors from localStorage and set color picker values
const savedSidebarBg = localStorage.getItem('sidebarBgColor') || '#ffffff';
const savedChatBg = localStorage.getItem('chatBgColor') || '#f8f9fa';
sidebarBgColor.value = savedSidebarBg;
chatBgColor.value = savedChatBg;

applyAppearance.addEventListener('click', () => {
    const sidebarColor = sidebarBgColor.value;
    const chatColor = chatBgColor.value;
    
    // Save to localStorage
    localStorage.setItem('sidebarBgColor', sidebarColor);
    localStorage.setItem('chatBgColor', chatColor);
    
    // Apply the colors
    applyAppearanceStyles(sidebarColor, chatColor);
    
    // Show toast notification
    showToast('Appearance updated successfully!');
    
    // Close modal
    appearanceModal.classList.remove('active');
});

function applyAppearanceStyles(sidebarColor, chatColor) {
    // Create or update style element for appearance customization
    let styleEl = document.getElementById('appearance-style');
    if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = 'appearance-style';
        document.head.appendChild(styleEl);
    }
    
    // Use CSS to override with !important
    styleEl.textContent = `
        #sidebar {
            background-color: ${sidebarColor} !important;
        }
        #sidebar .sidebar-header,
        #sidebar .search-container,
        #sidebar .chat-list,
        #sidebar .user-chat {
            background-color: ${sidebarColor} !important;
        }
        .message-area {
            background-color: ${chatColor} !important;
        }
    `;
}

cancelAppearance.addEventListener('click', () => {
    appearanceModal.classList.remove('active');
});

// Close appearance modal when clicking outside
appearanceModal.addEventListener('click', (e) => {
    if (e.target === appearanceModal) {
        appearanceModal.classList.remove('active');
    }
});

// Trash Modal Functionality
const confirmTrash = document.getElementById('confirmTrash');
const cancelTrash = document.getElementById('cancelTrash');

confirmTrash.addEventListener('click', () => {
    if (currentChatUserId) {
        // Here you would make an API call to delete the conversation
        // For now, we'll just clear the message area and show empty state
        const messageArea = document.querySelector('.message-area');
        messageArea.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">💬</div>
                <div class="empty-text">Conversation Deleted</div>
                <div class="empty-subtext">The conversation has been removed</div>
            </div>
        `;
        
        // Reset current chat
        currentChatUserId = null;
        currentChatUserData = null;
        
        // Update header
        document.querySelector('.contact-name').textContent = '--------';
        document.querySelector('.contact-avatar').innerHTML = '<div class="avatar-placeholder">J</div>';
        
        // Reload conversations
        loadConversations();
    }
    
    trashModal.classList.remove('active');
});

cancelTrash.addEventListener('click', () => {
    trashModal.classList.remove('active');
});

// Close trash modal when clicking outside
trashModal.addEventListener('click', (e) => {
    if (e.target === trashModal) {
        trashModal.classList.remove('active');
    }
});

