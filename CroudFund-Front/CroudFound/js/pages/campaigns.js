// Campaigns listing page functionality

let currentCategory = 'all';
let currentSearch = '';
let categories = []; // Store categories globally

document.addEventListener('DOMContentLoaded', async () => {
    checkAuthStatus();
    await loadCategories();
    await loadCampaigns();
    setupSearch();
    setupCategoryFilters();
});

async function checkAuthStatus() {
    const user = getCurrentUser();
    const authButtons = document.getElementById('authButtons');
    const userMenu = document.getElementById('userMenu');
        const userInitial = document.getElementById('userInitial');
        const userProfileImage = document.getElementById('userProfileImage');
        const userDropdownImage = document.getElementById('userDropdownImage');
        const userDropdownInitial = document.getElementById('userDropdownInitial');
        const userDropdownName = document.getElementById('userDropdownName');
        
        if (user) {
            authButtons.style.display = 'none';
            userMenu.style.display = 'block';
            
            // Set user name
            const fullName = user.fullName || 'User';
            const initial = fullName.charAt(0).toUpperCase();
            if (userInitial) {
                userInitial.textContent = initial;
            }
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
                                if (userDropdownInitial) userDropdownInitial.style.display = 'none';
                                userDropdownImage.onerror = function() {
                                    this.style.display = 'none';
                                    if (userDropdownInitial) {
                                        userDropdownInitial.textContent = initial;
                                        userDropdownInitial.style.display = 'flex';
                                    }
                                };
                            }
                        } else {
                            // No profile image, show initial in dropdown
                            if (userDropdownImage) userDropdownImage.style.display = 'none';
                            if (userDropdownInitial) {
                                userDropdownInitial.textContent = initial;
                                userDropdownInitial.style.display = 'flex';
                            }
                        }
                    }
                } catch (error) {
                    // Silently fail - user image is optional
                    console.warn('Could not fetch user details (non-critical):', error);
                    // Fallback: show initial in dropdown if no image
                    if (userDropdownImage) userDropdownImage.style.display = 'none';
                    if (userDropdownInitial) {
                        userDropdownInitial.textContent = initial;
                        userDropdownInitial.style.display = 'flex';
                    }
                }
            } else {
                // Not authenticated, show initial in dropdown
                if (userDropdownImage) userDropdownImage.style.display = 'none';
                if (userDropdownInitial) {
                    userDropdownInitial.textContent = initial;
                    userDropdownInitial.style.display = 'flex';
                }
            }
        } else {
            authButtons.style.display = 'flex';
            userMenu.style.display = 'none';
        }
}

async function loadCategories() {
    try {
        categories = await getCategories();
        
        // Ensure categories is an array
        if (!Array.isArray(categories)) {
            console.error('Categories is not an array:', categories);
            categories = [];
            return;
        }
        
        if (categories.length === 0) {
            console.warn('No categories found');
            return;
        }
        
        const filtersContainer = document.getElementById('categoryFilters');
        if (!filtersContainer) {
            console.error('Category filters container not found');
            return;
        }
        
        categories.forEach(category => {
            const button = document.createElement('button');
            button.className = 'category-filter';
            const categoryName = category.Name || category.name;
            const categoryId = category.Id || category.id;
            if (!categoryName || !categoryId) {
                console.warn('Invalid category:', category);
                return;
            }
            button.textContent = categoryName;
            button.dataset.categoryId = categoryId;
            button.onclick = () => filterByCategory(categoryId);
            filtersContainer.appendChild(button);
        });
    } catch (error) {
        console.error('Error loading categories:', error);
        categories = [];
        showNotification('Error loading categories. Please refresh the page.', 'error');
    }
}

