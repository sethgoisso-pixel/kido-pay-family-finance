import {
  CHILDREN,
  ALLOWANCE_MAX,
  ALLOWANCE_MIN,
  DECLINE_REASONS,
  PURCHASES,
  REQUEST_REASONS,
  UNLOCK_CAP,
  createAllStates,
  createRequest,
  daysToGoal,
  decideRequest,
  dismissReply,
  goalProgress,
  hasRequest,
  isBlocked,
  purchase,
  sendMoney,
  setPermission,
  type CategoryId,
  type ChildId,
  type ChildState,
  type Decision,
  type Grant,
  type Reply,
  type UnlockRequest,
} from '@/lib/wallet';
import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { AnimatePresence, animate, motion, useMotionTemplate, useMotionValue, useReducedMotion, useSpring, useTransform } from 'framer-motion';
import { ArrowDownLeft, ArrowRight, ArrowUpRight, Bell, Bus, Check, ChevronDown, CircleHelp, Gamepad2, Heart, LockKeyhole, MoreHorizontal, RefreshCw, ShieldCheck, ShoppingBag, Smartphone, Sparkles, Sun, Moon, Target, Users, Utensils, Wallet, X, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Toaster, toast } from 'sonner';
import { cn } from '@/lib/utils';
import leo from '@/assets/leo.jpg';
import { BrandK, BrandMark } from '@/components/brand-mark';

