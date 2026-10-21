import React, { useState, useEffect } from 'react';
import { 
  Store, 
  Globe, 
  LogOut, 
  Database, 
  Search, 
  Filter, 
  SlidersHorizontal, 
  TrendingUp, 
  MapPin, 
  Phone, 
  CheckCircle2, 
  Wheat, 
  Recycle, 
  Building, 
  FileText, 
  ShoppingBag, 
  ArrowUpRight, 
  Clock, 
  Star, 
  ShieldCheck, 
  X, 
  Send, 
  AlertCircle, 
  Truck, 
  IndianRupee, 
  Navigation, 
  Sparkles,
  Eye,
  User,
  Trash2,
  ZoomIn
} from 'lucide-react';
import { TRANSLATIONS } from '../../data/translations';
import { LanguageSelector } from '../common/LanguageSelector';
import {
  subscribeToCropListings,
  subscribeToOrders,
  subscribeToMandiRates,
  subscribeToAgriWaste,
  subscribeToRetailers,
  firebaseCreateOrder,
  firebaseDeleteOrder,
  firebaseDeleteUser,
} from '../../services/firebase';

export function BuyerDashboard({
  user,
  language,
  onLanguageChange,
  onLogout,
  onOpenLanguageModal,
}) {
  const [activeTab, setActiveTab] = useState('marketplace');
  const [produceListings, setProduceListings] = useState([]);
  const [agriWasteListings, setAgriWasteListings] = useState([]);
  const [localRetailers, setLocalRetailers] = useState([]);
  const [myOrders, setMyOrders] = useState([]);
  const [mandiRates, setMandiRates] = useState([]);

  // Real-time Firestore sync
  useEffect(() => {
    const unsubCrops = subscribeToCropListings((data) => {
      if (Array.isArray(data)) setProduceListings(data);
    });
    const unsubOrders = subscribeToOrders((data) => {
      if (Array.isArray(data)) setMyOrders(data);
    });
    const unsubMandi = subscribeToMandiRates((data) => {
      if (Array.isArray(data)) setMandiRates(data);
    });
    const unsubWaste = subscribeToAgriWaste((data) => {
      if (Array.isArray(data)) setAgriWasteListings(data);
    });
    const unsubRetailers = subscribeToRetailers((data) => {
      if (Array.isArray(data)) setLocalRetailers(data);
    });

    return () => {
      unsubCrops();
      unsubOrders();
      unsubMandi();
      unsubWaste();
      unsubRetailers();
    };
  }, []);

  // Search and Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [cropCategoryFilter, setCropCategoryFilter] = useState('All');
  const [organicOnly, setOrganicOnly] = useState(false);
  const [gradeFilter, setGradeFilter] = useState('All');

  // Retailer Directory Filters
  const [retailerSearch, setRetailerSearch] = useState('');
  const [retailerTypeFilter, setRetailerTypeFilter] = useState('All');

  // Order Placement Modal
  const [selectedListingForOrder, setSelectedListingForOrder] = useState(null);
  const [orderQuantityKg, setOrderQuantityKg] = useState(1000);
  const [offeredPrice, setOfferedPrice] = useState(2000);
  const [deliveryMandi, setDeliveryMandi] = useState(user.buyerDetails?.deliveryCity || '');
  const [orderNotes, setOrderNotes] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  // Crop Photo Preview Modal
  const [previewCropImage, setPreviewCropImage] = useState(null);
  const [previewWasteImage, setPreviewWasteImage] = useState(null);

  // Buyer Account Profile Modal & Delete Account
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isDeleteAccountModalOpen, setIsDeleteAccountModalOpen] = useState(false);

  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4500);
  };

  const handleOpenOrderModal = (listing) => {
    setSelectedListingForOrder(listing);
    setOrderQuantityKg(Math.min(2000, listing.quantityKg));
    setOfferedPrice(listing.pricePerQuintal);
    setOrderNotes('Require Grade A sorted batch in 50kg standard jute bags.');
  };

  const handlePlaceOrderSubmit = async (e) => {
    e.preventDefault();
    if (!selectedListingForOrder) return;

    const total = Math.round((orderQuantityKg / 100) * offeredPrice);

    const newOrder = {
      id: `po-${Date.now()}`,
      produceId: selectedListingForOrder.id,
      cropName: selectedListingForOrder.cropName,
      produceName: selectedListingForOrder.cropName,
      variety: selectedListingForOrder.variety,
      farmerId: selectedListingForOrder.farmerId || 'farmer-1',
      farmerName: selectedListingForOrder.farmerName,
      farmerPhone: selectedListingForOrder.farmerPhone,
      buyerId: user.id,
      buyerName: user.name,
      buyerPhone: user.phone,
      buyerFirm: user.buyerDetails?.businessName || `${user.name} Agro Firm`,
      quantityKg: orderQuantityKg,
      quantityQuintals: Math.round(orderQuantityKg / 100),
      offeredPricePerQuintal: offeredPrice,
      totalAmount: total,
      status: 'pending',
      orderDate: new Date().toISOString().split('T')[0],
      deliveryLocation: deliveryMandi,
      notes: orderNotes,
    };

    setMyOrders([newOrder, ...myOrders]);
    setSelectedListingForOrder(null);
    showToast(`Purchase offer for ${orderQuantityKg}kg of ${selectedListingForOrder.cropName} submitted successfully!`);

    try {
      await firebaseCreateOrder(newOrder);
    } catch (err) {
      console.warn('Firestore order creation notice:', err);
    }
  };

  // Filtered Produce Listings
  const filteredProduce = produceListings.filter((listing) => {
    const matchesSearch = listing.cropName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          listing.variety.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          listing.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = cropCategoryFilter === 'All' || listing.cropName.toLowerCase().includes(cropCategoryFilter.toLowerCase());
    const matchesOrganic = !organicOnly || listing.isOrganic;
    const matchesGrade = gradeFilter === 'All' || listing.qualityGrade === gradeFilter;

    return matchesSearch && matchesCategory && matchesOrganic && matchesGrade;
  });

  // Filtered Retailers
  const filteredRetailers = localRetailers.filter((ret) => {
    const matchesSearch = ret.name.toLowerCase().includes(retailerSearch.toLowerCase()) ||
                          ret.firmName.toLowerCase().includes(retailerSearch.toLowerCase()) ||
                          ret.mandiLocation.toLowerCase().includes(retailerSearch.toLowerCase()) ||
                          ret.speciality.toLowerCase().includes(retailerSearch.toLowerCase());
    const matchesType = retailerTypeFilter === 'All' || ret.businessType === retailerTypeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div id="buyer-portal-root" className="min-h-screen bg-[#F4F1E8] text-[#1A1C18] flex flex-col font-body">
      
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-[#DCD6C8] shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          
          {/* Brand & Role Tag */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#B8562D] text-white flex items-center justify-center shadow-xs">
              <Store className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-headline font-bold text-xl sm:text-2xl text-[#B8562D] tracking-tight">
                  Krishaka
                </span>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#B8562D]/10 text-[#B8562D] border border-[#B8562D]/30 uppercase tracking-wider flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#B8562D] animate-pulse" />
                  {t.buyerPortal || 'Buyer & Trader Portal'}
                </span>
              </div>
              <p className="text-[11px] text-[#1A1C18]/65 hidden sm:block">
                {t.buyerTagline || 'Direct Farm Gate Procurement • Local Mandi Network • Verified APMC Contracts'}
              </p>
            </div>
          </div>

          {/* Action Tools */}
          <div className="flex items-center gap-2">
            
            {/* Interactive Language Selector Dropdown */}
            <LanguageSelector
              currentLanguage={language}
              onSelectLanguage={(newLang) => {
                if (onLanguageChange) onLanguageChange(newLang);
              }}
              accentColor="#B8562D"
              id="buyer-header-lang-selector"
            />

            {/* Account Profile & Manage */}
            <button
              type="button"
              onClick={() => setIsAccountModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#B8562D]/10 hover:bg-[#B8562D]/20 text-[#B8562D] border border-[#B8562D]/30 text-xs font-bold transition-all cursor-pointer"
              title="View buyer company profile or account settings"
            >
              <User className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{user.name?.split(' ')[0] || 'Buyer'}</span>
            </button>

            {/* Logout */}
            <button
              id="buyer-logout-btn"
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
      <section className="bg-[#1A1C18] text-white py-2 px-4 overflow-hidden border-b border-[#B8562D]/40">
        <div className="max-w-7xl mx-auto flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5 text-[#FFDBD0] font-bold shrink-0 bg-white/10 px-2.5 py-0.5 rounded">
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
        <div className="fixed bottom-6 right-6 z-50 p-4 bg-[#1A1C18] text-white rounded-xl shadow-2xl border border-[#B8562D] flex items-center gap-3 animate-fade-in text-sm font-semibold max-w-md">
          <CheckCircle2 className="w-5 h-5 text-[#FFDBD0] shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        
        {/* Buyer Business Profile Card */}
        <div className="bg-white rounded-2xl p-6 border border-[#DCD6C8] shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            <div className="flex items-start sm:items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-[#B8562D] text-white flex items-center justify-center shrink-0 shadow-xs">
                <Store className="w-8 h-8" />
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="font-headline text-2xl font-bold text-[#1A1C18]">
                    {user.buyerDetails?.businessName || `${user.name} Trading Co.`}
                  </h1>
                  <span className="flex items-center gap-1 text-xs font-bold text-[#B8562D] bg-[#FCEEE7] px-2.5 py-0.5 rounded-full border border-[#B8562D]/30">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{t.verifiedBuyer || 'Verified APMC Buyer'}</span>
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#1A1C18]/70 mt-1">
                  <span>Contact: <strong className="text-[#1A1C18]">{user.name}</strong> ({user.phone})</span>
                  {user.buyerDetails && (
                    <>
                      <span>&bull; Delivery Hub: <strong>{user.buyerDetails.deliveryCity}</strong></span>
                      <span>&bull; Business: <strong className="capitalize">{user.buyerDetails.businessType}</strong></span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Procurement Target Banner */}
            <div className="bg-[#F4F1E8] p-3.5 rounded-xl border border-[#DCD6C8] flex items-center gap-4 shrink-0">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#1A1C18]/60 block">{t.monthlyTarget || 'Monthly Target'}</span>
                <span className="font-headline font-bold text-lg text-[#B8562D] font-mono">
                  {user.buyerDetails?.tradeCapacityTonsMonthly || 50} Tons
                </span>
              </div>
              <div className="h-8 w-px bg-[#DCD6C8]" />
              <div>
                <span className="text-[10px] uppercase font-bold text-[#1A1C18]/60 block">{t.activeOrders || 'Active Orders'}</span>
                <span className="font-headline font-bold text-lg text-[#1A1C18] font-mono">
                  {myOrders.length}
                </span>
              </div>
            </div>

          </div>
        </div>

        {/* Buyer Dedicated Navigation Tabs */}
        <div className="border-b border-[#DCD6C8] flex items-center gap-2 overflow-x-auto pb-px">
          
          <button
            type="button"
            onClick={() => setActiveTab('marketplace')}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 font-bold text-sm transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'marketplace'
                ? 'border-[#B8562D] text-[#B8562D] bg-white/60 rounded-t-xl'
                : 'border-transparent text-[#1A1C18]/70 hover:text-[#1A1C18]'
            }`}
          >
            <Wheat className="w-4 h-4" />
            <span>{t.tabFarmHarvests || 'Farm Harvest Lots'} ({filteredProduce.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('agri-waste')}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 font-bold text-sm transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'agri-waste'
                ? 'border-[#B8562D] text-[#B8562D] bg-white/60 rounded-t-xl'
                : 'border-transparent text-[#1A1C18]/70 hover:text-[#1A1C18]'
            }`}
          >
            <Recycle className="w-4 h-4" />
            <span>{t.tabAgriWasteSourcing || 'Agri-Waste & Biomass Sourcing'} ({agriWasteListings.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('retailers-directory')}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 font-bold text-sm transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'retailers-directory'
                ? 'border-[#B8562D] text-[#B8562D] bg-white/60 rounded-t-xl'
                : 'border-transparent text-[#1A1C18]/70 hover:text-[#1A1C18]'
            }`}
          >
            <Building className="w-4 h-4" />
            <span>{t.tabRetailersDirectory || 'Local Mandi Retailers Directory'} ({localRetailers.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('my-orders')}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 font-bold text-sm transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'my-orders'
                ? 'border-[#B8562D] text-[#B8562D] bg-white/60 rounded-t-xl'
                : 'border-transparent text-[#1A1C18]/70 hover:text-[#1A1C18]'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>{t.tabMyOrders || 'My Procurement Orders'} ({myOrders.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('mandi-rates')}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 font-bold text-sm transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'mandi-rates'
                ? 'border-[#B8562D] text-[#B8562D] bg-white/60 rounded-t-xl'
                : 'border-transparent text-[#1A1C18]/70 hover:text-[#1A1C18]'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>{t.tabMspIntel || 'Live MSP Intelligence'}</span>
          </button>

        </div>

        {/* TAB 1: BROWSE FARM HARVEST LOTS */}
        {activeTab === 'marketplace' && (
          <div className="space-y-6">
            
            {/* Search & Filter Toolbar */}
            <div className="bg-white rounded-2xl p-4 border border-[#DCD6C8] shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              <div className="flex-1 flex items-center bg-[#F4F1E8] rounded-xl px-3 py-2 border border-[#DCD6C8]">
                <Search className="w-4 h-4 text-[#1A1C18]/50 mr-2 shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by crop name (e.g. Wheat, Onion, Rice), variety, or location..."
                  className="w-full bg-transparent text-xs text-[#1A1C18] focus:outline-hidden"
                />
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                {/* Category Pills */}
                {['All', 'Onion', 'Rice', 'Wheat', 'Tomato', 'Potato', 'Chilli', 'Orange', 'Peas', 'Soybean', 'Ginger', 'Capsicum'].map((crop) => (
                  <button
                    key={crop}
                    type="button"
                    onClick={() => setCropCategoryFilter(crop)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                      cropCategoryFilter === crop
                        ? 'bg-[#B8562D] text-white border-[#B8562D]'
                        : 'bg-white text-[#1A1C18] border-[#DCD6C8] hover:border-[#B8562D]/40'
                    }`}
                  >
                    {crop}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => setOrganicOnly(!organicOnly)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer border flex items-center gap-1 ${
                    organicOnly
                      ? 'bg-[#3F6B3A] text-white border-[#3F6B3A]'
                      : 'bg-white text-[#1A1C18] border-[#DCD6C8] hover:border-[#3F6B3A]/40'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Organic Only</span>
                </button>
              </div>
            </div>

            {/* Produce Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {filteredProduce.map((listing) => (
                <div
                  key={listing.id}
                  className="bg-white rounded-2xl border border-[#DCD6C8] shadow-xs overflow-hidden flex flex-col hover:border-[#B8562D]/40 transition-all"
                >
                  <div className="relative h-44 w-full bg-[#EBE7DC] group">
                    <img
                      src={listing.imageUrl}
                      alt={listing.cropName}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setPreviewCropImage(listing)}
                      className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1 text-white text-xs font-bold cursor-pointer"
                      title="Click to view full photo"
                    >
                      <ZoomIn className="w-4 h-4" />
                      <span>View Photo</span>
                    </button>
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
                    <div className="absolute bottom-3 right-3 bg-white/95 text-[#1A1C18] font-bold text-xs px-2 py-1 rounded-md shadow-xs">
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
                          <span className="text-[10px] text-[#1A1C18]/60 block uppercase font-semibold">Rate</span>
                          <span className="font-bold text-[#B8562D] text-base font-mono">
                            ₹{listing.pricePerQuintal.toLocaleString()}/Qtl
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-[#1A1C18]/70 font-medium line-clamp-1 mt-0.5">
                        {listing.variety}
                      </p>

                      <div className="flex items-center gap-1 text-xs text-[#1A1C18]/60 mt-2">
                        <MapPin className="w-3.5 h-3.5 text-[#B8562D] shrink-0" />
                        <span className="truncate">{listing.location}</span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-[#EBE7DC] flex items-center justify-between gap-2">
                      <div className="truncate">
                        <span className="text-[10px] text-[#1A1C18]/50 block">Farmer</span>
                        <span className="text-xs font-bold text-[#1A1C18] truncate block">
                          {listing.farmerName}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleOpenOrderModal(listing)}
                        className="flex items-center gap-1 bg-[#B8562D] hover:bg-[#9E4823] text-white text-xs font-bold px-3 py-2 rounded-lg transition-colors cursor-pointer shrink-0 shadow-2xs"
                      >
                        <span>Place Offer</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

          </div>
        )}

        {/* TAB 2: AGRI-WASTE SOURCING */}
        {activeTab === 'agri-waste' && (
          <div className="space-y-6">
            <div>
              <h2 className="font-headline font-bold text-xl text-[#1A1C18] flex items-center gap-2">
                <Recycle className="w-5 h-5 text-[#8C7A3E]" />
                <span>Agricultural Waste & Biomass Procurement</span>
              </h2>
              <p className="text-xs text-[#1A1C18]/70">
                Procure crop residue, straw, husk, and bagasse for bio-pellet production, paper mills, compost processing, and cattle feed manufacturing.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {agriWasteListings.map((waste) => (
                <div
                  key={waste.id}
                  className="bg-white rounded-2xl border border-[#DCD6C8] shadow-xs flex flex-col justify-between overflow-hidden hover:border-[#8C7A3E]/50 transition-all group"
                >
                  {waste.imageUrl && (
                    <div 
                      onClick={() => setPreviewWasteImage(waste)}
                      className="relative h-44 w-full bg-[#EBE7DC] overflow-hidden cursor-pointer group/img"
                    >
                      <img
                        src={waste.imageUrl}
                        alt={waste.wasteType}
                        className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black/25 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white font-bold text-xs">
                        <ZoomIn className="w-4 h-4" />
                        <span>View Residue Photo</span>
                      </div>
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
                          <h3 className="font-headline font-bold text-lg text-[#1A1C18] mt-1.5">
                            {waste.wasteType}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] text-[#1A1C18]/60 font-mono">Lot #{waste.id}</span>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-[10px] text-[#1A1C18]/60 block uppercase font-semibold">Farmer Ask</span>
                          <span className="font-bold text-[#8C7A3E] text-base font-mono">
                            ₹{waste.pricePerTon.toLocaleString()}/Ton
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-[#EBE7DC] text-xs">
                        <div>
                          <span className="text-[#1A1C18]/60 block text-[10px]">Available Tonnage</span>
                          <strong className="text-[#1A1C18]">{waste.quantityTons} Metric Tons</strong>
                        </div>
                        <div>
                          <span className="text-[#1A1C18]/60 block text-[10px]">Moisture Level</span>
                          <strong className="text-[#1A1C18]">{waste.moisturePercent}% (Dry Bales)</strong>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 text-xs text-[#1A1C18]/70 mt-3">
                        <MapPin className="w-3.5 h-3.5 text-[#8C7A3E] shrink-0" />
                        <span>{waste.location}</span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-[#EBE7DC] flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-[#1A1C18]/50 block">Producer</span>
                        <span className="text-xs font-bold text-[#1A1C18]">{waste.farmerName} ({waste.farmerPhone})</span>
                      </div>

                      <div className="flex items-center gap-2">
                        {waste.imageUrl && (
                          <button
                            type="button"
                            onClick={() => setPreviewWasteImage(waste)}
                            className="p-1.5 text-[#1A1C18]/60 hover:text-[#8C7A3E] border border-[#DCD6C8] rounded-lg transition-colors cursor-pointer"
                            title="Preview Photo"
                          >
                            <ZoomIn className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => showToast(`Direct procurement inquiry sent to farmer ${waste.farmerName} for ${waste.quantityTons} Tons of ${waste.wasteType}!`)}
                          className="px-3.5 py-1.5 bg-[#8C7A3E] hover:bg-[#786834] text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow-2xs"
                        >
                          Inquire Bulk Pickup
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: LOCAL RETAILERS & APMC DIRECTORY (REQ-7.1 / REQ-7.2) */}
        {activeTab === 'retailers-directory' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="font-headline font-bold text-xl text-[#1A1C18] flex items-center gap-2">
                  <Building className="w-5 h-5 text-[#B8562D]" />
                  <span>Local Retailers, Input Dealers & Mandi Commission Outlets</span>
                </h2>
                <p className="text-xs text-[#1A1C18]/70">
                  Directory of licensed APMC commission agents, cold storage hubs, and neighborhood agri outlets with verified contacts.
                </p>
              </div>
            </div>

            {/* Filter toolbar */}
            <div className="bg-white rounded-2xl p-4 border border-[#DCD6C8] shadow-xs flex flex-col md:flex-row items-stretch md:items-center gap-3">
              <div className="flex-1 flex items-center bg-[#F4F1E8] rounded-xl px-3 py-2 border border-[#DCD6C8]">
                <Search className="w-4 h-4 text-[#1A1C18]/50 mr-2 shrink-0" />
                <input
                  type="text"
                  value={retailerSearch}
                  onChange={(e) => setRetailerSearch(e.target.value)}
                  placeholder="Search retailer by shop name, mandi, or speciality..."
                  className="w-full bg-transparent text-xs text-[#1A1C18] focus:outline-hidden"
                />
              </div>

              <select
                value={retailerTypeFilter}
                onChange={(e) => setRetailerTypeFilter(e.target.value)}
                className="py-2 px-3 rounded-xl border border-[#DCD6C8] text-xs font-semibold text-[#1A1C18] bg-white focus:outline-hidden"
              >
                <option value="All">All Business Categories</option>
                <option value="APMC Commission Agent">APMC Commission Agent</option>
                <option value="Wholesale Trader">Wholesale Trader</option>
                <option value="Agri Input Dealer">Agri Input Dealer</option>
                <option value="Retail Supermarket">Retail Supermarket</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {filteredRetailers.map((ret) => (
                <div
                  key={ret.id}
                  className="bg-white rounded-2xl p-5 border border-[#DCD6C8] shadow-xs flex flex-col justify-between space-y-3 hover:border-[#B8562D]/40 transition-all"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[11px] font-bold bg-[#B8562D]/10 text-[#B8562D] px-2.5 py-0.5 rounded-full border border-[#B8562D]/20">
                          {ret.businessType}
                        </span>
                        <h3 className="font-headline font-bold text-lg text-[#1A1C18] mt-1">
                          {ret.firmName}
                        </h3>
                        <p className="text-xs text-[#1A1C18]/70 font-medium">Prop: {ret.name}</p>
                      </div>

                      <div className="flex items-center gap-1 bg-[#F4F1E8] px-2 py-1 rounded-lg border border-[#DCD6C8] text-xs font-bold text-[#1A1C18]">
                        <Star className="w-3.5 h-3.5 fill-[#E9B128] text-[#E9B128]" />
                        <span>{ret.rating}</span>
                      </div>
                    </div>

                    <p className="text-xs text-[#1A1C18]/80 mt-2 bg-[#F4F1E8] p-2.5 rounded-xl border border-[#DCD6C8]/60">
                      <strong>Speciality:</strong> {ret.speciality}
                    </p>

                    <div className="grid grid-cols-2 gap-2 mt-3 text-xs text-[#1A1C18]/70">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-[#B8562D] shrink-0" />
                        <span className="truncate">{ret.mandiLocation}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-[#1A1C18]/50 shrink-0" />
                        <span>{ret.operatingHours}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#EBE7DC] flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#1A1C18]/60 flex items-center gap-1">
                      <Navigation className="w-3.5 h-3.5 text-[#B8562D]" />
                      <span>{ret.distanceKm} km away</span>
                    </span>

                    <a
                      href={`tel:${ret.phone}`}
                      className="flex items-center gap-1 px-3 py-1.5 bg-[#3F6B3A] hover:bg-[#355B31] text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow-2xs"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>Call {ret.phone}</span>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: MY PROCUREMENT ORDERS */}
        {activeTab === 'my-orders' && (
          <div className="space-y-6">
            <div>
              <h2 className="font-headline font-bold text-xl text-[#1A1C18] flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-[#B8562D]" />
                <span>My Procurement Contracts & Bids</span>
              </h2>
              <p className="text-xs text-[#1A1C18]/70">
                Track status of submitted purchase offers, farmer confirmations, and dispatched farm deliveries.
              </p>
            </div>

            <div className="space-y-4">
              {myOrders.map((order) => (
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
                      <span>Producer Farmer: <strong className="text-[#1A1C18]">{order.farmerName}</strong></span>
                      <span>&bull; Contact: <strong>{order.farmerPhone}</strong></span>
                      <span>&bull; Delivery To: {order.deliveryLocation}</span>
                      <span>&bull; Date: {order.orderDate}</span>
                    </div>

                    {order.notes && (
                      <p className="text-xs text-[#1A1C18]/80 italic bg-[#F4F1E8] p-2 rounded-lg border border-[#DCD6C8]/60">
                        "{order.notes}"
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col md:items-end gap-2 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-[#EBE7DC]">
                    <div className="text-left md:text-right">
                      <div className="text-xs text-[#1A1C18]/60">Total Contract Value</div>
                      <div className="font-headline font-bold text-xl text-[#B8562D] font-mono">
                        ₹{order.totalAmount.toLocaleString()}
                      </div>
                      <div className="text-[11px] text-[#1A1C18]/70">
                        {order.quantityKg} kg @ ₹{order.offeredPricePerQuintal}/Qtl
                      </div>
                    </div>

                    <a
                      href={`tel:${order.farmerPhone}`}
                      className="flex items-center gap-1 px-3 py-1.5 bg-[#F4F1E8] hover:bg-[#EBE7DC] text-[#1A1C18] rounded-lg text-xs font-bold border border-[#DCD6C8] transition-all cursor-pointer"
                    >
                      <Phone className="w-3.5 h-3.5 text-[#3F6B3A]" />
                      <span>Contact Farmer</span>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: MANDI PRICE BENCHMARK */}
        {activeTab === 'mandi-rates' && (
          <div className="space-y-6">
            <div>
              <h2 className="font-headline font-bold text-xl text-[#1A1C18]">
                APMC National Mandi Modal Benchmarks (₹ / Quintal)
              </h2>
              <p className="text-xs text-[#1A1C18]/70">
                Official price trends from key markets to assist in transparent price negotiations with farmers.
              </p>
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
                        <td className="py-3.5 px-4 font-mono font-bold text-[#B8562D] text-sm">₹{rate.modalPrice}</td>
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

      {/* Modal: Place Purchase Order / Offer */}
      {selectedListingForOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-[#DCD6C8] overflow-hidden">
            <div className="p-4 bg-[#B8562D] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5" />
                <h3 className="font-headline font-bold text-lg">
                  Place Procurement Offer: {selectedListingForOrder.cropName}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedListingForOrder(null)}
                className="p-1 rounded-lg hover:bg-white/20 text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePlaceOrderSubmit} className="p-5 space-y-4">
              <div className="bg-[#F4F1E8] p-3 rounded-xl border border-[#DCD6C8] text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-[#1A1C18]/70">Farmer:</span>
                  <strong>{selectedListingForOrder.farmerName}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#1A1C18]/70">Location:</span>
                  <span>{selectedListingForOrder.location}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#1A1C18]/70">Available Lot Size:</span>
                  <span>{selectedListingForOrder.quantityKg.toLocaleString()} kg</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#1A1C18]/70">Farmer Ask Price:</span>
                  <span className="font-bold text-[#3F6B3A]">₹{selectedListingForOrder.pricePerQuintal}/Qtl</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#1A1C18] mb-1">
                    Order Quantity (kg)
                  </label>
                  <input
                    type="number"
                    min="100"
                    max={selectedListingForOrder.quantityKg}
                    value={orderQuantityKg}
                    onChange={(e) => setOrderQuantityKg(parseInt(e.target.value) || 100)}
                    className="w-full py-2.5 px-3 rounded-lg border border-[#DCD6C8] text-sm focus:border-[#B8562D] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1A1C18] mb-1">
                    Offered Price (₹/Quintal)
                  </label>
                  <input
                    type="number"
                    min="500"
                    value={offeredPrice}
                    onChange={(e) => setOfferedPrice(parseInt(e.target.value) || 1000)}
                    className="w-full py-2.5 px-3 rounded-lg border border-[#DCD6C8] text-sm focus:border-[#B8562D] focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1A1C18] mb-1">
                  Delivery Destination / APMC Mandi
                </label>
                <input
                  type="text"
                  required
                  value={deliveryMandi}
                  onChange={(e) => setDeliveryMandi(e.target.value)}
                  placeholder="e.g. Vashi APMC Mandi, Navi Mumbai"
                  className="w-full py-2.5 px-3 rounded-lg border border-[#DCD6C8] text-sm focus:border-[#B8562D] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1A1C18] mb-1">
                  Packaging & Logistics Note
                </label>
                <textarea
                  rows={2}
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  placeholder="e.g. Jute bag packaging, direct farm truck pickup requested"
                  className="w-full py-2 px-3 rounded-lg border border-[#DCD6C8] text-xs focus:border-[#B8562D] focus:outline-hidden"
                />
              </div>

              {/* Deal Total Calculation */}
              <div className="p-3 bg-[#FCEEE7] rounded-xl border border-[#B8562D]/30 flex items-center justify-between">
                <span className="text-xs font-bold text-[#1A1C18]">Calculated Offer Total:</span>
                <span className="font-headline font-bold text-lg text-[#B8562D] font-mono">
                  ₹{Math.round((orderQuantityKg / 100) * offeredPrice).toLocaleString()}
                </span>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedListingForOrder(null)}
                  className="px-4 py-2 text-xs font-bold text-[#1A1C18]/80 hover:bg-[#EBE7DC] rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-[#B8562D] hover:bg-[#9E4823] text-white rounded-lg shadow-2xs cursor-pointer"
                >
                  Dispatch Purchase Offer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Crop Full Photo Preview */}
      {previewCropImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-[#DCD6C8] overflow-hidden">
            <div className="p-4 bg-[#1A1C18] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wheat className="w-5 h-5 text-[#B8562D]" />
                <h3 className="font-headline font-bold text-lg">{previewCropImage.cropName}</h3>
                <span className="text-xs text-white/70">({previewCropImage.variety})</span>
              </div>
              <button
                type="button"
                onClick={() => setPreviewCropImage(null)}
                className="p-1 rounded-lg hover:bg-white/20 text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div className="w-full h-72 rounded-xl overflow-hidden bg-[#EBE7DC] border border-[#DCD6C8]">
                <img
                  src={previewCropImage.imageUrl}
                  alt={previewCropImage.cropName}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-2.5 bg-[#F4F1E8] rounded-xl border border-[#DCD6C8]">
                  <span className="text-[#1A1C18]/60 block text-[10px]">Asking Rate</span>
                  <strong className="text-sm font-bold text-[#B8562D]">₹{previewCropImage.pricePerQuintal}/Qtl</strong>
                </div>
                <div className="p-2.5 bg-[#F4F1E8] rounded-xl border border-[#DCD6C8]">
                  <span className="text-[#1A1C18]/60 block text-[10px]">Available</span>
                  <strong className="text-sm font-bold text-[#1A1C18]">{previewCropImage.quantityKg.toLocaleString()} kg</strong>
                </div>
                <div className="p-2.5 bg-[#F4F1E8] rounded-xl border border-[#DCD6C8]">
                  <span className="text-[#1A1C18]/60 block text-[10px]">Quality</span>
                  <strong className="text-sm font-bold text-[#1A1C18]">Grade {previewCropImage.qualityGrade}</strong>
                </div>
                <div className="p-2.5 bg-[#F4F1E8] rounded-xl border border-[#DCD6C8]">
                  <span className="text-[#1A1C18]/60 block text-[10px]">Type</span>
                  <strong className="text-sm font-bold text-[#3F6B3A]">{previewCropImage.isOrganic ? 'Organic' : 'Standard'}</strong>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-[#EBE7DC]">
                <div className="text-xs text-[#1A1C18]/70">
                  Farmer: <strong>{previewCropImage.farmerName}</strong> • {previewCropImage.location}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const target = previewCropImage;
                    setPreviewCropImage(null);
                    handleOpenOrderModal(target);
                  }}
                  className="px-4 py-2 bg-[#B8562D] hover:bg-[#9E4823] text-white text-xs font-bold rounded-lg cursor-pointer"
                >
                  Place Offer Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Agri-Waste Photo Preview */}
      {previewWasteImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-[#DCD6C8] overflow-hidden">
            <div className="p-4 bg-[#8C7A3E] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Recycle className="w-5 h-5 text-white" />
                <h3 className="font-headline font-bold text-lg">{previewWasteImage.wasteType}</h3>
                <span className="text-xs text-white/80">({previewWasteImage.suggestedUse})</span>
              </div>
              <button
                type="button"
                onClick={() => setPreviewWasteImage(null)}
                className="p-1 rounded-lg hover:bg-white/20 text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div className="w-full h-72 rounded-xl overflow-hidden bg-[#EBE7DC] border border-[#DCD6C8]">
                <img
                  src={previewWasteImage.imageUrl}
                  alt={previewWasteImage.wasteType}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-2.5 bg-[#F4F1E8] rounded-xl border border-[#DCD6C8]">
                  <span className="text-[#1A1C18]/60 block text-[10px]">Price / Ton</span>
                  <strong className="text-sm font-bold text-[#8C7A3E]">₹{previewWasteImage.pricePerTon.toLocaleString()}</strong>
                </div>
                <div className="p-2.5 bg-[#F4F1E8] rounded-xl border border-[#DCD6C8]">
                  <span className="text-[#1A1C18]/60 block text-[10px]">Available</span>
                  <strong className="text-sm font-bold text-[#1A1C18]">{previewWasteImage.quantityTons} Tons</strong>
                </div>
                <div className="p-2.5 bg-[#F4F1E8] rounded-xl border border-[#DCD6C8]">
                  <span className="text-[#1A1C18]/60 block text-[10px]">Moisture</span>
                  <strong className="text-sm font-bold text-[#1A1C18]">{previewWasteImage.moisturePercent}% Bales</strong>
                </div>
                <div className="p-2.5 bg-[#F4F1E8] rounded-xl border border-[#DCD6C8]">
                  <span className="text-[#1A1C18]/60 block text-[10px]">Listing ID</span>
                  <strong className="text-xs font-mono text-[#8C7A3E]">#{previewWasteImage.id}</strong>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-[#EBE7DC]">
                <div className="text-xs text-[#1A1C18]/70">
                  Farmer: <strong>{previewWasteImage.farmerName}</strong> ({previewWasteImage.farmerPhone}) • {previewWasteImage.location}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const target = previewWasteImage;
                    setPreviewWasteImage(null);
                    showToast(`Direct procurement inquiry dispatched to farmer ${target.farmerName} for ${target.quantityTons} Tons of ${target.wasteType}!`);
                  }}
                  className="px-4 py-2 bg-[#8C7A3E] hover:bg-[#786834] text-white text-xs font-bold rounded-lg cursor-pointer shadow-2xs"
                >
                  Inquire Bulk Pickup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {isAccountModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-[#DCD6C8] overflow-hidden">
            <div className="p-4 bg-[#B8562D] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5" />
                <h3 className="font-headline font-bold text-lg">Buyer Account Profile</h3>
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
                  <span className="text-[#1A1C18]/60">Representative</span>
                  <span className="font-bold text-[#1A1C18] text-sm">{user.name}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-[#DCD6C8]">
                  <span className="text-[#1A1C18]/60">Firm Name</span>
                  <span className="font-bold text-[#1A1C18]">{user.buyerDetails?.businessName || 'Agro Wholesale'}</span>
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
                  <span className="text-[#1A1C18]/60">Delivery Hub</span>
                  <span className="font-bold text-[#1A1C18]">
                    {user.buyerDetails?.deliveryCity}
                  </span>
                </div>
              </div>

              {/* Danger Zone: Delete Account */}
              <div className="pt-3 border-t border-[#EBE7DC]">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-[#B8562D]">Delete Account</h4>
                    <p className="text-[11px] text-[#1A1C18]/60">
                      Permanently delete this buyer account and records.
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
                      Are you sure? This action is permanent and cannot be undone.
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
                        onClick={async () => {
                          setIsDeleteAccountModalOpen(false);
                          setIsAccountModalOpen(false);
                          try {
                            await firebaseDeleteUser(user.id);
                            showToast('Account deleted. Logging out...');
                          } catch (err) {
                            showToast(`Failed to delete account: ${err.message}`);
                          }
                        }}
                        className="flex-1 py-1.5 bg-[#B8562D] text-white text-xs font-bold rounded-lg cursor-pointer"
                      >
                        Yes, Delete Account
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
