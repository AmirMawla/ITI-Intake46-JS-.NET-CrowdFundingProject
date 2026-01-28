
if (typeof API_CONFIG === 'undefined') {
    console.error('API_CONFIG is not defined. Make sure config.js is loaded before api.js');
    throw new Error('API_CONFIG is required. Please ensure config.js is loaded before api.js');
}

// Ensure STORAGE_KEYS is loaded (config.js should be loaded first)
if (typeof STORAGE_KEYS === 'undefined') {
    console.error('STORAGE_KEYS is not defined. Make sure config.js is loaded before api.js');
    throw new Error('STORAGE_KEYS is required. Please ensure config.js is loaded before api.js');
}

const API_BASE = API_CONFIG.BASE_URL;


async function apiCall(endpoint, options = {}) {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    
    // Debug: Log token status
    if (endpoint.includes('/me') || endpoint.includes('/Users/me')) {
        console.log('Token check for /me endpoint:', {
            hasToken: !!token,
            tokenLength: token ? token.length : 0,
            tokenPreview: token ? token.substring(0, 20) + '...' : 'none'
        });
    }
    
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
        }
    };
    
    const config = {
        ...defaultOptions,
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...options.headers
        }
    };
    
    // Add body to config if it exists
    if (options.body && !config.body) {
        config.body = options.body;
    }
    
    try {
        const url = `${API_BASE}${endpoint}`;
        console.log('API Call:', url, config.method || 'GET', token ? 'with auth' : 'without auth');
        
        // Debug: Log headers for /me endpoint
        if (endpoint.includes('/me') || endpoint.includes('/Users/me')) {
            console.log('Request headers:', {
                'Content-Type': config.headers['Content-Type'],
                'Authorization': config.headers['Authorization'] ? 'Bearer ***' : 'missing'
            });
        }
        
        const response = await fetch(url, config);
        
        if (!response.ok) {
            let errorMessage = `HTTP error! status: ${response.status}`;
            let errorData = null;
            let detailedMessage = '';
            
            try {
                errorData = await response.json();
                console.log('Error response data:', errorData);
                
                // Check for specific authentication errors first
                if (errorData.title && (
                    errorData.title.includes('InvalidCredentials') || 
                    errorData.title.includes('Invalid Email') ||
                    errorData.title.includes('Invalid Password') ||
                    errorData.title === 'user.InvalidCredentials'
                )) {
                    errorMessage = 'Invalid email or password. Please check your credentials and try again.';
                } else if (errorData.detail && (
                    errorData.detail.includes('Invalid Email/Password') ||
                    errorData.detail.includes('Invalid credentials') ||
                    errorData.detail.includes('Invalid email') ||
                    errorData.detail.includes('Invalid password')
                )) {
                    errorMessage = 'Invalid email or password. Please check your credentials and try again.';
                } else if (errorData.message && (
                    errorData.message.includes('Invalid Email/Password') ||
                    errorData.message.includes('Invalid credentials') ||
                    errorData.message.includes('Invalid email') ||
                    errorData.message.includes('Invalid password')
                )) {
                    errorMessage = 'Invalid email or password. Please check your credentials and try again.';
                }
                // Handle .NET ProblemDetails format - show all error details
                else if (errorData.errors && typeof errorData.errors === 'object') {
                    // If errors is an object with arrays (validation errors)
                    const errorMessages = [];
                    for (const key in errorData.errors) {
                        if (Array.isArray(errorData.errors[key])) {
                            errorMessages.push(...errorData.errors[key]);
                        } else {
                            errorMessages.push(errorData.errors[key]);
                        }
                    }
                    if (errorMessages.length > 0) {
                        detailedMessage = errorMessages.join('. ');
                        errorMessage = detailedMessage;
                    }
                } else if (Array.isArray(errorData.errors)) {
                    // If errors is directly an array
                    detailedMessage = errorData.errors.join('. ');
                    errorMessage = detailedMessage;
                } else if (errorData.title) {
                    errorMessage = errorData.title;
                    if (errorData.detail) {
                        detailedMessage = `${errorData.title}: ${errorData.detail}`;
                        errorMessage = detailedMessage;
                    }
                } else if (errorData.message) {
                    errorMessage = errorData.message;
                } else if (errorData.detail) {
                    errorMessage = errorData.detail;
                }
            } catch (e) {
                errorMessage = response.statusText || errorMessage;
            }
            
            // Special handling for 401 Unauthorized
            if (response.status === 401) {
                console.error('401 Unauthorized - Token may be invalid or expired:', {
                    endpoint,
                    hasToken: !!token,
                    tokenLength: token ? token.length : 0,
                    errorData: errorData
                });
                
                // Clear invalid token
                localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
                localStorage.removeItem(STORAGE_KEYS.USER_DATA);
                
                // If we're not already on login page, redirect
                if (!window.location.pathname.includes('login.html')) {
                    console.warn('Redirecting to login due to 401 error');
                    // Don't redirect automatically - let the calling code handle it
                }
            }
            
            // Store error data for special handling
            const error = new Error(detailedMessage || errorMessage);
            error.status = response.status;
            error.data = errorData;
            error.originalMessage = errorMessage;
            throw error;
        }
        
        // Handle 204 No Content
        if (response.status === 204) {
            return null;
        }
        
        // Handle empty responses
        const text = await response.text();
        if (!text) {
            return null;
        }
        
        try {
            return JSON.parse(text);
        } catch (e) {
            console.error('Failed to parse JSON:', text);
            return null;
        }
    } catch (error) {
        console.error('API Error:', error, 'Endpoint:', endpoint);
        
        // Handle abort errors (request canceled)
        if (error.name === 'AbortError') {
            console.warn('Request was aborted:', endpoint);
            throw new Error('Request was canceled or timed out');
        }
        
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
            console.warn('Network error - backend might not be running');
            throw new Error('Cannot connect to backend server. Please make sure the .NET backend is running on https://localhost:7221');
        }
        throw error;
    }
}

