import { Instagram, Github, Linkedin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="relative z-10 mt-auto w-full border-t border-[var(--control-border)] bg-black/10 px-4 py-3 backdrop-blur-sm sm:px-6">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4">
      <div className="flex-1">
        <a
          href="https://github.com/luantaraschi"
          target="_blank"
          rel="noopener noreferrer"
          className="font-black uppercase tracking-wider text-xs text-white/70 transition-colors hover:text-white"
        >
          luantaraschi
        </a>
      </div>

      <nav className="hidden flex-1 justify-center gap-6 font-condensed text-xs uppercase tracking-widest text-white/50 sm:flex">
        <a href="#" className="hover:text-white/80 transition-colors">
          PRIVACY
        </a>
        <span>·</span>
        <a href="#" className="hover:text-white/80 transition-colors">
          TERMS
        </a>
        <span>·</span>
        <a href="#" className="hover:text-white/80 transition-colors">
          CONTACT
        </a>
      </nav>

      <div className="flex flex-1 items-center justify-end gap-4 text-white/60">
        <a
          href="https://discord.com/users/luantaraschi"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-white transition-colors"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.043.032.054a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
          </svg>
        </a>
        <a
          href="https://instagram.com/luantaraschi"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-white transition-colors"
        >
          <Instagram size={18} />
        </a>
        <a
          href="https://github.com/luantaraschi"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-white transition-colors"
        >
          <Github size={18} />
        </a>
        <a
          href="https://linkedin.com/in/luantaraschi"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-white transition-colors"
        >
          <Linkedin size={18} />
        </a>
      </div>
      </div>
    </footer>
  );
}
