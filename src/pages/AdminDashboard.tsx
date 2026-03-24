import { useState } from 'react';

const mockUsers = [
  { id: '1', name: 'Rafiqul Islam', roll: '520145', department: 'Computer Science', hall: 'Mir Mosharraf Hossain Hall', tShirt: 'M', phone: '01711111111', paymentStatus: 'pending', date: '2026-03-23' },
  { id: '2', name: 'Sara Rahman', roll: '520288', department: 'Economics', hall: 'Fazilatunnesa Hall', tShirt: 'S', phone: '01822222222', paymentStatus: 'verified', date: '2026-03-22' },
  { id: '3', name: 'Karimul Hasan', roll: '520311', department: 'Physics', hall: 'Bangabandhu Hall', tShirt: 'L', phone: '01933333333', paymentStatus: 'pending', date: '2026-03-23' },
];

export default function AdminDashboard() {
  const [users, setUsers] = useState(mockUsers);
  const [toastMessage, setToastMessage] = useState('');

  const handleVerify = (id: string) => {
    setUsers(users.map(u => u.id === id ? { ...u, paymentStatus: 'verified' } : u));
    
    // Show toast for 3 seconds
    setToastMessage('Payment successfully verified!');
    setTimeout(() => setToastMessage(''), 3000);
  };

  const handleExportCSV = () => {
    // 1. Define Headers
    const headers = ['Name', 'Roll Number', 'Department', 'Hall', 'T-Shirt', 'Phone', 'Payment Status', 'Registration Date'];
    
    // 2. Map Rows
    const rows = users.map(u => [
      u.name,
      u.roll,
      u.department,
      u.hall,
      u.tShirt,
      u.phone,
      u.paymentStatus,
      u.date
    ]);

    // 3. Convert to CSV string
    const csvContent = [
      headers.join(','),
      ...rows.map(e => e.map(field => `"${field}"`).join(','))
    ].join('\n');

    // 4. Trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `JU_52nd_Batch_Registrations_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen py-16 px-4 bg-gradient-to-br from-gray-50 to-gray-200">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-24 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-6 py-3 rounded-full font-bold shadow-[0_10px_30px_rgba(22,165,74,0.3)] z-50 animate-bounce">
          {toastMessage}
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
          <div>
            <h2 className="text-4xl font-bold text-gray-800 tracking-tight">Admin Control Panel</h2>
            <p className="text-gray-500 font-medium">Manage registrations and payment verifications.</p>
          </div>
          
          <button 
            onClick={handleExportCSV}
            className="bg-[#10B981] hover:bg-[#059669] text-white font-bold py-3 px-8 rounded-xl shadow-[0_15px_30px_-10px_rgba(16,185,129,0.5)] transition-all active:scale-95 flex items-center"
          >
            <svg className="w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export All to CSV
          </button>
        </div>

        <div className="bg-white rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-sm uppercase tracking-wider text-gray-400">
                  <th className="p-6 font-bold">Participant Details</th>
                  <th className="p-6 font-bold">Department & Hall</th>
                  <th className="p-6 font-bold text-center">T-Shirt</th>
                  <th className="p-6 font-bold text-center">Status</th>
                  <th className="p-6 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="p-6">
                      <div className="font-bold text-gray-800 text-lg group-hover:text-primary transition-colors">{user.name}</div>
                      <div className="text-sm text-gray-500 font-medium">Roll: {user.roll} • {user.phone}</div>
                    </td>
                    <td className="p-6">
                      <div className="text-gray-800 font-semibold">{user.department}</div>
                      <div className="text-sm text-gray-500">{user.hall}</div>
                    </td>
                    <td className="p-6 text-center font-black text-gray-500 text-lg">
                      {user.tShirt}
                    </td>
                    <td className="p-6 text-center">
                      <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest
                        ${user.paymentStatus === 'verified' 
                          ? 'bg-green-100 text-green-700 shadow-sm border border-green-200' 
                          : 'bg-yellow-100 text-yellow-700 shadow-sm border border-yellow-200'}`}
                      >
                        {user.paymentStatus}
                      </span>
                    </td>
                    <td className="p-6 text-right">
                      {user.paymentStatus === 'pending' ? (
                         <button 
                           onClick={() => handleVerify(user.id)}
                           className="text-sm bg-primary/10 text-primary hover:bg-primary hover:text-white font-bold py-2.5 px-6 rounded-xl transition-all active:scale-95 shadow-sm"
                         >
                           Verify Payment
                         </button>
                      ) : (
                         <span className="text-sm text-green-600 font-bold bg-green-50 px-4 py-2 rounded-lg italic inline-flex items-center">
                           <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                           </svg>
                           Cleared
                         </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