/**
 * Helper to build query string from filters object
 * Note: Backend uses PascalCase for property names (PageNumer, PageSize, etc.)
 * .NET model binding is case-insensitive, but we'll use exact names for clarity
 */
function buildQueryString(filters = {}) {
    const params = new URLSearchParams();
    Object.keys(filters).forEach(key => {
        const value = filters[key];
        if (value !== undefined && value !== null && value !== '') {
            if (Array.isArray(value)) {
                value.forEach(item => params.append(key, String(item)));
            } else {
                // Convert to string explicitly
                params.append(key, String(value));
            }
        }
    });
    const queryString = params.toString();
    console.log('Built query string:', queryString);
    return queryString;
}

// ==================== AUTHENTICATION API ====================

async function registerUser(userData) {
    const response = await apiCall(API_CONFIG.ENDPOINTS.REGISTER, {
        method: 'POST',
        body: JSON.stringify({
            FullName: userData.fullName,
            Email: userData.email,
            Password: userData.password
        })
    });
    return response;
}

async function loginUser(email, password) {
    const response = await apiCall(API_CONFIG.ENDPOINTS.LOGIN, {
        method: 'POST',
        body: JSON.stringify({
            Email: email,
            Password: password
        })
    });
    
    // Debug: Log response structure
    console.log('Login response:', {
        hasToken: !!(response.Token || response.token),
        hasId: !!(response.Id || response.id),
        hasEmail: !!(response.Email || response.email),
        responseKeys: Object.keys(response || {})
    });
    
    // Handle both PascalCase and camelCase from backend (check lowercase first as backend returns camelCase)
    const token = response.token || response.Token;
    const id = response.id || response.Id;
    const responseEmail = response.email || response.Email;
    const fullName = response.fullName || response.FullName;
    const expiresIn = response.expiresIn || response.ExpiresIn;
    const refreshToken = response.refreshToken || response.RefreshToken;
    const refreshTokenExpiration = response.refreshTokenExpiration || response.RefreshTokenExpiration;
    
    return {
        Token: token,
        token: token,
        accessToken: token,
        Id: id,
        id: id,
        Email: responseEmail,
        email: responseEmail,
        FullName: fullName,
        fullName: fullName,
        ExpiresIn: expiresIn,
        expiresIn: expiresIn,
        RefreshToken: refreshToken,
        refreshToken: refreshToken,
        RefreshTokenExpiration: refreshTokenExpiration,
        refreshTokenExpiration: refreshTokenExpiration
    };
}

