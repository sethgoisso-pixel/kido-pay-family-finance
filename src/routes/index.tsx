import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { AnimatePresence, animate, motion, useReducedMotion } from 'framer-motion';
import { ArrowDownLeft, ArrowRight, ArrowUpRight, Bell, Bus, Check, ChevronDown, CircleHelp, CreditCard, Gamepad2, Heart, Home, LockKeyhole, MonitorSmartphone, Moon, MoreHorizontal, Plus, Radio, RefreshCw, ShieldCheck, ShoppingBag, Smartphone, Sparkles, Sun, Users, Utensils, Wallet, X, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Toaster, toast } from 'sonner';
import { cn } from '@/lib/utils';
import { ALLOWANCE_MAX, ALLOWANCE_MIN, INITIAL_BALANCE, INITIAL_PERMISSIONS, decideRequest, spendSnack, type CategoryId } from '@/lib/wallet';
import leo from '@/assets/leo.jpg';

export const Route = createFileRoute('/')({
  head: () => ({ meta: [
    { title: 'KIDO PAY — Votre confiance, son autonomie' },
    { name: 'description', content: 'Un espace financier partagé pour les parents et les ados : argent de poche, catégories et demandes synchronisées.' },
    { property: 'og:title', content: 'KIDO PAY — Votre confiance, son autonomie' },
    { property: 'og:description', content: 'Gérez l’argent de poche en famille avec un portefeuille ado synchronisé.' },
    { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary_large_image' },
  ] }), component: Index,
});
const categories = [
  { id: 'food', title: 'Restauration & Fast-Food', short: 'Restauration', icon: Utensils, note: 'Les petits plaisirs du quotidien' },
  { id: 'games', title: 'Jeux Vidéo & Steam', short: 'Jeux vidéo', icon: Gamepad2, note: 'Gaming, jeux et achats intégrés' },
  { id: 'shopping', title: 'Shopping en ligne', short: 'Shopping', icon: ShoppingBag, note: 'Mode, accessoires et e-commerce' },
  { id: 'transport', title: 'Transports', short: 'Transports', icon: Bus, note: 'Pour bouger en toute liberté' },
  { id: 'subscriptions', title: 'Abonnements & Services', short: 'Abonnements', icon: Smartphone, note: 'Musique, streaming et services' },
] as const;
type View = 'parent' | 'teen' | 'both';
type Request = { id: number; category: CategoryId };
type Activity = { id: number; title: string; note: string; amount: number; kind: 'snack' | 'allowance' | 'shopping' };
const money = (cents: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(cents / 100);
function Balance({ value }: { value: number }) {
  const [display, setDisplay] = useState(value);
  const reduced = useReducedMotion();
  useEffect(() => { const control = animate(display, value, { duration: reduced ? 0 : .65, onUpdate: setDisplay }); return () => control.stop(); }, [value, reduced]);
  return <span aria-label={`Solde ${money(value)}`}>{money(Math.round(display))}</span>;
}
function Index() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [view, setView] = useState<View>('both');
  const [mobileView, setMobileView] = useState<'parent' | 'teen'>('parent');
  const [permissions, setPermissions] = useState({ ...INITIAL_PERMISSIONS });
  const [allowance, setAllowance] = useState(35);
  const [frequency, setFrequency] = useState<'weekly' | 'monthly'>('weekly');
  const [balance, setBalance] = useState(INITIAL_BALANCE);
  const [requests, setRequests] = useState<Request[]>([]);
  const [selected, setSelected] = useState<CategoryId | null>(null);
  const [activity, setActivity] = useState<Activity[]>([
    { id: 1, title: 'Argent de poche', note: 'Aujourd’hui, 09:00', amount: 3500, kind: 'allowance' },
    { id: 2, title: 'Boulangerie Paul', note: 'Hier, 16:42', amount: -450, kind: 'snack' },
    { id: 3, title: 'Vinted', note: 'Hier, 12:15', amount: -1200, kind: 'shopping' },
  ]);
  const reduced = useReducedMotion();
  useEffect(() => { document.documentElement.classList.toggle('dark', theme === 'dark'); document.documentElement.dataset.theme = theme; }, [theme]);
  const changeView = (next: View) => { setView(next); if (next !== 'both') setMobileView(next); toast.success('Tout est synchronisé', { description: 'Les changements sont visibles en temps réel.' }); };
  const selectedCategory = categories.find(c => c.id === selected);
  const pending = selected !== null && requests.some(r => r.category === selected);
  const requestUnlock = () => {
    if (!selected || permissions[selected] || pending) return;
    setRequests(old => [...old, { id: Date.now(), category: selected }]); setSelected(null);
    toast.success('Demande envoyée aux parents');
  };
  const decide = (request: Request, approved: boolean) => {
    setPermissions(old => decideRequest(old, request.category, approved));
    setRequests(old => old.filter(r => r.id !== request.id));
    toast[approved ? 'success' : 'error'](approved ? 'Demande approuvée · catégorie débloquée' : 'Demande refusée · catégorie toujours bloquée');
  };
  const simulate = () => {
    if (!permissions.food) { setSelected('food'); return; }
    const result = spendSnack(balance, permissions);
    if (!result.success) { toast.error('Solde insuffisant pour cette dépense'); return; }
    setBalance(result.balance); setActivity(old => [{ id: Date.now(), title: 'Pause snack', note: 'À l’instant', amount: -850, kind: 'snack' }, ...old]);
    toast.success('Pause snack · −8,50 €');
  };
  const reset = () => { setPermissions({ ...INITIAL_PERMISSIONS }); setBalance(INITIAL_BALANCE); setAllowance(35); setFrequency('weekly'); setRequests([]); setActivity(old => old.filter(a => a.id <= 3)); toast.success('La démo est réinitialisée'); };
  return <div className="app-shell bg-background text-foreground">
    <Toaster theme={theme} position="bottom-center" richColors />
    <header className="topbar">
      <div className="brand-group"><div className="brand-icon"><Zap size={22} fill="currentColor" /></div><div><div className="brand-name">KIDO<span> PAY</span><span className="brand-dot" /></div><p className="brand-tagline">Finance parentale & autonomie ado</p></div></div>
      <div className="desktop-role-switch" aria-label="Vue du compte">
        <Button variant="ghost" className={cn('role-button', view === 'parent' && 'selected')} onClick={() => changeView('parent')}><Users />Vue Parent</Button>
        <Button variant="ghost" className={cn('role-button', view === 'teen' && 'selected')} onClick={() => changeView('teen')}><Wallet />Vue Ado</Button>
        <Button variant="ghost" className={cn('role-button', view === 'both' && 'selected')} onClick={() => changeView('both')}><Zap />Mode démo simultané</Button>
      </div>
      <div className="header-tools"><span className="demo-label"><span /> Démo interactive</span><Button variant="ghost" size="icon" className="theme-button" aria-label={theme === 'dark' ? 'Activer le thème clair' : 'Activer le thème sombre'} title="Changer de thème" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>{theme === 'dark' ? <Sun /> : <Moon />}</Button><div className="parent-avatar">JD</div></div>
    </header>
    <nav className="mobile-role-switch" aria-label="Vue mobile"><Button variant="ghost" className={cn(mobileView === 'parent' && 'selected')} onClick={() => changeView('parent')}><Users />Parent{requests.length > 0 && <span className="request-count">{requests.length}</span>}</Button><Button variant="ghost" className={cn(mobileView === 'teen' && 'selected')} onClick={() => changeView('teen')}><Wallet />Ado</Button></nav>
    <main className="main-content">
      <div className="page-heading"><div><div className="eyebrow"><span /> VOTRE ESPACE FAMILLE</div><h1>Votre confiance. <span>Son autonomie.</span></h1><p>Un peu d’argent de poche. Un grand pas vers l’indépendance.</p></div><div className="family-selector"><img src={leo} alt="Léo" width={36} height={36} /><div><strong>Léo Dubois</strong><span>Compte ado · 16 ans</span></div><ChevronDown size={16} /></div></div>
      <div className={cn('workspace', `view-${view}`, `mobile-${mobileView}`)}>
        <motion.section layout={!reduced} className="parent-panel" aria-label="Contrôles parentaux">
          <div className="column-heading"><div className="column-label"><span className="heading-icon"><ShieldCheck size={17} /></span><h2>Espace parent</h2></div><span className="live-status"><span /> Synchronisé</span></div>
          <div className="allowance-section">
            <div className="section-title"><div><span className="section-icon"><ArrowUpRight size={18} /></span><h3>Versements automatiques</h3></div><span className="small-tag">Argent de poche</span></div>
            <div className="allowance-value"><div><span className="field-label">Montant du versement</span><strong>{allowance}<span> €</span></strong></div><div className="frequency-switch"><Button variant="ghost" className={cn(frequency === 'weekly' && 'selected')} onClick={() => setFrequency('weekly')}>Hebdomadaire</Button><Button variant="ghost" className={cn(frequency === 'monthly' && 'selected')} onClick={() => setFrequency('monthly')}>Mensuel</Button></div></div>
            <Slider aria-label="Montant du versement" min={ALLOWANCE_MIN} max={ALLOWANCE_MAX} step={5} value={[allowance]} onValueChange={v => { if (v[0] !== undefined) setAllowance(v[0]); }} className="allowance-slider" />
            <div className="slider-labels"><span>10 €</span><span>150 €</span></div>
            <div className="next-payment"><span><span className="tiny-icon"><RefreshCw size={13} /></span>Prochain versement</span><strong>{frequency === 'weekly' ? 'Lundi prochain' : 'Le 1er du mois'}<span> · {allowance} €</span></strong></div>
          </div>
          <div className="restrictions-section">
            <div className="section-title"><div><span className="section-icon"><ShieldCheck size={18} /></span><h3>Restrictions & plafonds</h3></div><span title="Catégories autorisées" className="muted-icon"><CircleHelp size={16} /></span></div>
            <p className="section-subtitle">Les bonnes limites, pour les bonnes habitudes.</p>
            <div className="permission-list">{categories.map(category => <div className={cn('permission-row', !permissions[category.id] && 'restricted')} key={category.id}><div className="category-icon"><category.icon size={19} /></div><div className="permission-text"><label htmlFor={`permission-${category.id}`}>{category.title}</label><span>{!permissions[category.id] ? 'Catégorie bloquée' : category.note}</span></div><Switch id={`permission-${category.id}`} aria-label={category.title} checked={permissions[category.id]} onCheckedChange={checked => setPermissions(old => ({ ...old, [category.id]: checked }))} className="permission-switch" /></div>)}</div>
            <div className="security-note"><ShieldCheck size={14} /><span>Vos règles s’appliquent instantanément au compte de Léo.</span></div>
          </div>
          <div className="requests-section"><div className="section-title"><div><span className="section-icon"><Bell size={18} /></span><h3>Centre de demandes</h3><span className="count-tag">{requests.length}</span></div><span className="field-label">En temps réel</span></div>
            <AnimatePresence mode="popLayout">{requests.length === 0 ? <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="empty-requests"><div className="all-clear"><Check size={19} /></div><div><strong>Tout est en ordre</strong><p>Aucune demande en attente. Léo gère comme un pro.</p></div><span className="small-sparkle"><Sparkles size={19} /></span></motion.div> : requests.map(request => <motion.div layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: .97 }} key={request.id} className="request-item"><img src={leo} alt="" width={36} height={36} /><div><strong>Un petit coup de pouce ?</strong><p>Léo · {categories.find(c => c.id === request.category)?.short}</p></div><div className="request-actions"><Button size="sm" onClick={() => decide(request, true)}><Check />Approuver</Button><Button variant="outline" size="icon" title="Refuser" aria-label="Refuser la demande" onClick={() => decide(request, false)}><X /></Button></div></motion.div>)}</AnimatePresence>
          </div>
          <div className="parent-bottom"><Heart size={15} /><span>L’autonomie s’apprend. La confiance se construit.</span></div>
        </motion.section>
        <motion.section layout={!reduced} className="teen-panel" aria-label="Portefeuille ado">
          <div className="column-heading"><div className="column-label"><span className="heading-icon"><Smartphone size={17} /></span><h2>Dans la poche de Léo</h2></div><span className="field-label preview-caption">Aperçu en direct</span></div>
          <div className="phone-surround"><div className="phone-frame"><div className="phone-status"><span>9:41</span><div className="dynamic-island" /><span className="phone-signals"><Radio size={13} /><span className="battery" /></span></div>
            <div className="phone-content"><div className="teen-header"><div><p>TON ESPACE, TES PROJETS</p><h3>Salut Léo <span className="wave">✌️</span></h3></div><div className="teen-avatar"><img src={leo} alt="Léo" width={43} height={43} /><span /></div></div>
              <div className="balance-card"><div className="balance-top"><span>Ton solde disponible</span><Wallet size={17} /></div><div className="balance-number"><Balance value={balance} /></div><div className="balance-bottom"><span><span /> À toi de jouer</span><span>KIDO<span className="pay-word"> PAY</span></span></div><div className="card-mark"><span /><span /><span /></div></div>
              <div className="teen-allowance"><div className="mini-icon"><ArrowDownLeft size={16} /></div><div><strong>Le prochain petit boost</strong><span>{frequency === 'weekly' ? 'Lundi prochain' : 'Le 1er du mois'}</span></div><strong>+{allowance} €</strong></div>
              <div className="wallet-section-heading"><h4>Où tu peux dépenser</h4><span>{Object.values(permissions).filter(Boolean).length}/5 actives</span></div>
              <div className="teen-categories">{categories.map(category => <motion.div layout={!reduced} key={category.id} animate={{ opacity: permissions[category.id] ? 1 : .75 }}><Button variant="ghost" aria-label={`${category.short} — ${permissions[category.id] ? 'autorisée' : 'bloquée'}`} onClick={() => setSelected(category.id)} className={cn('teen-category', !permissions[category.id] && 'locked')}><span className="teen-category-top"><category.icon size={20} />{permissions[category.id] ? <span className="active-dot" /> : <LockKeyhole size={13} />}</span><strong>{category.short}</strong><span className="category-state">{permissions[category.id] ? 'C’est permis' : 'Bloqué par les parents'}</span></Button></motion.div>)}</div>
              <div className="wallet-section-heading activity-heading"><h4>Les derniers mouvements</h4><span><MoreHorizontal size={18} /></span></div>
              <div className="activity-list"><AnimatePresence initial={false}>{activity.slice(0, 3).map(item => <motion.div key={item.id} initial={{ opacity: 0, height: 0, y: -8 }} animate={{ opacity: 1, height: 'auto', y: 0 }} className="activity-row"><div className={cn('activity-icon', item.amount > 0 && 'positive')}>{item.kind === 'allowance' ? <ArrowDownLeft size={16} /> : item.kind === 'snack' ? <Utensils size={16} /> : <ShoppingBag size={16} />}</div><div><strong>{item.title}</strong><span>{item.note}</span></div><strong className={cn(item.amount > 0 && 'text-mint')}>{item.amount > 0 ? '+' : '−'}{money(Math.abs(item.amount))}</strong></motion.div>)}</AnimatePresence></div>
              <Button variant="outline" className="simulate-button" onClick={simulate}><Zap size={15} />Simuler une dépense<span>−8,50 €</span></Button>
            </div><div className="phone-bottom"><Wallet size={19} className="text-primary" /><span>Mon portefeuille</span><span className="home-indicator" /></div>
          </div></div><div className="sync-caption"><span /><span>Connectés, même à distance.</span><RefreshCw size={12} /></div>
        </motion.section>
      </div>
      <footer className="page-footer"><span><ShieldCheck size={14} />Un espace sécurisé. Une famille connectée.</span><div><span className="hackathon-tag">HYPERBLOOM <span>’26</span></span><span className="footer-divider" /><Button variant="ghost" size="sm" onClick={reset} title="Réinitialiser la démo"><RefreshCw size={13} />Réinitialiser la démo</Button></div></footer>
    </main>
    <Dialog open={selected !== null} onOpenChange={open => { if (!open) setSelected(null); }}><DialogContent className="wallet-dialog"><div className={cn('modal-icon', selected && !permissions[selected] && 'blocked')}>{selected && !permissions[selected] ? <LockKeyhole size={25} /> : <ShieldCheck size={25} />}</div><DialogTitle>{selected && !permissions[selected] ? 'Une petite limite, pour le moment' : selectedCategory?.short}</DialogTitle><DialogDescription>{selected && !permissions[selected] ? 'Cette catégorie est temporairement restreinte par vos parents' : 'Cette catégorie est autorisée. Tu peux y utiliser ton solde disponible en toute confiance.'}</DialogDescription>{selected && !permissions[selected] ? <Button className="modal-action" disabled={pending} onClick={requestUnlock}>{pending ? 'Demande déjà envoyée' : 'Demander un déblocage exceptionnel'}<ArrowRight /></Button> : <Button className="modal-action" onClick={() => setSelected(null)}>C’est compris<Check /></Button>}</DialogContent></Dialog>
  </div>;
}
