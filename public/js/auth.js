// Get CSRF token
const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute('content');

// Debug: Check if CSRF token exists
if (!csrfToken) {
    console.error('CSRF token not found!');
}

// Prevent back button on login/register page if user is already authenticated
// This is handled by server-side middleware, but this is an extra layer
window.addEventListener('pageshow', function(event) {
    // If page is loaded from cache (back button), reload it
    if (event.persisted) {
        window.location.reload();
    }
});

// Elements
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const showRegisterLink = document.getElementById('showRegisterLink');
const showLoginLink = document.getElementById('showLoginLink');
const toast = document.getElementById('toast');

// Login elements
const loginUsername = document.getElementById('loginUsername');
const loginPassword = document.getElementById('loginPassword');
const loginBtn = document.getElementById('loginBtn');

// Register elements
const regUsername = document.getElementById('regUsername');
const regFirstname = document.getElementById('regFirstname');
const regLastname = document.getElementById('regLastname');
const regEmail = document.getElementById('regEmail');
const regPassword = document.getElementById('regPassword');
const regConfirmPassword = document.getElementById('regConfirmPassword');
const registerBtn = document.getElementById('registerBtn');
const passwordStrengthFill = document.getElementById('passwordStrengthFill');
const passwordStrengthText = document.getElementById('passwordStrengthText');
const passwordMatchIndicator = document.getElementById('passwordMatchIndicator');

// Password toggle elements
const loginPasswordToggle = document.getElementById('loginPasswordToggle');
const regPasswordToggle = document.getElementById('regPasswordToggle');
const regConfirmPasswordToggle = document.getElementById('regConfirmPasswordToggle');

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

// Toggle between Login and Register
showRegisterLink.addEventListener('click', (e) => {
    e.preventDefault();
    loginForm.classList.add('hidden');
    registerForm.classList.remove('hidden');
});

showLoginLink.addEventListener('click', (e) => {
    e.preventDefault();
    registerForm.classList.add('hidden');
    loginForm.classList.remove('hidden');
});

// Login validation
function validateLoginForm() {
    const username = loginUsername.value.trim();
    const password = loginPassword.value.trim();
    
    loginBtn.disabled = !(username.length >= 3 && password.length >= 3);
}

loginUsername.addEventListener('input', validateLoginForm);
loginPassword.addEventListener('input', validateLoginForm);

// Password visibility toggle for login
loginPasswordToggle.addEventListener('click', () => {
    const type = loginPassword.type === 'password' ? 'text' : 'password';
    loginPassword.type = type;
    loginPasswordToggle.textContent = type === 'password' ? '👁️' : '🙈';
});

// Login button action
loginBtn.addEventListener('click', () => {
    const username = loginUsername.value.trim();
    const password = loginPassword.value.trim();
    
    loginBtn.disabled = true;
    loginBtn.textContent = 'Logging in...';
    
    fetch('/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-CSRF-TOKEN': csrfToken
        },
        body: JSON.stringify({
            username: username,
            password: password
        })
    })
    .then(response => {
        // Check if response is JSON
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            throw new Error('Server returned non-JSON response. Status: ' + response.status);
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            showToast(data.message);
            loginBtn.textContent = 'Redirecting...';
            setTimeout(() => {
                window.location.href = data.redirect;
            }, 1000);
        } else {
            showToast(data.message || 'Login failed', 'error');
            loginBtn.disabled = false;
            loginBtn.textContent = 'Login';
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showToast('An error occurred. Please try again.', 'error');
        loginBtn.disabled = false;
        loginBtn.textContent = 'Login';
    });
});

// Password strength checker
function checkPasswordStrength(password) {
    if (password.length < 3) {
        passwordStrengthFill.className = 'password-strength-fill';
        passwordStrengthText.className = 'password-strength-text';
        passwordStrengthText.textContent = '';
        return { strength: '', text: '' };
    }
    
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;
    
    if (strength <= 1) {
        passwordStrengthFill.className = 'password-strength-fill weak';
        passwordStrengthText.className = 'password-strength-text weak';
        passwordStrengthText.textContent = '⚠️ Weak password';
        return { strength: 'weak', text: 'Weak password' };
    } else if (strength === 2 || strength === 3) {
        passwordStrengthFill.className = 'password-strength-fill medium';
        passwordStrengthText.className = 'password-strength-text medium';
        passwordStrengthText.textContent = '⚡ Medium password';
        return { strength: 'medium', text: 'Medium password' };
    } else {
        passwordStrengthFill.className = 'password-strength-fill strong';
        passwordStrengthText.className = 'password-strength-text strong';
        passwordStrengthText.textContent = '✓ Strong password';
        return { strength: 'strong', text: 'Strong password' };
    }
}

