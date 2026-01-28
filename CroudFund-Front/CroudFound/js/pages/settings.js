// Settings page functionality

let profileImageData = null;

document.addEventListener('DOMContentLoaded', async () => {
    if (!requireAuth()) return;
    
    await loadUserProfile();
    setupBioCounter();
});

async function loadUserProfile() {
    try {
        const user = getCurrentUser();
        if (!user) return;
        
        // GET /api/Users/me
        const userData = await getCurrentUserInfo();
        
        const fullName = userData?.FullName || userData?.fullName || user.fullName;
        const email = userData?.Email || userData?.email || user.email;
        const profileImagePath = userData?.ProfileImage || userData?.profileImage;
        
        document.getElementById('fullName').value = fullName;
        document.getElementById('email').value = email;
        document.getElementById('bio').value = userData?.bio || '';
        document.getElementById('bioCharCount').textContent = (userData?.bio || '').length;
        
        const initial = fullName.charAt(0).toUpperCase();
        const userInitialEl = document.getElementById('userInitial');
        if (userInitialEl) {
            userInitialEl.textContent = initial;
        }
        document.getElementById('sidebarUserInitial').textContent = initial;
        document.getElementById('sidebarUserName').textContent = fullName;
        document.getElementById('sidebarUserRole').textContent = 'User Account';
        
        // Set profile image in header & dropdown
        const headerUserImage = document.getElementById('headerUserImage');
        const userDropdownImage = document.getElementById('userDropdownImage');
        const userDropdownInitial = document.getElementById('userDropdownInitial');
        const userDropdownName = document.getElementById('userDropdownName');
        
        if (profileImagePath) {
            const imageUrl = buildImageUrl(profileImagePath);
            if (headerUserImage) {
                headerUserImage.src = imageUrl;
                headerUserImage.style.display = 'block';
                if (userInitialEl) userInitialEl.style.display = 'none';
            } else {
                const headerProfileImg = document.querySelector('#userInitial')?.parentElement;
                if (headerProfileImg) {
                    const img = document.createElement('img');
                    img.id = 'headerUserImage';
                    img.src = imageUrl;
                    img.alt = fullName;
                    img.style.cssText = 'width: 100%; height: 100%; object-fit: cover; border-radius: 50%; display: block;';
                    img.onerror = function() {
                        this.style.display = 'none';
                        if (userInitialEl) userInitialEl.style.display = 'flex';
                    };
                    if (userInitialEl) userInitialEl.style.display = 'none';
                    headerProfileImg.insertBefore(img, headerProfileImg.firstChild);
                }
            }
            if (userDropdownImage) {
                userDropdownImage.src = imageUrl;
                userDropdownImage.style.display = 'block';
                if (userDropdownInitial) userDropdownInitial.style.display = 'none';
            }
        } else {
            if (headerUserImage) headerUserImage.style.display = 'none';
            if (userDropdownImage) userDropdownImage.style.display = 'none';
            if (userDropdownInitial) {
                userDropdownInitial.textContent = initial;
                userDropdownInitial.style.display = 'flex';
            }
        }
        
        if (userDropdownName) {
            userDropdownName.textContent = fullName;
        }
        
        // Set profile image in sidebar
        if (profileImagePath) {
            const imageUrl = buildImageUrl(profileImagePath);
            const sidebarImg = document.getElementById('sidebarUserImage');
            const sidebarInitial = document.getElementById('sidebarUserInitial');
            if (sidebarImg && sidebarInitial) {
                sidebarImg.src = imageUrl;
                sidebarImg.style.display = 'block';
                sidebarInitial.style.display = 'none';
                sidebarImg.onerror = function() {
                    this.style.display = 'none';
                    sidebarInitial.style.display = 'flex';
                };
            }
        }
        
        // Set profile image in settings preview
        if (profileImagePath) {
            // Build full image URL from backend
            const profileImage = buildImageUrl(profileImagePath);
            document.getElementById('profileImagePreview').src = profileImage;
            document.getElementById('profileImagePreview').style.display = 'block';
            document.getElementById('profileImagePlaceholder').style.display = 'none';
            profileImageData = profileImage;
        }
    } catch (error) {
        console.error('Error loading user profile:', error);
        // Fallback to localStorage data
        const user = getCurrentUser();
        if (user) {
            document.getElementById('fullName').value = user.fullName;
            document.getElementById('email').value = user.email;
        }
    }
}

