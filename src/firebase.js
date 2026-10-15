import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { 
  INITIAL_MANDI_RATES, 
  INITIAL_PRODUCE_LISTINGS, 
  INITIAL_PURCHASE_ORDERS,
  INITIAL_AGRI_WASTE,
  INITIAL_GOVT_SCHEMES,
  INITIAL_SCHEME_APPLICATIONS,
  INITIAL_LOCAL_RETAILERS,
} from './data/mockMarketplace';

// 1. Initialize Firebase App
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// 2. Initialize Cloud Firestore with dedicated database instance ID
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || '(default)');

// Collection references
export const USERS_COL = 'users';
export const CROPS_COL = 'crop_listings';
export const ORDERS_COL = 'orders';
export const MANDI_COL = 'mandi_rates';
export const WASTE_COL = 'agri_waste_listings';
export const SCHEMES_COL = 'govt_schemes';
export const APPLICATIONS_COL = 'scheme_applications';
export const RETAILERS_COL = 'retailers';

export const collections = {
  users: collection(db, USERS_COL),
  crops: collection(db, CROPS_COL),
  orders: collection(db, ORDERS_COL),
  mandi: collection(db, MANDI_COL),
  waste: collection(db, WASTE_COL),
  schemes: collection(db, SCHEMES_COL),
  applications: collection(db, APPLICATIONS_COL),
  retailers: collection(db, RETAILERS_COL),
};

// Initial Seed Users for Demo & Evaluation
const SEED_USERS = [
  {
    id: 'usr-farmer-1',
    phone: '+919823456789',
    email: 'rameshwar.patil@krishaka.in',
    password: 'Password@123',
    name: 'Rameshwar Patil',
    role: 'farmer',
    language: 'mr',
    createdAt: '2026-08-10T09:30:00.000Z',
    updatedAt: new Date().toISOString(),
    isVerified: true,
    farmerDetails: {
      village: 'Pimpalgaon Baswant',
      district: 'Nashik',
      state: 'Maharashtra',
      pincode: '422209',
      landAreaAcres: 7.5,
      primaryCrops: ['Onion (Red)', 'Tomato', 'Grapes', 'Soybean'],
      organicCertified: true,
      aadhaarOrKisanIdVerified: true,
      kisanCardNumber: 'MH-NSK-2024-8849',
      bankUpiId: 'rameshwar.farm@upi',
    },
  },
  {
    id: 'usr-buyer-1',
    phone: '+919876500000',
    email: 'trade@bharatagri.com',
    password: 'Password@123',
    name: 'Virendra Singhania',
    role: 'buyer',
    language: 'en',
    createdAt: '2026-08-12T11:00:00.000Z',
    updatedAt: new Date().toISOString(),
    isVerified: true,
    buyerDetails: {
      businessName: 'Bharat Fresh Agri-Venture Pvt Ltd',
      contactPerson: 'Virendra Singhania',
      businessType: 'wholesaler',
      apmcGstNumber: '27AAACB2234K1Z9',
      deliveryCity: 'Vashi APMC, Navi Mumbai',
      deliveryState: 'Maharashtra',
      preferredProduce: ['Red Onion', 'Basmati Rice', 'Tomato', 'Soybean'],
      tradeCapacityTonsMonthly: 120,
    },
  },
];

