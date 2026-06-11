# Git Branch: feature/business-management

This branch implements the full-stack merchant subsystem including business registration, and an interactive real-time-capable business owner dashboard.

## Merged in Branch
`feature/business-management`

## Files Changed / Added

1. **`lib/business.ts` (Added)**
   - Implements offline-resilient local cache, database triggers, and operations for merchant accounts.
   - Bridges the gap between local prototype preview and the Supabase active schema.
   - Implements an interactive real-time order simulator to show food preparation workflows.

2. **`app/business/_layout.tsx` (Added)**
   - Formulates the standard, clean native navigation container for the merchant dashboard routing sequence.

3. **`app/business/register.tsx` (Added)**
   - High-fidelity register/update screens featuring curated imagery pickers, location tracking, city select segments, and delivery tariff fields.

4. **`app/business/dashboard.tsx` (Added)**
   - High-contrast visual cards showing real-time statistics (Earnings, Queue, feedback ratings).
   - Dynamic interactive customer queue supporting multi-phase preparing workflows (Accept, Prep, Ready, Dispatch).

5. **`app/business/manage-menu.tsx` (Added)**
   - Modular product/food design space. Admins can register dynamic menu plates, pricing, active categories, and recommend popular items with visual hot-tags.

6. **`app/tabs/profile.tsx` (Modified)**
   - Integrated "Merchant Portal" directly into the profile, routing logged-in owners safely to their storefront, with security shields routing unauthenticated guests to registration first.
