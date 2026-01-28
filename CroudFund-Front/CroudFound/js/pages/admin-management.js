
let currentFilters = {
    PageNumer: 1,
    PageSize: 50,
    SearchValue: '',
    SortColumn: '',
    SortDirection: 'asc',
    DateFilter: null,
    Status: null,
    PaymentMethods: [],
    Statuses: []
};

function initializeFiltersUI(pageType) {
    const searchInput = document.getElementById('searchInput');
    const sortColumn = document.getElementById('sortColumn');
    const sortDirection = document.getElementById('sortDirection');
    const statusFilter = document.getElementById('statusFilter');
    const dateFilter = document.getElementById('dateFilter');
    
    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                currentFilters.SearchValue = e.target.value || '';
                currentFilters.PageNumer = 1;
                loadPageData(pageType);
            }, 500);
        });
    }
    
    if (sortColumn) {
        sortColumn.addEventListener('change', (e) => {
            currentFilters.SortColumn = e.target.value || '';
            currentFilters.PageNumer = 1;
            loadPageData(pageType);
        });
    }
    
    if (sortDirection) {
        sortDirection.addEventListener('change', (e) => {
            currentFilters.SortDirection = e.target.value || 'asc';
            currentFilters.PageNumer = 1;
            loadPageData(pageType);
        });
    }
    
    if (statusFilter) {
        statusFilter.addEventListener('change', (e) => {
            const value = e.target.value;
            if (pageType === 'pledges') {
                if (value === '') {
                    currentFilters.Statuses = [];
                } else {
                currentFilters.Statuses = [value];
            }
            currentFilters.Status = null;
        } else {
            currentFilters.Status = value === '' ? null : (value === 'true');
        }
        currentFilters.PageNumer = 1;
        loadPageData(pageType);
        });
    }
    
    if (dateFilter) {
        dateFilter.addEventListener('change', (e) => {
            currentFilters.DateFilter = e.target.value || null;
            currentFilters.PageNumer = 1;
            loadPageData(pageType);
        });
    }
}

async function loadPageData(pageType) {
    const filters = {};
    Object.keys(currentFilters).forEach(key => {
        const value = currentFilters[key];
        if (value !== null && value !== '' && value !== undefined) {
            if (Array.isArray(value)) {
                if (value.length > 0) {
                    filters[key] = value;
                }
            } else {
                filters[key] = value;
            }
        }
    });
    
    filters.PageNumer = currentFilters.PageNumer || 1;
    filters.PageSize = currentFilters.PageSize || 50;
    
    try {
        switch(pageType) {
            case 'users':
                await loadAllUsersWithFilters(filters);
                break;
            case 'campaigns':
                await loadAllCampaignsWithFilters(filters);
                break;
            case 'pledges':
                await loadAllPledgesWithFilters(filters);
                break;
            case 'messages':
                await loadAllReviewsWithFilters(filters);
                break;
            case 'categories':
                await loadAllCategories();
                break;
        }
    } catch (error) {
        console.error(`Error loading ${pageType}:`, error);
        showNotification(`Error loading ${pageType}`, 'error');
    }
}