// Helper: Seed initial database if empty and upload expanded crop catalog
export async function seedDatabaseIfEmpty() {
  try {
    const userSnapshot = await getDocs(collection(db, USERS_COL));
    if (userSnapshot.empty) {
      console.log('Seeding initial users into Firestore...');
      for (const user of SEED_USERS) {
        await setDoc(doc(db, USERS_COL, user.id), user);
      }
    }

    // Check if new crop batch expansion (v2) has been seeded
    const CROP_BATCH_V2_KEY = 'krishaka_crop_expansion_v2_seeded';
    const isV2Seeded = typeof window !== 'undefined' && localStorage.getItem(CROP_BATCH_V2_KEY) === 'true';

    const cropSnapshot = await getDocs(collection(db, CROPS_COL));
    if (cropSnapshot.empty) {
      console.log('Seeding all initial crop listings into Firestore...');
      for (const crop of INITIAL_PRODUCE_LISTINGS) {
        await setDoc(doc(db, CROPS_COL, crop.id), crop);
      }
      if (typeof window !== 'undefined') localStorage.setItem(CROP_BATCH_V2_KEY, 'true');
    } else if (!isV2Seeded) {
      // First time loading the new crop expansion: upload any new crops (prod-105 to prod-111) that aren't yet in Firestore
      console.log('Uploading new expanded crops into Firestore...');
      const existingCropIds = new Set(cropSnapshot.docs.map((d) => d.id));
      for (const crop of INITIAL_PRODUCE_LISTINGS) {
        if (!existingCropIds.has(crop.id)) {
          await setDoc(doc(db, CROPS_COL, crop.id), crop);
        }
      }
      if (typeof window !== 'undefined') localStorage.setItem(CROP_BATCH_V2_KEY, 'true');
    }

    const orderSnapshot = await getDocs(collection(db, ORDERS_COL));
    if (orderSnapshot.empty) {
      console.log('Seeding initial orders into Firestore...');
      for (const order of INITIAL_PURCHASE_ORDERS) {
        await setDoc(doc(db, ORDERS_COL, order.id), order);
      }
    }

    const mandiSnapshot = await getDocs(collection(db, MANDI_COL));
    if (mandiSnapshot.empty) {
      console.log('Seeding initial mandi rates into Firestore...');
      for (const rate of INITIAL_MANDI_RATES) {
        await setDoc(doc(db, MANDI_COL, rate.id), rate);
      }
    }

    // Always ensure all initial and expanded agri-waste listings exist in Firestore
    const wasteSnapshot = await getDocs(collection(db, WASTE_COL));
    const WASTE_BATCH_V2_KEY = 'krishaka_waste_seeded_v2';
    const isWasteV2Seeded = typeof window !== 'undefined' ? localStorage.getItem(WASTE_BATCH_V2_KEY) : null;
    if (wasteSnapshot.empty || !isWasteV2Seeded) {
      console.log('Syncing expanded agri-waste listings to Firestore...');
      const existingWasteIds = new Set(wasteSnapshot.docs.map((d) => d.id));
      for (const waste of INITIAL_AGRI_WASTE) {
        if (!existingWasteIds.has(waste.id)) {
          await setDoc(doc(db, WASTE_COL, waste.id), waste);
        }
      }
      if (typeof window !== 'undefined') localStorage.setItem(WASTE_BATCH_V2_KEY, 'true');
    }

    // Always ensure all government schemes exist in Firestore
    const schemesSnapshot = await getDocs(collection(db, SCHEMES_COL));
    const SCHEMES_BATCH_KEY = 'krishaka_schemes_seeded_v2';
    const isSchemesSeeded = typeof window !== 'undefined' ? localStorage.getItem(SCHEMES_BATCH_KEY) : null;
    if (schemesSnapshot.empty || !isSchemesSeeded) {
      console.log('Syncing government schemes catalog to Firestore...');
      for (const scheme of INITIAL_GOVT_SCHEMES) {
        await setDoc(doc(db, SCHEMES_COL, scheme.id), scheme, { merge: true });
      }
      if (typeof window !== 'undefined') localStorage.setItem(SCHEMES_BATCH_KEY, 'true');
    }

    // Always ensure local retailers exist in Firestore
    const retailersSnapshot = await getDocs(collection(db, RETAILERS_COL));
    const RETAILERS_BATCH_KEY = 'krishaka_retailers_seeded_v1';
    const isRetailersSeeded = typeof window !== 'undefined' ? localStorage.getItem(RETAILERS_BATCH_KEY) : null;
    if (retailersSnapshot.empty || !isRetailersSeeded) {
      console.log('Syncing local retailers to Firestore...');
      for (const ret of INITIAL_LOCAL_RETAILERS) {
        await setDoc(doc(db, RETAILERS_COL, ret.id), ret, { merge: true });
      }
      if (typeof window !== 'undefined') localStorage.setItem(RETAILERS_BATCH_KEY, 'true');
    }
  } catch (err) {
    console.warn('Firebase seeding notice:', err.message);
  }
}

