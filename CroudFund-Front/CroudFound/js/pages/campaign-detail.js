// Campaign detail page functionality

let campaignId = null;
let selectedAmount = 0;
let loveRating = 0;
let selectedReaction = null;

document.addEventListener('DOMContentLoaded', async () => {
    campaignId = getQueryParam('id');
    if (!campaignId) {
        showNotification('Campaign not found', 'error');
        redirectTo('campaigns.html');
        return;
    }
    
    checkAuthStatus();
    await loadCampaignDetails();
    await loadRewards();
    await loadReviews();
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

async function loadCampaignDetails() {
    try {
        // GET /api/Campaigns/:id
        const campaign = await getCampaignById(campaignId);
        
        // Extract field names (handle both .NET and legacy formats)
        const campaignIdNum = campaign.Id || campaign.id;
        const title = campaign.Title || campaign.title;
        const description = campaign.Description || campaign.description;
        const goalAmount = campaign.GoalAmount || campaign.goalAmount;
        const raised = campaign.TotalAmountPaid || campaign.totalAmountPaid || 0;
        const deadline = campaign.Deadline || campaign.deadline;
        const createdAt = campaign.CreatedAt || campaign.createdAt;
        const imagePath = campaign.Image || campaign.image;
        const userName = campaign.UserName || campaign.userName;
        const categoryName = campaign.CategoryName || campaign.categoryName;
        // Get donor count from campaign response (backend now provides this)
        const donorCount = campaign.TotalDonorsCount || campaign.totalDonorsCount || 0;
        
        // Format percentage to 2 decimal places
        let percentage = calculatePercentage(raised, goalAmount);
        if (typeof percentage === 'number') {
            percentage = percentage.toFixed(2);
        }
        const daysLeft = deadline ? getDaysRemaining(deadline) : 'N/A';
        
        // Build full image URL from backend
        const image = imagePath ? buildImageUrl(imagePath) : null;
        const campaignImage = image || `https://source.unsplash.com/800x400/?campaign,project&sig=${campaignIdNum}`;
        document.getElementById('campaignImage').src = campaignImage;
        document.getElementById('campaignImage').onerror = function() {
            this.src = `https://via.placeholder.com/800x400/141b2d/ffffff?text=${encodeURIComponent(title.substring(0, 30))}`;
        };
        document.getElementById('campaignTitle').textContent = title;
        document.getElementById('campaignCreator').textContent = `by ${userName || 'Unknown'} • ${categoryName || 'Category'}`;
        document.getElementById('campaignDescription').textContent = description;
        document.getElementById('pledgedAmount').textContent = formatCurrency(raised);
        document.getElementById('pledgedText').textContent = `pledged of ${formatCurrency(goalAmount)} goal`;
        document.getElementById('progressFill').style.width = `${percentage}%`;
        document.getElementById('donatorsCount').textContent = donorCount.toLocaleString();
        document.getElementById('daysLeft').textContent = daysLeft;
        
        // Load specs
        const specsList = document.getElementById('campaignSpecs');
        specsList.innerHTML = `
            <li style="padding: 8px 0; border-bottom: 1px solid var(--border-color);">• Campaign goal: ${formatCurrency(goalAmount)}</li>
            <li style="padding: 8px 0; border-bottom: 1px solid var(--border-color);">• Deadline: ${formatDate(deadline)}</li>
            <li style="padding: 8px 0; border-bottom: 1px solid var(--border-color);">• Category: ${categoryName || 'General'}</li>
            <li style="padding: 8px 0;">• Created: ${formatDate(createdAt)}</li>
        `;
        
        // Check if user can review
        const user = getCurrentUser();
        if (user) {
            await checkReviewEligibilityForUser(user.id);
        }
    } catch (error) {
        console.error('Error loading campaign:', error);
        handleError(error, 'Unable to load campaign details. Please refresh the page.');
    }
}

async function loadRewards() {
    // Mock rewards - in real app, this would come from backend
    const rewardsList = document.getElementById('rewardsList');
    rewardsList.innerHTML = `
        <div class="reward-card">
            <div class="reward-header">
                <div>
                    <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 4px;">EARLY BIRD SPECIAL</div>
                    <div style="font-size: 20px; font-weight: 700;">$1,499 or more</div>
                </div>
                <span class="status-badge status-active" style="font-size: 10px;">5 LEFT!</span>
            </div>
            <h4 style="margin-bottom: 8px;">Founder Edition</h4>
            <p style="color: var(--text-secondary); font-size: 14px; margin-bottom: 12px;">Receive the first-run product with an exclusive matte finish and serialized badge.</p>
            <div style="font-size: 12px; color: var(--text-muted);">EST. DELIVERY: AUG 2024</div>
        </div>
        <div class="reward-card">
            <div class="reward-header">
                <div>
                    <div style="font-size: 20px; font-weight: 700;">$1,999 or more</div>
                </div>
                <span class="status-badge" style="font-size: 10px;">120 SUPPORTED</span>
            </div>
            <h4 style="margin-bottom: 8px;">Standard Pack</h4>
            <p style="color: var(--text-secondary); font-size: 14px; margin-bottom: 12px;">The production-ready model in your choice of 3 colors. Includes charging dock.</p>
            <div style="font-size: 12px; color: var(--text-muted);">EST. DELIVERY: OCT 2024</div>
        </div>
    `;
}

async function loadReviews() {
    try {
        // GET /api/Reviews/Campaign/:campaignId
        console.log('Loading reviews for campaign:', campaignId);
        const reviews = await getReviewsByCampaign(campaignId);
        console.log('Reviews received:', reviews);
        console.log('Reviews count:', reviews?.length || 0);
        console.log('Reviews type:', typeof reviews, 'Is Array:', Array.isArray(reviews));
        
        if (reviews && reviews.length > 0) {
            console.log('First review sample:', reviews[0]);
        }
        
        document.getElementById('reviewsCount').textContent = (reviews || []).length;
        
        const reviewsList = document.getElementById('reviewsList');
        if (!reviewsList) {
            console.error('reviewsList element not found');
            return;
        }
        
        reviewsList.innerHTML = '';
        
        if (!reviews || reviews.length === 0) {
            reviewsList.innerHTML = '<p style="color: var(--text-secondary);">No reviews yet. Be the first to review!</p>';
            return;
        }
        
        reviews.forEach((review, index) => {
            console.log(`Processing review ${index}:`, review);
            
            const reviewCard = document.createElement('div');
            reviewCard.className = 'review-card';
            
            // Handle both PascalCase and camelCase property names
            const userName = review.UserName || review.userName || 'Anonymous';
            const userInitial = userName.charAt(0).toUpperCase();
            const userImagePath = review.UserImageUrl || review.userImageUrl || review.UserImage || review.userImage;
            const comment = review.Comment || review.comment || '';
            // Reaction might be a number (1, 2, 3) or enum string
            let reaction = review.Reaction || review.reaction;
            // If reaction is a string enum, convert to number
            if (typeof reaction === 'string') {
                const reactionMap = { 'Like': 1, 'Love': 2, 'Support': 3 };
                reaction = reactionMap[reaction] || reaction;
            }
            const createdAt = review.CreatedAt || review.createdAt;
            
            // Map reaction number to name
            const reactionNames = { 1: 'Like', 2: 'Love', 3: 'Support' };
            const reactionName = reactionNames[reaction] || '';
            
            // Build full image URL from backend, or use fallback avatar
            const userImage = userImagePath ? buildImageUrl(userImagePath) : null;
            const userAvatar = userImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=007cff&color=fff&size=48`;
            
            reviewCard.innerHTML = `
                <div class="review-header">
                    <img src="${userAvatar}" alt="${userName}" class="review-avatar" style="width: 48px; height: 48px; border-radius: 50%; object-fit: cover;" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                    <div class="review-avatar" style="display: none; width: 48px; height: 48px; border-radius: 50%; background-color: var(--primary-color); align-items: center; justify-content: center; color: white; font-weight: 600;">${userInitial}</div>
                    <div>
                        <div style="font-weight: 600;">${userName}</div>
                        <div style="font-size: 12px; color: var(--text-muted);">${formatDate(createdAt)}</div>
                    </div>
                </div>
                <div style="margin-bottom: 8px;">
                    ${reactionName === 'Like' ? '<i class="fas fa-thumbs-up"></i>' : reactionName === 'Love' ? '<i class="fas fa-heart"></i>' : reactionName === 'Support' ? '<i class="fas fa-handshake"></i>' : ''}
                    <span style="font-weight: 600; margin-left: 8px;">${reactionName || ''}</span>
                </div>
                ${comment ? `<p style="color: var(--text-secondary); line-height: 1.6;">"${comment}"</p>` : ''}
            `;
            
            reviewsList.appendChild(reviewCard);
        });
        
        console.log(`Successfully displayed ${reviews.length} reviews`);
    } catch (error) {
        console.error('Error loading reviews:', error);
        console.error('Error details:', {
            message: error.message,
            status: error.status,
            data: error.data
        });
        const reviewsList = document.getElementById('reviewsList');
        if (reviewsList) {
            reviewsList.innerHTML = '<p style="color: var(--text-secondary);">Error loading reviews. Please try again later.</p>';
        }
    }
}

async function checkReviewEligibilityForUser(userId) {
    try {
        // Check if user has made successful donations for this campaign
        const user = getCurrentUser();
        if (!user) return;
        
        const myDonations = await getMyDonations();
        const hasPaid = (myDonations || []).some(donation => {
            const donationCampaignId = donation.Campaign?.Id || donation.campaign?.id;
            const status = donation.Status || donation.status;
            return donationCampaignId == campaignId && status === 'Success';
        });
        
        // Check if user already reviewed
        const reviews = await getReviewsByCampaign(campaignId);
        const hasReviewed = (reviews || []).some(r => {
            const reviewUserId = r.UserId || r.userId;
            return reviewUserId === user.id;
        });
        
        if (hasPaid && !hasReviewed) {
            document.getElementById('writeReviewBtn').style.display = 'block';
        }
    } catch (error) {
        console.error('Error checking review eligibility:', error);
    }
}

function switchTab(tab) {
    document.querySelectorAll('.campaign-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('[id$="Tab"]').forEach(t => t.style.display = 'none');
    
    event.target.classList.add('active');
    document.getElementById(`${tab}Tab`).style.display = 'block';
}

function showSupportModal() {
    if (!isAuthenticated()) {
        showNotification('Please login to support campaigns', 'error');
        redirectTo('login.html');
        return;
    }
    document.getElementById('supportModal').style.display = 'flex';
}

function hideSupportModal() {
    document.getElementById('supportModal').style.display = 'none';
}

function selectAmount(amount) {
    selectedAmount = amount;
    document.getElementById('customAmount').value = amount;
    document.querySelectorAll('.btn-secondary').forEach(btn => {
        if (btn.textContent.includes('$')) {
            btn.style.backgroundColor = '';
            btn.style.color = '';
        }
    });
    event.target.style.backgroundColor = 'var(--primary-color)';
    event.target.style.color = 'white';
    updateTotalPledge();
}

function setLoveRating(rating) {
    loveRating = rating;
    const hearts = document.querySelectorAll('#loveRating i');
    hearts.forEach((heart, index) => {
        if (index < rating) {
            heart.style.color = 'var(--accent-color)';
            heart.style.opacity = '1';
        } else {
            heart.style.color = 'var(--text-muted)';
            heart.style.opacity = '0.3';
        }
    });
}

document.getElementById('customAmount').addEventListener('input', (e) => {
    selectedAmount = parseFloat(e.target.value) || 0;
    updateTotalPledge();
});

function updateTotalPledge() {
    document.getElementById('totalPledge').textContent = formatCurrency(selectedAmount);
}

async function confirmPledge() {
    if (selectedAmount <= 0) {
        showNotification('Please select an amount', 'error');
        return;
    }
    
    const user = getCurrentUser();
    if (!user) {
        showNotification('Please login to make a pledge', 'error');
        redirectTo('login.html');
        return;
    }
    
    // Redirect to payment page
    hideSupportModal();
    redirectTo(`payment.html?campaignId=${campaignId}&amount=${selectedAmount}`);
}

function showReviewForm() {
    document.getElementById('reviewForm').style.display = 'block';
}

function hideReviewForm() {
    document.getElementById('reviewForm').style.display = 'none';
}

function selectReaction(reaction) {
    selectedReaction = reaction;
    document.querySelectorAll('#reactionButtons button').forEach(btn => {
        btn.style.backgroundColor = '';
        btn.style.color = '';
    });
    event.target.style.backgroundColor = 'var(--primary-color)';
    event.target.style.color = 'white';
}

async function submitReview() {
    const user = getCurrentUser();
    if (!user) {
        showNotification('Please login to write a review', 'error');
        return;
    }
    
    if (!selectedReaction) {
        showNotification('Please select a reaction', 'error');
        return;
    }
    
    try {
        // POST /api/Reviews/Campaign/:campaignId
        // Body: { Comment?: string, Reaction?: number (1=Like, 2=Love, 3=Support) }
        const reactionMap = { 'Like': 1, 'Love': 2, 'Support': 3 };
        await createReview(campaignId, {
            comment: document.getElementById('reviewComment').value,
            reaction: reactionMap[selectedReaction]
        });
        
        showNotification('Review submitted successfully!', 'success');
        hideReviewForm();
        await loadReviews();
    } catch (error) {
        console.error('Error submitting review:', error);
        handleError(error, 'Unable to submit review. Please try again.');
    }
}

function toggleUserMenu() {
    const userMenuDropdown = document.getElementById('userMenuDropdown');
    if (userMenuDropdown) {
        const isVisible = userMenuDropdown.style.display === 'block';
        userMenuDropdown.style.display = isVisible ? 'none' : 'block';
    }
}

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
    const userMenu = document.getElementById('userMenu');
    const userMenuDropdown = document.getElementById('userMenuDropdown');
    if (userMenu && userMenuDropdown && !userMenu.contains(e.target)) {
        userMenuDropdown.style.display = 'none';
    }
});

function handleLogout() {
    logout();
}

