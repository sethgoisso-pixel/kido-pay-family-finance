# Kido Pay Family Finance

Build a world-class financial management web app for parents and teens called "KIDO PAY" designed for the HyperBloom UI/UX Hackathon.

### 🎨 DESIGN SYSTEM & ACCESSIBILITY
- Theme Support: Deep dark mode (`#09090b`) with refined Shadcn borders (`border: 1px solid #27272a`) AND a clean, high-contrast Light mode toggle (`#ffffff` / `#f8fafc`) with a theme toggle button in the header.
- Accent Colors: Electric Indigo (`#6366F1`) and Mint Green (`#10B981`) strictly for financial data, balances, and active states. Crimson Red (`#EF4444`) for locks and alerts.
- Typography: "Plus Jakarta Sans" or "Inter", WCAG AA compliant. Semi-bold titles in sentence case.
- Micro-interactions: Smooth state syncing with Framer Motion animations, animated number counters for balances, zero page reloads.

---

### 🖥️ DESKTOP LAYOUT (Side-by-Side Dual View)
1. Header & Top Bar:
   - Logo "KIDO PAY" with neon indigo badge/icon.
   - Tagline: "Finance parentale & autonomie ado"
   - Quick role switcher `[ 👨‍👧 Vue Parent | 🧒 Vue Ado | ⚡ Mode Démo Simultané ]` + Light/Dark theme toggle.
2. Left Column (Parent Control Panel):
   - Section "Versements Automatiques": Interactive slider (€10 to €150) + frequency toggle ("Hebdomadaire" / "Mensuel").
   - Section "Restrictions Critiques & Plafonds": Switches for categories:
     * 🍔 Restauration & Fast-Food (ON)
     * 🎮 Jeux Vidéo & Steam (Toggleable, starts OFF)
     * 🛒 Shopping en ligne (ON)
     * 🚌 Transports (ON)
     * 📱 Abonnements & Services (ON)
   - Real-time Alert center: shows requests from teen with instant "Approuver / Refuser" buttons.
3. Right Column (Teen Live Interface):
   - On Desktop: Inside an ultra-sleek minimalist smartphone mockup frame.
   - Live Solde counter (e.g., €35.00) in Mint Green with smooth number ticker.
   - Category cards: When a parent disables a category, that card instantly animates into a grayed-out locked state with a lock icon 🔒 and red badge "Bloqué par les parents".
   - Clicking a blocked category opens a modal: "Cette catégorie est temporairement restreinte par vos parents" with a button "Demander un déblocage exceptionnel" (which notifies the parent panel).
   - "Simuler une dépense" test button (e.g. -8.50€ snack) to see the balance and recent activity animate in real time.

---

### 📱 MOBILE RESPONSIVE EXPERIENCE (Real Mobile Screen)
- When viewed on a real mobile screen / viewport:
  - DO NOT show a fake phone mockup frame inside the phone screen. Fill 100% of the mobile viewport natively with touch-friendly controls (min 44px hit targets).
  - Keep a sticky, sleek top navigation switcher `[ 👨‍👧 Parent | 🧒 Ado ]`.
  - Smooth slide/fade transitions between Parent controls and Teen wallet without any page reload.
  - Show a subtle sync toast when switching views to confirm changes are live.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/f2c04efd-237f-47c0-94c4-c217f587f931).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