async function loadAllUsersWithFilters(filters = {}) {
    try {
        console.log('Loading users with filters:', filters);
        const usersResponse = await getUsers(filters);
        console.log('Users response:', usersResponse);
        
        let users = [];
        if (Array.isArray(usersResponse)) {
            users = usersResponse;
        } else if (usersResponse && typeof usersResponse === 'object') {
            users = usersResponse.Items || usersResponse.items || [];
        }
        
        console.log('Parsed users:', users.length);
        
        const tbody = document.getElementById('usersTableBody');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        if (!users || users.length === 0) {
            tbody.innerHTML = '<tr><td colspan="3" style="text-align: center; color: var(--text-secondary); padding: 24px;">No users found</td></tr>';
            return;
        }
        
        users.forEach((user) => {
            const userId = user.Id || user.id;
            const fullName = user.FullName || user.fullName || 'Unknown';
            const email = user.Email || user.email || '';
            const profileImagePath = user.ProfileImage || user.profileImage;
            const isActive = user.IsActive !== undefined ? user.IsActive : (user.isActive !== undefined ? user.isActive : true);
            const totalDonated = user.HowMuchHeDonate || user.howMuchHeDonate || 0;
            
            const profileImage = profileImagePath ? buildImageUrl(profileImagePath) : null;
            const userAvatar = profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=007cff&color=fff&size=40`;
            const initial = fullName.charAt(0).toUpperCase();
            
            const row = document.createElement('tr');
            row.className = 'admin-table-row';
            row.innerHTML = `
                <td>
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <div style="position: relative;">
                            <img src="${userAvatar}" alt="${fullName}" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover; flex-shrink: 0; border: 2px solid var(--border-color);" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                            <div class="user-profile" style="width: 40px; height: 40px; display: none; border-radius: 50%; background: linear-gradient(135deg, var(--primary-color), var(--accent-color)); color: white; align-items: center; justify-content: center; font-weight: 600; font-size: 16px; border: 2px solid var(--border-color);">
                                ${initial}
                            </div>
                        </div>
                        <div style="min-width: 0;">
                            <div style="font-weight: 600; font-size: 14px; color: var(--text-primary); margin-bottom: 2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 250px;" title="${fullName}">${fullName}</div>
                            <div style="font-size: 12px; color: var(--text-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 250px;" title="${email}">${email}</div>
                        </div>
                    </div>
                </td>
                <td>
                    <div style="display: flex; flex-direction: column; gap: 8px;">
                        <span class="status-badge-improved ${isActive ? 'status-active-improved' : 'status-draft-improved'}">
                            <i class="fas fa-${isActive ? 'check-circle' : 'pause-circle'}" style="margin-right: 4px;"></i>
                            ${isActive ? 'ACTIVE' : 'SUSPENDED'}
                        </span>
                        <div style="font-size: 12px; color: var(--text-secondary);">
                            <i class="fas fa-dollar-sign" style="margin-right: 4px; color: var(--success-color);"></i>
                            Donated: <span style="font-weight: 600; color: var(--success-color);">${formatCurrency(totalDonated)}</span>
                        </div>
                    </div>
                </td>
                <td>
                    <div style="display: flex; gap: 8px; align-items: center;">
                        <label style="position: relative; display: inline-block; width: 48px; height: 26px; cursor: pointer;">
                            <input type="checkbox" ${isActive ? 'checked' : ''} onchange="toggleUserStatus('${userId}', this.checked)" style="opacity: 0; width: 0; height: 0;">
                            <span style="position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: ${isActive ? 'var(--success-color)' : 'var(--text-muted)'}; border-radius: 26px; transition: all 0.3s ease; box-shadow: inset 0 2px 4px rgba(0,0,0,0.2);">
                                <span style="position: absolute; height: 20px; width: 20px; left: 3px; bottom: 3px; background-color: white; border-radius: 50%; transition: all 0.3s ease; transform: ${isActive ? 'translateX(22px)' : 'translateX(0)'}; box-shadow: 0 2px 4px rgba(0,0,0,0.2);"></span>
                            </span>
                        </label>
                        <button class="btn-action-delete" onclick="deleteUserById('${userId}')" title="Delete User">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });
        
        updatePagination('users', usersResponse);
    } catch (error) {
        console.error('Error loading users:', error);
        const tbody = document.getElementById('usersTableBody');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="3" style="text-align: center; color: var(--error-color); padding: 24px;">Error loading users</td></tr>';
        }
    }
}

