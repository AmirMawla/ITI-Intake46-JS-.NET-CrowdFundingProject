

(function() {
    'use strict';
    
    
    const checkAndBlock = setInterval(() => {
        if (typeof window.apiCall === 'function') {
            clearInterval(checkAndBlock);
            
            const originalApiCall = window.apiCall;
            window.apiCall = function(endpoint, options) {
                
                const blockedPatterns = [
                    '/me',
                    '/my',
                    '/Users/me',
                    '/Pledges/my',
                    '/Campaigns/my',
                    '/Reviews/my',
                    'my/dashboard',
                    'my/donations',
                    'my/collections',
                    'my/summary',
                    'my/financial-performance'
                ];
                
                const isBlocked = blockedPatterns.some(pattern => endpoint.includes(pattern));
                
                if (isBlocked) {
                    console.error('🚫 BLOCKED: Attempted to call user endpoint from admin dashboard:', endpoint);
                    console.trace('Call stack:');
                    throw new Error(`Admin dashboard cannot call user-specific endpoints (${endpoint}). Use admin endpoints instead.`);
                }
                
                return originalApiCall.call(this, endpoint, options);
            };
        }
    }, 50);
            
    setTimeout(() => {
        clearInterval(checkAndBlock);
    }, 5000);
})();

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('adminHeaderAvatarImg')) {
        loadAdminHeader();
    }
});

document.addEventListener('DOMContentLoaded', async () => {
    console.log('🔐 ADMIN DASHBOARD: Script loaded');
    console.log('🔐 Current page:', window.location.pathname);
    
    if (!window.location.pathname.includes('admin-dashboard.html')) {
        console.error('❌ ERROR: Admin dashboard script loaded on wrong page:', window.location.pathname);
        console.error('❌ This script should ONLY run on admin-dashboard.html');
        return;
    }
    
    if (!requireAdmin()) {
        console.error('❌ ERROR: Non-admin user attempted to access admin dashboard');
        window.location.href = 'dashboard.html';
        return;
    }
    
    if (!isAdmin()) {
        console.error('❌ ERROR: User is not admin:', getCurrentUser());
        window.location.href = 'dashboard.html';
        return;
    }
    
    console.log('✅ ADMIN DASHBOARD: User verified as admin');
    console.log('✅ ADMIN DASHBOARD: Loading with ONLY admin endpoints...');
    console.log('✅ ADMIN DASHBOARD: User endpoint blocker is active');
    
    if (document.title && !document.title.includes('Admin')) {
        console.warn('⚠️ WARNING: Page title does not include "Admin":', document.title);
    }
    
    const pageTitle = document.querySelector('.dashboard-title, h1');
    if (pageTitle && !pageTitle.textContent.includes('Dashboard') && !pageTitle.textContent.includes('Admin')) {
        console.warn('⚠️ WARNING: Page heading might be wrong:', pageTitle.textContent);
    }
    
    try {
        console.log('📊 Loading system statistics from /api/Pledges/analytics/dashboard...');
        await Promise.all([
            loadAdminHeader(),
            loadSystemStatistics(),
            loadTopDonors(),
            loadTopCampaigns(),
            loadPaymentMethodsChart(),
            loadPendingCampaigns(),
            loadFinancialPerformance()
        ]);
        
        console.log('✅ ADMIN DASHBOARD: Loaded successfully with admin endpoints only');
        console.log('✅ ADMIN DASHBOARD: No user endpoints were called');
    } catch (error) {
        console.error('❌ ERROR loading admin dashboard:', error);
        handleError(error, 'Error loading admin dashboard. Please refresh the page.');
    }
});

