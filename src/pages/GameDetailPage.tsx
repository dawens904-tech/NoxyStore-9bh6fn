import { useEffect, useState, useMemo, useRef } from "react";
import { Footer } from "@/components/layout/Footer";
import { MobileFooter } from "@/components/layout/MobileFooter";
import { DesktopHeader } from "@/components/layout/DesktopHeader";
import { Header } from "@/components/layout/Header";
import { FloatingChat } from "@/components/features/FloatingChat";
import { lootbarApi } from "@/lib/lootbar-api";
import type { LootbarGame, SkuItem } from "@/types";
import { trackEvent } from "@/lib/analytics";
import { toast } from "sonner";
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { createClient } from '@supabase/supabase-js';
import { Star, Info, ArrowLeft, Zap, Shield, Headphones, Gift, Copy, Check, Users } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';


const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

interface Game {
  id: string;
  name: string;
  slug: string;
  image: string;
  description: string;
  short_description: string;
  full_description: string;
  how_to_topup: string;
  platform_info: string;
  server_info: string;
  rating: number;
  total_reviews: number;
  total_sold: number;
  requires_server: boolean;
  requires_player_id: boolean;
}

interface Server {
  id: string;
  name: string;
  code: string;
}

interface Product {
  id: string;
  server_id: string | null;
  name: string;
  description: string;
  short_description: string;
  image: string;
  original_price: number;
  sale_price: number;
  discount_percent: number;
}

