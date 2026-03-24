import { useState } from 'react';
import { motion } from 'framer-motion';

export default function RegistrationForm() {
  const [formData, setFormData] = useState({
    name: '',
    roll: '',
    phone: '',
    tShirtSize: 'M',
    departmentId: '',
    hallId: ''
  });
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Fallback regex assuming 6 digits starting with 52
  const rollRegex = /^52\d{4}$/; 

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!rollRegex.test(formData.roll)) {
      setError('Invalid 52nd Batch Roll Number. Must be 6 digits starting with 52 (e.g., 52XXXX).');
      return;
    }

    if (formData.phone.length < 11) {
      setError('Please provide a valid 11-digit phone number.');
      return;
    }

    // Mock API submission / Double registration check
    setTimeout(() => {
      setSuccess(true);
    }, 1000);
  };

  if (success) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }} 
          animate={{ scale: 1, opacity: 1 }} 
          className="bg-white p-10 rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] max-w-lg w-full text-center border border-gray-100"
        >
          <div className="w-24 h-24 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-iner border-4 border-green-100">
            <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-4 tracking-tight">Registration Saved!</h2>
          <p className="text-gray-500 mb-8 leading-relaxed font-medium">
            Your details have been registered into the system. Complete your payment to unlock your digital ID card and boost your department's leaderboard ranking.
          </p>
          <button 
            onClick={() => window.location.href = '/id-card'}
            className="w-full bg-primary hover:bg-[#600000] text-secondary font-bold py-4 rounded-xl shadow-lg shadow-primary/30 transition-all active:scale-95 text-lg"
          >
            Verify Payment & Get ID Card
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-16 px-4 bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <div className="max-w-2xl mx-auto bg-white/80 backdrop-blur-3xl p-8 md:p-12 rounded-[2.5rem] shadow-[0_20px_70px_-15px_rgba(128,0,0,0.08)] border border-white relative overflow-hidden">
        
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/10 rounded-full blur-2xl -mr-10 -mt-10" />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-primary/5 rounded-full blur-2xl -ml-10 -mb-10" />

        <div className="text-center mb-10 relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold text-primary mb-4 drop-shadow-sm font-sans tracking-tight">Register Now</h2>
          <p className="text-slate-500 font-medium">Represent your department and hall. Join the JU 52nd Batch Day event!</p>
        </div>

        {error && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-red-50 text-red-600 p-4 rounded-xl mb-8 border border-red-100 text-center font-semibold shadow-sm">
            {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1 uppercase tracking-wider">Full Name</label>
              <input required type="text" className="w-full bg-gray-50/50 border border-gray-200 focus:border-primary focus:ring-4 focus:ring-primary/10 rounded-xl px-5 py-3.5 outline-none transition-all font-medium text-gray-800 placeholder-gray-400" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Rafiqul Islam" />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1 uppercase tracking-wider">Class Roll (52xxxx)</label>
              <input required type="text" className="w-full bg-gray-50/50 border border-gray-200 focus:border-primary focus:ring-4 focus:ring-primary/10 rounded-xl px-5 py-3.5 outline-none transition-all font-medium text-gray-800 placeholder-gray-400" value={formData.roll} onChange={e => setFormData({...formData, roll: e.target.value})} placeholder="52xxxx" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1 uppercase tracking-wider">Phone Number</label>
              <input required type="tel" className="w-full bg-gray-50/50 border border-gray-200 focus:border-primary focus:ring-4 focus:ring-primary/10 rounded-xl px-5 py-3.5 outline-none transition-all font-medium text-gray-800 placeholder-gray-400" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="017XXXXXXXX" />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1 uppercase tracking-wider">T-Shirt Size</label>
              <select className="w-full bg-gray-50/50 border border-gray-200 focus:border-primary focus:ring-4 focus:ring-primary/10 rounded-xl px-5 py-3.5 outline-none transition-all font-medium text-gray-800 cursor-pointer" value={formData.tShirtSize} onChange={e => setFormData({...formData, tShirtSize: e.target.value})}>
                <option value="S">Small (S)</option>
                <option value="M">Medium (M)</option>
                <option value="L">Large (L)</option>
                <option value="XL">Extra Large (XL)</option>
                <option value="XXL">XXL</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1 uppercase tracking-wider">Department</label>
              <select required className="w-full bg-gray-50/50 border border-gray-200 focus:border-primary focus:ring-4 focus:ring-primary/10 rounded-xl px-5 py-3.5 outline-none transition-all font-medium text-gray-800 cursor-pointer" value={formData.departmentId} onChange={e => setFormData({...formData, departmentId: e.target.value})}>
                <option value="" disabled>Select Department</option>
                <option value="d1">Computer Science</option>
                <option value="d2">Economics</option>
                <option value="d3">Physics</option>
                <option value="d4">Pharmacy</option>
                <option value="d5">English</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1 uppercase tracking-wider">Hall</label>
              <select required className="w-full bg-gray-50/50 border border-gray-200 focus:border-primary focus:ring-4 focus:ring-primary/10 rounded-xl px-5 py-3.5 outline-none transition-all font-medium text-gray-800 cursor-pointer" value={formData.hallId} onChange={e => setFormData({...formData, hallId: e.target.value})}>
                 <option value="" disabled>Select Hall</option>
                 <option value="h1">Mir Mosharraf Hossain Hall</option>
                 <option value="h2">Al-Beruni Hall</option>
                 <option value="h3">Bangabandhu Hall</option>
                 <option value="h4">Fazilatunnesa Hall</option>
              </select>
            </div>
          </div>

          <div className="pt-8 relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary to-secondary rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200" />
            <button type="submit" className="relative w-full bg-primary hover:bg-[#600000] text-secondary font-bold text-lg py-4 rounded-xl transition-all active:scale-95 shadow-md">
              Complete Registration
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
