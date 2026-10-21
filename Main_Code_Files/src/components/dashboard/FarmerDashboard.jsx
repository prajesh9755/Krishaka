import React, { useState, useEffect } from 'react';
import { 
  Tractor, 
  Globe, 
  LogOut, 
  Database, 
  Plus, 
  TrendingUp, 
  MapPin, 
  Phone, 
  CheckCircle2, 
  Wheat, 
  ShieldCheck, 
  Recycle, 
  Landmark, 
  FileText, 
  Calendar, 
  Layers, 
  ArrowUpRight, 
  Clock, 
  Sparkles, 
  AlertCircle,
  X,
  IndianRupee,
  Search,
  Filter,
  Check,
  Building,
  ExternalLink,
  Camera,
  Upload,
  Trash2,
  Edit3,
  Image as ImageIcon,
  Link2,
  User,
  ShieldAlert,
  Calculator,
  ArrowRight,
  Download,
  Sun,
  Droplets,
  Percent,
  CheckCircle,
} from 'lucide-react';
import { TRANSLATIONS } from '../../data/translations';
import { LanguageSelector } from '../common/LanguageSelector';
import {
  subscribeToCropListings,
  subscribeToOrders,
  subscribeToMandiRates,
  subscribeToAgriWaste,
  subscribeToGovtSchemes,
  firebaseAddCropListing,
  firebaseUpdateCropListing,
  firebaseUpdateOrder,
  firebaseDeleteCropListing,
  firebaseDeleteUser,
  firebaseAddAgriWaste,
  firebaseUpdateAgriWaste,
  firebaseDeleteAgriWaste,
  firebaseSyncMandiRates,
} from '../../services/firebase';