export const Route = createFileRoute('/')({
  head: () => ({ meta: [
    { title: 'KIDO PAY — Your trust, their independence' },
    { name: 'description', content: 'A shared money space for parents and teens: pocket money, spending categories and requests, synced live.' },
    { property: 'og:title', content: 'KIDO PAY — Your trust, their independence' },
    { property: 'og:description', content: 'Manage pocket money as a family with a synced teen wallet.' },
    { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary_large_image' },
  ] }), component: Index,
});

const categories = [
  { id: 'food', title: 'Food & Fast-Food', short: 'Food', icon: Utensils, note: 'Everyday little treats' },
  { id: 'games', title: 'Video Games & Steam', short: 'Gaming', icon: Gamepad2, note: 'Games and in-app purchases' },
  { id: 'shopping', title: 'Online Shopping', short: 'Shopping', icon: ShoppingBag, note: 'Fashion, accessories and e-commerce' },
  { id: 'transport', title: 'Transport', short: 'Transport', icon: Bus, note: 'Getting around freely' },
  { id: 'subscriptions', title: 'Subscriptions & Services', short: 'Subscriptions', icon: Smartphone, note: 'Music, streaming and services' },
] as const;

type View = 'parent' | 'teen' | 'both';

const money = (cents: number) => new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR' }).format(cents / 100);
const plural = (n: number, word: string) => `${n} ${word}${n > 1 ? 's' : ''}`;
const categoryName = (id: CategoryId) => categories.find(c => c.id === id)?.short ?? '';

function grantText(grant: Grant | undefined) {
  if (!grant) return null;
  return grant.kind === 'once' ? 'Unlocked for 1 purchase' : `Unlocked · ${money(grant.remaining)} max`;
}

function replyText(reply: Reply) {
  const name = categoryName(reply.category);
  const d = reply.decision;
  if (d.kind === 'once') return `Your parents said yes, once, for “${name}”.`;
  if (d.kind === 'cap') return `Your parents said yes, up to ${money(d.amount)} for “${name}”.`;
  return `Not now for “${name}”: ${d.reason}.`;
}

function ChildAvatar({ id, name, size }: { id: ChildId; name: string; size: number }) {
  if (id === 'leo') return <img src={leo} alt="" width={size} height={size} />;
  return <span className="avatar-initial" style={{ width: size, height: size }} aria-hidden="true">{name[0]}</span>;
}

function Balance({ value }: { value: number }) {
  const [display, setDisplay] = useState(value);
  const reduced = useReducedMotion();
  useEffect(() => { const control = animate(display, value, { duration: reduced ? 0 : .65, onUpdate: setDisplay }); return () => control.stop(); }, [value, reduced]);
  return (
    <>
      <span aria-hidden="true">{money(Math.round(display))}</span>
      <span className="sr-only" role="status">{`Balance: ${money(value)}`}</span>
    </>
  );
}

function BalanceCard({ balance }: { balance: number }) {
  const reduced = useReducedMotion();
  const px = useMotionValue(.5);
  const py = useMotionValue(.5);
  const sx = useSpring(px, { stiffness: 220, damping: 26, mass: .6 });
  const sy = useSpring(py, { stiffness: 220, damping: 26, mass: .6 });
  const rotateX = useTransform(sy, v => 6 + (.5 - v) * 16);
  const rotateY = useTransform(sx, v => -6 + (v - .5) * 20);
  const angle = useTransform(sx, v => 180 + (v - .5) * 180);
  const gx = useTransform(sx, v => `${(v * 100).toFixed(1)}%`);
  const gy = useTransform(sy, v => `${(v * 100).toFixed(1)}%`);
  const foil = useMotionTemplate`conic-gradient(from ${angle}deg at ${gx} ${gy}, transparent 6%, var(--primary) 24%, var(--mint) 38%, transparent 54%, var(--primary) 72%, transparent 88%)`;
  const glare = useMotionTemplate`radial-gradient(150px circle at ${gx} ${gy}, var(--holo-shine), transparent 70%)`;

  // Réagit à la souris ET au doigt sur Android / iOS
  const handleMove = (clientX: number, clientY: number, currentTarget: HTMLElement) => {
    if (reduced) return;
    const r = currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (clientX - r.left) / r.width));
    const y = Math.max(0, Math.min(1, (clientY - r.top) / r.height));
    px.set(x);
    py.set(y);
  };

  const trackPointer = (e: ReactPointerEvent<HTMLDivElement>) => {
    handleMove(e.clientX, e.clientY, e.currentTarget);
  };

  const trackTouch = (e: React.TouchEvent<HTMLDivElement>) => {
    const touch = e.touches[0];
    if (touch) handleMove(touch.clientX, touch.clientY, e.currentTarget);
  };

  const rest = () => {
    px.set(.5);
    py.set(.5);
  };

  return (
    <div className="holo-scene">
      <motion.div
        className="balance-card holo-card"
        style={{ rotateX, rotateY, transformPerspective: 900 }}
        animate={reduced ? undefined : {
          y: [-2, 3, -2],
          rotateZ: [-0.5, 0.5, -0.5]
        }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        onPointerMove={trackPointer}
        onPointerLeave={rest}
        onTouchMove={trackTouch}
        onTouchEnd={rest}
      >
        <span className="holo-clip" aria-hidden="true">
          <motion.span className="holo-foil" style={{ background: foil }} />
          <span className="holo-weave" />
          <motion.span className="holo-glare" style={{ background: glare }} />
          <BrandK className="holo-k" />
        </span>
        <span className="holo-flash" key={balance} aria-hidden="true" />
        <div className="balance-top"><span>Your available balance</span><Wallet size={17} aria-hidden="true" /></div>
        <div className="balance-number"><Balance value={balance} /></div>
        <div className="balance-bottom"><span><span /> Card active</span><span>KIDO<span className="pay-word"> PAY</span></span></div>
      </motion.div>
    </div>
  );
}

/** Carte d'une demande côté parent : motif de l'ado + réponse en 3 options. */
function RequestCard({ request, childId, childName, onDecide }: {
  request: UnlockRequest;
  childId: ChildId;
  childName: string;
  onDecide: (childId: ChildId, requestId: number, decision: Decision) => void;
}) {
  const [declining, setDeclining] = useState(false);
  return (
    <motion.div layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: .97 }} className="request-item">
      <ChildAvatar id={childId} name={childName} size={36} />
      <div>
        <strong>{childName} asks for: {categoryName(request.category)}</strong>
        <p>Reason: {request.reason}</p>
      </div>
      {declining ? (
        <div className="request-declines" role="group" aria-label="How to reply?">
          <span className="field-label">What should we say?</span>
          <div className="request-actions">
            {DECLINE_REASONS.map(reason => (
              <Button key={reason} variant="outline" size="sm" onClick={() => onDecide(childId, request.id, { kind: 'later', reason })}>{reason}</Button>
            ))}
            <Button variant="ghost" size="sm" onClick={() => setDeclining(false)}>Back</Button>
          </div>
        </div>
      ) : (
        <div className="request-actions">
          <Button size="sm" onClick={() => onDecide(childId, request.id, { kind: 'once' })}><Check />Yes, once</Button>
          <Button variant="outline" size="sm" onClick={() => onDecide(childId, request.id, { kind: 'cap', amount: UNLOCK_CAP })}>Up to {money(UNLOCK_CAP)}</Button>
          <Button variant="ghost" size="sm" onClick={() => setDeclining(true)}>Not now</Button>
        </div>
      )}
    </motion.div>
  );
}

