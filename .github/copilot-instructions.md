# Copilot Instructions for Laravel Chat Application

## Project Overview
This is a Laravel 10 application (PHP 8.1+) with Vite-powered frontend assets. The project uses a hybrid approach: Laravel Blade views with embedded vanilla JavaScript/CSS for interactive UI components, rather than a separate SPA framework.

## Architecture & Structure

### Frontend Pattern: External CSS & JS Files
- **Critical Convention**: CSS and JavaScript are separated into external files in `public/css/` and `public/js/`
- Link CSS files in the `<head>` using: `<link rel="stylesheet" href="{{ asset('css/filename.css') }}">`
- Link JS files before closing `</body>` using: `<script src="{{ asset('js/filename.js') }}"></script>`
- Views use vanilla JavaScript with modern DOM manipulation, not jQuery or frontend frameworks
- Always include CSRF token meta tag: `<meta name="csrf-token" content="{{ csrf_token() }}">`
- **File Structure**:
  - `public/css/auth.css` - Authentication page styles
  - `public/css/landing.css` - Landing page styles
  - `public/js/auth.js` - Authentication logic (login/register with API calls)
  - `public/js/landing.js` - Landing page logic (logout functionality)
  - `resources/views/welcome.blade.php` - Login/Register HTML
  - `resources/views/landing.blade.php` - Landing page HTML

### Authentication Flow (Backend Integration)
- **Real Authentication**: Uses Laravel's Auth system with database storage
- Login/Register forms send AJAX requests to backend controllers
- Toast notifications show success/error messages
- Button states change: "Login" → "Logging in..." → "Redirecting..."
- After successful auth, redirects to `/landing` route
- Landing page protected by `auth` middleware
- Login/Register pages protected by `guest` middleware (redirects if already logged in)
- Back button prevention using `prevent.back` middleware and JavaScript
- Cache control headers prevent browser from caching authenticated pages
- **User Model Fields**: username, firstname, lastname, name, email, password, image (nullable)
- Passwords are hashed using Laravel's Hash facade

### Key File Locations
```
resources/views/welcome.blade.php   # Login/Register page (HTML only)
resources/views/landing.blade.php   # Landing page (HTML only)
resources/views/profile.blade.php   # Profile page with image upload & info editing
public/css/auth.css                 # Auth page styles + toast notifications
public/css/landing.css              # Landing page styles + modal
public/css/profile.css              # Profile page styles + modals
public/js/auth.js                   # Auth logic with fetch API calls
public/js/landing.js                # Landing page logic with logout
public/js/profile.js                # Profile page logic with image upload & history
routes/web.php                      # Route definitions with auth middleware
app/Http/Controllers/AuthController.php     # Handles login, register, logout
app/Http/Controllers/ProfileController.php  # Handles profile operations
app/Models/User.php                 # User model with custom fields
app/Models/ImageHistory.php         # Image upload history model
database/migrations/                # Database schema definitions
database/database.sqlite            # SQLite database file
storage/app/public/profile_images/  # Uploaded profile images
```

## Development Workflows

### Database Setup & Migrations
```bash
# Create SQLite database (already configured)
New-Item -Path "database\database.sqlite" -ItemType File -Force

# Run migrations
php artisan migrate

# Rollback last migration
php artisan migrate:rollback

# Create new migration
php artisan make:migration migration_name
```

### Build & Asset Compilation
```bash
# Frontend asset compilation (Vite)
npm run dev          # Development with hot reload
npm run build        # Production build

# Laravel artisan commands (standard)
php artisan serve    # Start development server
php artisan migrate  # Run database migrations
php artisan tinker   # Interactive PHP REPL
```

### Testing
```bash
php artisan test              # Run PHPUnit tests
./vendor/bin/phpunit          # Direct PHPUnit execution
./vendor/bin/pint             # Laravel Pint code formatting
```

## Project-Specific Conventions

