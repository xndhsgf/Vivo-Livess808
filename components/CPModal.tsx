
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, Users, Search, Sparkles, Coins, Zap, UserPlus, Trash2 } from 'lucide-react';
import { User, GameSettings, CPPartner } from '../types';
import { db } from '../services/firebase';
import { doc, updateDoc, increment } from 'firebase/firestore';

interface CPModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  users: User[];
  gameSettings: GameSettings;
  onUpdateUser: (data: Partial<User>) => void;
}

const CPModal: React.FC<CPModalProps> = ({ isOpen, onClose, currentUser, users, gameSettings, onUpdateUser }) => {
  const [searchId, setSearchId] = useState('');
  const [selectedType, setSelectedType] = useState<'cp' | 'friend'>('cp');
  const [targetUser, setTargetUser] = useState<User | null>(null);

  if (!isOpen) return null;

  const handleSearch = () => {
    const found = users.find(u => u.customId?.toString() === searchId || u.id === searchId);
    if (found) {
       if (found.id === currentUser.id) return alert('لا يمكنك الارتباط بنفسك!');
       setTargetUser(found);
    } else {
       alert('المستخدم غير موجود');
    }
  };

  const handleEstablish = async () => {
    if (!targetUser) return;
    const isCp = selectedType === 'cp';
    const price = isCp ? (gameSettings.cpGiftPrice || 0) : (gameSettings.friendGiftPrice || 0);

    if (currentUser.coins < price) return alert('رصيدك لا يكفي لإتمام هذا الارتباط');

    try {
       const partnerData: CPPartner = { id: targetUser.id, name: targetUser.name, avatar: targetUser.avatar, type: selectedType };
       const selfData: CPPartner = { id: currentUser.id, name: currentUser.name, avatar: currentUser.avatar, type: selectedType };

       await updateDoc(doc(db, 'users', currentUser.id), { cpPartner: partnerData, coins: increment(-price) });
       await updateDoc(doc(db, 'users', targetUser.id), { cpPartner: selfData });

       onUpdateUser({ cpPartner: partnerData, coins: currentUser.coins - price });
       alert(`مبروك! تم تفعيل ${isCp ? 'الارتباط الملكي' : 'الصداقة المقربة'} بنجاح! ✨`);
       onClose();
    } catch (e) {
       alert('حدث خطأ أثناء تفعيل الارتباط');
    }
  };

  const handleBreakCP = async () => {
    if (!currentUser.cpPartner) return;
    
    if (!confirm('هل أنت متأكد من رغبتك في إنهاء هذا الارتباط؟ سيتم حذفه لدى الطرفين.')) return;

    try {
       const partnerId = currentUser.cpPartner.id;
       
       // حذف الارتباط لدى المستخدم الحالي
       await updateDoc(doc(db, 'users', currentUser.id), { cpPartner: null });
       
       // حذف الارتباط لدى الطرف الآخر
       await updateDoc(doc(db, 'users', partnerId), { cpPartner: null });

       onUpdateUser({ cpPartner: null });
       alert('تم إنهاء الارتباط بنجاح.');
       onClose();
    } catch (e) {
       alert('حدث خطأ أثناء محاولة إنهاء الارتباط');
    }
  };

  return (
    <div className="fixed inset-0 z-[180] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md font-cairo">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative w-full max-w-sm bg-slate-900 border border-pink-500/30 rounded-[2.5rem] overflow-hidden shadow-2xl"
        dir="rtl"
      >
        <div className="p-6 bg-gradient-to-br from-pink-600/20 to-purple-600/20 border-b border-white/5 relative text-center">
          <button onClick={onClose} className="absolute top-4 right-4 p-2 text-white/50 hover:text-white transition"><X size={20} /></button>
          <div className="w-16 h-16 bg-pink-500/20 rounded-full flex items-center justify-center mb-3 border border-pink-500/30 mx-auto shadow-lg">
            <Heart size={32} fill={currentUser.cpPartner ? "#ec4899" : "none"} className="text-pink-500" />
          </div>
          <h2 className="text-xl font-black text-white">نظام الارتباط والـ CP</h2>
        </div>

        <div className="p-6 space-y-6">
           {currentUser.cpPartner ? (
              <div className="space-y-4">
                 <div className="bg-gradient-to-r from-pink-600/10 via-purple-600/20 to-pink-600/10 rounded-[2rem] border border-pink-500/20 p-6 flex flex-col items-center">
                    <div className="flex items-center gap-4 mb-4">
                       <div className="relative">
                          <img src={currentUser.avatar} className="w-16 h-16 rounded-full border-2 border-white/20 object-cover" />
                          <div className="absolute -bottom-1 -right-1 text-xs">⭐</div>
                       </div>
                       <div className="flex flex-col items-center">
                          {currentUser.cpPartner.type === 'cp' ? <Heart size={24} fill="#ec4899" className="text-pink-500" /> : <Users size={24} className="text-blue-400" />}
                          <span className="text-[8px] font-black text-slate-500 uppercase mt-1">Status Active</span>
                       </div>
                       <div className="relative">
                          <img src={currentUser.cpPartner.avatar} className="w-16 h-16 rounded-full border-2 border-white/20 object-cover" />
                          <div className="absolute -bottom-1 -left-1 text-xs">💎</div>
                       </div>
                    </div>
                    <div className="text-center">
                       <p className="text-white font-black text-sm">أنت مرتبطة بـ <span className="text-pink-400">{currentUser.cpPartner.name}</span></p>
                       <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-tighter">
                          {currentUser.cpPartner.type === 'cp' ? 'Couple Relationship' : 'Close Friendship'}
                       </p>
                    </div>
                 </div>
                 
                 <div className="flex flex-col gap-2">
                    <button onClick={onClose} className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl text-white font-black text-xs hover:bg-white/10 transition-colors">إغلاق</button>
                    <button 
                      onClick={handleBreakCP} 
                      className="w-full py-4 bg-red-600/10 border border-red-500/20 rounded-2xl text-red-500 font-black text-xs flex items-center justify-center gap-2 hover:bg-red-600 hover:text-white transition-all group"
                    >
                       <Trash2 size={14} className="group-hover:animate-bounce" /> إنهاء الارتباط
                    </button>
                 </div>
              </div>
           ) : (
              <div className="space-y-5">
                 <div className="flex gap-2 p-1 bg-black/40 rounded-xl">
                    <button onClick={() => setSelectedType('cp')} className={`flex-1 py-2 rounded-lg text-[10px] font-black transition-all ${selectedType === 'cp' ? 'bg-pink-600 text-white shadow-lg' : 'text-slate-500'}`}>ارتباط CP</button>
                    <button onClick={() => setSelectedType('friend')} className={`flex-1 py-2 rounded-lg text-[10px] font-black transition-all ${selectedType === 'friend' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500'}`}>صداقة</button>
                 </div>

                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 pr-2">البحث عن الشريك عبر الـ ID:</label>
                    <div className="flex gap-2">
                       <input 
                         type="text" 
                         value={searchId}
                         onChange={(e) => setSearchId(e.target.value)}
                         className="flex-1 bg-black/40 border border-white/10 rounded-xl p-3 text-white text-xs font-black outline-none focus:border-pink-500/50"
                         placeholder="ID المستخدم..."
                       />
                       <button onClick={handleSearch} className="px-4 bg-slate-800 text-white rounded-xl active:scale-95 transition-all"><Search size={18}/></button>
                    </div>
                 </div>

                 {targetUser && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-4">
                       <div className="flex items-center gap-3">
                          <img src={targetUser.avatar} className="w-12 h-12 rounded-xl object-cover" />
                          <div className="flex-1 text-right">
                             <div className="text-xs font-black text-white">{targetUser.name}</div>
                             <div className="text-[9px] text-slate-500">ID: {targetUser.customId || targetUser.id}</div>
                          </div>
                          <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center"><UserPlus size={16} className="text-emerald-500" /></div>
                       </div>
                       
                       <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                          <div className="flex flex-col">
                             <span className="text-[8px] text-slate-500 font-bold uppercase">سعر التفعيل</span>
                             <div className="flex items-center gap-1 text-yellow-500 font-black text-sm">
                                {selectedType === 'cp' ? (gameSettings.cpGiftPrice || 0) : (gameSettings.friendGiftPrice || 0)} <Coins size={12} />
                             </div>
                          </div>
                          <button onClick={handleEstablish} className="px-6 py-2 bg-gradient-to-r from-pink-600 to-purple-600 text-white font-black text-[10px] rounded-xl shadow-lg active:scale-95 transition-all">تفعيل الآن</button>
                       </div>
                    </motion.div>
                 )}
              </div>
           )}
        </div>
      </motion.div>
    </div>
  );
};

export default CPModal;