regPassword.addEventListener('input', () => {
    const password = regPassword.value;
    checkPasswordStrength(password);
    checkPasswordMatch();
    validateRegisterForm();
});

// Password match checker
function checkPasswordMatch() {
    const password = regPassword.value;
    const confirmPassword = regConfirmPassword.value;
    
    if (confirmPassword.length === 0) {
        passwordMatchIndicator.className = 'password-match-indicator';
        passwordMatchIndicator.textContent = '';
        return;
    }
    
    if (password === confirmPassword) {
        passwordMatchIndicator.className = 'password-match-indicator match';
        passwordMatchIndicator.textContent = '✓ Passwords match';
    } else {
        passwordMatchIndicator.className = 'password-match-indicator no-match';
        passwordMatchIndicator.textContent = '✗ Passwords do not match';
    }
}

regConfirmPassword.addEventListener('input', () => {
    checkPasswordMatch();
    validateRegisterForm();
});

// Password visibility toggle for register password
regPasswordToggle.addEventListener('click', () => {
    const type = regPassword.type === 'password' ? 'text' : 'password';
    regPassword.type = type;
    regPasswordToggle.textContent = type === 'password' ? '👁️' : '🙈';
});

// Password visibility toggle for confirm password
regConfirmPasswordToggle.addEventListener('click', () => {
    const type = regConfirmPassword.type === 'password' ? 'text' : 'password';
    regConfirmPassword.type = type;
    regConfirmPasswordToggle.textContent = type === 'password' ? '👁️' : '🙈';
});

// Register validation
function validateRegisterForm() {
    const username = regUsername.value.trim();
    const firstname = regFirstname.value.trim();
    const lastname = regLastname.value.trim();
    const email = regEmail.value.trim();
    const password = regPassword.value.trim();
    const confirmPassword = regConfirmPassword.value.trim();
    
    const allFieldsValid = 
        username.length >= 3 &&
        firstname.length >= 3 &&
        lastname.length >= 3 &&
        email.length >= 3 &&
        password.length >= 3 &&
        confirmPassword.length >= 3 &&
        password === confirmPassword;
    
    registerBtn.disabled = !allFieldsValid;
}

regUsername.addEventListener('input', validateRegisterForm);
regFirstname.addEventListener('input', validateRegisterForm);
regLastname.addEventListener('input', validateRegisterForm);
regEmail.addEventListener('input', validateRegisterForm);

// Register button action
registerBtn.addEventListener('click', () => {
    const username = regUsername.value.trim();
    const firstname = regFirstname.value.trim();
    const lastname = regLastname.value.trim();
    const email = regEmail.value.trim();
    const password = regPassword.value.trim();
    const confirmPassword = regConfirmPassword.value.trim();
    
    registerBtn.disabled = true;
    registerBtn.textContent = 'Registering...';
    
    fetch('/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-CSRF-TOKEN': csrfToken
        },
        body: JSON.stringify({
            username: username,
            firstname: firstname,
            lastname: lastname,
            email: email,
            password: password,
            password_confirmation: confirmPassword
        })
    })
    .then(response => {
        // Check if response is JSON
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            throw new Error('Server returned non-JSON response. Status: ' + response.status);
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            showToast(data.message);
            registerBtn.textContent = 'Redirecting...';
            setTimeout(() => {
                window.location.href = data.redirect;
            }, 1000);
        } else {
            let errorMessage = data.message || 'Registration failed';
            if (data.errors) {
                const firstError = Object.values(data.errors)[0];
                errorMessage = Array.isArray(firstError) ? firstError[0] : firstError;
            }
            showToast(errorMessage, 'error');
            registerBtn.disabled = false;
            registerBtn.textContent = 'Register';
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showToast('An error occurred. Please try again.', 'error');
        registerBtn.disabled = false;
        registerBtn.textContent = 'Register';
    });
});
