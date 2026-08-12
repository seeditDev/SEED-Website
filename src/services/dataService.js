import { API_ENDPOINTS, CACHE_CONFIG, FILE_TYPES } from '../config/constants';
import { cacheManager } from '../utils/cacheManager';
import timeService from './timeService';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase-config';

class DataService {
    static async fetchWithCache(url, cacheKey) {
        try {
            // Check cache first
            const cachedData = cacheManager.getLocalCache(cacheKey);
            if (cachedData) {
                return cachedData;
            }

            // Fetch from GitHub if not in cache
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();

            // Cache the new data
            cacheManager.setLocalCache(cacheKey, data);
            return data;
        } catch (error) {
            /* console.error('Fetch error:', error) */ void 0;
            throw error;
        }
    }

    static async fetchWithFallback(localUrl, githubApiUrl, githubUrl, cacheKey) {
        try {
            // Check cache first
            const cachedData = cacheManager.getLocalCache(cacheKey);
            if (cachedData) {
                /* console.log('[DataService] Returning cached data for:', cacheKey) */ void 0;
                return cachedData;
            }

            // Try local first
            try {
                /* console.log('[DataService] Trying local fetch:', localUrl) */ void 0;
                const localResponse = await fetch(localUrl);
                if (localResponse.ok) {
                    /* console.log('[DataService] Local fetch successful') */ void 0;
                    const data = await localResponse.json();
                    cacheManager.setLocalCache(cacheKey, data);
                    return data;
                }
                /* console.log('[DataService] Local fetch failed, trying GitHub API') */ void 0;
            } catch (localError) {
                /* console.log('[DataService] Local fetch error:', localError) */ void 0;
            }

            // Try GitHub API
            try {
                /* console.log('[DataService] Attempting GitHub API fetch') */ void 0;
                const apiResponse = await fetch(githubApiUrl, {
                    headers: {
                        'Accept': 'application/vnd.github.v3+json'
                    }
                });

                if (apiResponse.ok) {
                    const data = await apiResponse.json();
                    /* console.log('[DataService] GitHub API fetch successful') */ void 0;
                    const parsedData = typeof data.content === 'string' ? JSON.parse(atob(data.content)) : data;
                    cacheManager.setLocalCache(cacheKey, parsedData);
                    return parsedData;
                }
                /* console.log('[DataService] GitHub API fetch failed, trying raw GitHub') */ void 0;
            } catch (apiError) {
                /* console.log('[DataService] GitHub API error:', apiError) */ void 0;
            }

            // Try raw GitHub URL as last resort
            /* console.log('[DataService] Attempting raw GitHub fetch:', githubUrl) */ void 0;
            const rawResponse = await fetch(githubUrl);
            if (!rawResponse.ok) {
                throw new Error(`Failed to fetch data: ${rawResponse.status}`);
            }
            /* console.log('[DataService] Raw GitHub fetch successful') */ void 0;
            const data = await rawResponse.json();
            cacheManager.setLocalCache(cacheKey, data);
            return data;
        } catch (error) {
            /* console.error('[DataService] All fetch attempts failed:', error) */ void 0;
            throw error;
        }
    }

    static async getCollegeData(college, fileType, year) {
        // Simple cache key formation
        const cacheKey = `${CACHE_CONFIG.PREFIX[fileType.toUpperCase()]}${college}_${year || 'all'}`;
        
        if (!college) {
            throw new Error('College parameter is required');
        }
        
        if (!fileType) {
            throw new Error('File type parameter is required');
        }
        
        // For access files, year is required
        if (fileType === FILE_TYPES.ACCESS && !year) {
            throw new Error('Year parameter is required for access data');
        }
        
        const urls = {
            local: API_ENDPOINTS.LOCAL.getCollegeData(college, year, fileType),
            githubApi: API_ENDPOINTS.GITHUB_API.getCollegeData(college, year, fileType),
            github: API_ENDPOINTS.GITHUB.getCollegeData(college, year, fileType)
        };

        /* console.log(`[DataService] Fetching ${fileType} data for college: ${college}, year: ${year || 'all'}, URLs:`, urls) */ void 0;
        return await this.fetchWithFallback(urls.local, urls.githubApi, urls.github, cacheKey);
    }