export default function GameTopUpPage() {
  const { gameSlug } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();

  const [game, setGame] = useState<Game | null>(null);
  const [servers, setServers] = useState<Server[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedServer, setSelectedServer] = useState<string>('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);
  
  // Invite Friends System
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [shareMessage, setShareMessage] = useState('');
  const [shareUrl, setShareUrl] = useState('');
  const [shortUrl, setShortUrl] = useState('');
  const [useShortLink, setUseShortLink] = useState(false);
  const [copied, setCopied] = useState(false);
  const [referralStats, setReferralStats] = useState({ completed: 0, pending: 0 });
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  
  // Countdown timer (starts at 12 minutes)
  const [countdown, setCountdown] = useState(12 * 60);

  // Countdown timer effect
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          return 12 * 60; // Reset to 12 minutes
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Format countdown to MM:SS
  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  useEffect(() => {
    fetchGame();
    loadCurrentUser();
    
    // Track referral if share_token exists
    const shareToken = searchParams.get('share_token');
    if (shareToken && gameSlug) {
      trackReferralClick(shareToken, gameSlug);
    }
  }, [gameSlug]);

  useEffect(() => {
    if (game) {
      if (game.requires_server) {
        fetchServers();
      } else {
        fetchProducts(null);
      }
      loadShareMessage();
      loadReferralStats();
    }
  }, [game]);

  useEffect(() => {
    if (selectedServer) {
      fetchProducts(selectedServer);
      setSelectedProduct(null);
    }
  }, [selectedServer]);

  const loadCurrentUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
      }
    } catch (error) {
      console.error('Load user error:', error);
    }
  };

  const trackReferralClick = async (shareToken: string, productId: string) => {
    try {
      await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/track-referral`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({ share_token: shareToken, product_id: productId })
      });
    } catch (error) {
      console.error('Track referral error:', error);
    }
  };

  const loadShareMessage = async () => {
    if (!game) return;

    try {
      const { data, error } = await supabase
        .from('game_share_messages')
        .select('*')
        .eq('product_id', game.slug)
        .single();

      if (error || !data) {
        // Default message if none configured
        setShareMessage(
          `Running low on currency to buy your favorite items? Head to NoxyStore.com to purchase them now! Enjoy safe, reliable, and instant delivery at discounted prices!`
        );
        return;
      }

      // Replace {currency} placeholder
      const message = data.share_message_template.replace('{currency}', data.currency_name);
      setShareMessage(message);
    } catch (error) {
      console.error('Load share message error:', error);
    }
  };

  const loadReferralStats = async () => {
    if (!currentUserId) return;

    try {
      const { data, error } = await supabase
        .from('referral_tracking')
        .select('status')
        .eq('referrer_id', currentUserId);

      if (error) throw error;

      const completed = data?.filter(r => r.status === 'completed').length || 0;
      const pending = data?.filter(r => r.status === 'pending' || r.status === 'registered').length || 0;

      setReferralStats({ completed, pending });
    } catch (error) {
      console.error('Load referral stats error:', error);
    }
  };

  const generateShareUrl = () => {
    if (!game || !currentUserId) return '';

    const timestamp = Date.now();
    const shareToken = `${currentUserId}_${game.id}_${timestamp}`;
    const baseUrl = window.location.origin;
    
    return `${baseUrl}/top-up/${game.slug}?share_token=${shareToken}&utm_source=copy&utm_campaign=topup&utm_medium=social`;
  };

  const generateShortLink = async () => {
    if (!game || !currentUserId) return '';

    try {
      // Check if short link already exists for this user+game
      const { data: existing } = await supabase
        .from('referral_short_links')
        .select('short_code')
        .eq('user_id', currentUserId)
        .eq('product_id', game.slug)
        .single();

      if (existing) {
        return `${window.location.origin}/s/${existing.short_code}`;
      }

      // Generate new short code (6 characters)
      const shortCode = Math.random().toString(36).substring(2, 8);
      const fullUrl = generateShareUrl();
      const shareToken = fullUrl.split('share_token=')[1]?.split('&')[0] || '';

      const { data, error } = await supabase
        .from('referral_short_links')
        .insert({
          user_id: currentUserId,
          product_id: game.slug,
          short_code: shortCode,
          full_url: fullUrl,
          share_token: shareToken
        })
        .select()
        .single();

      if (error) throw error;

      return `${window.location.origin}/s/${data.short_code}`;
    } catch (error) {
      console.error('Generate short link error:', error);
      return generateShareUrl();
    }
  };

  const handleInviteClick = async () => {
    if (!currentUserId) {
      toast({
        title: 'Login Required',
        description: 'Please login to share and earn rewards',
        variant: 'destructive'
      });
      navigate('/login');
      return;
    }

    // Generate URLs
    const fullUrl = generateShareUrl();
    setShareUrl(fullUrl);

    const short = await generateShortLink();
    setShortUrl(short);

    setShowInviteModal(true);
  };

  const handleCopyLink = async () => {
    const url = useShortLink ? shortUrl : shareUrl;
    const fullMessage = `${shareMessage}\n${url}`;

    try {
      await navigator.clipboard.writeText(fullMessage);
      setCopied(true);
      toast({
        title: 'Copied!',
        description: 'Share link copied to clipboard'
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Copy error:', error);
    }
  };

  const handleSocialShare = (platform: string) => {
    const url = useShortLink ? shortUrl : shareUrl;
    const message = encodeURIComponent(`${shareMessage}\n${url}`);
    
    let shareLink = '';
    
    switch (platform) {
      case 'whatsapp':
        shareLink = `https://wa.me/?text=${message}`;
        break;
      case 'facebook':
        shareLink = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(shareMessage)}`;
        break;
      case 'twitter':
        shareLink = `https://twitter.com/intent/tweet?text=${message}`;
        break;
      case 'discord':
        handleCopyLink();
        toast({
          title: 'Ready to share',
          description: 'Message copied! Paste it in Discord'
        });
        return;
    }
    
    if (shareLink) {
      window.open(shareLink, '_blank', 'width=600,height=400');
    }
  };

  const fetchGame = async () => {
    try {
      const { data, error } = await supabase
        .from('games')
        .select('*')
        .eq('slug', gameSlug)
        .eq('is_active', true)
        .single();

      if (error) throw error;
      if (!data) {
        navigate('/');
        return;
      }

      setGame(data);
    } catch (error: any) {
      console.error('Fetch game error:', error);
      toast({
        title: 'Error',
        description: 'Game not found',
        variant: 'destructive',
      });
      navigate('/');
    }
  };

  const fetchServers = async () => {
    if (!game) return;

    try {
      const { data, error } = await supabase
        .from('game_servers')
        .select('*')
        .eq('game_id', game.id)
        .eq('is_active', true)
        .order('display_order');

      if (error) throw error;

      setServers(data || []);

      if (data && data.length > 0) {
        setSelectedServer(data[0].id);
      }
    } catch (error: any) {
      console.error('Fetch servers error:', error);
    }
  };

  const fetchProducts = async (serverId: string | null) => {
    if (!game) return;

    try {
      let query = supabase
        .from('game_products')
        .select('*')
        .eq('game_id', game.id)
        .eq('is_active', true);

      if (serverId) {
        query = query.eq('server_id', serverId);
      } else {
        query = query.is('server_id', null);
      }

      const { data, error } = await query.order('display_order');

      if (error) throw error;

      setProducts(data || []);
    } catch (error: any) {
      console.error('Fetch products error:', error);
      toast({
        title: 'Error',
        description: 'Failed to load products',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTopUpNow = () => {
    if (!selectedProduct) {
      toast({
        title: 'Select a product',
        description: 'Please select a product first',
        variant: 'destructive',
      });
      return;
    }

    navigate(`/player-id/${game!.id}?productId=${selectedProduct.id}&serverId=${selectedServer || ''}&quantity=${quantity}`);
  };

  if (isLoading || !game) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="lg:hidden bg-white border-b sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center mb-3">
            <button onClick={() => navigate(-1)} className="text-2xl mr-3">←</button>
            <h1 className="text-lg font-bold">Top-up</h1>
          </div>
          
          {/* Fast/Safe/24-7 Indicators - Mobile */}
          <div className="flex items-center justify-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <Zap className="h-4 w-4 text-yellow-500" />
              <span className="font-medium">Fast</span>
            </div>
            <div className="flex items-center gap-1">
              <Shield className="h-4 w-4 text-green-500" />
              <span className="font-medium">Safe</span>
            </div>
            <div className="flex items-center gap-1">
              <Headphones className="h-4 w-4 text-blue-500" />
              <span className="font-medium">24/7</span>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden lg:block bg-white border-b sticky top-0 z-40">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-5 w-5" />
              Back
            </button>
            
            {/* Fast/Safe/24-7 Indicators - Desktop */}
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-500" />
                <span className="font-semibold">Fast</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-green-500" />
                <span className="font-semibold">Safe</span>
              </div>
              <div className="flex items-center gap-2">
                <Headphones className="h-5 w-5 text-blue-500" />
                <span className="font-semibold">24/7</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Game Info Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 lg:px-6 py-4 lg:py-6">
          <div className="flex items-center gap-4 mb-4">
            <img src={game.image} alt={game.name} className="w-16 h-16 lg:w-20 lg:h-20 rounded-lg object-cover shadow-md" />
            <div className="flex-1">
              <h2 className="text-lg lg:text-2xl font-bold">{game.name}</h2>
              <div className="flex items-center gap-2 mt-1">
                <div className="bg-yellow-400 text-white px-2.5 py-0.5 rounded font-bold text-sm">
                  {game.rating.toFixed(1)}
                </div>
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i < Math.floor(game.rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm text-gray-600">{game.total_reviews.toLocaleString()}</span>
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                {game.total_sold}k+ Sold
              </div>
            </div>
          </div>

          {/* Invite Friends Banner with Countdown */}
          <button
            onClick={handleInviteClick}
            className="w-full bg-gradient-to-r from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600 text-white rounded-xl p-4 mb-4 transition-all shadow-lg hover:shadow-xl"
          >
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <Gift className="h-8 w-8" />
              </div>
              <div className="flex-1 text-left">
                <div className="font-bold text-lg">
                  Invite Friends and Get <span className="text-yellow-200">3*10%</span> OFF Discount
                </div>
                <div className="text-sm text-orange-100 mt-0.5">
                  Share with friends to unlock exclusive rewards
                </div>
              </div>
              <div className="bg-amber-800/50 px-4 py-2 rounded-lg">
                <div className="text-2xl font-bold font-mono tracking-wider">
                  {formatCountdown(countdown)}
                </div>
              </div>
            </div>
          </button>

          {/* Server Tabs */}
          {game.requires_server && servers.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {servers.map((server) => (
                <button
                  key={server.id}
                  onClick={() => setSelectedServer(server.id)}
                  className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-all flex-shrink-0 ${
                    selectedServer === server.id
                      ? 'bg-yellow-400 text-black'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {server.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4 lg:px-6 py-4 pb-32">
        {/* Products Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 lg:gap-4">
          {products.map((product) => (
            <div
              key={product.id}
              onClick={() => setSelectedProduct(product)}
              className={`relative bg-white rounded-xl overflow-hidden border-2 cursor-pointer transition-all hover:shadow-lg ${
                selectedProduct?.id === product.id
                  ? 'border-yellow-400 shadow-lg'
                  : 'border-gray-200'
              }`}
            >
              {product.description && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedProduct(product);
                    setShowInfoModal(true);
                  }}
                  className="absolute top-2 right-2 z-10 w-8 h-8 bg-gray-800/70 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-gray-800"
                >
                  <Info className="h-4 w-4" />
                </button>
              )}

              <div className="aspect-square bg-gradient-to-br from-gray-50 to-gray-100">
                <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
              </div>

              <div className="p-3 lg:p-4">
                <h3 className="font-semibold text-sm lg:text-base mb-2 line-clamp-2 min-h-[2.8rem]">
                  {product.name}
                </h3>

                <div className="flex items-baseline gap-1.5 mb-2">
                  <span className="text-red-500 font-bold text-base lg:text-lg">
                    ${product.sale_price.toFixed(2)}
                  </span>
                  {product.original_price > product.sale_price && (
                    <span className="text-gray-400 line-through text-xs">
                      ${product.original_price.toFixed(2)}
                    </span>
                  )}
                </div>

                {product.discount_percent > 0 && (
                  <span className="inline-block bg-orange-500 text-white px-2.5 py-1 rounded text-xs font-medium">
                    -{product.discount_percent}%
                  </span>
                )}
              </div>

              {selectedProduct?.id === product.id && (
                <div className="absolute top-2 left-2 bg-yellow-400 text-black rounded-full w-7 h-7 flex items-center justify-center font-bold">
                  ✓
                </div>
              )}
            </div>
          ))}
        </div>

        {products.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <p>No products available for this {game.requires_server && selectedServer ? 'server' : 'game'}.</p>
          </div>
        )}

        {/* Game Description Section */}
        {(game.short_description || game.full_description || game.how_to_topup) && (
          <div className="mt-8 bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-xl font-bold mb-4">Top-up Instructions</h2>
            
            {game.short_description && (
              <div className="mb-4">
                <p className="text-gray-700 whitespace-pre-wrap">{game.short_description}</p>
              </div>
            )}

            {game.platform_info && (
              <div className="mb-4">
                <h3 className="font-semibold text-gray-900 mb-2">Applicable Platform</h3>
                <p className="text-gray-700">{game.platform_info}</p>
              </div>
            )}

            {game.server_info && (
              <div className="mb-4">
                <h3 className="font-semibold text-gray-900 mb-2">Applicable Server</h3>
                <p className="text-gray-700 whitespace-pre-wrap">{game.server_info}</p>
              </div>
            )}

            {game.how_to_topup && (
              <div className="mb-4">
                <h3 className="font-semibold text-gray-900 mb-2">How to Top-up</h3>
                <div className="text-gray-700 whitespace-pre-wrap">{game.how_to_topup}</div>
              </div>
            )}

            {game.full_description && (
              <div>
                {!showFullDescription && (
                  <button
                    onClick={() => setShowFullDescription(true)}
                    className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-2"
                  >
                    Show More
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                )}
                
                {showFullDescription && (
                  <div>
                    <div className="text-gray-700 whitespace-pre-wrap mb-4">
                      {game.full_description}
                    </div>
                    <button
                      onClick={() => setShowFullDescription(false)}
                      className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-2"
                    >
                      Show Less
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            )}

            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className="text-4xl font-bold text-gray-900">{game.rating.toFixed(1)}</div>
                  <div className="flex items-center justify-center gap-1 mt-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < Math.floor(game.rating)
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    {game.total_reviews.toLocaleString()} reviews
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Fixed Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t shadow-2xl">
        <div className="container mx-auto px-4 py-3 lg:py-4">
          <div className="flex items-center gap-3 lg:gap-4">
            <div className="flex items-center border-2 rounded-xl border-gray-200">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="px-4 py-3 text-lg font-bold hover:bg-gray-50 transition-colors"
                disabled={quantity <= 1}
              >
                −
              </button>
              <span className="px-4 font-semibold min-w-[3rem] text-center">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="px-4 py-3 text-lg font-bold hover:bg-gray-50 transition-colors"
              >
                +
              </button>
            </div>

            <div className="flex-1">
              {selectedProduct && selectedProduct.discount_percent > 0 && (
                <div className="text-xs lg:text-sm text-orange-500 mb-1">
                  Savings ${((selectedProduct.original_price - selectedProduct.sale_price) * quantity).toFixed(2)} →
                </div>
              )}
              
              <div className="flex items-center justify-between gap-4">
                <div className="text-red-500 text-xl lg:text-2xl font-bold">
                  ${selectedProduct ? (selectedProduct.sale_price * quantity).toFixed(2) : '0.00'}
                </div>
                
                <Button
                  onClick={handleTopUpNow}
                  className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-3 px-6 lg:px-8 text-base lg:text-lg rounded-xl shadow-lg"
                  disabled={!selectedProduct}
                >
                  Top-up Now
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Product Info Modal */}
      <Dialog open={showInfoModal} onOpenChange={setShowInfoModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedProduct?.name || 'Product Details'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {selectedProduct?.image && (
              <img src={selectedProduct.image} alt={selectedProduct.name} className="w-full rounded-lg" />
            )}

            {selectedProduct?.description && (
              <p className="text-sm text-gray-600 whitespace-pre-wrap">
                {selectedProduct.description}
              </p>
            )}

            {selectedProduct && (
              <div className="text-center py-4 bg-accent rounded-lg">
                <div className="text-lg font-bold">{selectedProduct.name}</div>
                <div className="text-gray-600 text-sm mt-1">${selectedProduct.sale_price.toFixed(2)}</div>
              </div>
            )}

            <Button
              onClick={() => setShowInfoModal(false)}
              className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-bold"
            >
              Got it
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Invite Friends Modal */}
      <Dialog open={showInviteModal} onOpenChange={setShowInviteModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <Users className="h-6 w-6 text-orange-500" />
              Invite Friends
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Reward Claim Progress */}
            <div>
              <h3 className="font-semibold mb-3 text-center">Reward Claim Progress</h3>
              <div className="flex justify-center items-center gap-4">
                {[1, 2, 3].map((slot) => (
                  <div key={slot} className="text-center">
                    <div className={`w-20 h-20 rounded-full border-4 flex items-center justify-center mb-2 ${
                      referralStats.completed >= slot
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-300 bg-gray-50'
                    }`}>
                      {referralStats.completed >= slot ? (
                        <Check className="h-8 w-8 text-green-500" />
                      ) : (
                        <Users className="h-8 w-8 text-gray-400" />
                      )}
                    </div>
                    <div className="text-xs text-gray-600">
                      {referralStats.completed >= slot ? 'Claimed' : 'to be claimed'}
                    </div>
                    <div className="text-sm font-bold text-orange-500">10% OFF</div>
                  </div>
                ))}
              </div>
              <div className="text-center text-sm text-muted-foreground mt-4">
                {referralStats.completed}/3 rewards claimed
              </div>
            </div>

            {/* Share Options */}
            <div>
              <h3 className="font-semibold mb-3 text-center">Share to</h3>
              <div className="grid grid-cols-4 gap-4">
                <button
                  onClick={() => handleSocialShare('twitter')}
                  className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="w-12 h-12 rounded-full bg-black flex items-center justify-center">
                    <svg className="h-6 w-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                  </div>
                  <span className="text-xs font-medium">X</span>
                </button>

                <button
                  onClick={() => handleSocialShare('facebook')}
                  className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center">
                    <svg className="h-6 w-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  </div>
                  <span className="text-xs font-medium">Facebook</span>
                </button>

                <button
                  onClick={() => handleSocialShare('whatsapp')}
                  className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center">
                    <svg className="h-6 w-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                    </svg>
                  </div>
                  <span className="text-xs font-medium">WhatsApp</span>
                </button>

                <button
                  onClick={() => handleSocialShare('discord')}
                  className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center">
                    <svg className="h-6 w-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
                    </svg>
                  </div>
                  <span className="text-xs font-medium">Discord</span>
                </button>
              </div>
            </div>

            {/* Copy Link Section */}
            <div>
              <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-3">
                <input
                  type="text"
                  value={useShortLink ? shortUrl : shareUrl}
                  readOnly
                  className="flex-1 bg-transparent text-sm outline-none"
                />
                <Button
                  onClick={handleCopyLink}
                  size="sm"
                  className="bg-yellow-400 hover:bg-yellow-500 text-black gap-2"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied ? 'Copied' : 'Copy Link'}
                </Button>
              </div>

              <label className="flex items-center gap-2 mt-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useShortLink}
                  onChange={(e) => setUseShortLink(e.target.checked)}
                  className="w-4 h-4 accent-orange-500"
                />
                <span className="text-sm">Share with a shorter link</span>
              </label>
            </div>

            {/* Rules */}
            <div className="bg-orange-50 rounded-lg p-4">
              <h4 className="font-semibold text-sm mb-2">Rules:</h4>
              <ol className="text-xs text-gray-700 space-y-1 list-decimal list-inside">
                <li>After successfully inviting a friend to register on NoxyStore, both the inviter and the newly registered user receive a 10% OFF coupon (max $10 discount).</li>
                <li>Inviter can receive up to 3 coupons.</li>
                <li>Invited user must be a brand-new NoxyStore user.</li>
                <li>Invited user's Game ID must never have been recharged before.</li>
              </ol>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Footer - Mobile */}
      <div className="block lg:hidden">
        <MobileFooter />
      </div>

      {/* Footer - Desktop */}
      <div className="hidden lg:block">
        <Footer />
      </div>
      please remove lootbar function and all related code, also remove the lootbar component from the imports.