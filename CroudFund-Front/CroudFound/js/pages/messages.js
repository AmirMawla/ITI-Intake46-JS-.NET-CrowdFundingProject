// Messages page functionality (Reviews on user's campaigns)

document.addEventListener('DOMContentLoaded', async () => {
    if (!requireAuth()) return;
    
    await loadUserData();
    await loadMessages();
});

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

async function loadUserData() {
    try {
        const user = getCurrentUser();
        if (!user) return;
        
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
        
        const initial = fullName.charAt(0).toUpperCase();
        const userInitialEl = document.getElementById('userInitial');
        if (userInitialEl) {
            userInitialEl.textContent = initial;
        }
        document.getElementById('sidebarUserInitial').textContent = initial;
        document.getElementById('sidebarUserName').textContent = fullName;
        
        // Set profile image in header & dropdown
        const headerUserImage = document.getElementById('headerUserImage');
        const userDropdownImage = document.getElementById('userDropdownImage');
        const userDropdownInitial = document.getElementById('userDropdownInitial');
        const userDropdownName = document.getElementById('userDropdownName');
        
        if (profileImage) {
            const imageUrl = buildImageUrl(profileImage);
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
        if (profileImage) {
            const imageUrl = buildImageUrl(profileImage);
            const sidebarProfile = document.querySelector('#sidebarUserInitial').parentElement;
            if (sidebarProfile) {
                const existingImg = sidebarProfile.querySelector('img');
                if (existingImg) {
                    existingImg.src = imageUrl;
                    existingImg.style.display = 'block';
                } else {
                    sidebarProfile.innerHTML = `
                        <img src="${imageUrl}" 
                             style="width: 80px; height: 80px; border-radius: 50%; object-fit: cover; margin: 0 auto 16px; display: block;" 
                             onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                        <div class="user-profile" style="width: 80px; height: 80px; margin: 0 auto 16px; display: none; align-items: center; justify-content: center; background: var(--primary-color); border-radius: 50%; color: white; font-size: 32px; font-weight: 600;">${initial}</div>
                    `;
                }
            }
        }
        
        // Load statistics
        try {
            const summaryResponse = await getMyTransactionSummary();
            const campaignsResponse = await getMyCampaigns({ PageSize: 1 });
            
            let myCampaigns = [];
            if (Array.isArray(campaignsResponse)) {
                myCampaigns = campaignsResponse;
            } else if (campaignsResponse?.Items) {
                myCampaigns = campaignsResponse.Items;
            } else if (campaignsResponse?.items) {
                myCampaigns = campaignsResponse.items;
            }
            
            document.getElementById('impactCount').textContent = (summaryResponse?.TotalDonationCount ?? summaryResponse?.totalDonationCount ?? 0).toLocaleString();
            document.getElementById('projectsCount').textContent = (summaryResponse?.TotalCollectionCount ?? summaryResponse?.totalCollectionCount ?? myCampaigns.length).toString();
        } catch (error) {
            console.warn('Could not load statistics:', error);
        }
    } catch (error) {
        console.error('Error loading user data:', error);
        handleError(error, 'Unable to load user data. Please refresh the page.');
    }
}

async function loadMessages() {
    try {
        const user = getCurrentUser();
        if (!user) return;
        
        const reviewsResponse = await getReviewsForMyCampaigns({ PageSize: 100 });
        
        let reviews = [];
        if (Array.isArray(reviewsResponse)) {
            reviews = reviewsResponse;
        } else if (reviewsResponse?.Items) {
            reviews = reviewsResponse.Items;
        } else if (reviewsResponse?.items) {
            reviews = reviewsResponse.items;
        }
        
        const reviewsList = document.getElementById('reviewsList');
        reviewsList.innerHTML = '';
        
        if (!reviews || reviews.length === 0) {
            reviewsList.innerHTML = '<div style="text-align: center; padding: 60px; color: var(--text-secondary);"><i class="fas fa-comments" style="font-size: 48px; margin-bottom: 16px; opacity: 0.5;"></i><p>No reviews yet. Reviews from donors will appear here.</p></div>';
            return;
        }
        
        reviews.forEach(review => {
            const userName = review.UserName || review.userName || 'Anonymous';
            const userImageUrl = review.UserImageUrl || review.userImageUrl;
            const comment = review.Comment || review.comment || '';
            const createdAt = review.CreatedAt || review.createdAt;
            const campaignTitle = review.CampaignTitle || review.campaignTitle || 'Unknown Campaign';
            const campaignId = review.CampaignId || review.campaignId;
            const reaction = review.Reaction || review.reaction;
            
            const date = createdAt ? new Date(createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A';
            
            // Get user image or fallback to initials
            let userImage = '';
            if (userImageUrl) {
                const imageUrl = buildImageUrl(userImageUrl);
                userImage = `<img src="${imageUrl}" 
                    style="width: 48px; height: 48px; border-radius: 50%; object-fit: cover;" 
                    onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                <div style="display: none; width: 48px; height: 48px; border-radius: 50%; background: var(--primary-color); color: white; align-items: center; justify-content: center; font-weight: 600;">${userName.charAt(0).toUpperCase()}</div>`;
            } else {
                userImage = `<div style="width: 48px; height: 48px; border-radius: 50%; background: var(--primary-color); color: white; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 20px;">${userName.charAt(0).toUpperCase()}</div>`;
            }
            
            // Reaction emoji
            let reactionEmoji = '';
            if (reaction) {
                const reactionNum = typeof reaction === 'string' ? parseInt(reaction) : reaction;
                if (reactionNum === 1) reactionEmoji = '👍';
                else if (reactionNum === 2) reactionEmoji = '❤️';
                else if (reactionNum === 3) reactionEmoji = '🙌';
            }
            
            const reviewCard = document.createElement('div');
            reviewCard.style.cssText = 'padding: 20px; border: 1px solid var(--border-color); border-radius: 12px; background: var(--bg-card);';
            reviewCard.innerHTML = `
                <div style="display: flex; gap: 16px;">
                    <div style="position: relative;">
                        ${userImage}
                    </div>
                    <div style="flex: 1;">
                        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
                            <div>
                                <div style="font-weight: 600; margin-bottom: 4px;">${userName} ${reactionEmoji}</div>
                                <div style="font-size: 12px; color: var(--text-muted);">${date}</div>
                            </div>
                            ${campaignId ? `<a href="campaign-detail.html?id=${campaignId}" style="color: var(--primary-color); font-size: 14px; font-weight: 600;">${campaignTitle}</a>` : `<span style="color: var(--text-secondary); font-size: 14px;">${campaignTitle}</span>`}
                        </div>
                        <div style="color: var(--text-primary); line-height: 1.6; margin-top: 12px;">${comment || '<em style="color: var(--text-muted);">No comment</em>'}</div>
                    </div>
                </div>
            `;
            reviewsList.appendChild(reviewCard);
        });
    } catch (error) {
        console.error('Error loading messages:', error);
        handleError(error, 'Unable to load messages. Please refresh the page.');
        document.getElementById('reviewsList').innerHTML = '<div style="text-align: center; padding: 40px; color: var(--text-secondary);">Error loading messages</div>';
    }
}