async function loadAllCampaignsWithFilters(filters = {}) {
    try {
        console.log('Loading campaigns with filters:', filters);
        const campaignsResponse = await getAllCampaigns(filters);
        console.log('Campaigns response:', campaignsResponse);
        
        let campaigns = [];
        if (Array.isArray(campaignsResponse)) {
            campaigns = campaignsResponse;
        } else if (campaignsResponse && typeof campaignsResponse === 'object') {
            campaigns = campaignsResponse.Items || campaignsResponse.items || [];
        }
        
        console.log('Parsed campaigns:', campaigns.length);
        
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
            
            const row = document.createElement('tr');
            row.className = 'admin-table-row';
            row.innerHTML = `
                <td>
                    <div style="font-weight: 600; font-size: 14px; color: var(--text-primary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 300px;" title="${title}">${title}</div>
                </td>
                <td>
                    <div style="font-size: 13px; color: var(--text-secondary); display: flex; align-items: center; gap: 6px;">
                        <i class="fas fa-user" style="color: var(--text-muted); font-size: 11px;"></i>
                        ${userName}
                    </div>
                </td>
                <td>
                    <div style="font-weight: 600; font-size: 14px; color: var(--primary-color);">
                        <i class="fas fa-bullseye" style="margin-right: 4px; font-size: 11px;"></i>
                        ${formatCurrency(goalAmount)}
                    </div>
                </td>
                <td>
                    <span class="status-badge-improved ${isApproved ? 'status-active-improved' : 'status-pending-improved'}">
                        <i class="fas fa-${isApproved ? 'check-circle' : 'clock'}" style="margin-right: 4px;"></i>
                        ${isApproved ? 'APPROVED' : 'PENDING'}
                    </span>
                </td>
                <td>
                    <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
                        ${isApproved
                            ? `<button class="btn-action-view" onclick="approveCampaignById(${campaignId}, false)" title="Disapprove Campaign">
                                   <i class="fas fa-ban"></i> Disapprove
                               </button>`
                            : `<button class="btn-action-approve" onclick="approveCampaignById(${campaignId}, true)" title="Approve Campaign">
                                   <i class="fas fa-check"></i> Approve
                               </button>`}
                        <button class="btn-action-delete" onclick="rejectCampaign(${campaignId})" title="Delete Campaign">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });
        
        updatePagination('campaigns', campaignsResponse);
    } catch (error) {
        console.error('Error loading campaigns:', error);
        const tbody = document.getElementById('allCampaignsBody');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--error-color); padding: 24px;">Error loading campaigns</td></tr>';
        }
    }
}

// Load pledges with filters
async function loadAllPledgesWithFilters(filters = {}) {
    try {
        console.log('Loading pledges with filters:', filters);
        const pledgesResponse = await getAllPledges(filters);
        console.log('Pledges response:', pledgesResponse);
        
        let pledges = [];
        if (Array.isArray(pledgesResponse)) {
            pledges = pledgesResponse;
        } else if (pledgesResponse && typeof pledgesResponse === 'object') {
            pledges = pledgesResponse.Items || pledgesResponse.items || [];
        }
        
        console.log('Parsed pledges:', pledges.length);
        
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
            
            const date = transactionDate ? new Date(transactionDate).toLocaleDateString() : 'Unknown';
            const statusClass = status === 'Success' ? 'status-active-improved' : status === 'Failed' ? 'status-draft-improved' : 'status-pending-improved';
            const statusIcon = status === 'Success' ? 'check-circle' : status === 'Failed' ? 'times-circle' : 'clock';
            const statusText = status === 'Success' ? 'SUCCESS' : status === 'Failed' ? 'FAILED' : 'PENDING';
            
            const row = document.createElement('tr');
            row.className = 'admin-table-row';
            row.innerHTML = `
                <td>
                    <div style="font-weight: 600; font-size: 14px; color: var(--text-primary);">
                        ${donorName}
                    </div>
                </td>
                <td>
                    <div style="font-weight: 700; font-size: 15px; color: var(--success-color); display: flex; align-items: center; gap: 6px;">
                        ${formatCurrency(amount)}
                    </div>
                </td>
                <td>
                    <div style="font-weight: 600; font-size: 13px; color: var(--text-primary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 200px;" title="${campaignTitle}">
                        <i class="fas fa-bullhorn" style="margin-right: 6px; color: var(--primary-color); font-size: 11px;"></i>
                        ${campaignTitle}
                    </div>
                </td>
                <td>
                    <div style="font-size: 13px; color: var(--text-secondary); display: flex; align-items: center; gap: 6px;">
                        <i class="fas fa-user-tie" style="color: var(--text-muted); font-size: 11px;"></i>
                        ${campaignCreator}
                    </div>
                </td>
                <td>
                    <div style="font-size: 13px; color: var(--text-secondary); display: flex; align-items: center; gap: 6px;">
                        <i class="fas fa-calendar" style="color: var(--text-muted); font-size: 11px;"></i>
                        ${date}
                    </div>
                </td>
                <td>
                    <span class="status-badge-improved ${statusClass}">
                        <i class="fas fa-${statusIcon}" style="margin-right: 4px;"></i>
                        ${statusText}
                    </span>
                </td>
            `;
            tbody.appendChild(row);
        });
        
        updatePagination('pledges', pledgesResponse);
    } catch (error) {
        console.error('Error loading pledges:', error);
        const tbody = document.getElementById('allPledgesBody');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--error-color); padding: 24px;">Error loading pledges</td></tr>';
        }
    }
}

async function loadAllReviewsWithFilters(filters = {}) {
    try {
        console.log('Loading reviews with filters:', filters);
        const reviewsResponse = await getAllReviews(filters);
        console.log('Reviews response:', reviewsResponse);
        
        let reviews = [];
        if (Array.isArray(reviewsResponse)) {
            reviews = reviewsResponse;
        } else if (reviewsResponse && typeof reviewsResponse === 'object') {
            reviews = reviewsResponse.Items || reviewsResponse.items || [];
        }
        
        console.log('Parsed reviews:', reviews.length);
        
        const tbody = document.getElementById('allReviewsBody');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        if (!reviews || reviews.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--text-secondary); padding: 24px;">No reviews found</td></tr>';
            return;
        }

        window.__adminCache = window.__adminCache || {};
        window.__adminCache.reviews = reviews;
        
        reviews.forEach((review) => {
            const reviewId = review.Id || review.id;
            const comment = review.Comment || review.comment || 'No comment';
            const createdAt = review.CreatedAt || review.createdAt;
            const userName = review.UserName || review.userName || 'Unknown';
            const campaignTitle = review.CampaignTitle || review.campaignTitle || 'Unknown Campaign';
            const reaction = review.Reaction || review.reaction;
            
            const date = createdAt ? new Date(createdAt).toLocaleDateString() : 'Unknown';
            const reactionIcon = reaction === 1 ? '👍' : reaction === 2 ? '❤️' : reaction === 3 ? '💪' : '';
            const displayComment = comment.length > 80 ? comment.substring(0, 77) + '...' : comment;
            
            const row = document.createElement('tr');
            row.className = 'admin-table-row';
            row.innerHTML = `
                <td>
                    <div style="font-weight: 600; font-size: 14px; color: var(--text-primary); display: flex; align-items: center; gap: 6px;">
                        <i class="fas fa-user" style="color: var(--text-muted); font-size: 11px;"></i>
                        ${userName}
                    </div>
                </td>
                <td>
                    <div style="display: flex; align-items: flex-start; gap: 8px; max-width: 400px;">
                        ${reactionIcon ? `<span style="font-size: 18px; flex-shrink: 0;">${reactionIcon}</span>` : ''}
                        <span style="font-size: 13px; color: var(--text-primary); line-height: 1.5;" title="${comment}">${displayComment}</span>
                    </div>
                </td>
                <td>
                    <div style="font-size: 13px; color: var(--text-secondary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 200px;" title="${campaignTitle}">
                        <i class="fas fa-bullhorn" style="margin-right: 6px; color: var(--primary-color); font-size: 11px;"></i>
                        ${campaignTitle}
                    </div>
                </td>
                <td>
                    <div style="font-size: 13px; color: var(--text-secondary); display: flex; align-items: center; gap: 6px;">
                        <i class="fas fa-calendar" style="color: var(--text-muted); font-size: 11px;"></i>
                        ${date}
                    </div>
                </td>
                <td>
                    <button class="btn-action-delete" onclick="deleteReviewById(${reviewId})" title="Delete Review">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
        
        updatePagination('messages', reviewsResponse);
    } catch (error) {
        console.error('Error loading reviews:', error);
        const tbody = document.getElementById('allReviewsBody');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--error-color); padding: 24px;">Error loading reviews</td></tr>';
        }
    }
}