    static async getUserCredentials(role = 'student') {
        const url = role === 'student' ? API_ENDPOINTS.LOCAL.STAFF_PASSWORD : API_ENDPOINTS.LOCAL.STAFF_PASSWORD;
        const githubApiUrl = role === 'student' ? API_ENDPOINTS.GITHUB_API.STAFF_PASSWORD : API_ENDPOINTS.GITHUB_API.STAFF_PASSWORD;
        const githubUrl = role === 'student' ? API_ENDPOINTS.GITHUB.STAFF_PASSWORD : API_ENDPOINTS.GITHUB.STAFF_PASSWORD;
        const cacheKey = `credentials_${role}`;
        return await this.fetchWithFallback(url, githubApiUrl, githubUrl, cacheKey);
    }

    /**
     * SEED-SEB Canonical Login Method: Firebase Auth + Firestore profile resolution.
     */
    static async validateCredentials(email, password, role = 'student', college = '', year = '') {
        // 1. Firebase Auth Sign-In (SEED-SEB canonical login method)
        try {
            const credential = await signInWithEmailAndPassword(auth, email, password);
            const firebaseUser = credential.user;

            let profile = null;
            try {
                const snap = await getDoc(doc(db, 'users', firebaseUser.uid));
                if (snap?.exists()) {
                    profile = snap.data();
                }
            } catch (_) {}

            const userRole = (profile?.role || profile?.Role || role || 'student').toLowerCase();
            const userCollege = profile?.college || profile?.College || college || '';
            const userDepartment = profile?.department || profile?.Department || '';
            const userYear = profile?.year || profile?.Year || year || '';
            const userRoll = profile?.rollNumber || profile?.['Roll Number'] || '';
            const userName = profile?.name || profile?.Name || firebaseUser.displayName || email.split('@')[0];

            const authData = {
                uid: firebaseUser.uid,
                email: firebaseUser.email || email,
                name: userName,
                role: userRole,
                tenantId: userCollege,
                college: userCollege,
                department: userDepartment,
                year: userYear,
                rollNumber: userRoll,
                // Legacy capitalized properties for backward compatibility
                Email: firebaseUser.email || email,
                Name: userName,
                Role: userRole,
                College: userCollege,
                Department: userDepartment,
                Year: userYear,
                'Roll Number': userRoll,
                Premium: profile?.premium !== undefined ? profile.premium : 1,
                isAuthenticated: true
            };

            return authData;
        } catch (fbErr) {
            console.warn('[DataService] Firebase Auth sign-in failed, trying fallback validation:', fbErr?.code || fbErr);
        }

        // 2. Fallback validation (for legacy static JSON profiles)
        try {
            if (role && role.toLowerCase() === 'staff') {
                const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
                const response = await fetch(`${API_URL}/api/auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username: email, password })
                });
                if (response.ok) {
                    const data = await response.json();
                    return {
                        uid: data.user.id || data.user.email,
                        email: data.user.email || data.user.Email,
                        name: data.user.name || data.user.Name,
                        role: (data.user.role || data.user.Role || 'staff').toLowerCase(),
                        college: data.user.college || data.user.College || '',
                        Email: data.user.email || data.user.Email,
                        Name: data.user.name || data.user.Name,
                        Role: data.user.role || data.user.Role || 'staff',
                        College: data.user.college || data.user.College || '',
                        isAuthenticated: true
                    };
                }
            } else if (college && year) {
                const profiles = await this.getCollegeData(college, FILE_TYPES.PROFILES, year);
                const userProfile = profiles.find(p => p.Email === email || p.email === email);
                if (userProfile && (userProfile.Password === password || userProfile.password === password)) {
                    return {
                        uid: userProfile.uid || userProfile.Email,
                        email: userProfile.Email || userProfile.email,
                        name: userProfile.Name || userProfile.name,
                        role: (userProfile.Role || userProfile.role || 'student').toLowerCase(),
                        college: userProfile.College || userProfile.college || college,
                        ...userProfile,
                        isAuthenticated: true
                    };
                }
            }
        } catch (_) {}

        return null;
    }

    static async getUserScores(email, college) {
        try {
            // Get current auth_data to get the year
            const authData = JSON.parse(localStorage.getItem("auth_data") || "{}");
            const year = authData.Year; // Get year from auth_data
            
            const scores = await this.getCollegeData(college, FILE_TYPES.SCORES, year);
            const userScores = scores.find(s => s["Hackerrank Mail"] === email) || null;
            
            if (userScores) {
                // Update auth_data with scores
                const updatedAuthData = {
                    ...authData,
                    scores: userScores
                };
                
                // Store updated auth_data
                localStorage.setItem("auth_data", JSON.stringify(updatedAuthData));
            }
            
            return userScores;
        } catch (error) {
            /* console.error('Error fetching scores:', error) */ void 0;
            return null;
        }
    }

    static async getAccessControl() {
        try {
            // Try to get from cache first
            const cacheKey = 'access_control_data';
            const cachedData = cacheManager.getLocalCache(cacheKey);
            if (cachedData) {
                /* console.log('[DataService] Returning cached access control data') */ void 0;
                return cachedData;
            }

            // If not in cache, fetch from sources
            const urls = {
                local: API_ENDPOINTS.LOCAL.ACCESS_CONTROL,
                githubApi: API_ENDPOINTS.GITHUB_API.ACCESS_CONTROL,
                github: API_ENDPOINTS.GITHUB.ACCESS_CONTROL
            };

            /* console.log('[DataService] Fetching access control data') */ void 0;
            const data = await this.fetchWithFallback(urls.local, urls.githubApi, urls.github, cacheKey);
            return data;
        } catch (error) {
            /* console.error('[DataService] Error fetching access control:', error) */ void 0;
            throw error;
        }
    }

    static async getUserAccess(email, college) {
        try {
            /* console.log('[DataService] getUserAccess called with email:', email, 'college:', college) */ void 0;
            
            // First check if we have access data in auth_data in localStorage
            const authData = JSON.parse(localStorage.getItem("auth_data") || "{}");
            if (authData.access) {
                /* console.log('[DataService] Returning access data from auth_data in localStorage') */ void 0;
                return authData.access;
            }
            
            // Get the year and department from auth data
            const year = authData.Year;
            const department = authData.Department;
            
            if (!year || !department) {
                /* console.error('[DataService] Missing year or department in auth data') */ void 0;
                throw new Error('Year and department information is missing. Please log in again.');
            }

            // Get access control data
            const accessControl = await this.getAccessControl();
            const departmentAccess = accessControl?.access_control?.colleges?.[college]?.[year]?.[department];
            
            if (!departmentAccess) {
                /* console.error('[DataService] No access configuration found for:', { college, year, department }) */ void 0;
                throw new Error('No access configuration found for your department. Please contact support.');
            }

            // Check batch dates
            const now = timeService.getNow();
            const batchStart = new Date(departmentAccess.batch_start);
            const batchEnd = new Date(departmentAccess.batch_end);

            if (now < batchStart) {
                throw new Error(`Your batch access will begin on ${batchStart.toLocaleDateString()}`);
            }
            if (now > batchEnd) {
                throw new Error(`Your batch access ended on ${batchEnd.toLocaleDateString()}`);
            }

            // Create access object
            const accessData = {
                user_info: {
                    email,
                    year,
                    department,
                    college,
                    batch_start: departmentAccess.batch_start,
                    batch_end: departmentAccess.batch_end
                },
                allowed_modules: departmentAccess.allowed_modules,
                assessment_controls: departmentAccess.assessment_controls || {}
            };

            // Store in auth_data
            const updatedAuthData = {
                ...authData,
                access: accessData
            };
            localStorage.setItem("auth_data", JSON.stringify(updatedAuthData));

            return accessData;
        } catch (error) {
            /* console.error('[DataService] Error in getUserAccess:', error) */ void 0;
            throw error;
        }
    }

    static async checkModuleAccess(moduleId) {
        try {
            const authData = JSON.parse(localStorage.getItem("auth_data") || "{}");
            const accessData = authData.access;

            if (!accessData?.allowed_modules) {
                return false;
            }

            return accessData.allowed_modules.includes(moduleId);
        } catch (error) {
            /* console.error('[DataService] Error checking module access:', error) */ void 0;
            return false;
        }
    }

    static async checkAssessmentAccess(assessmentId) {
        try {
            const authData = JSON.parse(localStorage.getItem("auth_data") || "{}");
            const accessData = authData.access;

            if (!accessData?.assessment_controls?.[assessmentId]) {
                return { allowed: false, reason: 'Assessment not configured' };
            }

            const assessment = accessData.assessment_controls[assessmentId];
            const now = timeService.getNow();
            const startTime = new Date(assessment.start_time);
            const endTime = new Date(assessment.end_time);

            if (assessment.status !== 'scheduled') {
                return { allowed: false, reason: `Assessment ${assessment.status}` };
            }

            if (now < startTime) {
                return { 
                    allowed: false, 
                    reason: `Assessment starts at ${startTime.toLocaleString()}`,
                    startTime,
                    endTime,
                    duration: assessment.duration_minutes
                };
            }

            if (now > endTime) {
                return { 
                    allowed: false, 
                    reason: `Assessment ended at ${endTime.toLocaleString()}` 
                };
            }

            return { 
                allowed: true,
                startTime,
                endTime,
                duration: assessment.duration_minutes,
                attemptsAllowed: assessment.attempts_allowed
            };
        } catch (error) {
            /* console.error('[DataService] Error checking assessment access:', error) */ void 0;
            return { allowed: false, reason: 'Error checking assessment access' };
        }
    }

    static async getPortalLinks() {
        try {
            /* console.log('getPortalLinks called') */ void 0;
            
            // First check if we have portal links in sessionStorage (preferred approach)
            const portalLinksData = sessionStorage.getItem("portal_links");
            if (portalLinksData) {
                try {
                    const storedLinks = JSON.parse(portalLinksData);
                    /* console.log('Returning portal links from sessionStorage') */ void 0;
                    return storedLinks;
                } catch (e) {
                    /* console.error('Error parsing portal links from sessionStorage:', e) */ void 0;
                    // If JSON parsing fails, we'll continue to check other sources
                }
            }
            
            // Check localStorage for backward compatibility
            const localStorageLinks = localStorage.getItem("portal_links");
            if (localStorageLinks) {
                try {
                    const parsedLinks = JSON.parse(localStorageLinks);
                    /* console.log('Found portal links in localStorage, migrating to sessionStorage') */ void 0;
                    // Migrate to sessionStorage
                    sessionStorage.setItem("portal_links", localStorageLinks);
                    // Remove from localStorage since we're transitioning
                    localStorage.removeItem("portal_links");
                    /* console.log('Migrated portal links from localStorage to sessionStorage') */ void 0;
                    return parsedLinks;
                } catch (e) {
                    /* console.error('Error parsing portal links from localStorage:', e) */ void 0;
                }
            }
            
            // For backward compatibility, check the cache system
            // This will be removed in future versions (after v2.0)
            const legacyCacheKey = 'portal_links';
            const cachedLinks = cacheManager.getLocalCache(legacyCacheKey);
            if (cachedLinks) {
                /* console.log('Found portal links in legacy cache system with key:', legacyCacheKey) */ void 0;
                
                // Migrate to the sessionStorage approach
                sessionStorage.setItem("portal_links", JSON.stringify(cachedLinks));
                /* console.log('Migrated portal links to sessionStorage') */ void 0;
                
                // Clear the old cache to avoid duplication
                cacheManager.clearCache(legacyCacheKey);
                /* console.log('Cleared legacy cache entry') */ void 0;
                
                return cachedLinks;
            }
            
            // If not found in any cache, fetch from server
            /* console.log('No cached portal links found, fetching from server') */ void 0;
            const url = 'https://raw.githubusercontent.com/seeditDev/SEEDDB/main/portalLinks/portalLinks.json';
            /* console.log('Fetching portal links from URL:', url) */ void 0;
            
            const response = await fetch(url);
            
            if (!response.ok) {
                /* console.error('Portal links HTTP error, status:', response.status) */ void 0;
                throw new Error(`Failed to fetch portal links: HTTP error ${response.status}`);
            }
            
            const links = await response.json();
            /* console.log('Portal links received:', links) */ void 0;
            
            // Store in sessionStorage
            sessionStorage.setItem("portal_links", JSON.stringify(links));
            /* console.log('Stored portal links in sessionStorage') */ void 0;
            
            return links;
        } catch (error) {
            /* console.error('Error in getPortalLinks:', error) */ void 0;
            throw error; // Re-throw the error to be handled by the calling function
        }
    }

    static async getUserData(email) {
        const cacheKey = `auth_${email}`;
        return cacheManager.getLocalCache(cacheKey);
    }

    static clearUserData(email) {
        const cacheKey = `auth_${email}`;
        cacheManager.clearCache(cacheKey);
    }
}

export default DataService; 