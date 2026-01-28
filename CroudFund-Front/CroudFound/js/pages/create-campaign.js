// Create campaign wizard functionality

let currentStep = 1;
let campaignData = {
    image: null
};
let isEditMode = false;
let editCampaignId = null;

document.addEventListener('DOMContentLoaded', async () => {
    if (!requireAuth()) return;
    
    setupDateInput();
    await checkAuthStatus();
    
    // Initialize step UI to show back button on step 1
    updateStepUI();
    
    // Always load categories first
    await loadCategories();
    
    // Check if we're in edit mode - load campaign after categories are loaded
    const urlParams = new URLSearchParams(window.location.search);
    const editId = urlParams.get('edit');
    if (editId) {
        isEditMode = true;
        editCampaignId = parseInt(editId);
        await loadCampaignForEdit(editCampaignId);
    }
});

async function checkAuthStatus() {
    try {
        const user = getCurrentUser();
        if (!user) return;
        
        // Try to get fresh user data from API
        let userDetails = null;
        if (isAuthenticated()) {
            try {
                userDetails = await getMyDetails();
            } catch (error) {
                console.warn('Could not fetch user details from API, using cached data:', error);
            }
        }
        
        const fullName = userDetails?.FullName || userDetails?.fullName || user.fullName || 'User';
        const profileImage = userDetails?.ProfileImage || userDetails?.profileImage || user.profileImage;
        
        // Set user initials
        const initial = fullName.charAt(0).toUpperCase();
        const userInitialEl = document.getElementById('userInitial');
        if (userInitialEl) {
            userInitialEl.textContent = initial;
        }
        
        // Set profile image in header
        const headerUserImage = document.getElementById('headerUserImage');
        const headerUserProfile = document.getElementById('headerUserProfile');
        const userDropdownImage = document.getElementById('userDropdownImage');
        const userDropdownInitial = document.getElementById('userDropdownInitial');
        const userDropdownName = document.getElementById('userDropdownName');
        
        if (profileImage) {
            const imageUrl = buildImageUrl(profileImage);
            if (headerUserImage) {
                headerUserImage.src = imageUrl;
                headerUserImage.style.display = 'block';
                if (userInitialEl) userInitialEl.style.display = 'none';
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
    } catch (error) {
        console.error('Error in checkAuthStatus:', error);
    }
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
    if (typeof logout === 'function') {
        logout();
    } else {
        // Fallback if logout function is not available
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        window.location.href = '../index.html';
    }
}

async function loadCategories() {
    try {
        const categories = await getCategories();
        
        // Ensure categories is an array
        if (!Array.isArray(categories)) {
            console.error('Categories is not an array:', categories);
            return;
        }
        
        const select = document.getElementById('campaignCategory');
        if (!select) {
            console.error('Category select element not found');
            return;
        }
        
        // Clear existing options except the first one (placeholder)
        while (select.options.length > 1) {
            select.remove(1);
        }
        
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.Id || category.id;
            option.textContent = category.Name || category.name;
            select.appendChild(option);
        });
        
        if (categories.length === 0) {
            console.warn('No categories found');
        }
    } catch (error) {
        console.error('Error loading categories:', error);
        showNotification('Error loading categories. Please refresh the page.', 'error');
    }
}

function setupDateInput() {
    const deadlineInput = document.getElementById('deadline');
    const today = new Date();
    const maxDate = new Date();
    maxDate.setFullYear(maxDate.getFullYear() + 2);
    deadlineInput.min = today.toISOString().split('T')[0];
    deadlineInput.max = maxDate.toISOString().split('T')[0];
}

async function handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024) {
        showNotification('Image size must be less than 5MB', 'error');
        return;
    }
    
    try {
        // Store file object for FormData upload
        campaignData.image = file;
        
        // Show preview using FileReader
        const reader = new FileReader();
        reader.onload = (e) => {
            const preview = document.getElementById('imagePreview');
            preview.src = e.target.result;
            preview.style.display = 'block';
        };
        reader.readAsDataURL(file);
    } catch (error) {
        console.error('Error uploading image:', error);
        showNotification('Error uploading image', 'error');
    }
}

function nextStep() {
    if (currentStep === 1) {
        // Validate step 1
        const title = document.getElementById('campaignTitle').value;
        const category = document.getElementById('campaignCategory').value;
        const description = document.getElementById('campaignDescription').value;
        const goalAmount = document.getElementById('goalAmount').value;
        const deadline = document.getElementById('deadline').value;
        
        if (!title || !category || !description || !goalAmount || !deadline) {
            showNotification('Please fill in all required fields', 'error');
            return;
        }
    }
    
    if (currentStep < 3) {
        currentStep++;
        updateStepUI();
    }
}