async function createTestPaymentMethod(testToken) {
    return await apiCall(API_CONFIG.ENDPOINTS.CREATE_TEST_PAYMENT_METHOD, {
        method: 'POST',
        body: JSON.stringify({ TestToken: testToken })
    });
}

async function getCurrentUserInfo() {
    try {
        return await apiCall(API_CONFIG.ENDPOINTS.USER_ME);
    } catch (error) {
        console.error('Error getting user info:', error);
        return null;
    }
}

async function getUsers(filters = {}) {
    const query = buildQueryString(filters);
    const response = await apiCall(`${API_CONFIG.ENDPOINTS.USERS_ALL}${query ? '?' + query : ''}`);
    return response?.Items || response || [];
}

async function getActiveUsers(filters = {}) {
    const query = buildQueryString(filters);
    const response = await apiCall(`${API_CONFIG.ENDPOINTS.USERS_ACTIVE}${query ? '?' + query : ''}`);
    return response?.Items || response || [];
}

async function getMyDetails() {
    try {
        if (!isAuthenticated()) {
            console.warn('User is not authenticated, skipping getMyDetails call');
            return null;
        }
        
        return await apiCall(API_CONFIG.ENDPOINTS.USER_ME);
    } catch (error) {
        console.error('Error getting user details:', error);
        return null;
    }
}

async function getUserById(id) {
    return await apiCall(API_CONFIG.ENDPOINTS.USER_BY_ID(id));
}

async function updateProfile(updates) {
    if (updates.ProfilePictureUrl) {
        const formData = new FormData();
        if (updates.FullName) formData.append('FullName', updates.FullName);
        formData.append('ProfilePictureUrl', updates.ProfilePictureUrl);
        
        const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
        const response = await fetch(`${API_BASE}${API_CONFIG.ENDPOINTS.UPDATE_PROFILE}`, {
            method: 'PUT',
            headers: {
                ...(token && { 'Authorization': `Bearer ${token}` })
            },
            body: formData
        });
        
        if (!response.ok) throw new Error('Failed to update profile');
        return await response.json();
    } else {
        return await apiCall(API_CONFIG.ENDPOINTS.UPDATE_PROFILE, {
            method: 'PUT',
            body: JSON.stringify({ FullName: updates.FullName })
        });
    }
}

async function updateUserActivity(id) {
    return await apiCall(API_CONFIG.ENDPOINTS.UPDATE_USER_ACTIVITY(id), {
        method: 'PUT'
    });
}

async function deleteUser(id) {
    return await apiCall(API_CONFIG.ENDPOINTS.DELETE_USER(id), {
        method: 'DELETE'
    });
}

async function changePassword(currentPassword, newPassword) {
    return await apiCall(API_CONFIG.ENDPOINTS.CHANGE_PASSWORD, {
        method: 'PUT',
        body: JSON.stringify({
            CurrentPassword: currentPassword,
            NewPassword: newPassword
        })
    });
}

async function getCategories() {
    try {
        const response = await apiCall(API_CONFIG.ENDPOINTS.CATEGORIES);
        // Ensure we always return an array
        if (Array.isArray(response)) {
            return response;
        }
        // If response is not an array, try to extract it or return empty array
        console.warn('Categories response is not an array:', response);
        return [];
    } catch (error) {
        console.error('Error fetching categories:', error);
        return [];
    }
}