### UI Design System
- **Color Palette**: 
  - Background gradient: Green (#28a745) to Sky Blue (#87ceeb)
  - Cards: Dark gray (#4a4a4a)
  - Inputs: Black (#2a2a2a)
  - Accents: Sky blue (#87ceeb), Green (#28a745)
- **Component Pattern**: Floating card divs with shadow effects and rounded corners
- **Modal Pattern**: Overlay with centered content card, click-outside to close

### Form Validation Pattern
```javascript
// Real-time client-side validation
function validateForm() {
    const allFieldsValid = field1.length >= 3 && field2.length >= 3;
    submitBtn.disabled = !allFieldsValid;
}
input.addEventListener('input', validateForm);

// Server-side validation with fetch API
fetch('/endpoint', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'X-CSRF-TOKEN': csrfToken
    },
    body: JSON.stringify(data)
})
.then(response => response.json())
.then(data => {
    if (data.success) {
        showToast(data.message);
        // Redirect after success
    }
});
```

### Toast Notification Pattern
```javascript
function showToast(message, type = 'success') {
    toast.textContent = message;
    toast.className = 'toast show';
    if (type === 'error') toast.classList.add('error');
    setTimeout(() => toast.classList.remove('show'), 3000);
}
```

### Password Strength Logic
Implements multi-factor strength checking:
- Length (8+ chars)
- Mixed case detection
- Number presence
- Special character detection
- Visual feedback with color coding (weak/medium/strong)

### State Management Pattern
- Uses CSS `.hidden` class for show/hide toggling
- Page sections (auth vs landing) switched via class manipulation
- No state management library - pure DOM manipulation
- Event delegation for dropdown menus and modals

## Key Dependencies
- **Laravel 10**: Framework core
- **Laravel Sanctum**: API token authentication (configured but not actively used in current UI)
- **Vite**: Asset bundler (configured in `vite.config.js`)
- **Axios**: HTTP client (available but not used in current implementation)

## Important Notes
- **Database**: SQLite configured in `.env` (easier development setup)
- **Authentication**: Fully integrated with Laravel Auth system
- **Session Management**: Uses Laravel's session middleware
- **CSRF Protection**: All POST requests require CSRF token
- **Responsive Design**: Uses percentage-based widths and max-width constraints (e.g., `max-width: 600px` for auth cards)
- **Browser Compatibility**: Uses modern ES6+ JavaScript (arrow functions, template literals, const/let, fetch API)

## Common Tasks

### Adding a New Blade View
1. Create HTML structure in `resources/views/filename.blade.php`
2. Add CSRF meta tag: `<meta name="csrf-token" content="{{ csrf_token() }}">`
3. Create CSS file in `public/css/filename.css`
4. Create JS file in `public/js/filename.js`
5. Link assets: `<link rel="stylesheet" href="{{ asset('css/filename.css') }}">` and `<script src="{{ asset('js/filename.js') }}"></script>`
6. Add route in `routes/web.php`: `Route::get('/path', [Controller::class, 'method'])->name('route.name');`
7. Add middleware if authentication required: `->middleware('auth')`

### Profile Page Features
- **Two-Card Layout**: Left card (profile image) + Right card (user info)
- **Image Upload**: Max 10MB, supports jpeg/png/jpg/gif
- **Upload History**: Tracks all uploaded images with date/time
- **History Modal**: View past uploads and select as current profile image
- **Editable Fields**: Firstname, lastname, email, password change
- **Real-time Validation**: File size checking, password matching
- **Toast Notifications**: Success/error feedback for all operations

### Image Upload Pattern
```php
// Controller
$image = $request->file('image');
$imagePath = $image->storeAs('profile_images', $imageName, 'public');

// Save to history
ImageHistory::create([
    'user_id' => $user->id,
    'image_path' => $imagePath,
]);

// Update user
$user->image = $imagePath;
$user->save();

// Access in Blade
<img src="{{ asset('storage/' . Auth::user()->image) }}" alt="Profile">
```

### Adding Authentication to Routes
```php
// Protected route (requires login)
Route::get('/dashboard', [Controller::class, 'index'])->middleware('auth');

// Get authenticated user in controller
$user = Auth::user();

// Get user data in Blade
{{ Auth::user()->username }}
{{ Auth::user()->firstname }}
```

### Modifying Authentication UI
- Edit HTML in `resources/views/welcome.blade.php`
- Edit styles in `public/css/auth.css`
- Edit JavaScript in `public/js/auth.js`
- Backend logic in `app/Http/Controllers/AuthController.php`
- Validation rules in AuthController methods

### Adding Database Fields
1. Create migration: `php artisan make:migration add_fields_to_table --table=tablename`
2. Define fields in migration's `up()` method
3. Add fields to model's `$fillable` array
4. Run migration: `php artisan migrate`

### Styling Changes
- Auth page styles: `public/css/auth.css`
- Landing page styles: `public/css/landing.css`
- Maintain color scheme (gray/black cards, green/blue background)
- Keep button disabled state styling (opacity: 0.6, cursor: not-allowed)
- Never embed `<style>` tags in Blade templates - always use external CSS files
