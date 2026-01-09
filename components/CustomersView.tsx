import React, { useState } from 'react';
import { Customer, StoreSettings } from '../types';
import { Search, Plus, Edit, Trash2, User, Phone, Mail, CreditCard, X, Save, UserPlus } from 'lucide-react';

interface CustomersViewProps {
  customers: Customer[];
  setCustomers: (customers: Customer[]) => void;
  settings: StoreSettings;
}

export const CustomersView: React.FC<CustomersViewProps> = ({ customers, setCustomers, settings }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const newCustomer: Customer = {
      id: editingCustomer ? editingCustomer.id : Date.now().toString(),
      name: formData.get('name') as string,
      dni: formData.get('dni') as string,
      email: formData.get('email') as string,
      phone: formData.get('phone') as string,
      totalPurchases: editingCustomer ? editingCustomer.totalPurchases : 0,
      lastPurchaseDate: editingCustomer ? editingCustomer.lastPurchaseDate : undefined,
    };

    if (editingCustomer) {
      setCustomers(customers.map(c => c.id === newCustomer.id ? newCustomer : c));
    } else {
      setCustomers([...customers, newCustomer]);
    }
    
    setIsModalOpen(false);
    setEditingCustomer(null);
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Estás seguro de eliminar este cliente?')) {
      setCustomers(customers.filter(c => c.id !== id));
    }
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.dni?.includes(searchTerm)
  );

  return (
    <div className="h-full flex flex-col p-8 bg-[#f8fafc] overflow-y-auto animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Gestión de Clientes</h2>
          <p className="text-slate-500 font-medium">Administra tu base de datos de compradores</p>
        </div>
        <div className="flex gap-4 w-full md:w-auto">
            <div className="relative flex-1 md:w-80 group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-indigo-500 transition-colors" />
                <input 
                    type="text" 
                    placeholder="Buscar por nombre o DNI..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border-none bg-white rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium transition-all" 
                />
            </div>
            <button 
                onClick={() => { setEditingCustomer(null); setIsModalOpen(true); }}
                className="flex items-center gap-2 px-6 py-3 bg-slate-800 text-white rounded-2xl text-sm font-bold hover:bg-slate-900 shadow-lg transform hover:-translate-y-1 transition-all whitespace-nowrap"
            >
                <UserPlus className="w-4 h-4" /> Nuevo Cliente
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-fade-in-up">
        {filteredCustomers.map((customer) => (
            <div key={customer.id} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-all group relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                    <button onClick={() => { setEditingCustomer(customer); setIsModalOpen(true); }} className="p-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100"><Edit className="w-4 h-4"/></button>
                    <button onClick={() => handleDelete(customer.id)} className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100"><Trash2 className="w-4 h-4"/></button>
                </div>
                
                <div className="flex items-start gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-violet-100 rounded-2xl flex items-center justify-center text-indigo-600 font-bold text-2xl shadow-inner">
                        {customer.name.charAt(0)}
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-800 text-lg leading-tight mb-1">{customer.name}</h3>
                        {customer.dni && <span className="inline-flex items-center gap-1 text-xs font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-500"><CreditCard className="w-3 h-3"/> {customer.dni}</span>}
                    </div>
                </div>

                <div className="mt-6 space-y-2 text-sm text-slate-500">
                    {customer.email && <div className="flex items-center gap-3"><Mail className="w-4 h-4 text-indigo-300"/> {customer.email}</div>}
                    {customer.phone && <div className="flex items-center gap-3"><Phone className="w-4 h-4 text-indigo-300"/> {customer.phone}</div>}
                </div>

                <div className="mt-6 pt-4 border-t border-slate-50 flex justify-between items-center">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wide">Total Compras</div>
                    <div className="text-lg font-black text-slate-800">{settings.currency}{customer.totalPurchases.toFixed(2)}</div>
                </div>
            </div>
        ))}
        {filteredCustomers.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-20 text-slate-400">
                <User className="w-16 h-16 mb-4 opacity-20"/>
                <p className="font-medium">No se encontraron clientes</p>
            </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg animate-bounce-slight">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="text-xl font-black text-slate-800">{editingCustomer ? 'Editar Cliente' : 'Nuevo Cliente'}</h3>
                    <button onClick={() => setIsModalOpen(false)}><X className="w-6 h-6 text-slate-400 hover:text-slate-600"/></button>
                </div>
                <form onSubmit={handleSave} className="p-6 space-y-4">
                    <div>
                        <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Nombre Completo</label>
                        <input name="name" defaultValue={editingCustomer?.name} required className="w-full p-3 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Ej. Juan Pérez" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold uppercase text-slate-400 mb-1">DNI / RUC</label>
                            <input name="dni" defaultValue={editingCustomer?.dni} className="w-full p-3 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" placeholder="8 dígitos" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Teléfono</label>
                            <input name="phone" defaultValue={editingCustomer?.phone} className="w-full p-3 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" placeholder="999 999 999" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Email</label>
                        <input name="email" type="email" defaultValue={editingCustomer?.email} className="w-full p-3 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" placeholder="cliente@email.com" />
                    </div>
                    <button type="submit" className="w-full py-4 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-900 shadow-xl mt-4 flex justify-center gap-2 items-center">
                        <Save className="w-5 h-5"/> Guardar Cliente
                    </button>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};