async function loadAdminHeader() {
    try {
        const user = getCurrentUser();

        const fullName = user?.fullName || user?.FullName || 'Admin';
        const initial = fullName.charAt(0).toUpperCase();

        const adminInitialEl = document.getElementById('adminInitial');
        const adminHeaderAvatarImg = document.getElementById('adminHeaderAvatarImg');
        if (adminInitialEl) adminInitialEl.textContent = initial;

        const adminSidebarAvatarImg = document.getElementById('adminSidebarAvatarImg');
        const adminSidebarAvatarFallback = document.getElementById('adminSidebarAvatarFallback');

        const generatedAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=007cff&color=ffffff&size=128`;
        if (adminHeaderAvatarImg) {
            adminHeaderAvatarImg.src = generatedAvatar;
            adminHeaderAvatarImg.alt = fullName;
            adminHeaderAvatarImg.style.display = 'block';
        }
        if (adminInitialEl) adminInitialEl.style.display = 'none';
        if (adminSidebarAvatarImg) {
            adminSidebarAvatarImg.src = generatedAvatar;
            adminSidebarAvatarImg.alt = fullName;
            adminSidebarAvatarImg.style.display = 'block';
        }
        if (adminSidebarAvatarFallback) adminSidebarAvatarFallback.style.display = 'none';

        ensureAdminUserDropdown(fullName);

        const userId = user?.id || user?.Id;
        if (!userId || typeof getUserById !== 'function') return;

        const fullUser = await getUserById(userId);
        const profileImagePath = fullUser?.ProfileImage || fullUser?.profileImage;
        if (!profileImagePath) return;

        const imageUrl = buildImageUrl(profileImagePath);
        if (!imageUrl) return;

        if (adminHeaderAvatarImg) {
            adminHeaderAvatarImg.src = imageUrl;
            adminHeaderAvatarImg.alt = fullName;
            adminHeaderAvatarImg.style.display = 'block';
        }
        if (adminInitialEl) adminInitialEl.style.display = 'none';

        if (adminSidebarAvatarImg) {
            adminSidebarAvatarImg.src = imageUrl;
            adminSidebarAvatarImg.alt = fullName;
            adminSidebarAvatarImg.style.display = 'block';
        }
        if (adminSidebarAvatarFallback) adminSidebarAvatarFallback.style.display = 'none';
    } catch (error) {
        console.error('Error loading admin header:', error);
    }
}

function ensureAdminUserDropdown(fullName) {
    const userActions = document.querySelector('.admin-header .user-actions') || document.querySelector('.user-actions');
    if (!userActions) return;
    userActions.style.position = userActions.style.position || 'relative';

    let dropdown = document.getElementById('adminUserDropdown');
    if (!dropdown) {
        dropdown = document.createElement('div');
        dropdown.id = 'adminUserDropdown';
        dropdown.style.cssText = `
            position: absolute;
            right: 0;
            top: calc(100% + 12px);
            min-width: 220px;
            background: var(--bg-card);
            border: 1px solid var(--border-color);
            border-radius: 12px;
            padding: 10px;
            box-shadow: 0 18px 50px rgba(0,0,0,0.55);
            display: none;
            z-index: 3000;
        `;
        dropdown.innerHTML = `
            <div style="padding: 8px 10px; border-bottom: 1px solid var(--border-color); margin-bottom: 8px;">
                <div id="adminDropdownName" style="font-weight: 700; color: var(--text-primary); font-size: 14px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;"></div>
                <div style="font-size: 12px; color: var(--text-muted); margin-top: 2px;">Administrator</div>
            </div>
            <button type="button" onclick="handleLogout(); return false;" style="
                width: 100%;
                border: none;
                background: transparent;
                color: var(--error-color);
                padding: 10px 10px;
                border-radius: 10px;
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 10px;
                font-weight: 700;
            " onmouseover="this.style.background='var(--bg-card-hover)'" onmouseout="this.style.background='transparent'">
                <i class="fas fa-sign-out-alt" style="width: 18px;"></i>
                <span>Logout</span>
            </button>
        `;
        userActions.appendChild(dropdown);

        document.addEventListener('click', (e) => {
            const avatar = userActions.querySelector('.user-profile');
            if (!dropdown) return;
            const clickedInside = dropdown.contains(e.target) || (avatar && avatar.contains(e.target));
            if (!clickedInside) dropdown.style.display = 'none';
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && dropdown) dropdown.style.display = 'none';
        });
    }

    const nameEl = dropdown.querySelector('#adminDropdownName');
    if (nameEl) nameEl.textContent = fullName || 'Admin';
}

function updateSystemCounts(totalUsers, totalCampaigns) {
    const systemUsersEl = document.getElementById('systemUsers');
    const systemCampaignsEl = document.getElementById('systemCampaigns');
    if (systemUsersEl) systemUsersEl.textContent = totalUsers || 0;
    if (systemCampaignsEl) systemCampaignsEl.textContent = totalCampaigns || 0;
}

async function loadSystemStatistics() {
    try {
        const stats = await getDashboardStatistics();
        
        if (!stats) {
            console.error('Failed to load system statistics');
            return;
        }

        const totalRevenue = stats.totalRevenue ?? stats.TotalRevenue ?? 0;
        const totalTransactions = stats.totalTransactions ?? stats.TotalTransactions ?? 0;
        const totalCampaigns = stats.totalCampaigns ?? stats.TotalCampaigns ?? 0;
        const activeCampaigns = stats.activeCampaigns ?? stats.ActiveCampaigns ?? 0;
        const pendingCampaigns = stats.pendingCampaigns ?? stats.PendingCampaigns ?? (totalCampaigns - activeCampaigns);
        const totalUsers = stats.totalUsers ?? stats.TotalUsers ?? 0;
        const activeDonors = stats.activeDonors ?? stats.ActiveDonors ?? 0;
        const averageDonation = stats.averageDonation ?? stats.AverageDonation ?? 0;
        const revenueGrowth = stats.revenueGrowthPercentage ?? stats.RevenueGrowthPercentage ?? 0;
        const donorGrowth = stats.donorGrowthPercentage ?? stats.DonorGrowthPercentage ?? 0;
        const campaignsGrowth = stats.campaignsGrowthPercentage ?? stats.CampaignsGrowthPercentage ?? 0;

            updateElement('totalRevenue', formatCurrency(totalRevenue));
            updateElement('totalTransactions', totalTransactions.toLocaleString());
            updateElement('totalCampaigns', totalCampaigns.toString());
            updateElement('activeCampaigns', activeCampaigns.toString());
            updateElement('totalUsers', totalUsers.toString());
            updateElement('activeDonors', activeDonors.toString());
            updateElement('averageDonation', formatCurrency(averageDonation));
            updateElement('donorGrowth', `${donorGrowth >= 0 ? '+' : ''}${donorGrowth.toFixed(1)}%`);
            updateElement('pendingCampaigns', pendingCampaigns.toString());
            
            updateSystemCounts(totalUsers, totalCampaigns);

        updateGrowthIndicator('revenueChange', 'revenueChangeText', revenueGrowth);
        updateGrowthIndicator('campaignsChange', 'campaignsChangeText', campaignsGrowth);
        updateGrowthIndicator('donorGrowthChange', 'donorGrowthText', donorGrowth);
        
    } catch (error) {
        console.error('Error loading system statistics:', error);
        handleError(error, 'Unable to load system statistics');
    }
}

async function loadTopDonors() {
    try {
        const topDonors = await getTopDonors(10);
        const container = document.getElementById('topDonorsContainer');
        if (!container) return;

        container.innerHTML = '';
        
        if (!topDonors || topDonors.length === 0) {
            container.innerHTML = '<div style="text-align: center; color: var(--text-secondary); padding: 24px;">No donors yet</div>';
            return;
        }

        topDonors.forEach((donor, index) => {
            const donorName = donor.userName || donor.UserName || 'Unknown';
            const totalDonated = donor.totalDonated || donor.TotalDonated || 0;
            const donationCount = donor.donationCount || donor.DonationCount || 0;
            
            const donorCard = document.createElement('div');
            donorCard.style.cssText = 'display: flex; align-items: center; justify-content: space-between; padding: 12px; margin-bottom: 8px; background: var(--bg-darker); border-radius: 8px;';
            donorCard.innerHTML = `
                <div style="display: flex; align-items: center; gap: 12px;">
                    <div style="width: 32px; height: 32px; border-radius: 50%; background: var(--primary-color); color: white; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 14px;">
                        ${index + 1}
                    </div>
                    <div>
                        <div style="font-weight: 600;">${donorName}</div>
                        <div style="font-size: 12px; color: var(--text-muted);">${donationCount} donation${donationCount !== 1 ? 's' : ''}</div>
                    </div>
                </div>
                <div style="font-weight: 700; color: var(--success-color);">${formatCurrency(totalDonated)}</div>
            `;
            container.appendChild(donorCard);
        });
    } catch (error) {
        console.error('Error loading top donors:', error);
    }
}

async function loadTopCampaigns() {
    try {
        const topCampaigns = await getTopCampaigns(10);
        const container = document.getElementById('topCampaignsContainer');
        if (!container) return;

        container.innerHTML = '';
        
        if (!topCampaigns || topCampaigns.length === 0) {
            container.innerHTML = '<div style="text-align: center; color: var(--text-secondary); padding: 24px;">No campaigns yet</div>';
            return;
        }

        topCampaigns.forEach((campaign, index) => {
            const title =
                campaign.campaignTitle ||
                campaign.CampaignTitle ||
                campaign.title ||
                campaign.Title ||
                'Unknown';
            const totalRaised =
                campaign.totalCollected ||
                campaign.TotalCollected ||
                campaign.totalAmountPaid ||
                campaign.TotalAmountPaid ||
                0;
            const goalAmount = campaign.goalAmount || campaign.GoalAmount || campaign.goal || 1;
            const percentage = Math.min(goalAmount > 0 ? (totalRaised / goalAmount) * 100 : 0, 100);
            
            const campaignCard = document.createElement('div');
            campaignCard.style.cssText = 'padding: 12px; margin-bottom: 8px; background: var(--bg-darker); border-radius: 8px;';
            campaignCard.innerHTML = `
                <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
                    <div style="width: 24px; height: 24px; border-radius: 50%; background: var(--primary-color); color: white; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 12px;">
                        ${index + 1}
                    </div>
                    <div style="flex: 1; min-width: 0;">
                        <div style="font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${title}">${title}</div>
                    </div>
                </div>
                <div style="display: flex; align-items: center; gap: 8px;">
                    <div style="flex: 1; height: 6px; background: var(--bg-darker); border-radius: 3px; overflow: hidden;">
                        <div style="height: 100%; width: ${percentage}%; background: var(--success-color);"></div>
                    </div>
                    <div style="font-size: 12px; color: var(--text-secondary); white-space: nowrap;">${formatCurrency(totalRaised)}</div>
                </div>
            `;
            container.appendChild(campaignCard);
        });
    } catch (error) {
        console.error('Error loading top campaigns:', error);
    }
}

async function loadPendingCampaigns() {
    try {
        const pendingCampaigns = await getPendingCampaigns({
            PageSize: 100,
            PageNumer: 1
        });
        
        const tbody = document.getElementById('pendingCampaignsBody');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        if (!pendingCampaigns || pendingCampaigns.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: var(--text-secondary); padding: 24px;">No pending campaigns</td></tr>';
            return;
        }
        
        pendingCampaigns.slice(0, 5).forEach((campaign) => {
            const campaignId = campaign.Id || campaign.id;
            const title = campaign.Title || campaign.title;
            const goalAmount = campaign.GoalAmount || campaign.goalAmount || 0;
            const userName = campaign.UserName || campaign.userName || 'Unknown';
            const imagePath = campaign.Image || campaign.image;
            const image = imagePath ? buildImageUrl(imagePath) : null;
            const campaignImage = image || `https://via.placeholder.com/40x40/141b2d/ffffff?text=${encodeURIComponent(title.charAt(0))}`;
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <img src="${campaignImage}" style="width: 40px; height: 40px; border-radius: 8px; object-fit: cover; flex-shrink: 0;" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                        <div style="width: 40px; height: 40px; border-radius: 8px; background: var(--primary-color); display: none; align-items: center; justify-content: center; color: white; font-weight: 600;">
                            ${title.charAt(0).toUpperCase()}
                        </div>
                        <div style="min-width: 0;">
                            <div style="font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 200px;" title="${title}">${title}</div>
                        </div>
                    </div>
                </td>
                <td style="font-size: 12px; color: var(--text-secondary);">${userName}</td>
                <td style="font-weight: 600;">${formatCurrency(goalAmount)}</td>
                <td>
                    <div style="display: flex; gap: 8px;">
                        <button class="btn btn-success" style="padding: 4px 12px; font-size: 12px;" onclick="approveCampaignById(${campaignId})">Approve</button>
                        <button class="btn btn-danger" style="padding: 4px 12px; font-size: 12px;" onclick="rejectCampaign(${campaignId})">Reject</button>
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading pending campaigns:', error);
        const tbody = document.getElementById('pendingCampaignsBody');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: var(--error-color); padding: 24px;">Error loading pending campaigns</td></tr>';
        }
    }
}

