import React, { useEffect, useState } from 'react';
import { supabase, supabaseAdmin } from '../lib/supabase';

// ── Tipos ────────────────────────────────────────────────────────────────────
interface LiveTraining {
    id: string;
    title: string;
    type: string;
    presenter: string;
    description: string | null;
    scheduledAt: number;
    liveUrl: string | null;
    artUrl: string | null;
    presenterVideoUrl: string | null;
    status: string | null;
    recordingUrl: string | null;
    position: number | null;
}

interface FormState {
    title: string;
    type: string;
    presenter: string;
    scheduledAt: string; // datetime-local
    description: string;
    liveUrl: string;
    recordingUrl: string;
    status: string;
    artUrl: string;
    presenterVideoUrl: string;
}

const EMPTY: FormState = {
    title: '', type: 'Treinamento', presenter: '', scheduledAt: '',
    description: '', liveUrl: '', recordingUrl: '', status: 'upcoming', artUrl: '', presenterVideoUrl: '',
};

const pad = (n: number) => String(n).padStart(2, '0');
const tsToInput = (ts: number) => {
    const d = new Date(ts);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
const inputToTs = (s: string) => new Date(s).getTime();

const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const fmt = (ts: number) => {
    const d = new Date(ts);
    return `${d.getDate()} ${MESES[d.getMonth()]} ${d.getFullYear()} · ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const inputClass = "w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-primary/50 focus:outline-none transition-colors placeholder:text-white/20";
const labelClass = "font-label text-[9px] tracking-[2px] uppercase text-white/40 mb-1.5 block";

const TreinamentosAdmin: React.FC = () => {
    const [list, setList] = useState<LiveTraining[]>([]);
    const [form, setForm] = useState<FormState>(EMPTY);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadingVideo, setUploadingVideo] = useState(false);
    const [msg, setMsg] = useState<string | null>(null);

    const load = async () => {
        const { data } = await supabase.from('live_trainings').select('*').order('scheduledAt', { ascending: true });
        if (data) setList(data.map((e: Record<string, unknown>) => ({ ...e, scheduledAt: Number(e.scheduledAt) })) as LiveTraining[]);
        setLoading(false);
    };

    useEffect(() => { load(); }, []);

    const set = (k: keyof FormState, v: string) => setForm(f => ({ ...f, [k]: v }));

    const resetForm = () => { setForm(EMPTY); setEditingId(null); };

    const startEdit = (e: LiveTraining) => {
        setEditingId(e.id);
        setForm({
            title: e.title || '',
            type: e.type || 'Treinamento',
            presenter: e.presenter || '',
            scheduledAt: e.scheduledAt ? tsToInput(e.scheduledAt) : '',
            description: e.description || '',
            liveUrl: e.liveUrl || '',
            recordingUrl: e.recordingUrl || '',
            status: e.status || 'upcoming',
            artUrl: e.artUrl || '',
            presenterVideoUrl: e.presenterVideoUrl || '',
        });
        window.scrollTo({ top: window.scrollY, behavior: 'smooth' });
    };

    const handleUpload = async (file: File) => {
        setUploading(true);
        setMsg(null);
        try {
            const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
            const path = `treinamentos/${Date.now()}-${safe}`;
            const { error } = await supabaseAdmin.storage.from('materiais-apoio').upload(path, file, { upsert: true, cacheControl: '3600' });
            if (error) throw error;
            const { data } = supabaseAdmin.storage.from('materiais-apoio').getPublicUrl(path);
            set('artUrl', data.publicUrl);
        } catch (err) {
            setMsg('Erro ao subir a imagem: ' + (err instanceof Error ? err.message : 'desconhecido'));
        } finally {
            setUploading(false);
        }
    };

    const handleVideoUpload = async (file: File) => {
        if (file.size > 80 * 1024 * 1024) { setMsg('Vídeo muito grande (máx. 80MB). Use um clipe mais curto.'); return; }
        setUploadingVideo(true);
        setMsg(null);
        try {
            const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
            const path = `recados/${Date.now()}-${safe}`;
            const { error } = await supabaseAdmin.storage.from('materiais-apoio').upload(path, file, { upsert: true, cacheControl: '3600' });
            if (error) throw error;
            const { data } = supabaseAdmin.storage.from('materiais-apoio').getPublicUrl(path);
            set('presenterVideoUrl', data.publicUrl);
        } catch (err) {
            setMsg('Erro ao subir o vídeo: ' + (err instanceof Error ? err.message : 'desconhecido'));
        } finally {
            setUploadingVideo(false);
        }
    };

    const save = async () => {
        if (!form.title.trim() || !form.presenter.trim() || !form.scheduledAt) {
            setMsg('Preencha título, palestrante e data/hora.');
            return;
        }
        setSaving(true);
        setMsg(null);
        const payload = {
            title: form.title.trim(),
            type: form.type,
            presenter: form.presenter.trim(),
            description: form.description.trim(),
            scheduledAt: inputToTs(form.scheduledAt),
            liveUrl: form.liveUrl.trim(),
            recordingUrl: form.recordingUrl.trim(),
            status: form.status,
            artUrl: form.artUrl.trim(),
            presenterVideoUrl: form.presenterVideoUrl.trim(),
        };
        try {
            if (editingId) {
                const { error } = await supabaseAdmin.from('live_trainings').update(payload).eq('id', editingId);
                if (error) throw error;
                setMsg('Evento atualizado!');
            } else {
                const { error } = await supabaseAdmin.from('live_trainings').insert([{ ...payload, position: list.length }]);
                if (error) throw error;
                setMsg('Evento criado!');
            }
            resetForm();
            await load();
        } catch (err) {
            setMsg('Erro ao salvar: ' + (err instanceof Error ? err.message : 'desconhecido'));
        } finally {
            setSaving(false);
        }
    };

    const remove = async (e: LiveTraining) => {
        if (!confirm(`Excluir o evento "${e.title}"?`)) return;
        const { error } = await supabaseAdmin.from('live_trainings').delete().eq('id', e.id);
        if (error) { setMsg('Erro ao excluir: ' + error.message); return; }
        if (editingId === e.id) resetForm();
        await load();
    };

    return (
        <section className="space-y-6 border-t border-white/10 pt-10">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[22px]">live_tv</span>
                    <h2 className="font-headline text-xl font-bold uppercase tracking-tight">Treinamentos ao Vivo</h2>
                </div>
                <span className="font-label text-[9px] tracking-[2px] uppercase text-white/30">{list.length} evento(s)</span>
            </div>

            <div className="grid lg:grid-cols-[1fr_1fr] gap-6">
                {/* Formulário */}
                <div className="liquid-glass-soft rounded-3xl border-white/5 p-6 space-y-4 h-fit">
                    <div className="flex items-center justify-between">
                        <h3 className="font-headline text-base font-bold text-white">{editingId ? 'Editar evento' : 'Novo evento'}</h3>
                        {editingId && (
                            <button onClick={resetForm} className="font-label text-[9px] tracking-widest uppercase text-white/40 hover:text-primary transition-colors flex items-center gap-1">
                                <span className="material-symbols-outlined text-[14px]">add</span> Novo
                            </button>
                        )}
                    </div>

                    <div>
                        <label className={labelClass}>Título *</label>
                        <input className={inputClass} value={form.title} onChange={e => set('title', e.target.value)} placeholder="Ex: Treinamento de Vendas" />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className={labelClass}>Tipo</label>
                            <select className={inputClass} value={form.type} onChange={e => set('type', e.target.value)}>
                                <option value="Treinamento">Treinamento</option>
                                <option value="Evento">Evento</option>
                            </select>
                        </div>
                        <div>
                            <label className={labelClass}>Status</label>
                            <select className={inputClass} value={form.status} onChange={e => set('status', e.target.value)}>
                                <option value="upcoming">Em breve</option>
                                <option value="live">Ao vivo agora</option>
                                <option value="ended">Encerrado</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className={labelClass}>Palestrante *</label>
                        <input className={inputClass} value={form.presenter} onChange={e => set('presenter', e.target.value)} placeholder="Ex: Tiago Passarine" />
                    </div>

                    <div>
                        <label className={labelClass}>Data e hora *</label>
                        <input type="datetime-local" className={inputClass} value={form.scheduledAt} onChange={e => set('scheduledAt', e.target.value)} />
                    </div>

                    <div>
                        <label className={labelClass}>Descrição</label>
                        <textarea className={inputClass + ' resize-none'} rows={3} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Sobre o que é o evento..." />
                    </div>

                    <div>
                        <label className={labelClass}>Link da live (opcional)</label>
                        <input className={inputClass} value={form.liveUrl} onChange={e => set('liveUrl', e.target.value)} placeholder="https://..." />
                    </div>

                    <div>
                        <label className={labelClass}>Link da gravação (opcional)</label>
                        <input className={inputClass} value={form.recordingUrl} onChange={e => set('recordingUrl', e.target.value)} placeholder="https://..." />
                    </div>

                    {/* Arte */}
                    <div>
                        <label className={labelClass}>Arte do evento (imagem)</label>
                        <div className="flex items-center gap-3">
                            <div className="relative w-24 h-16 rounded-xl overflow-hidden bg-black/40 border border-white/10 shrink-0 flex items-center justify-center">
                                {form.artUrl ? (
                                    <img src={form.artUrl} alt="arte" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="material-symbols-outlined text-white/15 text-2xl">image</span>
                                )}
                            </div>
                            <label className="flex-1 cursor-pointer bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-primary/30 text-white/70 font-label text-[10px] font-bold tracking-[1px] uppercase py-3 px-4 rounded-xl transition-all duration-300 flex items-center justify-center gap-2">
                                <span className="material-symbols-outlined text-[16px] text-primary">{uploading ? 'progress_activity' : 'upload'}</span>
                                {uploading ? 'Subindo...' : (form.artUrl ? 'Trocar imagem' : 'Subir imagem')}
                                <input type="file" accept="image/*" className="hidden" disabled={uploading}
                                    onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(f); e.target.value = ''; }} />
                            </label>
                            {form.artUrl && (
                                <button onClick={() => set('artUrl', '')} className="text-white/30 hover:text-red-400 transition-colors" title="Remover">
                                    <span className="material-symbols-outlined text-[18px]">delete</span>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Recado do palestrante (vídeo) */}
                    <div>
                        <label className={labelClass}>Recado do palestrante (vídeo, opcional)</label>
                        <div className="flex items-center gap-3">
                            <div className="relative w-24 h-16 rounded-xl overflow-hidden bg-black/40 border border-white/10 shrink-0 flex items-center justify-center">
                                {form.presenterVideoUrl ? (
                                    <video src={form.presenterVideoUrl} className="w-full h-full object-cover" muted playsInline />
                                ) : (
                                    <span className="material-symbols-outlined text-white/15 text-2xl">smart_display</span>
                                )}
                            </div>
                            <label className="flex-1 cursor-pointer bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-primary/30 text-white/70 font-label text-[10px] font-bold tracking-[1px] uppercase py-3 px-4 rounded-xl transition-all duration-300 flex items-center justify-center gap-2">
                                <span className="material-symbols-outlined text-[16px] text-primary">{uploadingVideo ? 'progress_activity' : 'upload'}</span>
                                {uploadingVideo ? 'Subindo...' : (form.presenterVideoUrl ? 'Trocar vídeo' : 'Subir vídeo')}
                                <input type="file" accept="video/*" className="hidden" disabled={uploadingVideo}
                                    onChange={e => { const f = e.target.files?.[0]; if (f) handleVideoUpload(f); e.target.value = ''; }} />
                            </label>
                            {form.presenterVideoUrl && (
                                <button onClick={() => set('presenterVideoUrl', '')} className="text-white/30 hover:text-red-400 transition-colors" title="Remover">
                                    <span className="material-symbols-outlined text-[18px]">delete</span>
                                </button>
                            )}
                        </div>
                        <p className="text-white/25 text-[10px] mt-1.5">Clipe curto (15-40s). Recomendado até ~60MB para não pesar.</p>
                    </div>

                    {msg && <p className="text-[11px] text-primary/80 font-label tracking-wide">{msg}</p>}

                    <button
                        onClick={save}
                        disabled={saving || uploading || uploadingVideo}
                        className="w-full bg-primary text-black hover:bg-white font-label text-[10px] font-bold tracking-[2px] uppercase py-3.5 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,240,255,0.2)] disabled:opacity-50"
                    >
                        <span className="material-symbols-outlined text-[16px]">{saving ? 'progress_activity' : (editingId ? 'save' : 'add_circle')}</span>
                        {saving ? 'Salvando...' : (editingId ? 'Salvar alterações' : 'Criar evento')}
                    </button>
                </div>

                {/* Lista */}
                <div className="space-y-3">
                    {loading ? (
                        <div className="py-16 flex flex-col items-center gap-3">
                            <div className="w-10 h-10 rounded-full border-t-2 border-primary border-r-2 animate-spin" />
                            <p className="text-white/30 font-label text-[10px] uppercase tracking-widest">Carregando...</p>
                        </div>
                    ) : list.length === 0 ? (
                        <div className="liquid-glass-soft p-12 text-center border-white/5 rounded-3xl">
                            <span className="material-symbols-outlined text-white/10 text-5xl block mb-3">event_busy</span>
                            <p className="text-white/30 font-label text-[11px] tracking-widest uppercase">Nenhum evento ainda</p>
                            <p className="text-white/20 text-xs mt-2">Crie o primeiro no formulário ao lado.</p>
                        </div>
                    ) : (
                        list.map(e => (
                            <div key={e.id} className={`liquid-glass-soft rounded-2xl border p-4 flex items-center gap-4 transition-all duration-300 ${editingId === e.id ? 'border-primary/40' : 'border-white/5'}`}>
                                <div className="relative w-16 h-12 rounded-lg overflow-hidden bg-black/40 border border-white/10 shrink-0 flex items-center justify-center">
                                    {e.artUrl ? <img src={e.artUrl} alt="" className="w-full h-full object-cover" /> : <span className="material-symbols-outlined text-white/15 text-lg">live_tv</span>}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={`px-2 py-0.5 rounded-full font-label text-[8px] font-bold tracking-wider uppercase border ${e.type === 'Evento' ? 'bg-purple-500/15 text-purple-300 border-purple-400/30' : 'bg-primary/15 text-primary border-primary/30'}`}>{e.type}</span>
                                    </div>
                                    <h4 className="font-headline text-sm font-bold text-white leading-tight truncate">{e.title}</h4>
                                    <p className="text-white/35 text-xs mt-0.5 truncate">{e.presenter} · {fmt(e.scheduledAt)}</p>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                    <button onClick={() => startEdit(e)} className="w-8 h-8 rounded-lg border border-white/10 flex items-center justify-center bg-white/[0.03] hover:bg-primary/10 hover:border-primary/30 text-white/50 hover:text-primary transition-all" title="Editar">
                                        <span className="material-symbols-outlined text-[16px]">edit</span>
                                    </button>
                                    <button onClick={() => remove(e)} className="w-8 h-8 rounded-lg border border-white/10 flex items-center justify-center bg-white/[0.03] hover:bg-red-500/10 hover:border-red-500/30 text-white/50 hover:text-red-400 transition-all" title="Excluir">
                                        <span className="material-symbols-outlined text-[16px]">delete</span>
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </section>
    );
};

export default TreinamentosAdmin;