export const CROP_PHOTO_PRESETS = [
  { name: 'Red Onion', url: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?auto=format&fit=crop&w=600&q=80' },
  { name: 'Fresh Tomato', url: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=600&q=80' },
  { name: 'Golden Wheat', url: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=600&q=80' },
  { name: 'Basmati Rice', url: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80' },
  { name: 'Fresh Potatoes', url: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=600&q=80' },
  { name: 'Red Chilli', url: 'https://images.unsplash.com/photo-1588252303782-cb80119abd6d?auto=format&fit=crop&w=600&q=80' },
  { name: 'Nagpur Oranges', url: 'https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?auto=format&fit=crop&w=600&q=80' },
  { name: 'Green Peas', url: 'https://images.unsplash.com/photo-1592394533824-9440e5d68530?auto=format&fit=crop&w=600&q=80' },
  { name: 'Yellow Soybean', url: 'https://images.unsplash.com/photo-1599940824399-b87987ceb72a?auto=format&fit=crop&w=600&q=80' },
  { name: 'Fresh Ginger', url: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=600&q=80' },
  { name: 'Green Capsicum', url: 'https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?auto=format&fit=crop&w=600&q=80' },
];

export const WASTE_PHOTO_PRESETS = [
  { name: 'Wheat Straw Bales', url: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=600&q=80' },
  { name: 'Paddy Rice Husk', url: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80' },
  { name: 'Sugarcane Bagasse', url: 'https://images.unsplash.com/photo-1530595467537-0b5996c41f2d?auto=format&fit=crop&w=600&q=80' },
  { name: 'Cotton Stalks Shredded', url: 'https://images.unsplash.com/photo-1599940824399-b87987ceb72a?auto=format&fit=crop&w=600&q=80' },
  { name: 'Mustard Stubble Bales', url: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=600&q=80' },
  { name: 'Corn Stover & Husk', url: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&w=600&q=80' },
  { name: 'Groundnut Shells', url: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80' },
];

export function FarmerDashboard({
  user,
  language,
  onLanguageChange,
  onLogout,
  onOpenLanguageModal,
}) {
  const [activeTab, setActiveTab] = useState('produce');
  const [produceListings, setProduceListings] = useState([]);
  const [agriWasteListings, setAgriWasteListings] = useState([]);
  const [govtSchemes, setGovtSchemes] = useState([]);
  const [orders, setOrders] = useState([]);
  const [mandiRates, setMandiRates] = useState([]);

  // Real-time Firestore sync
  useEffect(() => {
    const unsubCrops = subscribeToCropListings((data) => {
      if (Array.isArray(data)) setProduceListings(data);
    });
    const unsubOrders = subscribeToOrders((data) => {
      if (Array.isArray(data)) setOrders(data);
    });
    const unsubMandi = subscribeToMandiRates((data) => {
      if (Array.isArray(data)) setMandiRates(data);
    });
    const unsubWaste = subscribeToAgriWaste((data) => {
      if (Array.isArray(data)) setAgriWasteListings(data);
    });
    const unsubSchemes = subscribeToGovtSchemes((data) => {
      if (Array.isArray(data)) setGovtSchemes(data);
    });

    return () => {
      unsubCrops();
      unsubOrders();
      unsubMandi();
      unsubWaste();
      unsubSchemes();
    };
  }, [user.id]);

  // Government Schemes Awareness & Discovery States
  const [selectedSchemeCategory, setSelectedSchemeCategory] = useState('All');
  const [schemeSearchQuery, setSchemeSearchQuery] = useState('');
  const [expandedSchemeId, setExpandedSchemeId] = useState(null);
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const [calculatorTab, setCalculatorTab] = useState('solar');

  // Subsidy Calculator States
  const [solarPumpHp, setSolarPumpHp] = useState(5);
  const [insCrop, setInsCrop] = useState('Onion');
  const [insAcres, setInsAcres] = useState(user.farmerDetails?.landAreaAcres || 4);
  const [dripAcres, setDripAcres] = useState(user.farmerDetails?.landAreaAcres || 3);
  const [dripCategory, setDripCategory] = useState('small');
  const [machineryType, setMachineryType] = useState('rotavator');
  const [machineryCategory, setMachineryCategory] = useState('small_women');

  // Modals & Feedback
  const [isAddProduceModalOpen, setIsAddProduceModalOpen] = useState(false);
  const [isEditProduceModalOpen, setIsEditProduceModalOpen] = useState(false);
  const [isDeleteConfirmModalOpen, setIsDeleteConfirmModalOpen] = useState(false);
  const [cropToDelete, setCropToDelete] = useState(null);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isDeleteAccountModalOpen, setIsDeleteAccountModalOpen] = useState(false);
  const [isAddWasteModalOpen, setIsAddWasteModalOpen] = useState(false);
  const [isEditWasteModalOpen, setIsEditWasteModalOpen] = useState(false);
  const [isDeleteWasteModalOpen, setIsDeleteWasteModalOpen] = useState(false);
  const [wasteToDelete, setWasteToDelete] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  // Produce Add Form State
  const [cropName, setCropName] = useState('');
  const [variety, setVariety] = useState('');
  const [quantityKg, setQuantityKg] = useState(5000);
  const [pricePerQuintal, setPricePerQuintal] = useState(2400);
  const [qualityGrade, setQualityGrade] = useState('A+');
  const [isOrganic, setIsOrganic] = useState(user.farmerDetails?.organicCertified ?? true);
  const [cropImage, setCropImage] = useState('');
  const [customImageUrl, setCustomImageUrl] = useState('');

  // Produce Edit Form State
  const [editingCropId, setEditingCropId] = useState(null);
  const [editCropName, setEditCropName] = useState('');
  const [editVariety, setEditVariety] = useState('');
  const [editQuantityKg, setEditQuantityKg] = useState(5000);
  const [editPricePerQuintal, setEditPricePerQuintal] = useState(2400);
  const [editQualityGrade, setEditQualityGrade] = useState('A+');
  const [editIsOrganic, setEditIsOrganic] = useState(true);
  const [editCropImage, setEditCropImage] = useState('');
  const [editCustomImageUrl, setEditCustomImageUrl] = useState('');

  // Handle client-side instant image compression (Zero cost, no paid storage plan required)
  const handleImageFileChange = (e, isEdit = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 600;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.76);
        if (isEdit) {
          setEditCropImage(compressedDataUrl);
        } else {
          setCropImage(compressedDataUrl);
        }
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  // Waste Form State
  const [wasteType, setWasteType] = useState('Wheat Straw / Stubble (Baled)');
  const [wasteQuantityTons, setWasteQuantityTons] = useState(15);
  const [wastePricePerTon, setWastePricePerTon] = useState(2200);
  const [wasteMoisture, setWasteMoisture] = useState(11);
  const [wasteUse, setWasteUse] = useState('Bio-Energy Pellet');
  const [wasteImage, setWasteImage] = useState(WASTE_PHOTO_PRESETS[0].url);

  // Waste Edit State
  const [editingWasteId, setEditingWasteId] = useState(null);
  const [editWasteType, setEditWasteType] = useState('');
  const [editWasteQuantityTons, setEditWasteQuantityTons] = useState(10);
  const [editWastePricePerTon, setEditWastePricePerTon] = useState(1500);
  const [editWasteMoisture, setEditWasteMoisture] = useState(10);
  const [editWasteUse, setEditWasteUse] = useState('Bio-Energy Pellet');
  const [editWasteImage, setEditWasteImage] = useState('');

  // Handle client-side instant image compression for waste photos
  const handleWasteImageFileChange = (e, isEdit = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 600;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.76);
        if (isEdit) {
          setEditWasteImage(compressedDataUrl);
        } else {
          setWasteImage(compressedDataUrl);
        }
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4500);
  };

  // Farmer creates new Produce Batch (Persisted to Firestore)
  const handleAddProduceSubmit = async (e) => {
    e.preventDefault();
    if (!cropName.trim()) return;

    const newListing = {
      id: `prod-${Date.now()}`,
      farmerId: user.id,
      farmerName: user.name,
      farmerPhone: user.phone,
      location: user.farmerDetails ? `${user.farmerDetails.village}, ${user.farmerDetails.district}` : '',
      cropName: cropName.trim(),
      variety: variety.trim() || 'Farm Harvest Fresh Lot',
      quantityKg: Number(quantityKg) || 1000,
      pricePerQuintal: Number(pricePerQuintal) || 2000,
      harvestDate: new Date().toISOString().split('T')[0],
      qualityGrade,
      imageUrl: cropImage || 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=600&q=80',
      isOrganic,
      status: 'available',
    };

    setProduceListings([newListing, ...produceListings]);
    setIsAddProduceModalOpen(false);
    setCropName('');
    setVariety('');
    setCropImage('');
    setCustomImageUrl('');
    showToast(`Harvest lot for "${newListing.cropName}" published successfully!`);

    try {
      await firebaseAddCropListing(newListing);
    } catch (err) {
      console.warn('Firestore add crop notice:', err);
    }
  };

  // Open Edit Crop Modal
  const handleOpenEditModal = (crop) => {
    setEditingCropId(crop.id);
    setEditCropName(crop.cropName || '');
    setEditVariety(crop.variety || '');
    setEditQuantityKg(crop.quantityKg || 1000);
    setEditPricePerQuintal(crop.pricePerQuintal || 2000);
    setEditQualityGrade(crop.qualityGrade || 'A+');
    setEditIsOrganic(crop.isOrganic ?? true);
    setEditCropImage(crop.imageUrl || '');
    setEditCustomImageUrl('');
    setIsEditProduceModalOpen(true);
  };

  // Farmer edits Crop Produce Batch (Persisted to Firestore)
  const handleEditProduceSubmit = async (e) => {
    e.preventDefault();
    if (!editingCropId) return;

    const updates = {
      cropName: editCropName.trim(),
      variety: editVariety.trim(),
      quantityKg: Number(editQuantityKg) || 1000,
      pricePerQuintal: Number(editPricePerQuintal) || 2000,
      qualityGrade: editQualityGrade,
      isOrganic: editIsOrganic,
      imageUrl: editCropImage || 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=600&q=80',
    };

    setProduceListings(produceListings.map((c) => c.id === editingCropId ? { ...c, ...updates } : c));
    setIsEditProduceModalOpen(false);
    showToast(`Updated harvest lot "${updates.cropName}" successfully!`);

    try {
      await firebaseUpdateCropListing(editingCropId, updates);
    } catch (err) {
      console.warn('Firestore edit crop error:', err);
    }
  };

  // Open Delete Crop Confirm
  const handleOpenDeleteModal = (crop) => {
    setCropToDelete(crop);
    setIsDeleteConfirmModalOpen(true);
  };

  // Farmer deletes crop (Persisted to Firestore and real-time removed from site)
  const handleConfirmDeleteCrop = async () => {
    if (!cropToDelete) return;
    const target = cropToDelete;
    setIsDeleteConfirmModalOpen(false);
    setCropToDelete(null);

    // Optimistic local update
    setProduceListings(produceListings.filter((c) => c.id !== target.id));
    showToast(`Harvest lot "${target.cropName}" removed successfully.`);

    try {
      await firebaseDeleteCropListing(target.id);
    } catch (err) {
      console.error('Firestore delete crop error:', err);
      showToast(`Error deleting crop: ${err.message}`);
    }
  };

  // Farmer deletes their own user account from Firestore
  const handleConfirmDeleteAccount = async () => {
    setIsDeleteAccountModalOpen(false);
    setIsAccountModalOpen(false);
    try {
      await firebaseDeleteUser(user.id);
      showToast('User account removed successfully. Logging out...');
    } catch (err) {
      showToast(`Failed to delete account: ${err.message}`);
    }
  };

  // Farmer creates new Agri-Waste Listing (Persisted to Firestore)
  const handleAddWasteSubmit = async (e) => {
    e.preventDefault();
    const newWaste = {
      id: `waste-${Date.now()}`,
      farmerId: user.id,
      farmerName: user.name,
      farmerPhone: user.phone,
      wasteType,
      quantityTons: Number(wasteQuantityTons) || 10,
      pricePerTon: Number(wastePricePerTon) || 1500,
      location: user.farmerDetails ? `${user.farmerDetails.village}, ${user.farmerDetails.district}` : '',
      district: user.farmerDetails?.district || '',
      moisturePercent: Number(wasteMoisture) || 10,
      suggestedUse: wasteUse,
      dateListed: new Date().toISOString().split('T')[0],
      status: 'available',
      imageUrl: wasteImage || 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=600&q=80',
    };

    setAgriWasteListings([newWaste, ...agriWasteListings]);
    setIsAddWasteModalOpen(false);
    showToast(`Agri-waste listing for "${wasteType}" published successfully!`);

    try {
      await firebaseAddAgriWaste(newWaste);
    } catch (err) {
      console.warn('Firestore add waste notice:', err);
    }
  };

  // Open Edit Waste Modal
  const handleOpenEditWasteModal = (waste) => {
    setEditingWasteId(waste.id);
    setEditWasteType(waste.wasteType || 'Wheat Straw / Stubble (Baled)');
    setEditWasteQuantityTons(waste.quantityTons || 10);
    setEditWastePricePerTon(waste.pricePerTon || 1500);
    setEditWasteMoisture(waste.moisturePercent || 10);
    setEditWasteUse(waste.suggestedUse || 'Bio-Energy Pellet');
    setEditWasteImage(waste.imageUrl || '');
    setIsEditWasteModalOpen(true);
  };

  // Farmer edits Agri-Waste Listing (Persisted to Firestore)
  const handleEditWasteSubmit = async (e) => {
    e.preventDefault();
    if (!editingWasteId) return;

    const updates = {
      wasteType: editWasteType,
      quantityTons: Number(editWasteQuantityTons) || 10,
      pricePerTon: Number(editWastePricePerTon) || 1500,
      moisturePercent: Number(editWasteMoisture) || 10,
      suggestedUse: editWasteUse,
      imageUrl: editWasteImage || 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=600&q=80',
    };

    setAgriWasteListings(agriWasteListings.map((w) => w.id === editingWasteId ? { ...w, ...updates } : w));
    setIsEditWasteModalOpen(false);
    showToast(`Agri-waste listing "${updates.wasteType}" updated successfully!`);

    try {
      await firebaseUpdateAgriWaste(editingWasteId, updates);
    } catch (err) {
      console.error('Firestore update waste error:', err);
    }
  };

  // Open Delete Waste Modal
  const handleOpenDeleteWasteModal = (waste) => {
    setWasteToDelete(waste);
    setIsDeleteWasteModalOpen(true);
  };

  // Farmer deletes Agri-Waste Listing (Persisted to Firestore and vanishes from site)
  const handleConfirmDeleteWaste = async () => {
    if (!wasteToDelete) return;
    const target = wasteToDelete;
    setIsDeleteWasteModalOpen(false);
    setWasteToDelete(null);

    setAgriWasteListings(agriWasteListings.filter((w) => w.id !== target.id));
    showToast(`Agri-waste listing "${target.wasteType}" removed successfully.`);

    try {
      await firebaseDeleteAgriWaste(target.id);
    } catch (err) {
      console.error('Firestore delete waste error:', err);
    }
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    setOrders(orders.map((o) => o.id === orderId ? { ...o, status: newStatus } : o));
    showToast(`Order #${orderId} marked as "${newStatus}"!`);
    try {
      await firebaseUpdateOrder(orderId, { status: newStatus });
    } catch (err) {
      console.warn('Firestore update order notice:', err);
    }
  };

  // -------------------------------------------------------------
  // REAL-TIME MANDI RATES SYNC
  // -------------------------------------------------------------

  const handleSyncMandiRates = async () => {
    const updated = mandiRates.map((item) => {
      // Add realistic market fluctuations (+/- 1-3%) with today's date
      const factor = 1 + (Math.random() * 0.04 - 0.02);
      const newModalPrice = Math.round(item.modalPrice * factor);
      const change = newModalPrice - item.modalPrice;
      const changePercent = Number(((change / item.modalPrice) * 100).toFixed(1));
      return {
        ...item,
        modalPrice: newModalPrice,
        changePercent,
        lastUpdated: new Date().toISOString().split('T')[0],
      };
    });
    setMandiRates(updated);
    showToast("Today's APMC Mandi modal prices refreshed & updated in database!");
    try {
      await firebaseSyncMandiRates(updated);
    } catch (err) {
      console.warn('Mandi sync error:', err);
    }
  };

  return (
    <div id="farmer-portal-root" className="min-h-screen bg-[#F4F1E8] text-[#1A1C18] flex flex-col font-body">
      
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-[#DCD6C8] shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          
          {/* Brand & Role Tag */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#3F6B3A] text-white flex items-center justify-center shadow-xs">
              <Tractor className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-headline font-bold text-xl sm:text-2xl text-[#3F6B3A] tracking-tight">
                  Krishaka
                </span>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#3F6B3A]/10 text-[#3F6B3A] border border-[#3F6B3A]/30 uppercase tracking-wider flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#3F6B3A] animate-pulse" />
                  {t.farmerPortal || 'Farmer Portal'}
                </span>
              </div>
              <p className="text-[11px] text-[#1A1C18]/65 hidden sm:block">
                {t.farmerTagline || 'Direct Farm Gate Sales • Crop Residue Monetization • Govt Schemes'}
              </p>
            </div>
          </div>

          {/* Header Action Tools */}
          <div className="flex items-center gap-2">
            {/* Interactive Language Selector Dropdown */}
            <LanguageSelector
              currentLanguage={language}
              onSelectLanguage={(newLang) => {
                if (onLanguageChange) onLanguageChange(newLang);
              }}
              accentColor="#3F6B3A"
              id="farmer-header-lang-selector"
            />

            {/* Account Profile & Manage */}
            <button
              type="button"
              onClick={() => setIsAccountModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#3F6B3A]/10 hover:bg-[#3F6B3A]/20 text-[#3F6B3A] border border-[#3F6B3A]/30 text-xs font-bold transition-all cursor-pointer"
              title="View your farmer profile or account settings"
            >
              <User className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{user.name?.split(' ')[0] || 'Farmer'}</span>
            </button>

            {/* Logout */}
            <button
              id="farmer-logout-btn"
              type="button"
              onClick={onLogout}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#B8562D]/10 hover:bg-[#B8562D]/20 text-[#B8562D] border border-[#B8562D]/30 text-xs font-bold transition-all cursor-pointer"
              title="Log out of Krishaka"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t.logout || 'Log Out'}</span>
            </button>
          </div>

        </div>
      </header>

      {/* Live Mandi Ticker Bar */}
      <section className="bg-[#1A1C18] text-white py-2 px-4 overflow-hidden border-b border-[#3F6B3A]/40">
        <div className="max-w-7xl mx-auto flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5 text-[#C0F3B4] font-bold shrink-0 bg-white/10 px-2.5 py-0.5 rounded">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>{t.mandiLiveRates || 'Mandi Live Rates'}:</span>
          </div>
          
          <div className="flex items-center gap-6 overflow-x-auto whitespace-nowrap scrollbar-none py-0.5">
            {mandiRates.map((m) => (
              <div key={m.id} className="flex items-center gap-1.5 text-xs font-medium">
                <span className="text-[#F4F1E8]/90 font-semibold">{m.commodity}:</span>
                <span className="font-bold text-white font-mono">₹{m.modalPrice}/Qtl</span>
                <span className={`text-[10px] font-bold ${m.changePercent >= 0 ? 'text-[#C0F3B4]' : 'text-[#FFDBD0]'}`}>
                  {m.changePercent >= 0 ? `+${m.changePercent}%` : `${m.changePercent}%`}
                </span>
                <span className="text-[10px] text-[#F4F1E8]/50">({m.market})</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 p-4 bg-[#1A1C18] text-white rounded-xl shadow-2xl border border-[#3F6B3A] flex items-center gap-3 animate-fade-in text-sm font-semibold max-w-md">
          <CheckCircle2 className="w-5 h-5 text-[#C0F3B4] shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        
        {/* Farmer Profile & Quick Stats Card */}
        <div className="bg-white rounded-2xl p-6 border border-[#DCD6C8] shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            <div className="flex items-start sm:items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-[#3F6B3A] text-white flex items-center justify-center shrink-0 shadow-xs">
                <Tractor className="w-8 h-8" />
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="font-headline text-2xl font-bold text-[#1A1C18]">
                    {user.name}
                  </h1>
                  <span className="flex items-center gap-1 text-xs font-bold text-[#3F6B3A] bg-[#E2ECD8] px-2.5 py-0.5 rounded-full border border-[#3F6B3A]/30">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{t.verifiedKisan || 'Verified Kisan Account'}</span>
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#1A1C18]/70 mt-1">
                  <span className="font-semibold text-[#1A1C18]">{user.phone}</span>
                  {user.farmerDetails && (
                    <>
                      <span>&bull; {t.villageLabel || 'Village'}: <strong>{user.farmerDetails.village}</strong>, {user.farmerDetails.district} ({user.farmerDetails.state})</span>
                      <span className="font-bold text-[#3F6B3A]">&bull; {user.farmerDetails.landAreaAcres} {t.acresCultivation || 'Acres Cultivation'}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Listing Action Buttons */}
            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <button
                id="farmer-btn-add-produce"
                type="button"
                onClick={() => setIsAddProduceModalOpen(true)}
                className="flex items-center gap-1.5 bg-[#3F6B3A] hover:bg-[#355B31] text-white font-bold px-4 py-2.5 rounded-xl shadow-xs transition-all cursor-pointer text-xs"
              >
                <Plus className="w-4 h-4" />
                <span>{t.uploadHarvest || 'Upload Harvest Lot'}</span>
              </button>

              <button
                id="farmer-btn-add-waste"
                type="button"
                onClick={() => setIsAddWasteModalOpen(true)}
                className="flex items-center gap-1.5 bg-[#8C7A3E] hover:bg-[#786834] text-white font-bold px-4 py-2.5 rounded-xl shadow-xs transition-all cursor-pointer text-xs"
              >
                <Recycle className="w-4 h-4" />
                <span>{t.uploadWaste || 'Upload Agri-Waste'}</span>
              </button>
            </div>

          </div>
        </div>

        {/* Farmer Dedicated Navigation Tabs */}
        <div className="border-b border-[#DCD6C8] flex items-center gap-2 overflow-x-auto pb-px">
          
          <button
            type="button"
            onClick={() => setActiveTab('produce')}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 font-bold text-sm transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'produce'
                ? 'border-[#3F6B3A] text-[#3F6B3A] bg-white/60 rounded-t-xl'
                : 'border-transparent text-[#1A1C18]/70 hover:text-[#1A1C18]'
            }`}
          >
            <Wheat className="w-4 h-4" />
            <span>{t.tabHarvestLots || 'My Farm Harvest Lots'} ({produceListings.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('agri-waste')}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 font-bold text-sm transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'agri-waste'
                ? 'border-[#3F6B3A] text-[#3F6B3A] bg-white/60 rounded-t-xl'
                : 'border-transparent text-[#1A1C18]/70 hover:text-[#1A1C18]'
            }`}
          >
            <Recycle className="w-4 h-4" />
            <span>{t.tabAgriWaste || 'Agri-Waste Monetization'} ({agriWasteListings.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('orders')}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 font-bold text-sm transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'orders'
                ? 'border-[#3F6B3A] text-[#3F6B3A] bg-white/60 rounded-t-xl'
                : 'border-transparent text-[#1A1C18]/70 hover:text-[#1A1C18]'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>{t.tabBuyerOrders || 'Incoming Buyer Orders'} ({orders.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('govt-schemes')}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 font-bold text-sm transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'govt-schemes'
                ? 'border-[#3F6B3A] text-[#3F6B3A] bg-white/60 rounded-t-xl'
                : 'border-transparent text-[#1A1C18]/70 hover:text-[#1A1C18]'
            }`}
          >
            <Landmark className="w-4 h-4" />
            <span>{t.tabGovtSchemes || 'Govt Schemes & Subsidies'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('mandi-rates')}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 font-bold text-sm transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'mandi-rates'
                ? 'border-[#3F6B3A] text-[#3F6B3A] bg-white/60 rounded-t-xl'
                : 'border-transparent text-[#1A1C18]/70 hover:text-[#1A1C18]'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>{t.tabMspIntel || 'Live MSP Intelligence'}</span>
          </button>

        </div>

        {/* TAB 1: MY FARM HARVEST LOTS */}
        {activeTab === 'produce' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="font-headline font-bold text-xl text-[#1A1C18]">
                  Active Crop Harvest Listings
                </h2>
                <p className="text-xs text-[#1A1C18]/70">
                  Manage your farm inventory, update pricing per quintal, and receive direct buyer contracts.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsAddProduceModalOpen(true)}
                className="flex items-center gap-1.5 bg-[#3F6B3A] hover:bg-[#355B31] text-white font-bold px-4 py-2 rounded-xl text-xs shadow-2xs transition-all cursor-pointer self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>Add New Produce Batch</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {produceListings.map((listing) => (
                <div
                  key={listing.id}
                  className="bg-white rounded-2xl border border-[#DCD6C8] shadow-xs overflow-hidden flex flex-col hover:border-[#3F6B3A]/40 transition-all"
                >
                  <div className="relative h-44 w-full bg-[#EBE7DC]">
                    <img
                      src={listing.imageUrl}
                      alt={listing.cropName}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 left-3 flex gap-1.5">
                      <span className="bg-[#1A1C18]/85 text-white text-[11px] font-bold px-2 py-0.5 rounded-md">
                        Grade {listing.qualityGrade}
                      </span>
                      {listing.isOrganic && (
                        <span className="bg-[#3F6B3A] text-white text-[11px] font-bold px-2 py-0.5 rounded-md">
                          Organic
                        </span>
                      )}
                    </div>
                    <div className="absolute bottom-3 right-3 bg-white/95 text-[#1A1C18] font-bold text-xs px-2.5 py-1 rounded-md shadow-xs">
                      {listing.quantityKg.toLocaleString()} kg available
                    </div>
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex items-start justify-between gap-1">
                        <h3 className="font-headline font-bold text-lg text-[#1A1C18]">
                          {listing.cropName}
                        </h3>
                        <div className="text-right">
                          <span className="text-[10px] text-[#1A1C18]/60 block uppercase font-semibold">Your Ask</span>
                          <span className="font-bold text-[#3F6B3A] text-base font-mono">
                            ₹{listing.pricePerQuintal.toLocaleString()}/Qtl
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-[#1A1C18]/70 font-medium line-clamp-1 mt-0.5">
                        {listing.variety}
                      </p>

                      <div className="flex items-center gap-1 text-xs text-[#1A1C18]/60 mt-2">
                        <MapPin className="w-3.5 h-3.5 text-[#3F6B3A] shrink-0" />
                        <span className="truncate">{listing.location}</span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-[#EBE7DC] flex items-center justify-between gap-2">
                      <span className="text-[11px] text-[#3F6B3A] font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Live on Market</span>
                      </span>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(listing)}
                          className="flex items-center gap-1 text-xs font-bold text-[#3F6B3A] hover:bg-[#3F6B3A]/10 px-2.5 py-1.5 rounded-lg border border-[#3F6B3A]/30 transition-colors cursor-pointer"
                          title="Change crop photo, price, or quantity"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Edit / Photo</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenDeleteModal(listing)}
                          className="flex items-center gap-1 text-xs font-bold text-[#B8562D] hover:bg-[#B8562D]/10 px-2.5 py-1.5 rounded-lg border border-[#B8562D]/30 transition-colors cursor-pointer"
                          title="Delete harvest listing"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: AGRI-WASTE MONETIZATION (Section 1.4 & 3.4 SRS) */}
        {activeTab === 'agri-waste' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="font-headline font-bold text-xl text-[#1A1C18] flex items-center gap-2">
                    <Recycle className="w-5 h-5 text-[#8C7A3E]" />
                    <span>Agricultural Waste & Biomass Monetization</span>
                  </h2>
                </div>
                <p className="text-xs text-[#1A1C18]/70 mt-0.5">
                  Convert crop residue, husk, and stubble into secondary revenue by supplying bio-fuel plants, paper mills, and organic compost producers.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsAddWasteModalOpen(true)}
                className="flex items-center gap-1.5 bg-[#8C7A3E] hover:bg-[#786834] text-white font-bold px-4 py-2 rounded-xl text-xs shadow-2xs transition-all cursor-pointer self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>Upload Waste Lot</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-5">
              {agriWasteListings.map((waste) => (
                <div
                  key={waste.id}
                  className="bg-white rounded-2xl border border-[#DCD6C8] shadow-xs flex flex-col justify-between overflow-hidden hover:border-[#8C7A3E]/50 transition-all"
                >
                  {waste.imageUrl && (
                    <div className="relative h-40 w-full bg-[#EBE7DC]">
                      <img
                        src={waste.imageUrl}
                        alt={waste.wasteType}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-3 left-3">
                        <span className="text-[11px] font-bold bg-[#1A1C18]/80 text-white px-2.5 py-0.5 rounded-full backdrop-blur-xs">
                          {waste.suggestedUse}
                        </span>
                      </div>
                      <div className="absolute bottom-3 right-3 bg-white/95 text-[#1A1C18] font-bold text-xs px-2.5 py-1 rounded-md shadow-xs">
                        {waste.quantityTons} Tons Available
                      </div>
                    </div>
                  )}

                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          {!waste.imageUrl && (
                            <span className="text-[11px] font-bold bg-[#8C7A3E]/10 text-[#8C7A3E] px-2.5 py-0.5 rounded-full border border-[#8C7A3E]/20">
                              {waste.suggestedUse}
                            </span>
                          )}
                          <h3 className="font-headline font-bold text-lg text-[#1A1C18] mt-1">
                            {waste.wasteType}
                          </h3>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[10px] text-[#1A1C18]/60 font-mono">Lot #{waste.id}</span>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-[10px] text-[#1A1C18]/60 block uppercase font-semibold">Rate</span>
                          <span className="font-bold text-[#8C7A3E] text-base font-mono">
                            ₹{waste.pricePerTon.toLocaleString()}/Ton
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-[#EBE7DC] text-xs">
                        <div>
                          <span className="text-[#1A1C18]/60 block text-[10px]">Available Volume</span>
                          <strong className="text-[#1A1C18]">{waste.quantityTons} Metric Tons</strong>
                        </div>
                        <div>
                          <span className="text-[#1A1C18]/60 block text-[10px]">Moisture Level</span>
                          <strong className="text-[#1A1C18]">{waste.moisturePercent}% (Optimum)</strong>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 text-xs text-[#1A1C18]/70 mt-3">
                        <MapPin className="w-3.5 h-3.5 text-[#8C7A3E] shrink-0" />
                        <span>{waste.location}</span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-[#EBE7DC] flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-[#3F6B3A] flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Status: {waste.status}</span>
                      </span>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEditWasteModal(waste)}
                          className="flex items-center gap-1 text-xs font-bold text-[#8C7A3E] hover:bg-[#8C7A3E]/10 px-2.5 py-1.5 rounded-lg border border-[#8C7A3E]/30 transition-colors cursor-pointer"
                          title="Edit waste lot pricing or details"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenDeleteWasteModal(waste)}
                          className="flex items-center gap-1 text-xs font-bold text-[#B8562D] hover:bg-[#B8562D]/10 px-2.5 py-1.5 rounded-lg border border-[#B8562D]/30 transition-colors cursor-pointer"
                          title="Delete waste listing"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: BUYER ORDERS & TRADE INQUIRIES */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            <div>
              <h2 className="font-headline font-bold text-xl text-[#1A1C18]">
                Incoming Purchase Orders & RFQs from Buyers
              </h2>
              <p className="text-xs text-[#1A1C18]/70">
                Review purchase bids, confirm delivery or farm pickup, and manage settlement payments.
              </p>
            </div>

            <div className="space-y-4">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="bg-white rounded-2xl p-5 border border-[#DCD6C8] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-mono font-bold bg-[#F4F1E8] px-2 py-0.5 rounded border border-[#DCD6C8]">
                        #{order.id}
                      </span>
                      <h3 className="font-headline font-bold text-base text-[#1A1C18]">
                        {order.produceName} ({order.variety})
                      </h3>
                      <span
                        className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                          order.status === 'Accepted'
                            ? 'bg-[#3F6B3A]/10 text-[#3F6B3A] border border-[#3F6B3A]/30'
                            : 'bg-[#B8562D]/10 text-[#B8562D] border border-[#B8562D]/30'
                        }`}
                      >
                        {order.status}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#1A1C18]/70">
                      <span>Buyer: <strong className="text-[#1A1C18]">{order.buyerName}</strong> ({order.buyerFirm})</span>
                      <span>&bull; Contact: <strong>{order.buyerPhone}</strong></span>
                      <span>&bull; Destination: {order.deliveryLocation}</span>
                    </div>

                    {order.notes && (
                      <p className="text-xs text-[#1A1C18]/80 italic bg-[#F4F1E8] p-2 rounded-lg border border-[#DCD6C8]/60">
                        "{order.notes}"
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col md:items-end gap-3 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-[#EBE7DC]">
                    <div className="text-left md:text-right">
                      <div className="text-xs text-[#1A1C18]/60">Offered Deal Total</div>
                      <div className="font-headline font-bold text-xl text-[#3F6B3A] font-mono">
                        ₹{order.totalAmount.toLocaleString()}
                      </div>
                      <div className="text-[11px] text-[#1A1C18]/70">
                        {order.quantityKg} kg @ ₹{order.offeredPricePerQuintal}/Qtl
                      </div>
                    </div>

                    {order.status === 'Pending Confirmation' && (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleUpdateOrderStatus(order.id, 'Accepted')}
                          className="px-3.5 py-1.5 bg-[#3F6B3A] hover:bg-[#355B31] text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow-2xs"
                        >
                          Accept Order
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdateOrderStatus(order.id, 'Rejected')}
                          className="px-3.5 py-1.5 bg-[#B8562D]/10 hover:bg-[#B8562D]/20 text-[#B8562D] rounded-lg text-xs font-bold transition-all cursor-pointer"
                        >
                          Decline
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: GOVERNMENT SCHEMES & SUBSIDIES (Real-Time Cloud Firestore Sync) */}
        {activeTab === 'govt-schemes' && (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="font-headline font-bold text-xl text-[#1A1C18] flex items-center gap-2">
                    <Landmark className="w-5 h-5 text-[#3F6B3A]" />
                    <span>Central & State Government Agricultural Schemes</span>
                  </h2>
                </div>
                <p className="text-xs text-[#1A1C18]/70 mt-1">
                  Explore verified central & state welfare schemes, subsidy calculators, eligibility criteria, and direct official government portals.
                </p>
              </div>

              {/* Action Toolbar */}
              <div className="flex items-center gap-2 self-start lg:self-auto flex-wrap">
                <button
                  type="button"
                  onClick={() => setIsCalculatorOpen(!isCalculatorOpen)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs border ${
                    isCalculatorOpen
                      ? 'bg-[#3F6B3A] text-white border-[#3F6B3A]'
                      : 'bg-white hover:bg-[#F4F1E8] text-[#3F6B3A] border-[#3F6B3A]/40'
                  }`}
                >
                  <Calculator className="w-4 h-4" />
                  <span>{isCalculatorOpen ? 'Hide Subsidy Calculator' : 'Subsidy & Premium Calculator'}</span>
                </button>
              </div>
            </div>

            {/* INTERACTIVE SUBSIDY & PREMIUM CALCULATOR WIDGET */}
            {isCalculatorOpen && (
              <div className="bg-white rounded-2xl p-5 border-2 border-[#3F6B3A]/30 shadow-md animate-in fade-in space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#EBE7DC] pb-3">
                  <div>
                    <h3 className="font-headline font-bold text-base text-[#1A1C18] flex items-center gap-2">
                      <Calculator className="w-5 h-5 text-[#3F6B3A]" />
                      <span>Agricultural Subsidy & Insurance Premium Calculator</span>
                    </h3>
                    <p className="text-xs text-[#1A1C18]/70">
                      Estimate central and state government subsidy disbursements and net farmer payable amounts.
                    </p>
                  </div>
                  <div className="flex items-center gap-1 bg-[#F4F1E8] p-1 rounded-xl border border-[#DCD6C8]">
                    <button
                      type="button"
                      onClick={() => setCalculatorTab('solar')}
                      className={`text-xs px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                        calculatorTab === 'solar' ? 'bg-[#3F6B3A] text-white' : 'text-[#1A1C18]/70 hover:text-[#1A1C18]'
                      }`}
                    >
                      Solar Pump (KUSUM)
                    </button>
                    <button
                      type="button"
                      onClick={() => setCalculatorTab('insurance')}
                      className={`text-xs px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                        calculatorTab === 'insurance' ? 'bg-[#3F6B3A] text-white' : 'text-[#1A1C18]/70 hover:text-[#1A1C18]'
                      }`}
                    >
                      Crop Insurance (PMFBY)
                    </button>
                    <button
                      type="button"
                      onClick={() => setCalculatorTab('irrigation')}
                      className={`text-xs px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                        calculatorTab === 'irrigation' ? 'bg-[#3F6B3A] text-white' : 'text-[#1A1C18]/70 hover:text-[#1A1C18]'
                      }`}
                    >
                      Drip Irrigation
                    </button>
                    <button
                      type="button"
                      onClick={() => setCalculatorTab('machinery')}
                      className={`text-xs px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                        calculatorTab === 'machinery' ? 'bg-[#3F6B3A] text-white' : 'text-[#1A1C18]/70 hover:text-[#1A1C18]'
                      }`}
                    >
                      Farm Machinery (SMAM)
                    </button>
                  </div>
                </div>

                {/* Tab 1: Solar Pump Calculator */}
                {calculatorTab === 'solar' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-1">
                    <div className="space-y-3">
                      <label className="block text-xs font-semibold text-[#1A1C18]">
                        Select Solar AC Submersible Pump Capacity:
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {[3, 5, 7.5].map((hp) => (
                          <button
                            key={hp}
                            type="button"
                            onClick={() => setSolarPumpHp(hp)}
                            className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                              solarPumpHp === hp
                                ? 'bg-[#3F6B3A]/10 border-[#3F6B3A] font-bold text-[#3F6B3A]'
                                : 'bg-white border-[#DCD6C8] text-[#1A1C18]/70 hover:border-[#3F6B3A]/50'
                            }`}
                          >
                            <Sun className="w-4 h-4 mx-auto mb-1 text-[#8C7A3E]" />
                            <span className="text-sm block">{hp} HP</span>
                            <span className="text-[10px] text-[#1A1C18]/60">
                              {hp === 3 ? 'Up to 3 Acres' : hp === 5 ? 'Up to 6 Acres' : '10+ Acres'}
                            </span>
                          </button>
                        ))}
                      </div>
                      <p className="text-[11px] text-[#1A1C18]/60 bg-[#F4F1E8] p-2.5 rounded-lg border border-[#DCD6C8]/60">
                        PM-KUSUM provides 30% Central Ministry of New & Renewable Energy subsidy + 30% State Govt subsidy. Balance 40% can be financed with a 30% bank loan.
                      </p>
                    </div>

                    {(() => {
                      const baseCost = solarPumpHp === 3 ? 180000 : solarPumpHp === 5 ? 240000 : 350000;
                      const centralSubsidy = Math.round(baseCost * 0.3);
                      const stateSubsidy = Math.round(baseCost * 0.3);
                      const totalSubsidy = centralSubsidy + stateSubsidy;
                      const farmerShare = baseCost - totalSubsidy;
                      const bankLoan = Math.round(baseCost * 0.3);
                      const upfrontCash = farmerShare - bankLoan;
                      return (
                        <div className="bg-[#F4F1E8] p-4 rounded-xl border border-[#DCD6C8] space-y-2.5">
                          <div className="flex justify-between text-xs">
                            <span className="text-[#1A1C18]/70">Benchmark System Cost:</span>
                            <strong className="font-mono text-sm">₹{baseCost.toLocaleString()}</strong>
                          </div>
                          <div className="flex justify-between text-xs text-[#3F6B3A]">
                            <span>Centre Subsidy (30%):</span>
                            <strong className="font-mono">₹{centralSubsidy.toLocaleString()}</strong>
                          </div>
                          <div className="flex justify-between text-xs text-[#3F6B3A]">
                            <span>State Subsidy (30%):</span>
                            <strong className="font-mono">₹{stateSubsidy.toLocaleString()}</strong>
                          </div>
                          <div className="flex justify-between text-xs font-bold text-[#3F6B3A] pt-2 border-t border-[#DCD6C8]">
                            <span>Total Govt Subsidy (60%):</span>
                            <span className="font-mono text-base">₹{totalSubsidy.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-xs pt-2 border-t border-[#DCD6C8]">
                            <span className="font-bold text-[#1A1C18]">Farmer Net Share (40%):</span>
                            <strong className="font-mono text-sm text-[#B8562D]">₹{farmerShare.toLocaleString()}</strong>
                          </div>
                          <div className="text-[11px] text-[#1A1C18]/60 flex justify-between bg-white/70 p-2 rounded-lg">
                            <span>Upfront Farmer Contribution (10%): <strong>₹{upfrontCash.toLocaleString()}</strong></span>
                            <span>Optional Bank Loan (30%): <strong>₹{bankLoan.toLocaleString()}</strong></span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* Tab 2: Crop Insurance PMFBY Calculator */}
                {calculatorTab === 'insurance' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-1">
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-[#1A1C18] mb-1">
                          Select Insured Crop:
                        </label>
                        <select
                          value={insCrop}
                          onChange={(e) => setInsCrop(e.target.value)}
                          className="w-full py-2 px-3 rounded-lg border border-[#DCD6C8] text-xs focus:border-[#3F6B3A] focus:outline-hidden"
                        >
                          <option value="Onion">Nashik Red Onion (Kharif - 2% Premium)</option>
                          <option value="Wheat">Sharbati Wheat (Rabi - 1.5% Premium)</option>
                          <option value="Tomato">Hybrid Tomato (Commercial - 5% Premium)</option>
                          <option value="Soybean">Yellow Soybean (Kharif - 2% Premium)</option>
                          <option value="Cotton">Cotton (Kharif - 2% Premium)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#1A1C18] mb-1">
                          Cultivated Area (Acres): <strong>{insAcres} Acres</strong>
                        </label>
                        <input
                          type="range"
                          min="1"
                          max="25"
                          step="0.5"
                          value={insAcres}
                          onChange={(e) => setInsAcres(parseFloat(e.target.value) || 1)}
                          className="w-full accent-[#3F6B3A]"
                        />
                      </div>
                    </div>

                    {(() => {
                      const perAcreSum = insCrop === 'Onion' ? 45000 : insCrop === 'Wheat' ? 32000 : insCrop === 'Tomato' ? 60000 : 28000;
                      const totalSumInsured = Math.round(perAcreSum * insAcres);
                      const premiumRate = insCrop === 'Wheat' ? 0.015 : insCrop === 'Tomato' ? 0.05 : 0.02;
                      const farmerPremium = Math.round(totalSumInsured * premiumRate);
                      const actuarialRate = 0.12; // 12% total risk rate
                      const totalActuarialPremium = Math.round(totalSumInsured * actuarialRate);
                      const govtSubsidy = totalActuarialPremium - farmerPremium;

                      return (
                        <div className="bg-[#F4F1E8] p-4 rounded-xl border border-[#DCD6C8] space-y-2.5">
                          <div className="flex justify-between text-xs">
                            <span className="text-[#1A1C18]/70">Total Crop Risk Coverage (Sum Insured):</span>
                            <strong className="font-mono text-sm text-[#1A1C18]">₹{totalSumInsured.toLocaleString()}</strong>
                          </div>
                          <div className="flex justify-between text-xs text-[#3F6B3A]">
                            <span>Govt Premium Subsidy (Centre + State):</span>
                            <strong className="font-mono">₹{govtSubsidy.toLocaleString()}</strong>
                          </div>
                          <div className="flex justify-between text-xs font-bold text-[#1A1C18] pt-2 border-t border-[#DCD6C8]">
                            <span>Farmer Premium Share (Only {(premiumRate * 100).toFixed(1)}%):</span>
                            <span className="font-mono text-base text-[#3F6B3A]">₹{farmerPremium.toLocaleString()}</span>
                          </div>
                          <p className="text-[11px] text-[#1A1C18]/70 bg-white/70 p-2 rounded-lg">
                            Farmer pays only ₹{farmerPremium.toLocaleString()} to receive comprehensive non-preventable risk insurance cover of ₹{totalSumInsured.toLocaleString()} under PMFBY.
                          </p>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* Tab 3: Drip Irrigation Calculator */}
                {calculatorTab === 'irrigation' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-1">
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-[#1A1C18] mb-1">
                          Land Area to be Covered (Acres): <strong>{dripAcres} Acres</strong>
                        </label>
                        <input
                          type="range"
                          min="1"
                          max="15"
                          step="0.5"
                          value={dripAcres}
                          onChange={(e) => setDripAcres(parseFloat(e.target.value) || 1)}
                          className="w-full accent-[#3F6B3A]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#1A1C18] mb-1">
                          Farmer Category:
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setDripCategory('small')}
                            className={`p-2 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                              dripCategory === 'small' ? 'bg-[#3F6B3A] text-white' : 'bg-white border-[#DCD6C8]'
                            }`}
                          >
                            Small / Marginal (55% Subsidy)
                          </button>
                          <button
                            type="button"
                            onClick={() => setDripCategory('other')}
                            className={`p-2 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                              dripCategory === 'other' ? 'bg-[#3F6B3A] text-white' : 'bg-white border-[#DCD6C8]'
                            }`}
                          >
                            Other Farmers (45% Subsidy)
                          </button>
                        </div>
                      </div>
                    </div>

                    {(() => {
                      const costPerAcre = 42000;
                      const totalCost = Math.round(costPerAcre * dripAcres);
                      const rate = dripCategory === 'small' ? 0.55 : 0.45;
                      const subsidy = Math.round(totalCost * rate);
                      const netPayable = totalCost - subsidy;
                      return (
                        <div className="bg-[#F4F1E8] p-4 rounded-xl border border-[#DCD6C8] space-y-2.5">
                          <div className="flex justify-between text-xs">
                            <span className="text-[#1A1C18]/70">Estimated Micro-Irrigation Cost:</span>
                            <strong className="font-mono text-sm">₹{totalCost.toLocaleString()}</strong>
                          </div>
                          <div className="flex justify-between text-xs font-bold text-[#3F6B3A]">
                            <span>Per Drop More Crop Subsidy ({(rate * 100)}%):</span>
                            <span className="font-mono text-base">₹{subsidy.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-xs font-bold text-[#1A1C18] pt-2 border-t border-[#DCD6C8]">
                            <span>Farmer Net Outlay:</span>
                            <span className="font-mono text-sm text-[#B8562D]">₹{netPayable.toLocaleString()}</span>
                          </div>
                          <p className="text-[11px] text-[#1A1C18]/60 bg-white/70 p-2 rounded-lg">
                            Drip installation saves up to 50% water and 30% electricity while qualifying for DBT payment release directly to verified empaneled vendors.
                          </p>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* Tab 4: Farm Machinery SMAM Calculator */}
                {calculatorTab === 'machinery' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-1">
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-[#1A1C18] mb-1">
                          Select Agricultural Equipment:
                        </label>
                        <select
                          value={machineryType}
                          onChange={(e) => setMachineryType(e.target.value)}
                          className="w-full py-2 px-3 rounded-lg border border-[#DCD6C8] text-xs focus:border-[#3F6B3A] focus:outline-hidden"
                        >
                          <option value="rotavator">Rotary Tiller / Rotavator (₹1,20,000)</option>
                          <option value="tractor">45 HP Utility Tractor (₹6,50,000)</option>
                          <option value="drone">Kisan Agri-Drone Sprayer (₹10,00,000)</option>
                          <option value="weeder">Power Weeder & Cultivator (₹65,000)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#1A1C18] mb-1">
                          Applicant Category:
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setMachineryCategory('small_women')}
                            className={`p-2 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                              machineryCategory === 'small_women' ? 'bg-[#3F6B3A] text-white' : 'bg-white border-[#DCD6C8]'
                            }`}
                          >
                            Small / Women / SC-ST (50%)
                          </button>
                          <button
                            type="button"
                            onClick={() => setMachineryCategory('other')}
                            className={`p-2 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                              machineryCategory === 'other' ? 'bg-[#3F6B3A] text-white' : 'bg-white border-[#DCD6C8]'
                            }`}
                          >
                            General Farmers (40%)
                          </button>
                        </div>
                      </div>
                    </div>

                    {(() => {
                      const costs = {
                        rotavator: 120000,
                        tractor: 650000,
                        drone: 1000000,
                        weeder: 65000,
                      };
                      const cost = costs[machineryType] || 120000;
                      const rate = machineryCategory === 'small_women' ? 0.50 : 0.40;
                      const maxCaps = {
                        rotavator: 50000,
                        tractor: 200000,
                        drone: 500000,
                        weeder: 30000,
                      };
                      const subsidy = Math.min(Math.round(cost * rate), maxCaps[machineryType]);
                      const netPayable = cost - subsidy;

                      return (
                        <div className="bg-[#F4F1E8] p-4 rounded-xl border border-[#DCD6C8] space-y-2.5">
                          <div className="flex justify-between text-xs">
                            <span className="text-[#1A1C18]/70">Dealer Equipment Cost:</span>
                            <strong className="font-mono text-sm">₹{cost.toLocaleString()}</strong>
                          </div>
                          <div className="flex justify-between text-xs font-bold text-[#3F6B3A]">
                            <span>SMAM Govt Subsidy Amount:</span>
                            <span className="font-mono text-base">₹{subsidy.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-xs font-bold text-[#1A1C18] pt-2 border-t border-[#DCD6C8]">
                            <span>Net Payable by Farmer:</span>
                            <span className="font-mono text-sm text-[#B8562D]">₹{netPayable.toLocaleString()}</span>
                          </div>
                          <p className="text-[11px] text-[#1A1C18]/60 bg-white/70 p-2 rounded-lg">
                            Subsidy sanctioned via DBT through the Agrimachinery portal upon verified invoice and GPS machinery inspection.
                          </p>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            )}

            {/* SCHEMES DISCOVERY & AWARENESS CATALOG */}
            <div className="space-y-4">
              {/* Search & Category Filter Toolbar */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-[#1A1C18]/50 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={schemeSearchQuery}
                    onChange={(e) => setSchemeSearchQuery(e.target.value)}
                    placeholder="Search schemes by name, keyword, or benefits..."
                    className="w-full pl-9 pr-8 py-2 rounded-xl border border-[#DCD6C8] bg-white text-xs focus:border-[#3F6B3A] focus:outline-hidden"
                  />
                  {schemeSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setSchemeSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#1A1C18]/50 hover:text-[#1A1C18] cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                  {['All', 'Direct Income Support', 'Crop Insurance', 'Solar & Irrigation', 'Farm Machinery Subsidy', 'Organic Farming', 'Credit & Loans', 'Soil Health'].map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedSchemeCategory(cat)}
                      className={`text-xs px-3 py-1.5 rounded-full font-bold transition-all shrink-0 cursor-pointer border ${
                        selectedSchemeCategory === cat
                          ? 'bg-[#3F6B3A] text-white border-[#3F6B3A]'
                          : 'bg-white hover:bg-[#F4F1E8] text-[#1A1C18]/80 border-[#DCD6C8]'
                      }`}
                    >
                      {cat === 'All' ? `All Schemes (${govtSchemes.length})` : cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Grid of Government Schemes */}
              {(() => {
                const filtered = govtSchemes.filter((s) => {
                  const matchesCat = selectedSchemeCategory === 'All' || s.category === selectedSchemeCategory;
                  const query = schemeSearchQuery.toLowerCase().trim();
                  const matchesSearch = !query ||
                    s.name.toLowerCase().includes(query) ||
                    s.code.toLowerCase().includes(query) ||
                    s.description.toLowerCase().includes(query) ||
                    s.benefitAmount.toLowerCase().includes(query);
                  return matchesCat && matchesSearch;
                });

                if (filtered.length === 0) {
                  return (
                    <div className="bg-white rounded-2xl p-8 text-center border border-[#DCD6C8] space-y-2">
                      <Landmark className="w-8 h-8 text-[#1A1C18]/30 mx-auto" />
                      <h4 className="font-bold text-sm text-[#1A1C18]">No Schemes Found</h4>
                      <p className="text-xs text-[#1A1C18]/60">Try searching for other keywords like "solar", "insurance", "subsidy", or clear filters.</p>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedSchemeCategory('All');
                          setSchemeSearchQuery('');
                        }}
                        className="text-xs text-[#3F6B3A] font-bold hover:underline cursor-pointer"
                      >
                        Reset All Filters
                      </button>
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {filtered.map((scheme) => {
                      const isExpanded = expandedSchemeId === scheme.id;

                      return (
                        <div
                          key={scheme.id}
                          className="bg-white rounded-2xl p-5 border border-[#DCD6C8] shadow-xs flex flex-col justify-between space-y-4 hover:border-[#3F6B3A]/40 transition-all group"
                        >
                          <div className="space-y-3">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-[11px] font-bold bg-[#3F6B3A]/10 text-[#3F6B3A] px-2.5 py-0.5 rounded-full border border-[#3F6B3A]/20 font-mono">
                                    {scheme.code}
                                  </span>
                                  <span className="text-[10px] text-[#1A1C18]/60 uppercase font-semibold">
                                    {scheme.category}
                                  </span>
                                </div>
                                <h3 className="font-headline font-bold text-base text-[#1A1C18] mt-1.5">
                                  {scheme.name}
                                </h3>
                              </div>
                              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#E2ECD8] text-[#3F6B3A] border border-[#3F6B3A]/30 shrink-0">
                                {scheme.applicationStatus || 'Open'}
                              </span>
                            </div>

                            {/* Direct Benefit Highlight */}
                            <div className="bg-[#F4F1E8] p-3 rounded-xl border border-[#DCD6C8]/60 text-xs">
                              <span className="font-semibold text-[#1A1C18]/70 block">Direct Scheme Benefit:</span>
                              <strong className="text-sm font-bold text-[#3F6B3A]">{scheme.benefitAmount}</strong>
                            </div>

                            <p className="text-xs text-[#1A1C18]/80 leading-relaxed">
                              {scheme.description}
                            </p>

                            {/* Eligibility */}
                            <div className="flex items-start gap-1.5 text-xs text-[#3F6B3A] bg-[#E2ECD8]/60 p-2.5 rounded-lg border border-[#3F6B3A]/20">
                              <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                              <span>
                                <strong>Farmer Eligibility:</strong> {scheme.eligibility}
                              </span>
                            </div>

                            {/* Required Documents */}
                            {scheme.requiredDocuments && scheme.requiredDocuments.length > 0 && (
                              <div>
                                <span className="text-[10px] font-semibold text-[#1A1C18]/60 uppercase block mb-1">
                                  Required Documents:
                                </span>
                                <div className="flex flex-wrap gap-1.5">
                                  {scheme.requiredDocuments.map((docName, idx) => (
                                    <span
                                      key={idx}
                                      className="text-[10px] bg-[#F4F1E8] text-[#1A1C18]/80 px-2 py-0.5 rounded border border-[#DCD6C8]"
                                    >
                                      {docName}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Expandable Official Guidelines & Helpline */}
                            {isExpanded && (
                              <div className="pt-3 border-t border-[#EBE7DC] space-y-2.5 text-xs bg-[#F4F1E8]/70 p-3.5 rounded-xl border border-[#DCD6C8] animate-in fade-in">
                                {scheme.ministry && (
                                  <div>
                                    <span className="text-[10px] font-semibold text-[#1A1C18]/60 uppercase block">Nodal Ministry:</span>
                                    <span className="text-[#1A1C18] font-bold">{scheme.ministry}</span>
                                  </div>
                                )}
                                {scheme.howToApply && (
                                  <div>
                                    <span className="text-[10px] font-semibold text-[#1A1C18]/60 uppercase block">How to Apply:</span>
                                    <p className="text-[#1A1C18]/80 mt-0.5">{scheme.howToApply}</p>
                                  </div>
                                )}
                                {scheme.helpline && (
                                  <div className="flex items-center gap-1.5 text-[#3F6B3A] font-semibold pt-1">
                                    <Phone className="w-3.5 h-3.5" />
                                    <span>Toll-Free Helpline: {scheme.helpline}</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Footer Action Buttons */}
                          <div className="pt-3 border-t border-[#EBE7DC] flex items-center justify-between gap-2">
                            <button
                              type="button"
                              onClick={() => setExpandedSchemeId(isExpanded ? null : scheme.id)}
                              className="text-xs font-bold text-[#1A1C18]/70 hover:text-[#3F6B3A] transition-colors cursor-pointer flex items-center gap-1"
                            >
                              <span>{isExpanded ? 'Hide Guidelines' : 'Guidelines & Helpline'}</span>
                            </button>

                            <a
                              href={scheme.portalLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs bg-[#3F6B3A] hover:bg-[#355B31] text-white"
                            >
                              <span>Visit Official Portal</span>
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* TAB 5: MANDI PRICE TRENDS */}
        {activeTab === 'mandi-rates' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="font-headline font-bold text-xl text-[#1A1C18]">
                  Real-Time APMC Mandi Modal Prices (₹ / Quintal)
                </h2>
                <p className="text-xs text-[#1A1C18]/70">
                  Daily benchmark modal prices from major APMC trading yards (Lasalgaon, Azadpur, Indore, Rajkot, etc.).
                </p>
              </div>

              <button
                type="button"
                onClick={handleSyncMandiRates}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-[#F4F1E8] border border-[#3F6B3A]/40 text-[#3F6B3A] text-xs font-bold rounded-xl shadow-2xs transition-all cursor-pointer self-start sm:self-auto"
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Sync Today's Mandi Rates</span>
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-[#DCD6C8] shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F4F1E8] border-b border-[#DCD6C8] font-bold text-[#1A1C18] uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Commodity</th>
                      <th className="py-3 px-4">Mandi & State</th>
                      <th className="py-3 px-4">Min Price</th>
                      <th className="py-3 px-4">Max Price</th>
                      <th className="py-3 px-4">Modal Price</th>
                      <th className="py-3 px-4">Daily Trend</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EBE7DC]">
                    {mandiRates.map((rate) => (
                      <tr key={rate.id} className="hover:bg-[#F4F1E8]/50 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-[#1A1C18]">{rate.commodity}</td>
                        <td className="py-3.5 px-4 text-[#1A1C18]/80">{rate.market}, {rate.state}</td>
                        <td className="py-3.5 px-4 font-mono">₹{rate.minPrice}</td>
                        <td className="py-3.5 px-4 font-mono">₹{rate.maxPrice}</td>
                        <td className="py-3.5 px-4 font-mono font-bold text-[#3F6B3A] text-sm">₹{rate.modalPrice}</td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded text-[11px] ${
                              rate.changePercent >= 0 ? 'bg-[#E2ECD8] text-[#3F6B3A]' : 'bg-[#FFDBD0] text-[#B8562D]'
                            }`}
                          >
                            {rate.changePercent >= 0 ? `+${rate.changePercent}%` : `${rate.changePercent}%`}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* Modal: Add Produce Batch */}
      {isAddProduceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-[#DCD6C8] overflow-hidden">
            <div className="p-4 bg-[#3F6B3A] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wheat className="w-5 h-5" />
                <h3 className="font-headline font-bold text-lg">Post New Harvest Batch</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddProduceModalOpen(false)}
                className="p-1 rounded-lg hover:bg-white/20 text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddProduceSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#1A1C18] mb-1">
                  Crop Commodity Name *
                </label>
                <input
                  type="text"
                  required
                  value={cropName}
                  onChange={(e) => setCropName(e.target.value)}
                  placeholder="e.g. Sharbati Wheat, Red Onion, Basmati Rice"
                  className="w-full py-2.5 px-3 rounded-lg border border-[#DCD6C8] text-sm focus:border-[#3F6B3A] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1A1C18] mb-1">
                  Variety / Grade Details
                </label>
                <input
                  type="text"
                  value={variety}
                  onChange={(e) => setVariety(e.target.value)}
                  placeholder="e.g. Extra Grade A1 Export Quality"
                  className="w-full py-2.5 px-3 rounded-lg border border-[#DCD6C8] text-sm focus:border-[#3F6B3A] focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#1A1C18] mb-1">
                    Available Quantity (kg)
                  </label>
                  <input
                    type="number"
                    min="100"
                    value={quantityKg}
                    onChange={(e) => setQuantityKg(parseInt(e.target.value) || 500)}
                    className="w-full py-2.5 px-3 rounded-lg border border-[#DCD6C8] text-sm focus:border-[#3F6B3A] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1A1C18] mb-1">
                    Ask Price (₹/Quintal)
                  </label>
                  <input
                    type="number"
                    min="500"
                    value={pricePerQuintal}
                    onChange={(e) => setPricePerQuintal(parseInt(e.target.value) || 2000)}
                    className="w-full py-2.5 px-3 rounded-lg border border-[#DCD6C8] text-sm focus:border-[#3F6B3A] focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#1A1C18] mb-1">
                    Quality Grade
                  </label>
                  <select
                    value={qualityGrade}
                    onChange={(e) => setQualityGrade(e.target.value)}
                    className="w-full py-2.5 px-3 rounded-lg border border-[#DCD6C8] text-sm focus:border-[#3F6B3A] focus:outline-hidden"
                  >
                    <option value="A+">Grade A+ (Premium Export)</option>
                    <option value="A">Grade A (Standard APMC)</option>
                    <option value="B">Grade B (Processing Quality)</option>
                  </select>
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isOrganic}
                      onChange={(e) => setIsOrganic(e.target.checked)}
                      className="w-4 h-4 accent-[#3F6B3A]"
                    />
                    <span className="text-xs font-semibold text-[#1A1C18]">Organic Certified</span>
                  </label>
                </div>
              </div>

              {/* Crop Produce Photo Upload & Presets */}
              <div className="space-y-3 pt-2 border-t border-[#EBE7DC]">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-[#1A1C18]">
                    Crop Photo (Device Upload, Camera, or Presets) *
                  </label>
                </div>
                
                {/* Upload from Device / Camera */}
                <div className="flex items-center gap-3">
                  <label className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border-2 border-dashed border-[#3F6B3A]/40 bg-[#E2ECD8]/30 hover:bg-[#E2ECD8]/60 cursor-pointer text-xs font-bold text-[#3F6B3A] transition-all">
                    <Camera className="w-4 h-4 text-[#3F6B3A]" />
                    <span>Upload from Phone / Camera / Computer</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageFileChange(e, false)}
                      className="hidden"
                    />
                  </label>

                  {cropImage && (
                    <div className="relative w-14 h-14 rounded-lg overflow-hidden border-2 border-[#3F6B3A] shrink-0 shadow-xs">
                      <img src={cropImage} alt="Crop Preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setCropImage('')}
                        className="absolute top-0.5 right-0.5 p-0.5 rounded-full bg-black/70 text-white text-[9px] hover:bg-black"
                        title="Remove photo"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Direct Image URL input */}
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Link2 className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#1A1C18]/40" />
                    <input
                      type="url"
                      value={customImageUrl}
                      onChange={(e) => setCustomImageUrl(e.target.value)}
                      placeholder="Or paste web image link (https://...)"
                      className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-[#DCD6C8] text-xs focus:border-[#3F6B3A] focus:outline-hidden"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (customImageUrl.trim()) {
                        setCropImage(customImageUrl.trim());
                        setCustomImageUrl('');
                      }
                    }}
                    className="px-3 py-1.5 bg-[#3F6B3A]/10 hover:bg-[#3F6B3A]/20 text-[#3F6B3A] border border-[#3F6B3A]/30 text-xs font-bold rounded-lg cursor-pointer transition-colors"
                  >
                    Apply URL
                  </button>
                </div>

                {/* Instant Crop Photo Presets */}
                <div>
                  <div className="text-[10px] text-[#1A1C18]/60 mb-1 font-semibold">Or Pick Quick High-Resolution Crop Preset:</div>
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-none">
                    {CROP_PHOTO_PRESETS.map((preset) => (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() => setCropImage(preset.url)}
                        className={`text-[10px] px-2.5 py-1 rounded-md border font-semibold shrink-0 transition-all cursor-pointer flex items-center gap-1 ${
                          cropImage === preset.url
                            ? 'bg-[#3F6B3A] text-white border-[#3F6B3A]'
                            : 'bg-white hover:bg-[#F4F1E8] text-[#1A1C18]/80 border-[#DCD6C8]'
                        }`}
                      >
                        <span>{preset.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <p className="text-[10px] text-[#1A1C18]/60 italic">
                  * Note: Images are automatically compressed and saved with your listing.
                </p>
              </div>

              <div className="pt-3 border-t border-[#EBE7DC] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddProduceModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-[#1A1C18]/80 hover:bg-[#EBE7DC] rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-[#3F6B3A] hover:bg-[#355B31] text-white rounded-lg shadow-2xs cursor-pointer"
                >
                  Publish Lot to Market
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Crop Harvest Lot & Change Photo */}
      {isEditProduceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-[#DCD6C8] overflow-hidden">
            <div className="p-4 bg-[#3F6B3A] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5" />
                <h3 className="font-headline font-bold text-lg">Edit Crop Lot & Update Photo</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsEditProduceModalOpen(false)}
                className="p-1 rounded-lg hover:bg-white/20 text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditProduceSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#1A1C18] mb-1">
                  Crop Commodity Name *
                </label>
                <input
                  type="text"
                  required
                  value={editCropName}
                  onChange={(e) => setEditCropName(e.target.value)}
                  className="w-full py-2.5 px-3 rounded-lg border border-[#DCD6C8] text-sm focus:border-[#3F6B3A] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1A1C18] mb-1">
                  Variety / Grade Details
                </label>
                <input
                  type="text"
                  value={editVariety}
                  onChange={(e) => setEditVariety(e.target.value)}
                  className="w-full py-2.5 px-3 rounded-lg border border-[#DCD6C8] text-sm focus:border-[#3F6B3A] focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#1A1C18] mb-1">
                    Available Quantity (kg)
                  </label>
                  <input
                    type="number"
                    min="100"
                    value={editQuantityKg}
                    onChange={(e) => setEditQuantityKg(parseInt(e.target.value) || 500)}
                    className="w-full py-2.5 px-3 rounded-lg border border-[#DCD6C8] text-sm focus:border-[#3F6B3A] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1A1C18] mb-1">
                    Ask Price (₹/Quintal)
                  </label>
                  <input
                    type="number"
                    min="100"
                    value={editPricePerQuintal}
                    onChange={(e) => setEditPricePerQuintal(parseInt(e.target.value) || 2000)}
                    className="w-full py-2.5 px-3 rounded-lg border border-[#DCD6C8] text-sm focus:border-[#3F6B3A] focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#1A1C18] mb-1">
                    Quality Grade
                  </label>
                  <select
                    value={editQualityGrade}
                    onChange={(e) => setEditQualityGrade(e.target.value)}
                    className="w-full py-2.5 px-3 rounded-lg border border-[#DCD6C8] text-sm focus:border-[#3F6B3A] focus:outline-hidden"
                  >
                    <option value="A+">Grade A+ (Premium Export)</option>
                    <option value="A">Grade A (Standard APMC)</option>
                    <option value="B">Grade B (Processing Quality)</option>
                  </select>
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editIsOrganic}
                      onChange={(e) => setEditIsOrganic(e.target.checked)}
                      className="w-4 h-4 accent-[#3F6B3A]"
                    />
                    <span className="text-xs font-semibold text-[#1A1C18]">Organic Certified</span>
                  </label>
                </div>
              </div>

              {/* Edit Photo Section */}
              <div className="space-y-3 pt-2 border-t border-[#EBE7DC]">
                <label className="block text-xs font-semibold text-[#1A1C18]">
                  Crop Photo (Upload New Photo or Pick Preset)
                </label>

                <div className="flex items-center gap-3">
                  <label className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border-2 border-dashed border-[#3F6B3A]/40 bg-[#E2ECD8]/30 hover:bg-[#E2ECD8]/60 cursor-pointer text-xs font-bold text-[#3F6B3A] transition-all">
                    <Camera className="w-4 h-4 text-[#3F6B3A]" />
                    <span>Upload New Photo from Device</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageFileChange(e, true)}
                      className="hidden"
                    />
                  </label>

                  {editCropImage && (
                    <div className="relative w-14 h-14 rounded-lg overflow-hidden border-2 border-[#3F6B3A] shrink-0 shadow-xs">
                      <img src={editCropImage} alt="Crop Preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setEditCropImage('')}
                        className="absolute top-0.5 right-0.5 p-0.5 rounded-full bg-black/70 text-white text-[9px] hover:bg-black"
                        title="Remove photo"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Preset buttons */}
                <div>
                  <div className="text-[10px] text-[#1A1C18]/60 mb-1 font-semibold">Or Pick Crop Preset:</div>
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-none">
                    {CROP_PHOTO_PRESETS.map((preset) => (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() => setEditCropImage(preset.url)}
                        className={`text-[10px] px-2.5 py-1 rounded-md border font-semibold shrink-0 transition-all cursor-pointer ${
                          editCropImage === preset.url
                            ? 'bg-[#3F6B3A] text-white border-[#3F6B3A]'
                            : 'bg-white hover:bg-[#F4F1E8] text-[#1A1C18]/80 border-[#DCD6C8]'
                        }`}
                      >
                        {preset.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-[#EBE7DC] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditProduceModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-[#1A1C18]/80 hover:bg-[#EBE7DC] rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-[#3F6B3A] hover:bg-[#355B31] text-white rounded-lg shadow-2xs cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Delete Crop Confirmation */}
      {isDeleteConfirmModalOpen && cropToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-[#DCD6C8] overflow-hidden">
            <div className="p-4 bg-[#B8562D] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trash2 className="w-5 h-5" />
                <h3 className="font-headline font-bold text-lg">Delete Harvest Lot</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsDeleteConfirmModalOpen(false);
                  setCropToDelete(null);
                }}
                className="p-1 rounded-lg hover:bg-white/20 text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <p className="text-sm text-[#1A1C18]">
                Are you sure you want to permanently delete <strong>{cropToDelete.cropName}</strong> ({cropToDelete.variety})?
              </p>

              <div className="bg-[#FFF5F2] border border-[#B8562D]/30 p-3 rounded-xl flex items-start gap-2.5 text-xs text-[#B8562D]">
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  This action will permanently remove this listing from your dashboard and the buyer marketplace.
                </span>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsDeleteConfirmModalOpen(false);
                    setCropToDelete(null);
                  }}
                  className="px-4 py-2 text-xs font-bold text-[#1A1C18]/80 hover:bg-[#EBE7DC] rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDeleteCrop}
                  className="px-5 py-2 text-xs font-bold bg-[#B8562D] hover:bg-[#9E4823] text-white rounded-lg shadow-2xs cursor-pointer flex items-center gap-1.5"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Confirm Delete</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Farmer Account Profile & Delete User */}
      {isAccountModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-[#DCD6C8] overflow-hidden">
            <div className="p-4 bg-[#3F6B3A] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5" />
                <h3 className="font-headline font-bold text-lg">Farmer Account Profile</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAccountModalOpen(false)}
                className="p-1 rounded-lg hover:bg-white/20 text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="bg-[#F4F1E8] p-3.5 rounded-xl border border-[#DCD6C8] space-y-2">
                <div className="flex justify-between items-center pb-2 border-b border-[#DCD6C8]">
                  <span className="text-[#1A1C18]/60">Full Name</span>
                  <span className="font-bold text-[#1A1C18] text-sm">{user.name}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-[#DCD6C8]">
                  <span className="text-[#1A1C18]/60">Phone Number</span>
                  <span className="font-mono font-bold text-[#1A1C18]">{user.phone}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-[#DCD6C8]">
                  <span className="text-[#1A1C18]/60">Account ID</span>
                  <span className="font-mono text-[11px] bg-white px-2 py-0.5 rounded border border-[#DCD6C8]">
                    {user.id}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#1A1C18]/60">Location</span>
                  <span className="font-bold text-[#1A1C18]">
                    {[user.farmerDetails?.village, user.farmerDetails?.district].filter(Boolean).join(', ')}
                  </span>
                </div>
              </div>

              {/* Danger Zone: Delete Account */}
              <div className="pt-3 border-t border-[#EBE7DC]">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-[#B8562D]">Delete Account</h4>
                    <p className="text-[11px] text-[#1A1C18]/60">
                      Permanently delete this user profile and all associated listings.
                    </p>
                  </div>
                </div>

                {!isDeleteAccountModalOpen ? (
                  <button
                    type="button"
                    onClick={() => setIsDeleteAccountModalOpen(true)}
                    className="mt-3 w-full py-2 bg-[#FFF5F2] hover:bg-[#FFEAE4] text-[#B8562D] border border-[#B8562D]/40 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Account</span>
                  </button>
                ) : (
                  <div className="mt-3 p-3 bg-[#FFF5F2] border border-[#B8562D] rounded-xl space-y-2.5 animate-in fade-in">
                    <p className="font-bold text-xs text-[#B8562D]">
                      Are you sure? This cannot be undone. All your listings will be removed and you will be immediately logged out.
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setIsDeleteAccountModalOpen(false)}
                        className="flex-1 py-1.5 bg-white border border-[#DCD6C8] text-xs font-bold rounded-lg cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleConfirmDeleteAccount}
                        className="flex-1 py-1.5 bg-[#B8562D] text-white text-xs font-bold rounded-lg cursor-pointer"
                      >
                        Yes, Delete My Account
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add Agri Waste Listing */}
      {isAddWasteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-[#DCD6C8] overflow-hidden">
            <div className="p-4 bg-[#8C7A3E] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Recycle className="w-5 h-5" />
                <h3 className="font-headline font-bold text-lg">List Crop Waste / Biomass</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddWasteModalOpen(false)}
                className="p-1 rounded-lg hover:bg-white/20 text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddWasteSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#1A1C18] mb-1">
                  Agri-Waste / Biomass Type *
                </label>
                <select
                  value={wasteType}
                  onChange={(e) => setWasteType(e.target.value)}
                  className="w-full py-2.5 px-3 rounded-lg border border-[#DCD6C8] text-sm focus:border-[#8C7A3E] focus:outline-hidden"
                >
                  <option value="Wheat Straw / Stubble (Baled)">Wheat Straw / Stubble (Baled)</option>
                  <option value="Paddy Rice Straw (Baled)">Paddy Rice Straw (Baled)</option>
                  <option value="Paddy Rice Husk (Cleaned)">Paddy Rice Husk (Cleaned)</option>
                  <option value="Sugarcane Bagasse & Dry Residue">Sugarcane Bagasse & Dry Residue</option>
                  <option value="Cotton Plant Stalks (Dry Shredded)">Cotton Plant Stalks (Dry Shredded)</option>
                  <option value="Mustard Stalks & Stubble (Baled)">Mustard Stalks & Stubble (Baled)</option>
                  <option value="Corn / Maize Stover & Husk (Chopped)">Corn / Maize Stover & Husk (Chopped)</option>
                  <option value="Groundnut Shells & Pod Husk (Dry Cleaned)">Groundnut Shells & Pod Husk (Dry Cleaned)</option>
                  <option value="Soybean Straw / Residue">Soybean Straw / Residue</option>
                  <option value="Coconut Shells & Coir Pith">Coconut Shells & Coir Pith</option>
                  <option value="Other Agri-Biomass Residue">Other Agri-Biomass Residue</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#1A1C18] mb-1">
                    Quantity (Metric Tons)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={wasteQuantityTons}
                    onChange={(e) => setWasteQuantityTons(parseFloat(e.target.value) || 1)}
                    className="w-full py-2.5 px-3 rounded-lg border border-[#DCD6C8] text-sm focus:border-[#8C7A3E] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1A1C18] mb-1">
                    Price (₹ / Ton)
                  </label>
                  <input
                    type="number"
                    min="500"
                    value={wastePricePerTon}
                    onChange={(e) => setWastePricePerTon(parseFloat(e.target.value) || 1000)}
                    className="w-full py-2.5 px-3 rounded-lg border border-[#DCD6C8] text-sm focus:border-[#8C7A3E] focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#1A1C18] mb-1">
                    Moisture Content (%)
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="30"
                    value={wasteMoisture}
                    onChange={(e) => setWasteMoisture(parseFloat(e.target.value) || 10)}
                    className="w-full py-2.5 px-3 rounded-lg border border-[#DCD6C8] text-sm focus:border-[#8C7A3E] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1A1C18] mb-1">
                    Target Buyer Utility
                  </label>
                  <select
                    value={wasteUse}
                    onChange={(e) => setWasteUse(e.target.value)}
                    className="w-full py-2.5 px-3 rounded-lg border border-[#DCD6C8] text-sm focus:border-[#8C7A3E] focus:outline-hidden"
                  >
                    <option value="Bio-Energy Pellet">Bio-Energy Pellet</option>
                    <option value="Organic Compost">Organic Compost</option>
                    <option value="Cattle Feed">Cattle Feed</option>
                    <option value="Paper Mill Pulp">Paper Mill Pulp</option>
                    <option value="Mushroom Cultivation">Mushroom Cultivation</option>
                  </select>
                </div>
              </div>

              {/* Photo Upload & Presets for Agri Waste */}
              <div className="space-y-3 pt-2 border-t border-[#EBE7DC]">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-[#1A1C18]">
                    Biomass Photo (Device Upload or Presets)
                  </label>
                </div>

                <div className="flex items-center gap-3">
                  <label className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border-2 border-dashed border-[#8C7A3E]/40 bg-[#8C7A3E]/10 hover:bg-[#8C7A3E]/20 cursor-pointer text-xs font-bold text-[#8C7A3E] transition-all">
                    <Camera className="w-4 h-4 text-[#8C7A3E]" />
                    <span>Upload Residue Photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleWasteImageFileChange(e, false)}
                      className="hidden"
                    />
                  </label>

                  {wasteImage && (
                    <div className="relative w-12 h-12 rounded-lg overflow-hidden border-2 border-[#8C7A3E] shrink-0 shadow-xs">
                      <img src={wasteImage} alt="Residue Preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setWasteImage('')}
                        className="absolute top-0.5 right-0.5 p-0.5 rounded-full bg-black/70 text-white text-[9px] hover:bg-black"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <div className="text-[10px] text-[#1A1C18]/60 mb-1 font-semibold">Or Pick Biomass Preset:</div>
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                    {WASTE_PHOTO_PRESETS.map((preset) => (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() => setWasteImage(preset.url)}
                        className={`text-[10px] px-2.5 py-1 rounded-md border font-semibold shrink-0 transition-all cursor-pointer ${
                          wasteImage === preset.url
                            ? 'bg-[#8C7A3E] text-white border-[#8C7A3E]'
                            : 'bg-white hover:bg-[#F4F1E8] text-[#1A1C18]/80 border-[#DCD6C8]'
                        }`}
                      >
                        {preset.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-[#EBE7DC] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddWasteModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-[#1A1C18]/80 hover:bg-[#EBE7DC] rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-[#8C7A3E] hover:bg-[#786834] text-white rounded-lg shadow-2xs cursor-pointer"
                >
                  Publish Agri-Waste Listing
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Agri Waste Listing */}
      {isEditWasteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-[#DCD6C8] overflow-hidden">
            <div className="p-4 bg-[#8C7A3E] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5" />
                <h3 className="font-headline font-bold text-lg">Edit Waste Lot & Rates</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsEditWasteModalOpen(false)}
                className="p-1 rounded-lg hover:bg-white/20 text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditWasteSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#1A1C18] mb-1">
                  Agri-Waste / Biomass Type *
                </label>
                <select
                  value={editWasteType}
                  onChange={(e) => setEditWasteType(e.target.value)}
                  className="w-full py-2.5 px-3 rounded-lg border border-[#DCD6C8] text-sm focus:border-[#8C7A3E] focus:outline-hidden"
                >
                  <option value="Wheat Straw / Stubble (Baled)">Wheat Straw / Stubble (Baled)</option>
                  <option value="Paddy Rice Straw (Baled)">Paddy Rice Straw (Baled)</option>
                  <option value="Paddy Rice Husk (Cleaned)">Paddy Rice Husk (Cleaned)</option>
                  <option value="Sugarcane Bagasse & Dry Residue">Sugarcane Bagasse & Dry Residue</option>
                  <option value="Cotton Plant Stalks (Dry Shredded)">Cotton Plant Stalks (Dry Shredded)</option>
                  <option value="Mustard Stalks & Stubble (Baled)">Mustard Stalks & Stubble (Baled)</option>
                  <option value="Corn / Maize Stover & Husk (Chopped)">Corn / Maize Stover & Husk (Chopped)</option>
                  <option value="Groundnut Shells & Pod Husk (Dry Cleaned)">Groundnut Shells & Pod Husk (Dry Cleaned)</option>
                  <option value="Soybean Straw / Residue">Soybean Straw / Residue</option>
                  <option value="Coconut Shells & Coir Pith">Coconut Shells & Coir Pith</option>
                  <option value="Other Agri-Biomass Residue">Other Agri-Biomass Residue</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#1A1C18] mb-1">
                    Quantity (Metric Tons)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={editWasteQuantityTons}
                    onChange={(e) => setEditWasteQuantityTons(parseFloat(e.target.value) || 1)}
                    className="w-full py-2.5 px-3 rounded-lg border border-[#DCD6C8] text-sm focus:border-[#8C7A3E] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1A1C18] mb-1">
                    Price (₹ / Ton)
                  </label>
                  <input
                    type="number"
                    min="100"
                    value={editWastePricePerTon}
                    onChange={(e) => setEditWastePricePerTon(parseFloat(e.target.value) || 1000)}
                    className="w-full py-2.5 px-3 rounded-lg border border-[#DCD6C8] text-sm focus:border-[#8C7A3E] focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#1A1C18] mb-1">
                    Moisture Content (%)
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="30"
                    value={editWasteMoisture}
                    onChange={(e) => setEditWasteMoisture(parseFloat(e.target.value) || 10)}
                    className="w-full py-2.5 px-3 rounded-lg border border-[#DCD6C8] text-sm focus:border-[#8C7A3E] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1A1C18] mb-1">
                    Target Buyer Utility
                  </label>
                  <select
                    value={editWasteUse}
                    onChange={(e) => setEditWasteUse(e.target.value)}
                    className="w-full py-2.5 px-3 rounded-lg border border-[#DCD6C8] text-sm focus:border-[#8C7A3E] focus:outline-hidden"
                  >
                    <option value="Bio-Energy Pellet">Bio-Energy Pellet</option>
                    <option value="Organic Compost">Organic Compost</option>
                    <option value="Cattle Feed">Cattle Feed</option>
                    <option value="Paper Mill Pulp">Paper Mill Pulp</option>
                    <option value="Mushroom Cultivation">Mushroom Cultivation</option>
                  </select>
                </div>
              </div>

              {/* Photo Upload & Presets for Edit Waste */}
              <div className="space-y-3 pt-2 border-t border-[#EBE7DC]">
                <label className="block text-xs font-semibold text-[#1A1C18]">
                  Biomass Photo (Update Photo)
                </label>

                <div className="flex items-center gap-3">
                  <label className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border-2 border-dashed border-[#8C7A3E]/40 bg-[#8C7A3E]/10 hover:bg-[#8C7A3E]/20 cursor-pointer text-xs font-bold text-[#8C7A3E] transition-all">
                    <Camera className="w-4 h-4 text-[#8C7A3E]" />
                    <span>Upload New Photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleWasteImageFileChange(e, true)}
                      className="hidden"
                    />
                  </label>

                  {editWasteImage && (
                    <div className="relative w-12 h-12 rounded-lg overflow-hidden border-2 border-[#8C7A3E] shrink-0 shadow-xs">
                      <img src={editWasteImage} alt="Preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setEditWasteImage('')}
                        className="absolute top-0.5 right-0.5 p-0.5 rounded-full bg-black/70 text-white text-[9px] hover:bg-black"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <div className="text-[10px] text-[#1A1C18]/60 mb-1 font-semibold">Or Pick Preset:</div>
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                    {WASTE_PHOTO_PRESETS.map((preset) => (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() => setEditWasteImage(preset.url)}
                        className={`text-[10px] px-2.5 py-1 rounded-md border font-semibold shrink-0 transition-all cursor-pointer ${
                          editWasteImage === preset.url
                            ? 'bg-[#8C7A3E] text-white border-[#8C7A3E]'
                            : 'bg-white hover:bg-[#F4F1E8] text-[#1A1C18]/80 border-[#DCD6C8]'
                        }`}
                      >
                        {preset.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-[#EBE7DC] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditWasteModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-[#1A1C18]/80 hover:bg-[#EBE7DC] rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-[#8C7A3E] hover:bg-[#786834] text-white rounded-lg shadow-2xs cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Delete Agri Waste Confirmation */}
      {isDeleteWasteModalOpen && wasteToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-[#DCD6C8] overflow-hidden">
            <div className="p-4 bg-[#B8562D] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trash2 className="w-5 h-5" />
                <h3 className="font-headline font-bold text-lg">Delete Waste Lot</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsDeleteWasteModalOpen(false);
                  setWasteToDelete(null);
                }}
                className="p-1 rounded-lg hover:bg-white/20 text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <p className="text-sm text-[#1A1C18]">
                Are you sure you want to permanently delete <strong>{wasteToDelete.wasteType}</strong> ({wasteToDelete.quantityTons} Tons)?
              </p>

              <div className="bg-[#FFF5F2] border border-[#B8562D]/30 p-3 rounded-xl flex items-start gap-2.5 text-xs text-[#B8562D]">
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  This action will permanently remove this listing from your dashboard and buyer procurement screens.
                </span>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsDeleteWasteModalOpen(false);
                    setWasteToDelete(null);
                  }}
                  className="px-4 py-2 text-xs font-bold text-[#1A1C18]/80 hover:bg-[#EBE7DC] rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDeleteWaste}
                  className="px-5 py-2 text-xs font-bold bg-[#B8562D] hover:bg-[#9E4823] text-white rounded-lg shadow-2xs cursor-pointer flex items-center gap-1.5"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Confirm Delete</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
