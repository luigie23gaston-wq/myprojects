// Get CSRF token
const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute('content');

// Get DOM elements
const gearIcon = document.getElementById('gearIcon');
const dropdown = document.getElementById('dropdown');
const logoutLink = document.getElementById('logoutLink');
const logoutModal = document.getElementById('logoutModal');
const confirmLogout = document.getElementById('confirmLogout');
const cancelLogout = document.getElementById('cancelLogout');

// Left Card Elements
const historyGearIcon = document.getElementById('historyGearIcon');
const historyDropdown = document.getElementById('historyDropdown');
const historyLink = document.getElementById('historyLink');
const editImageBtn = document.getElementById('editImageBtn');
const uploadSection = document.getElementById('uploadSection');
const editSection = document.getElementById('editSection');
const uploadBtn = document.getElementById('uploadBtn');
const imageInput = document.getElementById('imageInput');
const saveImageBtn = document.getElementById('saveImageBtn');
const cancelImageBtn = document.getElementById('cancelImageBtn');
const fileInfo = document.getElementById('fileInfo');
const profileImageDisplay = document.getElementById('profileImageDisplay');

// Right Card Elements
const editInfoBtn = document.getElementById('editInfoBtn');
const buttonGroup = document.getElementById('buttonGroup');
const saveButtonGroup = document.getElementById('saveButtonGroup');
const saveInfoBtn = document.getElementById('saveInfoBtn');
const cancelInfoBtn = document.getElementById('cancelInfoBtn');
const firstnameInput = document.getElementById('firstnameInput');
const lastnameInput = document.getElementById('lastnameInput');
const emailInput = document.getElementById('emailInput');
const fullnameInput = document.getElementById('fullnameInput');
const currentPasswordInput = document.getElementById('currentPasswordInput');
const newPasswordInput = document.getElementById('newPasswordInput');
const confirmPasswordInput = document.getElementById('confirmPasswordInput');

// Modal Elements
const historyModal = document.getElementById('historyModal');
const closeHistoryModal = document.getElementById('closeHistoryModal');
const historyList = document.getElementById('historyList');
const confirmHistoryModal = document.getElementById('confirmHistoryModal');
const confirmImagePreview = document.getElementById('confirmImagePreview');
const confirmHistoryBtn = document.getElementById('confirmHistoryBtn');
const cancelHistoryBtn = document.getElementById('cancelHistoryBtn');

// Toast
const toast = document.getElementById('toast');

// State variables
let selectedFile = null;
let selectedHistoryImageId = null;
let originalValues = {};

// Prevent back button
history.pushState(null, null, location.href);
window.onpopstate = function () {
    history.go(1);
};

// Toggle dropdown
gearIcon.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdown.classList.toggle('hidden');
    historyDropdown.classList.add('hidden');
});

// Toggle history dropdown
historyGearIcon.addEventListener('click', (e) => {
    e.stopPropagation();
    historyDropdown.classList.toggle('hidden');
    dropdown.classList.add('hidden');
});

// Close dropdowns when clicking outside
document.addEventListener('click', () => {
    dropdown.classList.add('hidden');
    historyDropdown.classList.add('hidden');
});

// Logout functionality
logoutLink.addEventListener('click', (e) => {
    e.preventDefault();
    logoutModal.classList.add('show');
});

cancelLogout.addEventListener('click', () => {
    logoutModal.classList.remove('show');
});

confirmLogout.addEventListener('click', () => {
    fetch('/logout', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': csrfToken,
            'Accept': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            window.location.href = '/';
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showToast('Logout failed. Please try again.', 'error');
    });
});

// Edit Image Button
editImageBtn.addEventListener('click', () => {
    editSection.classList.add('hidden');
    uploadSection.classList.remove('hidden');
});

// Cancel Image Upload
cancelImageBtn.addEventListener('click', () => {
    uploadSection.classList.add('hidden');
    editSection.classList.remove('hidden');
    selectedFile = null;
    imageInput.value = '';
    fileInfo.textContent = '';
});

// Upload Button
uploadBtn.addEventListener('click', () => {
    imageInput.click();
});

