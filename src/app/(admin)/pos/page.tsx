'use client';

import React, { useState, useEffect } from 'react';
import { 
  Scissors, 
  DollarSign, 
  CreditCard, 
  Wallet, 
  Receipt, 
  Plus, 
  Minus, 
  Trash2, 
  User, 
  Clock, 
  Check, 
  Printer, 
  Share2, 
  Search, 
  Sparkles, 
  RefreshCw, 
  ShoppingBag, 
  UserCheck, 
  ChevronRight,
  ArrowRight,
  ShieldCheck,
  Percent,
  CheckCircle2,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

// Catalog Data
const CATALOG_CATEGORIES = ['All', 'Haircuts', 'Beard & Shave', 'Combos', 'Treatments', 'Retail Products'];

interface CatalogItem {
  id: string;
  name: string;
  category: string;
  price: number;
  duration: number; // in mins
  type: 'service' | 'product';
  badge?: string;
}

const CATALOG_ITEMS: CatalogItem[] = [
  { id: 'srv-1', name: 'Signature Skin Fade', category: 'Haircuts', price: 40, duration: 45, type: 'service', badge: 'Popular' },
  { id: 'srv-2', name: 'Classic Scissor Cut', category: 'Haircuts', price: 35, duration: 35, type: 'service' },
  { id: 'srv-3', name: 'Buzz Cut / Taper', category: 'Haircuts', price: 25, duration: 25, type: 'service' },
  { id: 'srv-4', name: 'Junior / Senior Cut', category: 'Haircuts', price: 28, duration: 30, type: 'service' },
  
  { id: 'srv-5', name: 'Executive Hot Towel Shave', category: 'Beard & Shave', price: 35, duration: 35, type: 'service', badge: 'Signature' },
  { id: 'srv-6', name: 'Beard Sculpt & Razor Edge', category: 'Beard & Shave', price: 25, duration: 25, type: 'service' },
  { id: 'srv-7', name: 'Mustache & Line Trim', category: 'Beard & Shave', price: 15, duration: 15, type: 'service' },
  
  { id: 'srv-8', name: 'The Executive Combo (Cut & Shave)', category: 'Combos', price: 65, duration: 60, type: 'service', badge: 'Best Value' },
  { id: 'srv-9', name: 'Full Grooming & Scalp Therapy', category: 'Combos', price: 80, duration: 75, type: 'service' },
  
  { id: 'srv-10', name: 'Charcoal Purifying Mask', category: 'Treatments', price: 20, duration: 15, type: 'service' },
  { id: 'srv-11', name: 'Deep Conditioning Scalp Scrub', category: 'Treatments', price: 22, duration: 20, type: 'service' },
  
  { id: 'prd-1', name: 'Matte Clay Pomade (100ml)', category: 'Retail Products', price: 24, duration: 0, type: 'product' },
  { id: 'prd-2', name: 'Cedarwood Beard Oil (50ml)', category: 'Retail Products', price: 28, duration: 0, type: 'product' },
  { id: 'prd-3', name: 'Sea Salt Texture Spray', category: 'Retail Products', price: 20, duration: 0, type: 'product' },
];

const BARBERS = [
  { id: 'b1', name: 'RJ (Master Barber)' },
  { id: 'b2', name: 'Marcus (Senior Barber)' },
  { id: 'b3', name: 'David (Artisan)' },
  { id: 'b4', name: 'Alex (Stylist)' },
];

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  type: 'service' | 'product';
  barberId: string;
}