async function getCategoryById(id) {
    return await apiCall(API_CONFIG.ENDPOINTS.CATEGORY_BY_ID(id));
}

async function createCategory(name) {
    return await apiCall(API_CONFIG.ENDPOINTS.CREATE_CATEGORY, {
        method: 'POST',
        body: JSON.stringify({ Name: name })
    });
}

async function updateCategory(id, name) {
    return await apiCall(API_CONFIG.ENDPOINTS.UPDATE_CATEGORY(id), {
        method: 'PUT',
        body: JSON.stringify({ Name: name })
    });
}

async function deleteCategory(id) {
    return await apiCall(API_CONFIG.ENDPOINTS.DELETE_CATEGORY(id), {
        method: 'DELETE'
    });
}

// ==================== CAMPAIGNS API ====================


async function getAllCampaigns(filters = {}) {
    const query = buildQueryString(filters);
    const response = await apiCall(`${API_CONFIG.ENDPOINTS.CAMPAIGNS_ALL}${query ? '?' + query : ''}`);
    return response?.Items || response || [];
}


async function getPendingCampaigns(filters = {}) {
    const query = buildQueryString(filters);
    const response = await apiCall(`${API_CONFIG.ENDPOINTS.CAMPAIGNS_PENDING}${query ? '?' + query : ''}`);

    // Handle PaginatedList structure and direct arrays
    if (Array.isArray(response)) {
        return response;
    }
    if (response && typeof response === 'object') {
        if (Array.isArray(response.Items)) {
            return response.Items;
        }
        if (Array.isArray(response.items)) {
            return response.items;
        }
    }
    return [];
}


async function getApprovedCampaigns(filters = {}) {
    try {
    
        const cleanFilters = {
            PageNumer: filters.PageNumer || filters.PageNumber || 1,
            PageSize: filters.PageSize || 100
        };
        
        if (filters.SearchValue) cleanFilters.SearchValue = filters.SearchValue;
        if (filters.SortColumn) cleanFilters.SortColumn = filters.SortColumn;
        if (filters.SortDirection) cleanFilters.SortDirection = filters.SortDirection;
        if (filters.DateFilter) cleanFilters.DateFilter = filters.DateFilter;
        if (filters.Status !== undefined) cleanFilters.Status = filters.Status;
        
        const query = buildQueryString(cleanFilters);
        const url = `${API_CONFIG.ENDPOINTS.CAMPAIGNS_APPROVED}${query ? '?' + query : ''}`;
        console.log('Calling getApprovedCampaigns:', url);
        console.log('Filters object:', cleanFilters);
        
        const response = await apiCall(url);
        console.log('getApprovedCampaigns response type:', typeof response, 'Is Array:', Array.isArray(response));
        console.log('getApprovedCampaigns response:', JSON.stringify(response, null, 2));
        
        if (response && typeof response === 'object') {
            if (response.Items && Array.isArray(response.Items)) {
                console.log('Returning Items array from PaginatedList, count:', response.Items.length);
                return response.Items;
            }
            
            if (response.items && Array.isArray(response.items)) {
                console.log('Returning items array (lowercase), count:', response.items.length);
                return response.items;
            }
        }
        
        if (Array.isArray(response)) {
            console.log('Response is directly an array, count:', response.length);
            return response;
        }
        
        if (!response) {
            console.warn('getApprovedCampaigns returned null/undefined');
            return [];
        }
        
        console.warn('Unexpected response structure from getApprovedCampaigns:', response);
        console.warn('Response keys:', Object.keys(response || {}));
        return [];
    } catch (error) {
        console.error('Error in getApprovedCampaigns:', error);
        console.error('Error details:', {
            message: error.message,
            status: error.status,
            data: error.data
        });
        
        if (error.status === 404 || (error.message && (error.message.includes('No campaigns found') || error.message.includes('Not Found')))) {
            console.log('No campaigns found (404), returning empty array');
            return [];
        }
        throw error;
    }
}

