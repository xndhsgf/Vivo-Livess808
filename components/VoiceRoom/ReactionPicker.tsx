
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DEFAULT_REACTIONS } from '../../constants/emojis';

interface ReactionPickerProps {
  isOpen: boolean;
  onSelect: (emoji: string) => void;
  onClose: () => void;
  emojis?: string[]; // استلام الإيموشنات المخصصة
}

const ReactionPicker: React.FC<ReactionPickerProps> = ({ isOpen, onSelect, onClose, emojis = [] }) => {
  // استخدام القائمة المخصصة إذا وجدت، وإلا استخدام القائمة الافتراضية
  const listToRender = emojis.length > 0 ? emojis : DEFAULT_REACTIONS;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-[100]" onClick={onClose} />
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="absolute bottom-24 left-4 right-4 bg-slate-900/95 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-6 z-[110] shadow-2xl"
          >
            <div className="grid grid-cols-5 gap-4 overflow-y-auto max-h-[40vh] scrollbar-hide">
              {listToRender.map((emoji, idx) => {
                const isUrl = emoji.startsWith('http') || emoji.startsWith('data:');
                return (
                  <button 
                    key={idx}
                    onClick={() => { onSelect(emoji); onClose(); }}
                    className="aspect-square flex items-center justify-center hover:bg-white/10 rounded-2xl transition-all active:scale-90 p-2"
                  >
                    {isUrl ? (
                      <img src={emoji} className="w-full h-full object-contain" alt="" />
                    ) : (
                      <span className="text-3xl">{emoji}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ReactionPicker;
