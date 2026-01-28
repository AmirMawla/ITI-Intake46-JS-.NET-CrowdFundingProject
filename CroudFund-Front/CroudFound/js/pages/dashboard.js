// User dashboard functionality

document.addEventListener('DOMContentLoaded', async () => {
    if (!requireAuth()) return;
    
    await loadUserData();
    await loadStatistics();
    await loadCampaigns();
    await loadChart();
});

async function loadUserData() {
    try {
        const user = getCurrentUser();
        if (!user) return;
        
        // Try to get fresh user data from API (only if authenticated)
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
        document.getElementById('sidebarUserInitial').textContent = initial;
        document.getElementById('sidebarUserName').textContent = fullName;
        document.getElementById('welcomeName').textContent = fullName;
        
        // Set profile image in header & dropdown (same as home/create-campaign)
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
                    const fallbackDiv = sidebarProfile.querySelector('.user-profile');
                    if (fallbackDiv) fallbackDiv.style.display = 'none';
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
    } catch (error) {
        console.error('Error loading user data:', error);
        handleError(error, 'Unable to load user data. Please refresh the page.');
    }
}

// State for financial performance pagination
let financialPerformanceData = [];
let financialPerformancePage = 0;
const FINANCIAL_PERFORMANCE_PAGE_SIZE = 6;

async function loadStatistics() {
    try {
        const user = getCurrentUser();
        if (!user) return;
        
        // Get dashboard statistics from backend
        const dashboardStats = await getMyDashboardStatistics().catch(err => {
            console.warn('Could not fetch dashboard statistics, falling back to client calculations:', err);
            return null;
        });

        if (dashboardStats) {
            const totalCollected = dashboardStats.totalCollected ?? dashboardStats.TotalCollected ?? 0;
            const totalDonated = dashboardStats.totalDonated ?? dashboardStats.TotalDonated ?? 0;
            const totalCollectionCount = dashboardStats.totalCollectionCount ?? dashboardStats.TotalCollectionCount ?? 0;
            const totalDonationCount = dashboardStats.totalDonationCount ?? dashboardStats.TotalDonationCount ?? 0;
            const successRate = dashboardStats.successRate ?? dashboardStats.SuccessRate ?? 0;

            const collectedGrowth = dashboardStats.collectedGrowthPercentage ?? dashboardStats.CollectedGrowthPercentage ?? 0;
            const donatedGrowth = dashboardStats.donatedGrowthPercentage ?? dashboardStats.DonatedGrowthPercentage ?? 0;

            // Update UI with real data from backend
            document.getElementById('totalRaised').textContent = formatCurrency(totalCollected);
            document.getElementById('totalDonated').textContent = formatCurrency(totalDonated);
            document.getElementById('successRate').textContent = `${Math.round(successRate)}%`;
            document.getElementById('projectsCount').textContent = totalCollectionCount.toString();
            document.getElementById('impactCount').textContent = totalDonationCount.toLocaleString();

            const collectedChangeText = collectedGrowth >= 0
                ? `+${collectedGrowth.toFixed(1)}% from last month`
                : `${collectedGrowth.toFixed(1)}% from last month`;
            const donatedChangeText = donatedGrowth >= 0
                ? `+${donatedGrowth.toFixed(1)}% from last month`
                : `${donatedGrowth.toFixed(1)}% from last month`;

            document.getElementById('raisedChange').textContent = collectedChangeText;
            document.getElementById('donatedChange').textContent = donatedChangeText;

            // Update change indicators
            const raisedChangeEl = document.getElementById('raisedChange').parentElement;
            if (raisedChangeEl) {
                raisedChangeEl.className = collectedGrowth >= 0 ? 'stat-change positive' : 'stat-change negative';
            }

            const donatedChangeEl = document.getElementById('donatedChange').parentElement;
            if (donatedChangeEl) {
                donatedChangeEl.className = donatedGrowth >= 0 ? 'stat-change positive' : 'stat-change negative';
            }
        } else {
            // Fallback to existing client-side logic if endpoint not available
            console.warn('Falling back to client-side statistics calculation');
            await fallbackLoadStatisticsClientSide();
        }
        
    } catch (error) {
        console.error('Error loading statistics:', error);
        handleError(error, 'Unable to load dashboard statistics. Please refresh the page.');
    }
}