// Automatically trigger background seed
seedDatabaseIfEmpty();

// -------------------------------------------------------------
// USER CRUD OPERATIONS (Reflects instantly in app)
// -------------------------------------------------------------

export async function firebaseRegisterUser(userData) {
  try {
    // Normalise phone
    const cleanPhone = userData.phone.startsWith('+91')
      ? userData.phone
      : `+91${userData.phone.replace(/^0+/, '')}`;

    // Check if phone or email already exists
    const usersSnap = await getDocs(collection(db, USERS_COL));
    const allUsers = usersSnap.docs.map((d) => d.data());
    const existing = allUsers.find(
      (u) =>
        u.phone === cleanPhone ||
        (userData.email && u.email && u.email.toLowerCase() === userData.email.toLowerCase())
    );

    if (existing) {
      return {
        success: false,
        error: 'An account with this phone number or email already exists in Firestore.',
      };
    }

    const newId = userData.id || `usr-${userData.role}-${Date.now()}`;
    const newUser = {
      ...userData,
      id: newId,
      phone: cleanPhone,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isVerified: true,
    };

    await setDoc(doc(db, USERS_COL, newId), newUser);
    return { success: true, user: newUser };
  } catch (err) {
    console.error('Firebase registration error:', err);
    return { success: false, error: err.message };
  }
}

export async function firebaseLoginUser(identifier, password) {
  try {
    const usersSnap = await getDocs(collection(db, USERS_COL));
    const cleanIdentifier = identifier.trim();
    const cleanPhone = cleanIdentifier.startsWith('+91')
      ? cleanIdentifier
      : `+91${cleanIdentifier.replace(/^0+/, '')}`;

    const matchingDoc = usersSnap.docs.find((d) => {
      const u = d.data();
      return (
        u.phone === cleanIdentifier ||
        u.phone === cleanPhone ||
        (u.email && u.email.toLowerCase() === cleanIdentifier.toLowerCase())
      );
    });

    if (!matchingDoc) {
      return {
        success: false,
        error: 'No account found with this Phone Number or Email in Firestore.',
      };
    }

    const user = matchingDoc.data();
    if (user.password !== password) {
      return {
        success: false,
        error: 'Incorrect password. Please verify and try again.',
      };
    }

    return { success: true, user };
  } catch (err) {
    console.error('Firebase login error:', err);
    return { success: false, error: err.message };
  }
}

export async function firebaseUpdateUser(userId, partialData) {
  try {
    const userRef = doc(db, USERS_COL, userId);
    const updated = {
      ...partialData,
      updatedAt: new Date().toISOString(),
    };
    await updateDoc(userRef, updated);
    return { success: true };
  } catch (err) {
    console.error('Firebase update user error:', err);
    return { success: false, error: err.message };
  }
}

export async function firebaseDeleteUser(userId) {
  try {
    // 1. Delete user document from Firestore
    await deleteDoc(doc(db, USERS_COL, userId));

    // 2. Clean up any crop listings belonging to this farmer
    const cropsSnap = await getDocs(collection(db, CROPS_COL));
    for (const cropDoc of cropsSnap.docs) {
      const data = cropDoc.data();
      if (data.farmerId === userId) {
        await deleteDoc(cropDoc.ref);
      }
    }

    // 3. Clean up any agri-waste listings belonging to this farmer
    const wasteSnap = await getDocs(collection(db, WASTE_COL));
    for (const wasteDoc of wasteSnap.docs) {
      const data = wasteDoc.data();
      if (data.farmerId === userId) {
        await deleteDoc(wasteDoc.ref);
      }
    }

    return { success: true };
  } catch (err) {
    console.error('Firebase delete user error:', err);
    return { success: false, error: err.message };
  }
}

