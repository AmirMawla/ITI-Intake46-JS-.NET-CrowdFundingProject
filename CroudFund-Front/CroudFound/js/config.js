
const API_CONFIG = {
    BASE_URL: 'https://localhost:7221',
    ENDPOINTS: {
        // Authentication endpoints
        REGISTER: '/api/Auth/register',
        LOGIN: '/api/Auth',
        CREATE_TEST_PAYMENT_METHOD: '/api/Auth/create-test-payment-method',
        
        // Users endpoints
        USERS_ALL: '/api/Users/all',
        USERS_ACTIVE: '/api/Users/active',
        USER_ME: '/api/Users/me',
        USER_BY_ID: (id) => `/api/Users/${id}`,
        UPDATE_PROFILE: '/api/Users/profile',
        UPDATE_USER_ACTIVITY: (id) => `/api/Users/${id}/changeactivity`,
        DELETE_USER: (id) => `/api/Users/${id}`,
        CHANGE_PASSWORD: '/api/users/change-password',
        
        // Categories endpoints
        CATEGORIES: '/api/Categories',
        CATEGORY_BY_ID: (id) => `/api/Categories/${id}`,
        CREATE_CATEGORY: '/api/Categories',
        UPDATE_CATEGORY: (id) => `/api/Categories/${id}`,
        DELETE_CATEGORY: (id) => `/api/Categories/${id}`,
        
        // Campaigns endpoints
        CAMPAIGNS_ALL: '/api/Campaigns',
        CAMPAIGNS_APPROVED: '/api/Campaigns/Approved',
        CAMPAIGNS_PENDING: '/api/Campaigns/pending',
        CAMPAIGNS_FEATURED: '/api/Campaigns/featured',
        CAMPAIGNS_BY_CATEGORY: (categoryId) => `/api/Campaigns/category/${categoryId}`,
        CAMPAIGNS_BY_USER: (userId) => `/api/Campaigns/user/${userId}`,
        CAMPAIGNS_MY: '/api/Campaigns/my',
        CAMPAIGN_BY_ID: (id) => `/api/Campaigns/${id}`,
        CREATE_CAMPAIGN: '/api/Campaigns',
        UPDATE_CAMPAIGN: (id) => `/api/Campaigns/${id}`,
        DELETE_CAMPAIGN: (id) => `/api/Campaigns/${id}`,
        CHANGE_CAMPAIGN_APPROVAL: (id) => `/api/Campaigns/${id}/approval`,
        
        // Reviews endpoints
        REVIEWS_ALL: '/api/Reviews',
        REVIEWS_BY_CAMPAIGN: (campaignId) => `/api/Reviews/Campaign/${campaignId}`,
        REVIEWS_BY_USER: (userId) => `/api/Reviews/User/${userId}`,
        REVIEWS_MY: '/api/Reviews/my',
        REVIEWS_MY_CAMPAIGNS: '/api/Reviews/my/campaigns',
        CREATE_REVIEW: (campaignId) => `/api/Reviews/Campaign/${campaignId}`,
        UPDATE_REVIEW: (id) => `/api/Reviews/${id}`,
        DELETE_REVIEW: (id) => `/api/Reviews/${id}`,
        
        // Pledges endpoints
        PLEDGES_ALL: '/api/Pledges',
        PLEDGE_BY_ID: (id) => `/api/Pledges/${id}`,
        PLEDGES_MY_DONATIONS: '/api/Pledges/my/donations',
        PLEDGES_MY_COLLECTIONS: '/api/Pledges/my/collections',
        PLEDGES_MY_SUMMARY: '/api/Pledges/my/summary',
        PLEDGES_MY_DASHBOARD: '/api/Pledges/my/dashboard',
        PLEDGES_MY_FINANCIAL_PERFORMANCE: '/api/Pledges/my/financial-performance',
        PLEDGES_BY_CAMPAIGN: (campaignId) => `/api/Pledges/campaign/${campaignId}`,
        PLEDGES_BY_USER: (userId) => `/api/Pledges/user/${userId}`,
        PLEDGES_USER_SUMMARY: (userId) => `/api/Pledges/user/${userId}/summary`,
        CREATE_PLEDGE: (campaignId) => `/api/Pledges/Campaign/${campaignId}`,
        
        // Analytics endpoints (Admin only)
        ANALYTICS_STATISTICS: '/api/Pledges/analytics/statistics',
        ANALYTICS_TOP_DONORS: '/api/Pledges/analytics/top-donors',
        ANALYTICS_TOP_CAMPAIGNS: '/api/Pledges/analytics/top-campaigns',
        ANALYTICS_CAMPAIGN_SUMMARIES: '/api/Pledges/analytics/campaign-summaries',
        ANALYTICS_DASHBOARD: '/api/Pledges/analytics/dashboard',
        
        // Search endpoints
        GLOBAL_SEARCH: '/api/Search'
    }
};

// Storage keys
const STORAGE_KEYS = {
    AUTH_TOKEN: 'crowdfund_auth_token',
    USER_DATA: 'crowdfund_user_data'
};

