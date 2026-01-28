// Homepage functionality

document.addEventListener('DOMContentLoaded', async () => {
    await loadStatistics();
    await loadCategories();
    await loadFeaturedCampaigns();
    await loadSpotlightCampaign();
    checkAuthStatus();
    setupSearch();
});

// Check authentication status and update UI
async function checkAuthStatus() {
    const user = getCurrentUser();
    const authButtons = document.getElementById('authButtons');
    const userMenu = document.getElementById('userMenu');
    const userInitial = document.getElementById('userInitial');
    const userProfileImage = document.getElementById('userProfileImage');
    const userDropdownImage = document.getElementById('userDropdownImage');
    const userDropdownName = document.getElementById('userDropdownName');
    
    if (user) {
        authButtons.style.display = 'none';
        userMenu.style.display = 'block';
        
        // Set user name
        const fullName = user.fullName || 'User';
        userInitial.textContent = fullName.charAt(0).toUpperCase();
        if (userDropdownName) {
            userDropdownName.textContent = fullName;
        }
        
        // Try to get user details with profile image (only if authenticated)
        if (isAuthenticated()) {
            try {
                const userDetails = await getMyDetails();
                if (userDetails) {
                    const profileImagePath = userDetails.ProfileImage || userDetails.profileImage;
                    if (profileImagePath) {
                        const imageUrl = buildImageUrl(profileImagePath);
                        if (userProfileImage) {
                            userProfileImage.src = imageUrl;
                            userProfileImage.style.display = 'block';
                            userProfileImage.onerror = function() {
                                this.style.display = 'none';
                                if (userInitial) userInitial.style.display = 'flex';
                            };
                            if (userInitial) userInitial.style.display = 'none';
                        }
                        if (userDropdownImage) {
                            userDropdownImage.src = imageUrl;
                            userDropdownImage.style.display = 'block';
                            userDropdownImage.onerror = function() {
                                this.style.display = 'none';
                            };
                        }
                    }
                }
            } catch (error) {
                // Silently fail - user image is optional
                console.warn('Could not fetch user details (non-critical):', error);
            }
        }
    } else {
        authButtons.style.display = 'flex';
        userMenu.style.display = 'none';
    }
}

// Load platform statistics
async function loadStatistics() {
    try {
        // Use analytics/dashboard endpoint for home page statistics
        const dashboardStats = await getDashboardStatistics();
        
        if (dashboardStats) {
            // Update UI with real data from backend
            document.getElementById('totalRaised').textContent = formatCurrency(dashboardStats.totalRevenue || 0);
            document.getElementById('totalDonators').textContent = (dashboardStats.activeDonors || 0).toLocaleString();
            document.getElementById('totalCampaigns').textContent = (dashboardStats.totalCampaigns || 0).toString();

            // Calculate growth percentages from backend statistics
            const revenueGrowth = dashboardStats.revenueGrowthPercentage || 0;
            const donorGrowth = dashboardStats.donorGrowthPercentage || 0;
            const campaignsGrowth = dashboardStats.campaignsGrowthPercentage || 0;

            const revenueGrowthText = revenueGrowth >= 0 ? `+${revenueGrowth.toFixed(1)}%` : `${revenueGrowth.toFixed(1)}%`;
            const donorGrowthText = donorGrowth >= 0 ? `+${donorGrowth.toFixed(1)}%` : `${donorGrowth.toFixed(1)}%`;
            const campaignsGrowthText = campaignsGrowth >= 0 ? `+${campaignsGrowth.toFixed(1)}%` : `${campaignsGrowth.toFixed(1)}%`;

            document.getElementById('raisedChange').textContent = `${revenueGrowthText} from last month`;
            document.getElementById('donatorsChange').textContent = `${donorGrowthText} this month`;
            document.getElementById('campaignsChange').textContent = `${campaignsGrowthText} this month`;
            
            // Load top donors avatars
            await loadDonatorsAvatars();
        } else {
            // Fallback to calculated values if endpoint not available
            const campaigns = await getApprovedCampaigns();
            // Ensure campaigns is an array
            const campaignsArray = Array.isArray(campaigns) ? campaigns : [];
            const totalRaised = campaignsArray.reduce((sum, c) => sum + (c.TotalAmountPaid || c.totalAmountPaid || 0), 0);
            
            document.getElementById('totalRaised').textContent = formatCurrency(totalRaised);
            document.getElementById('totalDonators').textContent = '0';
            document.getElementById('totalCampaigns').textContent = campaignsArray.length.toString();
        }
    } catch (error) {
        console.error('Error loading statistics:', error);
        // Set default values if API fails
        document.getElementById('totalRaised').textContent = formatCurrency(0);
        document.getElementById('totalDonators').textContent = '0';
        document.getElementById('totalCampaigns').textContent = '0';
    }
}