function previousStep() {
    if (currentStep > 1) {
        currentStep--;
        updateStepUI();
    }
}

function goBackToPreviousPage() {
    // Check if there's a referrer (previous page)
    if (document.referrer && document.referrer !== window.location.href) {
        // Go back to the previous page
        window.history.back();
    } else {
        // Default to my-campaigns if in edit mode, or dashboard if creating new
        if (isEditMode) {
            window.location.href = 'my-campaigns.html';
        } else {
            window.location.href = 'dashboard.html';
        }
    }
}

function updateStepUI() {
    // Update step indicators
    document.querySelectorAll('.wizard-step').forEach((step, index) => {
        step.classList.remove('active', 'completed');
        if (index + 1 < currentStep) {
            step.classList.add('completed');
            step.querySelector('.step-indicator').textContent = '✓';
        } else if (index + 1 === currentStep) {
            step.classList.add('active');
            step.querySelector('.step-indicator').textContent = index + 1;
        } else {
            step.querySelector('.step-indicator').textContent = index + 1;
        }
    });
    
    // Update step content
    document.querySelectorAll('.wizard-step-content').forEach((content, index) => {
        content.classList.remove('active');
        if (index + 1 === currentStep) {
            content.classList.add('active');
        }
    });
    
    // Update progress
    const progress = (currentStep / 3) * 100;
    document.getElementById('progressBar').style.width = `${progress}%`;
    document.getElementById('progressPercent').textContent = Math.round(progress);
    
    // Update step name
    const stepNames = ['Basics', 'Story', 'Review'];
    document.getElementById('currentStep').textContent = currentStep;
    document.getElementById('stepName').textContent = stepNames[currentStep - 1];
    
    // Update navigation buttons
    // Show back button on step 1 (to go back to previous page) or on other steps (to go to previous step)
    const prevButton = document.getElementById('prevButton');
    if (prevButton) {
        if (currentStep === 1) {
            prevButton.style.display = 'block';
            prevButton.textContent = '← Back';
            prevButton.onclick = goBackToPreviousPage;
        } else {
            prevButton.style.display = 'block';
            prevButton.textContent = '← Previous';
            prevButton.onclick = previousStep;
        }
    }
    document.getElementById('nextButton').style.display = currentStep < 3 ? 'block' : 'none';
    document.getElementById('submitButton').style.display = currentStep === 3 ? 'block' : 'none';
    
    // Load review content on step 3
    if (currentStep === 3) {
        loadReviewContent();
    }
}

function loadReviewContent() {
    const reviewContent = document.getElementById('reviewContent');
    
    const title = document.getElementById('campaignTitle').value;
    const category = document.getElementById('campaignCategory');
    const categoryName = category.options[category.selectedIndex].text;
    const description = document.getElementById('campaignDescription').value;
    const goalAmount = document.getElementById('goalAmount').value;
    const deadline = document.getElementById('deadline').value;
    
    reviewContent.innerHTML = `
        <div class="card" style="margin-bottom: 24px;">
            <h3 style="margin-bottom: 16px;">Campaign Title</h3>
            <p>${title}</p>
        </div>
        <div class="card" style="margin-bottom: 24px;">
            <h3 style="margin-bottom: 16px;">Category</h3>
            <p>${categoryName}</p>
        </div>
        <div class="card" style="margin-bottom: 24px;">
            <h3 style="margin-bottom: 16px;">Description</h3>
            <p>${description}</p>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px;">
            <div class="card">
                <h3 style="margin-bottom: 16px;">Goal Amount</h3>
                <p style="font-size: 24px; font-weight: 700;">${formatCurrency(goalAmount)}</p>
            </div>
            <div class="card">
                <h3 style="margin-bottom: 16px;">Deadline</h3>
                <p style="font-size: 24px; font-weight: 700;">${formatDate(deadline)}</p>
            </div>
        </div>
        ${campaignData.image ? `
            <div class="card" style="margin-top: 24px;">
                <h3 style="margin-bottom: 16px;">Campaign Image</h3>
                <img src="${typeof campaignData.image === 'string' ? campaignData.image : URL.createObjectURL(campaignData.image)}" style="max-width: 100%; border-radius: 8px;">
            </div>
        ` : ''}
    `;
}

