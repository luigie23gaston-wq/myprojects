<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="csrf-token" content="{{ csrf_token() }}">
        <title>Landing Page</title>
        <link rel="icon" type="image/png" href="{{ asset('YlaChat.png') }}">
        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=figtree:400,600&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="{{ asset('css/landing.css') }}">
    </head>
    <body>
        <!-- Landing Page -->
        <div class="landing-page">
            <nav class="navbar">
                <div class="navbar-logo">
                    <img src="{{ asset('YlaChat.png') }}" alt="YlaChat">
                </div>
                <div class="user-menu">
                    <span class="username" id="displayUsername">{{ Auth::user()->username }}</span>
                    <div style="position: relative;">
                        <span class="gear-icon" id="gearIcon">⚙️</span>
                        <div class="dropdown hidden" id="dropdown">
                            <a href="{{ route('profile') }}" id="profileLink">Profile</a>
                            <a href="#" id="logoutLink">Logout</a>
                        </div>
                    </div>
                </div>
            </nav>
            <div class="content-area">
                <div class="welcome-text">Welcome to the Landing Page, {{ Auth::user()->firstname }}!</div>
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

        <script src="{{ asset('js/landing.js') }}"></script>
    </body>
</html>