async function getFeaturedCampaigns() {
    return await apiCall(API_CONFIG.ENDPOINTS.CAMPAIGNS_FEATURED);
}

async function getCampaignsByCategory(categoryId, filters = {}) {
    try {
        const categoryIdNum = parseInt(categoryId, 10);
        if (isNaN(categoryIdNum)) {
            throw new Error(`Invalid category ID: ${categoryId}`);
        }
        
        const cleanFilters = {
            PageNumer: filters.PageNumer || filters.PageNumber || 1,
            PageSize: filters.PageSize || 100
        };
        
        if (filters.SearchValue) cleanFilters.SearchValue = filters.SearchValue;
        if (filters.SortColumn) cleanFilters.SortColumn = filters.SortColumn;
        if (filters.SortDirection) cleanFilters.SortDirection = filters.SortDirection;
        if (filters.DateFilter) cleanFilters.DateFilter = filters.DateFilter;
        if (filters.Status !== undefined) cleanFilters.Status = filters.Status;
        
        const query = buildQueryString(cleanFilters);
        const endpointPath = `/api/Campaigns/category/${categoryIdNum}`;
        const url = `${endpointPath}${query ? '?' + query : ''}`;
        console.log('Calling getCampaignsByCategory - categoryId:', categoryId, 'categoryIdNum:', categoryIdNum);
        console.log('Calling getCampaignsByCategory - endpointPath:', endpointPath);
        console.log('Calling getCampaignsByCategory - full url:', url);
        console.log('Calling getCampaignsByCategory - Filters:', cleanFilters);
        
        const response = await apiCall(url);
        console.log('getCampaignsByCategory response type:', typeof response, 'Is Array:', Array.isArray(response));
        console.log('getCampaignsByCategory response:', JSON.stringify(response, null, 2));
        
        if (response && typeof response === 'object') {
            if (response.Items && Array.isArray(response.Items)) {
                console.log('Returning Items array from PaginatedList, count:', response.Items.length);
                return response.Items;
            }
            
            if (Array.isArray(response)) {
                console.log('Response is directly an array, count:', response.length);
                return response;
            }
            
            if (response.items && Array.isArray(response.items)) {
                console.log('Returning items array (lowercase), count:', response.items.length);
                return response.items;
            }
        }
        
        if (Array.isArray(response)) {
            console.log('Response is directly an array, count:', response.length);
            return response;
        }
        
        if (!response) {
            console.warn('getCampaignsByCategory returned null/undefined');
            return [];
        }
        
        console.warn('Unexpected response structure from getCampaignsByCategory:', response);
        console.warn('Response keys:', Object.keys(response || {}));
        return [];
    } catch (error) {
        console.error('Error in getCampaignsByCategory:', error);
        console.error('Error details:', {
            message: error.message,
            status: error.status,
            data: error.data
        });
        
        if (error.status === 404 || (error.message && (error.message.includes('No campaigns found') || error.message.includes('Not Found')))) {
            console.log('No campaigns found for category (404), returning empty array');
            return [];
        }
        throw error;
    }
}

async function getCampaignsByUser(userId, filters = {}) {
    const query = buildQueryString(filters);
    const response = await apiCall(`${API_CONFIG.ENDPOINTS.CAMPAIGNS_BY_USER(userId)}${query ? '?' + query : ''}`);
    return response?.Items || response || [];
}

async function getMyCampaigns(filters = {}) {
    const query = buildQueryString(filters);
    const response = await apiCall(`${API_CONFIG.ENDPOINTS.CAMPAIGNS_MY}${query ? '?' + query : ''}`);
    return response?.Items || response || [];
}

