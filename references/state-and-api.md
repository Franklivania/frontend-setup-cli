# State Management and API Architecture

Defaults are configurable; choose tools after examining the framework, installed dependencies, and data flow.

## State boundaries

- **Local UI state:** framework-native local state for one component or a tightly coupled component subtree.
- **Shared client state:** Zustand is the preferred default when several distant parts of the app need shared client-side state. Do not create a store for state that can remain local or be derived.
- **Server state:** TanStack Query is the preferred default when cache lifecycle, refetching, synchronization, optimistic updates, or background updates materially help.
- **Framework-native data:** prefer native route loaders, server components, actions, caching, and revalidation when they are the more appropriate choice.
- Do not mirror the same server data into Zustand and TanStack Query without a specific reason. Avoid duplicate sources of truth.
- Forms can use native capabilities or an existing/selected form library; do not install one solely by habit.

## API service layer

When a project communicates with a backend, prefer a small centralized API layer with responsibilities such as:

- Base URL and shared request configuration.
- Headers, credentials, authentication integration if required, and request cancellation.
- JSON request/response handling and consistent error normalization.
- Multipart/form-data uploads that do not incorrectly force JSON content type or manually set the multipart boundary.
- Typed endpoint declarations and request/response contracts where useful.
- Domain-specific backend service functions built on top of the generic client.

Do not create fake endpoints or assume an authentication strategy that the product has not specified. Never hard-code secrets into client code.

## Suggested service structure

Use this only when the project actually needs API infrastructure:

```text
src/services/
  api/
    api-init.ts          # environment/base URL and client initialization
    api-setup.ts         # request defaults/interceptors/middleware where appropriate
    endpoints.ts         # small central endpoint registry; split by domain as it grows
    backend.service.ts   # shared backend-facing functions, only if this is a real responsibility
```

- The exact split can change based on the installed HTTP client and framework.
- Keep endpoint declarations in one place initially; split by domain when size/ownership justifies it.
- `lib/` contains shared infrastructure and generic helpers; `services/` owns backend/client/domain service behavior. Avoid duplicating responsibilities between them.
- In vanilla JS, use ES modules and plain functions rather than generating TypeScript-only patterns.
- In Expo, use native-compatible networking code. In Next.js, separate server-only and browser-safe modules. In Astro, distinguish build/server-time fetching from browser-side requests.

## Types and validation

- Define shared request/response types where they improve correctness.
- Keep local types near their owning module; expose shared types through `src/types/index.ts` when useful.
- If runtime validation of external data matters, use an existing schema/validation library or propose one; TypeScript types alone do not validate runtime payloads.
- Avoid broad `any` types that hide contract uncertainty. Type external data at boundaries and handle errors explicitly.

## Configuration

- Prefer environment variables and framework-standard public/private variable conventions.
- Distinguish server-only secrets from client-visible configuration. Never expose secrets through public-prefixed environment variables or bundled client code.
- Document required environment variables with safe example values; never copy real secrets into generated files.
