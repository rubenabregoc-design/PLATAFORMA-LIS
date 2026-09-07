import React, { useState, useEffect } from 'react';
import {
  FileText,
  Search,
  Plus,
  ChevronRight,
  History,
  ShieldCheck,
  Clock,
  FileCheck,
  Eye,
  ArrowRight,
  Download,
  AlertTriangle,
  FolderOpen
} from 'lucide-react';
import { SupabaseService } from '../../../services/SupabaseService';

const QualityDocsManager: React.FC = () => {
  const [docs, setDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    fetchDocs();
  }, []);

  const fetchDocs = async () => {
    try {
      const data = await SupabaseService.qualityDocs.getAll();
      setDocs(data);
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  const filtered = docs.filter(d =>
    d.title.toLowerCase().includes(filter.toLowerCase()) ||
    d.code.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <FileText className="text-teal-400" size={32} />
            <h1 className="text-3xl font-black tracking-tight uppercase italic">Gestión Documental de Calidad</h1>
          </div>
          <p className="text-slate-400 font-medium leading-relaxed max-w-xl">
             Repositorio centralizado de SOPs, Manuales Técnicos y Políticas Institucionales conforme a ISO 15189 §8.2.
          </p>
        </div>
        <div className="flex gap-4">
           <button className="bg-teal-500 hover:bg-teal-400 text-slate-950 px-8 py-3 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-xl shadow-teal-500/20">
              <Plus size={18} className="inline mr-2" /> Nuevo Documento
           </button>
        </div>
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-teal-500/5 rounded-full blur-[80px]"></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Categories Sidebar */}
        <div className="lg:col-span-1 space-y-4">
           <h3 className="font-black text-slate-800 text-xs uppercase tracking-widest px-2">Categorías ISO</h3>
           {['SOP (PNO)', 'MANUALES', 'POLÍTICAS', 'FORMULARIOS'].map(cat => (
              <div key={cat} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:border-teal-400 transition-all cursor-pointer flex items-center justify-between group">
                 <div className="flex items-center gap-3">
                    <FolderOpen size={18} className="text-slate-400 group-hover:text-teal-500 transition-colors" />
                    <span className="font-black text-slate-800 text-xs uppercase">{cat}</span>
                 </div>
                 <ChevronRight size={14} className="text-slate-300" />
              </div>
           ))}
        </div>

        {/* Documents Table */}
        <div className="lg:col-span-3 bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h3 className="text-lg font-black text-slate-800">Control de Documentos Vigentes</h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                placeholder="Buscar por código o título..."
                value={filter}
                onChange={e => setFilter(e.target.value)}
                className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] w-64"
              />
            </div>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-[9px] font-black uppercase tracking-widest border-b border-slate-100">
                  <th className="px-6 py-4">Código / Título</th>
                  <th className="px-6 py-4">Versión</th>
                  <th className="px-6 py-4">Próxima Revisión</th>
                  <th className="px-6 py-4">Estado</th>
                  <th className="px-6 py-4 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map(doc => (
                  <tr key={doc.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4">
                       <div className="flex items-center gap-3">
                          <div className="p-2 bg-slate-100 text-slate-500 rounded-lg group-hover:bg-teal-50 group-hover:text-teal-600 transition-all">
                             <FileText size={16} />
                          </div>
                          <div>
                             <p className="font-black text-slate-800 text-xs uppercase tracking-tight">{doc.title}</p>
                             <p className="text-[10px] text-slate-400 font-bold uppercase">{doc.code}</p>
                          </div>
                       </div>
                    </td>
                    <td className="px-6 py-4">
                       <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] font-black font-mono">v{doc.version}</span>
                    </td>
                    <td className="px-6 py-4">
                       <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                          <Clock size={12} className={new Date(doc.next_review_at) < new Date() ? 'text-red-500' : 'text-slate-300'} />
                          {new Date(doc.next_review_at).toLocaleDateString()}
                       </div>
                    </td>
                    <td className="px-6 py-4">
                       <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase ${
                          doc.status === 'PUBLISHED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                       }`}>
                          {doc.status}
                       </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                       <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button className="p-1.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-all"><Eye size={14} /></button>
                          <button className="p-1.5 bg-slate-100 text-slate-600 rounded-lg hover:bg-teal-500 hover:text-white transition-all"><Download size={14} /></button>
                       </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QualityDocsManager;
