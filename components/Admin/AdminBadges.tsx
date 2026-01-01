
import React, { useState, useEffect } from 'react';
import { Search, Medal, Upload, Trash2, User as UserIcon, Plus, Sparkles, X, Send, CheckCircle2, UserMinus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { User } from '../../types';
import { db } from '../../services/firebase';
import { doc, getDoc, setDoc, arrayUnion, arrayRemove, updateDoc } from 'firebase/firestore';

interface AdminBadgesProps {
  users: User[];
  onUpdateUser: (userId: string, data: Partial<User>) => Promise<void>;
}

const compressImage = (base64: string, maxWidth: number, maxHeight: number, quality: number = 0.2): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;
      if (width > height) {
        if (width > maxWidth) { height *= maxWidth / width; width = maxWidth; }
      } else {
        if (height > maxHeight) { width *= maxHeight / height; height = maxHeight; }
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'low';
        ctx.drawImage(img, 0, 0, width, height);
      }
      resolve(canvas.toDataURL('image/webp', quality));
    };
  });
};

const AdminBadges: React.FC<AdminBadgesProps> = ({ users, onUpdateUser }) => {
  const [globalMedals, setGlobalMedals] = useState<string[]>([]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedMedal, setSelectedMedal] = useState<string | null>(null);
  
  const [withdrawSearch, setWithdrawSearch] = useState('');
  const [userToWithdraw, setUserToWithdraw] = useState<User | null>(null);

  const [isUploading, setIsUploading] = useState(false);
  const [isAwarding, setIsAwarding] = useState(false);

  useEffect(() => {
    const fetchMedals = async () => {
      const docRef = doc(db, 'appSettings', 'medals_library');
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        setGlobalMedals(snap.data().medals || []);
      }
    };
    fetchMedals();
  }, []);

  const filteredAwardUsers = searchQuery.trim() === '' ? [] : users.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.customId?.toString() === searchQuery ||
    u.id === searchQuery
  ).slice(0, 5);

  const filteredWithdrawUsers = withdrawSearch.trim() === '' ? [] : users.filter(u => 
    u.name.toLowerCase().includes(withdrawSearch.toLowerCase()) || 
    u.customId?.toString() === withdrawSearch ||
    u.id === withdrawSearch
  ).slice(0, 5);

  const handleUploadToLibrary = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const result = ev.target?.result as string;
        // الأوسمة صغيرة جداً 48x48
        const compressed = await compressImage(result, 48, 48, 0.2);
        try {
          const docRef = doc(db, 'appSettings', 'medals_library');
          await setDoc(docRef, { medals: arrayUnion(compressed) }, { merge: true });
          setGlobalMedals(prev => [...prev, compressed]);
        } catch (err) { alert('فشل رفع الوسام للمكتبة'); } finally { setIsUploading(false); }
      };
      reader.readAsDataURL(file);
    }
  };

  const removeFromLibrary = async (url: string) => {
    if (!confirm('هل تريد حذف هذا الوسام من المكتبة؟')) return;
    try {
      const docRef = doc(db, 'appSettings', 'medals_library');
      await updateDoc(docRef, { medals: arrayRemove(url) });
      setGlobalMedals(prev => prev.filter(m => m !== url));
    } catch (err) { alert('فشل الحذف من المكتبة'); }
  };

  const awardMedalToUser = async () => {
    if (!selectedUser || !selectedMedal) return;
    
    // تقييد صارم لعدد الأوسمة لمنع تجاوز الـ 1 ميجابايت
    if ((selectedUser.achievements || []).length >= 30) {
      alert('وصل هذا العضو للحد الأقصى المسموح به للأوسمة (30). يرجى سحب أوسمة قديمة أولاً لتجنب حظر الحساب.');
      return;
    }

    setIsAwarding(true);
    try {
      await onUpdateUser(selectedUser.id, { achievements: arrayUnion(selectedMedal) });
      alert(`تم منح الوسام لـ ${selectedUser.name} بنجاح! 🎖️`);
      setSelectedUser(null);
      setSelectedMedal(null);
      setSearchQuery('');
    } catch (err) { 
      console.error(err);
      alert('فشل المنح: المستند ممتلئ جداً (1MB). يرجى تطهير وسائط الحساب من صفحة "الأعضاء" أولاً.'); 
    } finally { setIsAwarding(false); }
  };

  const removeUserBadge = async (userId: string, badgeUrl: string) => {
     if(!confirm('هل أنت متأكد من سحب هذا الوسام من العضو؟')) return;
     try {
        await onUpdateUser(userId, { achievements: arrayRemove(badgeUrl) });
        if(userToWithdraw && userToWithdraw.id === userId) {
            setUserToWithdraw({
                ...userToWithdraw,
                achievements: (userToWithdraw.achievements || []).filter(a => a !== badgeUrl)
            });
        }
        alert('تم سحب الوسام بنجاح ✅');
     } catch(e) { alert('فشل سحب الوسام'); }
  };

  return (
    <div className="space-y-10 text-right" dir="rtl">
      <section>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
           <div>
              <h3 className="text-2xl font-black text-white flex items-center gap-3">
                 <Medal className="text-yellow-500" /> متجر الأوسمة (ضغط فائق)
              </h3>
              <p className="text-slate-500 text-xs font-bold mt-1">يتم ضغط الأوسمة تلقائياً إلى 48x48 لضمان عدم تجاوز حجم بيانات المستخدم.</p>
           </div>
           <label className={`flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl text-xs font-black cursor-pointer shadow-xl active:scale-95 transition-all ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}>
              {isUploading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Plus size={18} />}
              رفع وسام جديد
              <input type="file" accept="image/*" className="hidden" onChange={handleUploadToLibrary} />
           </label>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-8 gap-4">
           {globalMedals.map((medal, idx) => (
              <motion.div 
                whileHover={{ scale: 1.02 }}
                key={idx} 
                className={`relative group bg-slate-950/40 border-2 rounded-2xl p-2 flex items-center justify-center h-16 transition-all ${selectedMedal === medal ? 'border-yellow-500 shadow-lg' : 'border-white/5 hover:border-white/20'}`}
                onClick={() => setSelectedMedal(medal)}
              >
                 <img src={medal} className="w-full h-full object-contain pointer-events-none" />
                 <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                    <button onClick={(e) => { e.stopPropagation(); setSelectedMedal(medal); }} className="p-1 bg-yellow-500 text-black rounded-lg"><Send size={12}/></button>
                    <button onClick={(e) => { e.stopPropagation(); removeFromLibrary(medal); }} className="p-1 bg-red-600 text-white rounded-lg"><Trash2 size={12}/></button>
                 </div>
              </motion.div>
           ))}
        </div>
      </section>

      {/* باقي الواجهة كما هي... */}
      <AnimatePresence>
        {selectedMedal && (
          <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="bg-slate-950/60 rounded-[3rem] border border-yellow-500/30 p-8 shadow-2xl overflow-hidden relative">
            <div className="max-w-xl relative z-10">
              <h3 className="text-xl font-black text-white mb-6 flex items-center gap-3">
                 <Sparkles className="text-yellow-500" /> منح الوسام المختار لعضو
              </h3>
              
              <div className="flex flex-col gap-6">
                 <div className="flex items-center gap-4 bg-black/40 p-4 rounded-3xl border border-white/5 w-fit">
                    <div className="w-16 h-16"><img src={selectedMedal} className="w-full h-full object-contain" /></div>
                    <button onClick={() => setSelectedMedal(null)} className="text-red-500 p-1 hover:bg-red-500/10 rounded-lg"><X size={16}/></button>
                 </div>

                 <div className="space-y-3">
                    <label className="text-xs font-black text-slate-400 pr-2">ابحث عن العضو:</label>
                    <div className="relative group">
                      <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                      <input type="text" placeholder="ادخل ID المستخدم..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-slate-900/80 border border-white/10 rounded-2xl py-4 pr-14 text-white text-sm outline-none focus:border-yellow-500/50 shadow-xl" />
                    </div>

                    <AnimatePresence>
                      {filteredAwardUsers.length > 0 && (
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="mt-2 bg-slate-900 border border-white/10 rounded-2xl overflow-hidden shadow-2xl max-h-48 overflow-y-auto">
                          {filteredAwardUsers.map(u => (
                            <button key={u.id} onClick={() => { setSelectedUser(u); setSearchQuery(''); }} className="w-full p-4 flex items-center gap-4 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0">
                              <img src={u.avatar} className="w-10 h-10 rounded-xl object-cover border border-white/10" />
                              <div className="flex flex-col text-right">
                                <span className="font-bold text-white text-sm">{u.name}</span>
                                <span className="text-[10px] text-slate-500">ID: {u.customId || u.id}</span>
                              </div>
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                 </div>

                 {selectedUser && (
                    <div className="flex items-center gap-4 p-6 bg-emerald-500/10 rounded-[2rem] border border-emerald-500/20">
                       <div className="flex-1"><p className="text-white text-sm font-black">منح الوسام لـ <span className="text-emerald-400">{selectedUser.name}</span></p></div>
                       <button onClick={awardMedalToUser} disabled={isAwarding} className="px-8 py-3 bg-emerald-600 text-white rounded-2xl font-black text-xs shadow-xl active:scale-95 disabled:opacity-50">{isAwarding ? 'جاري المنح...' : 'تأكيد المنح'}</button>
                    </div>
                 )}
              </div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminBadges;