async function getCampaignById(id) {
    return await apiCall(API_CONFIG.ENDPOINTS.CAMPAIGN_BY_ID(id));
}

async function createCampaign(campaignData) {
    const imageFile = campaignData.Image || campaignData.image;
    
    const formData = new FormData();
    formData.append('Title', campaignData.title);
    formData.append('Description', campaignData.description);
    formData.append('GoalAmount', campaignData.goalAmount.toString());
    formData.append('Deadline', campaignData.deadline);
    formData.append('CategoryId', campaignData.categoryId.toString());
    
    if (imageFile && imageFile instanceof File) {
        formData.append('Image', imageFile);
    }
    
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    const response = await fetch(`${API_BASE}${API_CONFIG.ENDPOINTS.CREATE_CAMPAIGN}`, {
        method: 'POST',
        headers: {
            ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: formData
    });
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.errors?.[0] || error.title || error.detail || 'Failed to create campaign');
    }
    return await response.json();
}

async function updateCampaign(id, updates) {
    const imageFile = updates.Image || updates.image;
    
    const formData = new FormData();
    formData.append('Title', updates.title || '');
    formData.append('Description', updates.description || '');
    formData.append('GoalAmount', (updates.goalAmount !== undefined ? updates.goalAmount : 0).toString());
    formData.append('Deadline', updates.deadline || '');
    formData.append('CategoryId', (updates.categoryId !== undefined ? updates.categoryId : 0).toString());
    
    if (imageFile && imageFile instanceof File) {
        formData.append('Image', imageFile);
    }
    
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    const response = await fetch(`${API_BASE}${API_CONFIG.ENDPOINTS.UPDATE_CAMPAIGN(id)}`, {
        method: 'PUT',
        headers: {
            ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: formData
    });
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.errors?.[0] || error.title || error.detail || 'Failed to update campaign');
    }
    return await response.json();
}

async function deleteCampaign(id) {
    return await apiCall(API_CONFIG.ENDPOINTS.DELETE_CAMPAIGN(id), {
        method: 'DELETE'
    });
}

async function approveCampaign(id, isApproved) {
    const query = (isApproved === true || isApproved === false) ? `?isApproved=${isApproved}` : '';
    return await apiCall(`${API_CONFIG.ENDPOINTS.CHANGE_CAMPAIGN_APPROVAL(id)}${query}`, {
        method: 'PUT'
    });
}

async function getCampaigns(filters = {}) {
    if (filters.isApproved === true) {
        return await getApprovedCampaigns(filters);
    }
    return await getApprovedCampaigns(filters);
}

// ==================== REVIEWS API ====================


async function getAllReviews(filters = {}) {
    const query = buildQueryString(filters);
    const response = await apiCall(`${API_CONFIG.ENDPOINTS.REVIEWS_ALL}${query ? '?' + query : ''}`);
    return response?.Items || response || [];
}

async function getReviewsByCampaign(campaignId, filters = {}) {
    try {
        const query = buildQueryString(filters);
        const url = `${API_CONFIG.ENDPOINTS.REVIEWS_BY_CAMPAIGN(campaignId)}${query ? '?' + query : ''}`;
        console.log('Calling getReviewsByCampaign with URL:', url);
        const response = await apiCall(url);
        console.log('getReviewsByCampaign response type:', typeof response, 'Is Array:', Array.isArray(response));
        console.log('getReviewsByCampaign response:', JSON.stringify(response, null, 2));
        
        if (response && typeof response === 'object') {
            if (response.Items && Array.isArray(response.Items)) {
                console.log('Returning Items array from PaginatedList, count:', response.Items.length);
                return response.Items;
            }
            
            if (response.items && Array.isArray(response.items)) {
                console.log('Returning items array (lowercase), count:', response.items.length);
                return response.items;
            }
        }
        
        if (Array.isArray(response)) {
            console.log('Response is directly an array, count:', response.length);
            return response;
        }
        
        if (!response) {
            console.warn('getReviewsByCampaign returned null/undefined');
            return [];
        }
        
        console.warn('Unexpected response structure from getReviewsByCampaign:', response);
        console.warn('Response keys:', Object.keys(response || {}));
        return [];
    } catch (error) {
        console.error('Error in getReviewsByCampaign:', error);
        console.error('Error details:', {
            message: error.message,
            status: error.status,
            data: error.data
        });
        
        if (error.status === 404 || (error.message && (error.message.includes('No reviews found') || error.message.includes('Not Found')))) {
            console.log('No reviews found (404), returning empty array');
            return [];
        }
        throw error;
    }
}

