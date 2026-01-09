import React, { useState, useEffect } from 'react';
import { StoreSettings } from '../types';
import { Save, Upload, Store, MapPin, Phone, Receipt, Percent, Info, AlertOctagon, Palette, Check, Rocket } from 'lucide-react';

interface SettingsViewProps {
  settings: StoreSettings;
  onSaveSettings: (settings: StoreSettings) => void;
}

const THEMES = [
  { id: 'indigo', name: 'Clásico', color: '#6366f1' },
  { id: 'blue', name: 'Azul Pro', color: '#3b82f6' },
  { id: 'emerald', name: 'Esmeralda', color: '#10b981' },
  { id: 'amber', name: 'Ámbar', color: '#f59e0b' },
  { id: 'rose', name: 'Rosa', color: '#f43f5e' },
  { id: 'slate', name: 'Minimal', color: '#64748b' },
];

export const SettingsView: React.FC<SettingsViewProps> = ({ settings, onSaveSettings }) => {
  const [formData, setFormData] = useState<StoreSettings>(settings);
  const [logoPreview, setLogoPreview] = useState<string | undefined>(settings.logo);
  const [currentTheme, setCurrentTheme] = useState('indigo');

  useEffect(() => {
    setCurrentTheme(localStorage.getItem('kioscopro_theme') || 'indigo');
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setLogoPreview(base64);
        setFormData(prev => ({ ...prev, logo: base64 }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    onSaveSettings({
        ...formData,
        taxRate: Number(formData.taxRate) // Ensure it's a number
    });
    alert('Configuración guardada correctamente.');
  };

  const handleThemeChange = (themeId: string) => {
      localStorage.setItem('kioscopro_theme', themeId);
      setCurrentTheme(themeId);
      if(confirm('Para aplicar el nuevo color, es necesario recargar la página. ¿Recargar ahora?')) {
          window.location.reload();
      }
  };

  return (
    <div className="h-full flex flex-col p-8 bg-[#f8fafc] overflow-y-auto animate-fade-in">
        <div className="mb-8">
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Configuración</h2>
          <p className="text-slate-500 font-medium">Personaliza la información de tu negocio</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Form */}
            <div className="lg:col-span-2 space-y-6">
                
                {/* Store Info */}
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                    <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600"><Store className="w-5 h-5"/></div>
                        Datos del Negocio
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Nombre de la Tienda</label>
                            <input name="storeName" value={formData.storeName} onChange={handleChange} className="w-full p-4 bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl outline-none font-bold text-slate-700 transition-all"/>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold uppercase text-slate-400 mb-1 flex items-center gap-1"><Receipt className="w-3 h-3"/> RUC / ID Fiscal</label>
                                <input name="ruc" value={formData.ruc} onChange={handleChange} className="w-full p-4 bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl outline-none font-mono font-bold text-slate-700 transition-all"/>
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase text-slate-400 mb-1 flex items-center gap-1"><Phone className="w-3 h-3"/> Teléfono</label>
                                <input name="phone" value={formData.phone} onChange={handleChange} className="w-full p-4 bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl outline-none font-bold text-slate-700 transition-all"/>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase text-slate-400 mb-1 flex items-center gap-1"><MapPin className="w-3 h-3"/> Dirección</label>
                            <input name="address" value={formData.address} onChange={handleChange} className="w-full p-4 bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl outline-none font-bold text-slate-700 transition-all"/>
                        </div>
                    </div>
                </div>

                {/* Theme Selector */}
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                     <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600"><Palette className="w-5 h-5"/></div>
                        Personalización de Colores
                    </h3>
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                        {THEMES.map(theme => (
                            <button 
                                key={theme.id}
                                onClick={() => handleThemeChange(theme.id)}
                                className={`group relative p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${currentTheme === theme.id ? 'border-slate-800 bg-slate-50' : 'border-slate-100 hover:border-slate-300'}`}
                            >
                                <div className="w-10 h-10 rounded-full shadow-md flex items-center justify-center transition-transform group-hover:scale-110" style={{ backgroundColor: theme.color }}>
                                    {currentTheme === theme.id && <Check className="w-5 h-5 text-white stroke-[3]"/>}
                                </div>
                                <span className={`text-xs font-bold ${currentTheme === theme.id ? 'text-slate-800' : 'text-slate-500'}`}>{theme.name}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Tax & Currency */}
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                    <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600"><Percent className="w-5 h-5"/></div>
                        Impuestos y Moneda
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Símbolo de Moneda</label>
                            <input name="currency" value={formData.currency} onChange={handleChange} className="w-full p-4 bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl outline-none font-bold text-slate-700 transition-all text-center text-lg"/>
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Tasa de Impuesto (Decimal)</label>
                            <input name="taxRate" type="number" step="0.01" value={formData.taxRate} onChange={handleChange} className="w-full p-4 bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl outline-none font-bold text-slate-700 transition-all text-center text-lg"/>
                            <p className="text-[10px] text-slate-400 mt-1 ml-2">Ejemplo: 0.18 para 18%</p>
                        </div>
                    </div>
                    <div className="mt-6 flex items-center p-4 bg-slate-50 rounded-2xl border border-slate-100 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => setFormData(p => ({...p, pricesIncludeTax: !p.pricesIncludeTax}))}>
                        <input type="checkbox" name="pricesIncludeTax" checked={formData.pricesIncludeTax} onChange={handleChange} className="w-6 h-6 text-indigo-600 rounded-lg border-slate-300 focus:ring-indigo-500"/>
                        <div className="ml-4">
                            <span className="block text-sm font-bold text-slate-800">Los precios ya incluyen impuestos</span>
                            <span className="block text-xs text-slate-500">Si está desactivado, el impuesto se sumará al final de la venta.</span>
                        </div>
                    </div>
                </div>

                <button onClick={handleSave} className="w-full py-5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-2xl font-bold text-lg shadow-xl shadow-indigo-200 hover:shadow-2xl hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2">
                    <Save className="w-6 h-6"/> Guardar Cambios
                </button>

            </div>

            {/* Sidebar / Logo */}
            <div className="space-y-6">
                 <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center text-center">
                    <h3 className="text-lg font-bold text-slate-800 mb-4">Logo del Ticket</h3>
                    <div className="w-48 h-48 bg-slate-50 rounded-full border-4 border-dashed border-slate-200 flex items-center justify-center mb-6 relative overflow-hidden group">
                        {logoPreview ? (
                            <img src={logoPreview} alt="Logo Preview" className="w-full h-full object-contain p-4 group-hover:opacity-50 transition-opacity" />
                        ) : (
                            <Rocket className="w-16 h-16 text-slate-300" />
                        )}
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Upload className="w-10 h-10 text-slate-500"/>
                        </div>
                        <input type="file" accept="image/*" onChange={handleLogoUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                    </div>
                    <p className="text-xs text-slate-400">Click en la imagen para cambiar.<br/>Recomendado: PNG fondo transparente.</p>
                 </div>

                 <div className="bg-indigo-50 p-6 rounded-3xl border border-indigo-100 text-indigo-800">
                    <div className="flex items-start gap-3">
                        <Info className="w-6 h-6 shrink-0"/>
                        <div className="text-sm">
                            <p className="font-bold mb-1">Acerca de PosGo!</p>
                            <p className="opacity-80">Versión 2.2.0 (Color Update)</p>
                            <p className="opacity-80 mt-2">Sistema optimizado para gestión offline y análisis inteligente con Google Gemini.</p>
                        </div>
                    </div>
                 </div>
            </div>
        </div>
    </div>
  );
};