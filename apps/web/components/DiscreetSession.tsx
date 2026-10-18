"use client";
import {
  createContext,
  useContext,
  useState,
  type Dispatch,
  type SetStateAction,
  type ReactNode,
} from "react";
import { ClerkProvider } from "@clerk/nextjs";
const Session = createContext<{
  unlocked: boolean;
  unlock: Dispatch<SetStateAction<boolean>>;
} | null>(null);
/** Root-layout memory survives client navigation, never reloads or new tabs. */
export function DiscreetSession({ children }: { children: ReactNode }) {
  const [unlocked, unlock] = useState(false);
  return (
    <Session.Provider value={{ unlocked, unlock }}>
      {unlocked && process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? (
        <ClerkProvider>{children}</ClerkProvider>
      ) : (
        children
      )}
    </Session.Provider>
  );
}
export function useDiscreetSession() {
  const session = useContext(Session);
  if (!session) throw new Error("Discreet session provider is required");
  return session;
}
