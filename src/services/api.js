import {
  firebaseLoginUser,
  firebaseRegisterUser,
  firebaseResetPassword,
  firebaseDeleteUser,
  firebaseResetDemoState,
  firebaseAddAgriWaste,
  firebaseUpdateAgriWaste,
  firebaseDeleteAgriWaste,
  firebaseSubmitSchemeApplication,
  firebaseUpdateApplicationStatus,
  firebaseWithdrawApplication,
  db,
  USERS_COL,
  WASTE_COL,
  SCHEMES_COL,
  APPLICATIONS_COL,
} from '../firebase';
import { collection, getDocs } from 'firebase/firestore';

const STORAGE_KEY_AUTH = 'krishaka_auth_user';
const STORAGE_KEY_TOKEN = 'krishaka_auth_token';
const STORAGE_KEY_LANG = 'krishaka_selected_lang';

export const ApiService = {
  getStoredUser() {
    try {
      const data = localStorage.getItem(STORAGE_KEY_AUTH);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  setStoredUser(user, token) {
    try {
      if (user) {
        localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(user));
        if (token) localStorage.setItem(STORAGE_KEY_TOKEN, token);
      } else {
        localStorage.removeItem(STORAGE_KEY_AUTH);
        localStorage.removeItem(STORAGE_KEY_TOKEN);
      }
    } catch (e) {
      console.error('Storage error', e);
    }
  },

  getStoredLanguage() {
    try {
      return localStorage.getItem(STORAGE_KEY_LANG) || 'en';
    } catch {
      return 'en';
    }
  },

  setStoredLanguage(lang) {
    try {
      localStorage.setItem(STORAGE_KEY_LANG, lang);
    } catch (e) {
      console.error('Storage error', e);
    }
  },

  // 1. Password Login via Firebase Firestore
  async login(payload) {
    try {
      // Direct Cloud Firestore Authentication verification
      const fbResult = await firebaseLoginUser(payload.identifier, payload.password);
      if (fbResult.success && fbResult.user) {
        const token = `fb-token-${Date.now()}`;
        this.setStoredUser(fbResult.user, token);
        return {
          success: true,
          user: fbResult.user,
          token,
          source: 'Google Cloud Firestore',
        };
      } else if (fbResult.error) {
        return {
          success: false,
          error: fbResult.error,
        };
      }
    } catch (err) {
      console.warn('Firebase login attempt failed, trying backend proxy:', err);
    }

    // Secondary fallback to server endpoint
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        return {
          success: false,
          error: data.error || 'Login failed. Please check your credentials.',
        };
      }
      if (data.user) {
        this.setStoredUser(data.user, data.token);
      }
      return data;
    } catch (err) {
      console.warn('Login network fallback:', err);
      return {
        success: false,
        error: 'Network connection issue. Please check your internet connection.',
      };
    }
  },

  // 2. Register (Sign Up) via Firebase Firestore
  async register(payload) {
    try {
      const fbResult = await firebaseRegisterUser(payload);
      if (fbResult.success && fbResult.user) {
        const token = `fb-token-${Date.now()}`;
        this.setStoredUser(fbResult.user, token);
        // Also sync with server in background
        fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }).catch(() => {});

        return {
          success: true,
          user: fbResult.user,
          token,
          source: 'Google Cloud Firestore',
        };
      } else if (fbResult.error) {
        return {
          success: false,
          error: fbResult.error,
        };
      }
    } catch (err) {
      console.warn('Firebase registration failed, trying server fallback:', err);
    }

    // Secondary fallback to server endpoint
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        return {
          success: false,
          error: data.error || 'Failed to complete registration.',
        };
      }
      if (data.user) {
        this.setStoredUser(data.user, data.token);
      }
      return data;
    } catch (err) {
      console.warn('API register error fallback:', err.message);
      return {
        success: false,
        error: 'Unable to connect to database. Please check your connection.',
      };
    }
  },

  // 3. Forgot Password - Request OTP
  async forgotPasswordRequestOtp(identifier) {
    try {
      const response = await fetch('/api/auth/forgot-password/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        return {
          success: false,
          error: data.error || 'No registered account found with these details.',
        };
      }
      return data;
    } catch (err) {
      return {
        success: true,
        phone: identifier,
        demoOtp: '1234',
        message: `OTP sent to ${identifier} (Evaluation Demo OTP: 1234)`,
      };
    }
  },

  // 4. Forgot Password - Reset Password in Firestore
  async forgotPasswordReset(phone, otp, newPassword) {
    try {
      const fbRes = await firebaseResetPassword(phone, newPassword);
      if (fbRes.success) {
        // Also update backend server copy
        fetch('/api/auth/forgot-password/reset', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone, otp, newPassword }),
        }).catch(() => {});

        return {
          success: true,
          message: 'Password successfully updated in Google Cloud Firestore.',
        };
      }
    } catch (err) {
      console.warn('Firestore password reset error:', err);
    }

    try {
      const response = await fetch('/api/auth/forgot-password/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp, newPassword }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        return {
          success: false,
          error: data.error || 'Failed to reset password.',
        };
      }
      return data;
    } catch (err) {
      return {
        success: false,
        error: err.message || 'Error processing reset request.',
      };
    }
  },

  // Send OTP
  async sendOtp(phone, role = 'farmer', email) {
    try {
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, role, email }),
      });
      const data = await response.json();
      return data;
    } catch (err) {
      return {
        success: true,
        phone,
        demoCode: '1234',
        message: `OTP sent to ${phone}`,
      };
    }
  },

  async verifyOtp(phone, otp) {
    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp }),
      });
      const data = await response.json();
      if (data.user) this.setStoredUser(data.user, data.token);
      return data;
    } catch (err) {
      return { success: otp === '1234', isNewUser: true, phone };
    }
  },

  // Get all users directly from Cloud Firestore
  async getAllUsers() {
    try {
      const snap = await getDocs(collection(db, USERS_COL));
      const users = snap.docs.map((d) => ({ ...d.data(), id: d.id }));
      if (users.length > 0) {
        return {
          users,
          totalUsers: users.length,
          databaseStorageType: 'Google Cloud Firestore',
          connected: true,
        };
      }
    } catch (err) {
      console.warn('Firestore fetch users failed, fallback to server:', err);
    }

    try {
      const response = await fetch('/api/users');
      const data = await response.json();
      return data;
    } catch (err) {
      const local = this.getStoredUser();
      return {
        users: local ? [local] : [],
        totalUsers: local ? 1 : 0,
        databaseStorageType: 'Local Client Store',
      };
    }
  },

  // Delete User in Firestore
  async deleteUser(id) {
    try {
      await firebaseDeleteUser(id);
    } catch (e) {
      console.warn('Firestore user delete notice:', e);
    }
    try {
      const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
      return res.ok;
    } catch {
      return true;
    }
  },

  // Reset entire database back to demo state
  async resetDemoDb() {
    try {
      await firebaseResetDemoState();
    } catch (e) {
      console.warn('Firebase reset state notice:', e);
    }
    try {
      const res = await fetch('/api/users/reset-demo', { method: 'POST' });
      return res.ok;
    } catch {
      return true;
    }
  },

  // Agri-Waste / Biomass CRUD
  async getAgriWasteListings() {
    try {
      const snap = await getDocs(collection(db, WASTE_COL));
      return snap.docs.map((d) => ({ ...d.data(), id: d.id }));
    } catch (err) {
      console.warn('Firestore fetch waste error:', err);
      return [];
    }
  },

  async addAgriWaste(wasteData) {
    return await firebaseAddAgriWaste(wasteData);
  },

  async updateAgriWaste(wasteId, updates) {
    return await firebaseUpdateAgriWaste(wasteId, updates);
  },

  async deleteAgriWaste(wasteId) {
    return await firebaseDeleteAgriWaste(wasteId);
  },

  // Government Schemes & Applications
  async getGovtSchemes() {
    try {
      const snap = await getDocs(collection(db, SCHEMES_COL));
      return snap.docs.map((d) => ({ ...d.data(), id: d.id }));
    } catch (err) {
      console.warn('Firestore fetch schemes error:', err);
      return [];
    }
  },

  async getFarmerApplications(farmerId) {
    try {
      const snap = await getDocs(collection(db, APPLICATIONS_COL));
      const all = snap.docs.map((d) => ({ ...d.data(), id: d.id }));
      return farmerId ? all.filter((a) => a.farmerId === farmerId) : all;
    } catch (err) {
      console.warn('Firestore fetch applications error:', err);
      return [];
    }
  },

  async submitSchemeApplication(appData) {
    return await firebaseSubmitSchemeApplication(appData);
  },

  async updateApplicationStatus(appId, newStatus, notes) {
    return await firebaseUpdateApplicationStatus(appId, newStatus, notes);
  },

  async withdrawApplication(appId) {
    return await firebaseWithdrawApplication(appId);
  },
};
