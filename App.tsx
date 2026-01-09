import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Layout } from './components/Layout';
import { Cart } from './components/Cart';
import { Ticket } from './components/Ticket';
import { StorageService } from './services/storageService';
import { analyzeSalesWithGemini } from './services/geminiService';
import { CustomersView } from './components/CustomersView';
import { SettingsView } from './components/SettingsView';
import { ReportsView } from './components/ReportsView';
import * as XLSX from 'xlsx';
import { 
  Product, 
  CartItem, 
  Transaction, 
  ViewState, 
  StoreSettings, 
  Customer, 
  CashShift, 
  PaymentMethod, 
  PaymentDetail,
  Purchase,
  PurchaseItem,
  Supplier,
  CashMovement
} from './types';
import { 
  Lock, 
  Unlock, 
  LayoutGrid, 
  List, 
  ScanBarcode, 
  Search, 
  Plus, 
  ShoppingBag, 
  ChevronLeft,
  TrendingUp,
  Truck,
  History,
  CheckCircle,
  Trash2,
  Mail,
  Phone,
  MapPin,
  Edit,
  X,
  UserPlus,
  Users,
  Download,
  Upload,
  Filter,
  AlertTriangle,
  Tags,
  FileSpreadsheet,
  Save,
  Loader2,
  ArrowDownRight,
  ArrowUpRight,
  Calendar
} from 'lucide-react';
import { DEFAULT_SETTINGS } from './constants';

// --- Modals & Helpers ---

