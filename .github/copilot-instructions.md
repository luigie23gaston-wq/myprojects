# Copilot Instructions for Laravel Chat Application

## Project Overview
This is a Laravel 10 application (PHP 8.1+) with Vite-powered frontend assets. The project uses a hybrid approach: Laravel Blade views with vanilla JavaScript/CSS for interactive real-time chat functionality, rather than a separate SPA framework.

## Architecture & Structure

### Frontend Pattern: External CSS & JS Files
- **Critical Convention**: CSS and JavaScript are separated into external files in `public/css/` and `public/js/`
- Link CSS files in the `<head>` using: `<link rel="stylesheet" href="{{ asset('css/filename.css') }}">`
- Link JS files before closing `</body>` using: `<script src="{{ asset('js/filename.js') }}"></script>`
- Favicon in all pages: `<link rel="icon" type="image/png" href="{{ asset('YlaChat.png') }}">`
- Views use vanilla JavaScript with modern DOM manipulation, not jQuery or frontend frameworks
- Always include CSRF token meta tag: `<meta name="csrf-token" content="{{ csrf_token() }}">`

### Key File Locations
```
resources/views/
  ├── welcome.blade.php   # Login/Register page (HTML only)
  ├── landing.blade.php   # Chat interface with sidebar, message area, settings
  └── profile.blade.php   # Profile page with image upload & editing

public/css/
  ├── auth.css           # Authentication page styles + toast notifications
  ├── landing.css        # Chat interface styles + navbar + modals + responsive design
  └── profile.css        # Profile page styles + navbar + modals

public/js/
  ├── auth.js            # Authentication logic with fetch API calls
  ├── landing.js         # Chat logic: messaging, long polling, settings, localStorage
  └── profile.js         # Profile logic with image upload & history

app/Http/Controllers/
  ├── AuthController.php      # Handles login, register, logout
  ├── ProfileController.php   # Handles profile operations
  ├── ChatController.php      # Message CRUD, conversations, search
  └── LongPollController.php  # Cache/Redis-based polling (0 DB queries in loop)

app/Services/
  └── MessageService.php      # Centralized messaging with Cache notifications

app/Models/
  ├── User.php               # username, firstname, lastname, email, password, image
  ├── Message.php            # sender_id, receiver_id, message, created_at
  ├── Conversation.php       # user_id, contact_id, last_message_at
  └── ImageHistory.php       # user_id, image_path, created_at

database/
  ├── database.sqlite        # SQLite database file (primary data storage)
  └── migrations/            # Schema definitions
```

## Chat Messaging Architecture (Cache/Redis-Based Long Polling)

### Critical Performance Pattern
**Never poll the database directly** - use Cache/Redis as notification layer:

```php
// ❌ WRONG - Database polling (heavy load)
while ($timeout) {
    $messages = Message::where(...)->get(); // 10+ queries per cycle!
    if ($messages->isNotEmpty()) return $messages;
    sleep(1);
}

// ✅ CORRECT - Cache/Redis notification polling (LongPollController.php)
while ($timeout) {
    $latestId = $this->messageService->checkNotification($currentUserId);
    if ($latestId !== null) {
        $this->messageService->clearNotification($currentUserId);
        return ['has_new_messages' => true, 'new_messages_since_id' => $lastMessageId];
    }
    sleep(1);
}
```

### MessageService Pattern
**Always use MessageService** for sending messages - it automatically handles Cache notifications:

```php
// In Controller
use App\Services\MessageService;

public function sendMessage(Request $request, MessageService $messageService)
{
    $message = $messageService->sendMessage(
        Auth::id(),
        $request->receiver_id,
        $request->message
    );
    // MessageService automatically sets Cache notification for receiver
    return response()->json(['success' => true, 'message' => $message]);
}
```

### Frontend Long Polling Pattern (landing.js)
Separated "wait loop" from "data fetch":

```javascript
// 1. Lightweight polling - checks Cache only (no DB queries)
function pollForMessages(lastId) {
    fetch(`/api/chat/poll?last_message_id=${lastId}`)
        .then(response => response.json())
        .then(data => {
            if (data.success && data.has_new_messages) {
                fetchAndDisplayMessages(lastId); // Separate DB query
            } else {
                pollForMessages(data.latest_id || lastId); // Continue polling
            }
        });
}

// 2. Actual data fetch - only when notified
function fetchAndDisplayMessages(lastId) {
    fetch(`/api/chat/fetch-since?last_message_id=${lastId}`)
        .then(response => response.json())
        .then(data => {
            data.messages.forEach(msg => appendMessage(msg, false, senderData));
            pollForMessages(data.latest_id || lastId); // Resume polling
        });
}
```