// File Input Change
imageInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        // Check file size (10MB = 10 * 1024 * 1024 bytes)
        if (file.size > 10 * 1024 * 1024) {
            showToast('File size must be less than 10MB', 'error');
            imageInput.value = '';
            selectedFile = null;
            fileInfo.textContent = '';
            return;
        }
        
        // Check file type
        if (!file.type.startsWith('image/')) {
            showToast('Please select an image file', 'error');
            imageInput.value = '';
            selectedFile = null;
            fileInfo.textContent = '';
            return;
        }
        
        selectedFile = file;
        const sizeInMB = (file.size / (1024 * 1024)).toFixed(2);
        fileInfo.textContent = `${file.name} (${sizeInMB} MB)`;
    }
});

// Save Image Button
saveImageBtn.addEventListener('click', () => {
    if (!selectedFile) {
        showToast('Please select an image first', 'error');
        return;
    }
    
    const formData = new FormData();
    formData.append('image', selectedFile);
    
    saveImageBtn.textContent = 'Uploading...';
    saveImageBtn.disabled = true;
    
    fetch('/profile/upload-image', {
        method: 'POST',
        headers: {
            'X-CSRF-TOKEN': csrfToken,
            'Accept': 'application/json'
        },
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showToast(data.message);
            // Update profile image
            profileImageDisplay.innerHTML = `<img src="${data.imageUrl}" alt="Profile">`;
            // Reset upload section
            uploadSection.classList.add('hidden');
            editSection.classList.remove('hidden');
            selectedFile = null;
            imageInput.value = '';
            fileInfo.textContent = '';
        } else {
            showToast(data.message || 'Upload failed', 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showToast('Upload failed. Please try again.', 'error');
    })
    .finally(() => {
        saveImageBtn.textContent = 'Save';
        saveImageBtn.disabled = false;
    });
});

// History Link
historyLink.addEventListener('click', (e) => {
    e.preventDefault();
    loadHistory();
    historyModal.classList.add('show');
});

// Close History Modal
closeHistoryModal.addEventListener('click', () => {
    historyModal.classList.remove('show');
});

// Load History
function loadHistory() {
    fetch('/profile/image-history', {
        headers: {
            'Accept': 'application/json',
            'X-CSRF-TOKEN': csrfToken
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            displayHistory(data.history);
        } else {
            historyList.innerHTML = '<div class="no-history">Failed to load history</div>';
        }
    })
    .catch(error => {
        console.error('Error:', error);
        historyList.innerHTML = '<div class="no-history">Failed to load history</div>';
    });
}

// Display History
function displayHistory(history) {
    if (history.length === 0) {
        historyList.innerHTML = '<div class="no-history">No upload history found</div>';
        return;
    }
    
    historyList.innerHTML = history.map(item => `
        <div class="history-item">
            <div class="history-image">
                <img src="${item.image_url}" alt="History">
            </div>
            <div class="history-info">
                <div class="history-date">${item.date}</div>
                <div class="history-time">${item.time}</div>
            </div>
            <button class="btn-select-history" onclick="selectHistoryImage(${item.id}, '${item.image_url}')">
                Select
            </button>
        </div>
    `).join('');
}

// Select History Image
function selectHistoryImage(id, imageUrl) {
    selectedHistoryImageId = id;
    confirmImagePreview.innerHTML = `<img src="${imageUrl}" alt="Selected">`;
    historyModal.classList.remove('show');
    confirmHistoryModal.classList.add('show');
}

// Confirm History Selection
confirmHistoryBtn.addEventListener('click', () => {
    if (!selectedHistoryImageId) return;
    
    confirmHistoryBtn.textContent = 'Setting...';
    confirmHistoryBtn.disabled = true;
    
    fetch('/profile/set-history-image', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': csrfToken,
            'Accept': 'application/json'
        },
        body: JSON.stringify({ history_id: selectedHistoryImageId })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showToast(data.message);
            profileImageDisplay.innerHTML = `<img src="${data.imageUrl}" alt="Profile">`;
            confirmHistoryModal.classList.remove('show');
            selectedHistoryImageId = null;
        } else {
            showToast(data.message || 'Failed to set image', 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showToast('Failed to set image. Please try again.', 'error');
    })
    .finally(() => {
        confirmHistoryBtn.textContent = 'Yes';
        confirmHistoryBtn.disabled = false;
    });
});