function updatePagination(pageType, response) {
    const paginationContainer = document.getElementById('paginationContainer');
    if (!paginationContainer) return;
    
    let pageNumber = currentFilters.PageNumer || 1;
    let totalPages = 1;
    
    if (response && typeof response === 'object' && !Array.isArray(response)) {
        pageNumber = response.PageNumber || response.PageNumer || response.pageNumber || pageNumber;
        totalPages = response.TotalPages || response.totalPages || totalPages;
    }
    
    paginationContainer.innerHTML = `
        <div style="display: flex; align-items: center; gap: 16px; justify-content: center;">
            <button onclick="changePage('${pageType}', ${pageNumber - 1})" ${pageNumber <= 1 ? 'disabled' : ''} style="padding: 10px 20px; background: ${pageNumber <= 1 ? 'var(--bg-darker)' : 'var(--bg-card)'}; border: 1px solid var(--border-color); border-radius: 8px; color: ${pageNumber <= 1 ? 'var(--text-muted)' : 'var(--text-primary)'}; cursor: ${pageNumber <= 1 ? 'not-allowed' : 'pointer'}; font-size: 14px; font-weight: 600; transition: all 0.2s; display: flex; align-items: center; gap: 8px;" ${pageNumber > 1 ? 'onmouseover="this.style.background=\'var(--bg-card-hover)\'; this.style.borderColor=\'var(--primary-color)\'" onmouseout="this.style.background=\'var(--bg-card)\'; this.style.borderColor=\'var(--border-color)\'"' : ''}>
                <i class="fas fa-chevron-left"></i> Previous
            </button>
            <div style="display: flex; align-items: center; gap: 8px;">
                <span style="color: var(--text-primary); font-weight: 600; font-size: 14px;">Page</span>
                <span style="color: var(--primary-color); font-weight: 700; font-size: 16px;">${pageNumber}</span>
                <span style="color: var(--text-secondary); font-size: 14px;">of</span>
                <span style="color: var(--text-primary); font-weight: 600; font-size: 14px;">${totalPages}</span>
            </div>
            <button onclick="changePage('${pageType}', ${pageNumber + 1})" ${pageNumber >= totalPages ? 'disabled' : ''} style="padding: 10px 20px; background: ${pageNumber >= totalPages ? 'var(--bg-darker)' : 'var(--bg-card)'}; border: 1px solid var(--border-color); border-radius: 8px; color: ${pageNumber >= totalPages ? 'var(--text-muted)' : 'var(--text-primary)'}; cursor: ${pageNumber >= totalPages ? 'not-allowed' : 'pointer'}; font-size: 14px; font-weight: 600; transition: all 0.2s; display: flex; align-items: center; gap: 8px;" ${pageNumber < totalPages ? 'onmouseover="this.style.background=\'var(--bg-card-hover)\'; this.style.borderColor=\'var(--primary-color)\'" onmouseout="this.style.background=\'var(--bg-card)\'; this.style.borderColor=\'var(--border-color)\'"' : ''}>
                Next <i class="fas fa-chevron-right"></i>
            </button>
        </div>
    `;
}

