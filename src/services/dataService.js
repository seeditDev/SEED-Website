import { signInWithEmailAndPassword, signOut as fbSignOut } from 'firebase/auth';
import { doc, getDoc, getDocs, collectionGroup, collection, query, where, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../firebase-config';
import { cacheManager } from '../utils/cacheManager';

/**
 * DataService — Modern Firestore-First Data & Identity Service for SEED Platform.
 * Eradicates all legacy GitHub API calls, raw GitHub URLs, and static JSON dependencies.
 */
class DataService {
  /**
   * SEED Platform Canonical Login Method:
   * 1. Firebase Auth sign-in (email + password).
   * 2. Reads user profile from Firestore 'users/{userId}'.
   * 3. Returns standardized auth_data payload.
   */
  static async validateCredentials(email, password, role = 'student', college = '', year = '') {
    try {
      const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
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
        // Legacy capitalized keys for backward compatibility:
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
      console.error('[DataService] Firebase Auth sign-in error:', fbErr?.code || fbErr?.message || fbErr);
      throw fbErr;
    }
  }

  /**
   * Fetch user scores strictly from Firestore assessmentResults/{assessmentId}/students/{userId}
   */
  static async getUserScores(email, college) {
    try {
      const authData = JSON.parse(localStorage.getItem('auth_data') || '{}');
      const uid = authData.uid || authData.UID;
      if (!uid && !email) return null;

      const snap = await getDocs(collectionGroup(db, 'students'));
      let match = null;

      snap.docs.forEach((d) => {
        if (!d.ref.path.startsWith('assessmentResults/')) return;
        const data = d.data();
        if (data.userId === uid || data.email === email || d.id === uid) {
          match = { id: d.id, path: d.ref.path, ...data };
        }
      });

      return match;
    } catch (err) {
      console.warn('[DataService] Error fetching user scores from Firestore:', err);
      return null;
    }
  }

  /**
   * Fetch all student attempt results for a given college/tenant directly from Firestore.
   */
  static async getCollegeResultsFromFirestore(college) {
    try {
      const snap = await getDocs(collectionGroup(db, 'students'));
      const results = [];

      snap.docs.forEach((d) => {
        if (!d.ref.path.startsWith('assessmentResults/')) return;
        const data = d.data();
        const studentCollege = (data.college || data.College || data.tenantId || '').trim().toUpperCase();

        if (!college || college === 'SEEDIT' || studentCollege === college.trim().toUpperCase()) {
          results.push({ id: d.id, path: d.ref.path, ...data });
        }
      });

      return results;
    } catch (err) {
      console.warn('[DataService] Error fetching college results from Firestore:', err);
      return [];
    }
  }

  /**
   * Check module access for student session
   */
  static async checkModuleAccess(moduleId) {
    try {
      const authData = JSON.parse(localStorage.getItem('auth_data') || '{}');
      const accessData = authData.access;
      if (!accessData?.allowed_modules) return true; // Default allow if no restriction set
      return accessData.allowed_modules.includes(moduleId);
    } catch (_) {
      return true;
    }
  }

  /**
   * Check assessment access window and schedule status
   */
  static async checkAssessmentAccess(assessmentId) {
    try {
      const snap = await getDoc(doc(db, 'assessments', assessmentId));
      if (!snap.exists()) {
        return { allowed: true };
      }
      const data = snap.data();
      const status = data.status || 'Active';
      if (status.toLowerCase() === 'draft') {
        return { allowed: false, reason: 'Assessment is currently in draft mode.' };
      }
      return { allowed: true, duration: data.durationMinutes || 60 };
    } catch (err) {
      return { allowed: true };
    }
  }

  /**
   * Fetch portal links from Firestore ('portalLinks' doc in 'system' collection) or local storage
   */
  static async getPortalLinks() {
    try {
      const cached = sessionStorage.getItem('portal_links');
      if (cached) return JSON.parse(cached);

      const snap = await getDoc(doc(db, 'system', 'portalLinks'));
      if (snap.exists()) {
        const links = snap.data().links || snap.data();
        sessionStorage.setItem('portal_links', JSON.stringify(links));
        return links;
      }
    } catch (_) {}

    return [];
  }

  /**
   * Sign out current user and clear local session state
   */
  static async signOut() {
    try {
      await fbSignOut(auth);
    } catch (_) {}
    localStorage.removeItem('auth_data');
    localStorage.removeItem('role');
    localStorage.removeItem('token');
    localStorage.removeItem('isAuthenticated');
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