async function getReviewsByUser(userId, filters = {}) {
    const query = buildQueryString(filters);
    const response = await apiCall(`${API_CONFIG.ENDPOINTS.REVIEWS_BY_USER(userId)}${query ? '?' + query : ''}`);
    return response?.Items || response || [];
}

async function getMyReviews(filters = {}) {
    const query = buildQueryString(filters);
    const response = await apiCall(`${API_CONFIG.ENDPOINTS.REVIEWS_MY}${query ? '?' + query : ''}`);
    return response?.Items || response?.items || response || [];
}

async function getReviewsForMyCampaigns(filters = {}) {
    const query = buildQueryString(filters);
    const response = await apiCall(`${API_CONFIG.ENDPOINTS.REVIEWS_MY_CAMPAIGNS}${query ? '?' + query : ''}`);
    return response?.Items || response?.items || response || [];
}

async function getMyReviews(filters = {}) {
    const query = buildQueryString(filters);
    const response = await apiCall(`${API_CONFIG.ENDPOINTS.REVIEWS_MY}${query ? '?' + query : ''}`);
    return response?.Items || response || [];
}

async function createReview(campaignId, reviewData) {
    return await apiCall(API_CONFIG.ENDPOINTS.CREATE_REVIEW(campaignId), {
        method: 'POST',
        body: JSON.stringify({
            Comment: reviewData.comment,
            Reaction: reviewData.reaction
        })
    });
}

async function updateReview(id, updates) {
    return await apiCall(API_CONFIG.ENDPOINTS.UPDATE_REVIEW(id), {
        method: 'PUT',
        body: JSON.stringify({
            Comment: updates.comment,
            Reaction: updates.reaction
        })
    });
}

async function deleteReview(id) {
    return await apiCall(API_CONFIG.ENDPOINTS.DELETE_REVIEW(id), {
        method: 'DELETE'
    });
}

async function getReviews(campaignId) {
    return await getReviewsByCampaign(campaignId);
}

// ==================== PLEDGES API ====================

async function getAllPledges(filters = {}) {
    const query = buildQueryString(filters);
    const response = await apiCall(`${API_CONFIG.ENDPOINTS.PLEDGES_ALL}${query ? '?' + query : ''}`);
    return response?.Items || response || [];
}

async function getPledgeById(id) {
    return await apiCall(API_CONFIG.ENDPOINTS.PLEDGE_BY_ID(id));
}

async function getMyDonations(filters = {}) {
    const query = buildQueryString(filters);
    const response = await apiCall(`${API_CONFIG.ENDPOINTS.PLEDGES_MY_DONATIONS}${query ? '?' + query : ''}`);
    return response?.Items || response || [];
}

async function getMyCollections(filters = {}) {
    const query = buildQueryString(filters);
    const response = await apiCall(`${API_CONFIG.ENDPOINTS.PLEDGES_MY_COLLECTIONS}${query ? '?' + query : ''}`);
    return response?.Items || response || [];
}

async function getMyTransactionSummary() {
    return await apiCall(API_CONFIG.ENDPOINTS.PLEDGES_MY_SUMMARY);
}

async function getMyDashboardStatistics() {
    return await apiCall(API_CONFIG.ENDPOINTS.PLEDGES_MY_DASHBOARD);
}

