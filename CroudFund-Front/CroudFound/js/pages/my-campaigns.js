// My Campaigns page functionality

document.addEventListener('DOMContentLoaded', async () => {
    if (!requireAuth()) return;
    
    await loadUserData();
    await loadCampaigns();
});

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

async function loadCampaigns() {
    try {
        const user = getCurrentUser();
        if (!user) return;
        
        const campaignsResponse = await getMyCampaigns({ PageSize: 100 });
        
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
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 40px; color: var(--text-secondary);">No campaigns found. <a href="create-campaign.html" style="color: var(--primary-color);">Create your first campaign</a></td></tr>';
            return;
        }
        
        campaigns.forEach(campaign => {
            const raised = campaign.TotalAmountPaid || campaign.totalAmountPaid || 0;
            const goalAmount = campaign.GoalAmount || campaign.goalAmount || 1;
            const percentage = Math.min(calculatePercentage(raised, goalAmount), 100);
            const campaignId = campaign.Id || campaign.id;
            const title = campaign.Title || campaign.title;
            const imagePath = campaign.Image || campaign.image;
            const isApproved = campaign.IsApproved !== undefined ? campaign.IsApproved : campaign.isApproved;
            const totalDonors = campaign.TotalDonorsCount || campaign.totalDonorsCount || 0;
            
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
            const campaignImage = image || `https://via.placeholder.com/40x40/141b2d/ffffff?text=${encodeURIComponent(title.charAt(0))}`;
            
            // Create actions cell with dropdown
            const actionsCell = document.createElement('td');
            actionsCell.style.cssText = 'position: relative; overflow: visible;';
            actionsCell.innerHTML = `
                <div style="display: flex; align-items: center; gap: 8px; position: relative;">
                    <a href="campaign-detail.html?id=${campaignId}" style="color: var(--primary-color);" title="View Campaign"><i class="fas fa-eye"></i></a>
                    <div class="campaign-actions-dropdown" style="position: relative;">
                        <button class="campaign-actions-btn" data-campaign-id="${campaignId}" style="background: none; border: none; color: var(--text-secondary); cursor: pointer; font-size: 20px; padding: 4px 8px; z-index: 1;" title="More Actions"><i class="fas fa-ellipsis-v"></i></button>
                        <div class="campaign-actions-menu" id="menu-${campaignId}" style="display: none; position: absolute; right: 0; top: calc(100% + 4px); background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 8px; padding: 8px 0; min-width: 150px; z-index: 10000; box-shadow: 0 4px 12px rgba(0,0,0,0.3);">
                            <button class="campaign-action-item" onclick="window.handleUpdateCampaign(${campaignId})" style="width: 100%; text-align: left; padding: 8px 16px; background: none; border: none; color: var(--text-primary); cursor: pointer; display: flex; align-items: center; gap: 8px; transition: background 0.2s;" onmouseover="this.style.background='var(--bg-card-hover)'" onmouseout="this.style.background='none'">
                                <i class="fas fa-edit"></i> Update
                            </button>
                            <button class="campaign-action-item" onclick="window.handleDeleteCampaign(${campaignId})" style="width: 100%; text-align: left; padding: 8px 16px; background: none; border: none; color: #ff4444; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: background 0.2s;" onmouseover="this.style.background='rgba(255, 68, 68, 0.1)'" onmouseout="this.style.background='none'">
                                <i class="fas fa-trash"></i> Delete
                            </button>
                        </div>
                    </div>
                </div>
            `;
            
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
                        <span style="font-size: 12px; color: var(--text-muted);">${percentage.toFixed(1)}%</span>
                    </div>
                </td>
                <td style="font-weight: 600;">${formatCurrency(raised)}</td>
                <td>${totalDonors}</td>
            `;
            row.appendChild(actionsCell);
            tbody.appendChild(row);
            
            // Add click handler for dropdown toggle
            const actionBtn = row.querySelector('.campaign-actions-btn');
            const actionMenu = row.querySelector('.campaign-actions-menu');
            actionBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                // Close all other menus
                document.querySelectorAll('.campaign-actions-menu').forEach(menu => {
                    if (menu !== actionMenu) menu.style.display = 'none';
                });
                // Toggle current menu
                actionMenu.style.display = actionMenu.style.display === 'none' ? 'block' : 'none';
            });
        });
    } catch (error) {
        console.error('Error loading campaigns:', error);
        handleError(error, 'Unable to load campaigns. Please refresh the page.');
        document.getElementById('campaignsTableBody').innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 40px; color: var(--text-secondary);">Error loading campaigns</td></tr>';
    }
}

// Close dropdowns when clicking outside
document.addEventListener('click', (e) => {
    if (!e.target.closest('.campaign-actions-dropdown')) {
        document.querySelectorAll('.campaign-actions-menu').forEach(menu => {
            menu.style.display = 'none';
        });
    }
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

// Handle update campaign
async function handleUpdateCampaign(campaignId) {
    // Close dropdown
    document.querySelectorAll('.campaign-actions-menu').forEach(menu => {
        menu.style.display = 'none';
    });
    
    // Redirect to create-campaign page with edit mode
    window.location.href = `create-campaign.html?edit=${campaignId}`;
}

// Make functions globally accessible for onclick handlers
window.handleUpdateCampaign = handleUpdateCampaign;
window.handleDeleteCampaign = handleDeleteCampaign;

// Handle delete campaign
async function handleDeleteCampaign(campaignId) {
    // Close dropdown
    document.querySelectorAll('.campaign-actions-menu').forEach(menu => {
        menu.style.display = 'none';
    });
    
    try {
        // Fetch full campaign details for the modal
        const campaign = await getCampaignById(campaignId);
        
        // Show beautiful deletion modal with campaign details
        showDeleteCampaignModal(campaign, campaignId);
    } catch (error) {
        console.error('Error fetching campaign details:', error);
        // Fallback to simple confirm if fetch fails
        if (confirm(`Are you sure you want to delete this campaign? This action cannot be undone.`)) {
            if (typeof window.performDeleteCampaign === 'function') {
                await window.performDeleteCampaign(campaignId);
            } else {
                // If performDeleteCampaign is not yet defined, define it inline
                try {
                    closeDeleteModal();
                    await deleteCampaign(campaignId);
                    showNotification('Campaign deleted successfully', 'success');
                    await loadCampaigns();
                } catch (deleteError) {
                    console.error('Error deleting campaign:', deleteError);
                    handleError(deleteError, 'Unable to delete campaign. Please try again.');
                }
            }
        }
    }
}

function showDeleteCampaignModal(campaign, campaignId) {
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
    
    // Hide sidebar when modal is open
    const sidebar = document.querySelector('.sidebar');
    const dashboard = document.querySelector('.dashboard');
    if (sidebar) sidebar.style.display = 'none';
    if (dashboard) dashboard.style.gridTemplateColumns = '1fr';
    
    // Create modal overlay
    const modalOverlay = document.createElement('div');
    modalOverlay.id = 'deleteCampaignModal';
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
                    <h2 style="font-size: 24px; font-weight: 700; margin: 0 0 4px 0;">Delete Campaign</h2>
                    <p style="color: var(--text-secondary); margin: 0; font-size: 14px;">This action cannot be undone</p>
                </div>
                <button onclick="closeDeleteModal()" style="
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
                    Are you sure you want to delete this campaign? All associated data will be permanently removed.
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
                " class="delete-modal-content">
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
                                <div style="font-weight: 600; color: ${campaign.IsApproved ? 'var(--success-color)' : 'var(--warning-color)'}; font-size: 14px;">
                                    ${campaign.IsApproved ? 'Active' : 'Pending'}
                                </div>
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
                <button onclick="closeDeleteModal()" style="
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
                <button onclick="performDeleteCampaign(${campaignId})" style="
                    padding: 12px 24px;
                    background: #ff4444;
                    border: none;
                    border-radius: 8px;
                    color: white;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                " onmouseover="this.style.background='#cc3333'" onmouseout="this.style.background='#ff4444'">
                    <i class="fas fa-trash"></i> Delete Campaign
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modalOverlay);
    
    // Close on overlay click
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) {
            closeDeleteModal();
        }
    });
}

function closeDeleteModal() {
    const modal = document.getElementById('deleteCampaignModal');
    if (modal) {
        modal.remove();
    }
    
    // Restore sidebar when modal is closed
    const sidebar = document.querySelector('.sidebar');
    const dashboard = document.querySelector('.dashboard');
    if (sidebar) sidebar.style.display = '';
    if (dashboard) dashboard.style.gridTemplateColumns = '';
}

// Make functions globally accessible for onclick handlers
window.closeDeleteModal = closeDeleteModal;
window.performDeleteCampaign = async function(campaignId) {
    try {
        closeDeleteModal();
        await deleteCampaign(campaignId);
        showNotification('Campaign deleted successfully', 'success');
        // Reload campaigns
        await loadCampaigns();
    } catch (error) {
        console.error('Error deleting campaign:', error);
        handleError(error, 'Unable to delete campaign. Please try again.');
    }
};

