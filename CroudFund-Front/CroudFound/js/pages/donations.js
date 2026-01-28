// Donations page functionality

document.addEventListener('DOMContentLoaded', async () => {
    if (!requireAuth()) return;
    
    await loadUserData();
    await loadDonations();
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

async function loadDonations() {
    try {
        const user = getCurrentUser();
        if (!user) return;
        
        const donationsResponse = await getMyDonations({ PageSize: 100 });
        
        let donations = [];
        if (Array.isArray(donationsResponse)) {
            donations = donationsResponse;
        } else if (donationsResponse?.Items) {
            donations = donationsResponse.Items;
        } else if (donationsResponse?.items) {
            donations = donationsResponse.items;
        }
        
        const tbody = document.getElementById('donationsTableBody');
        tbody.innerHTML = '';
        
        if (!donations || donations.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 40px; color: var(--text-secondary);">No donations found. <a href="../index.html" style="color: var(--primary-color);">Explore campaigns</a> to make your first donation.</td></tr>';
            return;
        }
        
        donations.forEach(donation => {
            const amount = donation.Amount || donation.amount || 0;
            // PledgeResponse uses TransactionDate, not CreatedAt
            const transactionDate = donation.TransactionDate || donation.transactionDate || donation.CreatedAt || donation.createdAt;
            const status = donation.Status || donation.status || 'Unknown';
            const campaign = donation.Campaign || donation.campaign;
            const campaignId = campaign?.Id || campaign?.id;
            const campaignTitle = campaign?.Title || campaign?.title || 'Unknown Campaign';
            const campaignImage = campaign?.Image || campaign?.image;
            
            // Format date properly
            let date = 'N/A';
            if (transactionDate) {
                try {
                    const dateObj = new Date(transactionDate);
                    if (!isNaN(dateObj.getTime())) {
                        date = dateObj.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
                    }
                } catch (e) {
                    console.warn('Error parsing date:', e);
                }
            }
            const statusClass = status === 'Success' ? 'status-active' : status === 'Pending' ? 'status-pending' : 'status-draft';
            
            const image = campaignImage ? buildImageUrl(campaignImage) : null;
            const campaignImageUrl = image || `https://via.placeholder.com/40x40/141b2d/ffffff?text=${encodeURIComponent(campaignTitle.charAt(0))}`;
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <img src="${campaignImageUrl}" 
                             style="width: 40px; height: 40px; border-radius: 8px; object-fit: cover;" 
                             onerror="this.src='https://via.placeholder.com/40x40/141b2d/ffffff?text='+encodeURIComponent('${campaignTitle.charAt(0)}')">
                        <span style="font-weight: 600;">${campaignTitle}</span>
                    </div>
                </td>
                <td style="font-weight: 600; color: var(--primary-color);">${formatCurrency(amount)}</td>
                <td>${date}</td>
                <td><span class="status-badge ${statusClass}">${status.toUpperCase()}</span></td>
                <td>
                    ${campaignId ? `<a href="campaign-detail.html?id=${campaignId}" style="color: var(--primary-color);"><i class="fas fa-eye"></i></a>` : ''}
                </td>
            `;
            tbody.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading donations:', error);
        handleError(error, 'Unable to load donations. Please refresh the page.');
        document.getElementById('donationsTableBody').innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 40px; color: var(--text-secondary);">Error loading donations</td></tr>';
    }
}

