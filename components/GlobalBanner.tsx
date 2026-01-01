
import React from 'react';
import { motion } from 'framer-motion';
import { Flame, Trophy, Star, Sparkles, Crown, Zap } from 'lucide-react';
import { GlobalAnnouncement } from '../types';

interface GlobalBannerProps {
  announcement: GlobalAnnouncement;
}

const GlobalBanner: React.FC<GlobalBannerProps> = ({ announcement }) => {
  const isLuckyWin = announcement.type === 'lucky_win';
  const isLuckyBag = announcement.type === 'lucky_bag';

  const renderIcon = (icon: string) => {
    if (!icon) return null;
    const isImage = icon.startsWith('http') || icon.startsWith('data:');
    return isImage ? (
      <motion.img 
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ repeat: Infinity, duration: 2 }}
        src={icon} 
        className="w-12 h-12 object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.8)]" 
        alt="" 
      />
    ) : (
      <span className="text-4xl drop-shadow-lg">{icon}</span>
    );
  };

  const getContainerStyles = () => {
    if (isLuckyBag) return 'bg-gradient-to-r from-amber-600 via-yellow-300 to-amber-600 shadow-amber-500/60';
    if (isLuckyWin) return 'bg-gradient-to-r from-yellow-600 via-amber-300 to-orange-600 shadow-yellow-500/40';
    return 'bg-gradient-to-r from-purple-600 via-indigo-400 to-blue-600 shadow-purple-500/40';
  };

  return (
    <div className="fixed top-2 left-0 right-0 z-[10000] px-2 pointer-events-none">
      <motion.div
        initial={{ y: -120, opacity: 0, scale: 0.9 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: -120, opacity: 0, scale: 0.9 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className={`w-full max-w-lg mx-auto relative overflow-hidden rounded-2xl p-[2px] shadow-[0_20px_50px_rgba(0,0,0,0.8)] ${getContainerStyles()}`}
      >
        <div className="bg-black/90 backdrop-blur-3xl rounded-2xl px-5 py-2.5 flex items-center justify-between gap-4 relative overflow-hidden border border-white/10">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30 pointer-events-none"></div>

          <div className="flex items-center gap-4 shrink-0 relative z-10">
             <div className="relative">
                {renderIcon(announcement.giftIcon)}
                <div className={`absolute inset-0 blur-2xl opacity-40 rounded-full ${isLuckyWin || isLuckyBag ? 'bg-yellow-400' : 'bg-purple-500'}`}></div>
             </div>

             <div className="flex flex-col items-start leading-none gap-1">
                <div className="flex items-center gap-2">
                   <span className={`font-black text-sm italic tracking-tighter drop-shadow-md ${isLuckyWin || isLuckyBag ? 'text-yellow-400' : 'text-white'}`}>
                      {announcement.senderName}
                   </span>
                   
                   <span className={`text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border ${
                     isLuckyBag ? 'bg-amber-500/30 text-amber-200 border-amber-500/40' :
                     isLuckyWin ? 'bg-yellow-500/20 text-yellow-200 border-yellow-500/30' :
                     'bg-purple-500/20 text-purple-200 border-purple-500/30'
                   }`}>
                      {isLuckyBag ? 'كنز الغرفة' : isLuckyWin ? 'فوز ملكي بالحظ' : 'هدية كبرى'}
                   </span>
                </div>
                
                <div className="flex items-center gap-1.5">
                   {isLuckyBag ? (
                      <div className="flex items-center gap-1.5">
                         <span className="text-white/60 text-[10px] font-bold">ألقى كنزاً بمبلغ</span>
                         <div className="bg-amber-500/20 px-2 py-0.5 rounded-lg border border-amber-500/40 flex items-center gap-1">
                            <Zap size={12} className="text-yellow-400" />
                            <span className="text-yellow-400 font-black text-xs tracking-tighter">
                               {announcement.amount.toLocaleString()}
                            </span>
                         </div>
                      </div>
                   ) : isLuckyWin ? (
                      <div className="flex items-center gap-1.5">
                         <span className="text-white/60 text-[10px] font-bold">ربح من صندوق الحظ مبلغ</span>
                         <div className="bg-yellow-500/20 px-2 py-0.5 rounded-lg border border-yellow-500/40 flex items-center gap-1">
                            <Trophy size={12} className="text-yellow-400" />
                            <span className="text-yellow-400 font-black text-xs tracking-tighter">
                               {announcement.amount.toLocaleString()}
                            </span>
                         </div>
                      </div>
                   ) : (
                      <div className="flex items-center gap-1.5">
                         <span className="text-white/60 text-[10px] font-bold">أرسل {announcement.giftName} إلى</span>
                         <span className="text-blue-400 font-black text-xs truncate max-w-[80px] drop-shadow-md">{announcement.recipientName}</span>
                         <div className="bg-white/10 px-1.5 py-0.5 rounded text-[9px] text-yellow-500 font-black border border-white/5">
                            {announcement.amount.toLocaleString()} 🪙
                         </div>
                      </div>
                   )}
                </div>
             </div>
          </div>

          <div className="flex flex-col items-end pr-4 border-r border-white/10 shrink-0 relative z-10">
             <div className="flex items-center gap-1 mb-0.5">
                <Flame size={10} className={isLuckyWin || isLuckyBag ? 'text-orange-500 animate-pulse' : 'text-purple-400'} />
                <span className="text-[8px] text-white/40 uppercase font-black tracking-tighter">في غرفة</span>
             </div>
             <span className={`text-[10px] font-black truncate max-w-[90px] ${isLuckyWin || isLuckyBag ? 'text-amber-500' : 'text-pink-400'}`}>
                {announcement.roomTitle}
             </span>
          </div>

          <motion.div 
            animate={{ x: ['-200%', '400%'] }} 
            transition={{ repeat: Infinity, duration: 2.5, ease: "linear" }}
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -skew-x-12 w-1/4 pointer-events-none"
          />
        </div>

        {(isLuckyWin || isLuckyBag) && (
           <>
              <div className="absolute -left-1 -top-1 text-yellow-400 opacity-50"><Sparkles size={16}/></div>
              <div className="absolute -right-1 -bottom-1 text-orange-500 opacity-50"><Crown size={16}/></div>
           </>
        )}
      </motion.div>
    </div>
  );
};

export default GlobalBanner;
