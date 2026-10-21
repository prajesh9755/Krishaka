import {
  firebaseLoginUser,
  firebaseRegisterUser,
  firebaseAddAgriWaste,
  firebaseUpdateAgriWaste,
  firebaseDeleteAgriWaste,
  firebaseSubmitSchemeApplication,
  firebaseUpdateApplicationStatus,
  firebaseWithdrawApplication,
  db,
  WASTE_COL,
  SCHEMES_COL,
  APPLICATIONS_COL,
} from './firebase';
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

  // Login: checked against the Firestore users collection
  async login(payload) {
    try {
      const res = await firebaseLoginUser(payload.identifier, payload.password);
      if (res.success && res.user) {
        const token = `fb-token-${Date.now()}`;
        this.setStoredUser(res.user, token);
        return { success: true, user: res.user, token };
      }
      return { success: false, error: res.error || 'Login failed. Please check your credentials.' };
    } catch (err) {
      return { success: false, error: 'Network connection issue. Please check your internet connection.' };
    }
  },

  // Sign up: creates the user document in Firestore
  async register(payload) {
    try {
      const res = await firebaseRegisterUser(payload);
      if (res.success && res.user) {
        const token = `fb-token-${Date.now()}`;
        this.setStoredUser(res.user, token);
        return { success: true, user: res.user, token };
      }
      return { success: false, error: res.error || 'Failed to complete registration.' };
    } catch (err) {
      return { success: false, error: 'Unable to connect to database. Please check your connection.' };
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