function setupBioCounter() {
    const bioInput = document.getElementById('bio');
    bioInput.addEventListener('input', (e) => {
        document.getElementById('bioCharCount').textContent = e.target.value.length;
    });
}

async function handleProfileImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (file.size > 800 * 1024) {
        showNotification('Image size must be less than 800KB', 'error');
        return;
    }
    
    try {
        // Store file object for FormData upload
        profileImageData = file;
        
        // Show preview using FileReader
        const reader = new FileReader();
        reader.onload = (e) => {
            document.getElementById('profileImagePreview').src = e.target.result;
            document.getElementById('profileImagePreview').style.display = 'block';
            document.getElementById('profileImagePlaceholder').style.display = 'none';
        };
        reader.readAsDataURL(file);
    } catch (error) {
        console.error('Error uploading image:', error);
        showNotification('Error uploading image', 'error');
    }
}

function removeProfileImage() {
    profileImageData = null;
    document.getElementById('profileImagePreview').style.display = 'none';
    document.getElementById('profileImagePlaceholder').style.display = 'flex';
}

async function saveProfile() {
    try {
        const user = getCurrentUser();
        if (!user) return;
        
        // PUT /api/Users/profile - uses FormData for file upload
        const updates = {
            FullName: document.getElementById('fullName').value,
            ProfilePictureUrl: profileImageData // File object
        };
        
        await updateProfile(updates);
        
        // Update localStorage
        const updatedUser = {
            ...user,
            fullName: updates.FullName
        };
        localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(updatedUser));
        
        showNotification('Profile updated successfully!', 'success');
        await loadUserProfile();
    } catch (error) {
        console.error('Error updating profile:', error);
        handleError(error, 'Unable to update profile. Please try again.');
    }
}

async function updatePassword() {
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    if (!currentPassword || !newPassword || !confirmPassword) {
        showNotification('Please fill in all password fields', 'error');
        return;
    }
    
    if (newPassword !== confirmPassword) {
        showNotification('New passwords do not match', 'error');
        return;
    }
    
    if (newPassword.length < 8) {
        showNotification('Password must be at least 8 characters', 'error');
        return;
    }
    
    // Password validation
    const hasUpperCase = /[A-Z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);
    
    if (!hasUpperCase || !hasNumber || !hasSpecial) {
        showNotification('Password must contain uppercase, number, and special character', 'error');
        return;
    }
    
    try {
        // PUT /api/users/change-password
        await changePassword(currentPassword, newPassword);
        
        showNotification('Password updated successfully!', 'success');
        
        // Clear password fields
        document.getElementById('currentPassword').value = '';
        document.getElementById('newPassword').value = '';
        document.getElementById('confirmPassword').value = '';
    } catch (error) {
        console.error('Error updating password:', error);
        handleError(error, 'Unable to update password. Please check your current password and try again.');
    }
}

function deactivateAccount() {
    if (!confirm('Are you sure you want to deactivate your account? This action cannot be undone.')) {
        return;
    }
    
    if (!confirm('This will permanently delete all your data. Type DELETE to confirm.')) {
        return;
    }
    
    // Backend Expected: DELETE /api/users/:id or PATCH /api/users/:id with { isActive: false }
    // Returns: Success message
    showNotification('Account deactivation requested. Please contact support.', 'warning');
}

function togglePasswordVisibility(inputId) {
    const input = document.getElementById(inputId);
    input.type = input.type === 'password' ? 'text' : 'password';
}

function toggleUserMenu() {
    const dropdown = document.getElementById('userDropdown');
    if (!dropdown) return;
    
    const isVisible = dropdown.style.display === 'block';
    dropdown.style.display = isVisible ? 'none' : 'block';
    
    // Close dropdown when clicking outside
    if (!isVisible) {
        setTimeout(() => {
            function closeDropdown(e) {
                const profile = document.getElementById('headerUserProfile');
                if (!dropdown.contains(e.target) && (!profile || !profile.contains(e.target))) {
                    dropdown.style.display = 'none';
                    document.removeEventListener('click', closeDropdown);
                }
            }
            document.addEventListener('click', closeDropdown);
        }, 0);
    }
}

function handleLogout() {
    logout();
}