export async function firebaseResetPassword(phoneOrEmail, newPassword) {
  try {
    const clean = phoneOrEmail.trim();
    const cleanPhone = clean.startsWith('+91') ? clean : `+91${clean.replace(/^0+/, '')}`;
    const usersSnap = await getDocs(collection(db, USERS_COL));

    const matchingDoc = usersSnap.docs.find((d) => {
      const u = d.data();
      return (
        u.phone === clean ||
        u.phone === cleanPhone ||
        (u.email && u.email.toLowerCase() === clean.toLowerCase())
      );
    });

    if (!matchingDoc) {
      return { success: false, error: 'User account not found.' };
    }

    await updateDoc(doc(db, USERS_COL, matchingDoc.id), {
      password: newPassword,
      updatedAt: new Date().toISOString(),
    });

    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// -------------------------------------------------------------
// REAL-TIME SUBSCRIBERS
// -------------------------------------------------------------

export function subscribeToUsers(callback) {
  return onSnapshot(
    collection(db, USERS_COL),
    (snap) => {
      const users = snap.docs.map((d) => ({ ...d.data(), id: d.id }));
      callback(users);
    },
    (err) => console.error('Users snapshot error:', err)
  );
}

export function subscribeToCropListings(callback) {
  return onSnapshot(
    collection(db, CROPS_COL),
    (snap) => {
      const listings = snap.docs.map((d) => ({ ...d.data(), id: d.id }));
      callback(listings);
    },
    (err) => console.error('Crop listings snapshot error:', err)
  );
}

export function subscribeToOrders(callback) {
  return onSnapshot(
    collection(db, ORDERS_COL),
    (snap) => {
      const orders = snap.docs.map((d) => ({ ...d.data(), id: d.id }));
      callback(orders);
    },
    (err) => console.error('Orders snapshot error:', err)
  );
}

export function subscribeToMandiRates(callback) {
  return onSnapshot(
    collection(db, MANDI_COL),
    (snap) => {
      const rates = snap.docs.map((d) => ({ ...d.data(), id: d.id }));
      callback(rates);
    },
    (err) => console.error('Mandi snapshot error:', err)
  );
}

export function subscribeToAgriWaste(callback) {
  return onSnapshot(
    collection(db, WASTE_COL),
    (snap) => {
      const wasteList = snap.docs.map((d) => ({ ...d.data(), id: d.id }));
      callback(wasteList);
    },
    (err) => console.error('Agri-waste snapshot error:', err)
  );
}

export function subscribeToGovtSchemes(callback) {
  return onSnapshot(
    collection(db, SCHEMES_COL),
    (snap) => {
      const schemesList = snap.docs.map((d) => ({ ...d.data(), id: d.id }));
      callback(schemesList);
    },
    (err) => console.error('Govt schemes snapshot error:', err)
  );
}

export function subscribeToRetailers(callback) {
  return onSnapshot(
    collection(db, RETAILERS_COL),
    (snap) => {
      const retailersList = snap.docs.map((d) => ({ ...d.data(), id: d.id }));
      callback(retailersList);
    },
    (err) => console.error('Retailers snapshot error:', err)
  );
}

export async function firebaseSyncMandiRates(rates) {
  try {
    for (const rate of rates) {
      await setDoc(doc(db, MANDI_COL, rate.id), {
        ...rate,
        lastUpdated: new Date().toISOString(),
      }, { merge: true });
    }
    return { success: true };
  } catch (err) {
    console.error('Mandi rates sync error:', err);
    return { success: false, error: err.message };
  }
}

export function subscribeToSchemeApplications(farmerId, callback) {
  const colRef = collection(db, APPLICATIONS_COL);
  // If farmerId provided, query by farmerId, otherwise all
  const q = farmerId ? query(colRef, where('farmerId', '==', farmerId)) : colRef;
  return onSnapshot(
    q,
    (snap) => {
      const apps = snap.docs.map((d) => ({ ...d.data(), id: d.id }));
      callback(apps);
    },
    (err) => {
      console.warn('Scheme applications snapshot notice:', err);
      // Fallback without where filter if index missing
      onSnapshot(colRef, (snap2) => {
        const all = snap2.docs.map((d) => ({ ...d.data(), id: d.id }));
        callback(farmerId ? all.filter((a) => a.farmerId === farmerId) : all);
      });
    }
  );
}

// -------------------------------------------------------------
// CROP LISTING CRUD
// -------------------------------------------------------------

export async function firebaseAddCropListing(cropData) {
  try {
    const newId = cropData.id || `prod-${Date.now()}`;
    const listing = {
      ...cropData,
      id: newId,
      createdAt: new Date().toISOString(),
      status: cropData.status || 'available',
    };
    await setDoc(doc(db, CROPS_COL, newId), listing);
    return { success: true, listing };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function firebaseUpdateCropListing(listingId, updates) {
  try {
    await updateDoc(doc(db, CROPS_COL, listingId), {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function firebaseDeleteCropListing(listingId) {
  try {
    await deleteDoc(doc(db, CROPS_COL, listingId));
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// -------------------------------------------------------------
// ORDERS & BIDS CRUD
// -------------------------------------------------------------

export async function firebaseCreateOrder(orderData) {
  try {
    const newId = orderData.id || `ord-${Date.now()}`;
    const order = {
      ...orderData,
      id: newId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: orderData.status || 'pending',
    };
    await setDoc(doc(db, ORDERS_COL, newId), order);
    return { success: true, order };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function firebaseUpdateOrder(orderId, updates) {
  try {
    await updateDoc(doc(db, ORDERS_COL, orderId), {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function firebaseDeleteOrder(orderId) {
  try {
    await deleteDoc(doc(db, ORDERS_COL, orderId));
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// -------------------------------------------------------------
// AGRI-WASTE CRUD OPERATIONS
// -------------------------------------------------------------

export async function firebaseAddAgriWaste(wasteData) {
  try {
    const newId = wasteData.id || `waste-${Date.now()}`;
    const waste = {
      ...wasteData,
      id: newId,
      createdAt: new Date().toISOString(),
      status: wasteData.status || 'available',
    };
    await setDoc(doc(db, WASTE_COL, newId), waste);
    return { success: true, waste };
  } catch (err) {
    console.error('Firestore add agri-waste error:', err);
    return { success: false, error: err.message };
  }
}

export async function firebaseUpdateAgriWaste(wasteId, updates) {
  try {
    await updateDoc(doc(db, WASTE_COL, wasteId), {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
    return { success: true };
  } catch (err) {
    console.error('Firestore update agri-waste error:', err);
    return { success: false, error: err.message };
  }
}

export async function firebaseDeleteAgriWaste(wasteId) {
  try {
    await deleteDoc(doc(db, WASTE_COL, wasteId));
    return { success: true };
  } catch (err) {
    console.error('Firestore delete agri-waste error:', err);
    return { success: false, error: err.message };
  }
}

// -------------------------------------------------------------
// GOVERNMENT SCHEME APPLICATIONS CRUD OPERATIONS
// -------------------------------------------------------------

export async function firebaseSubmitSchemeApplication(appData) {
  try {
    const newId = appData.id || `app-${Date.now()}`;
    const application = {
      ...appData,
      id: newId,
      appliedDate: appData.appliedDate || new Date().toISOString().split('T')[0],
      lastUpdated: new Date().toISOString(),
      status: appData.status || 'applied',
      referenceNumber: appData.referenceNumber || `GOV-MH-${Math.floor(100000 + Math.random() * 900000)}`,
      stageHistory: appData.stageHistory || [
        { stage: 'Application Registered', date: new Date().toISOString().split('T')[0], completed: true },
        { stage: 'Aadhaar e-KYC & Land Record Matching', date: 'In Progress', completed: false },
        { stage: 'Field Inspector Physical Verification', date: 'Pending', completed: false },
        { stage: 'DBT Bank Disbursement Order', date: 'Pending', completed: false },
      ],
    };

    await setDoc(doc(db, APPLICATIONS_COL, newId), application);
    return { success: true, application };
  } catch (err) {
    console.error('Firestore submit scheme application error:', err);
    return { success: false, error: err.message };
  }
}

export async function firebaseUpdateApplicationStatus(appId, newStatus, notes = '') {
  try {
    const updates = {
      status: newStatus,
      lastUpdated: new Date().toISOString(),
    };
    if (notes) updates.notes = notes;
    await updateDoc(doc(db, APPLICATIONS_COL, appId), updates);
    return { success: true };
  } catch (err) {
    console.error('Firestore update application status error:', err);
    return { success: false, error: err.message };
  }
}

export async function firebaseWithdrawApplication(appId) {
  try {
    await deleteDoc(doc(db, APPLICATIONS_COL, appId));
    return { success: true };
  } catch (err) {
    console.error('Firestore withdraw application error:', err);
    return { success: false, error: err.message };
  }
}

// Reset entire database back to default demo state
export async function firebaseResetDemoState() {
  try {
    // 1. Clear users & reseed
    const uSnap = await getDocs(collection(db, USERS_COL));
    for (const d of uSnap.docs) await deleteDoc(d.ref);
    for (const u of SEED_USERS) await setDoc(doc(db, USERS_COL, u.id), u);

    // 2. Clear crops & reseed
    const cSnap = await getDocs(collection(db, CROPS_COL));
    for (const d of cSnap.docs) await deleteDoc(d.ref);
    for (const c of INITIAL_PRODUCE_LISTINGS) await setDoc(doc(db, CROPS_COL, c.id), c);

    // 3. Clear orders & reseed
    const oSnap = await getDocs(collection(db, ORDERS_COL));
    for (const d of oSnap.docs) await deleteDoc(d.ref);
    for (const o of INITIAL_PURCHASE_ORDERS) await setDoc(doc(db, ORDERS_COL, o.id), o);

    // 4. Clear mandi & reseed
    const mSnap = await getDocs(collection(db, MANDI_COL));
    for (const d of mSnap.docs) await deleteDoc(d.ref);
    for (const m of INITIAL_MANDI_RATES) await setDoc(doc(db, MANDI_COL, m.id), m);

    // 5. Clear agri-waste & reseed
    const wSnap = await getDocs(collection(db, WASTE_COL));
    for (const d of wSnap.docs) await deleteDoc(d.ref);
    for (const w of INITIAL_AGRI_WASTE) await setDoc(doc(db, WASTE_COL, w.id), w);

    // 6. Clear schemes & reseed
    const sSnap = await getDocs(collection(db, SCHEMES_COL));
    for (const d of sSnap.docs) await deleteDoc(d.ref);
    for (const s of INITIAL_GOVT_SCHEMES) await setDoc(doc(db, SCHEMES_COL, s.id), s);

    // 7. Clear applications & reseed
    const aSnap = await getDocs(collection(db, APPLICATIONS_COL));
    for (const d of aSnap.docs) await deleteDoc(d.ref);
    for (const a of INITIAL_SCHEME_APPLICATIONS) await setDoc(doc(db, APPLICATIONS_COL, a.id), a);

    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}
