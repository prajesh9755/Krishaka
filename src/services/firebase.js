import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  initializeFirestore,
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
  where,
  writeBatch,
  increment,
} from 'firebase/firestore';

// 1. Initialize Firebase App (values come from .env, see .env.example)
const env = import.meta.env;
const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
  firestoreDatabaseId: env.VITE_FIREBASE_DATABASE_ID,
};
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// 2. Initialize Cloud Firestore with dedicated database instance ID
// ignoreUndefinedProperties: optional form fields left empty are skipped instead of rejected.
export const db = initializeFirestore(app, { ignoreUndefinedProperties: true }, firebaseConfig.firestoreDatabaseId || '(default)');

// Collection references
export const USERS_COL = 'users';
export const CROPS_COL = 'crop_listings';
export const ORDERS_COL = 'orders';
export const WASTE_COL = 'agri_waste_listings';
export const SCHEMES_COL = 'govt_schemes';
export const APPLICATIONS_COL = 'scheme_applications';
export const RETAILERS_COL = 'retailers';
export const CARTS_COL = 'carts';

export const collections = {
  users: collection(db, USERS_COL),
  crops: collection(db, CROPS_COL),
  orders: collection(db, ORDERS_COL),
  waste: collection(db, WASTE_COL),
  schemes: collection(db, SCHEMES_COL),
  applications: collection(db, APPLICATIONS_COL),
  retailers: collection(db, RETAILERS_COL),
};


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

// Customer cart: carts/{userId} = { items: [...] }
export function subscribeToCart(userId, callback) {
  return onSnapshot(
    doc(db, CARTS_COL, userId),
    (snap) => callback(snap.exists() ? snap.data().items || [] : []),
    (err) => console.error('Cart snapshot error:', err)
  );
}

export async function saveCart(userId, items) {
  await setDoc(doc(db, CARTS_COL, userId), { items, updatedAt: new Date().toISOString() });
}

// After a successful payment: one order per cart item (so each farmer sees theirs),
// reduce each listing's stock and empty the cart, all in one atomic batch.
export async function placePaidCustomerOrders(user, items, details, paymentId) {
  const batch = writeBatch(db);
  const now = new Date().toISOString();
  const checkoutId = `chk-${Date.now()}`;
  items.forEach((item, n) => {
    const id = `ord-${Date.now()}-${n}`;
    batch.set(doc(db, ORDERS_COL, id), {
      id,
      checkoutId,
      listingId: item.listingId,
      cropName: item.cropName,
      produceName: item.cropName,
      variety: item.variety,
      imageUrl: item.imageUrl,
      farmerId: item.farmerId,
      farmerName: item.farmerName,
      farmerPhone: item.farmerPhone,
      buyerId: user.id,
      buyerName: details.name,
      buyerPhone: details.phone,
      buyerRole: 'customer',
      quantityKg: item.quantityKg,
      offeredPricePerKg: item.pricePerKg,
      totalAmount: item.quantityKg * item.pricePerKg,
      deliveryLocation: details.address,
      notes: details.note,
      paymentId,
      paymentStatus: 'paid',
      // already paid, so the order starts at "Order Processed"
      status: 'Accepted',
      statusTimes: { Accepted: now },
      orderDate: now.split('T')[0],
      createdAt: now,
      updatedAt: now,
    });
    batch.update(doc(db, CROPS_COL, item.listingId), { quantityKg: increment(-item.quantityKg) });
  });
  batch.set(doc(db, CARTS_COL, user.id), { items: [], updatedAt: now });
  await batch.commit();
  return checkoutId;
}
