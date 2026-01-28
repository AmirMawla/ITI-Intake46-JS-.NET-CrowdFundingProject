// Search bar utility functions - shared across all pages

// Expand search bar
function expandSearch() {
    const searchBar = document.getElementById('searchBar') || document.querySelector('.search-bar');
    if (searchBar) {
        searchBar.classList.add('expanded');
        const input = searchBar.querySelector('input');
        if (input) {
            setTimeout(() => input.focus(), 100);
        }
    }
}

// Collapse search bar if empty
function collapseSearch() {
    const searchBar = document.getElementById('searchBar') || document.querySelector('.search-bar');
    if (searchBar) {
        const input = searchBar.querySelector('input');
        if (input && !input.value.trim()) {
            setTimeout(() => {
                searchBar.classList.remove('expanded');
            }, 200);
        }
    }
}

// Global search handler
async function handleGlobalSearch(searchTerm) {
    if (!searchTerm || searchTerm.trim().length < 2) {
        return;
    }
    
    try {
        const results = await globalSearch(searchTerm.trim());
        
        // Group results by type
        const campaigns = results.filter(r => r.Type === 'Campaign' || r.CampaignId);
        const categories = results.filter(r => r.Type === 'Category' || r.CategoryId);
        const users = results.filter(r => r.Type === 'User' || r.UserId);
        
        // Redirect to campaigns page with search if on home page
        if (window.location.pathname.includes('index.html') || window.location.pathname === '/' || window.location.pathname.endsWith('/')) {
            redirectTo(`pages/campaigns.html?search=${encodeURIComponent(searchTerm)}`);
        } else if (window.location.pathname.includes('campaigns.html')) {
            // If already on campaigns page, trigger search
            const searchInput = document.getElementById('campaignSearch');
            if (searchInput) {
                searchInput.value = searchTerm;
                // Trigger input event to load campaigns
                searchInput.dispatchEvent(new Event('input'));
            }
        }
    } catch (error) {
        // Only show error for actual errors, not for empty results
        const isNetworkError = error.message && (
            error.message.includes('Failed to fetch') || 
            error.message.includes('NetworkError') ||
            error.message.includes('Cannot connect')
        );
        
        if (isNetworkError) {
            console.error('Error performing global search:', error);
            showNotification('Error performing search. Please try again.', 'error');
        } else {
            // For empty results or other non-critical errors, just log and continue
            console.log('Search returned no results or non-critical error:', error);
        }
    }
}

// Initialize search bars on page load
document.addEventListener('DOMContentLoaded', () => {
    const searchBars = document.querySelectorAll('.search-bar');
    searchBars.forEach(bar => {
        const input = bar.querySelector('input');
        if (input) {
            input.addEventListener('focus', expandSearch);
            input.addEventListener('blur', collapseSearch);
            
            // Handle Enter key for global search
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    handleGlobalSearch(input.value);
                }
            });
            
            // Handle search icon click
            const searchIcon = bar.querySelector('i.fa-search');
            if (searchIcon) {
                searchIcon.addEventListener('click', () => {
                    handleGlobalSearch(input.value);
                });
            }
            
            bar.addEventListener('click', (e) => {
                if (e.target === bar || e.target.tagName === 'I') {
                    expandSearch();
                }
            });
        }
    });
});

