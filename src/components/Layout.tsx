import React from 'react';
import { Outlet } from 'react-router-dom';

export default function Layout() {
  return (
    <div className="h-screen flex flex-col bg-zinc-950 text-zinc-50 font-sans overflow-hidden relative">
      <main className="flex-1 overflow-hidden flex flex-col relative z-10">
        <Outlet />
      </main>
    </div>
  );
}
