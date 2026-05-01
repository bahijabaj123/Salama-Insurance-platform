# Merge Inventory: `gestion experts` -> main apps

## Keep (canonical runtime)

- `frontend/src/app/expert/**`
- `frontend/src/app/core/services/garage.service.ts`
- `frontend/src/app/core/models/garage.model.ts`
- `frontend/src/app/features/assureur/garages/**`
- `frontend/src/app/features/client/client-sos/**`
- `backend/src/main/java/**`

## Replace/Merge (prefer `gestion experts` logic)

- `gestion experts/Front/src/app/components/expert-form/*` -> `frontend/src/app/expert/pages/create-expert/*`
- `gestion experts/Front/src/app/components/expert-list/*` -> `frontend/src/app/expert/pages/dashboard/*`
- `gestion experts/Front/src/app/components/rapport-expertise-form/*` -> `frontend/src/app/expert/pages/rapport-expertise-form/*`
- `gestion experts/Front/src/app/components/rapport-expertise-chat/*` -> `frontend/src/app/expert/pages/rapport-expertise-chat/*`
- `gestion experts/Front/src/app/components/rapport-statistiques-dashboard/*` -> `frontend/src/app/expert/pages/rapport-statistiques-dashboard/*`
- `gestion experts/Front/src/app/components/accident-location-picker/*` -> `frontend/src/app/expert/components/accident-location-picker/*`
- `gestion experts/Front/src/app/services/expert.service.ts` -> `frontend/src/app/expert/services/expert.service.ts`
- `gestion experts/Front/src/app/services/rapport-expertise-chat.service.ts` -> `frontend/src/app/expert/services/rapport-expertise-chat.service.ts`
- `gestion experts/Front/src/app/services/garage.service.ts` -> `frontend/src/app/core/services/garage.service.ts`
- `gestion experts/Front/src/app/models/garage.model.ts` -> `frontend/src/app/core/models/garage.model.ts`
- `gestion experts/Front/src/app/data/full-expertise-report.template.ts` -> `frontend/src/app/expert/data/full-expertise-report.template.ts`
- `gestion experts/Front/src/app/models/expert.model.ts` -> `frontend/src/app/expert/models/expert.model.ts`
- `gestion experts/Front/src/app/models/expertise-report.model.ts` -> `frontend/src/app/expert/models/expertise-report.model.ts`

## Delete after validation

- `frontend/src/app/salama-assurance-copy/**` (duplicate archive copy)
- `gestion experts/**` (legacy standalone app)

## Risks controlled during merge

- Hardcoded backend URLs replaced by environment-based API URL in active services/components.
- Backend route compatibility checked for expert, reports, garages, tow trucks, and SOS endpoints.
- Duplicate runtime sources removed only after successful validation (lint/test/build).
