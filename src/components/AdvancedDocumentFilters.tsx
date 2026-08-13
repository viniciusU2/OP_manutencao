import { Plus, Trash2 } from "lucide-react";

export interface AdvancedFilter { field: string; value: string; }
export interface FilterFieldOption { value: string; label: string; }

interface Props { fields: FilterFieldOption[]; value: AdvancedFilter[]; onChange: (filters: AdvancedFilter[]) => void; }

export function AdvancedDocumentFilters({ fields, value, onChange }: Props) {
  const add = () => onChange([...value, { field: fields[0]?.value ?? "", value: "" }]);
  const update = (index: number, patch: Partial<AdvancedFilter>) => onChange(value.map((item, i) => i === index ? { ...item, ...patch } : item));
  const remove = (index: number) => onChange(value.filter((_, i) => i !== index));
  return <div className="grid gap-2 rounded-lg border border-slate-300/80 bg-slate-50/80 p-2.5">
    <div className="flex items-center justify-between"><span className="text-xs font-semibold text-slate-700">Filtros avançados</span><button type="button" onClick={add} className="inline-flex items-center gap-1 rounded-md border border-blue-200 bg-white px-2 py-1 text-xs text-blue-700 hover:bg-blue-50"><Plus size={14}/>Adicionar</button></div>
    {value.map((filter, index) => <div key={index} className="grid grid-cols-[1fr_1fr_auto] gap-2">
      <select value={filter.field} onChange={e => update(index, { field: e.target.value })} className="h-9 min-w-0 rounded-md border border-slate-300 bg-white px-2 text-xs">{fields.map(field => <option key={field.value} value={field.value}>{field.label}</option>)}</select>
      <input value={filter.value} onChange={e => update(index, { value: e.target.value })} placeholder="Valor..." className="h-9 min-w-0 rounded-md border border-slate-300 px-2 text-xs outline-none focus:border-blue-500"/>
      <button type="button" onClick={() => remove(index)} aria-label="Remover filtro" className="h-9 w-9 rounded-md text-slate-500 hover:bg-red-50 hover:text-red-600"><Trash2 size={15} className="mx-auto"/></button>
    </div>)}
  </div>;
}