async function loadAllUsers() {
    try {
        const pageSize = window.location.pathname.includes('admin-users.html') ? 100 : 10;
        const usersResponse = await getUsers({ PageSize: pageSize });
        const users = Array.isArray(usersResponse) ? usersResponse : (usersResponse?.Items || []);
        
        const tbody = document.getElementById('usersTableBody');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        if (!users || users.length === 0) {
            tbody.innerHTML = '<tr><td colspan="3" style="text-align: center; color: var(--text-secondary); padding: 24px;">No users found</td></tr>';
            return;
        }
        
        const usersToShow = window.location.pathname.includes('admin-users.html') ? users : users.slice(0, 5);
        usersToShow.forEach((user) => {
            const userId = user.Id || user.id;
            const fullName = user.FullName || user.fullName || 'Unknown';
            const email = user.Email || user.email || '';
            const profileImagePath = user.ProfileImage || user.profileImage;
            const isActive = user.IsActive !== undefined ? user.IsActive : (user.isActive !== undefined ? user.isActive : true);
            const totalDonated = user.HowMuchHeDonate || user.howMuchHeDonate || 0;
            
            const profileImage = profileImagePath ? buildImageUrl(profileImagePath) : null;
            const userAvatar = profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=007cff&color=fff&size=32`;
            const initial = fullName.charAt(0).toUpperCase();
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <img src="${userAvatar}" alt="${fullName}" style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover; flex-shrink: 0;" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                        <div class="user-profile" style="width: 32px; height: 32px; display: none; border-radius: 50%; background: var(--primary-color); color: white; align-items: center; justify-content: center; font-weight: 600; font-size: 14px;">
                            ${initial}
                        </div>
                        <div style="min-width: 0;">
                            <div style="font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 200px;" title="${fullName}">${fullName}</div>
                            <div style="font-size: 12px; color: var(--text-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${email}</div>
                        </div>
                    </div>
                </td>
                <td>
                    <span class="status-badge ${isActive ? 'status-active' : 'status-draft'}">
                        ${isActive ? 'ACTIVE' : 'SUSPENDED'}
                    </span>
                    <div style="font-size: 11px; color: var(--text-muted); margin-top: 4px;">Donated: ${formatCurrency(totalDonated)}</div>
                </td>
                <td>
                    <div style="display: flex; gap: 8px; align-items: center;">
                        <label style="position: relative; display: inline-block; width: 50px; height: 24px; cursor: pointer;">
                            <input type="checkbox" ${isActive ? 'checked' : ''} onchange="toggleUserStatus('${userId}', this.checked)" style="opacity: 0; width: 0; height: 0;">
                        <span style="position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: ${isActive ? 'var(--primary-color)' : '#ccc'}; border-radius: 24px; transition: 0.3s;">
                            <span style="position: absolute; height: 18px; width: 18px; left: 3px; bottom: 3px; background-color: white; border-radius: 50%; transition: 0.3s; transform: ${isActive ? 'translateX(26px)' : 'translateX(0)'};"></span>
                        </span>
                    </label>
                        <button class="btn btn-danger" style="padding: 4px 12px; font-size: 12px;" onclick="deleteUserById('${userId}')">Delete</button>
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading users:', error);
        const tbody = document.getElementById('usersTableBody');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="3" style="text-align: center; color: var(--error-color); padding: 24px;">Error loading users</td></tr>';
    }
}
}

async function loadAllCampaigns() {
    try {
        const campaignsResponse = await getAllCampaigns({ PageSize: 50 });
        const campaigns = Array.isArray(campaignsResponse) ? campaignsResponse : (campaignsResponse?.Items || []);
        
        const tbody = document.getElementById('allCampaignsBody');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        if (!campaigns || campaigns.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--text-secondary); padding: 24px;">No campaigns found</td></tr>';
            return;
        }
        
        campaigns.forEach((campaign) => {
            const campaignId = campaign.Id || campaign.id;
            const title = campaign.Title || campaign.title || 'Unknown';
            const goalAmount = campaign.GoalAmount || campaign.goalAmount || 0;
            const userName = campaign.UserName || campaign.userName || 'Unknown';
            const isApproved = campaign.IsApproved !== undefined ? campaign.IsApproved : (campaign.isApproved !== undefined ? campaign.isApproved : true);
            
            const statusClass = isApproved ? 'status-active' : 'status-pending';
            const statusText = isApproved ? 'APPROVED' : 'PENDING';
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>
                    <div style="font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 260px;" title="${title}">${title}</div>
                </td>
                <td style="font-size: 12px; color: var(--text-secondary);">${userName}</td>
                <td style="font-weight: 600;">${formatCurrency(goalAmount)}</td>
                <td>
                    <span class="status-badge ${statusClass}">${statusText}</span>
                </td>
                <td>
                    <div style="display: flex; gap: 8px;">
                        <button class="btn btn-success" style="padding: 4px 12px; font-size: 12px;" onclick="approveCampaignById(${campaignId})" ${isApproved ? 'disabled' : ''}>Approve</button>
                        <button class="btn btn-danger" style="padding: 4px 12px; font-size: 12px;" onclick="rejectCampaign(${campaignId})">Delete</button>
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading all campaigns:', error);
        const tbody = document.getElementById('allCampaignsBody');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--error-color); padding: 24px;">Error loading campaigns</td></tr>';
        }
    }
}

async function loadAllPledges() {
    try {
        const pledgesResponse = await getAllPledges({ PageSize: 50 });
        const pledges = Array.isArray(pledgesResponse) ? pledgesResponse : (pledgesResponse?.Items || []);
        
        const tbody = document.getElementById('allPledgesBody');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        if (!pledges || pledges.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--text-secondary); padding: 24px;">No pledges found</td></tr>';
            return;
        }
        
        pledges.forEach((pledge) => {
            const amount = pledge.Amount || pledge.amount || 0;
            const transactionDate = pledge.TransactionDate || pledge.transactionDate || pledge.CreatedAt || pledge.createdAt;
            const status = pledge.Status || pledge.status || pledge.Payment?.Status || pledge.payment?.status || 'Unknown';
            const campaign = pledge.Campaign || pledge.campaign;
            const campaignTitle = campaign?.Title || campaign?.title || 'Unknown Campaign';
            const campaignCreator = campaign?.UserName || campaign?.userName || 'Unknown';
            const donorName = pledge.UserName || pledge.userName || 'Unknown Donor';
            const donorId = pledge.UserId || pledge.userId;
            
            const date = transactionDate ? new Date(transactionDate).toLocaleDateString() : 'Unknown';
            const statusClass = status === 'Success' ? 'status-active' : status === 'Failed' ? 'status-draft' : 'status-pending';
            const statusText = status === 'Success' ? 'SUCCESS' : status === 'Failed' ? 'FAILED' : 'PENDING';
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>
                    <div style="font-weight: 600;">${donorName}</div>
                    <div style="font-size: 12px; color: var(--text-muted);">ID: ${donorId?.substring(0, 8) || 'N/A'}...</div>
                </td>
                <td style="font-weight: 700; color: var(--success-color);">${formatCurrency(amount)}</td>
                <td>
                    <div style="font-weight: 600;">${campaignTitle}</div>
                </td>
                <td style="font-size: 12px; color: var(--text-secondary);">${campaignCreator}</td>
                <td style="font-size: 12px; color: var(--text-secondary);">${date}</td>
                <td>
                    <span class="status-badge ${statusClass}">${statusText}</span>
                </td>
            `;
            tbody.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading all pledges:', error);
        const tbody = document.getElementById('allPledgesBody');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--error-color); padding: 24px;">Error loading pledges</td></tr>';
        }
    }
}

async function loadAllReviews() {
    try {
        const reviewsResponse = await getAllReviews({ PageSize: 50 });
        const reviews = Array.isArray(reviewsResponse) ? reviewsResponse : (reviewsResponse?.Items || []);
        
        const tbody = document.getElementById('allReviewsBody');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        if (!reviews || reviews.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--text-secondary); padding: 24px;">No reviews found</td></tr>';
            return;
        }
        
        reviews.forEach((review) => {
            const reviewId = review.Id || review.id;
            const comment = review.Comment || review.comment || 'No comment';
            const createdAt = review.CreatedAt || review.createdAt;
            const userName = review.UserName || review.userName || 'Unknown';
            const campaignTitle = review.CampaignTitle || review.campaignTitle || 'Unknown Campaign';
            const reaction = review.Reaction || review.reaction;
            
            const date = createdAt ? new Date(createdAt).toLocaleDateString() : 'Unknown';
            const reactionIcon = reaction === 1 ? '👍' : reaction === 2 ? '❤️' : reaction === 3 ? '💪' : '';
            const displayComment = comment.length > 50 ? comment.substring(0, 47) + '...' : comment;
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>
                    <div style="font-weight: 600;">${userName}</div>
                </td>
                <td>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span>${reactionIcon}</span>
                        <span title="${comment}">${displayComment}</span>
                    </div>
                </td>
                <td style="font-size: 12px; color: var(--text-secondary);">${campaignTitle}</td>
                <td style="font-size: 12px; color: var(--text-secondary);">${date}</td>
                <td>
                    <button class="btn btn-danger" style="padding: 4px 12px; font-size: 12px;" onclick="deleteReviewById(${reviewId})">Delete</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading all reviews:', error);
        const tbody = document.getElementById('allReviewsBody');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--error-color); padding: 24px;">Error loading reviews</td></tr>';
        }
    }
}

