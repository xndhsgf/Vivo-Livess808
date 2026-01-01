
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic } from 'lucide-react';
import { User } from '../../types';

interface SeatProps {
  index: number;
  speaker: User | null;
  onClick: (index: number) => void;
  currentUser: User;
  sizeClass: string;
  customSkin?: string;
  isHost?: boolean;
}

const Seat: React.FC<SeatProps> = ({ index, speaker, onClick, currentUser, sizeClass, customSkin, isHost }) => {
  const isUrlEmoji = speaker?.activeEmoji?.startsWith('http') || speaker?.activeEmoji?.startsWith('data:');

  return (
    <div className={`relative flex items-center justify-center ${sizeClass} shrink-0 overflow-visible`}>
      <button 
        onClick={() => onClick(index)} 
        className="w-full h-full relative group transition-transform active:scale-90 flex items-center justify-center overflow-visible"
      >
        {speaker ? (
          <div className="relative w-full h-full p-0.5 flex flex-col items-center justify-center overflow-visible">
            
            {/* تم إزالة أيقونة التاج من هنا بناءً على طلب المستخدم */}

            {/* التفاعل النشط (الإيموجي) */}
            <AnimatePresence mode="popLayout">
              {speaker.activeEmoji && (
                <motion.div
                  key={`${speaker.id}-${speaker.activeEmoji}-${Date.now()}`}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ 
                    opacity: [0, 1, 1, 0],
                    scale: [0.5, 1.2, 1.2, 0.8],
                  }}
                  transition={{ duration: 3, times: [0, 0.1, 0.9, 1] }}
                  className="absolute inset-0 z-[150] flex items-center justify-center pointer-events-none"
                >
                  <div className="relative flex items-center justify-center w-full h-full max-w-[80%] max-h-[80%]">
                    {isUrlEmoji ? (
                       <img src={speaker.activeEmoji} className="w-full h-full object-contain drop-shadow-[0_0_15px_rgba(0,0,0,0.5)] filter brightness-110" alt="" />
                    ) : (
                       <span className="text-4xl drop-shadow-[0_0_10px_rgba(0,0,0,0.5)]">
                         {speaker.activeEmoji}
                       </span>
                    )}
                    <motion.div 
                      animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                      className="absolute inset-0 bg-white/30 blur-lg rounded-full -z-10"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* التوهج عند التحدث */}
            {!speaker.isMuted && (
              <motion.div 
                animate={{ 
                  scale: [1, 1.2, 1], 
                  opacity: [0.4, 0.7, 0.4],
                  boxShadow: [
                    "0 0 0px rgba(251,191,36,0)",
                    "0 0 15px rgba(251,191,36,0.5)",
                    "0 0 0px rgba(251,191,36,0)"
                  ]
                }}
                transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                className="absolute inset-0 z-0 rounded-full bg-amber-400/20"
              />
            )}

            {/* الدائرة الأساسية لصورة المستخدم */}
            <div className={`relative z-10 w-[88%] h-[88%] rounded-full overflow-hidden border bg-slate-900 shadow-xl flex items-center justify-center ${isHost ? 'border-amber-500/50' : 'border-white/20'}`}>
              <img src={speaker.avatar} className="w-full h-full object-cover" alt={speaker.name} />
              
              <AnimatePresence>
                {speaker.activeEmoji && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.4 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black z-[101]"
                  />
                )}
              </AnimatePresence>
            </div>

            {/* الإطارات */}
            {speaker.frame && (
              <img src={speaker.frame} className="absolute inset-0 w-full h-full object-contain z-20 scale-[1.15] pointer-events-none" />
            )}

            {/* معلومات المستخدم تحت الدائرة */}
            <div className="absolute -bottom-6 left-0 right-0 flex flex-col items-center gap-0.5 pointer-events-none">
               <span className={`text-[7px] font-black truncate drop-shadow-md px-1.5 py-0.5 rounded-full max-w-[48px] border leading-none ${isHost ? 'bg-amber-500 text-black border-amber-600' : 'bg-black/70 text-white border-white/5'}`}>
                  {speaker.name}
               </span>
               
               <motion.div 
                 initial={{ opacity: 0 }}
                 animate={{ opacity: 1 }}
                 className="flex items-center gap-0.5 px-1.5 py-0.5 bg-black/60 border border-white/20 rounded-full shadow-lg backdrop-blur-sm"
               >
                  <span className="text-white font-black text-[6px] leading-none tracking-tighter">
                     {(Number(speaker.charm || 0)).toLocaleString()}
                  </span>
                  <div className={`w-0.5 h-0.5 rounded-full animate-pulse ${isHost ? 'bg-amber-400 shadow-[0_0_5px_rgba(251,191,36,1)]' : 'bg-white shadow-[0_0_5px_white]'}`}></div>
               </motion.div>
            </div>
          </div>
        ) : (
          <div className="w-full h-full relative flex items-center justify-center">
            {customSkin ? (
               <img src={customSkin} className="w-full h-full object-contain filter drop-shadow-lg group-hover:scale-110 transition-all opacity-80" alt="Seat Skin" />
            ) : (
              <div className="w-full h-full rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-inner group-hover:bg-white/20 transition-all">
                 <span className="text-base filter grayscale opacity-40"> 🛋️ </span>
              </div>
            )}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
               <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/30">
                  <Mic size={10} className="text-white" />
               </div>
            </div>
          </div>
        )}
      </button>
    </div>
  );
};

export default Seat;
