// Authentication Management

async function login(email, password) {
    try {
        await new Promise(resolve => setTimeout(resolve, 50));
        
        if (typeof apiCall === 'undefined') {
            console.error('apiCall function is not defined. api.js may not be loaded correctly.');
            console.error('Available functions:', Object.keys(window).filter(k => typeof window[k] === 'function').slice(0, 20));
            throw new Error('System error: API functions not available. Please refresh the page and check browser console for errors.');
        }
        
        const apiConfig = typeof API_CONFIG !== 'undefined' ? API_CONFIG : {
            BASE_URL: 'https://localhost:7221',
            ENDPOINTS: {
                LOGIN: '/api/Auth'
            }
        };
        
        if (!apiConfig.ENDPOINTS || !apiConfig.ENDPOINTS.LOGIN) {
            console.error('API_CONFIG.ENDPOINTS.LOGIN is not defined.');
            throw new Error('System error: Login endpoint not configured. Please refresh the page.');
        }
        
        console.log('Calling login endpoint:', apiConfig.ENDPOINTS.LOGIN);
        const response = await apiCall(apiConfig.ENDPOINTS.LOGIN, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                Email: email,
                Password: password
            })
        });
        
        console.log('Login API response received:', {
            hasToken: !!(response.token || response.Token),
            hasId: !!(response.id || response.Id),
            hasRoles: !!(response.roles || response.Roles),
            roles: (response.roles || response.Roles) || [],
            keys: Object.keys(response || {})
        });
        
        const responseToken = response.token || response.Token;
        const responseId = response.id || response.Id;
        const responseEmail = response.email || response.Email;
        const responseFullName = response.fullName || response.FullName;
        const responseExpiresIn = response.expiresIn || response.ExpiresIn;
        const responseRefreshToken = response.refreshToken || response.RefreshToken;
        const responseRefreshTokenExpiration = response.refreshTokenExpiration || response.RefreshTokenExpiration;
        const responseRoles = response.roles || response.Roles || [];
        
        const processedResponse = {
            Token: responseToken,
            token: responseToken,
            accessToken: responseToken,
            Id: responseId,
            id: responseId,
            Email: responseEmail,
            email: responseEmail,
            FullName: responseFullName,
            fullName: responseFullName,
            ExpiresIn: responseExpiresIn,
            expiresIn: responseExpiresIn,
            RefreshToken: responseRefreshToken,
            refreshToken: responseRefreshToken,
            RefreshTokenExpiration: responseRefreshTokenExpiration,
            refreshTokenExpiration: responseRefreshTokenExpiration,
            Roles: responseRoles,
            roles: responseRoles
        };
        
        const token = processedResponse.token || processedResponse.Token || processedResponse.accessToken;
        if (!token || token.trim().length === 0) {
            console.error('No token received from login response:', processedResponse);
            throw new Error('Unable to complete login. Please try again.');
        }
        
        console.log('Storing token:', token.substring(0, 20) + '...', 'Length:', token.length);
        localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
        
        try {
            const userInfo = await getCurrentUserInfo();
            const roles = processedResponse.roles || processedResponse.Roles || [];
            const isAdmin = Array.isArray(roles) && roles.includes('Admin');

            if (userInfo) {
                localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify({
                    id: userInfo.Id || userInfo.id,
                    fullName: userInfo.FullName || userInfo.fullName,
                    email: userInfo.Email || userInfo.email,
                    profileImage: userInfo.ProfileImage || userInfo.profileImage,
                    role: isAdmin ? 'Admin' : 'User',
                    roles,
                    isAdmin
                }));
            } else {
                const userId = processedResponse.Id || processedResponse.id;
                const userFullName = processedResponse.FullName || processedResponse.fullName;
                const userEmail = processedResponse.Email || processedResponse.email;
                
                if (userId && userFullName && userEmail) {
                    localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify({
                        id: userId,
                        fullName: userFullName,
                        email: userEmail,
                        profileImage: null,
                        role: isAdmin ? 'Admin' : 'User',
                        roles,
                        isAdmin
                    }));
                }
            }
        } catch (userInfoError) {
            console.warn('Could not fetch user info after login, using response data:', userInfoError);
            const roles = processedResponse.roles || processedResponse.Roles || [];
            const isAdmin = Array.isArray(roles) && roles.includes('Admin');
            const userId = processedResponse.Id || processedResponse.id;
            const userFullName = processedResponse.FullName || processedResponse.fullName;
            const userEmail = processedResponse.Email || processedResponse.email;
            
            if (userId && userFullName && userEmail) {
                localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify({
                    id: userId,
                    fullName: userFullName,
                    email: userEmail,
                    profileImage: null,
                    role: isAdmin ? 'Admin' : 'User',
                    roles,
                    isAdmin
                }));
            }
        }
        
        return processedResponse;
    } catch (error) {
        console.error('Login error:', error);
        const friendlyMessage = getUserFriendlyErrorMessage(error);
        throw new Error(friendlyMessage);
    }
}

async function register(fullName, email, password) {
    try {
        await registerUser({ fullName, email, password });
        
        return await login(email, password);
    } catch (error) {
        throw error;
    }
}

function logout() {
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER_DATA);
    
    const currentPath = window.location.pathname;
    let indexPath = 'index.html';
    
    if (currentPath.includes('/pages/')) {
        indexPath = '../index.html';
    }
    
    redirectTo(indexPath);
}

function handleLogout() {
    logout();
}

function checkAuth() {
    return isAuthenticated();
}

function requireAuth() {
    if (!checkAuth()) {
        const currentPath = window.location.pathname;
        let loginPath = 'pages/login.html';
        
        if (currentPath.includes('/pages/')) {
            loginPath = 'login.html';
        }
        
        redirectTo(loginPath);
        return false;
    }
    return true;
}

function requireAdmin() {
    if (!requireAuth()) return false;
    
    const user = getCurrentUser();
    const isAdminUser = user && (
        user.role === 'Admin' ||
        (Array.isArray(user.roles) && user.roles.includes('Admin')) ||
        user.isAdmin === true
    );

    if (!isAdminUser) {
        showNotification('Access denied. Admin privileges required.', 'error');
        const currentPath = window.location.pathname;
        let indexPath = 'index.html';
        if (currentPath.includes('/pages/')) {
            indexPath = '../index.html';
        }
        redirectTo(indexPath);
        return false;
    }
    return true;
}