// Load categories for filters
async function loadCategories() {
    try {
        const categories = await getCategories();
        
        if (!Array.isArray(categories)) {
            return;
        }
        
        const filtersContainer = document.getElementById('categoryFilters');
        categories.forEach(category => {
            const button = document.createElement('button');
            button.className = 'category-filter';
            const categoryName = category.Name || category.name;
            const categoryId = category.Id || category.id;
            button.textContent = categoryName;
            button.dataset.categoryId = categoryId;
            button.onclick = () => filterCampaigns(categoryId);
            filtersContainer.appendChild(button);
        });
        
        // Add "All Campaigns" filter functionality
        const activeFilter = document.querySelector('.category-filter.active');
        if (activeFilter) {
            activeFilter.onclick = () => filterCampaigns('all');
        }
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

// Load featured campaigns
async function loadFeaturedCampaigns(categoryId = 'all') {
    try {
        let campaigns;
        
        // Use top campaigns endpoint for home page
        if (categoryId === 'all') {
            campaigns = await getTopCampaigns(6);
        } else {
            // If filtering by category, use approved campaigns endpoint
            campaigns = await getCampaignsByCategory(categoryId, { PageSize: 6 });
        }
        
        const grid = document.getElementById('campaignsGrid');
        grid.innerHTML = '';
        
        // Ensure campaigns is always an array
        if (!Array.isArray(campaigns)) {
            campaigns = [];
        }
        
        if (campaigns.length === 0) {
            grid.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 40px;">No campaigns found. Make sure the backend is running!</p>';
            return;
        }
        
        // Ensure campaigns is always an array
        if (!Array.isArray(campaigns)) {
            campaigns = [];
        }
        
        // Display campaigns
        campaigns.forEach(campaign => {
            // Handle both top campaigns format and regular campaign format
            const campaignId = campaign.Id || campaign.id || campaign.campaignId;
            const title = campaign.Title || campaign.title || campaign.campaignTitle || 'Untitled';
            // For top campaigns, use campaignDescription; for regular campaigns, use Description
            const description = campaign.Description || campaign.description || campaign.campaignDescription || '';
            const categoryName = campaign.CategoryName || campaign.categoryName || 'General';
            // For top campaigns, use campaignImage; for regular campaigns, use Image
            const imagePath = campaign.Image || campaign.image || campaign.campaignImage || '';
            
            // For top campaigns, use totalCollected; for regular campaigns, use TotalAmountPaid
            const raised = campaign.TotalAmountPaid || campaign.totalAmountPaid || campaign.totalCollected || 0;
            
            // For top campaigns, use goalAmount directly; for regular campaigns, use GoalAmount
            let goalAmount = campaign.GoalAmount || campaign.goalAmount;
            if (!goalAmount && campaign.completionPercentage && campaign.completionPercentage > 0) {
                goalAmount = raised / (campaign.completionPercentage / 100);
            }
            goalAmount = goalAmount || 1;
            
            // Format percentage to 2 decimal places
            let percentage = campaign.completionPercentage || calculatePercentage(raised, goalAmount);
            if (typeof percentage === 'number') {
                percentage = percentage.toFixed(2);
            }
            const deadline = campaign.Deadline || campaign.deadline;
            const daysLeft = deadline ? getDaysRemaining(deadline) : 'N/A';
            
            const card = document.createElement('div');
            card.className = 'campaign-card';
            card.onclick = () => redirectTo(`pages/campaign-detail.html?id=${campaignId}`);
            
            // Build full image URL from backend
            const image = imagePath ? buildImageUrl(imagePath) : null;
            
            // Use placeholder images from Unsplash
            const placeholderImage = `https://source.unsplash.com/400x200/?campaign,project&sig=${campaignId}`;
            
            card.innerHTML = `
                <img src="${image || placeholderImage}" alt="${title}" class="campaign-image" onerror="this.src='https://via.placeholder.com/400x200/141b2d/ffffff?text=${encodeURIComponent(title.substring(0, 20))}'">
                <div class="campaign-content">
                    <span class="campaign-category" style="background: rgba(0, 124, 255, 0.2); color: var(--primary-color);">${categoryName.toUpperCase()}</span>
                    <h3 class="campaign-title">${title}</h3>
                    <p class="campaign-description">${description ? description.substring(0, 100) + (description.length > 100 ? '...' : '') : ''}</p>
                    <div class="campaign-progress">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${percentage}%"></div>
                        </div>
                        <div class="campaign-stats">
                            <span>${formatCurrency(raised)} raised of ${formatCurrency(goalAmount)}</span>
                            <span class="campaign-days">${daysLeft} DAYS LEFT</span>
                        </div>
                    </div>
                </div>
            `;
            
            grid.appendChild(card);
        });
    } catch (error) {
        console.error('Error loading campaigns:', error);
        const grid = document.getElementById('campaignsGrid');
        
        // Only show error for network/connection errors, not for empty results
        const isNetworkError = error.message && (
            error.message.includes('Failed to fetch') || 
            error.message.includes('NetworkError') ||
            error.message.includes('Cannot connect') ||
            error.message.includes('backend is running')
        );
        
        if (isNetworkError) {
            grid.innerHTML = '<p style="color: var(--error-color); text-align: center; padding: 40px;">Error loading campaigns. Please make sure the backend is running.</p>';
        } else {
            // For other errors (like empty results), show a friendly message
            grid.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 40px;">No campaigns found at this time.</p>';
        }
    }
}

// Filter campaigns by category
function filterCampaigns(categoryId) {
    // Update active filter
    document.querySelectorAll('.category-filter').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    loadFeaturedCampaigns(categoryId);
}

// Load spotlight campaign
async function loadSpotlightCampaign() {
    try {
        // Use top campaigns endpoint - get the first one as spotlight
        const topCampaigns = await getTopCampaigns(1);
        
        // Ensure topCampaigns is an array
        if (!Array.isArray(topCampaigns)) {
            topCampaigns = [];
        }
        
        if (topCampaigns.length > 0) {
            const spotlight = topCampaigns[0];
            const campaignId = spotlight.Id || spotlight.id || spotlight.campaignId;
            
            // Use data directly from top-campaigns response (no need to fetch full campaign details)
            const raised = spotlight.totalCollected || spotlight.TotalAmountPaid || 0;
            const goalAmount = spotlight.goalAmount || spotlight.GoalAmount || 1;
            
            // Format percentage to 2 decimal places
            let percentage = spotlight.completionPercentage || calculatePercentage(raised, goalAmount);
            if (typeof percentage === 'number') {
                percentage = percentage.toFixed(2);
            }
            
            // Use new fields from top-campaigns response
            const title = spotlight.campaignTitle || spotlight.Title || 'Untitled';
            const userName = spotlight.userName || spotlight.UserName || 'Unknown';
            // Use campaignImage from top-campaigns response
            const imagePath = spotlight.campaignImage || spotlight.Image || spotlight.image || '';
            
            // Build full image URL from backend
            const image = imagePath ? buildImageUrl(imagePath) : null;
            const spotlightImage = image || `https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=400&fit=crop&auto=format`;
            document.getElementById('spotlightImage').src = spotlightImage;
            document.getElementById('spotlightImage').onerror = function() {
                this.src = `https://via.placeholder.com/600x400/007cff/ffffff?text=${encodeURIComponent(title)}`;
            };
            document.getElementById('spotlightTitle').textContent = title;
            document.getElementById('spotlightCreator').textContent = `By ${userName}`;
            document.getElementById('spotlightProgress').textContent = `${percentage}% Funded`;
        }
    } catch (error) {
        console.error('Error loading spotlight:', error);
    }
}

// Setup search functionality
function setupSearch() {
    const searchInput = document.getElementById('searchInput');
    const debouncedSearch = debounce(async (query) => {
        if (query.length > 2) {
            // Use global search
            await handleGlobalSearch(query);
        }
    }, 500);
    
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            debouncedSearch(e.target.value);
        });
        
        // Handle Enter key
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && searchInput.value.trim().length > 0) {
                e.preventDefault();
                handleGlobalSearch(searchInput.value);
            }
        });
    }
}