type GuideAction = 'rules' | 'ask' | 'requests' | 'simulate';
type GuideStep = { title: string; text: string; action?: { label: string; key: GuideAction } };

/** Étapes du guide, adaptées à l'enfant sélectionné et aux catégories réellement bloquées. */
function buildGuideSteps(name: string, blocked: string | null, spend: { name: string; cost: number } | null): GuideStep[] {
  return [
    {
      title: 'The parent sets a rule',
      text: blocked
        ? `In “Restrictions & limits”, each switch blocks or allows a category. For ${name}, “${blocked}” is blocked.`
        : `In “Restrictions & limits”, each switch blocks or allows a category. Nothing is blocked for ${name}: try blocking one.`,
      action: { label: 'See parent space', key: 'rules' },
    },
    {
      title: `${name} hits the limit`,
      text: blocked
        ? `On the teen side, ${name} taps “${blocked}”: a kind message, not a flat no. One tap for a reason, and the request is sent.`
        : `No category is blocked: this button blocks one for the demo, then opens the teen side.`,
      action: { label: blocked ? 'Try the teen side' : 'Block a category and try', key: 'ask' },
    },
    { title: 'The parent replies in one tap', text: 'In the “Request center”: Yes, once · Up to €10 · Not now (with a reason).', action: { label: 'See requests', key: 'requests' } },
    { title: `${name} sees the answer`, text: 'A banner explains the decision. With “Yes, once”, the category locks again after one purchase.' },
    spend
      ? { title: 'Every purchase counts', text: `The balance drops live and the app shows the impact on ${name}’s savings goal.`, action: { label: `Simulate ${spend.name} · −${money(spend.cost)}`, key: 'simulate' } }
      : { title: 'Every purchase counts', text: 'All categories are blocked: unlock one on the parent side to simulate a purchase.' },
  ];
}

function DemoGuide({ open, name, steps, onToggle, onAction }: { open: boolean; name: string; steps: GuideStep[]; onToggle: () => void; onAction: (key: GuideAction) => void }) {
  return (
    <section className="demo-guide" aria-labelledby="guide-title">
      <button type="button" className="demo-guide-head" aria-expanded={open} aria-controls="guide-body" onClick={onToggle}>
        <span className="guide-title-wrap"><Sparkles size={17} aria-hidden="true" /><strong id="guide-title">Demo guide</strong><span className="small-tag">≈ 1 min</span></span>
        <span className="guide-toggle">{open ? 'Hide' : 'See the 5 steps'}<ChevronDown size={16} aria-hidden="true" className={cn(open && 'rotated')} /></span>
      </button>
      <div id="guide-body" className="demo-guide-body" hidden={!open}>
        <p className="guide-intro">One family, two screens synced live: everything the parent does shows up instantly for the teen, and vice versa. Follow {name}’s story.</p>
        <ol className="guide-steps">
          {steps.map(step => {
            const action = step.action;
            return (
              <li key={step.title}>
                <div><strong>{step.title}</strong><p>{step.text}</p></div>
                {action && <Button variant="outline" size="sm" onClick={() => onAction(action.key)}>{action.label}<ArrowRight /></Button>}
              </li>
            );
          })}
        </ol>
        <p className="guide-note">Also try: Emma’s profile (13, stricter rules), instant transfers, light/dark theme (top right) and “Reset demo” (bottom of page) to replay. Mint = money, indigo = actions, red = restrictions.</p>
      </div>
    </section>
  );
}

