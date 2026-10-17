# KIDO PAY


**Parental finance & teen independence, synchronized in real time.**
Built for the HyperBloom October 2026 hackathon (UI/UX & Web Design).

> 🔗 Demo: https://kido-pay-family-finance.deployxa.online  ·  🎬 Video: https://youtu.be/_NGRJRikTFI?si=sYegOH_2ew0Xq8Dp

## The problem

Giving a teenager cash offers no follow-up. Lending them a parent's card is risky and a source of conflict. Existing apps lock categories… with no explanation and no dialogue. The result: the teen feels a wall, and the parent is cast as a police officer.

_Starting point: My father sometimes refuses to give me money without telling me why. Other times I ask my mother for money without explaining what it is for. Both of us end up frustrated: I feel blocked, and my parents have no idea where the money goes. Kido Pay is not about controlling a teenager's life. It is about making family money clearer and fairer for both sides._

## The idea

**Every "no" becomes a conversation.**

1. The parent sets the pocket money and locks categories.
2. The teen sees **why** and **how to ask**: they pick a reason in one tap.
3. The parent answers in one tap: _Yes, once_ · _Up to €10_ · _Not now_ (with a reason).
4. The teen sees the answer, never a bare "denied".
5. A **savings goal** shows the real effect of a purchase: "This pushes your goal back by 2 days."

## Design choices

- **Dual-view demo** on desktop: parent and teen side by side to prove the synchronization. On mobile, no more fake phone: the experience fills the whole screen with a Parent / Teen selector.
- **Kind tone**: "A small limit, for now", not "Access denied".
- **Guided independence**: two profiles (Léo, 16, and Emma, 13) with independent rules, balances and histories.
- **Functional color code**: mint = balance and earnings, indigo = actions, red = restrictions.
- **Dark mode and light mode**; the system theme is respected on first load.

## Accessibility

- Lighthouse accessibility score: **100**.
- Text is at least 12 px; AA contrast in both themes (mint is darkened in light mode).
- Information is never carried by color alone: lock icon + "Blocked by parents" label.
- `prefers-reduced-motion` is respected (counter, 3D card, transitions).
- The animated balance is hidden from screen readers; only the final value is announced (`role="status"`).
- Toggle buttons use `aria-pressed`, reason chips are a `radiogroup`, dialogs trap focus.
- Touch targets are at least 44 px on mobile, and keyboard focus is visible.

## Known limits

Front-end demo only: state lives in memory, with no real accounts and no real payments.
The virtual card reacts to pointer and touch (not to the gyroscope).

## Run the project

```sh
npm install
npm run dev     # development
npm test        # unit tests for the money logic (vitest)
npm run build   # production
```

**Stack:** React 19, TanStack Start, Tailwind, shadcn/ui, Framer Motion. Built with Lovable, then reworked by hand with the help of Claude (AI tools are allowed by the hackathon rules). The video voice-over was generated with ElevenLabs.

**Useful structure:** `src/lib/wallet.ts` (pure logic in cents, tested) · `src/routes/index.tsx` (interface).