// Search functions are now in search-utils.js

// Toggle user menu
function toggleUserMenu(event) {
    if (event) {
        event.stopPropagation();
    }
    const dropdown = document.getElementById('userDropdown');
    const isVisible = dropdown.style.display !== 'none';
    dropdown.style.display = isVisible ? 'none' : 'block';
    
    // Close dropdown when clicking outside
    if (!isVisible) {
        setTimeout(() => {
            document.addEventListener('click', closeUserMenuOnOutsideClick, true);
        }, 0);
    } else {
        document.removeEventListener('click', closeUserMenuOnOutsideClick, true);
    }
}

function closeUserMenuOnOutsideClick(event) {
    const userMenu = document.getElementById('userMenu');
    const dropdown = document.getElementById('userDropdown');
    if (userMenu && dropdown && !userMenu.contains(event.target)) {
        dropdown.style.display = 'none';
        document.removeEventListener('click', closeUserMenuOnOutsideClick, true);
    }
}

// Load donators avatars
async function loadDonatorsAvatars() {
    try {
        // Get top donors from analytics endpoint
        const topDonors = await getTopDonors(10);
        const avatarsContainer = document.getElementById('donatorsAvatars');
        avatarsContainer.innerHTML = '';
        
        if (!Array.isArray(topDonors) || topDonors.length === 0) {
            return;
        }
        
        // Show first 4-5 donators
        const donorsToShow = topDonors.slice(0, 5);
        
        // Use UserImage from the response (no need to fetch user details separately)
        donorsToShow.forEach((donor) => {
            const userId = donor.UserId || donor.userId;
            const userName = donor.UserName || donor.userName || 'User';
            const userImagePath = donor.UserImage || donor.userImage || null;
            
            // Build full image URL from backend
            const profileImage = userImagePath ? buildImageUrl(userImagePath) : null;
            const avatarUrl = profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=007cff&color=fff&size=32`;
            
            const avatar = document.createElement('div');
            avatar.style.cssText = 'width: 32px; height: 32px; border-radius: 50%; overflow: hidden; border: 2px solid var(--bg-darker);';
            avatar.innerHTML = `
                <img src="${avatarUrl}" 
                     alt="${userName}" 
                     style="width: 100%; height: 100%; object-fit: cover;"
                     onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=007cff&color=fff&size=32'">
            `;
            avatarsContainer.appendChild(avatar);
        });
    } catch (error) {
        console.error('Error loading donators avatars:', error);
    }
}

// Handle logout
function handleLogout() {
    logout();
}

// Handle Start Campaign button click - check auth first
function handleStartCampaign(event) {
    event.preventDefault();
    
    // Check if user is authenticated
    if (!isAuthenticated()) {
        // Redirect to login page
        redirectTo('pages/login.html');
    } else {
        // User is authenticated, go to create campaign page
        redirectTo('pages/create-campaign.html');
    }
}