// Legacy client-side calculation used only as fallback when API is unavailable
async function fallbackLoadStatisticsClientSide() {
    const [summaryResponse, campaignsResponse] = await Promise.all([
        getMyTransactionSummary().catch(() => null),
        getMyCampaigns().catch(() => [])
    ]);

    let myCampaigns = [];
    if (Array.isArray(campaignsResponse)) {
        myCampaigns = campaignsResponse;
    } else if (campaignsResponse?.Items) {
        myCampaigns = campaignsResponse.Items;
    } else if (campaignsResponse?.items) {
        myCampaigns = campaignsResponse.items;
    }

    const totalCollected = summaryResponse?.TotalCollected ?? summaryResponse?.totalCollected ?? 0;
    const totalDonated = summaryResponse?.TotalDonated ?? summaryResponse?.totalDonated ?? 0;
    const totalCollectionCount = summaryResponse?.TotalCollectionCount ?? summaryResponse?.totalCollectionCount ?? myCampaigns.length;
    const totalDonationCount = summaryResponse?.TotalDonationCount ?? summaryResponse?.totalDonationCount ?? 0;

    const successfulCampaigns = myCampaigns.filter(campaign => {
        const raised = campaign.TotalAmountPaid ?? campaign.totalAmountPaid ?? 0;
        const goal = campaign.GoalAmount ?? campaign.goalAmount ?? 1;
        return raised >= goal;
    }).length;

    const successRate = myCampaigns.length > 0
        ? Math.round((successfulCampaigns / myCampaigns.length) * 100)
        : 0;

    document.getElementById('totalRaised').textContent = formatCurrency(totalCollected);
    document.getElementById('totalDonated').textContent = formatCurrency(totalDonated);
    document.getElementById('successRate').textContent = `${successRate}%`;
    document.getElementById('projectsCount').textContent = totalCollectionCount.toString();
    document.getElementById('impactCount').textContent = totalDonationCount.toLocaleString();

    await calculateMonthlyChanges(totalCollected, totalDonated);
}

