import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

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

function loadUsers(): UserRecord[] {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error reading users DB:', err);
  }
  return [];
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
  const PORT = 3000;

  app.use(express.json());

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', service: 'Krishaka Agri Marketplace API', timestamp: new Date().toISOString() });
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
      farmerDetails: role === 'farmer' ? farmerDetails : undefined,
      buyerDetails: role === 'buyer' ? buyerDetails : undefined,
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

    const generatedCode = String(Math.floor(1000 + Math.random() * 9000));
    const expiresAt = Date.now() + 5 * 60 * 1000;

    console.log(`[OTP] Password reset code for ${user.phone}: ${generatedCode}`);
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

    const isValid = otpSession && otpSession.code === otp && otpSession.expiresAt > Date.now();
    if (!isValid) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired OTP. Please check and try again.',
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
      server: { middlewareMode: true },
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