function changePage(pageType, newPage) {
    if (newPage < 1) return;
    currentFilters.PageNumer = newPage;
    loadPageData(pageType);
}

function resetFilters(pageType) {
    currentFilters = {
        PageNumer: 1,
        PageSize: 50,
        SearchValue: '',
        SortColumn: '',
        SortDirection: 'asc',
        DateFilter: null,
        Status: null,
        PaymentMethods: [],
        Statuses: []
    };
    
    const searchInput = document.getElementById('searchInput');
    const sortColumn = document.getElementById('sortColumn');
    const sortDirection = document.getElementById('sortDirection');
    const statusFilter = document.getElementById('statusFilter');
    const dateFilter = document.getElementById('dateFilter');
    
    if (searchInput) searchInput.value = '';
    if (sortColumn) sortColumn.value = '';
    if (sortDirection) sortDirection.value = 'asc';
    if (statusFilter) statusFilter.value = '';
    if (dateFilter) dateFilter.value = '';
    
    loadPageData(pageType);
}

window.loadAllUsersWithFilters = loadAllUsersWithFilters;
window.loadAllCampaignsWithFilters = loadAllCampaignsWithFilters;
window.loadAllPledgesWithFilters = loadAllPledgesWithFilters;
window.loadAllReviewsWithFilters = loadAllReviewsWithFilters;
window.loadPageData = loadPageData;
window.changePage = changePage;
window.initializeFiltersUI = initializeFiltersUI;
window.resetFilters = resetFilters;