async function getMyFinancialPerformance() {
    const response = await apiCall(API_CONFIG.ENDPOINTS.PLEDGES_MY_FINANCIAL_PERFORMANCE);
    return Array.isArray(response) ? response : [];
}

async function getPledgesByCampaign(campaignId, filters = {}) {
    const query = buildQueryString(filters);
    const response = await apiCall(`${API_CONFIG.ENDPOINTS.PLEDGES_BY_CAMPAIGN(campaignId)}${query ? '?' + query : ''}`);
    return response?.Items || response || [];
}

async function getPledgesByUser(userId, filters = {}) {
    const query = buildQueryString(filters);
    const response = await apiCall(`${API_CONFIG.ENDPOINTS.PLEDGES_BY_USER(userId)}${query ? '?' + query : ''}`);
    return response?.Items || response || [];
}

async function getUserTransactionSummary(userId) {
    return await apiCall(API_CONFIG.ENDPOINTS.PLEDGES_USER_SUMMARY(userId));
}

async function createPledge(campaignId, pledgeData) {
    return await apiCall(API_CONFIG.ENDPOINTS.CREATE_PLEDGE(campaignId), {
        method: 'POST',
        body: JSON.stringify({
            Amount: pledgeData.amount,
            PaymentMethodId: pledgeData.paymentMethodId
        })
    });
}

async function getPledges(filters = {}) {
    if (filters.campaignId) {
        return await getPledgesByCampaign(filters.campaignId, filters);
    }
    if (filters.userId) {
        return await getPledgesByUser(filters.userId, filters);
    }
    return [];
}

// ==================== ANALYTICS API (Admin Only) ====================


async function getTransactionStatistics(startDate, endDate) {
    const params = new URLSearchParams();
    if (startDate) params.append('StartDate', startDate);
    if (endDate) params.append('EndDate', endDate);
    const query = params.toString();
    return await apiCall(`${API_CONFIG.ENDPOINTS.ANALYTICS_STATISTICS}${query ? '?' + query : ''}`);
}

async function getTopDonors(count = 10) {
    return await apiCall(`${API_CONFIG.ENDPOINTS.ANALYTICS_TOP_DONORS}?count=${count}`);
}

async function getTopCampaigns(count = 10) {
    const response = await apiCall(`${API_CONFIG.ENDPOINTS.ANALYTICS_TOP_CAMPAIGNS}?count=${count}`);
    return Array.isArray(response) ? response : [];
}

async function getCampaignTransactionSummaries() {
    return await apiCall(API_CONFIG.ENDPOINTS.ANALYTICS_CAMPAIGN_SUMMARIES);
}

async function getDashboardStatistics() {
    return await apiCall(API_CONFIG.ENDPOINTS.ANALYTICS_DASHBOARD);
}

// ==================== SEARCH API ====================

async function globalSearch(searchTerm) {
    if (!searchTerm || searchTerm.trim().length === 0) {
        return [];
    }
    
    try {
        const url = `${API_CONFIG.ENDPOINTS.GLOBAL_SEARCH}?term=${encodeURIComponent(searchTerm.trim())}`;
        console.log('Calling globalSearch with URL:', url);
        const response = await apiCall(url);
        console.log('globalSearch response type:', typeof response, 'Is Array:', Array.isArray(response));
        console.log('globalSearch response:', JSON.stringify(response, null, 2));
        
        if (Array.isArray(response)) {
            console.log(`globalSearch returned ${response.length} results`);
            return response;
        }
        
        console.warn('globalSearch returned non-array response:', response);
        return [];
    } catch (error) {
        if (error.status === 404 || (error.message && (error.message.includes('No results found') || error.message.includes('Not Found')))) {
            console.log('No search results found, returning empty array');
            return [];
        }
        
        console.error('Error in globalSearch:', error);
        console.error('Error details:', {
            message: error.message,
            status: error.status,
            data: error.data
        });
        return [];
    }
}
