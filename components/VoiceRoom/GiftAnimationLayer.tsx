
// Import useRef from react to fix 'Cannot find name useRef' error
import React, { useState, useEffect, useImperativeHandle, forwardRef, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../../services/firebase';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { User } from '../../types';

interface GiftEvent {
  id: string;
  giftId: string;
  giftName: string;
  giftIcon: string;
  giftAnimation: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  recipientIds: string[];
  quantity: number;
  timestamp: any;
}

interface GiftAnimationLayerProps {
  roomId: string;
  speakers: User[];
  currentUserId: string;
}

// استخدام forwardRef لتمكين التشغيل اليدوي من المكون الأب
export const GiftAnimationLayer = forwardRef((props: GiftAnimationLayerProps, ref) => {
  const { roomId, currentUserId } = props;
  const [activeAnimations, setActiveAnimations] = useState<GiftEvent[]>([]);
  // useRef is now correctly imported
  const playedIds = useRef(new Set<string>());

  const triggerAnimation = (event: GiftEvent) => {
    if (playedIds.current.has(event.id)) return;
    playedIds.current.add(event.id);

    setActiveAnimations(prev => [...prev, event]);
    const duration = event.giftAnimation === 'full-screen' ? 4500 : 3000;
    
    setTimeout(() => {
      setActiveAnimations(prev => prev.filter(a => a.id !== event.id));
      // تنظيف الذاكرة بعد فترة
      setTimeout(() => playedIds.current.delete(event.id), 10000);
    }, duration);
  };

  // تسمح للأب بتشغيل الأنميشن فوراً
  useImperativeHandle(ref, () => ({
    trigger: (event: GiftEvent) => triggerAnimation(event)
  }));

  useEffect(() => {
    const q = query(
      collection(db, 'rooms', roomId, 'gift_events'),
      orderBy('timestamp', 'desc'),
      limit(5)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          const data = change.doc.data();
          const newEvent = { id: change.doc.id, ...data } as GiftEvent;
          
          // إذا كان المرسل هو المستخدم الحالي، نتجاهل الإشعار لأنه تم تشغيله يدوياً بالفعل
          if (newEvent.senderId === currentUserId) return;

          const now = Date.now();
          // التعامل مع الطابع الزمني الذي قد يكون null في البداية عند الكتابة المحلية
          const eventTime = data.timestamp?.toMillis ? data.timestamp.toMillis() : now;
          
          if (now - eventTime < 10000) { // نافذة 10 ثوانٍ لضمان الالتقاط
            triggerAnimation(newEvent);
          }
        }
      });
    });

    return () => unsubscribe();
  }, [roomId, currentUserId]);

  const renderGiftIcon = (icon: string) => {
    const isImage = icon.includes('http') || icon.includes('data:image') || icon.includes('base64');
    if (isImage) {
      return <img src={icon} className="w-full h-full object-contain drop-shadow-[0_0_30px_rgba(255,255,255,0.6)]" alt="" />;
    }
    return <span className="text-8xl drop-shadow-2xl">{icon}</span>;
  };

  return (
    <div className="absolute inset-0 z-[100] pointer-events-none overflow-hidden">
      <AnimatePresence>
        {activeAnimations.map((event) => {
          const isFullScreen = event.giftAnimation === 'full-screen';
          
          return (
            <motion.div 
              key={event.id}
              initial={{ opacity: 0, scale: 0.5, y: 100 }}
              animate={isFullScreen ? {
                opacity: [0, 1, 1, 0],
                scale: [0.8, 1.1, 1.1, 1.2],
                y: 0
              } : {
                opacity: [0, 1, 1, 0],
                scale: [0.5, 1.5, 1.5, 2],
                y: [100, 0, 0, -100]
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: isFullScreen ? 4 : 2.5 }}
              className="absolute inset-0 flex flex-col items-center justify-center"
            >
              <div className={`relative ${isFullScreen ? 'w-80 h-80' : 'w-48 h-48'} flex items-center justify-center`}>
                 {isFullScreen && (
                    <motion.div 
                      animate={{ rotate: 360, scale: [1, 1.2, 1] }}
                      transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                      className="absolute inset-0 bg-gradient-to-r from-amber-500/20 via-pink-500/20 to-indigo-500/20 rounded-full blur-[60px]"
                    />
                 )}
                 <div className="relative z-10 w-full h-full flex items-center justify-center">
                    {renderGiftIcon(event.giftIcon)}
                 </div>
                 
                 {event.quantity > 1 && (
                    <motion.div 
                      initial={{ x: 50, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      className="absolute -right-8 top-1/2 bg-gradient-to-b from-yellow-400 to-orange-600 text-white font-black text-5xl px-4 py-1 rounded-2xl shadow-[0_0_20px_rgba(0,0,0,0.5)] border-2 border-white/20 italic z-20"
                    >
                       X{event.quantity}
                    </motion.div>
                 )}
              </div>
              
              {/* تم حذف قسم عرض اسم المرسل والهدية بناءً على طلبك لتركيز الواجهة على الأنميشن فقط */}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
});

export default GiftAnimationLayer;