export default function POSTerminalPage() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedBarberId, setSelectedBarberId] = useState('b1');
  const [customerName, setCustomerName] = useState('Walk-in Client');
  const [customerPhone, setCustomerPhone] = useState('');
  
  // Tips & Discounts
  const [tipAmount, setTipAmount] = useState<number>(0);
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  
  // Checkout & Modal state
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'qr_code' | 'split'>('cash');
  const [cashTendered, setCashTendered] = useState<number>(0);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<any>(null);

  // Filter Catalog
  const filteredCatalog = CATALOG_ITEMS.filter(item => {
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Cart operations
  const addToCart = (item: CatalogItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id && i.barberId === selectedBarberId);
      if (existing) {
        return prev.map(i => i.id === item.id && i.barberId === selectedBarberId 
          ? { ...i, quantity: i.quantity + 1 }
          : i
        );
      }
      return [...prev, {
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: 1,
        type: item.type,
        barberId: selectedBarberId,
      }];
    });
  };

  const updateQuantity = (index: number, delta: number) => {
    setCart(prev => {
      const updated = [...prev];
      const newQty = updated[index].quantity + delta;
      if (newQty <= 0) {
        updated.splice(index, 1);
      } else {
        updated[index].quantity = newQty;
      }
      return updated;
    });
  };

  const removeFromCart = (index: number) => {
    setCart(prev => prev.filter((_, i) => i !== index));
  };

  const clearCart = () => {
    setCart([]);
    setTipAmount(0);
    setDiscountPercent(0);
    setCustomerName('Walk-in Client');
    setCustomerPhone('');
  };

  // Calculations
  const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const discountAmount = Math.round((subtotal * discountPercent) / 100);
  const total = Math.max(0, subtotal - discountAmount + tipAmount);
  const changeDue = Math.max(0, cashTendered - total);

  // Set default cash tendered whenever total changes
  useEffect(() => {
    setCashTendered(total);
  }, [total]);

  const handleOpenCheckout = () => {
    if (cart.length === 0) return;
    setIsCheckoutOpen(true);
  };

  const handleCompleteSale = async () => {
    const orderRecord = {
      orderId: `ORD-${Date.now().toString().slice(-5)}`,
      customerName,
      customerPhone,
      barberName: BARBERS.find(b => b.id === selectedBarberId)?.name || 'Barber',
      items: cart,
      subtotal,
      discountAmount,
      tipAmount,
      total,
      paymentMethod,
      cashTendered,
      changeDue,
      date: new Date().toLocaleString(),
    };

    setCompletedOrder(orderRecord);
    setIsCheckoutOpen(false);
    setIsReceiptOpen(true);
    clearCart();
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden bg-background">
      {/* Top POS Action & Status Strip */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.08] bg-[#0E1014]/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground font-semibold">
              POS Terminal 01
            </span>
          </div>
          <span className="text-white/20">|</span>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span>Register Drawer:</span>
            <Badge variant="outline" className="border-emerald-500/40 text-emerald-400 bg-emerald-950/20 text-[10px] font-mono">
              OPEN ($200 Float)
            </Badge>
          </div>
        </div>

        {/* Servicing Barber Picker */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground hidden sm:inline">Active Barber:</span>
          <div className="flex items-center bg-[#16181D] border border-white/[0.08] rounded-md p-0.5">
            {BARBERS.map(barber => (
              <button
                key={barber.id}
                onClick={() => setSelectedBarberId(barber.id)}
                className={`px-2.5 py-1 text-xs rounded transition-all font-medium ${
                  selectedBarberId === barber.id
                    ? 'bg-primary text-black font-semibold shadow-sm'
                    : 'text-muted-foreground hover:text-white'
                }`}
              >
                {barber.name.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main POS Grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        {/* Left 7 Columns: Catalog & Quick-Pick */}
        <div className="lg:col-span-7 flex flex-col h-full border-r border-white/[0.08] bg-[#0A0C0F]">
          {/* Category Tabs & Search Bar */}
          <div className="p-3 border-b border-white/[0.08] space-y-2.5 bg-[#0E1014]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search cuts, shaves, combos, pomades (press / to focus)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-10 bg-[#16181D] border-white/[0.08] text-sm focus-visible:ring-primary"
              />
            </div>

            {/* Category Badges */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {CATALOG_CATEGORIES.map(category => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all ${
                    selectedCategory === category
                      ? 'bg-primary/20 text-primary border border-primary/40'
                      : 'bg-[#16181D] text-muted-foreground border border-white/[0.05] hover:text-white hover:bg-[#1E222A]'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* Catalog Item Tiles */}
          <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
            {filteredCatalog.map(item => (
              <button
                key={item.id}
                onClick={() => addToCart(item)}
                className="group relative flex flex-col justify-between p-3.5 rounded-xl border border-white/[0.08] bg-[#121418] hover:bg-[#181B22] hover:border-primary/50 text-left transition-all duration-150 active:scale-[0.98] shadow-sm hover:shadow-md"
              >
                <div>
                  <div className="flex items-start justify-between gap-1 mb-2">
                    <span className="text-xs font-mono uppercase text-muted-foreground flex items-center gap-1">
                      {item.type === 'service' ? <Scissors className="h-3 w-3 text-primary" /> : <ShoppingBag className="h-3 w-3 text-amber-400" />}
                      {item.type}
                    </span>
                    {item.badge && (
                      <Badge className="bg-primary/10 text-primary text-[10px] border-primary/30 px-1.5 py-0">
                        {item.badge}
                      </Badge>
                    )}
                  </div>
                  <h4 className="font-semibold text-sm text-foreground line-clamp-2 leading-tight group-hover:text-primary transition-colors">
                    {item.name}
                  </h4>
                  {item.duration > 0 && (
                    <span className="text-[11px] text-muted-foreground flex items-center gap-1 mt-1">
                      <Clock className="h-3 w-3" />
                      {item.duration} min
                    </span>
                  )}
                </div>

                <div className="mt-3 pt-2 border-t border-white/[0.05] flex items-center justify-between">
                  <span className="font-mono text-base font-bold text-foreground group-hover:text-primary">
                    ${item.price}
                  </span>
                  <div className="h-7 w-7 rounded-lg bg-primary/10 group-hover:bg-primary text-primary group-hover:text-black flex items-center justify-center transition-colors">
                    <Plus className="h-4 w-4" />
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right 5 Columns: Active Ticket / Cart */}
        <div className="lg:col-span-5 flex flex-col h-full bg-[#0E1014]">
          {/* Ticket Header & Customer Selection */}
          <div className="p-3 border-b border-white/[0.08] bg-[#121418] space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt className="h-4 w-4 text-primary" />
                <span className="font-bold text-sm text-foreground uppercase tracking-wider">
                  Current Ticket
                </span>
                <Badge variant="outline" className="border-white/10 text-xs font-mono">
                  {cart.reduce((a, b) => a + b.quantity, 0)} items
                </Badge>
              </div>

              {cart.length > 0 && (
                <button
                  onClick={clearCart}
                  className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Clear
                </button>
              )}
            </div>

            {/* Quick Customer Attachment */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <User className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Customer Name..."
                  className="pl-8 h-8 text-xs bg-[#16181D] border-white/[0.08]"
                />
              </div>
              <Input
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="Phone (optional)..."
                className="h-8 text-xs bg-[#16181D] border-white/[0.08] w-36"
              />
            </div>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-muted-foreground">
                <div className="h-12 w-12 rounded-full bg-white/[0.04] border border-white/[0.08] flex items-center justify-center mb-3">
                  <Scissors className="h-5 w-5 text-muted-foreground/60" />
                </div>
                <p className="text-sm font-medium text-foreground">Ticket is Empty</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-[220px]">
                  Select services or retail products from the left catalog to start checkout.
                </p>
              </div>
            ) : (
              cart.map((item, index) => (
                <div
                  key={`${item.id}-${index}`}
                  className="flex items-center justify-between p-2.5 rounded-lg border border-white/[0.05] bg-[#14161C] hover:border-white/10 transition-all"
                >
                  <div className="flex-1 min-w-0 mr-3">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-foreground truncate">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs font-mono text-muted-foreground">${item.price} each</span>
                      <span className="text-[10px] text-primary/80 font-mono">
                        ({BARBERS.find(b => b.id === item.barberId)?.name.split(' ')[0]})
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center border border-white/[0.1] rounded-md bg-[#181B22]">
                      <button
                        onClick={() => updateQuantity(index, -1)}
                        className="h-6 w-6 flex items-center justify-center hover:bg-white/[0.05] text-muted-foreground hover:text-white"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="px-2 text-xs font-mono font-semibold text-foreground">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(index, 1)}
                        className="h-6 w-6 flex items-center justify-center hover:bg-white/[0.05] text-muted-foreground hover:text-white"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>

                    <span className="font-mono text-xs font-bold text-foreground w-12 text-right">
                      ${item.price * item.quantity}
                    </span>

                    <button
                      onClick={() => removeFromCart(index)}
                      className="text-muted-foreground/50 hover:text-red-400 p-1 transition-colors"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Ticket Footer / Summary & Tender */}
          <div className="p-3 border-t border-white/[0.08] bg-[#121418] space-y-3">
            {/* Quick Tips & Discounts Controls */}
            {cart.length > 0 && (
              <div className="space-y-2 pb-2 border-b border-white/[0.05]">
                {/* Tip Buttons */}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Barber Tip:</span>
                  <div className="flex items-center gap-1">
                    {[0, 3, 5, 10].map(tip => (
                      <button
                        key={tip}
                        onClick={() => setTipAmount(tip)}
                        className={`px-2 py-0.5 rounded text-[11px] font-mono transition-all ${
                          tipAmount === tip
                            ? 'bg-primary text-black font-bold'
                            : 'bg-[#181B22] border border-white/[0.08] text-muted-foreground hover:text-white'
                        }`}
                      >
                        {tip === 0 ? 'None' : `$${tip}`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Discount */}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Discount:</span>
                  <div className="flex items-center gap-1">
                    {[0, 10, 15, 20].map(disc => (
                      <button
                        key={disc}
                        onClick={() => setDiscountPercent(disc)}
                        className={`px-2 py-0.5 rounded text-[11px] font-mono transition-all ${
                          discountPercent === disc
                            ? 'bg-amber-400 text-black font-bold'
                            : 'bg-[#181B22] border border-white/[0.08] text-muted-foreground hover:text-white'
                        }`}
                      >
                        {disc === 0 ? '0%' : `${disc}%`}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Calculations Breakdown */}
            <div className="space-y-1 text-xs">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span className="font-mono">${subtotal}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-amber-400">
                  <span>Discount ({discountPercent}%)</span>
                  <span className="font-mono">-${discountAmount}</span>
                </div>
              )}
              {tipAmount > 0 && (
                <div className="flex justify-between text-primary">
                  <span>Direct Barber Tip</span>
                  <span className="font-mono">+${tipAmount}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold text-foreground pt-1 border-t border-white/[0.08]">
                <span>Total Due</span>
                <span className="font-mono text-primary text-lg">${total}</span>
              </div>
            </div>

            {/* Fast Checkout Trigger */}
            <Button
              disabled={cart.length === 0}
              onClick={handleOpenCheckout}
              className="w-full h-12 text-base font-bold bg-primary text-black hover:bg-primary/90 transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer"
            >
              <span>Pay & Complete</span>
              <span className="font-mono font-extrabold text-black">(${total})</span>
              <ChevronRight className="h-5 w-5 ml-1" />
            </Button>
          </div>
        </div>
      </div>

      {/* Multi-Tender Payment Modal */}
      <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
        <DialogContent className="max-w-md bg-[#121418] border-white/[0.1] text-foreground p-5">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center justify-between">
              <span>Checkout & Payment</span>
              <span className="font-mono text-primary text-2xl">${total}</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Tender Options */}
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setPaymentMethod('cash')}
                className={`flex flex-col items-center justify-center p-3 rounded-lg border text-xs font-semibold gap-1.5 transition-all ${
                  paymentMethod === 'cash'
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-white/[0.08] bg-[#16181D] text-muted-foreground hover:text-white'
                }`}
              >
                <DollarSign className="h-5 w-5" />
                <span>Cash</span>
              </button>

              <button
                onClick={() => setPaymentMethod('card')}
                className={`flex flex-col items-center justify-center p-3 rounded-lg border text-xs font-semibold gap-1.5 transition-all ${
                  paymentMethod === 'card'
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-white/[0.08] bg-[#16181D] text-muted-foreground hover:text-white'
                }`}
              >
                <CreditCard className="h-5 w-5" />
                <span>Card Terminal</span>
              </button>

              <button
                onClick={() => setPaymentMethod('qr_code')}
                className={`flex flex-col items-center justify-center p-3 rounded-lg border text-xs font-semibold gap-1.5 transition-all ${
                  paymentMethod === 'qr_code'
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-white/[0.08] bg-[#16181D] text-muted-foreground hover:text-white'
                }`}
              >
                <Wallet className="h-5 w-5" />
                <span>GCash / QR</span>
              </button>
            </div>

            {/* Cash Tender Calculation */}
            {paymentMethod === 'cash' && (
              <div className="space-y-3 p-3 rounded-lg bg-[#16181D] border border-white/[0.05]">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Fast Cash Presets:</span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[total, 20, 50, 100].map((preset, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCashTendered(preset)}
                      className={`h-9 rounded font-mono text-xs font-bold border transition-all ${
                        cashTendered === preset
                          ? 'border-primary bg-primary text-black'
                          : 'border-white/[0.08] bg-[#1A1E26] text-foreground hover:border-white/20'
                      }`}
                    >
                      {idx === 0 ? 'Exact' : `$${preset}`}
                    </button>
                  ))}
                </div>

                <div className="pt-2">
                  <label className="text-xs text-muted-foreground block mb-1">Amount Tendered</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="number"
                      value={cashTendered}
                      onChange={(e) => setCashTendered(Number(e.target.value) || 0)}
                      className="pl-8 h-10 font-mono text-lg font-bold bg-[#121418] border-white/[0.1]"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-white/[0.05]">
                  <span className="text-xs font-semibold text-muted-foreground">Change Due:</span>
                  <span className="font-mono text-lg font-extrabold text-emerald-400">
                    ${changeDue}
                  </span>
                </div>
              </div>
            )}

            {paymentMethod === 'card' && (
              <div className="p-4 rounded-lg bg-[#16181D] border border-white/[0.05] text-center space-y-2">
                <CreditCard className="h-8 w-8 text-primary mx-auto animate-pulse" />
                <p className="text-sm font-semibold text-foreground">Tap, Insert, or Swipe Card</p>
                <p className="text-xs text-muted-foreground">Terminal connected & waiting for client authorization.</p>
              </div>
            )}

            {paymentMethod === 'qr_code' && (
              <div className="p-4 rounded-lg bg-[#16181D] border border-white/[0.05] text-center space-y-2">
                <div className="h-28 w-28 bg-white p-2 rounded-lg mx-auto flex items-center justify-center">
                  <div className="h-full w-full border-2 border-black flex items-center justify-center text-[10px] font-mono text-black text-center font-bold">
                    SCAN TO PAY<br/>${total}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">Customer scans dynamic QR code via GCash or Maya.</p>
              </div>
            )}
          </div>

          <DialogFooter className="flex sm:justify-between gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setIsCheckoutOpen(false)}
              className="border-white/10 hover:bg-white/[0.05]"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCompleteSale}
              className="bg-primary text-black font-bold hover:bg-primary/90"
            >
              <Check className="h-4 w-4 mr-1.5" />
              Complete Sale
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Printable Thermal Receipt Modal */}
      <Dialog open={isReceiptOpen} onOpenChange={setIsReceiptOpen}>
        <DialogContent className="max-w-sm bg-neutral-900 border-neutral-800 text-neutral-100 p-6">
          <div className="space-y-4 font-mono text-xs">
            {/* Receipt Header */}
            <div className="text-center space-y-1 pb-3 border-b border-dashed border-neutral-700">
              <h3 className="font-bold text-sm tracking-wider uppercase text-white">RJ BARBER SALON</h3>
              <p className="text-[10px] text-neutral-400">123 Style Avenue, Grooming District</p>
              <p className="text-[10px] text-neutral-400">Tel: (555) 123-4567</p>
              <div className="pt-2 text-[10px] text-neutral-400 flex justify-between">
                <span>Receipt: #{completedOrder?.orderId}</span>
                <span>{completedOrder?.date}</span>
              </div>
              <div className="text-[10px] text-neutral-400 text-left">
                <span>Barber: {completedOrder?.barberName}</span>
              </div>
            </div>

            {/* Line Items */}
            <div className="space-y-1.5 py-1">
              {completedOrder?.items.map((item: any, idx: number) => (
                <div key={idx} className="flex justify-between">
                  <span>{item.quantity}x {item.name}</span>
                  <span>${item.price * item.quantity}</span>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="pt-2 border-t border-dashed border-neutral-700 space-y-1">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>${completedOrder?.subtotal}</span>
              </div>
              {completedOrder?.discountAmount > 0 && (
                <div className="flex justify-between text-neutral-300">
                  <span>Discount:</span>
                  <span>-${completedOrder?.discountAmount}</span>
                </div>
              )}
              {completedOrder?.tipAmount > 0 && (
                <div className="flex justify-between text-neutral-300">
                  <span>Barber Tip:</span>
                  <span>+${completedOrder?.tipAmount}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-sm text-white pt-1">
                <span>TOTAL:</span>
                <span>${completedOrder?.total}</span>
              </div>
              <div className="flex justify-between text-neutral-400 text-[11px] pt-1">
                <span>Payment ({completedOrder?.paymentMethod.toUpperCase()}):</span>
                <span>${completedOrder?.cashTendered}</span>
              </div>
              {completedOrder?.paymentMethod === 'cash' && (
                <div className="flex justify-between text-emerald-400 text-[11px]">
                  <span>Change Given:</span>
                  <span>${completedOrder?.changeDue}</span>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="text-center pt-3 border-t border-dashed border-neutral-700 text-[10px] text-neutral-400 space-y-1">
              <p>Thank you for choosing RJ Barber Salon!</p>
              <p className="font-sans text-[9px] uppercase tracking-widest text-neutral-500">
                Precision Cuts · Timeless Craftsmanship
              </p>
            </div>
          </div>

          <div className="flex gap-2 pt-3">
            <Button
              variant="outline"
              onClick={() => window.print()}
              className="flex-1 border-neutral-700 hover:bg-neutral-800 text-xs font-mono"
            >
              <Printer className="h-3.5 w-3.5 mr-1" />
              Print Receipt
            </Button>
            <Button
              onClick={() => setIsReceiptOpen(false)}
              className="flex-1 bg-primary text-black font-bold hover:bg-primary/90 text-xs"
            >
              New Sale
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