const CategoryManagerModal = ({ isOpen, onClose, categories, onUpdate }: any) => {
    const [newCategory, setNewCategory] = useState('');

    const handleAdd = (e: React.FormEvent) => {
        e.preventDefault();
        if (newCategory.trim() && !categories.includes(newCategory.trim())) {
            onUpdate([...categories, newCategory.trim()]);
            setNewCategory('');
        }
    };

    const handleDelete = (cat: string) => {
        if (confirm(`¿Eliminar categoría "${cat}"?`)) {
            onUpdate(categories.filter((c: string) => c !== cat));
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[70] flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md animate-bounce-slight overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                        <Tags className="w-5 h-5 text-indigo-500"/> Categorías
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><X className="w-5 h-5 text-slate-500"/></button>
                </div>
                <div className="p-6 space-y-6">
                    <form onSubmit={handleAdd} className="flex gap-2">
                        <input 
                            value={newCategory} 
                            onChange={(e) => setNewCategory(e.target.value)}
                            placeholder="Nueva categoría..." 
                            className="flex-1 p-3 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all font-medium"
                            autoFocus
                        />
                        <button disabled={!newCategory.trim()} className="bg-indigo-600 text-white p-3 rounded-2xl hover:bg-indigo-700 shadow-lg disabled:opacity-50 disabled:shadow-none transition-all">
                            <Plus className="w-6 h-6"/>
                        </button>
                    </form>

                    <div className="max-h-60 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                        {categories.map((cat: string) => (
                            <div key={cat} className="flex justify-between items-center p-3 bg-white border border-slate-100 rounded-xl hover:shadow-md transition-all group">
                                <span className="font-bold text-slate-700">{cat}</span>
                                <button onClick={() => handleDelete(cat)} className="text-slate-300 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors">
                                    <Trash2 className="w-4 h-4"/>
                                </button>
                            </div>
                        ))}
                        {categories.length === 0 && (
                            <div className="text-center text-slate-400 py-4 font-medium italic">No hay categorías personalizadas</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const ProductHistoryModal = ({ product, transactions, purchases, onClose }: { product: Product, transactions: Transaction[], purchases: Purchase[], onClose: () => void }) => {
    
    const history = useMemo(() => {
        const movements: any[] = [];

        // 1. Process Sales (Out)
        transactions.forEach(t => {
            const item = t.items.find(i => i.id === product.id);
            if (item) {
                movements.push({
                    id: t.id,
                    date: t.date,
                    type: 'OUT', // Salida
                    quantity: item.quantity,
                    ref: `Venta #${t.id.slice(-6)}`,
                    detail: t.customerName || 'Cliente General'
                });
            }
        });

        // 2. Process Purchases (In)
        purchases.forEach(p => {
            const item = p.items.find(i => i.productId === product.id);
            if (item) {
                movements.push({
                    id: p.id,
                    date: p.date,
                    type: 'IN', // Ingreso
                    quantity: item.quantity,
                    ref: `Factura ${p.invoiceNumber}`,
                    detail: p.supplier
                });
            }
        });

        // Sort by date descending
        return movements.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [product, transactions, purchases]);

    return (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[70] flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl animate-bounce-slight overflow-hidden flex flex-col max-h-[85vh]">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <div>
                        <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                            <History className="w-5 h-5 text-indigo-500"/> Historial de Movimientos
                        </h3>
                        <p className="text-sm text-slate-500 font-medium mt-1">{product.name}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><X className="w-5 h-5 text-slate-500"/></button>
                </div>
                
                <div className="overflow-y-auto p-0 flex-1 custom-scrollbar">
                    {history.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                            <Calendar className="w-16 h-16 mb-4 opacity-20"/>
                            <p className="font-medium">No hay movimientos registrados</p>
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-50 text-xs font-bold uppercase text-slate-400 sticky top-0 shadow-sm z-10">
                                <tr>
                                    <th className="p-4 pl-6">Fecha</th>
                                    <th className="p-4">Tipo</th>
                                    <th className="p-4">Referencia</th>
                                    <th className="p-4 text-right pr-6">Cantidad</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {history.map((mov, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                        <td className="p-4 pl-6">
                                            <div className="font-bold text-slate-700">{new Date(mov.date).toLocaleDateString()}</div>
                                            <div className="text-xs text-slate-400">{new Date(mov.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                                        </td>
                                        <td className="p-4">
                                            {mov.type === 'IN' ? (
                                                <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full text-xs font-black">
                                                    <ArrowDownRight className="w-3 h-3"/> INGRESO
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full text-xs font-black">
                                                    <ArrowUpRight className="w-3 h-3"/> SALIDA
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            <div className="font-bold text-slate-700 text-sm">{mov.ref}</div>
                                            <div className="text-xs text-slate-500 truncate max-w-[200px]">{mov.detail}</div>
                                        </td>
                                        <td className={`p-4 pr-6 text-right font-black text-lg ${mov.type === 'IN' ? 'text-emerald-600' : 'text-amber-600'}`}>
                                            {mov.type === 'IN' ? '+' : '-'}{mov.quantity}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- Views ---

const InventoryView = ({ products, categories, setProducts, settings, transactions, purchases, onUpdateCategories }: any) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [historyProduct, setHistoryProduct] = useState<Product | null>(null); // State for history modal
  const [viewMode, setViewMode] = useState<'all' | 'restock'>('all');
  const [minStockThreshold, setMinStockThreshold] = useState(5);
  const [filterCategory, setFilterCategory] = useState('Todos');
  const [scanInput, setScanInput] = useState('');
  const scanRef = useRef<HTMLInputElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  // Combine static 'Todos' with dynamic categories for filter
  const filterCategories = ['Todos', ...categories];

  const productStats = useMemo(() => {
    const sales: Record<string, number> = {};
    transactions.forEach((t: Transaction) => {
      t.items.forEach(item => {
        sales[item.id] = (sales[item.id] || 0) + item.quantity;
      });
    });
    return sales;
  }, [transactions]);

  const handleDelete = (id: string) => {
    if (confirm("¿Estás seguro de eliminar este producto?")) {
      setProducts(products.filter((p: Product) => p.id !== id));
    }
  };

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newProduct: Product = {
      id: editingProduct ? editingProduct.id : Date.now().toString(),
      name: formData.get('name') as string,
      barcode: formData.get('barcode') as string,
      category: formData.get('category') as string,
      price: parseFloat(formData.get('price') as string),
      stock: parseInt(formData.get('stock') as string),
      description: formData.get('description') as string,
      cost: parseFloat(formData.get('cost') as string) || 0,
    };
    if (editingProduct) {
      setProducts(products.map((p: Product) => p.id === newProduct.id ? newProduct : p));
    } else {
      setProducts([newProduct, ...products]); // Prepend new product to start of list
    }
    
    // Clear filters and reset view to ensure the new product is visible
    setScanInput('');
    setFilterCategory('Todos');
    setViewMode('all');

    setIsModalOpen(false);
    setEditingProduct(null);
  };

  const handleInventoryBarcodeScan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scanInput) return;
    const found = products.find((p: Product) => p.barcode === scanInput);
    if (found) { 
        setEditingProduct(found); 
        setIsModalOpen(true);
        setScanInput(''); 
    } else { 
        if(confirm("Producto no encontrado. ¿Desea crearlo?")) {
            setEditingProduct(null);
            setIsModalOpen(true);
            // Pre-fill logic could go here but simple open is fine
        }
        setScanInput(''); 
    }
  };

  const handleExportInventory = () => {
    const data = products.map((p: Product) => ({
        ID: p.id,
        Nombre: p.name,
        Codigo: p.barcode || '',
        Categoria: p.category,
        Precio: p.price,
        Costo: p.cost || 0,
        Stock: p.stock,
        Descripcion: p.description || ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Inventario");
    XLSX.writeFile(workbook, "Inventario_PosGo.xlsx");
  };

  const handleImportClick = () => {
    importInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data);
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        const newProducts: Product[] = jsonData.map((row: any) => ({
            id: row.ID ? String(row.ID) : Date.now().toString() + Math.random().toString().slice(2, 5),
            name: row.Nombre || 'Sin Nombre',
            barcode: row.Codigo ? String(row.Codigo) : undefined,
            category: row.Categoria || 'Otros',
            price: Number(row.Precio) || 0,
            stock: Number(row.Stock) || 0,
            description: row.Descripcion || '',
            cost: Number(row.Costo) || 0
        }));
        
        // Merge with existing (updating by ID if exists, else append)
        const updatedProducts = [...products];
        const newCategories = new Set(categories);

        newProducts.forEach(newP => {
             // Auto-add category if missing
             if(newP.category) newCategories.add(newP.category);

             const index = updatedProducts.findIndex(p => p.id === newP.id);
             if (index >= 0) {
                 updatedProducts[index] = newP;
             } else {
                 updatedProducts.unshift(newP); // Add to top
             }
        });

        setProducts(updatedProducts);
        onUpdateCategories(Array.from(newCategories));
        alert(`${newProducts.length} productos procesados correctamente.`);
        
        // Reset file input
        if(importInputRef.current) importInputRef.current.value = '';

    } catch (error) {
        console.error("Error importing file:", error);
        alert("Error al leer el archivo. Asegúrate de que sea un Excel válido (.xlsx).");
    }
  };

  const restockList = products.filter((p: Product) => p.stock <= minStockThreshold).map((p: Product) => ({ ...p, salesCount: productStats[p.id] || 0 })).sort((a: any, b: any) => b.salesCount - a.salesCount);
  const inventoryFiltered = products.filter((p: Product) => {
    const matchesCategory = filterCategory === 'Todos' || p.category === filterCategory;
    const matchesSearch = !scanInput || (p.name.toLowerCase().includes(scanInput.toLowerCase()) || (p.barcode && p.barcode.includes(scanInput)));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="h-full flex flex-col p-8 bg-[#f8fafc] overflow-y-auto animate-fade-in">
      <div className="mb-8 flex flex-col xl:flex-row gap-6 items-start xl:items-center justify-between">
        <div className="w-full xl:w-2/3 flex flex-col md:flex-row gap-4">
           <form onSubmit={handleInventoryBarcodeScan} className="relative flex-1 group"><ScanBarcode className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-indigo-500 transition-colors"/><input ref={scanRef} value={scanInput} onChange={(e) => setScanInput(e.target.value)} className="w-full pl-12 pr-4 py-4 border-none bg-white rounded-2xl shadow-sm outline-none focus:ring-2 focus:ring-indigo-500 font-medium transition-all" placeholder="Escanear producto..."/></form>
           <div className="relative w-full md:w-64"><Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" /><select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="w-full pl-11 pr-8 py-4 border-none bg-white rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer font-medium">{filterCategories.map(cat => (<option key={cat} value={cat}>{cat}</option>))}</select></div>
        </div>
        <div className="flex flex-wrap gap-3 w-full xl:w-auto justify-end">
           {/* Excel Operations */}
           <input type="file" ref={importInputRef} onChange={handleFileChange} accept=".xlsx, .xls" className="hidden" />
           <div className="flex bg-white p-1.5 rounded-2xl shadow-sm border border-slate-100">
             <button onClick={handleExportInventory} title="Exportar / Descargar Plantilla" className="p-2.5 text-slate-500 hover:text-green-600 hover:bg-green-50 rounded-xl transition-colors"><Download className="w-5 h-5"/></button>
             <button onClick={handleImportClick} title="Importar Excel" className="p-2.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"><Upload className="w-5 h-5"/></button>
           </div>

           <div className="flex bg-white p-1.5 rounded-2xl shadow-sm border border-slate-100">
             <button onClick={() => setViewMode('all')} className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${viewMode === 'all' ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Todo</button>
             <button onClick={() => setViewMode('restock')} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${viewMode === 'restock' ? 'bg-orange-50 text-orange-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}><AlertTriangle className="w-4 h-4" /> Reponer</button>
           </div>
           
           <button onClick={() => setIsCategoryManagerOpen(true)} className="flex items-center gap-2 px-6 py-3 bg-white text-indigo-600 border border-indigo-100 rounded-2xl text-sm font-bold hover:bg-indigo-50 hover:shadow-md transition-all">
                <Tags className="w-4 h-4" /> Categorías
           </button>
           
           <button onClick={() => { setEditingProduct(null); setIsModalOpen(true); }} className="flex items-center gap-2 px-6 py-3 bg-slate-800 text-white rounded-2xl text-sm font-bold hover:bg-slate-900 shadow-lg transform hover:-translate-y-1 transition-all"><Plus className="w-4 h-4" /> Nuevo</button>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden animate-fade-in-up">
        <table className="w-full text-left">
           <thead className="bg-slate-50/50 text-xs font-bold uppercase text-slate-400 border-b border-slate-100">
             <tr>
               <th className="p-5 pl-8">Producto</th>
               <th className="p-5">Stock</th>
               <th className="p-5 text-right">Precio</th>
               <th className="p-5 text-center">Acciones</th>
             </tr>
           </thead>
           <tbody className="divide-y divide-slate-50">
             {viewMode === 'all' ? inventoryFiltered.map((p: Product) => (
                <tr key={p.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="p-5 pl-8">
                    <div className="font-bold text-slate-800 text-lg">{p.name}</div>
                    <div className="text-xs text-slate-400 font-mono mt-0.5">{p.category} • {p.barcode || 'S/C'}</div>
                  </td>
                  <td className="p-5">
                    <span className={`px-3 py-1 rounded-full text-xs font-black ${p.stock < 5 ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>{p.stock} un.</span>
                  </td>
                  <td className="p-5 text-right font-black text-indigo-600">{settings.currency}{p.price.toFixed(2)}</td>
                  <td className="p-5 flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => setHistoryProduct(p)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg" title="Historial"><History className="w-5 h-5"/></button>
                    <button onClick={() => { setEditingProduct(p); setIsModalOpen(true); }} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg" title="Editar"><Edit className="w-5 h-5"/></button>
                    <button onClick={() => handleDelete(p.id)} className="p-2 text-red-400 hover:bg-red-50 rounded-lg" title="Eliminar"><Trash2 className="w-5 h-5"/></button>
                  </td>
                </tr>
             )) : restockList.map((p: any) => (
               <tr key={p.id} className="hover:bg-orange-50/30 transition-colors">
                  <td className="p-5 pl-8 font-bold text-slate-700">{p.name}</td>
                  <td className="p-5"><span className="text-red-500 font-black">{p.stock}</span> <span className="text-xs text-slate-400">/ min {minStockThreshold}</span></td>
                  <td className="p-5 text-right font-bold text-slate-500">{p.salesCount} vendidos</td>
                  <td className="p-5 text-center flex justify-center gap-2">
                      <button onClick={() => setHistoryProduct(p)} className="p-2 text-blue-500 hover:bg-blue-100 rounded-lg"><History className="w-5 h-5"/></button>
                      <button onClick={() => { setEditingProduct(p); setIsModalOpen(true); }} className="px-4 py-2 bg-orange-100 text-orange-700 rounded-lg text-xs font-bold hover:bg-orange-200">Reponer</button>
                  </td>
               </tr>
             ))}
           </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg animate-bounce-slight">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center"><h3 className="text-xl font-black text-slate-800">{editingProduct ? 'Editar Producto' : 'Nuevo Producto'}</h3><button onClick={() => setIsModalOpen(false)}><X className="w-6 h-6 text-slate-400 hover:text-slate-600"/></button></div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div><label className="block text-xs font-bold uppercase text-slate-400 mb-1">Nombre</label><input name="name" defaultValue={editingProduct?.name} required className="w-full p-3 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"/></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-bold uppercase text-slate-400 mb-1">Código</label><input name="barcode" defaultValue={editingProduct?.barcode} className="w-full p-3 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"/></div>
                <div><label className="block text-xs font-bold uppercase text-slate-400 mb-1">Categoría</label><select name="category" defaultValue={editingProduct?.category || categories[0]} className="w-full p-3 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500">{categories.map((c: string) => <option key={c} value={c}>{c}</option>)}</select></div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div><label className="block text-xs font-bold uppercase text-slate-400 mb-1">Precio</label><input name="price" type="number" step="0.1" defaultValue={editingProduct?.price} required className="w-full p-3 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"/></div>
                <div><label className="block text-xs font-bold uppercase text-slate-400 mb-1">Costo</label><input name="cost" type="number" step="0.1" defaultValue={editingProduct?.cost} className="w-full p-3 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"/></div>
                <div><label className="block text-xs font-bold uppercase text-slate-400 mb-1">Stock</label><input name="stock" type="number" defaultValue={editingProduct?.stock} required className="w-full p-3 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"/></div>
              </div>
              <button className="w-full py-4 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-900 shadow-xl mt-4">Guardar Producto</button>
            </form>
          </div>
        </div>
      )}

      {isCategoryManagerOpen && (
          <CategoryManagerModal 
            isOpen={isCategoryManagerOpen} 
            onClose={() => setIsCategoryManagerOpen(false)} 
            categories={categories} 
            onUpdate={onUpdateCategories} 
          />
      )}

      {historyProduct && (
          <ProductHistoryModal 
            product={historyProduct} 
            transactions={transactions} 
            purchases={purchases} 
            onClose={() => setHistoryProduct(null)} 
          />
      )}
    </div>
  );
};

const PurchasesView = ({ products, categories, setProducts, purchases, setPurchases, suppliers, setSuppliers, settings }: any) => {
  const [viewMode, setViewMode] = useState<'new' | 'history' | 'suppliers'>('new');
  const [supplier, setSupplier] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [items, setItems] = useState<PurchaseItem[]>([]);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [manualSearchTerm, setManualSearchTerm] = useState('');
  const barcodeRef = useRef<HTMLInputElement>(null);
  const [isQuickCreateOpen, setIsQuickCreateOpen] = useState(false);
  
  // Quick Create State
  const [newProductBarcode, setNewProductBarcode] = useState('');
  const [newProductName, setNewProductName] = useState('');
  const [newProductCategory, setNewProductCategory] = useState(categories[0] || 'Otros');
  const [newProductPrice, setNewProductPrice] = useState('');
  
  // Supplier Edit State
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [supplierHistoryFilter, setSupplierHistoryFilter] = useState<string | null>(null);

  const filteredManualProducts = useMemo(() => {
      if (!manualSearchTerm) return [];
      return products.filter((p: Product) => p.name.toLowerCase().includes(manualSearchTerm.toLowerCase())).slice(0, 5);
  }, [manualSearchTerm, products]);

  const handleBarcodeScan = (e: React.FormEvent) => {
      e.preventDefault();
      if (!barcodeInput) return;
      const product = products.find((p: Product) => p.barcode === barcodeInput);
      if (product) {
        addItemToList(product.id, product.name);
        setBarcodeInput('');
      } else {
        setNewProductBarcode(barcodeInput);
        setIsQuickCreateOpen(true);
      }
  };

  const createNewProduct = () => {
      const newProduct: Product = {
        id: Date.now().toString(),
        name: newProductName,
        barcode: newProductBarcode,
        category: newProductCategory,
        price: parseFloat(newProductPrice) || 0,
        stock: 0,
        description: 'Creado desde Recepción',
        cost: 0
      };
      setProducts([...products, newProduct]);
      setIsQuickCreateOpen(false);
      addItemToList(newProduct.id, newProduct.name);
      setNewProductName(''); setNewProductPrice(''); setBarcodeInput('');
      if(barcodeRef.current) barcodeRef.current.focus();
  };

  const addItemToList = (productId: string, productName: string) => {
      setItems(prev => {
        const existing = prev.find(i => i.productId === productId);
        if (existing) { return prev; }
        return [...prev, { productId, productName, quantity: 1, cost: 0 }];
      });
      setManualSearchTerm('');
  };

  const updateItem = (productId: string, field: 'quantity' | 'cost', value: number) => {
      setItems(prev => prev.map(item => item.productId === productId ? { ...item, [field]: value } : item));
  };

  const removeItem = (productId: string) => {
      setItems(prev => prev.filter(i => i.productId !== productId));
  };

  const finalizePurchase = () => {
      if (!supplier || !invoiceNumber || items.length === 0) {
        alert('Por favor complete el proveedor, número de factura y agregue items.');
        return;
      }
      const totalCost = items.reduce((sum, item) => sum + (item.cost * item.quantity), 0);
      const purchase: Purchase = { 
        id: Date.now().toString(), 
        date: new Date().toISOString(), 
        supplier, 
        invoiceNumber, 
        items, 
        totalCost 
      };
      
      const updatedProducts = products.map((p: Product) => {
        const purchasedItem = items.find(i => i.productId === p.id);
        if (purchasedItem) {
            return { 
              ...p, 
              stock: p.stock + purchasedItem.quantity, 
              cost: purchasedItem.cost // Update cost price to latest
            };
        }
        return p;
      });

      setProducts(updatedProducts);
      const newPurchases = [purchase, ...purchases];
      setPurchases(newPurchases);
      StorageService.savePurchase(purchase);
      
      setSupplier(''); 
      setInvoiceNumber(''); 
      setItems([]);
      alert('Compra registrada e inventario actualizado.');
  };

  const handleSaveSupplier = (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const formData = new FormData(e.currentTarget);
      const newSupplier: Supplier = {
        id: editingSupplier ? editingSupplier.id : Date.now().toString(),
        name: formData.get('name') as string,
        ruc: formData.get('ruc') as string,
        phone: formData.get('phone') as string,
        email: formData.get('email') as string,
        address: formData.get('address') as string,
        contactName: formData.get('contactName') as string,
      };
      
      let updatedSuppliers;
      if (editingSupplier) {
        updatedSuppliers = suppliers.map((s: Supplier) => s.id === newSupplier.id ? newSupplier : s);
      } else {
        updatedSuppliers = [...suppliers, newSupplier];
      }
      setSuppliers(updatedSuppliers);
      setIsSupplierModalOpen(false);
      setEditingSupplier(null);
  };

  const filteredPurchases = supplierHistoryFilter ? purchases.filter((p: Purchase) => p.supplier === supplierHistoryFilter) : purchases;

  return (
    <div className="h-full flex flex-col p-8 bg-[#f8fafc] overflow-y-auto animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Recepción de Mercadería</h2>
          <p className="text-slate-500 font-medium">Gestiona proveedores y entradas de stock</p>
        </div>
        <div className="flex bg-white p-1.5 rounded-2xl shadow-sm border border-slate-100">
           <button onClick={() => { setViewMode('new'); setSupplierHistoryFilter(null); }} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${ viewMode === 'new' ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700' }`}><Plus className="w-4 h-4"/> Nueva Recepción</button>
           <button onClick={() => { setViewMode('history'); setSupplierHistoryFilter(null); }} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${ viewMode === 'history' ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700' }`}><History className="w-4 h-4" /> Historial</button>
           <button onClick={() => setViewMode('suppliers')} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${ viewMode === 'suppliers' ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700' }`}><Truck className="w-4 h-4" /> Proveedores</button>
        </div>
      </div>

      {viewMode === 'new' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in-up">
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
               <h3 className="font-bold text-slate-800 mb-4 text-lg">Datos del Proveedor</h3>
               <div className="space-y-4">
                 <div>
                   <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Proveedor</label>
                   <input list="suppliersList" value={supplier} onChange={(e) => setSupplier(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium" placeholder="Buscar o escribir..."/>
                   <datalist id="suppliersList">{suppliers.map((s: Supplier) => (<option key={s.id} value={s.name} />))}</datalist>
                 </div>
                 <div>
                   <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">N° Factura / Guía</label>
                   <input value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium font-mono" placeholder="F001-000000"/>
                 </div>
               </div>
            </div>
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-6 rounded-3xl text-white shadow-xl shadow-indigo-200">
              <h3 className="font-bold text-white mb-4 flex items-center gap-2 text-lg"><ScanBarcode className="w-6 h-6"/> Agregar Productos</h3>
              <div className="space-y-4">
                <div>
                    <label className="text-xs font-bold text-indigo-200 uppercase tracking-wide mb-1 block">Escáner</label>
                    <form onSubmit={handleBarcodeScan}>
                        <input ref={barcodeRef} value={barcodeInput} onChange={(e) => setBarcodeInput(e.target.value)} className="w-full p-3 border-2 border-white/20 bg-white/10 rounded-xl focus:bg-white focus:text-slate-800 outline-none font-mono text-lg placeholder-white/50 text-white transition-all" placeholder="Código..." autoFocus/>
                    </form>
                </div>
                <div className="relative flex items-center justify-center my-4"><div className="border-t border-white/20 w-full absolute"></div><span className="bg-indigo-500 px-2 text-xs text-white/60 relative z-10 font-bold rounded">O BUSCAR</span></div>
                <div className="relative">
                   <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-300 w-5 h-5"/>
                   <input type="text" value={manualSearchTerm} onChange={(e) => setManualSearchTerm(e.target.value)} className="w-full pl-10 p-3 bg-white/10 border border-white/20 rounded-xl focus:bg-white focus:text-slate-800 outline-none placeholder-indigo-200 text-sm transition-all" placeholder="Nombre del producto..."/>
                   {filteredManualProducts.length > 0 && (
                     <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl z-20 overflow-hidden text-slate-800">
                        {filteredManualProducts.map((p: Product) => (
                          <button key={p.id} onClick={() => addItemToList(p.id, p.name)} className="w-full text-left px-4 py-3 hover:bg-slate-50 text-sm border-b border-slate-50 last:border-0 flex justify-between items-center font-medium">
                            <span>{p.name}</span><span className="text-xs text-slate-400 font-mono">{p.barcode}</span>
                          </button>
                        ))}
                     </div>
                   )}
                </div>
              </div>
            </div>
          </div>
          <div className="lg:col-span-2 flex flex-col h-full bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
             <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
               <h3 className="font-bold text-slate-800 text-lg">Productos a Ingresar <span className="text-slate-400 text-sm ml-2">({items.length})</span></h3>
               <div className="px-4 py-2 bg-emerald-100 text-emerald-700 rounded-lg font-bold">Total: {settings.currency}{items.reduce((s, i) => s + (i.cost * i.quantity), 0).toFixed(2)}</div>
             </div>
             <div className="flex-1 overflow-y-auto p-4">
               {items.length === 0 ? (<div className="flex flex-col items-center justify-center h-64 text-slate-300"><ShoppingBag className="w-16 h-16 mb-4 opacity-50"/><p className="text-lg font-medium">Lista vacía</p></div>) : (
                 <table className="w-full text-left">
                   <thead className="text-xs font-bold text-slate-400 uppercase bg-slate-50 rounded-lg"><tr><th className="p-3 pl-4 rounded-l-lg">Producto</th><th className="p-3 w-32">Cant.</th><th className="p-3 w-32">Costo</th><th className="p-3 w-32 text-right">Subtotal</th><th className="p-3 w-10 rounded-r-lg"></th></tr></thead>
                   <tbody className="divide-y divide-slate-50">
                       {items.map((item) => (
                           <tr key={item.productId} className="hover:bg-slate-50 transition-colors">
                               <td className="p-4 font-bold text-slate-700">{item.productName}</td>
                               <td className="p-4"><input type="number" min="1" value={item.quantity} onChange={(e) => updateItem(item.productId, 'quantity', parseFloat(e.target.value) || 0)} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-center font-bold outline-none focus:border-indigo-500"/></td>
                               <td className="p-4"><input type="number" min="0" step="0.01" value={item.cost} onChange={(e) => updateItem(item.productId, 'cost', parseFloat(e.target.value) || 0)} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-center font-bold outline-none focus:border-indigo-500"/></td>
                               <td className="p-4 text-right font-bold text-slate-700">{settings.currency}{(item.quantity * item.cost).toFixed(2)}</td>
                               <td className="p-4 text-right"><button onClick={() => removeItem(item.productId)} className="text-slate-300 hover:text-red-500 transition-colors"><Trash2 className="w-5 h-5"/></button></td>
                            </tr>
                        ))}
                    </tbody>
                 </table>
               )}
             </div>
             <div className="p-6 border-t border-slate-100 bg-slate-50">
                <button onClick={finalizePurchase} className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-bold shadow-lg shadow-emerald-200 hover:bg-emerald-600 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 text-lg"><CheckCircle className="w-6 h-6"/> Procesar Ingreso</button>
             </div>
          </div>
        </div>
      )}

      {viewMode === 'history' && (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden animate-fade-in-up">
           {supplierHistoryFilter && (<div className="p-4 bg-indigo-50 border-b border-indigo-100 flex justify-between items-center"><span className="font-bold text-indigo-800">Filtrado por: {supplierHistoryFilter}</span><button onClick={() => setSupplierHistoryFilter(null)} className="text-xs font-bold text-indigo-600 hover:underline">Ver todos</button></div>)}
           <table className="w-full text-left">
             <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 text-sm"><tr><th className="p-5 font-bold">Fecha</th><th className="p-5 font-bold">Proveedor</th><th className="p-5 font-bold">Documento</th><th className="p-5 font-bold">Items</th><th className="p-5 font-bold text-right">Total</th></tr></thead>
             <tbody className="divide-y divide-slate-50">{filteredPurchases.map(p => (<tr key={p.id} className="hover:bg-slate-50 transition-colors"><td className="p-5 font-medium">{new Date(p.date).toLocaleDateString()}</td><td className="p-5 text-indigo-600 font-bold">{p.supplier}</td><td className="p-5 font-mono text-sm text-slate-400">{p.invoiceNumber}</td><td className="p-5 text-slate-600">{p.items.length} skus</td><td className="p-5 font-black text-slate-800 text-right">{settings.currency}{p.totalCost.toFixed(2)}</td></tr>))}</tbody>
           </table>
        </div>
      )}

      {viewMode === 'suppliers' && (
        <div className="animate-fade-in-up">
           <div className="flex justify-between items-center mb-6"><h3 className="font-bold text-xl text-slate-700">Directorio de Proveedores</h3><button onClick={() => { setEditingSupplier(null); setIsSupplierModalOpen(true); }} className="px-5 py-2.5 bg-slate-800 text-white rounded-xl text-sm font-bold hover:bg-slate-900 shadow-lg">+ Nuevo Proveedor</button></div>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {suppliers.map((s: Supplier) => (
                <div key={s.id} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:border-indigo-200 hover:shadow-md transition-all group">
                   <div className="flex justify-between items-start mb-4"><div><h4 className="font-bold text-slate-800 text-xl">{s.name}</h4>{s.ruc && <span className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-500 font-mono mt-1 inline-block">RUC: {s.ruc}</span>}</div><button onClick={() => { setEditingSupplier(s); setIsSupplierModalOpen(true); }} className="text-slate-300 hover:text-indigo-600 p-2"><Edit className="w-5 h-5"/></button></div>
                   <div className="space-y-2 text-sm text-slate-500 mb-6">{s.contactName && <div className="flex items-center gap-3"><Users className="w-4 h-4 text-indigo-400"/> {s.contactName}</div>}{s.phone && <div className="flex items-center gap-3"><Phone className="w-4 h-4 text-indigo-400"/> {s.phone}</div>}{s.email && <div className="flex items-center gap-3"><Mail className="w-4 h-4 text-indigo-400"/> {s.email}</div>}{s.address && <div className="flex items-center gap-3"><MapPin className="w-4 h-4 text-indigo-400"/> {s.address}</div>}</div>
                   <button onClick={() => { setSupplierHistoryFilter(s.name); setViewMode('history'); }} className="w-full py-3 bg-slate-50 text-slate-600 rounded-xl text-sm font-bold hover:bg-indigo-50 hover:text-indigo-600 transition-colors flex items-center justify-center gap-2"><History className="w-4 h-4"/> Ver Historial</button>
                </div>
              ))}
           </div>
        </div>
      )}
      
      {isQuickCreateOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md animate-bounce-slight">
            <div className="p-6 border-b border-slate-100"><h3 className="text-xl font-black text-slate-800">Producto Nuevo</h3><p className="text-sm text-slate-500 mt-1">El código <span className="font-mono bg-yellow-100 px-1 rounded">{newProductBarcode}</span> no existe.</p></div>
            <div className="p-6 space-y-4">
               <div><label className="block text-sm font-bold text-slate-700 mb-1">Nombre</label><input autoFocus value={newProductName} onChange={(e) => setNewProductName(e.target.value)} className="w-full p-3 border-2 border-slate-100 rounded-xl focus:border-indigo-500 outline-none" placeholder="Ej. Coca Cola"/></div>
               <div className="grid grid-cols-2 gap-4"><div><label className="block text-sm font-bold text-slate-700 mb-1">Categoría</label><select value={newProductCategory} onChange={(e) => setNewProductCategory(e.target.value)} className="w-full p-3 border-2 border-slate-100 rounded-xl outline-none">{categories.map((c: string) => <option key={c} value={c}>{c}</option>)}</select></div><div><label className="block text-sm font-bold text-slate-700 mb-1">Precio</label><input type="number" step="0.10" value={newProductPrice} onChange={(e) => setNewProductPrice(e.target.value)} className="w-full p-3 border-2 border-slate-100 rounded-xl focus:border-indigo-500 outline-none" /></div></div>
            </div>
            <div className="p-6 bg-slate-50 flex gap-4"><button onClick={() => { setIsQuickCreateOpen(false); setBarcodeInput(''); }} className="flex-1 py-3 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-white">Cancelar</button><button onClick={createNewProduct} disabled={!newProductName || !newProductPrice} className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-lg">Crear</button></div>
          </div>
        </div>
      )}
      {isSupplierModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg">
             
            <div className="p-6 border-b border-slate-100 flex justify-between items-center"><h3 className="text-xl font-black text-slate-800">{editingSupplier ? 'Editar Proveedor' : 'Nuevo Proveedor'}</h3><button onClick={() => setIsSupplierModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-6 h-6"/></button></div>
            <form onSubmit={handleSaveSupplier} className="p-6 space-y-4">
               <div><label className="block text-xs font-bold uppercase text-slate-400 mb-1">Nombre</label><input name="name" required defaultValue={editingSupplier?.name} className="w-full p-3 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"/></div>
               <div><label className="block text-xs font-bold uppercase text-slate-400 mb-1">RUC</label><input name="ruc" defaultValue={editingSupplier?.ruc} className="w-full p-3 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"/></div>
               <div className="grid grid-cols-2 gap-4"><div><label className="block text-xs font-bold uppercase text-slate-400 mb-1">Contacto</label><input name="contactName" defaultValue={editingSupplier?.contactName} className="w-full p-3 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"/></div><div><label className="block text-xs font-bold uppercase text-slate-400 mb-1">Teléfono</label><input name="phone" defaultValue={editingSupplier?.phone} className="w-full p-3 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"/></div></div>
               <div><label className="block text-xs font-bold uppercase text-slate-400 mb-1">Email</label><input name="email" type="email" defaultValue={editingSupplier?.email} className="w-full p-3 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"/></div>
               <button type="submit" className="w-full py-4 bg-slate-800 text-white rounded-xl hover:bg-slate-900 font-bold mt-2 shadow-xl">Guardar Proveedor</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// --- POS View ---

const POSView = ({ products, categories, cart, onAddToCart, onUpdateCart, onRemoveFromCart, onUpdateDiscount, onCheckout, onClearCart, settings, customers, isShiftOpen, onOpenCashControl }: any) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [viewMode, setViewMode] = useState<'GRID' | 'LIST'>('GRID');
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);
  const barcodeRef = useRef<HTMLInputElement>(null);

  // Combine static 'Todos' with dynamic categories
  const filterCategories = ['Todos', ...categories];

  useEffect(() => {
    if (barcodeRef.current && isShiftOpen) barcodeRef.current.focus();
  }, [cart.length, isShiftOpen]);

  const filteredProducts = products.filter((p: Product) => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (p.barcode && p.barcode.includes(searchTerm));
    const matchesCategory = selectedCategory === 'Todos' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isShiftOpen) return;
    if (!barcodeInput) return;

    const product = products.find((p: Product) => p.barcode === barcodeInput);
    if (product) {
      onAddToCart(product);
      setBarcodeInput('');
    } else {
      alert('Producto no encontrado');
      setBarcodeInput('');
    }
  };

  // Calculate rough total for the FAB
  const cartItemCount = cart.reduce((acc: number, item: CartItem) => acc + item.quantity, 0);
  const cartTotal = cart.reduce((acc: number, item: CartItem) => acc + (item.price * item.quantity), 0);

  return (
    <div className="flex h-full relative overflow-hidden">
      {!isShiftOpen && (
        <div className="absolute inset-0 z-30 bg-slate-900/30 backdrop-blur-md flex items-center justify-center animate-fade-in">
           <div className="bg-white p-8 rounded-3xl shadow-2xl text-center max-w-md border border-white/50 animate-bounce-slight">
             <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Lock className="w-10 h-10 text-slate-400" />
             </div>
             <h2 className="text-3xl font-black text-slate-800 mb-2">Caja Cerrada</h2>
             <p className="text-slate-500 mb-8 font-medium">Debe abrir un turno para comenzar a vender.</p>
             <button
                onClick={onOpenCashControl}
                className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl font-bold hover:shadow-lg hover:shadow-indigo-300 transition-all flex items-center justify-center gap-2 transform hover:-translate-y-1"
             >
                <Unlock className="w-5 h-5" />
                Abrir Caja Ahora
             </button>
           </div>
        </div>
      )}

      <div className="flex-1 flex flex-col h-full bg-[#f8fafc]">
        {/* Toolbar */}
        <div className="p-6 pb-2 z-10 space-y-4 animate-fade-in-up">
          <div className="flex gap-4">
            <div className="flex bg-white p-1.5 rounded-2xl shadow-sm border border-slate-100 shrink-0">
               <button onClick={() => setViewMode('GRID')} className={`p-3 rounded-xl transition-all ${viewMode === 'GRID' ? 'bg-indigo-50 text-indigo-600 shadow-inner' : 'text-slate-400 hover:text-slate-600'}`}><LayoutGrid className="w-5 h-5"/></button>
               <button onClick={() => setViewMode('LIST')} className={`p-3 rounded-xl transition-all ${viewMode === 'LIST' ? 'bg-indigo-50 text-indigo-600 shadow-inner' : 'text-slate-400 hover:text-slate-600'}`}><List className="w-5 h-5"/></button>
            </div>
            <form onSubmit={handleBarcodeSubmit} className="flex-1 shadow-sm rounded-2xl">
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><ScanBarcode className="h-6 w-6 text-indigo-400 group-focus-within:text-indigo-600 transition-colors" /></div>
                <input ref={barcodeRef} type="text" disabled={!isShiftOpen} value={barcodeInput} onChange={(e) => setBarcodeInput(e.target.value)} className="block w-full pl-12 pr-4 py-4 border-2 border-transparent bg-white rounded-2xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all font-bold shadow-sm" placeholder="Escanear código..." autoFocus />
              </div>
            </form>
          </div>
          
          <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
             <div className="relative w-full md:w-80 group">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-indigo-500 transition-colors" />
                <input type="text" disabled={!isShiftOpen} placeholder="Buscar producto..." className="w-full pl-11 pr-4 py-3 border-none bg-white rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium transition-all" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
             </div>
             <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 custom-scrollbar mask-gradient">
               {filterCategories.map((cat: string) => (
                   <button 
                    key={cat} 
                    disabled={!isShiftOpen} 
                    onClick={() => setSelectedCategory(cat)} 
                    className={`px-5 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all transform hover:scale-105 ${selectedCategory === cat ? 'bg-slate-800 text-white shadow-lg shadow-slate-300' : 'bg-white text-slate-500 hover:bg-white hover:shadow-md'}`}
                   >
                       {cat}
                   </button>
               ))}
             </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 pt-2">
          {viewMode === 'GRID' ? (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5 pb-20">
              {filteredProducts.map((product: Product, index: number) => (
                <button 
                    key={product.id} 
                    onClick={() => onAddToCart(product)} 
                    disabled={!isShiftOpen || product.stock <= 0} 
                    className="group bg-white p-4 rounded-3xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_10px_10px_-5px_rgba(0,0,0,0.04)] transition-all hover:-translate-y-1.5 duration-300 flex flex-col h-full border border-slate-100 disabled:opacity-60 disabled:cursor-not-allowed animate-fade-in-up"
                    style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="w-full aspect-square bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl mb-4 flex items-center justify-center overflow-hidden relative group-hover:from-indigo-50 group-hover:to-purple-50 transition-colors">
                     <span className="text-5xl font-black text-slate-200 group-hover:text-indigo-200 transition-colors select-none">{product.name.charAt(0)}</span>
                     <div className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-black shadow-sm backdrop-blur-sm ${product.stock < 5 ? 'bg-red-500/10 text-red-600' : 'bg-white/80 text-slate-600'}`}>
                        {product.stock} un.
                     </div>
                     {/* Add Overlay Icon on Hover */}
                     <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/5 backdrop-blur-[1px]">
                        <div className="bg-white p-3 rounded-full shadow-lg text-indigo-600 transform scale-50 group-hover:scale-100 transition-transform">
                            <Plus className="w-6 h-6" />
                        </div>
                     </div>
                  </div>
                  <div className="text-left w-full">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{product.category}</p>
                    <h3 className="font-bold text-slate-800 text-lg leading-tight mb-2 line-clamp-2">{product.name}</h3>
                  </div>
                  <div className="mt-auto pt-2 flex items-center justify-between w-full">
                    <span className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-slate-800 to-slate-600 group-hover:from-indigo-600 group-hover:to-purple-600 transition-all">
                        {settings.currency}{product.price.toFixed(2)}
                    </span>
                    <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-colors shadow-sm">
                        <ShoppingBag className="w-4 h-4" />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
             <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden animate-fade-in-up">
                <table className="w-full text-left">
                  <thead className="bg-slate-50/50 text-xs font-bold uppercase text-slate-400 border-b border-slate-100"><tr><th className="p-4 pl-6">Producto</th><th className="p-4">Stock</th><th className="p-4 text-right">Precio</th><th className="p-4 w-16"></th></tr></thead>
                  <tbody className="divide-y divide-slate-50">
                     {filteredProducts.map((product: Product) => (
                        <tr key={product.id} className="hover:bg-indigo-50/30 transition-colors group cursor-pointer" onClick={() => isShiftOpen && product.stock > 0 && onAddToCart(product)}>
                           <td className="p-4 pl-6"><div className="font-bold text-slate-800">{product.name}</div><div className="text-xs text-slate-400 font-medium">{product.category} • {product.barcode}</div></td>
                           <td className="p-4"><span className={`text-xs px-2.5 py-1 rounded-full font-bold ${product.stock < 5 ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-500'}`}>{product.stock}</span></td>
                           <td className="p-4 text-right font-bold text-indigo-600">{settings.currency}{product.price.toFixed(2)}</td>
                           <td className="p-4"><button disabled={!isShiftOpen || product.stock <= 0} className="p-2 bg-white border border-slate-200 shadow-sm text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all disabled:opacity-50"><Plus className="w-4 h-4" /></button></td>
                        </tr>
                     ))}
                  </tbody>
                </table>
             </div>
          )}
        </div>
      </div>

      {/* Mobile Cart Floating Button */}
      {cart.length > 0 && (
        <button 
          onClick={() => setIsMobileCartOpen(true)}
          className="xl:hidden fixed bottom-6 right-6 z-40 bg-slate-800 text-white p-4 rounded-full shadow-2xl flex items-center gap-3 animate-bounce-slight hover:scale-105 transition-transform"
        >
          <div className="relative">
            <ShoppingBag className="w-6 h-6" />
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-slate-800">
              {cartItemCount}
            </span>
          </div>
          <span className="font-bold pr-1">{settings.currency}{cartTotal.toFixed(2)}</span>
        </button>
      )}

      {/* Cart Container - Responsive */}
      <div className={`
        fixed inset-y-0 right-0 z-50 w-full md:w-[450px] bg-white shadow-2xl transform transition-transform duration-300 cubic-bezier(0.4, 0, 0.2, 1)
        xl:relative xl:translate-x-0 xl:w-[400px] xl:shadow-none xl:z-20 xl:block
        ${isMobileCartOpen ? 'translate-x-0' : 'translate-x-full'}
      `}>
         {/* Mobile Close Button for Cart */}
         <div className="xl:hidden absolute top-4 left-4 z-50">
            <button onClick={() => setIsMobileCartOpen(false)} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-600 transition-colors shadow-sm">
              <ChevronLeft className="w-6 h-6"/>
            </button>
         </div>
         
         <Cart items={cart} onUpdateQuantity={onUpdateCart} onRemoveItem={onRemoveFromCart} onUpdateDiscount={onUpdateDiscount} onCheckout={onCheckout} onClearCart={onClearCart} settings={settings} customers={customers} />
      </div>

      {/* Mobile Backdrop */}
      {isMobileCartOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 xl:hidden" onClick={() => setIsMobileCartOpen(false)} />
      )}
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.POS);
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_SETTINGS);
  const [categories, setCategories] = useState<string[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [shifts, setShifts] = useState<CashShift[]>([]);
  const [activeShiftId, setActiveShiftId] = useState<string | null>(null);
  
  // New State for Purchases
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  // Modals
  const [showTicket, setShowTicket] = useState(false);
  const [lastTransaction, setLastTransaction] = useState<Transaction | null>(null);

  // Load Data
  useEffect(() => {
    setProducts(StorageService.getProducts());
    setTransactions(StorageService.getTransactions());
    setSettings(StorageService.getSettings());
    setCategories(StorageService.getCategories());
    setCustomers(StorageService.getCustomers());
    setShifts(StorageService.getShifts());
    setActiveShiftId(StorageService.getActiveShiftId());
    
    // Load Purchase Data
    setPurchases(StorageService.getPurchases());
    setSuppliers(StorageService.getSuppliers());
  }, []);

  // Cart Logic
  const handleAddToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === product.id);
      if (existing) {
        return prev.map(i => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const handleUpdateCart = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, quantity: Math.max(1, item.quantity + delta) };
      }
      return item;
    }));
  };

  const handleRemoveFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const handleUpdateDiscount = (id: string, discount: number) => {
    setCart(prev => prev.map(item => item.id === id ? { ...item, discount } : item));
  };

  const handleClearCart = () => setCart([]);

  const handleUpdateCategories = (newCategories: string[]) => {
    setCategories(newCategories);
    StorageService.saveCategories(newCategories);
  };

  // Checkout
  const handleCheckout = (method: PaymentMethod, payments: PaymentDetail[]) => {
    if (!activeShiftId) {
      alert("Debe abrir caja antes de realizar ventas.");
      return;
    }

    // Calculate totals
    const lineTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const totalDiscount = cart.reduce((sum, item) => sum + ((item.discount || 0) * item.quantity), 0);
    const netAmount = Math.max(0, lineTotal - totalDiscount);
    
    let subtotal, tax, total;
    if (settings.pricesIncludeTax) {
        total = netAmount;
        subtotal = total / (1 + settings.taxRate);
        tax = total - subtotal;
    } else {
        subtotal = netAmount;
        tax = subtotal * settings.taxRate;
        total = subtotal + tax;
    }

    const profit = cart.reduce((acc, item) => {
        const cost = item.cost || 0;
        const revenue = (item.price - (item.discount || 0)) * item.quantity;
        const itemCost = cost * item.quantity;
        return acc + (revenue - itemCost);
    }, 0);

    const newTransaction: Transaction = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      items: [...cart],
      subtotal,
      tax,
      discount: totalDiscount,
      total,
      paymentMethod: method,
      payments,
      profit,
      shiftId: activeShiftId
    };

    // Update Stock
    const updatedProducts = products.map(p => {
      const cartItem = cart.find(c => c.id === p.id);
      if (cartItem) {
        return { ...p, stock: p.stock - cartItem.quantity };
      }
      return p;
    });

    setProducts(updatedProducts);
    StorageService.saveProducts(updatedProducts);

    // Save Transaction
    StorageService.saveTransaction(newTransaction);
    setTransactions(prev => [newTransaction, ...prev]);

    // Clear Cart
    setCart([]);

    // Show Ticket
    setLastTransaction(newTransaction);
    setShowTicket(true);
  };

  const handleOpenShift = () => {
    const newShift: CashShift = {
        id: Date.now().toString(),
        startTime: new Date().toISOString(),
        startAmount: 0,
        status: 'OPEN',
        totalSalesCash: 0,
        totalSalesDigital: 0
    };
    setShifts(prev => [newShift, ...prev]);
    StorageService.saveShift(newShift);
    setActiveShiftId(newShift.id);
    StorageService.setActiveShiftId(newShift.id);
    alert("Turno abierto (Fondo inicial asumido: 0)");
  };

  return (
    <Layout currentView={currentView} onChangeView={setCurrentView} settings={settings}>
      {currentView === ViewState.POS && (
        <POSView 
          products={products}
          categories={categories}
          cart={cart}
          onAddToCart={handleAddToCart}
          onUpdateCart={handleUpdateCart}
          onRemoveFromCart={handleRemoveFromCart}
          onUpdateDiscount={handleUpdateDiscount}
          onCheckout={handleCheckout}
          onClearCart={handleClearCart}
          settings={settings}
          customers={customers}
          isShiftOpen={!!activeShiftId}
          onOpenCashControl={handleOpenShift}
        />
      )}
      {currentView === ViewState.INVENTORY && (
        <InventoryView 
            products={products} 
            categories={categories}
            setProducts={(p: Product[]) => { setProducts(p); StorageService.saveProducts(p); }} 
            settings={settings} 
            transactions={transactions} 
            purchases={purchases}
            onUpdateCategories={handleUpdateCategories}
        />
      )}
      {currentView === ViewState.SALES && (
          <ReportsView 
            transactions={transactions} 
            shifts={shifts} 
            onAnalyze={analyzeSalesWithGemini}
            settings={settings} 
          />
      )}
      {currentView === ViewState.SETTINGS && (
          <SettingsView 
            settings={settings} 
            onSaveSettings={(s: StoreSettings) => { setSettings(s); StorageService.saveSettings(s); }}
          />
      )}
      {currentView === ViewState.CUSTOMERS && (
          <CustomersView 
            customers={customers} 
            setCustomers={(c: Customer[]) => { setCustomers(c); StorageService.saveCustomers(c); }}
            settings={settings}
          />
      )}
      {currentView === ViewState.PURCHASES && (
        <PurchasesView 
          products={products}
          categories={categories}
          setProducts={(p: Product[]) => { setProducts(p); StorageService.saveProducts(p); }}
          purchases={purchases}
          setPurchases={(p: Purchase[]) => { setPurchases(p); StorageService.savePurchase(p[0]); }} 
          suppliers={suppliers}
          setSuppliers={(s: Supplier[]) => { setSuppliers(s); StorageService.saveSuppliers(s); }}
          settings={settings}
        />
      )}

      {showTicket && lastTransaction && (
        <Ticket 
          type="SALE" 
          data={lastTransaction} 
          settings={settings} 
          onClose={() => setShowTicket(false)} 
        />
      )}
    </Layout>
  );
}