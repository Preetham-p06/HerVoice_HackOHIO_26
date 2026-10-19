"use client";
import {
  createContext,
  useEffect,
  useRef,
  useContext,
  useState,
  type Dispatch,
  type SetStateAction,
  type ReactNode,
} from "react";
import { ClerkProvider } from "@clerk/nextjs";
const Session = createContext<{
  cover: number;
  unlocked: boolean;
  unlock: Dispatch<SetStateAction<boolean>>;
} | null>(null);
/** Root-layout memory survives client navigation, never reloads or new tabs. */
export function DiscreetSession({ children }: { children: ReactNode }) {
  const [unlocked, unlock] = useState(false);
  const [cover, setCover] = useState(0);
  const selected = useRef(false);
  useEffect(() => {
    if (selected.current) return;
    selected.current = true;
    let index = 0;
    try {
      const stored = Number(localStorage.getItem("everyday-edition") || "0");
      index = Number.isSafeInteger(stored) && stored >= 0 ? stored % 3 : 0;
      localStorage.setItem("everyday-edition", String((index + 1) % 3));
    } catch {
      index = Math.floor(Math.random() * 3);
    }
    setCover(index);
  }, []);
  useEffect(() => {
    const title = [
      "Everyday Notes — Ideas for everyday living",
      "Everyday Music — A little listening inspiration",
      "Everyday Books — Find your next good read",
    ][cover];
    const update = () => {
      if (document.title !== title) document.title = title;
    };
    update();
    const observer = new MutationObserver(update);
    observer.observe(document.head, {
      childList: true,
      subtree: true,
      characterData: true,
    });
    return () => observer.disconnect();
  }, [cover]);
  return (
    <Session.Provider value={{ unlocked, unlock, cover }}>
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