async function loadAllCategories() {
    try {
        const categories = await getCategories();
        const container = document.getElementById('categoriesContainer');
        if (!container) return;

        container.innerHTML = '';
        
        if (!categories || categories.length === 0) {
            container.innerHTML = '<div style="text-align: center; color: var(--text-secondary); padding: 24px;">No categories found</div>';
            return;
        }

        categories.forEach((category) => {
            const categoryId = category.Id || category.id;
            const name = category.Name || category.name;
            const campaignCount = category.CampaignCount || category.campaignCount || 0;
            
            const categoryCard = document.createElement('div');
            categoryCard.className = 'admin-table-row';
            categoryCard.style.cssText = 'display: flex; align-items: center; justify-content: space-between; padding: 16px 24px; margin-bottom: 0; background: var(--bg-card); border-bottom: 1px solid var(--border-color); transition: background-color 0.2s ease;';
            categoryCard.onmouseenter = function() { this.style.background = 'var(--bg-card-hover)'; };
            categoryCard.onmouseleave = function() { this.style.background = 'var(--bg-card)'; };
            categoryCard.innerHTML = `
                <div style="display: flex; align-items: center; gap: 16px;">
                    <div style="width: 40px; height: 40px; border-radius: 8px; background: linear-gradient(135deg, var(--primary-color), var(--accent-color)); display: flex; align-items: center; justify-content: center; color: white; font-size: 18px;">
                        <i class="fas fa-tag"></i>
                    </div>
                    <div>
                        <div style="font-weight: 600; font-size: 15px; color: var(--text-primary); margin-bottom: 4px;">${name}</div>
                        <div style="font-size: 12px; color: var(--text-muted); display: flex; align-items: center; gap: 6px;">
                            <i class="fas fa-bullhorn" style="font-size: 10px;"></i>
                            ${campaignCount} campaign${campaignCount !== 1 ? 's' : ''}
                        </div>
                    </div>
                </div>
                <div style="display: flex; gap: 8px;">
                    <button class="btn-action-view" onclick="editCategory(${categoryId}, '${name}')" title="Edit Category">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn-action-delete" onclick="deleteCategoryById(${categoryId})" title="Delete Category">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            container.appendChild(categoryCard);
        });
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

let financialPerformanceData = [];
let financialPerformancePage = 0;
const FINANCIAL_PERFORMANCE_PAGE_SIZE = 6;

async function loadPaymentMethodsChart() {
    try {
        const chart = document.getElementById('paymentMethodsChart');
        const legend = document.getElementById('paymentMethodsLegend');
        if (!chart || !legend) return;

        legend.innerHTML = '';
        chart.innerHTML = '';

        const stats = await getTransactionStatistics(null, null);
        const breakdown = stats?.paymentMethodBreakdown || stats?.PaymentMethodBreakdown;

        if (!breakdown || Object.keys(breakdown).length === 0) {
            legend.innerHTML = '<div style="color: var(--text-secondary); font-size: 14px;">No successful payments yet.</div>';
            return;
        }

        const entries = Object.entries(breakdown).filter(([_, amount]) => amount > 0);
        if (entries.length === 0) {
            legend.innerHTML = '<div style="color: var(--text-secondary); font-size: 14px;">No successful payments yet.</div>';
            return;
        }

        const total = entries.reduce((sum, [, amount]) => sum + amount, 0);
        const colors = [
            'var(--primary-color)',
            'var(--success-color)',
            'var(--accent-color)',
            'var(--warning-color)',
            'var(--error-color)'
        ];

        const size = 260;
        const center = size / 2;
        const radius = 90;
        const strokeWidth = 40;
        const circumference = 2 * Math.PI * radius;

        let offset = 0;
        const circles = [];

        entries.forEach(([method, amount], index) => {
            const fraction = total > 0 ? amount / total : 0;
            const segmentLength = fraction * circumference;
            const color = colors[index % colors.length];

            circles.push(`
                <circle
                    cx="${center}"
                    cy="${center}"
                    r="${radius}"
                    fill="transparent"
                    stroke="${color}"
                    stroke-width="${strokeWidth}"
                    stroke-dasharray="${segmentLength} ${circumference - segmentLength}"
                    stroke-dashoffset="${-offset}"
                    stroke-linecap="butt"
                ></circle>
            `);

            offset += segmentLength;

            const percentage = fraction * 100;
            const item = document.createElement('div');
            item.className = 'payment-methods-legend-item';
            item.innerHTML = `
                <div style="display:flex;align-items:center;gap:6px;">
                    <span class="payment-methods-legend-color" style="background:${color};"></span>
                    <span>${method || 'Unknown'}</span>
                </div>
                <div style="font-size:13px; color:var(--text-secondary);">
                    ${formatCurrency(amount)} · ${percentage.toFixed(1)}%
                </div>
            `;
            legend.appendChild(item);
        });

        const svg = `
            <svg viewBox="0 0 ${size} ${size}">
                <g transform="rotate(-90 ${center} ${center})">
                    ${circles.join('')}
                </g>
                <circle cx="${center}" cy="${center}" r="${radius - strokeWidth / 2}" fill="var(--bg-card)"></circle>
            </svg>
        `;

        chart.innerHTML = svg;
    } catch (error) {
        console.error('Error loading payment methods chart:', error);
        const legend = document.getElementById('paymentMethodsLegend');
        if (legend) {
            legend.innerHTML = '<div style="color: var(--text-secondary); font-size: 14px;">Unable to load payment method data.</div>';
        }
    }
}

async function loadFinancialPerformance() {
    try {
        const chartContainer = document.getElementById('chartContainer');
        if (!chartContainer) return;

        chartContainer.innerHTML = '';

        const transactionStats = await getTransactionStatistics(null, null);
        
        if (transactionStats && transactionStats.monthlyData && transactionStats.monthlyData.length > 0) {
            financialPerformanceData = transactionStats.monthlyData.map(m => ({
                monthName: m.monthName || m.MonthName || `${m.month}/${m.year}`,
                totalAmount: m.totalAmount || m.TotalAmount || 0
            }));
        } else if (transactionStats && transactionStats.MonthlyData && transactionStats.MonthlyData.length > 0) {
            financialPerformanceData = transactionStats.MonthlyData.map(m => ({
                monthName: m.monthName || m.MonthName || `${m.month}/${m.year}`,
                totalAmount: m.totalAmount || m.TotalAmount || 0
            }));
        } else {
            chartContainer.innerHTML = '<div style="text-align: center; color: var(--text-secondary); padding: 40px;">No financial data available</div>';
            return;
        }

        if (financialPerformanceData.length === 0) {
            chartContainer.innerHTML = '<div style="text-align: center; color: var(--text-secondary); padding: 40px;">No financial data available</div>';
            return;
        }

        renderFinancialPerformancePage();

        const prevBtn = document.getElementById('chartPrev');
        const nextBtn = document.getElementById('chartNext');

        if (prevBtn && !prevBtn._handlerAttached) {
            prevBtn.addEventListener('click', () => {
                if (financialPerformancePage > 0) {
                    financialPerformancePage--;
                    renderFinancialPerformancePage();
                }
            });
            prevBtn._handlerAttached = true;
        }

        if (nextBtn && !nextBtn._handlerAttached) {
            nextBtn.addEventListener('click', () => {
                const maxPage = Math.max(Math.ceil(financialPerformanceData.length / FINANCIAL_PERFORMANCE_PAGE_SIZE) - 1, 0);
                if (financialPerformancePage < maxPage) {
                    financialPerformancePage++;
                    renderFinancialPerformancePage();
                }
            });
            nextBtn._handlerAttached = true;
        }
    } catch (error) {
        console.error('Error loading financial performance:', error);
        const chartContainer = document.getElementById('chartContainer');
        if (chartContainer) {
            chartContainer.innerHTML = '<div style="text-align: center; color: var(--text-secondary); padding: 40px;">Unable to load financial data</div>';
        }
    }
}

function renderFinancialPerformancePage() {
    const chartContainer = document.getElementById('chartContainer');
    if (!chartContainer) return;

    chartContainer.innerHTML = '';

    const start = financialPerformancePage * FINANCIAL_PERFORMANCE_PAGE_SIZE;
    const pageItems = financialPerformanceData.slice(start, start + FINANCIAL_PERFORMANCE_PAGE_SIZE);

    if (pageItems.length === 0) {
        chartContainer.innerHTML = '<div style="text-align: center; color: var(--text-secondary); padding: 40px;">No data available</div>';
        return;
    }

    const amounts = pageItems.map(m => m.totalAmount || 0);
    const labels = pageItems.map(m => m.monthName || 'Unknown');
    const maxValue = Math.max(...amounts, 1);

    labels.forEach((label, index) => {
        const barGroup = document.createElement('div');
        barGroup.style.display = 'flex';
        barGroup.style.flexDirection = 'column';
        barGroup.style.alignItems = 'center';
        barGroup.style.gap = '4px';
        barGroup.style.flex = '1';

        const height = maxValue > 0 ? (amounts[index] / maxValue) * 100 : 0;

        barGroup.innerHTML = `
            <div style="display: flex; gap: 2px; width: 100%; align-items: end; justify-content: center;">
                <div style="width: 100%; height: ${Math.max(height, 4)}px; min-height: 4px; background: var(--primary-color); border-radius: 4px 4px 0 0;" title="Revenue: ${formatCurrency(amounts[index])}"></div>
            </div>
            <div style="font-size: 12px; color: var(--text-muted); text-align: center;">${label}</div>
        `;

        chartContainer.appendChild(barGroup);
    });
}

// Load pledges sidebar
async function loadPledgesSidebar() {
    try {
        const pledgesResponse = await getAllPledges({ PageSize: 10 }); // /api/Pledges
        const pledges = Array.isArray(pledgesResponse) ? pledgesResponse : (pledgesResponse?.Items || []);
        
        const sidebarList = document.getElementById('pledgesSidebarList');
        if (!sidebarList) return;
        
        sidebarList.innerHTML = '';
        
        if (!pledges || pledges.length === 0) {
            sidebarList.innerHTML = '<div style="text-align: center; color: var(--text-secondary); padding: 16px; font-size: 12px;">No pledges yet</div>';
            return;
        }
        
        pledges.slice(0, 10).forEach((pledge) => {
            const amount = pledge.Amount || pledge.amount || 0;
            const campaign = pledge.Campaign || pledge.campaign;
            const campaignTitle = campaign?.Title || campaign?.title || 'Unknown';
            const donorName = pledge.UserName || pledge.userName || 'Unknown';
            
            const pledgeItem = document.createElement('div');
            pledgeItem.style.cssText = 'padding: 12px; margin-bottom: 8px; background: var(--bg-darker); border-radius: 8px; font-size: 12px;';
            pledgeItem.innerHTML = `
                <div style="font-weight: 600; margin-bottom: 4px; color: var(--success-color);">${formatCurrency(amount)}</div>
                <div style="color: var(--text-secondary); margin-bottom: 2px;">${donorName} →</div>
                <div style="color: var(--text-muted); font-size: 11px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${campaignTitle}">${campaignTitle}</div>
            `;
            sidebarList.appendChild(pledgeItem);
        });
    } catch (error) {
        console.error('Error loading pledges sidebar:', error);
    }
}

// ============================================
// Modal Functions for Delete/Reject Actions
// ============================================

function showRejectCampaignModal(campaign, campaignId) {
    const title = campaign.Title || campaign.title || 'Unknown Campaign';
    const description = campaign.Description || campaign.description || 'No description';
    const goalAmount = campaign.GoalAmount || campaign.goalAmount || 0;
    const raised = campaign.TotalAmountPaid || campaign.totalAmountPaid || 0;
    const deadline = campaign.Deadline || campaign.deadline;
    const categoryName = campaign.CategoryName || campaign.categoryName || 'Unknown';
    const imagePath = campaign.Image || campaign.image;
    const donorCount = campaign.TotalDonorsCount || campaign.totalDonorsCount || 0;
    
    const imageUrl = imagePath ? buildImageUrl(imagePath) : null;
    const percentage = calculatePercentage(raised, goalAmount);
    const daysLeft = deadline ? getDaysRemaining(deadline) : 'N/A';
    
    // Create modal overlay
    const modalOverlay = document.createElement('div');
    modalOverlay.id = 'rejectCampaignModal';
    modalOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        padding: 20px;
    `;
    
    modalOverlay.innerHTML = `
        <div style="
            background: var(--bg-card);
            border-radius: 16px;
            max-width: 1000px;
            width: 100%;
            max-height: 85vh;
            overflow-y: auto;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
            border: 1px solid var(--border-color);
        ">
            <!-- Modal Header -->
            <div style="
                padding: 24px;
                border-bottom: 1px solid var(--border-color);
                display: flex;
                align-items: center;
                gap: 16px;
            ">
                <div style="
                    width: 48px;
                    height: 48px;
                    border-radius: 50%;
                    background: rgba(255, 68, 68, 0.2);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #ff4444;
                    font-size: 24px;
                ">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <div style="flex: 1;">
                    <h2 style="font-size: 24px; font-weight: 700; margin: 0 0 4px 0;">Reject and Delete Campaign</h2>
                    <p style="color: var(--text-secondary); margin: 0; font-size: 14px;">This action cannot be undone</p>
                </div>
                <button onclick="closeRejectCampaignModal()" style="
                    background: none;
                    border: none;
                    color: var(--text-secondary);
                    font-size: 24px;
                    cursor: pointer;
                    padding: 4px 8px;
                    border-radius: 4px;
                    transition: all 0.2s;
                " onmouseover="this.style.background='var(--bg-card-hover)'; this.style.color='var(--text-primary)'" onmouseout="this.style.background='none'; this.style.color='var(--text-secondary)'">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            
            <!-- Campaign Details -->
            <div style="padding: 24px;">
                <p style="color: var(--text-primary); margin-bottom: 24px; font-size: 16px; text-align: center;">
                    Are you sure you want to reject and delete this campaign? All associated data will be permanently removed.
                </p>
                
                <div style="
                    background: var(--bg-darker);
                    border-radius: 12px;
                    padding: 24px;
                    margin-bottom: 24px;
                    border: 1px solid var(--border-color);
                    display: grid;
                    grid-template-columns: ${imageUrl ? 'minmax(250px, 300px) 1fr' : '1fr'};
                    gap: 24px;
                    align-items: start;
                ">
                    ${imageUrl ? `
                        <div>
                            <img src="${imageUrl}" 
                                 style="width: 100%; height: 250px; object-fit: cover; border-radius: 8px;"
                                 onerror="this.style.display='none'">
                        </div>
                    ` : ''}
                    
                    <div>
                        <h3 style="font-size: 22px; font-weight: 700; margin: 0 0 20px 0; color: var(--text-primary); line-height: 1.3;">
                            ${title}
                        </h3>
                        
                        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-top: 16px;">
                            <div>
                                <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px;">Category</div>
                                <div style="font-weight: 600; color: var(--text-primary); font-size: 14px;">${categoryName}</div>
                            </div>
                            <div>
                                <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px;">Status</div>
                                <div style="font-weight: 600; color: var(--warning-color); font-size: 14px;">Pending</div>
                            </div>
                            <div>
                                <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px;">Donors</div>
                                <div style="font-weight: 600; color: var(--text-primary); font-size: 14px;">${donorCount}</div>
                            </div>
                            <div>
                                <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px;">Goal Amount</div>
                                <div style="font-weight: 600; color: var(--text-primary); font-size: 14px;">${formatCurrency(goalAmount)}</div>
                            </div>
                            <div>
                                <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px;">Raised</div>
                                <div style="font-weight: 600; color: var(--primary-color); font-size: 14px;">${formatCurrency(raised)}</div>
                            </div>
                            <div>
                                <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px;">Progress</div>
                                <div style="font-weight: 600; color: var(--text-primary); font-size: 14px;">${percentage.toFixed(1)}%</div>
                            </div>
                        </div>
                        
                        ${deadline ? `
                            <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid var(--border-color);">
                                <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px;">Deadline</div>
                                <div style="font-weight: 600; color: var(--text-primary); font-size: 14px;">
                                    ${formatDate(deadline)} <span style="color: var(--text-secondary); font-size: 12px;">(${daysLeft} left)</span>
                                </div>
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
            
            <!-- Modal Footer -->
            <div style="
                padding: 24px;
                border-top: 1px solid var(--border-color);
                display: flex;
                gap: 12px;
                justify-content: flex-end;
            ">
                <button onclick="closeRejectCampaignModal()" style="
                    padding: 12px 24px;
                    background: var(--bg-darker);
                    border: 1px solid var(--border-color);
                    border-radius: 8px;
                    color: var(--text-primary);
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                " onmouseover="this.style.background='var(--bg-card-hover)'" onmouseout="this.style.background='var(--bg-darker)'">
                    Cancel
                </button>
                <button onclick="performRejectCampaign(${campaignId})" style="
                    padding: 12px 24px;
                    background: #ff4444;
                    border: none;
                    border-radius: 8px;
                    color: white;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                " onmouseover="this.style.background='#cc3333'" onmouseout="this.style.background='#ff4444'">
                    <i class="fas fa-trash"></i> Reject and Delete
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modalOverlay);
    
    // Close on overlay click
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) {
            closeRejectCampaignModal();
        }
    });
}