function Index() {
  const [childId, setChildId] = useState<ChildId>('leo');
  const [states, setStates] = useState<Record<ChildId, ChildState>>(createAllStates);
  const child = states[childId];
  const currentChild = CHILDREN.find(c => c.id === childId) ?? CHILDREN[0]!;
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [view, setView] = useState<View>('both');
  const [mobileView, setMobileView] = useState<'parent' | 'teen'>('parent');
  const [selected, setSelected] = useState<CategoryId | null>(null);
  const [reason, setReason] = useState('');
  const [guideOpen, setGuideOpen] = useState(true);
  const reduced = useReducedMotion();

  const update = (id: ChildId, fn: (s: ChildState) => ChildState) =>
    setStates(old => ({ ...old, [id]: fn(old[id]) }));

  // Thème système au premier chargement, puis choix manuel
  useEffect(() => {
    if (window.matchMedia('(prefers-color-scheme: light)').matches) setTheme('light');
    // Sur téléphone, le guide démarre replié pour ne pas pousser la démo hors de l'écran
    if (window.matchMedia('(max-width: 767px)').matches) setGuideOpen(false);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.dataset['theme'] = theme;
  }, [theme]);

  const allRequests = CHILDREN.flatMap(c => states[c.id].requests.map(request => ({ request, childId: c.id, childName: c.name })));

  const switchChild = (id: ChildId) => {
    setChildId(id);
    setSelected(null);
    const next = CHILDREN.find(c => c.id === id);
    if (next) toast.success(`${next.name}’s account selected`);
  };

  const sendInstantMoney = (amountEuros: number) => {
    update(childId, s => sendMoney(s, amountEuros));
    toast.success(`+€${amountEuros} sent to ${currentChild.name}!`);
  };

  const changeView = (next: View) => {
    setView(next);
    if (next !== 'both') setMobileView(next);
    toast.success('Everything is in sync', { description: 'Changes appear in real time.' });
  };

  const openCategory = (id: CategoryId) => {
    setReason('');
    setSelected(id);
  };

  const sendRequest = () => {
    if (!selected || !reason) return;
    update(childId, s => createRequest(s, selected, reason));
    setSelected(null);
    toast.success('Request sent to your parents');
  };

  const decide = (id: ChildId, requestId: number, decision: Decision) => {
    const name = CHILDREN.find(c => c.id === id)?.name ?? '';
    update(id, s => decideRequest(s, requestId, decision));
    if (decision.kind === 'later') toast('Reply sent', { description: `${name} will see: “${decision.reason}”` });
    else toast.success(decision.kind === 'once' ? `Unlocked once for ${name}` : `Unlocked up to ${money(decision.amount)} for ${name}`);
  };

  const runPurchase = (category: CategoryId) => {
    const result = purchase(child, category);
    if (!result.ok) {
      if (result.reason === 'blocked') { openCategory(category); return; }
      toast.error(result.reason === 'insufficient' ? 'Not enough balance for this purchase' : 'This purchase exceeds the approved limit');
      return;
    }
    update(childId, () => result.state);
    setSelected(null);
    const { title, cost } = PURCHASES[category];
    const days = result.state.impact?.days ?? 0;
    toast.success(`${title} · −${money(cost)}`, { description: days > 0 ? `This delays your goal by ${plural(days, 'day')}.` : undefined });
  };

  const reset = () => {
    setStates(createAllStates());
    setChildId('leo');
    setSelected(null);
    toast.success('Demo has been reset');
  };

  const goTo = (target: 'parent' | 'teen') => {
    const mobile = window.matchMedia('(max-width: 767px)').matches;
    setMobileView(target);
    setView(mobile ? target : 'both');
  };

  const scrollToId = (id: string) => {
    window.setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' }), 150);
  };

  // Le guide suit l'état réel : première catégorie bloquée (sans demande en cours si possible) et première catégorie dépensable
  const blockedCategory = categories.find(c => isBlocked(child, c.id) && !hasRequest(child, c.id)) ?? categories.find(c => isBlocked(child, c.id));
  const spendCategory = categories.find(c => !isBlocked(child, c.id));
  const guideSteps = buildGuideSteps(
    currentChild.name,
    blockedCategory?.short ?? null,
    spendCategory ? { name: PURCHASES[spendCategory.id].title, cost: PURCHASES[spendCategory.id].cost } : null,
  );

  const guideAction = (key: GuideAction) => {
    if (key === 'rules') { goTo('parent'); scrollToId('regles'); }
    if (key === 'ask') {
      goTo('teen');
      if (blockedCategory) {
        openCategory(blockedCategory.id);
      } else {
        update(childId, s => setPermission(s, 'games', false));
        toast('Gaming blocked for the demo');
        openCategory('games');
      }
    }
    if (key === 'requests') { goTo('parent'); scrollToId('centre-demandes'); }
    if (key === 'simulate' && spendCategory) { goTo('teen'); runPurchase(spendCategory.id); }
  };

  const selectedCategory = categories.find(c => c.id === selected);
  const blocked = selected !== null && isBlocked(child, selected);
  const pending = selected !== null && hasRequest(child, selected);
  const goalDays = daysToGoal(child);
  const goalPct = Math.round(goalProgress(child) * 100);
  const activeCount = categories.filter(c => !isBlocked(child, c.id)).length;

  return (
    <div className="app-shell bg-background text-foreground">
      <Toaster theme={theme} position="bottom-center" richColors />
      <header className="topbar">
        <div className="brand-group">
          <BrandMark />
          <div>
            <div className="brand-name">KIDO<span> PAY</span><span className="brand-dot" /></div>
            <p className="brand-tagline">Parental trust & teen independence</p>
          </div>
        </div>
        <div className="desktop-role-switch" role="group" aria-label="Account view">
          <Button variant="ghost" aria-pressed={view === 'parent'} className={cn('role-button', view === 'parent' && 'selected')} onClick={() => changeView('parent')}><Users />Parent view</Button>
          <Button variant="ghost" aria-pressed={view === 'teen'} className={cn('role-button', view === 'teen' && 'selected')} onClick={() => changeView('teen')}><Wallet />Teen view</Button>
          <Button variant="ghost" aria-pressed={view === 'both'} className={cn('role-button', view === 'both' && 'selected')} onClick={() => changeView('both')}><Zap />Dual demo mode</Button>
        </div>
        <div className="header-tools">
          <span className="demo-label"><span /> Interactive demo</span>
          <Button variant="ghost" size="icon" className="theme-button" aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'} title="Change theme" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>{theme === 'dark' ? <Sun /> : <Moon />}</Button>
          <div className="parent-avatar" aria-hidden="true">JD</div>
        </div>
      </header>

      <nav className="mobile-role-switch" aria-label="Mobile view">
        <Button variant="ghost" aria-pressed={mobileView === 'parent'} className={cn(mobileView === 'parent' && 'selected')} onClick={() => changeView('parent')}><Users />Parent{allRequests.length > 0 && <span className="request-count" aria-label={`${allRequests.length} pending request(s)`}>{allRequests.length}</span>}</Button>
        <Button variant="ghost" aria-pressed={mobileView === 'teen'} className={cn(mobileView === 'teen' && 'selected')} onClick={() => changeView('teen')}><Wallet />Teen</Button>
      </nav>

      <main className="main-content">
        <div className="page-heading">
          <div>
            <div className="eyebrow"><span /> YOUR FAMILY SPACE</div>
            <h1>Your trust. <span>Their independence.</span></h1>
            <p>A little pocket money. A big step toward independence.</p>
          </div>
          <div className="family-selector">
            <ChildAvatar id={childId} name={currentChild.name} size={36} />
            <div><strong>{currentChild.name} Dubois</strong><span>Teen account · {currentChild.age} yrs</span></div>
          </div>
        </div>

        <DemoGuide open={guideOpen} name={currentChild.name} steps={guideSteps} onToggle={() => setGuideOpen(o => !o)} onAction={guideAction} />

        <div className={cn('workspace', `view-${view}`, `mobile-${mobileView}`)}>
          <motion.section layout={!reduced} className="parent-panel" aria-label="Parental controls">
            <div className="column-heading">
              <div className="column-label"><span className="heading-icon"><ShieldCheck size={17} /></span><h2>Parent space</h2></div>
              <span className="live-status"><span /> Synced</span>
            </div>

            <div className="allowance-section">
              <div className="child-selector-bar" role="group" aria-label="Choose a child">
                {CHILDREN.map(c => (
                  <button
                    key={c.id}
                    type="button"
                    aria-pressed={childId === c.id}
                    className={cn('child-tab', childId === c.id && 'active')}
                    onClick={() => switchChild(c.id)}
                  >
                    <span className="child-avatar-mini" aria-hidden="true">{c.name[0]}</span>
                    <span className="child-name">{c.name}</span>
                    <span className="child-age">{c.age} yrs</span>
                  </button>
                ))}
              </div>

              <div className="section-title">
                <div><span className="section-icon"><ArrowUpRight size={18} /></span><h3>Automatic allowance</h3></div>
                <span className="small-tag">Pocket money</span>
              </div>
              <div className="allowance-value">
                <div><span className="field-label">Allowance amount</span><strong>{child.allowance}<span> €</span></strong></div>
                <div className="frequency-switch" role="group" aria-label="Frequency">
                  <Button variant="ghost" aria-pressed={child.frequency === 'weekly'} className={cn(child.frequency === 'weekly' && 'selected')} onClick={() => update(childId, s => ({ ...s, frequency: 'weekly' }))}>Weekly</Button>
                  <Button variant="ghost" aria-pressed={child.frequency === 'monthly'} className={cn(child.frequency === 'monthly' && 'selected')} onClick={() => update(childId, s => ({ ...s, frequency: 'monthly' }))}>Monthly</Button>
                </div>
              </div>
              <Slider aria-label="Allowance amount" min={ALLOWANCE_MIN} max={ALLOWANCE_MAX} step={5} value={[child.allowance]} onValueChange={v => { const next = v[0]; if (next !== undefined) update(childId, s => ({ ...s, allowance: next })); }} className="allowance-slider" />
              <div className="slider-labels"><span>€10</span><span>€150</span></div>
              <div className="next-payment">
                <span><span className="tiny-icon"><RefreshCw size={13} /></span>Next payout</span>
                <strong>{child.frequency === 'weekly' ? 'Next Monday' : '1st of the month'}<span> · €{child.allowance}</span></strong>
              </div>

              <div className="instant-transfer-block">
                <div className="section-title">
                  <div><span className="section-icon"><Zap size={17} /></span><h3>Instant transfer</h3></div>
                  <span className="small-tag">Quick boost</span>
                </div>
                <p className="instant-subtitle">Send money instantly to {currentChild.name}’s card:</p>
                <div className="instant-buttons">
                  {[5, 10, 20, 50].map(amount => (
                    <Button key={amount} variant="outline" size="sm" onClick={() => sendInstantMoney(amount)} className="instant-btn">
                      +€{amount}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            <div className="restrictions-section" id="regles">
              <div className="section-title">
                <div><span className="section-icon"><ShieldCheck size={18} /></span><h3>Restrictions & limits</h3></div>
                <span title="Allowed categories" className="muted-icon"><CircleHelp size={16} aria-hidden="true" /></span>
              </div>
              <p className="section-subtitle">The right limits build the right habits.</p>
              <div className="permission-list">
                {categories.map(category => (
                  <div className={cn('permission-row', !child.permissions[category.id] && 'restricted')} key={category.id}>
                    <div className="category-icon"><category.icon size={19} /></div>
                    <div className="permission-text">
                      <label htmlFor={`permission-${category.id}`}>{category.title}</label>
                      <span>{!child.permissions[category.id] ? (grantText(child.grants[category.id]) ?? 'Category blocked') : category.note}</span>
                    </div>
                    <Switch
                      id={`permission-${category.id}`}
                      aria-label={category.title}
                      checked={child.permissions[category.id]}
                      onCheckedChange={checked => update(childId, s => setPermission(s, category.id, checked))}
                      className="permission-switch"
                    />
                  </div>
                ))}
              </div>
              <div className="security-note"><ShieldCheck size={14} /><span>Your rules apply instantly to {currentChild.name}’s account.</span></div>
            </div>

            <div className="requests-section" id="centre-demandes">
              <div className="section-title">
                <div><span className="section-icon"><Bell size={18} /></span><h3>Request center</h3><span className="count-tag">{allRequests.length}</span></div>
                <span className="field-label">Real time</span>
              </div>
              <div aria-live="polite">
                <AnimatePresence initial={false}>
                  {allRequests.map(({ request, childId: requestChildId, childName }) => (
                    <RequestCard key={request.id} request={request} childId={requestChildId} childName={childName} onDecide={decide} />
                  ))}
                </AnimatePresence>
                {allRequests.length === 0 && (
                  <div className="empty-requests">
                    <div className="all-clear"><Check size={19} /></div>
                    <div><strong>All clear</strong><p>No pending requests. {currentChild.name} is handling it like a pro.</p></div>
                    <span className="small-sparkle"><Sparkles size={19} /></span>
                  </div>
                )}
              </div>
            </div>
            <div className="parent-bottom"><Heart size={15} /><span>Independence is learned. Trust is built.</span></div>
          </motion.section>

          <motion.section layout={!reduced} className="teen-panel" aria-label="Teen wallet">
            <div className="column-heading">
              <div className="column-label"><span className="heading-icon"><Smartphone size={17} /></span><h2>In {currentChild.name}’s pocket</h2></div>
              <span className="field-label preview-caption">Live preview</span>
            </div>
            <div className="phone-surround">
              <div className="phone-frame">
                <div className="phone-status" aria-hidden="true"><span>9:41</span><div className="dynamic-island" /><span className="phone-signals"><span className="battery" /></span></div>
                <div className="phone-content">
                  <div className="teen-header">
                    <div><p>YOUR SPACE, YOUR PLANS</p><h3>Hey {currentChild.name} <span className="wave" aria-hidden="true">✌️</span></h3></div>
                    <div className="teen-avatar"><ChildAvatar id={childId} name={currentChild.name} size={43} /><span /></div>
                  </div>
                  <BalanceCard balance={child.balance} />
                  <div className="teen-allowance">
                    <div className="mini-icon"><ArrowDownLeft size={16} /></div>
                    <div><strong>Your next boost</strong><span>{child.frequency === 'weekly' ? 'Next Monday' : '1st of the month'}</span></div>
                    <strong>+€{child.allowance}</strong>
                  </div>

                  <div className="goal-card">
                    <div className="goal-top">
                      <span className="goal-label"><Target size={15} aria-hidden="true" /> Goal · {child.goal.name}</span>
                      <strong>{money(child.balance)} / {money(child.goal.target)}</strong>
                    </div>
                    <div className="goal-bar" role="progressbar" aria-label={`Progress toward ${child.goal.name}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={goalPct}><span style={{ width: `${goalPct}%` }} /></div>
                    <p className="goal-meta">{goalDays === 0 ? 'Goal reached, well done!' : `At this pace: about ${plural(goalDays, 'day')} to go.`}</p>
                    {child.impact && <p className="goal-impact" role="status">{child.impact.title}: this delays your goal by {plural(child.impact.days, 'day')}.</p>}
                  </div>

                  {child.reply && (
                    <div className={cn('reply-banner', child.reply.decision.kind === 'later' && 'later')} role="status">
                      <span>{replyText(child.reply)}</span>
                      <button type="button" aria-label="Close message" onClick={() => update(childId, dismissReply)}><X size={16} /></button>
                    </div>
                  )}

                  <div className="wallet-section-heading"><h4>Where you can spend</h4><span>{activeCount}/5 active</span></div>
                  <div className="teen-categories">
                    {categories.map(category => {
                      const isLocked = isBlocked(child, category.id);
                      const grant = child.grants[category.id];
                      const status = !isLocked
                        ? (grantText(grant) ?? 'Allowed')
                        : hasRequest(child, category.id) ? 'Request sent' : 'Blocked by parents';
                      return (
                        <motion.div layout={!reduced} key={category.id} animate={{ opacity: isLocked ? .85 : 1 }}>
                          <Button
                            variant="ghost"
                            aria-label={`${category.short} — ${status}`}
                            onClick={() => openCategory(category.id)}
                            className={cn('teen-category', isLocked && 'locked')}
                          >
                            <span className="teen-category-top"><category.icon size={20} />{isLocked ? <LockKeyhole size={13} /> : <span className="active-dot" />}</span>
                            <strong>{category.short}</strong>
                            <span className="category-state">{status}</span>
                          </Button>
                        </motion.div>
                      );
                    })}
                  </div>
                  <div className="wallet-section-heading activity-heading"><h4>Recent activity</h4><span><MoreHorizontal size={18} aria-hidden="true" /></span></div>
                  <div className="activity-list">
                    <AnimatePresence initial={false}>
                      {child.activity.slice(0, 3).map(item => {
                        const Icon = item.kind === 'allowance' ? ArrowDownLeft : (categories.find(c => c.id === item.kind)?.icon ?? ShoppingBag);
                        return (
                          <motion.div key={item.id} initial={{ opacity: 0, height: 0, y: -8 }} animate={{ opacity: 1, height: 'auto', y: 0 }} className="activity-row">
                            <div className={cn('activity-icon', item.amount > 0 && 'positive')}><Icon size={16} /></div>
                            <div><strong>{item.title}</strong><span>{item.note}</span></div>
                            <strong className={cn(item.amount > 0 && 'text-mint')}>{item.amount > 0 ? '+' : '−'}{money(Math.abs(item.amount))}</strong>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                  <Button variant="outline" className="simulate-button" onClick={() => runPurchase('food')}><Zap size={15} />Simulate a purchase<span>−{money(PURCHASES.food.cost)}</span></Button>
                </div>
                <div className="phone-bottom" aria-hidden="true"><Wallet size={19} className="text-primary" /><span>My wallet</span><span className="home-indicator" /></div>
              </div>
            </div>
            <div className="sync-caption"><span /><span>Connected, even from afar.</span><RefreshCw size={12} aria-hidden="true" /></div>
          </motion.section>
        </div>

        <footer className="page-footer">
          <span><ShieldCheck size={14} />A secure space. A connected family.</span>
          <div>
            <span className="hackathon-tag">HYPERBLOOM <span>’26</span></span>
            <span className="footer-divider" />
            <Button variant="ghost" size="sm" onClick={reset} title="Reset demo"><RefreshCw size={13} />Reset demo</Button>
          </div>
        </footer>
      </main>

      <Dialog open={selected !== null} onOpenChange={open => { if (!open) setSelected(null); }}>
        <DialogContent className="wallet-dialog">
          <div className={cn('modal-icon', blocked && 'blocked')}>
            {blocked ? <LockKeyhole size={25} /> : <ShieldCheck size={25} />}
          </div>
          <DialogTitle>{blocked ? 'A small limit, for now' : selectedCategory?.short}</DialogTitle>
          <DialogDescription>
            {blocked
              ? (pending ? 'Your request is on its way. Your parents will reply soon.' : 'This category is temporarily restricted by your parents. Tell them why you need it:')
              : selected ? `Allowed. Sample purchase: ${PURCHASES[selected].title} · ${money(PURCHASES[selected].cost)}.` : ''}
          </DialogDescription>
          {blocked && !pending && (
            <div className="reason-chips" role="radiogroup" aria-label="Reason for your request">
              {REQUEST_REASONS.map(r => (
                <button key={r} type="button" role="radio" aria-checked={reason === r} className={cn('reason-chip', reason === r && 'selected')} onClick={() => setReason(r)}>{r}</button>
              ))}
            </div>
          )}
          {blocked ? (
            <Button className="modal-action" disabled={pending || !reason} onClick={sendRequest}>
              {pending ? 'Request sent · pending' : reason ? 'Send my request' : 'Pick a reason'}<ArrowRight />
            </Button>
          ) : (
            <>
              <Button className="modal-action" onClick={() => selected && runPurchase(selected)}>
                Simulate this purchase<span className="modal-price">−{money(selected ? PURCHASES[selected].cost : 0)}</span>
              </Button>
              <Button variant="ghost" className="modal-action" onClick={() => setSelected(null)}>Close</Button>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
