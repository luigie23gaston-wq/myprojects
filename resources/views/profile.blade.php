<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="csrf-token" content="{{ csrf_token() }}">
        <title>Profile</title>
        <link rel="icon" type="image/png" href="{{ asset('YlaChat.png') }}">
        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=figtree:400,600&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="{{ asset('css/profile.css') }}">
    </head>
    <body>
        <!-- Profile Page -->
        <div class="profile-page">
            <nav class="navbar">
                <div class="navbar-left">
                    <div class="navbar-logo">
                        <img src="{{ asset('YlaChat.png') }}" alt="YlaChat">
                    </div>
                    <a href="{{ route('landing') }}" class="nav-item">Home</a>
                </div>
                <div class="user-menu">
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
                            <a href="#" id="logoutLink">Logout</a>
                        </div>
                    </div>
                </div>
            </nav>

            <div class="profile-container">
                <!-- Left Card: Profile Image -->
                <div class="profile-card left-card mx-6 my-6 mb-6 mt-6">
                    <div class="gear-container">
                        <span class="gear-icon-card" id="historyGearIcon">⚙️</span>
                        <div class="history-dropdown hidden" id="historyDropdown">
                            <a href="#" id="historyLink">History</a>
                        </div>
                    </div>
                    
                    <div class="profile-image-container">
                        <div class="profile-image" id="profileImageDisplay">
                            @if(Auth::user()->image)
                                <img src="{{ asset('storage/' . Auth::user()->image) }}" alt="Profile">
                            @else
                                <div class="placeholder-image">{{ strtoupper(substr(Auth::user()->firstname, 0, 1)) }}</div>
                            @endif
                        </div>
                    </div>
                    
                    <div class="profile-username">{{ Auth::user()->username }}</div>
                    
                    <div class="edit-section" id="editSection">
                        <button class="btn-edit" id="editImageBtn">Edit</button>
                    </div>
                    
                    <div class="upload-section hidden" id="uploadSection">
                        <input type="file" id="imageInput" accept="image/*" style="display: none;">
                        <button class="btn-upload" id="uploadBtn">Choose Image</button>
                        <div style="display: flex; gap: 10px; width: 100%; justify-content: center;">
                            <button class="btn-save" id="saveImageBtn">Save</button>
                            <button class="btn-cancel" id="cancelImageBtn">Cancel</button>
                        </div>
                        <div class="file-info" id="fileInfo"></div>
                    </div>
                </div>

                <!-- Right Card: Profile Information -->
                <div class="profile-card right-card">
                    <h2>Profile Information</h2>
                    
                    <div class="form-group">
                        <label>Full Name</label>
                        <input type="text" id="fullnameInput" value="{{ Auth::user()->firstname . ' ' . Auth::user()->lastname }}" disabled>
                    </div>
                    
                    <div class="form-group">
                        <label>First Name</label>
                        <input type="text" id="firstnameInput" value="{{ Auth::user()->firstname }}" disabled>
                    </div>
                    
                    <div class="form-group">
                        <label>Last Name</label>
                        <input type="text" id="lastnameInput" value="{{ Auth::user()->lastname }}" disabled>
                    </div>
                    
                    <div class="form-group">
                        <label>Email</label>
                        <input type="email" id="emailInput" value="{{ Auth::user()->email }}" disabled>
                    </div>
                    
                    <div class="form-group">
                        <label>Current Password</label>
                        <input type="password" id="currentPasswordInput" placeholder="Enter current password" disabled>
                    </div>
                    
                    <div class="form-group">
                        <label>New Password</label>
                        <input type="password" id="newPasswordInput" placeholder="Enter new password" disabled>
                    </div>
                    
                    <div class="form-group">
                        <label>Confirm Password</label>
                        <input type="password" id="confirmPasswordInput" placeholder="Confirm new password" disabled>
                    </div>
                    
                    <div class="button-group" id="buttonGroup">
                        <button class="btn-edit-info" id="editInfoBtn">Edit</button>
                    </div>
                    
                    <div class="button-group hidden" id="saveButtonGroup">
                        <button class="btn-save-info" id="saveInfoBtn">Save</button>
                        <button class="btn-cancel-info" id="cancelInfoBtn">Cancel</button>
                    </div>
                </div>
            </div>
        </div>

        <!-- History Modal -->
        <div class="modal" id="historyModal">
            <div class="modal-content-large">
                <div class="modal-header">
                    <h3>Upload History</h3>
                    <span class="close-btn" id="closeHistoryModal">&times;</span>
                </div>
                <div class="history-list" id="historyList">
                    <!-- History items will be loaded here -->
                </div>
            </div>
        </div>

        <!-- Confirmation Modal for History Image Selection -->
        <div class="modal" id="confirmHistoryModal">
            <div class="modal-content-small">
                <h3>Confirm Profile Image</h3>
                <div class="confirm-image-preview" id="confirmImagePreview"></div>
                <p>Are you sure you want to use this as your profile image?</p>
                <div class="modal-buttons">
                    <button class="btn-confirm" id="confirmHistoryBtn">Yes</button>
                    <button class="btn-cancel" id="cancelHistoryBtn">Cancel</button>
                </div>
            </div>
        </div>

        <!-- Logout Confirmation Modal -->
        <div class="modal" id="logoutModal">
            <div class="modal-content-small">
                <h3>Are you sure you want to logout?</h3>
                <div class="modal-buttons">
                    <button class="btn-confirm" id="confirmLogout">Yes</button>
                    <button class="btn-cancel" id="cancelLogout">No</button>
                </div>
            </div>
        </div>

        <!-- Toast Notification -->
        <div class="toast" id="toast"></div>

        <script src="{{ asset('js/profile.js') }}"></script>
    </body>
</html>
