'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { cmsConfig, WorkspaceConfig } from '@/cms.config';

interface HeaderProps {
  currentWorkspace?: WorkspaceConfig;
  onWorkspaceChange?: (workspace: WorkspaceConfig) => void;
}

export function Header({ currentWorkspace, onWorkspaceChange }: HeaderProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const selectedWorkspace = currentWorkspace || cmsConfig.workspaces[0];

  const handleWorkspaceSelect = (ws: WorkspaceConfig) => {
    setIsOpen(false);
    if (onWorkspaceChange) {
      onWorkspaceChange(ws);
    }
    router.push(`/${ws.id}`, { scroll: false });
  };

  return (
    <header className="border-b border-zinc-200 dark:border-zinc-800/80 bg-white/80 dark:bg-[#09090b]/80 backdrop-blur-xl sticky top-0 z-50 w-full transition-colors">
      <div className="w-full px-4 sm:px-8 h-14 flex items-center justify-between">
        {/* Logo & Workspace Switcher */}
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2.5">
            <div className="w-6 h-6 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 flex items-center justify-center font-bold text-xs shadow-xs">
              S
            </div>
            <span className="font-semibold text-sm tracking-tight text-zinc-900 dark:text-zinc-100">
              My<span className="text-emerald-600 dark:text-emerald-400 font-bold">CMS</span>
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-400 font-mono font-medium">
              Studio
            </span>
          </div>

          <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-800 hidden sm:block" />

          {/* Workspace Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="flex items-center space-x-2.5 px-3 py-1.5 rounded-lg border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition text-xs font-medium text-zinc-800 dark:text-zinc-200 group"
            >
              <span className="text-sm">{selectedWorkspace.icon || '🏢'}</span>
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                {selectedWorkspace.title}
              </span>
              <span className="text-[10px] text-zinc-400 font-mono bg-zinc-200/60 dark:bg-zinc-800 px-1.5 py-0.2 rounded">
                {selectedWorkspace.id}
              </span>
              <svg
                className={`w-3.5 h-3.5 ml-1 text-zinc-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {isOpen && (
              <div className="absolute left-0 mt-1.5 w-72 rounded-xl bg-white dark:bg-[#121215] shadow-2xl ring-1 ring-black/10 dark:ring-white/10 border border-zinc-200 dark:border-zinc-800 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3 py-1.5 border-b border-zinc-100 dark:border-zinc-800/80 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                  Workspaces
                </div>
                <div className="p-1 space-y-0.5">
                  {cmsConfig.workspaces.map((ws) => {
                    const isSelected = selectedWorkspace.id === ws.id;
                    return (
                      <button
                        key={ws.id}
                        onClick={() => handleWorkspaceSelect(ws)}
                        className={`w-full text-left px-3 py-2 rounded-lg flex items-center justify-between transition text-xs ${
                          isSelected
                            ? 'bg-zinc-100 dark:bg-zinc-800/80 text-zinc-900 dark:text-white font-medium'
                            : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/40 text-zinc-600 dark:text-zinc-400'
                        }`}
                      >
                        <div className="flex items-center space-x-2.5">
                          <span className="text-base">{ws.icon || '🏢'}</span>
                          <div>
                            <div className="font-medium text-zinc-900 dark:text-zinc-200">{ws.title}</div>
                            <div className="text-[10px] text-zinc-400 font-mono">{ws.id}</div>
                          </div>
                        </div>
                        {isSelected && (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right side status */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[11px] font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Connected</span>
          </div>
        </div>
      </div>
    </header>
  );
}