// Cancel History Selection
cancelHistoryBtn.addEventListener('click', () => {
    confirmHistoryModal.classList.remove('show');
    historyModal.classList.add('show');
    selectedHistoryImageId = null;
});

// Edit Info Button
editInfoBtn.addEventListener('click', () => {
    // Store original values
    originalValues = {
        firstname: firstnameInput.value,
        lastname: lastnameInput.value,
        email: emailInput.value
    };
    
    // Enable inputs
    firstnameInput.disabled = false;
    lastnameInput.disabled = false;
    emailInput.disabled = false;
    currentPasswordInput.disabled = false;
    newPasswordInput.disabled = false;
    confirmPasswordInput.disabled = false;
    
    // Toggle buttons
    buttonGroup.classList.add('hidden');
    saveButtonGroup.classList.remove('hidden');
});

// Cancel Info Edit
cancelInfoBtn.addEventListener('click', () => {
    // Restore original values
    firstnameInput.value = originalValues.firstname;
    lastnameInput.value = originalValues.lastname;
    emailInput.value = originalValues.email;
    currentPasswordInput.value = '';
    newPasswordInput.value = '';
    confirmPasswordInput.value = '';
    
    // Disable inputs
    firstnameInput.disabled = true;
    lastnameInput.disabled = true;
    emailInput.disabled = true;
    currentPasswordInput.disabled = true;
    newPasswordInput.disabled = true;
    confirmPasswordInput.disabled = true;
    
    // Toggle buttons
    saveButtonGroup.classList.add('hidden');
    buttonGroup.classList.remove('hidden');
});

// Save Info Button
saveInfoBtn.addEventListener('click', () => {
    const firstname = firstnameInput.value.trim();
    const lastname = lastnameInput.value.trim();
    const email = emailInput.value.trim();
    const currentPassword = currentPasswordInput.value;
    const newPassword = newPasswordInput.value;
    const confirmPassword = confirmPasswordInput.value;
    
    // Validation
    if (!firstname || !lastname || !email) {
        showToast('First name, last name, and email are required', 'error');
        return;
    }
    
    if (newPassword && newPassword !== confirmPassword) {
        showToast('New passwords do not match', 'error');
        return;
    }
    
    if (newPassword && !currentPassword) {
        showToast('Current password is required to set a new password', 'error');
        return;
    }
    
    if (newPassword && newPassword.length < 8) {
        showToast('New password must be at least 8 characters', 'error');
        return;
    }
    
    const data = {
        firstname,
        lastname,
        email
    };
    
    if (currentPassword && newPassword) {
        data.current_password = currentPassword;
        data.new_password = newPassword;
    }
    
    saveInfoBtn.textContent = 'Saving...';
    saveInfoBtn.disabled = true;
    
    fetch('/profile/update-info', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': csrfToken,
            'Accept': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showToast(data.message);
            // Update fullname
            fullnameInput.value = `${firstname} ${lastname}`;
            // Clear password fields
            currentPasswordInput.value = '';
            newPasswordInput.value = '';
            confirmPasswordInput.value = '';
            // Disable inputs
            firstnameInput.disabled = true;
            lastnameInput.disabled = true;
            emailInput.disabled = true;
            currentPasswordInput.disabled = true;
            newPasswordInput.disabled = true;
            confirmPasswordInput.disabled = true;
            // Toggle buttons
            saveButtonGroup.classList.add('hidden');
            buttonGroup.classList.remove('hidden');
        } else {
            showToast(data.message || 'Update failed', 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showToast('Update failed. Please try again.', 'error');
    })
    .finally(() => {
        saveInfoBtn.textContent = 'Save';
        saveInfoBtn.disabled = false;
    });
});

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

// Make selectHistoryImage available globally
window.selectHistoryImage = selectHistoryImage;
