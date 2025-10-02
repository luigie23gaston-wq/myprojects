<!    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="csrf-token" content="{{ csrf_token() }}">
        <title>Login / Register</title>
        <link rel="icon" type="image/png" href="{{ asset('YlaChat.png') }}">
        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=figtree:400,600&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="{{ asset('css/auth.css') }}">
    </head>tml>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="csrf-token" content="{{ csrf_token() }}">
        <title>Welcome</title>
        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=figtree:400,600&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="{{ asset('css/auth.css') }}">
    </head>
    <body>
        <!-- Authentication Container (Login/Register) -->
        <div class="auth-container" id="authContainer">
            <!-- Login Form -->
            <div class="auth-card" id="loginForm">
                <h2>Login</h2>
                <form>
                    <div class="form-group">
                        <label for="loginUsername">Username</label>
                        <input type="text" id="loginUsername" placeholder="Enter your username">
                    </div>
                    <div class="form-group">
                        <label for="loginPassword">Password</label>
                        <input type="password" id="loginPassword" placeholder="Enter your password">
                    </div>
                    <button type="button" class="btn" id="loginBtn" disabled>Login</button>
                    <div class="auth-link">
                        <a href="#" id="showRegisterLink">Don't have an account yet? Register</a>
                    </div>
                </form>
            </div>

            <!-- Register Form -->
            <div class="auth-card hidden" id="registerForm">
                <h2>Register</h2>
                <form>
                    <div class="form-group">
                        <label for="regUsername">Username</label>
                        <input type="text" id="regUsername" placeholder="Enter username">
                    </div>
                    <div class="form-group">
                        <label for="regFirstname">First Name</label>
                        <input type="text" id="regFirstname" placeholder="Enter first name">
                    </div>
                    <div class="form-group">
                        <label for="regLastname">Last Name</label>
                        <input type="text" id="regLastname" placeholder="Enter last name">
                    </div>
                    <div class="form-group">
                        <label for="regEmail">Email</label>
                        <input type="email" id="regEmail" placeholder="Enter email">
                    </div>
                    <div class="form-group">
                        <label for="regPassword">Password</label>
                        <input type="password" id="regPassword" placeholder="Enter password">
                        <div class="password-strength" id="passwordStrength"></div>
                    </div>
                    <div class="form-group">
                        <label for="regConfirmPassword">Confirm Password</label>
                        <input type="password" id="regConfirmPassword" placeholder="Confirm password">
                    </div>
                    <button type="button" class="btn" id="registerBtn" disabled>Register</button>
                    <div class="auth-link">
                        <a href="#" id="showLoginLink">Already have an account? Login</a>
                    </div>
                </form>
            </div>
        </div>

        <!-- Toast Notification -->
        <div class="toast" id="toast"></div>

        <script src="{{ asset('js/auth.js') }}"></script>
    </body>
</html>
