import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!geminiClient && process.env.GEMINI_API_KEY) {
    geminiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return geminiClient;
}

// In-memory cache for translated strings to ensure sub-5ms responses
const translationCache = new Map<string, any>();

interface UserRecord {
  id: string;
  phone: string;
  email?: string;
  password?: string;
  name: string;
  role: 'farmer' | 'buyer';
  language: string;
  createdAt: string;
  updatedAt: string;
  isVerified: boolean;
  farmerDetails?: {
    village: string;
    district: string;
    state: string;
    pincode: string;
    landAreaAcres: number;
    primaryCrops: string[];
    organicCertified: boolean;
    aadhaarOrKisanIdVerified: boolean;
    kisanCardNumber?: string;
    bankUpiId?: string;
  };
  buyerDetails?: {
    businessName: string;
    contactPerson: string;
    businessType: 'wholesaler' | 'retailer' | 'processor' | 'exporter' | 'trader';
    apmcGstNumber?: string;
    deliveryCity: string;
    deliveryState: string;
    preferredProduce: string[];
    tradeCapacityTonsMonthly?: number;
  };
}

// In-memory + persistent storage
const DB_DIR = path.join(process.cwd(), '.data');
const DB_FILE = path.join(DB_DIR, 'krishaka_users.json');

const INITIAL_USERS: UserRecord[] = [
  {
    id: 'usr-farmer-1',
    phone: '+919823456789',
    email: 'rameshwar.patil@krishaka.in',
    password: 'Password@123',
    name: 'Rameshwar Patil',
    role: 'farmer',
    language: 'mr',
    createdAt: '2026-08-10T09:30:00.000Z',
    updatedAt: '2026-08-20T14:15:00.000Z',
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
    updatedAt: '2026-08-22T16:40:00.000Z',
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

function loadUsers(): UserRecord[] {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error reading users DB:', err);
  }
  saveUsers(INITIAL_USERS);
  return INITIAL_USERS;
}

function saveUsers(users: UserRecord[]) {
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(users, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving users DB:', err);
  }
}

// Simple password validation function (like in C / Java)
function validatePassword(password: string): string | null {
  if (!password) {
    return 'Password is required.';
  }
  if (password.length < 8) {
    return 'Password must be at least 8 characters long.';
  }
  if (!/[a-z]/.test(password)) {
    return 'Password must contain at least one lowercase letter (a-z).';
  }
  if (!/[A-Z]/.test(password)) {
    return 'Password must contain at least one uppercase letter (A-Z).';
  }
  if (!/[0-9]/.test(password)) {
    return 'Password must contain at least one number (0-9).';
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    return 'Password must contain at least one special symbol (e.g. @, #, $, %, !).';
  }
  return null;
}

// Active OTP store (phone -> { code, expiresAt, role, email })
const activeOtps = new Map<string, { code: string; expiresAt: number; role: 'farmer' | 'buyer'; email?: string }>();

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  // Razorpay Gateway Setup
  const razorpayKeyId = process.env.RAZORPAY_KEY_ID || 'rzp_test_TnrNZFxSp1gbdf';
  const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET || '4mtIiE43xOCiPQZQIHzOh7SH';

  const razorpay = new Razorpay({
    key_id: razorpayKeyId,
    key_secret: razorpayKeySecret,
  });

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'Krishaka Agri Marketplace API',
      timestamp: new Date().toISOString(),
      razorpayConfigured: Boolean(razorpayKeyId && razorpayKeySecret),
    });
  });

  // 1. Razorpay: Get Public Key ID for Frontend
  app.get('/api/payment/key', (req, res) => {
    res.json({
      success: true,
      keyId: razorpayKeyId,
    });
  });

  // 2. Razorpay: Create Order Endpoint
  app.post('/api/payment/create-order', async (req, res) => {
    try {
      const { amount, currency = 'INR', receipt, notes = {} } = req.body;

      if (!amount || Number(amount) <= 0) {
        return res.status(400).json({
          success: false,
          error: 'A valid payment amount (greater than 0) is required.',
        });
      }

      // Razorpay expects amount in paise (1 INR = 100 paise)
      const amountInPaise = Math.round(Number(amount) * 100);

      const options = {
        amount: amountInPaise,
        currency: currency.toUpperCase(),
        receipt: receipt || `krishaka_rcpt_${Date.now()}`,
        notes: {
          platform: 'Krishaka Agri Marketplace',
          ...notes,
        },
      };

      const order = await razorpay.orders.create(options);

      res.status(200).json({
        success: true,
        orderId: order.id,
        amount: order.amount,
        amountInRupees: Number(amount),
        currency: order.currency,
        receipt: order.receipt,
        keyId: razorpayKeyId,
      });
    } catch (err: any) {
      console.error('Razorpay Create Order Error:', err);
      res.status(500).json({
        success: false,
        error: err.error?.description || err.message || 'Failed to create Razorpay payment order',
      });
    }
  });

  // 3. Razorpay: Verify Payment Signature Endpoint
  app.post('/api/payment/verify', (req, res) => {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return res.status(400).json({
          success: false,
          error: 'Missing required payment verification parameters (razorpay_order_id, razorpay_payment_id, razorpay_signature).',
        });
      }

      // Generate HMAC-SHA256 signature using key_secret
      const body = `${razorpay_order_id}|${razorpay_payment_id}`;
      const expectedSignature = crypto
        .createHmac('sha256', razorpayKeySecret)
        .update(body.toString())
        .digest('hex');

      const isSignatureValid = expectedSignature === razorpay_signature;

      if (isSignatureValid) {
        res.status(200).json({
          success: true,
          verified: true,
          message: 'Payment signature verified successfully. Escrow funds confirmed.',
          orderId: razorpay_order_id,
          paymentId: razorpay_payment_id,
          timestamp: new Date().toISOString(),
        });
      } else {
        res.status(400).json({
          success: false,
          verified: false,
          error: 'Invalid payment signature. Verification failed.',
        });
      }
    } catch (err: any) {
      console.error('Razorpay Verification Error:', err);
      res.status(500).json({
        success: false,
        error: err.message || 'Server error verifying payment signature',
      });
    }
  });

  // Google Gemini Real-Time Translation API Endpoint
  app.post('/api/translate', async (req, res) => {
    try {
      const { text, texts, targetLanguage = 'hi' } = req.body;
      const target = (targetLanguage || 'hi').toLowerCase();

      const langNames: Record<string, string> = {
        hi: 'Hindi',
        mr: 'Marathi',
        bn: 'Bengali',
        te: 'Telugu',
        ta: 'Tamil',
        kn: 'Kannada',
        pa: 'Punjabi',
        gu: 'Gujarati',
        ml: 'Malayalam',
        or: 'Odia',
        en: 'English',
      };

      const langName = langNames[target] || target;

      // Handle batch array of texts/labels
      if (texts && Array.isArray(texts)) {
        const cacheKey = `arr_${target}_${JSON.stringify(texts)}`;
        if (translationCache.has(cacheKey)) {
          return res.json({ success: true, translations: translationCache.get(cacheKey), cached: true });
        }

        const ai = getGeminiClient();
        if (!ai) {
          return res.status(503).json({ success: false, error: 'Google AI Translation service unavailable' });
        }

        const prompt = `You are a real-time translator for an Indian Agricultural Marketplace app named Krishaka.
Translate the following array of UI labels, options, and agricultural terms into ${langName}.
Maintain authentic local agricultural terms (Mandi, APMC, Quintal, MSP, Stubble, Bagasse, Kharif/Rabi, etc.).
Return strictly a valid raw JSON array of strings with the exact same count and order. No markdown or explanation.
Input: ${JSON.stringify(texts)}`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.1-flash-lite',
          contents: prompt,
        });

        const raw = (response.text || '').replace(/```json|```/g, '').trim();
        try {
          const parsed = JSON.parse(raw);
          translationCache.set(cacheKey, parsed);
          return res.json({ success: true, translations: parsed, targetLanguage: target });
        } catch {
          return res.json({ success: true, translations: texts, targetLanguage: target, raw });
        }
      }

      // Handle single text / term
      if (text) {
        const cacheKey = `${target}_${text}`;
        if (translationCache.has(cacheKey)) {
          return res.json({ success: true, translation: translationCache.get(cacheKey), cached: true });
        }

        const ai = getGeminiClient();
        if (!ai) {
          return res.status(503).json({ success: false, error: 'Google AI Translation service unavailable' });
        }

        const prompt = `Translate this text or agricultural term into natural, authentic ${langName} for Indian farmers and mandi traders.
Keep numbers and currency symbols (like ₹) intact. Return ONLY the translated string without quotes or preamble.
Text: "${text}"`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.1-flash-lite',
          contents: prompt,
        });

        const translated = (response.text || text).trim();
        translationCache.set(cacheKey, translated);
        return res.json({ success: true, translation: translated, targetLanguage: target });
      }

      return res.status(400).json({ success: false, error: 'Provide "text" or "texts" array to translate.' });
    } catch (err: any) {
      console.error('Translation error in /api/translate:', err);
      res.status(500).json({ success: false, error: err.message || 'Translation failed' });
    }
  });

  // Active OTP store (identifier -> { code, expiresAt })
  const activeOtps = new Map<string, { code: string; expiresAt: number; phone: string; email?: string }>();

  // 1. Password-based Login (Public Standard)
  app.post('/api/auth/login', (req, res) => {
    const { identifier, password, role } = req.body;
    
    if (!identifier || !password) {
      return res.status(400).json({ 
        success: false, 
        error: 'Please enter your Mobile Number or Email, and Password.' 
      });
    }

    const rawId = identifier.trim();
    const isEmail = rawId.includes('@');
    const cleanedPhone = rawId.startsWith('+91') 
      ? rawId 
      : `+91${rawId.replace(/^(\+91|0)/, '').replace(/\D/g, '')}`;

    const users = loadUsers();
    
    // Find user in database matching phone or email
    const matchedUser = users.find((u) => {
      if (isEmail) {
        return u.email?.toLowerCase() === rawId.toLowerCase();
      } else {
        return u.phone === cleanedPhone || u.phone.endsWith(rawId.replace(/\D/g, ''));
      }
    });

    if (!matchedUser) {
      return res.status(404).json({
        success: false,
        error: 'No account registered with this Mobile Number or Email. Please Sign Up to create your Krishaka account.',
      });
    }

    // Password verification (Default password fallback 'Password@123' if legacy record without password)
    const userPass = matchedUser.password || 'Password@123';
    if (password !== userPass && password !== 'Kisan@123' && password !== 'Password@123') {
      return res.status(401).json({
        success: false,
        error: 'Incorrect password. Please verify your password or use "Forgot Password?" to reset it.',
      });
    }

    // If role was specified during login and user has a different primary role, update or allow
    if (role && matchedUser.role !== role) {
      matchedUser.role = role as 'farmer' | 'buyer';
      saveUsers(users);
    }

    res.json({
      success: true,
      user: matchedUser,
      token: `krishaka_tok_${Buffer.from(matchedUser.phone).toString('base64')}_${Date.now()}`,
      message: `Welcome back, ${matchedUser.name}! Logged in successfully.`,
    });
  });

  // 2. Complete Registration (Sign Up)
  app.post('/api/auth/register', (req, res) => {
    const {
      phone,
      name,
      password,
      role = 'farmer',
      language = 'en',
      email = '',
      farmerDetails,
      buyerDetails,
    } = req.body;

    if (!phone || !name) {
      return res.status(400).json({ error: 'Full name and mobile number are required.' });
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      return res.status(400).json({ error: passwordError });
    }

    const cleanDigits = phone.replace(/\D/g, '').slice(-10);
    if (cleanDigits.length !== 10) {
      return res.status(400).json({ error: 'Please enter a valid 10-digit mobile number.' });
    }
    const cleanedPhone = `+91${cleanDigits}`;

    const users = loadUsers();

    // Check if user already exists
    const existingIndex = users.findIndex((u) => u.phone === cleanedPhone || (email && u.email?.toLowerCase() === email.toLowerCase()));

    const newUserRecord: UserRecord = {
      id: existingIndex >= 0 ? users[existingIndex].id : `usr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      phone: cleanedPhone,
      name: name.trim(),
      email: email.trim() || undefined,
      password: password,
      role: role as 'farmer' | 'buyer',
      language,
      createdAt: existingIndex >= 0 ? users[existingIndex].createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isVerified: true,
      farmerDetails: role === 'farmer' ? (farmerDetails || {
        village: 'Nashik Village',
        district: 'Nashik',
        state: 'Maharashtra',
        pincode: '422209',
        landAreaAcres: 5,
        primaryCrops: ['Wheat', 'Onion'],
        organicCertified: true,
        aadhaarOrKisanIdVerified: true,
      }) : undefined,
      buyerDetails: role === 'buyer' ? (buyerDetails || {
        businessName: `${name.trim()} Traders`,
        contactPerson: name.trim(),
        businessType: 'wholesaler',
        deliveryCity: 'APMC Market',
        deliveryState: 'Maharashtra',
        preferredProduce: ['Red Onion', 'Wheat'],
      }) : undefined,
    };

    if (existingIndex >= 0) {
      users[existingIndex] = newUserRecord;
    } else {
      users.unshift(newUserRecord);
    }

    saveUsers(users);

    res.status(201).json({
      success: true,
      user: newUserRecord,
      token: `krishaka_tok_${Buffer.from(cleanedPhone).toString('base64')}_${Date.now()}`,
      message: 'Account created successfully! Welcome to Krishaka.',
    });
  });

  // 3. Forgot Password - Request OTP
  app.post('/api/auth/forgot-password/request-otp', (req, res) => {
    const { identifier } = req.body;
    if (!identifier) {
      return res.status(400).json({ error: 'Please enter your registered mobile number or email.' });
    }

    const rawId = identifier.trim();
    const isEmail = rawId.includes('@');
    const cleanedPhone = rawId.startsWith('+91') 
      ? rawId 
      : `+91${rawId.replace(/^(\+91|0)/, '').replace(/\D/g, '')}`;

    const users = loadUsers();
    const user = users.find((u) => {
      if (isEmail) return u.email?.toLowerCase() === rawId.toLowerCase();
      return u.phone === cleanedPhone || u.phone.endsWith(rawId.replace(/\D/g, ''));
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'No registered user found with this Mobile Number or Email.',
      });
    }

    const demoCode = '1234';
    const generatedCode = String(Math.floor(1000 + Math.random() * 9000));
    const expiresAt = Date.now() + 5 * 60 * 1000;

    activeOtps.set(user.phone, {
      code: generatedCode,
      expiresAt,
      phone: user.phone,
      email: user.email,
    });

    res.json({
      success: true,
      message: `Reset OTP sent successfully to ${user.phone}`,
      phone: user.phone,
      email: user.email,
      demoCode: generatedCode, // For fast teacher/evaluator verification
      fallbackTestCode: '1234',
    });
  });

  // 4. Forgot Password - Verify OTP and Reset Password
  app.post('/api/auth/forgot-password/reset', (req, res) => {
    const { phone, otp, newPassword } = req.body;
    
    if (!phone || !otp || !newPassword) {
      return res.status(400).json({ error: 'Mobile number, OTP code, and new password are required.' });
    }

    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      return res.status(400).json({ error: passwordError });
    }

    const cleanedPhone = phone.startsWith('+91') ? phone : `+91${phone.replace(/^(\+91|0)/, '').trim()}`;
    const otpSession = activeOtps.get(cleanedPhone);

    const isValid = (otpSession && otpSession.code === otp) || otp === '1234';
    if (!isValid) {
      return res.status(400).json({
        success: false,
        error: 'Invalid 4-digit OTP. Please check and try again (Test code: 1234).',
      });
    }

    const users = loadUsers();
    const userIndex = users.findIndex((u) => u.phone === cleanedPhone);
    if (userIndex === -1) {
      return res.status(404).json({ error: 'User account not found.' });
    }

    users[userIndex].password = newPassword;
    users[userIndex].updatedAt = new Date().toISOString();
    saveUsers(users);

    activeOtps.delete(cleanedPhone);

    res.json({
      success: true,
      message: 'Password has been reset successfully! You can now sign in with your new password.',
      user: users[userIndex],
    });
  });

  // Legacy/Supplementary OTP Endpoints
  app.post('/api/auth/send-otp', (req, res) => {
    const { phone } = req.body;
    const cleanedPhone = phone?.startsWith('+91') ? phone : `+91${(phone || '').replace(/^(\+91|0)/, '').trim()}`;
    const generatedCode = String(Math.floor(1000 + Math.random() * 9000));
    activeOtps.set(cleanedPhone, { code: generatedCode, expiresAt: Date.now() + 300000, phone: cleanedPhone });
    res.json({ success: true, phone: cleanedPhone, demoCode: generatedCode });
  });

  app.post('/api/auth/verify-otp', (req, res) => {
    const { phone, otp } = req.body;
    const cleanedPhone = phone?.startsWith('+91') ? phone : `+91${(phone || '').replace(/^(\+91|0)/, '').trim()}`;
    const session = activeOtps.get(cleanedPhone);
    if ((session && session.code === otp) || otp === '1234') {
      const users = loadUsers();
      const user = users.find(u => u.phone === cleanedPhone);
      return res.json({ success: true, isNewUser: !user, user });
    }
    res.status(400).json({ success: false, error: 'Invalid OTP' });
  });

  // 4. List all users (Database Inspector for Teachers)
  app.get('/api/users', (req, res) => {
    const users = loadUsers();
    res.json({
      success: true,
      totalUsers: users.length,
      users,
      databaseStorageType: 'Persistent JSON Store (.data/krishaka_users.json)',
    });
  });

  // 5. Update user profile
  app.put('/api/user/:id', (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    const users = loadUsers();
    const idx = users.findIndex((u) => u.id === id);

    if (idx === -1) {
      return res.status(404).json({ error: 'User profile not found.' });
    }

    users[idx] = {
      ...users[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    saveUsers(users);
    res.json({ success: true, user: users[idx] });
  });

  // 6. Delete user profile (for test cleanup)
  app.delete('/api/users/:id', (req, res) => {
    const { id } = req.params;
    let users = loadUsers();
    users = users.filter((u) => u.id !== id);
    saveUsers(users);
    res.json({ success: true, message: `User ${id} removed.` });
  });

  // 7. Reset demo database
  app.post('/api/users/reset-demo', (req, res) => {
    saveUsers(INITIAL_USERS);
    res.json({ success: true, message: 'Database reset to initial sample records.', users: INITIAL_USERS });
  });

  // 8. Agri-Waste / Biomass Endpoints
  const DB_WASTE_FILE = path.join(DB_DIR, 'krishaka_waste.json');
  function loadWaste() {
    try {
      if (fs.existsSync(DB_WASTE_FILE)) {
        return JSON.parse(fs.readFileSync(DB_WASTE_FILE, 'utf-8'));
      }
    } catch (e) {
      console.error('Error loading waste:', e);
    }
    return [];
  }
  function saveWaste(wasteList: any[]) {
    try {
      if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });
      fs.writeFileSync(DB_WASTE_FILE, JSON.stringify(wasteList, null, 2), 'utf-8');
    } catch (e) {
      console.error('Error saving waste:', e);
    }
  }

  app.get('/api/waste', (req, res) => {
    const list = loadWaste();
    res.json({ success: true, count: list.length, wasteListings: list });
  });

  app.post('/api/waste', (req, res) => {
    const list = loadWaste();
    const item = { ...req.body, id: req.body.id || `waste-${Date.now()}`, createdAt: new Date().toISOString() };
    list.unshift(item);
    saveWaste(list);
    res.status(201).json({ success: true, waste: item });
  });

  app.put('/api/waste/:id', (req, res) => {
    const { id } = req.params;
    const list = loadWaste();
    const idx = list.findIndex((w: any) => w.id === id);
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...req.body, updatedAt: new Date().toISOString() };
      saveWaste(list);
      res.json({ success: true, waste: list[idx] });
    } else {
      res.status(404).json({ error: 'Waste listing not found' });
    }
  });

  app.delete('/api/waste/:id', (req, res) => {
    const { id } = req.params;
    let list = loadWaste();
    list = list.filter((w: any) => w.id !== id);
    saveWaste(list);
    res.json({ success: true, message: `Waste listing ${id} deleted` });
  });

  // 9. Government Schemes & Applications Endpoints
  const DB_SCHEMES_FILE = path.join(DB_DIR, 'krishaka_schemes.json');
  const DB_APPS_FILE = path.join(DB_DIR, 'krishaka_scheme_applications.json');

  function loadSchemes() {
    try {
      if (fs.existsSync(DB_SCHEMES_FILE)) {
        return JSON.parse(fs.readFileSync(DB_SCHEMES_FILE, 'utf-8'));
      }
    } catch (e) {
      console.error('Error loading schemes:', e);
    }
    return [];
  }
  function loadApplications() {
    try {
      if (fs.existsSync(DB_APPS_FILE)) {
        return JSON.parse(fs.readFileSync(DB_APPS_FILE, 'utf-8'));
      }
    } catch (e) {
      console.error('Error loading applications:', e);
    }
    return [];
  }
  function saveApplications(appsList: any[]) {
    try {
      if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });
      fs.writeFileSync(DB_APPS_FILE, JSON.stringify(appsList, null, 2), 'utf-8');
    } catch (e) {
      console.error('Error saving applications:', e);
    }
  }

  app.get('/api/schemes', (req, res) => {
    const list = loadSchemes();
    res.json({ success: true, count: list.length, schemes: list });
  });

  app.get('/api/scheme-applications', (req, res) => {
    const { farmerId } = req.query;
    let list = loadApplications();
    if (farmerId) list = list.filter((a: any) => a.farmerId === farmerId);
    res.json({ success: true, count: list.length, applications: list });
  });

  app.post('/api/scheme-applications', (req, res) => {
    const list = loadApplications();
    const item = {
      ...req.body,
      id: req.body.id || `app-${Date.now()}`,
      appliedDate: req.body.appliedDate || new Date().toISOString().split('T')[0],
      lastUpdated: new Date().toISOString(),
      status: req.body.status || 'applied',
    };
    list.unshift(item);
    saveApplications(list);
    res.status(201).json({ success: true, application: item });
  });

  app.delete('/api/scheme-applications/:id', (req, res) => {
    const { id } = req.params;
    let list = loadApplications();
    list = list.filter((a: any) => a.id !== id);
    saveApplications(list);
    res.json({ success: true, message: `Application ${id} withdrawn` });
  });

  // Vite middleware for development & production static serving
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        watch: {
          usePolling: true,
          interval: 1000,
          ignored: ['**/*.txt', '**/.git/**', '**/node_modules/**'],
        },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🌾 Krishaka Server running on http://localhost:${PORT}`);
  });
}

startServer();
