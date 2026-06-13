"use client";

import Link from "next/link";

export function Footer() {
    return (
        <footer className="bg-white border-t border-slate-200/60 mt-auto py-8">
            <div className="container mx-auto px-6">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="text-center md:text-left">
                        <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">
                            © {new Date().getFullYear()} ITPB Room Booking System
                        </p>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row items-center gap-4 md:gap-6 text-sm text-slate-500">
                        <span className="font-medium">
                            Developed by <span className="font-bold text-slate-800">Dwiyansyah Oktavyudi</span>
                        </span>
                        <div className="flex items-center gap-4 border-t sm:border-t-0 sm:border-l border-slate-200 pt-3 sm:pt-0 sm:pl-6">
                            <a
                                href="https://github.com/dwiyansyahku"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-slate-400 hover:text-slate-950 transition-colors duration-200"
                                aria-label="GitHub Profile"
                            >
                                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                                    <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                                </svg>
                            </a>
                            <a
                                href="https://linkedin.com/in/dwiyansyah"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-slate-400 hover:text-[#0A66C2] transition-colors duration-200"
                                aria-label="LinkedIn Profile"
                            >
                                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764.784-1.764 1.75-1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                                </svg>
                            </a>
                            <a
                                href="https://open.spotify.com/user/31mu6h7cfcvm2ucjgxpgafzlhtqq"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-slate-400 hover:text-[#1ED760] transition-colors duration-200"
                                aria-label="Spotify Profile"
                            >
                                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                                    <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.586 14.424c-.18.295-.565.387-.86.207-2.377-1.454-5.37-1.783-8.892-.982-.336.076-.67-.135-.746-.47-.077-.337.135-.67.472-.747 3.854-.88 7.15-.5 9.818 1.135.295.18.387.563.208.857zm1.222-2.723c-.226.367-.707.487-1.074.26-2.72-1.672-6.87-2.157-10.082-1.182-.413.125-.85-.107-.975-.52-.125-.413.107-.85.52-.975 3.674-1.114 8.243-.574 11.35 1.34.367.227.487.708.261 1.077zm.105-2.834C14.383 8.74 8.575 8.55 5.222 9.567a1.002 1.002 0 01-1.222-.686 1 1 0 01.687-1.222c3.843-1.166 10.263-.95 14.33 1.465.45.267.6.845.333 1.295a.997.997 0 01-1.332.333z" />
                                </svg>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}