## Chat Interface Features (landing.blade.php)

### User Customization with localStorage Persistence
All settings persist across page reloads using localStorage:

1. **User Status** (`userStatusIndicator`)
   - Options: 🟢 Online, 🔴 Busy, ⚫ Offline
   - Stored: `localStorage.getItem('userStatus')`
   - Displayed in navbar left of profile image

2. **Bubble Color Customization** (`bubbleColorModal`)
   - Background color and text color pickers
   - Applied with `!important` via dynamic `<style>` injection
   - Stored: `localStorage.getItem('bubbleBgColor')`, `bubbleTextColor`

3. **Appearance Customization** (`appearanceModal`)
   - Sidebar and chat area background colors
   - Applied using `setProperty('background', color, 'important')`
   - Must set both `background` and `background-color` to override CSS shorthand
   - Stored: `localStorage.getItem('sidebarBgColor')`, `chatBgColor`

### Settings Dropdown Pattern
```javascript
// Settings button with dropdown
const settingsDropdown = document.getElementById('settingsDropdown');
settingsBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    settingsDropdown.classList.toggle('hidden');
});

// Close on outside click
document.addEventListener('click', (e) => {
    if (!settingsDropdown.contains(e.target) && e.target !== settingsBtn) {
        settingsDropdown.classList.add('hidden');
    }
});
```

### Message Display Pattern
- **Alignment**: Incoming (left), Outgoing (right) - never centered
- **Width**: `max-width: min(800px, 85%)` with `min-width: 280px` for ~30 characters
- **Avatars**: 32px circular, gradient placeholders for missing images
- **Responsive**: Mobile uses `max-width: 90%`, `min-width: 200px`

```javascript
function appendMessage(message, isOwn, senderData) {
    const messageEl = document.createElement('div');
    messageEl.className = `message ${isOwn ? 'outgoing' : 'incoming'}`;
    
    const avatar = senderData.image 
        ? `<img src="/storage/${senderData.image}" alt="${senderData.username}">`
        : `<div class="message-avatar-placeholder">${senderData.initial}</div>`;
    
    messageEl.innerHTML = `
        <div class="message-avatar">${avatar}</div>
        <div class="message-content">
            <div class="message-bubble">
                <div class="message-text">${escapeHtml(message.message)}</div>
                <div class="message-timestamp">${formatTime(message.created_at)}</div>
            </div>
        </div>
    `;
    messageArea.appendChild(messageEl);
}
```

## State Management Pattern
- **No state library** - pure DOM manipulation with vanilla JavaScript
- **localStorage** for user preferences (status, colors, appearance)
- **Global variables** for chat state: `currentChatUserId`, `currentChatUserData`, `lastMessageId`, `isPolling`
- **CSS classes** for UI state: `.hidden`, `.active`, `.show`, `.selected`
- **Event delegation** for dynamically generated content (conversation list, message search)

## Navbar Pattern (All Authenticated Pages)
```blade
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
        <span class="username">{{ Auth::user()->username }}</span>
        <div style="position: relative;">
            <span class="gear-icon" id="gearIcon">⚙️</span>
            <div class="dropdown hidden" id="dropdown">
                <a href="{{ route('profile') }}">Profile</a>
                <a href="#" id="logoutLink">Logout</a>
            </div>
        </div>
    </div>
</nav>
```

## Modal Pattern
All modals use consistent structure with backdrop click-to-close:

```javascript
// Show modal
statusModal.classList.add('active');

// Hide on backdrop click
statusModal.addEventListener('click', (e) => {
    if (e.target === statusModal) {
        statusModal.classList.remove('active');
    }
});

// CSS
.modal {
    display: none;
    position: fixed;
    z-index: 2000;
    background-color: rgba(0, 0, 0, 0.8);
}
.modal.active { display: flex; }
```