function closeRejectCampaignModal() {
    const modal = document.getElementById('rejectCampaignModal');
    if (modal) {
        modal.remove();
    }
}

function showDeleteUserModal(user, userId) {
    const fullName = user.FullName || user.fullName || 'Unknown User';
    const email = user.Email || user.email || 'No email';
    const profileImagePath = user.ProfileImage || user.profileImage;
    const totalDonated = user.HowMuchHeDonate || user.howMuchHeDonate || 0;
    const donationCount = user.HowManyHeDonate || user.howManyHeDonate || 0;
    const isActive = user.IsActive !== undefined ? user.IsActive : (user.isActive !== undefined ? user.isActive : true);
    
    const profileImage = profileImagePath ? buildImageUrl(profileImagePath) : null;
    const userAvatar = profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=007cff&color=fff&size=128`;
    
    const modalOverlay = document.createElement('div');
    modalOverlay.id = 'deleteUserModal';
    modalOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        padding: 20px;
    `;
    
    modalOverlay.innerHTML = `
        <div style="
            background: var(--bg-card);
            border-radius: 16px;
            max-width: 600px;
            width: 100%;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
            border: 1px solid var(--border-color);
        ">
            <div style="
                padding: 24px;
                border-bottom: 1px solid var(--border-color);
                display: flex;
                align-items: center;
                gap: 16px;
            ">
                <div style="
                    width: 48px;
                    height: 48px;
                    border-radius: 50%;
                    background: rgba(255, 68, 68, 0.2);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #ff4444;
                    font-size: 24px;
                ">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <div style="flex: 1;">
                    <h2 style="font-size: 24px; font-weight: 700; margin: 0 0 4px 0;">Delete User</h2>
                    <p style="color: var(--text-secondary); margin: 0; font-size: 14px;">This action cannot be undone</p>
                </div>
                <button onclick="closeDeleteUserModal()" style="
                    background: none;
                    border: none;
                    color: var(--text-secondary);
                    font-size: 24px;
                    cursor: pointer;
                    padding: 4px 8px;
                    border-radius: 4px;
                    transition: all 0.2s;
                " onmouseover="this.style.background='var(--bg-card-hover)'; this.style.color='var(--text-primary)'" onmouseout="this.style.background='none'; this.style.color='var(--text-secondary)'">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            
            <div style="padding: 24px;">
                <p style="color: var(--text-primary); margin-bottom: 24px; font-size: 16px; text-align: center;">
                    Are you sure you want to delete this user? All associated data will be permanently removed.
                </p>
                
                <div style="
                    background: var(--bg-darker);
                    border-radius: 12px;
                    padding: 24px;
                    margin-bottom: 24px;
                    border: 1px solid var(--border-color);
                    text-align: center;
                ">
                    <img src="${userAvatar}" alt="${fullName}" style="width: 80px; height: 80px; border-radius: 50%; object-fit: cover; margin-bottom: 16px;" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                    <div style="width: 80px; height: 80px; border-radius: 50%; background: var(--primary-color); color: white; display: none; align-items: center; justify-content: center; font-weight: 600; font-size: 32px; margin: 0 auto 16px;">
                        ${fullName.charAt(0).toUpperCase()}
                    </div>
                    <h3 style="font-size: 20px; font-weight: 700; margin: 0 0 8px 0; color: var(--text-primary);">${fullName}</h3>
                    <p style="color: var(--text-secondary); margin: 0 0 16px 0; font-size: 14px;">${email}</p>
                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-top: 16px;">
                        <div>
                            <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 4px;">Status</div>
                            <div style="font-weight: 600; color: ${isActive ? 'var(--success-color)' : 'var(--warning-color)'}; font-size: 14px;">
                                ${isActive ? 'ACTIVE' : 'SUSPENDED'}
                            </div>
                        </div>
                        <div>
                            <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 4px;">Total Donated</div>
                            <div style="font-weight: 600; color: var(--text-primary); font-size: 14px;">${formatCurrency(totalDonated)}</div>
                        </div>
                        <div>
                            <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 4px;">Donations</div>
                            <div style="font-weight: 600; color: var(--text-primary); font-size: 14px;">${donationCount}</div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div style="
                padding: 24px;
                border-top: 1px solid var(--border-color);
                display: flex;
                gap: 12px;
                justify-content: flex-end;
            ">
                <button onclick="closeDeleteUserModal()" style="
                    padding: 12px 24px;
                    background: var(--bg-darker);
                    border: 1px solid var(--border-color);
                    border-radius: 8px;
                    color: var(--text-primary);
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                " onmouseover="this.style.background='var(--bg-card-hover)'" onmouseout="this.style.background='var(--bg-darker)'">
                    Cancel
                </button>
                <button onclick="performDeleteUser('${userId}')" style="
                    padding: 12px 24px;
                    background: #ff4444;
                    border: none;
                    border-radius: 8px;
                    color: white;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                " onmouseover="this.style.background='#cc3333'" onmouseout="this.style.background='#ff4444'">
                    <i class="fas fa-trash"></i> Delete User
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modalOverlay);
    
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) {
            closeDeleteUserModal();
        }
    });
}

function closeDeleteUserModal() {
    const modal = document.getElementById('deleteUserModal');
    if (modal) {
        modal.remove();
    }
}

function showDeleteReviewModal(review, reviewId) {
    const userName = review.UserName || review.userName || 'Unknown';
    const comment = review.Comment || review.comment || 'No comment';
    const campaignTitle = review.CampaignTitle || review.campaignTitle || 'Unknown Campaign';
    const createdAt = review.CreatedAt || review.createdAt;
    const reaction = review.Reaction || review.reaction;
    
    const date = createdAt ? formatDate(createdAt) : 'Unknown';
    const reactionIcon = reaction === 1 ? '👍' : reaction === 2 ? '❤️' : reaction === 3 ? '💪' : '';
    
    const modalOverlay = document.createElement('div');
    modalOverlay.id = 'deleteReviewModal';
    modalOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        padding: 20px;
    `;
    
    modalOverlay.innerHTML = `
        <div style="
            background: var(--bg-card);
            border-radius: 16px;
            max-width: 600px;
            width: 100%;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
            border: 1px solid var(--border-color);
        ">
            <div style="
                padding: 24px;
                border-bottom: 1px solid var(--border-color);
                display: flex;
                align-items: center;
                gap: 16px;
            ">
                <div style="
                    width: 48px;
                    height: 48px;
                    border-radius: 50%;
                    background: rgba(255, 68, 68, 0.2);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #ff4444;
                    font-size: 24px;
                ">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <div style="flex: 1;">
                    <h2 style="font-size: 24px; font-weight: 700; margin: 0 0 4px 0;">Delete Review</h2>
                    <p style="color: var(--text-secondary); margin: 0; font-size: 14px;">This action cannot be undone</p>
                </div>
                <button onclick="closeDeleteReviewModal()" style="
                    background: none;
                    border: none;
                    color: var(--text-secondary);
                    font-size: 24px;
                    cursor: pointer;
                    padding: 4px 8px;
                    border-radius: 4px;
                    transition: all 0.2s;
                " onmouseover="this.style.background='var(--bg-card-hover)'; this.style.color='var(--text-primary)'" onmouseout="this.style.background='none'; this.style.color='var(--text-secondary)'">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            
            <div style="padding: 24px;">
                <p style="color: var(--text-primary); margin-bottom: 24px; font-size: 16px; text-align: center;">
                    Are you sure you want to delete this review?
                </p>
                
                <div style="
                    background: var(--bg-darker);
                    border-radius: 12px;
                    padding: 24px;
                    margin-bottom: 24px;
                    border: 1px solid var(--border-color);
                ">
                    <div style="margin-bottom: 16px;">
                        <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px;">User</div>
                        <div style="font-weight: 600; color: var(--text-primary); font-size: 16px;">${userName}</div>
                    </div>
                    <div style="margin-bottom: 16px;">
                        <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px;">Campaign</div>
                        <div style="font-weight: 600; color: var(--text-primary); font-size: 16px;">${campaignTitle}</div>
                    </div>
                    <div style="margin-bottom: 16px;">
                        <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px;">Reaction</div>
                        <div style="font-size: 24px;">${reactionIcon || 'None'}</div>
                    </div>
                    <div style="margin-bottom: 16px;">
                        <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px;">Comment</div>
                        <div style="color: var(--text-primary); font-size: 14px; line-height: 1.5;">${comment}</div>
                    </div>
                    <div>
                        <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px;">Date</div>
                        <div style="font-weight: 600; color: var(--text-secondary); font-size: 14px;">${date}</div>
                    </div>
                </div>
            </div>
            
            <div style="
                padding: 24px;
                border-top: 1px solid var(--border-color);
                display: flex;
                gap: 12px;
                justify-content: flex-end;
            ">
                <button onclick="closeDeleteReviewModal()" style="
                    padding: 12px 24px;
                    background: var(--bg-darker);
                    border: 1px solid var(--border-color);
                    border-radius: 8px;
                    color: var(--text-primary);
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                " onmouseover="this.style.background='var(--bg-card-hover)'" onmouseout="this.style.background='var(--bg-darker)'">
                    Cancel
                </button>
                <button onclick="performDeleteReview(${reviewId})" style="
                    padding: 12px 24px;
                    background: #ff4444;
                    border: none;
                    border-radius: 8px;
                    color: white;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                " onmouseover="this.style.background='#cc3333'" onmouseout="this.style.background='#ff4444'">
                    <i class="fas fa-trash"></i> Delete Review
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modalOverlay);
    
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) {
            closeDeleteReviewModal();
        }
    });
}

function closeDeleteReviewModal() {
    const modal = document.getElementById('deleteReviewModal');
    if (modal) {
        modal.remove();
    }
}

function showDeleteCategoryModal(category, categoryId) {
    const name = category.Name || category.name || 'Unknown';
    const campaignCount = category.CampaignCount || category.campaignCount || 0;
    
    const modalOverlay = document.createElement('div');
    modalOverlay.id = 'deleteCategoryModal';
    modalOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        padding: 20px;
    `;
    
    modalOverlay.innerHTML = `
        <div style="
            background: var(--bg-card);
            border-radius: 16px;
            max-width: 500px;
            width: 100%;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
            border: 1px solid var(--border-color);
        ">
            <div style="
                padding: 24px;
                border-bottom: 1px solid var(--border-color);
                display: flex;
                align-items: center;
                gap: 16px;
            ">
                <div style="
                    width: 48px;
                    height: 48px;
                    border-radius: 50%;
                    background: rgba(255, 68, 68, 0.2);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #ff4444;
                    font-size: 24px;
                ">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <div style="flex: 1;">
                    <h2 style="font-size: 24px; font-weight: 700; margin: 0 0 4px 0;">Delete Category</h2>
                    <p style="color: var(--text-secondary); margin: 0; font-size: 14px;">This action cannot be undone</p>
                </div>
                <button onclick="closeDeleteCategoryModal()" style="
                    background: none;
                    border: none;
                    color: var(--text-secondary);
                    font-size: 24px;
                    cursor: pointer;
                    padding: 4px 8px;
                    border-radius: 4px;
                    transition: all 0.2s;
                " onmouseover="this.style.background='var(--bg-card-hover)'; this.style.color='var(--text-primary)'" onmouseout="this.style.background='none'; this.style.color='var(--text-secondary)'">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            
            <div style="padding: 24px;">
                <p style="color: var(--text-primary); margin-bottom: 24px; font-size: 16px; text-align: center;">
                    Are you sure you want to delete this category? ${campaignCount > 0 ? `This category has ${campaignCount} campaign${campaignCount !== 1 ? 's' : ''} associated with it.` : ''}
                </p>
                
                <div style="
                    background: var(--bg-darker);
                    border-radius: 12px;
                    padding: 24px;
                    margin-bottom: 24px;
                    border: 1px solid var(--border-color);
                    text-align: center;
                ">
                    <div style="font-size: 32px; margin-bottom: 16px;">📁</div>
                    <h3 style="font-size: 20px; font-weight: 700; margin: 0 0 8px 0; color: var(--text-primary);">${name}</h3>
                    <div style="font-size: 14px; color: var(--text-secondary);">
                        ${campaignCount} campaign${campaignCount !== 1 ? 's' : ''}
                    </div>
                </div>
            </div>
            
            <div style="
                padding: 24px;
                border-top: 1px solid var(--border-color);
                display: flex;
                gap: 12px;
                justify-content: flex-end;
            ">
                <button onclick="closeDeleteCategoryModal()" style="
                    padding: 12px 24px;
                    background: var(--bg-darker);
                    border: 1px solid var(--border-color);
                    border-radius: 8px;
                    color: var(--text-primary);
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                " onmouseover="this.style.background='var(--bg-card-hover)'" onmouseout="this.style.background='var(--bg-darker)'">
                    Cancel
                </button>
                <button onclick="performDeleteCategory(${categoryId})" style="
                    padding: 12px 24px;
                    background: #ff4444;
                    border: none;
                    border-radius: 8px;
                    color: white;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                " onmouseover="this.style.background='#cc3333'" onmouseout="this.style.background='#ff4444'">
                    <i class="fas fa-trash"></i> Delete Category
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modalOverlay);
    
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) {
            closeDeleteCategoryModal();
        }
    });
}

function closeDeleteCategoryModal() {
    const modal = document.getElementById('deleteCategoryModal');
    if (modal) {
        modal.remove();
    }
}

// ============================================
// Control Functions
// ============================================

async function approveCampaignById(campaignId, isApproved = true) {
    try {
        await approveCampaign(campaignId, isApproved); // /api/Campaigns/{id}/approval?isApproved=true|false
        showNotification(isApproved ? 'Campaign approved successfully' : 'Campaign disapproved successfully', 'success');
        // Refresh appropriate lists based on current page
        if (window.location.pathname.includes('admin-dashboard.html')) {
            await Promise.all([loadPendingCampaigns(), loadSystemStatistics()]);
        } else if (window.location.pathname.includes('admin-campaigns.html')) {
            // Use the filtered load function if available
            if (typeof loadPageData === 'function') {
                await loadPageData('campaigns');
            } else {
                await loadAllCampaigns();
            }
        } else {
            await Promise.all([loadPendingCampaigns(), loadSystemStatistics()]);
        }
    } catch (error) {
        console.error('Error approving campaign:', error);
        showNotification(error.message || (isApproved ? 'Error approving campaign' : 'Error disapproving campaign'), 'error');
    }
}

async function rejectCampaign(campaignId) {
    try {
        // Fetch full campaign details for the modal
        const campaign = await getCampaignById(campaignId);
        // Show beautiful rejection modal with campaign details
        showRejectCampaignModal(campaign, campaignId);
    } catch (error) {
        console.error('Error fetching campaign details:', error);
        // Fallback to simple confirm if fetch fails
        if (confirm('Are you sure you want to reject and delete this campaign?')) {
            await performRejectCampaign(campaignId);
        }
    }
}

async function performRejectCampaign(campaignId) {
    try {
        closeRejectCampaignModal();
        await deleteCampaign(campaignId); // /api/Campaigns/{id} DELETE
        showNotification('Campaign rejected and deleted', 'success');
        // Refresh appropriate lists based on current page
        if (window.location.pathname.includes('admin-dashboard.html')) {
            await Promise.all([loadPendingCampaigns(), loadSystemStatistics()]);
        } else if (window.location.pathname.includes('admin-campaigns.html')) {
            if (typeof loadPageData === 'function') {
                await loadPageData('campaigns');
            } else {
                await loadAllCampaigns();
            }
        } else {
            await Promise.all([loadPendingCampaigns(), loadSystemStatistics()]);
        }
    } catch (error) {
        console.error('Error rejecting campaign:', error);
        showNotification(error.message || 'Error rejecting campaign', 'error');
    }
}

async function toggleUserStatus(userId, isActive) {
    try {
        await updateUserActivity(userId); // /api/Users/{id}/changeactivity
        showNotification(`User ${isActive ? 'activated' : 'suspended'} successfully`, 'success');
        // Refresh users list if on users page or dashboard
        if (window.location.pathname.includes('admin-users.html')) {
            if (typeof loadPageData === 'function') {
                await loadPageData('users');
            } else {
                await loadAllUsers();
            }
        } else if (window.location.pathname.includes('admin-dashboard.html')) {
            await loadAllUsers();
        } else {
            await loadAllUsers();
        }
    } catch (error) {
        console.error('Error updating user status:', error);
        showNotification(error.message || 'Error updating user status', 'error');
        if (window.location.pathname.includes('admin-users.html')) {
            if (typeof loadPageData === 'function') {
                await loadPageData('users');
            } else {
                await loadAllUsers();
            }
        } else {
            await loadAllUsers();
        }
    }
}

async function deleteUserById(userId) {
    try {
        // Fetch full user details for the modal
        const user = await getUserById(userId);
        // Show beautiful deletion modal with user details
        showDeleteUserModal(user, userId);
    } catch (error) {
        console.error('Error fetching user details:', error);
        // Fallback to simple confirm if fetch fails
        if (confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
            await performDeleteUser(userId);
        }
    }
}

async function performDeleteUser(userId) {
    try {
        closeDeleteUserModal();
        await deleteUser(userId); // /api/Users/{id} DELETE
        showNotification('User deleted successfully', 'success');
        // Refresh users list if on users page
        if (window.location.pathname.includes('admin-users.html')) {
            if (typeof loadPageData === 'function') {
                await loadPageData('users');
            } else {
                await loadAllUsers();
            }
        } else if (window.location.pathname.includes('admin-dashboard.html')) {
            await Promise.all([loadAllUsers(), loadSystemStatistics()]);
        } else {
            await loadAllUsers();
        }
    } catch (error) {
        console.error('Error deleting user:', error);
        showNotification(error.message || 'Error deleting user', 'error');
    }
}

async function deleteReviewById(reviewId) {
    try {
        // Prefer cached list from the current page (fast + guarantees matching item)
        const cached = window.__adminCache?.reviews;
        const reviewFromCache = Array.isArray(cached)
            ? cached.find(r => (r.Id || r.id) == reviewId)
            : null;

        // Fallback: refetch (in case cache isn't available)
        let review = reviewFromCache;
        if (!review) {
            const reviewsResponse = await getAllReviews({ PageSize: 1000, PageNumer: 1 });
            const reviews = Array.isArray(reviewsResponse) ? reviewsResponse : (reviewsResponse?.Items || []);
            review = reviews.find(r => (r.Id || r.id) == reviewId);
        }
        
        // Always use the beautiful modal (no browser confirm)
        showDeleteReviewModal(
            review || {
                Id: reviewId,
                UserName: 'Unknown',
                Comment: 'This review could not be loaded, but you can still delete it.',
                CampaignTitle: 'Unknown',
                CreatedAt: null,
                Reaction: null
            },
            reviewId
        );
    } catch (error) {
        console.error('Error fetching review details:', error);
        // Fallback: still use the modal even if fetch fails
        showDeleteReviewModal(
            {
                Id: reviewId,
                UserName: 'Unknown',
                Comment: 'Unable to load review details. You can still delete it.',
                CampaignTitle: 'Unknown',
                CreatedAt: null,
                Reaction: null
            },
            reviewId
        );
    }
}

async function performDeleteReview(reviewId) {
    try {
        closeDeleteReviewModal();
        await deleteReview(reviewId); // /api/Reviews/{id} DELETE
        showNotification('Review deleted successfully', 'success');
        // Refresh reviews list if on messages page
        if (window.location.pathname.includes('admin-messages.html')) {
            if (typeof loadPageData === 'function') {
                await loadPageData('messages');
            } else {
                await loadAllReviews();
            }
        } else if (window.location.pathname.includes('admin-dashboard.html')) {
            await loadAllReviews();
        } else {
            await loadAllReviews();
        }
    } catch (error) {
        console.error('Error deleting review:', error);
        showNotification(error.message || 'Error deleting review', 'error');
    }
}

async function deleteCategoryById(categoryId) {
    try {
        // Fetch full category details for the modal
        const category = await getCategoryById(categoryId);
        // Show beautiful deletion modal with category details
        showDeleteCategoryModal(category, categoryId);
    } catch (error) {
        console.error('Error fetching category details:', error);
        // Fallback to simple confirm if fetch fails
        if (confirm('Are you sure you want to delete this category?')) {
            await performDeleteCategory(categoryId);
        }
    }
}

async function performDeleteCategory(categoryId) {
    try {
        closeDeleteCategoryModal();
        await deleteCategory(categoryId); // /api/Categories/{id} DELETE
        showNotification('Category deleted successfully', 'success');
        // Refresh categories list if on categories page
        if (window.location.pathname.includes('admin-categories.html') || window.location.pathname.includes('admin-dashboard.html')) {
            await loadAllCategories();
        } else {
            await loadAllCategories();
        }
    } catch (error) {
        console.error('Error deleting category:', error);
        showNotification(error.message || 'Error deleting category', 'error');
    }
}

function editCategory(categoryId, currentName) {
    showEditCategoryModal(categoryId, currentName);
}

function createNewCategory() {
    showCreateCategoryModal();
}

function showEditCategoryModal(categoryId, currentName) {
    const modalOverlay = document.createElement('div');
    modalOverlay.id = 'editCategoryModal';
    modalOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        padding: 20px;
    `;

    modalOverlay.innerHTML = `
        <div style="
            background: var(--bg-card);
            border-radius: 16px;
            max-width: 700px;
            width: 100%;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
            border: 1px solid var(--border-color);
            overflow: hidden;
        ">
            <div style="
                padding: 24px;
                border-bottom: 1px solid var(--border-color);
                display: flex;
                align-items: center;
                gap: 16px;
                background: var(--bg-darker);
            ">
                <div style="
                    width: 48px;
                    height: 48px;
                    border-radius: 50%;
                    background: rgba(0, 124, 255, 0.15);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: var(--primary-color);
                    font-size: 22px;
                ">
                    <i class="fas fa-edit"></i>
                </div>
                <div style="flex: 1;">
                    <h2 style="font-size: 22px; font-weight: 800; margin: 0 0 4px 0;">Edit Category</h2>
                    <p style="color: var(--text-secondary); margin: 0; font-size: 13px;">Update category name</p>
                </div>
                <button onclick="closeEditCategoryModal()" style="
                    background: none;
                    border: none;
                    color: var(--text-secondary);
                    font-size: 24px;
                    cursor: pointer;
                    padding: 4px 8px;
                    border-radius: 6px;
                " onmouseover="this.style.background='var(--bg-card-hover)'; this.style.color='var(--text-primary)'" onmouseout="this.style.background='none'; this.style.color='var(--text-secondary)'">
                    <i class="fas fa-times"></i>
                </button>
            </div>

            <div style="padding: 24px;">
                <div style="
                    background: var(--bg-darker);
                    border: 1px solid var(--border-color);
                    border-radius: 12px;
                    padding: 18px;
                ">
                    <label style="display:block; font-size: 12px; color: var(--text-muted); margin-bottom: 8px; text-transform: uppercase; letter-spacing: .5px; font-weight: 700;">
                        Category name
                    </label>
                    <input id="editCategoryNameInput" value="${String(currentName || '').replace(/"/g, '&quot;')}" style="
                        width: 100%;
                        padding: 12px 14px;
                        border-radius: 10px;
                        border: 1px solid var(--border-color);
                        background: var(--bg-card);
                        color: var(--text-primary);
                        font-size: 14px;
                    " />
                </div>
            </div>

            <div style="
                padding: 20px 24px;
                border-top: 1px solid var(--border-color);
                display: flex;
                justify-content: flex-end;
                gap: 10px;
                background: var(--bg-darker);
            ">
                <button onclick="closeEditCategoryModal()" style="
                    padding: 10px 18px;
                    background: var(--bg-card);
                    border: 1px solid var(--border-color);
                    border-radius: 10px;
                    color: var(--text-primary);
                    font-weight: 700;
                    cursor: pointer;
                ">Cancel</button>
                <button onclick="performEditCategory(${categoryId})" style="
                    padding: 10px 18px;
                    background: var(--primary-color);
                    border: none;
                    border-radius: 10px;
                    color: white;
                    font-weight: 800;
                    cursor: pointer;
                "><i class="fas fa-save"></i> Save</button>
            </div>
        </div>
    `;

    document.body.appendChild(modalOverlay);
    setTimeout(() => document.getElementById('editCategoryNameInput')?.focus(), 0);
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) closeEditCategoryModal();
    });
}