async function calculateMonthlyChanges(currentCollected, currentDonated) {
    try {
        const now = new Date();
        const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
        
        // Get all collections and donations from backend (we'll filter by month on frontend)
        const [collectionsResponse, donationsResponse] = await Promise.all([
            getMyCollections({ PageSize: 1000 }).catch(() => []),
            getMyDonations({ PageSize: 1000 }).catch(() => [])
        ]);
        
        // Handle paginated responses
        let allCollections = [];
        if (Array.isArray(collectionsResponse)) {
            allCollections = collectionsResponse;
        } else if (collectionsResponse?.Items) {
            allCollections = collectionsResponse.Items;
        } else if (collectionsResponse?.items) {
            allCollections = collectionsResponse.items;
        }
        
        let allDonations = [];
        if (Array.isArray(donationsResponse)) {
            allDonations = donationsResponse;
        } else if (donationsResponse?.Items) {
            allDonations = donationsResponse.Items;
        } else if (donationsResponse?.items) {
            allDonations = donationsResponse.items;
        }
        
        // Filter to last month only
        const lastMonthCollected = allCollections
            .filter(c => {
                const date = new Date(c.CreatedAt || c.createdAt || c.TransactionDate || c.transactionDate);
                return date >= lastMonthStart && date <= lastMonthEnd;
            })
            .reduce((sum, c) => sum + (c.Amount || c.amount || 0), 0);
        
        const lastMonthDonated = allDonations
            .filter(d => {
                const date = new Date(d.CreatedAt || d.createdAt || d.TransactionDate || d.transactionDate);
                return date >= lastMonthStart && date <= lastMonthEnd;
            })
            .reduce((sum, d) => sum + (d.Amount || d.amount || 0), 0);
        
        // Filter to this month only
        const thisMonthCollected = allCollections
            .filter(c => {
                const date = new Date(c.CreatedAt || c.createdAt || c.TransactionDate || c.transactionDate);
                return date >= thisMonthStart;
            })
            .reduce((sum, c) => sum + (c.Amount || c.amount || 0), 0);
        
        const thisMonthDonated = allDonations
            .filter(d => {
                const date = new Date(d.CreatedAt || d.createdAt || d.TransactionDate || d.transactionDate);
                return date >= thisMonthStart;
            })
            .reduce((sum, d) => sum + (d.Amount || d.amount || 0), 0);
        
        // Calculate percentage changes
        const collectedChange = lastMonthCollected > 0 
            ? ((thisMonthCollected - lastMonthCollected) / lastMonthCollected) * 100 
            : (thisMonthCollected > 0 ? 100 : 0);
        
        const donatedChange = lastMonthDonated > 0 
            ? ((thisMonthDonated - lastMonthDonated) / lastMonthDonated) * 100 
            : (thisMonthDonated > 0 ? 100 : 0);
        
        // Update UI
        const collectedChangeText = collectedChange >= 0 
            ? `+${collectedChange.toFixed(1)}% from last month`
            : `${collectedChange.toFixed(1)}% from last month`;
        const donatedChangeText = donatedChange >= 0 
            ? `+${donatedChange.toFixed(1)}% from last month`
            : `${donatedChange.toFixed(1)}% from last month`;
        
        document.getElementById('raisedChange').textContent = collectedChangeText;
        document.getElementById('donatedChange').textContent = donatedChangeText;
        
        // Update change indicators
        const raisedChangeEl = document.getElementById('raisedChange').parentElement;
        if (raisedChangeEl) {
            raisedChangeEl.className = collectedChange >= 0 ? 'stat-change positive' : 'stat-change negative';
        }
        
        const donatedChangeEl = document.getElementById('donatedChange').parentElement;
        if (donatedChangeEl) {
            donatedChangeEl.className = donatedChange >= 0 ? 'stat-change positive' : 'stat-change negative';
        }
        
    } catch (error) {
        console.error('Error calculating monthly changes:', error);
        // Fallback to default text
        document.getElementById('raisedChange').textContent = '+0% from last month';
        document.getElementById('donatedChange').textContent = '-0% from last month';
    }
}