async function loadCampaigns() {
    const loadingSpinner = document.getElementById('loadingSpinner');
    const noResults = document.getElementById('noResults');
    const grid = document.getElementById('campaignsGrid');
    
    if (!loadingSpinner || !noResults || !grid) {
        console.error('Required DOM elements not found');
        return;
    }
    
    loadingSpinner.style.display = 'block';
    noResults.style.display = 'none';
    grid.innerHTML = '';
    
    try {
        let campaigns = [];
        
        // If there's a search term, use global search
        if (currentSearch && currentSearch.trim().length > 0) {
            try {
                const searchResults = await globalSearch(currentSearch);
                console.log('Global search results:', searchResults);
                console.log('Search term:', currentSearch);
                console.log('Search results count:', searchResults?.length || 0);
                
                if (!Array.isArray(searchResults) || searchResults.length === 0) {
                    console.log('No search results returned');
                    campaigns = [];
                } else {
                    // Process all search result types
                    const allCampaigns = [];
                    
                    // 1. Extract Campaign type results directly
                    const campaignResults = searchResults.filter(result => {
                        const type = result.type || result.Type;
                        const campaignId = result.campaignId || result.CampaignId;
                        return type === 'Campaign' || campaignId != null;
                    });
                    
                    console.log(`Found ${campaignResults.length} campaign results`);
                    
                    // Map campaign results to campaign objects
                    campaignResults.forEach(result => {
                        const campaignId = result.campaignId || result.CampaignId;
                        const title = result.campaignTitle || result.CampaignTitle;
                        const description = result.campaignDescription || result.CampaignDescription;
                        const image = result.campaignImageUrl || result.CampaignImageUrl;
                        const categoryName = result.categoryName || result.CategoryName;
                        
                        if (campaignId) {
                            allCampaigns.push({
                                Id: campaignId,
                                id: campaignId,
                                Title: title,
                                title: title,
                                Description: description,
                                description: description,
                                Image: image,
                                image: image,
                                CategoryName: categoryName,
                                categoryName: categoryName
                            });
                        }
                    });
                    
                    // 2. Handle User type results - fetch campaigns for those users
                    const userResults = searchResults.filter(result => {
                        const type = result.type || result.Type;
                        const userId = result.userId || result.UserId;
                        return type === 'User' && userId != null;
                    });
                    
                    console.log(`Found ${userResults.length} user results`);
                    
                    if (userResults.length > 0) {
                        // Fetch campaigns for each user
                        const userCampaignPromises = userResults.map(async (userResult) => {
                            try {
                                const userId = userResult.userId || userResult.UserId;
                                // Note: getCampaignsByUser requires Admin auth, so we can't use it
                                // The backend search already includes campaigns from matching users
                                // So we don't need to fetch them separately
                                return [];
                            } catch (error) {
                                console.log(`Error fetching campaigns for user:`, error);
                                return [];
                            }
                        });
                        
                        const userCampaignsArrays = await Promise.all(userCampaignPromises);
                        const userCampaigns = userCampaignsArrays.flat();
                        allCampaigns.push(...userCampaigns);
                    }
                    
                    // 3. Handle Category type results - fetch campaigns for those categories
                    const categoryResults = searchResults.filter(result => {
                        const type = result.type || result.Type;
                        const categoryId = result.categoryId || result.CategoryId;
                        return type === 'Category' && categoryId != null;
                    });
                    
                    console.log(`Found ${categoryResults.length} category results`);
                    
                    if (categoryResults.length > 0) {
                        // Fetch campaigns for each category
                        const categoryCampaignPromises = categoryResults.map(async (categoryResult) => {
                            try {
                                const categoryId = categoryResult.categoryId || categoryResult.CategoryId;
                                const filters = {
                                    PageSize: 100,
                                    PageNumer: 1
                                };
                                const categoryCampaigns = await getCampaignsByCategory(categoryId, filters);
                                console.log(`Found ${categoryCampaigns.length} campaigns for category ${categoryId}`);
                                return categoryCampaigns || [];
                            } catch (error) {
                                console.log(`Error fetching campaigns for category:`, error);
                                return [];
                            }
                        });
                        
                        const categoryCampaignsArrays = await Promise.all(categoryCampaignPromises);
                        const categoryCampaigns = categoryCampaignsArrays.flat();
                        allCampaigns.push(...categoryCampaigns);
                    }
                    
                    // Remove duplicates based on campaign ID
                    const uniqueCampaigns = [];
                    const seenIds = new Set();
                    allCampaigns.forEach(campaign => {
                        const id = campaign.Id || campaign.id;
                        if (id && !seenIds.has(id)) {
                            seenIds.add(id);
                            uniqueCampaigns.push(campaign);
                        }
                    });
                    
                    campaigns = uniqueCampaigns;
                    console.log(`Total unique campaigns from search: ${campaigns.length}`);
                    
                    if (campaigns.length > 0) {
                        console.log('Sample campaign from search:', campaigns[0]);
                    } else {
                        console.warn('No campaigns found after processing search results');
                        console.warn('Search results structure:', JSON.stringify(searchResults, null, 2));
                    }
                }
            } catch (error) {
                // Handle search errors gracefully - just return empty array
                console.error('Search error:', error);
                campaigns = [];
            }
        } else {
            // Use regular campaign endpoints
            const filters = {
                PageSize: 100, // Get more campaigns
                PageNumer: 1  // Note: Backend uses "PageNumer" (typo) not "PageNumber"
            };
            
            console.log('Loading campaigns with filters:', filters, 'Category:', currentCategory);
            
            // Apply category filter
            if (currentCategory !== 'all') {
                console.log('Fetching campaigns for category:', currentCategory);
                campaigns = await getCampaignsByCategory(currentCategory, filters);
            } else {
                console.log('Fetching all approved campaigns');
                campaigns = await getApprovedCampaigns(filters);
            }
            
            console.log('Loaded campaigns count:', campaigns.length);
            if (campaigns.length > 0) {
                console.log('First campaign sample:', campaigns[0]);
            }
        }
        
        // Ensure campaigns is always an array
        if (!Array.isArray(campaigns)) {
            console.warn('Campaigns is not an array:', campaigns);
            campaigns = [];
        }
        
        loadingSpinner.style.display = 'none';
        
        // For campaigns from global search, we need to fetch full details if missing
        // Check if campaigns are from search (have CampaignId but missing GoalAmount/TotalAmountPaid)
        if (campaigns.length > 0 && currentSearch && currentSearch.trim().length > 0) {
            const needsFullDetails = campaigns.some(c => 
                (c.CampaignId || c.Id) && 
                (!c.GoalAmount && !c.goalAmount && c.GoalAmount !== 0)
            );
            
            if (needsFullDetails) {
                // Fetch full campaign details for each search result
                const fullCampaigns = await Promise.all(
                    campaigns.map(async (campaign) => {
                        try {
                            const campaignId = campaign.CampaignId || campaign.Id || campaign.id;
                            if (campaignId) {
                                const fullCampaign = await getCampaignById(campaignId);
                                // Merge search result data with full campaign data
                                return {
                                    ...fullCampaign,
                                    ...campaign, // Search result data takes precedence for display
                                    Id: fullCampaign.Id || campaignId,
                                    id: fullCampaign.Id || campaignId
                                };
                            }
                            return campaign;
                        } catch (error) {
                            console.log(`Could not fetch full details for campaign ${campaign.CampaignId || campaign.Id}:`, error);
                            // Return campaign with default values for missing fields
                            return {
                                ...campaign,
                                GoalAmount: campaign.GoalAmount || 1,
                                goalAmount: campaign.goalAmount || 1,
                                TotalAmountPaid: campaign.TotalAmountPaid || 0,
                                totalAmountPaid: campaign.totalAmountPaid || 0
                            };
                        }
                    })
                );
                campaigns = fullCampaigns.filter(c => c); // Remove any null/undefined
            }
        }
        
        if (campaigns.length === 0) {
            noResults.style.display = 'block';
            // Show appropriate message based on whether it's a search or not
            if (currentSearch && currentSearch.trim().length > 0) {
                noResults.innerHTML = '<p style="color: var(--text-secondary); font-size: 18px;">No campaigns found matching your search. Try a different search term.</p>';
            } else {
                noResults.innerHTML = '<p style="color: var(--text-secondary); font-size: 18px;">No campaigns found. Make sure the backend is running on https://localhost:7221</p>';
            }
            grid.innerHTML = '';
            return;
        }
        
        // Hide no results message if campaigns found
        noResults.style.display = 'none';
        
        campaigns.forEach(campaign => {
            if (!campaign) return; // Skip null/undefined campaigns
            
            const campaignId = campaign.Id || campaign.id;
            const title = campaign.Title || campaign.title || 'Untitled Campaign';
            const description = campaign.Description || campaign.description || '';
            const goalAmount = campaign.GoalAmount || campaign.goalAmount || 1;
            const raised = campaign.TotalAmountPaid || campaign.totalAmountPaid || 0;
            const deadline = campaign.Deadline || campaign.deadline;
            const categoryName = campaign.CategoryName || campaign.categoryName || 'General';
            const imagePath = campaign.Image || campaign.image;
            
            // Build full image URL from backend
            const image = imagePath ? buildImageUrl(imagePath) : null;
            
            // Log for debugging
            if (imagePath) {
                console.log(`Campaign ${campaignId} image:`, imagePath, '->', image);
            }
            
            // Format percentage to 2 decimal places
            let percentage = calculatePercentage(raised, goalAmount);
            if (typeof percentage === 'number') {
                percentage = percentage.toFixed(2);
            }
            const daysLeft = deadline ? getDaysRemaining(deadline) : 'N/A';
            
            const card = document.createElement('div');
            card.className = 'campaign-card';
            card.onclick = () => redirectTo(`campaign-detail.html?id=${campaignId}`);
            
            // Use placeholder images
            const placeholderImage = `https://source.unsplash.com/400x200/?campaign,project&sig=${campaignId}`;
            
            // Build image URL and create image element with proper error handling
            const imgSrc = image || placeholderImage;
            const finalPlaceholder = `https://via.placeholder.com/400x200/141b2d/ffffff?text=${encodeURIComponent(title.substring(0, 20))}`;
            
            card.innerHTML = `
                <img src="${imgSrc}" alt="${title}" class="campaign-image" onerror="this.onerror=null; this.src='${finalPlaceholder}';">
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
        console.error('Error stack:', error.stack);
        loadingSpinner.style.display = 'none';
        noResults.style.display = 'block';
        
        // Only show error message for actual errors, not for empty results
        // Check if it's a network/connection error vs empty results
        const isNetworkError = error.message && (
            error.message.includes('Failed to fetch') || 
            error.message.includes('NetworkError') ||
            error.message.includes('Cannot connect') ||
            error.message.includes('backend is running')
        );
        
        if (isNetworkError) {
            const friendlyMessage = getUserFriendlyErrorMessage(error);
            noResults.innerHTML = `<p style="color: var(--error-color); font-size: 18px;">${friendlyMessage}</p>`;
            handleError(error, 'Unable to load campaigns. Please check your connection and try again.');
        } else {
            // For other errors (like 404 for empty results), show a friendly message
            if (currentSearch && currentSearch.trim().length > 0) {
                noResults.innerHTML = '<p style="color: var(--text-secondary); font-size: 18px;">No campaigns found matching your search. Try a different search term.</p>';
            } else {
                noResults.innerHTML = '<p style="color: var(--text-secondary); font-size: 18px;">No campaigns found at this time.</p>';
            }
        }
        grid.innerHTML = '';
    }
}

function filterByCategory(categoryId) {
    currentCategory = categoryId;
    
    // Update active filter
    document.querySelectorAll('.category-filter').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    loadCampaigns();
}

function setupSearch() {
    const searchInput = document.getElementById('campaignSearch');
    const debouncedSearch = debounce((query) => {
        currentSearch = query;
        loadCampaigns();
    }, 500);
    
    searchInput.addEventListener('input', (e) => {
        debouncedSearch(e.target.value);
    });
    
    // Check URL params for search
    const urlSearch = getQueryParam('search');
    if (urlSearch) {
        searchInput.value = urlSearch;
        currentSearch = urlSearch;
        loadCampaigns();
    }
}

function setupCategoryFilters() {
    // Check URL params for category
    const urlCategory = getQueryParam('category');
    if (urlCategory) {
        currentCategory = urlCategory;
        document.querySelectorAll('.category-filter').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.categoryId === urlCategory || (urlCategory === 'all' && btn.dataset.category === 'all')) {
                btn.classList.add('active');
            }
        });
    }
}

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

function handleLogout() {
    logout();
}