async function loadCampaignForEdit(campaignId) {
    try {
        const campaign = await getCampaignById(campaignId);
        
        // Populate form fields
        document.getElementById('campaignTitle').value = campaign.Title || campaign.title || '';
        document.getElementById('campaignDescription').value = campaign.Description || campaign.description || '';
        document.getElementById('goalAmount').value = campaign.GoalAmount || campaign.goalAmount || '';
        
        // Set deadline - ensure it's in the correct format (YYYY-MM-DD)
        const deadline = campaign.Deadline || campaign.deadline;
        if (deadline) {
            const deadlineDate = new Date(deadline);
            if (!isNaN(deadlineDate.getTime())) {
                // Format as YYYY-MM-DD for date input
                const year = deadlineDate.getFullYear();
                const month = String(deadlineDate.getMonth() + 1).padStart(2, '0');
                const day = String(deadlineDate.getDate()).padStart(2, '0');
                const deadlineInput = document.getElementById('deadline');
                if (deadlineInput) {
                    deadlineInput.value = `${year}-${month}-${day}`;
                }
            }
        }
        
        // Set category - ensure select is populated first
        const categoryId = campaign.CategoryId || campaign.categoryId;
        if (categoryId) {
            const categorySelect = document.getElementById('campaignCategory');
            if (categorySelect) {
                // Set immediately
                categorySelect.value = categoryId.toString();
                
                // Verify it was set correctly, retry if needed
                if (categorySelect.value !== categoryId.toString()) {
                    let attempts = 0;
                    const setCategory = () => {
                        if (categorySelect && attempts < 20) {
                            categorySelect.value = categoryId.toString();
                            if (categorySelect.value !== categoryId.toString()) {
                                attempts++;
                                setTimeout(setCategory, 50);
                            } else {
                                console.log('Category set successfully:', categoryId);
                            }
                        }
                    };
                    setTimeout(setCategory, 100);
                } else {
                    console.log('Category set successfully on first try:', categoryId);
                }
            }
        }
        
        // Load existing image
        if (campaign.Image || campaign.image) {
            const imageUrl = buildImageUrl(campaign.Image || campaign.image);
            campaignData.image = imageUrl; // Store as URL string for preview
            const preview = document.getElementById('imagePreview');
            if (preview) {
                preview.src = imageUrl;
                preview.style.display = 'block';
            }
        }
        
        // Update page title
        const pageTitle = document.querySelector('h1');
        if (pageTitle) {
            pageTitle.textContent = 'Edit Campaign';
        }
        
        // Update submit button text
        const submitButton = document.getElementById('submitButton');
        if (submitButton) {
            submitButton.textContent = 'Update Campaign';
        }
    } catch (error) {
        console.error('Error loading campaign for edit:', error);
        handleError(error, 'Unable to load campaign. Please try again.');
    }
}

async function handleSubmit(event) {
    event.preventDefault();
    
    const user = getCurrentUser();
    if (!user) {
        showNotification('Please login to create a campaign', 'error');
        redirectTo('login.html');
        return;
    }
    
    try {
        const campaign = {
            title: document.getElementById('campaignTitle').value,
            description: document.getElementById('campaignDescription').value,
            goalAmount: parseFloat(document.getElementById('goalAmount').value),
            deadline: new Date(document.getElementById('deadline').value).toISOString(),
            image: campaignData.image instanceof File ? campaignData.image : null, // Only send if it's a new file
            categoryId: parseInt(document.getElementById('campaignCategory').value)
        };
        
        if (isEditMode && editCampaignId) {
            // Update existing campaign
            await updateCampaign(editCampaignId, campaign);
            showNotification('Campaign updated successfully!', 'success');
            // Immediately redirect to dashboard - don't wait
            window.location.href = 'my-campaigns.html';
            return; // Prevent any further execution
        } else {
            // Create new campaign
            const createdCampaign = await createCampaign(campaign);
            showNotification('Campaign created successfully!', 'success');
            setTimeout(() => {
                const campaignId = createdCampaign.Id || createdCampaign.id;
                redirectTo(`campaign-detail.html?id=${campaignId}`);
            }, 1000);
        }
    } catch (error) {
        console.error(`Error ${isEditMode ? 'updating' : 'creating'} campaign:`, error);
        handleError(error, `Unable to ${isEditMode ? 'update' : 'create'} campaign. Please check all fields and try again.`);
    }
}

function saveDraft() {
    showNotification('Draft saved successfully!', 'success');
    // In real app, save to localStorage or backend
}

