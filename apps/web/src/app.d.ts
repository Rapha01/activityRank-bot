// See https://svelte.dev/docs/kit/types#app.d.ts

import type { Session } from '$lib/server/auth/session';
import type { User } from '$lib/server/auth/user';

// for information about these interfaces
declare global {
  namespace App {
    // interface Error {}
    interface Locals {
      auth: () => { session: Session; user: User };
      session: Session | null;
      user: User | null;
    }
    // interface PageData {}
    // interface PageState {}
    // interface Platform {}
  }
}

// export {};