### Modal Types
- **Logout Confirmation**: Simple yes/no
- **Status Selection**: 3 status options with selection state
- **Bubble Color**: 2 color pickers with apply/cancel
- **Appearance**: 2 color pickers for sidebar/chat backgrounds
- **Trash Confirmation**: Delete conversation with danger styling

## Authentication Flow
- **Middleware**: `guest` (redirect if authenticated), `auth` (redirect if not), `prevent.back` (PreventBackHistory - cache control headers)
- **Login/Register**: AJAX with fetch API, toast notifications, button state changes
- **Session**: Laravel session management with CSRF protection
- **Back button prevention**: `history.pushState()` + `window.onpopstate` in all authenticated pages + server-side cache headers

### Route Groups Pattern
```php
// Guest routes
Route::middleware(['guest', 'prevent.back'])->group(function () {
    Route::get('/', [AuthController::class, 'showLogin'])->name('login');
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
});

// Authenticated routes
Route::middleware(['auth', 'prevent.back'])->group(function () {
    Route::get('/landing', [AuthController::class, 'showLanding'])->name('landing');
    Route::get('/profile', [ProfileController::class, 'show'])->name('profile');
    Route::post('/logout', [AuthController::class, 'logout']);
    // Profile endpoints
    Route::post('/profile/upload-image', [ProfileController::class, 'uploadImage']);
    Route::post('/profile/update-info', [ProfileController::class, 'updateInfo']);
    Route::get('/profile/image-history', [ProfileController::class, 'getImageHistory']);
    // Chat endpoints
    Route::get('/api/chat/search', [ChatController::class, 'searchUsers']);
    Route::get('/api/chat/conversations', [ChatController::class, 'getConversations']);
    Route::get('/api/chat/messages/{userId}', [ChatController::class, 'getMessages']);
    Route::post('/api/chat/send', [ChatController::class, 'sendMessage']);
    Route::get('/api/chat/fetch-since', [ChatController::class, 'fetchMessagesSince']);
    Route::get('/api/chat/poll', [LongPollController::class, 'fetchNewMessages']);
});
```

## UI Design System
- **Colors**: Green (#28a745), Sky Blue (#87ceeb), Dark Gray (#4a4a4a), Black (#2a2a2a)
- **Gradients**: `linear-gradient(135deg, #28a745, #87ceeb)` for backgrounds
- **Cards**: Floating with `box-shadow`, `border-radius: 10-15px`
- **Buttons**: Gradient on primary, solid on secondary, `:disabled` state with `opacity: 0.6`
- **Responsive**: Mobile-first with breakpoints at 599px, 767px, 1199px

## Common Development Tasks

### Adding a Chat Feature
1. Add endpoint in `ChatController` using `MessageService`
2. Update `landing.js` with fetch call and DOM manipulation
3. Add CSS to `landing.css` (never inline `<style>` tags)
4. Test with localStorage persistence if applicable
5. Ensure CSRF token included in all POST requests

### Modifying Appearance/Theming
- Use `setProperty('property', value, 'important')` to override CSS
- Set both shorthand (`background`) and longhand (`background-color`) properties
- Store in localStorage for persistence
- Apply on page load before DOMContentLoaded

### Database Changes
```bash
php artisan make:migration add_field_to_table --table=tablename
# Edit migration, add to $fillable in model
php artisan migrate
```

### Development Commands
```bash
# Asset compilation (Vite)
npm run dev          # Development with hot reload
npm run build        # Production build for deployment

# Laravel development server
php artisan serve    # Start server on http://localhost:8000

# Database operations
php artisan migrate           # Run migrations
php artisan migrate:rollback  # Rollback last migration batch
php artisan tinker           # Interactive Laravel shell

# Cache operations (for Redis/Cache debugging)
php artisan cache:clear      # Clear application cache
```

## Critical Conventions
1. **Never embed CSS/JS in Blade** - always use external files
2. **Always use MessageService** for sending messages - never direct Message::create()
3. **localStorage persistence** for all user preferences
4. **Toast notifications** for user feedback (3-second auto-dismiss)
5. **CSRF token** required on all POST/PATCH/DELETE requests
6. **Responsive design** - test mobile (599px), tablet (767px), desktop (1199px+)
7. **Escape HTML** in messages: `escapeHtml(text)` function to prevent XSS
8. **ISO8601 timestamps** for all date/time data from backend
9. **Empty states** for no messages/conversations with helpful messaging
