
import React, { useState, useEffect } from 'react';
import { Search, Image as ImageIcon, Upload, Trash2, Plus, Sparkles, X, Send, CheckCircle2, Award } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { User } from '../../types';
import { db } from '../../services/firebase';
import { doc, getDoc, setDoc, arrayUnion, arrayRemove, updateDoc } from 'firebase/firestore';

interface AdminIdBadgesProps {
  users: User[];
  onUpdateUser: (userId: string, data: Partial<User>) => Promise<void>;
}

const compressImage = (base64: string, maxWidth: number, maxHeight: number, quality: number = 0.4): Promise<string> => {
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
      ctx?.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/webp', quality));
    };
  });
};

const AdminIdBadges: React.FC<AdminIdBadgesProps> = ({ users, onUpdateUser }) => {
  const [libraryBadges, setLibraryBadges] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedBadge, setSelectedBadge] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isApplying, setIsApplying] = useState(false);

  useEffect(() => {
    const fetchLibrary = async () => {
      const docRef = doc(db, 'appSettings', 'id_badges_library');
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        setLibraryBadges(snap.data().badges || []);
      }
    };
    fetchLibrary();
  }, []);

  const filteredUsers = searchQuery.trim() === '' ? [] : users.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.customId?.toString() === searchQuery ||
    u.id === searchQuery
  ).slice(0, 5);

  const handleUploadToLibrary = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const result = ev.target?.result as string;
        // قوالب الـ ID صغيرة جداً (180x60 بكسل كافية)
        const compressed = await compressImage(result, 180, 60, 0.4);
        try {
          const docRef = doc(db, 'appSettings', 'id_badges_library');
          await setDoc(docRef, { badges: arrayUnion(compressed) }, { merge: true });
          setLibraryBadges(prev => [...prev, compressed]);
        } catch (err) {
          alert('فشل الرفع للمكتبة');
        } finally {
          setIsUploading(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const removeFromLibrary = async (url: string) => {
    if (!confirm('سيتم حذف القالب من المكتبة فقط. استمرار؟')) return;
    try {
      const docRef = doc(db, 'appSettings', 'id_badges_library');
      await updateDoc(docRef, { badges: arrayRemove(url) });
      setLibraryBadges(prev => prev.filter(b => b !== url));
    } catch (err) { alert('فشل الحذف'); }
  };

  const applyBadgeToUser = async () => {
    if (!selectedUser || !selectedBadge) return;
    setIsApplying(true);
    try {
      await onUpdateUser(selectedUser.id, {
        badge: selectedBadge,
        isSpecialId: true
      });
      alert(`تم تركيب وسام الـ ID لـ ${selectedUser.name} بنجاح! ✨`);
      setSelectedUser(null);
      setSelectedBadge(null);
      setSearchQuery('');
    } catch (err) {
      alert('حدث خطأ أثناء التركيب: المستند كبير جداً');
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="space-y-10 text-right" dir="rtl">
      <section>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
           <div>
              <h3 className="text-2xl font-black text-white flex items-center gap-3">
                 <ImageIcon className="text-blue-500" /> مكتبة قوالب الـ ID
              </h3>
              <p className="text-slate-500 text-xs font-bold mt-1">ارفع خلفيات أرقام الـ ID المميزة (الحجم مضغوط).</p>
           </div>
           <label className={`flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl text-xs font-black cursor-pointer shadow-xl active:scale-95 transition-all ${isUploading ? 'opacity-50' : ''}`}>
              {isUploading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Plus size={18} />}
              إضافة قالب جديد
              <input type="file" accept="image/*" className="hidden" onChange={handleUploadToLibrary} />
           </label>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
           {libraryBadges.map((badge, idx) => (
              <motion.div 
                whileHover={{ scale: 1.02 }}
                key={idx} 
                className={`relative group bg-slate-950/40 border-2 rounded-2xl p-4 flex items-center justify-center h-20 transition-all cursor-pointer ${selectedBadge === badge ? 'border-blue-500 shadow-lg' : 'border-white/5 hover:border-white/20'}`}
                onClick={() => setSelectedBadge(badge)}
              >
                 <img src={badge} className="w-full h-full object-contain opacity-80" />
                 <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <button onClick={(e) => { e.stopPropagation(); setSelectedBadge(badge); }} className="p-2 bg-blue-500 text-white rounded-xl shadow-lg"><Send size={14}/></button>
                    <button onClick={(e) => { e.stopPropagation(); removeFromLibrary(badge); }} className="p-2 bg-red-600 text-white rounded-xl shadow-lg"><Trash2 size={14}/></button>
                 </div>
              </motion.div>
           ))}
        </div>
      </section>

      <AnimatePresence>
        {selectedBadge && (
          <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="bg-slate-900 border border-blue-500/30 p-8 rounded-[3rem] shadow-2xl relative overflow-hidden">
             <div className="max-w-xl relative z-10">
                <h3 className="text-xl font-black text-white mb-6 flex items-center gap-3">
                   <Sparkles className="text-blue-400" /> تركيب الوسام المختار لعضو
                </h3>

                <div className="space-y-6">
                   <div className="space-y-3">
                      <label className="text-xs font-black text-slate-400 pr-2">ابحث عن العضو:</label>
                      <div className="relative group">
                        <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                        <input type="text" placeholder="ادخل ID المستخدم..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-slate-950 border border-white/10 rounded-2xl py-4 pr-14 text-white text-sm outline-none focus:border-blue-500/50 shadow-xl" />
                      </div>
                   </div>

                   {selectedUser && (
                      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-4 p-6 bg-blue-600/10 rounded-[2rem] border border-blue-500/20">
                         <div className="flex-1 text-sm font-black text-white">تثبيت الوسام على حساب <span className="text-blue-400">{selectedUser.name}</span></div>
                         <button onClick={applyBadgeToUser} disabled={isApplying} className="px-8 py-3 bg-blue-600 text-white rounded-2xl font-black text-xs shadow-xl active:scale-95 transition-all disabled:opacity-50">
                            {isApplying ? 'جاري التثبيت...' : 'تأكيد التثبيت'}
                         </button>
                      </motion.div>
                   )}
                </div>
             </div>
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminIdBadges;