function closeEditCategoryModal() {
    document.getElementById('editCategoryModal')?.remove();
}

async function performEditCategory(categoryId) {
    const input = document.getElementById('editCategoryNameInput');
    const newName = input?.value?.trim();
    if (!newName) return;

    try {
        closeEditCategoryModal();
        await updateCategory(categoryId, newName);
        showNotification('Category updated successfully', 'success');
        if (window.location.pathname.includes('admin-categories.html') || window.location.pathname.includes('admin-dashboard.html')) {
            await loadAllCategories();
        }
    } catch (error) {
        console.error('Error updating category:', error);
        showNotification(error.message || 'Error updating category', 'error');
    }
}

function showCreateCategoryModal() {
    const modalOverlay = document.createElement('div');
    modalOverlay.id = 'createCategoryModal';
    modalOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        padding: 20px;
    `;

    modalOverlay.innerHTML = `
        <div style="
            background: var(--bg-card);
            border-radius: 16px;
            max-width: 700px;
            width: 100%;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
            border: 1px solid var(--border-color);
            overflow: hidden;
        ">
            <div style="
                padding: 24px;
                border-bottom: 1px solid var(--border-color);
                display: flex;
                align-items: center;
                gap: 16px;
                background: var(--bg-darker);
            ">
                <div style="
                    width: 48px;
                    height: 48px;
                    border-radius: 50%;
                    background: rgba(16, 182, 21, 0.15);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: var(--success-color);
                    font-size: 22px;
                ">
                    <i class="fas fa-plus"></i>
                </div>
                <div style="flex: 1;">
                    <h2 style="font-size: 22px; font-weight: 800; margin: 0 0 4px 0;">Create Category</h2>
                    <p style="color: var(--text-secondary); margin: 0; font-size: 13px;">Add a new category</p>
                </div>
                <button onclick="closeCreateCategoryModal()" style="
                    background: none;
                    border: none;
                    color: var(--text-secondary);
                    font-size: 24px;
                    cursor: pointer;
                    padding: 4px 8px;
                    border-radius: 6px;
                " onmouseover="this.style.background='var(--bg-card-hover)'; this.style.color='var(--text-primary)'" onmouseout="this.style.background='none'; this.style.color='var(--text-secondary)'">
                    <i class="fas fa-times"></i>
                </button>
            </div>

            <div style="padding: 24px;">
                <div style="
                    background: var(--bg-darker);
                    border: 1px solid var(--border-color);
                    border-radius: 12px;
                    padding: 18px;
                ">
                    <label style="display:block; font-size: 12px; color: var(--text-muted); margin-bottom: 8px; text-transform: uppercase; letter-spacing: .5px; font-weight: 700;">
                        Category name
                    </label>
                    <input id="createCategoryNameInput" placeholder="e.g. Community" style="
                        width: 100%;
                        padding: 12px 14px;
                        border-radius: 10px;
                        border: 1px solid var(--border-color);
                        background: var(--bg-card);
                        color: var(--text-primary);
                        font-size: 14px;
                    " />
                </div>
            </div>

            <div style="
                padding: 20px 24px;
                border-top: 1px solid var(--border-color);
                display: flex;
                justify-content: flex-end;
                gap: 10px;
                background: var(--bg-darker);
            ">
                <button onclick="closeCreateCategoryModal()" style="
                    padding: 10px 18px;
                    background: var(--bg-card);
                    border: 1px solid var(--border-color);
                    border-radius: 10px;
                    color: var(--text-primary);
                    font-weight: 700;
                    cursor: pointer;
                ">Cancel</button>
                <button onclick="performCreateCategory()" style="
                    padding: 10px 18px;
                    background: var(--success-color);
                    border: none;
                    border-radius: 10px;
                    color: white;
                    font-weight: 800;
                    cursor: pointer;
                "><i class="fas fa-plus"></i> Create</button>
            </div>
        </div>
    `;

    document.body.appendChild(modalOverlay);
    setTimeout(() => document.getElementById('createCategoryNameInput')?.focus(), 0);
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) closeCreateCategoryModal();
    });
}

function closeCreateCategoryModal() {
    document.getElementById('createCategoryModal')?.remove();
}

async function performCreateCategory() {
    const input = document.getElementById('createCategoryNameInput');
    const name = input?.value?.trim();
    if (!name) return;

    try {
        closeCreateCategoryModal();
        await createCategory(name);
        showNotification('Category created successfully', 'success');
        if (window.location.pathname.includes('admin-categories.html') || window.location.pathname.includes('admin-dashboard.html')) {
            await loadAllCategories();
        }
    } catch (error) {
        console.error('Error creating category:', error);
        showNotification(error.message || 'Error creating category', 'error');
    }
}

function showPledgesSection() {
    const section = document.getElementById('pledgesSidebarSection');
    if (section) {
        section.style.display = section.style.display === 'none' ? 'block' : 'none';
    }
}

function showReviewsSection() {
    const reviewsSection = document.querySelector('#allReviewsBody')?.closest('.card');
    if (reviewsSection) {
        reviewsSection.scrollIntoView({ behavior: 'smooth' });
    }
}

function showCategoriesSection() {
    const categoriesSection = document.querySelector('#categoriesContainer')?.closest('.card');
    if (categoriesSection) {
        categoriesSection.scrollIntoView({ behavior: 'smooth' });
    }
}

function refreshAllData() {
    showNotification('Refreshing all data...', 'info');
    location.reload();
}

function exportSystemData() {
    showNotification('Export feature coming soon', 'info');
    // TODO: Implement export functionality
}

function toggleUserMenu() {
    const dropdown = document.getElementById('adminUserDropdown');
    if (!dropdown) return;
    dropdown.style.display = dropdown.style.display === 'none' || dropdown.style.display === '' ? 'block' : 'none';
}

// ============================================
// Helper Functions
// ============================================

function updateElement(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
}

function updateGrowthIndicator(containerId, textId, growth) {
    const container = document.getElementById(containerId);
    const textEl = document.getElementById(textId);
    
    if (!container || !textEl) return;
    
    const text = growth >= 0
        ? `+${growth.toFixed(1)}% from last month`
        : `${growth.toFixed(1)}% from last month`;
    
    textEl.textContent = text;
    container.className = growth >= 0 ? 'stat-change positive' : 'stat-change negative';
    
    const icon = container.querySelector('i');
    if (icon) {
        icon.className = growth >= 0 ? 'fas fa-arrow-up' : 'fas fa-arrow-down';
    }
}

// Make functions globally available
window.approveCampaignById = approveCampaignById;
window.rejectCampaign = rejectCampaign;
window.toggleUserStatus = toggleUserStatus;
window.deleteUserById = deleteUserById;
window.deleteReviewById = deleteReviewById;
window.deleteCategoryById = deleteCategoryById;
window.editCategory = editCategory;
window.createNewCategory = createNewCategory;
window.loadAllCampaigns = loadAllCampaigns;
window.loadAllPledges = loadAllPledges;
window.loadAllReviews = loadAllReviews;
window.showPledgesSection = showPledgesSection;
window.showReviewsSection = showReviewsSection;
window.showCategoriesSection = showCategoriesSection;
window.refreshAllData = refreshAllData;
window.exportSystemData = exportSystemData;

// Modal functions
window.closeRejectCampaignModal = closeRejectCampaignModal;
window.performRejectCampaign = performRejectCampaign;
window.closeDeleteUserModal = closeDeleteUserModal;
window.performDeleteUser = performDeleteUser;
window.closeDeleteReviewModal = closeDeleteReviewModal;
window.performDeleteReview = performDeleteReview;
window.closeDeleteCategoryModal = closeDeleteCategoryModal;
window.performDeleteCategory = performDeleteCategory;
window.showEditCategoryModal = showEditCategoryModal;
window.closeEditCategoryModal = closeEditCategoryModal;
window.performEditCategory = performEditCategory;
window.showCreateCategoryModal = showCreateCategoryModal;
window.closeCreateCategoryModal = closeCreateCategoryModal;
window.performCreateCategory = performCreateCategory;
