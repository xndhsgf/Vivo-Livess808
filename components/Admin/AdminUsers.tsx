
import React, { useState } from 'react';
import { Search, Settings2, X, Save, ShieldAlert, Upload, Trash2, ImageIcon, Award, Sparkles, UserMinus, Medal, Lock, Unlock, Clock, Ban, Eraser } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, VIPPackage } from '../../types';
import { db } from '../../services/firebase';
import { doc, updateDoc, getDoc, setDoc } from 'firebase/firestore';

interface AdminUsersProps {
  users: User[];
  vipLevels: VIPPackage[];
  onUpdateUser: (userId: string, data: Partial<User>) => Promise<void>;
}

const compressImage = (base64: string, maxWidth: number, maxHeight: number, quality: number = 0.15): Promise<string> => {
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
      // تحويل إلى webp بجودة منخفضة جداً لتقليل الحجم النصي
      resolve(canvas.toDataURL('image/webp', quality));
    };
  });
};

const AdminUsers: React.FC<AdminUsersProps> = ({ users, vipLevels, onUpdateUser }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editingFields, setEditingFields] = useState({ 
    coins: 0, 
    customId: '', 
    vipLevel: 0, 
    idColor: '#fbbf24', 
    isBanned: false, 
    banUntil: '',
    badge: '',
    cover: '',
    achievements: [] as string[]
  });

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.customId?.toString().includes(searchQuery) ||
    u.id.includes(searchQuery)
  );

  const handleBan = (durationDays: number | 'permanent') => {
    if (durationDays === 'permanent') {
      setEditingFields({ ...editingFields, isBanned: true, banUntil: 'permanent' });
    } else {
      const date = new Date();
      date.setDate(date.getDate() + durationDays);
      setEditingFields({ ...editingFields, isBanned: true, banUntil: date.toISOString() });
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'badge' | 'cover') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const result = ev.target?.result as string;
        // أبعاد أصغر بكثير (الغلاف 300x120 والوسام 120x40)
        const dimensions = field === 'badge' ? { w: 120, h: 40 } : { w: 300, h: 120 };
        const compressed = await compressImage(result, dimensions.w, dimensions.h, 0.1);
        setEditingFields({ ...editingFields, [field]: compressed });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleWipeMedia = async () => {
     if (!selectedUser) return;
     if (!confirm('سيتم حذف الغلاف والأوسمة وإطار الـ ID لهذا المستخدم لتقليل حجم البيانات وإصلاح الحساب. استمرار؟')) return;
     
     try {
        // استخدام updateDoc لتصفير الحقول المسببة للثقل
        await updateDoc(doc(db, 'users', selectedUser.id), {
           cover: null,
           achievements: [],
           badge: null
        });
        alert('تم تطهير بيانات الوسائط بنجاح ✅');
        setSelectedUser(null);
     } catch (e) {
        alert('حدث خطأ أثناء التطهير');
     }
  };

  const handleSave = async () => {
    if (!selectedUser) return;
    try { 
      const updates: any = { 
        coins: Number(editingFields.coins), 
        customId: editingFields.customId,
        isBanned: editingFields.isBanned, 
        banUntil: editingFields.banUntil,
        badge: editingFields.badge || null,
        cover: editingFields.cover || null,
        vipLevel: editingFields.vipLevel,
        isVip: editingFields.vipLevel > 0,
        achievements: editingFields.achievements.slice(0, 30) // تحديد الحد الأقصى للأوسمة
      }; 

      await onUpdateUser(selectedUser.id, updates); 

      const roomRef = doc(db, 'rooms', selectedUser.id);
      const roomSnap = await getDoc(roomRef);
      if (roomSnap.exists()) {
        await updateDoc(roomRef, { hostCustomId: editingFields.customId });
      }

      alert('تم الحفظ ومزامنة ID الغرفة بنجاح ✅'); 
      setSelectedUser(null); 
    } catch (e) { 
      console.error(e);
      alert('فشل الحفظ: حجم المستند كبير جداً. يرجى استخدام زر "تطهير الوسائط" أولاً.'); 
    }
  };

  return (
    <div className="space-y-6 text-right" dir="rtl">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 w-full max-w-md">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input 
            type="text" 
            placeholder="بحث بالاسم أو الـ ID..." 
            value={searchQuery} 
            onChange={(e) => setSearchQuery(e.target.value)} 
            className="w-full bg-slate-950/50 border border-white/10 rounded-2xl py-4 pr-12 text-white text-sm outline-none shadow-lg focus:border-blue-500/50 transition-all" 
          />
        </div>
      </div>

      <div className="bg-slate-950/40 rounded-[2rem] border border-white/5 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-black/40 text-slate-500 font-black uppercase tracking-widest border-b border-white/5">
              <tr>
                <th className="p-5">المستخدم</th>
                <th className="p-5 text-center">الحالة</th>
                <th className="p-5 text-center">الرصيد</th>
                <th className="p-5 text-center">الإجراء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredUsers.map(u => (
                <tr key={u.id} className={`${u.isBanned ? 'bg-red-950/20' : 'hover:bg-white/5'} transition-colors`}>
                  <td className="p-5 flex items-center gap-3">
                    <img src={u.avatar} className="w-10 h-10 rounded-xl border border-white/10 object-cover" />
                    <div className="flex flex-col">
                      <span className="font-bold text-white">{u.name}</span>
                      <span className="text-[9px] text-slate-500">ID: {u.customId || u.id}</span>
                    </div>
                  </td>
                  <td className="p-5 text-center">
                    {u.isBanned ? (
                       <span className="px-3 py-1 bg-red-600/20 text-red-500 rounded-lg font-black text-[9px] flex items-center justify-center gap-1 mx-auto w-fit">
                         <Lock size={10} /> محظور
                       </span>
                    ) : (
                       <span className="px-3 py-1 bg-emerald-600/20 text-emerald-500 rounded-lg font-black text-[9px] flex items-center justify-center gap-1 mx-auto w-fit">
                         <Unlock size={10} /> نشط
                       </span>
                    )}
                  </td>
                  <td className="p-5 text-center">
                    <span className="text-yellow-500 font-black">🪙 {u.coins?.toLocaleString()}</span>
                  </td>
                  <td className="p-5 text-center">
                    <button 
                      onClick={() => { 
                        setSelectedUser(u); 
                        setEditingFields({ 
                          coins: u.coins || 0, 
                          customId: u.customId?.toString() || '', 
                          vipLevel: u.vipLevel || 0, 
                          idColor: u.idColor || '#fbbf24', 
                          isBanned: u.isBanned || false,
                          banUntil: u.banUntil || '',
                          badge: u.badge || '',
                          cover: u.cover || '',
                          achievements: u.achievements || []
                        }); 
                      }} 
                      className="p-2.5 bg-blue-600/10 text-blue-400 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-md"
                    >
                      <Settings2 size={18}/>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {selectedUser && (
          <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-lg">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-slate-900 border border-white/10 rounded-[2.5rem] w-full max-w-lg p-0 shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
               <div className="relative h-32 w-full bg-slate-800">
                  {editingFields.cover && <img src={editingFields.cover} className="w-full h-full object-cover" />}
                  <button onClick={() => setSelectedUser(null)} className="absolute top-4 right-4 p-2 bg-black/40 text-white rounded-full"><X size={20}/></button>
                  <div className="absolute -bottom-10 right-6 flex items-end gap-4">
                     <img src={selectedUser.avatar} className="w-20 h-20 rounded-3xl border-4 border-slate-900 shadow-2xl object-cover" />
                     <div className="pb-2 text-right"><h3 className="font-black text-xl text-white">{selectedUser.name}</h3></div>
                  </div>
               </div>

               <div className="flex-1 overflow-y-auto p-8 pt-14 space-y-8 text-right">
                  {/* زر التطهير السريع لإصلاح الحجم */}
                  <button onClick={handleWipeMedia} className="w-full py-3 bg-red-600/20 text-red-500 border border-red-500/30 rounded-2xl text-[10px] font-black flex items-center justify-center gap-2 hover:bg-red-600 hover:text-white transition-all">
                     <Eraser size={14} /> تطهير وسائط الحساب (لحل مشكلة 1MB)
                  </button>

                  <div className="p-6 bg-red-600/5 rounded-3xl border border-red-600/20 space-y-4">
                    <h4 className="text-sm font-black text-red-500 flex items-center gap-2">
                       <ShieldAlert size={18} /> إدارة حظر الحساب
                    </h4>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                       <button onClick={() => setEditingFields({...editingFields, isBanned: false, banUntil: ''})} className={`py-3 rounded-xl text-[10px] font-black border transition-all ${!editingFields.isBanned ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-black/20 text-slate-500 border-white/5'}`}>إلغاء الحظر</button>
                       <button onClick={() => handleBan(7)} className={`py-3 rounded-xl text-[10px] font-black border transition-all ${editingFields.isBanned && editingFields.banUntil !== 'permanent' ? 'bg-red-600 text-white border-red-500' : 'bg-black/20 text-slate-500 border-white/5'}`}>حظر أسبوع</button>
                       <button onClick={() => handleBan(30)} className={`py-3 rounded-xl text-[10px] font-black border transition-all bg-black/20 text-slate-500 border-white/5 hover:border-red-500/50`}>حظر شهر</button>
                       <button onClick={() => handleBan('permanent')} className={`py-3 rounded-xl text-[10px] font-black border transition-all ${editingFields.banUntil === 'permanent' ? 'bg-red-900 text-white border-red-700' : 'bg-black/20 text-slate-500 border-white/5'}`}>حظر نهائي</button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-black/30 rounded-3xl border border-white/5 space-y-3">
                       <label className="text-[10px] font-black text-slate-500 flex items-center gap-2"><Award size={14} className="text-amber-500" /> وسام الـ ID</label>
                       <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-slate-800 rounded-xl border border-white/10 flex items-center justify-center overflow-hidden">{editingFields.badge ? <img src={editingFields.badge} className="w-full h-full object-contain" /> : <Ban size={16} className="text-slate-700" />}</div>
                          <label className="flex-1 flex items-center justify-center gap-2 py-2 bg-blue-600/10 text-blue-400 rounded-xl text-[9px] font-black cursor-pointer hover:bg-blue-600 hover:text-white transition-all"><Upload size={12} /> رفع<input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'badge')} /></label>
                       </div>
                    </div>
                    <div className="p-4 bg-black/30 rounded-3xl border border-white/5 space-y-3">
                       <label className="text-[10px] font-black text-slate-500 flex items-center gap-2"><ImageIcon size={14} className="text-indigo-400" /> الغلاف</label>
                       <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-slate-800 rounded-xl border border-white/10 flex items-center justify-center overflow-hidden">{editingFields.cover ? <img src={editingFields.cover} className="w-full h-full object-cover" /> : <Ban size={16} className="text-slate-700" />}</div>
                          <label className="flex-1 flex items-center justify-center gap-2 py-2 bg-indigo-600/10 text-indigo-400 rounded-xl text-[9px] font-black cursor-pointer hover:bg-indigo-600 hover:text-white transition-all"><Upload size={12} /> رفع<input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'cover')} /></label>
                       </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                     <div className="space-y-1"><label className="text-[10px] font-black text-slate-500">الـ ID المخصص (Account ID)</label><input type="text" value={editingFields.customId} onChange={e => setEditingFields({...editingFields, customId: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-emerald-400 font-black text-sm outline-none text-center" /></div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-1"><label className="text-[10px] font-black text-slate-500">رصيد الكوينز 🪙</label><input type="number" value={editingFields.coins} onChange={e => setEditingFields({...editingFields, coins: parseInt(e.target.value) || 0})} className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-yellow-400 font-black text-sm outline-none text-center" /></div>
                     <div className="space-y-1"><label className="text-[10px] font-black text-slate-500">الـ VIP 👑</label><select value={editingFields.vipLevel} onChange={e => setEditingFields({...editingFields, vipLevel: parseInt(e.target.value)})} className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white text-xs font-black outline-none text-center appearance-none"><option value={0}>بدون</option>{vipLevels.map(v => <option key={v.level} value={v.level}>{v.name}</option>)}</select></div>
                  </div>

                  <button onClick={handleSave} className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-black rounded-2xl shadow-xl active:scale-95 transition-all">تأكيد وحفظ التغييرات</button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminUsers;