async function loadCampaigns() {
    try {
        const user = getCurrentUser();
        if (!user) return;
        
        // Get my campaigns from backend
        const campaignsResponse = await getMyCampaigns({ PageSize: 10 });
        
        // Handle paginated response
        let campaigns = [];
        if (Array.isArray(campaignsResponse)) {
            campaigns = campaignsResponse;
        } else if (campaignsResponse?.Items) {
            campaigns = campaignsResponse.Items;
        } else if (campaignsResponse?.items) {
            campaigns = campaignsResponse.items;
        }
        
        const tbody = document.getElementById('campaignsTableBody');
        tbody.innerHTML = '';
        
        if (!campaigns || campaigns.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--text-secondary);">No campaigns found</td></tr>';
            return;
        }
        
        // Show first 3 campaigns from backend data
        campaigns.slice(0, 3).forEach(campaign => {
            const raised = campaign.TotalAmountPaid || campaign.totalAmountPaid || 0;
            const goalAmount = campaign.GoalAmount || campaign.goalAmount || 1;
            // Format percentage to 2 decimal places
            let percentage = calculatePercentage(raised, goalAmount);
            if (typeof percentage === 'number') {
                percentage = percentage.toFixed(2);
            }
            const campaignId = campaign.Id || campaign.id;
            const title = campaign.Title || campaign.title;
            const imagePath = campaign.Image || campaign.image;
            const isApproved = campaign.IsApproved !== undefined ? campaign.IsApproved : campaign.isApproved;
            
            // Build full image URL from backend
            const image = imagePath ? buildImageUrl(imagePath) : null;
            
            let statusClass = 'status-draft';
            let statusText = 'DRAFT';
            if (isApproved) {
                if (raised >= goalAmount) {
                    statusClass = 'status-completed';
                    statusText = 'COMPLETED';
                } else {
                    statusClass = 'status-active';
                    statusText = 'ACTIVE';
                }
            } else {
                statusClass = 'status-pending';
                statusText = 'PENDING';
            }
            
            const row = document.createElement('tr');
            const campaignImage = image || `https://source.unsplash.com/40x40/?campaign&sig=${campaignId}`;
            // Truncate title if too long (max 50 chars for display)
            const displayTitle = title.length > 50 ? title.substring(0, 47) + '...' : title;
            
            row.innerHTML = `
                <td>
                    <div style="display: flex; align-items: center; gap: 12px; min-width: 0;">
                        <img src="${campaignImage}" 
                             style="width: 40px; height: 40px; border-radius: 8px; object-fit: cover; flex-shrink: 0;" 
                             onerror="this.src='https://via.placeholder.com/40x40/141b2d/ffffff?text='+encodeURIComponent('${title.charAt(0)}')">
                        <span style="font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; min-width: 0; flex: 1;" title="${title}">${displayTitle}</span>
                    </div>
                </td>
                <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                <td>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <div style="flex: 1; height: 8px; background: var(--bg-darker); border-radius: 4px; overflow: hidden;">
                            <div style="height: 100%; width: ${percentage}%; background: var(--primary-color);"></div>
                        </div>
                        <span style="font-size: 12px; color: var(--text-muted);">${formatCurrency(goalAmount)} Goal</span>
                    </div>
                </td>
                <td style="font-weight: 600;">${formatCurrency(raised)}</td>
                <td>
                    <button style="background: none; border: none; color: var(--text-secondary); cursor: pointer; font-size: 20px;"><i class="fas fa-ellipsis-v"></i></button>
                </td>
            `;
            tbody.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading campaigns:', error);
    }
}

async function loadChart() {
    try {
        const chartContainer = document.getElementById('chartContainer');
        chartContainer.innerHTML = '';

        // Load data once
        if (!financialPerformanceData || financialPerformanceData.length === 0) {
            financialPerformanceData = await getMyFinancialPerformance();
        }

        if (!financialPerformanceData || financialPerformanceData.length === 0) {
            chartContainer.innerHTML = '<div style="text-align: center; color: var(--text-secondary); padding: 40px;">No data available</div>';
            return;
        }

        renderFinancialPerformancePage();

        // Wire arrows
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
        console.error('Error loading chart:', error);
        // Show empty chart message
        const chartContainer = document.getElementById('chartContainer');
        chartContainer.innerHTML = '<div style="text-align: center; color: var(--text-secondary); padding: 40px;">No data available</div>';
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

    const collectedData = pageItems.map(m => m.collectedAmount ?? m.CollectedAmount ?? 0);
    const donatedData = pageItems.map(m => m.donatedAmount ?? m.DonatedAmount ?? 0);
    const labels = pageItems.map(m => m.monthName ?? m.MonthName ?? `${m.month}/${m.year}`);

    const maxValue = Math.max(...collectedData, ...donatedData, 1);

    labels.forEach((label, index) => {
        const barGroup = document.createElement('div');
        barGroup.style.display = 'flex';
        barGroup.style.flexDirection = 'column';
        barGroup.style.alignItems = 'center';
        barGroup.style.gap = '4px';
        barGroup.style.flex = '1';

        const collectedHeight = maxValue > 0 ? (collectedData[index] / maxValue) * 100 : 0;
        const donatedHeight = maxValue > 0 ? (donatedData[index] / maxValue) * 100 : 0;

        barGroup.innerHTML = `
            <div style="display: flex; gap: 2px; width: 100%; align-items: end; justify-content: center;">
                <div style="width: 50%; height: ${Math.max(collectedHeight, 4)}px; min-height: 4px; background: var(--primary-color); border-radius: 4px 4px 0 0;" title="Collected: ${formatCurrency(collectedData[index])}"></div>
                <div style="width: 50%; height: ${Math.max(donatedHeight, 4)}px; min-height: 4px; border: 2px dashed var(--accent-color); background: transparent; border-radius: 4px 4px 0 0;" title="Donated: ${formatCurrency(donatedData[index])}"></div>
            </div>
            <div style="font-size: 12px; color: var(--text-muted);">${label}</div>
        `;

        chartContainer.appendChild(barGroup);
    });
}

// Handle logout from user dropdown on dashboard
function handleLogout() {
    logout();
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

