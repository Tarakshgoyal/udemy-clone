'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingBag, Loader2 } from 'lucide-react';

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => { open: () => void };
  }
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => void;
  prefill?: Record<string, string>;
  theme?: { color: string };
  modal?: { ondismiss?: () => void };
}

interface Props {
  courseId: string;
  courseTitle: string;
  price: number;
  userName?: string;
  userEmail?: string;
}

export default function RazorpayCheckout({ courseId, courseTitle, price, userName, userEmail }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadRazorpay = (): Promise<boolean> =>
    new Promise(resolve => {
      if (window.Razorpay) return resolve(true);
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });

  const handleBuy = async () => {
    setError('');
    setLoading(true);

    try {
      const loaded = await loadRazorpay();
      if (!loaded) throw new Error('Failed to load Razorpay. Please check your connection.');

      // Create order
      const orderRes = await fetch('/api/razorpay/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId }),
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok) throw new Error(orderData.error ?? 'Failed to create order');

      // Open Razorpay checkout
      const rzp = new window.Razorpay({
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'Udemy Clone',
        description: courseTitle,
        order_id: orderData.orderId,
        handler: async (response) => {
          setLoading(true);
          try {
            const verifyRes = await fetch('/api/razorpay/verify-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(response),
            });
            const verifyData = await verifyRes.json();

            if (!verifyRes.ok) throw new Error(verifyData.error ?? 'Payment verification failed');

            router.push('/my-courses/learning?enrolled=true');
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Payment verification failed');
            setLoading(false);
          }
        },
        prefill: {
          name: userName ?? '',
          email: userEmail ?? '',
        },
        theme: { color: '#5624d0' },
        modal: {
          ondismiss: () => setLoading(false),
        },
      });

      rzp.open();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={handleBuy}
        disabled={loading}
        className="w-full bg-[#a435f0] hover:bg-[#8710d8] text-white font-bold py-3 flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <ShoppingBag className="w-4 h-4" />
        )}
        {loading ? 'Processing...' : `Buy Now — ₹${price}`}
      </button>
      {error && (
        <p className="text-red-600 text-xs mt-2 text-center">{error}</p>
      )}
    </div>
  );
}
