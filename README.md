# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type aware lint rules:

- Configure the top-level `parserOptions` property like this:

```js
export default {
  // other rules...
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: ['./tsconfig.json', './tsconfig.node.json'],
    tsconfigRootDir: __dirname,
  },
}
```

- Replace `plugin:@typescript-eslint/recommended` to `plugin:@typescript-eslint/recommended-type-checked` or `plugin:@typescript-eslint/strict-type-checked`
- Optionally add `plugin:@typescript-eslint/stylistic-type-checked`
- Install [eslint-plugin-react](https://github.com/jsx-eslint/eslint-plugin-react) and add `plugin:react/recommended` & `plugin:react/jsx-runtime` to the `extends` list




## **Keystone**

**Tagline:**

> _A persistent, open-source SSH workspace._

### Why “Keystone”

- In architecture, a **keystone** is the central stone that holds an arch together
- This app is the _structural anchor_ of your infrastructure access
- Neutral, professional, not gimmicky
- Works equally well for:
    - Homelab users
    - Developers
    - Ops / infra-adjacent work
- No SaaS, crypto, or startup connotations
    

It also lends itself cleanly to:
- `keystone.app`
- `keystone.dev`
- `keystone open ssh workspace`
    

Strong, calm, durable name.

---

# Keystone — Design Report

## 1. Purpose & Motivation

Modern developers routinely manage multiple remote machines across homelabs, cloud providers, and university or work environments. While tools like Termius provide a polished experience, critical features are increasingly gated behind paid tiers, cloud accounts, or opaque sync mechanisms.

**Keystone** exists to provide a:
- Free
- Open-source
- Local-first
- Privacy-respecting

alternative focused on **persistent SSH workflows**, not terminal emulation novelty or SaaS lock-in.
The primary goal is to **reduce friction between intent and access**:
> “I want to be on that machine — now.”

---

## 2. Design Philosophy
Keystone is built on the following principles:

### 2.1 Local-First by Default

- All data stored locally
- No accounts
- No telemetry
- No background cloud services
- Export/import is explicit and manual

### 2.2 Persistence Over Ceremony

- UI disconnect ≠ SSH disconnect
- Sessions survive window closes
- Reconnection is instant and predictable

### 2.3 Opinionated, Not Bloated

- Keystone solves one problem well: **managing SSH workspaces**
- No plugins, no dashboards, no feature sprawl in v1

### 2.4 Proven Building Blocks

- No custom terminal emulation
- No reinventing SSH
- Use mature, well-maintained libraries

### 2.5 Keyboard-First UX

- Designed for users who live in terminals
- Minimal mouse dependency
- Fast context switching

---

## 3. Scope Definition

### 3.1 In Scope (V1)

- SSH host registry
- SSH config import (`~/.ssh/config`)
- Persistent SSH sessions
- Tabbed and split terminal views
- Per-host command snippets
- Local notes per host
- Key-based authentication
- SSH agent forwarding
- Keepalive and reconnect logic

### 3.2 Explicitly Out of Scope (V1)

- Cloud sync
- Mobile clients
- Windows support
- Plugin system
- Custom shell or terminal emulator
- User accounts
- Collaboration
- AI features

This constraint is intentional to ensure the project **ships and remains maintainable**.

---

## 4. High-Level Architecture

Keystone uses a **strictly layered Electron architecture**.

```
┌────────────────────────────┐
│ Renderer (UI)              │
│ React + Vite + Tailwind    │
│ xterm.js                   │
└───────────▲────────────────┘
            │ IPC (typed, secure)
┌───────────┴────────────────┐
│ Preload                    │
│ contextBridge only          │
└───────────▲────────────────┘
            │
┌───────────┴────────────────┐
│ Main Process (Node)         │
│ SSH session manager         │
│ PTY handling                │
│ SQLite persistence          │
│ Encryption + secrets        │
└────────────────────────────┘
```

### Critical Boundary Rule

> **All SSH, filesystem, and process logic lives in the Electron main process.**

The renderer is treated as **untrusted**.

---

## 5. Core Subsystems

### 5.1 Session Manager

Responsible for:

- Establishing SSH connections
    
- Managing PTYs
    
- Tracking session lifecycle
    
- Handling reconnects and keepalive
    
- Supporting tmux-aware reconnects
    

Each session has a clear lifecycle:

- Created
    
- Connected
    
- Suspended
    
- Resumed
    
- Terminated
    

Sessions are **first-class objects**, not UI artifacts.

---

### 5.2 Terminal Layer

- `xterm.js` handles rendering
    
- `node-pty` provides real PTY behavior
    
- Input/output streamed via IPC
    
- Renderer does not understand SSH — only bytes
    

This separation prevents logic leaks and complexity creep.

---

### 5.3 Host Registry

Each host record includes:

- Name / alias
    
- Address
    
- Port
    
- Username
    
- Identity file
    
- Tags
    
- Default working directory
    
- Notes
    

Hosts can be:

- Manually defined
    
- Imported from `~/.ssh/config`
    

---

### 5.4 Persistence & Security

- SQLite for structured local storage
    
- Secrets encrypted at rest using AES-GCM
    
- Encryption key sourced from:
    
    - OS keychain (preferred)
        
    - User passphrase (fallback)
        

No plaintext secrets ever exposed to the renderer.

---

## 6. UX Model

### 6.1 Mental Model

- **Tabs = machines**
    
- **Splits = multiple sessions on one machine**
    

Opening Keystone should feel like opening a _workspace_, not a terminal.

### 6.2 Interaction Flow

1. Launch app
    
2. Host list is immediately visible
    
3. Select host → session opens instantly
    
4. Close window → session persists
    
5. Reopen app → session resumes
    

No reconnect dialogs. No loading spinners.

---

## 7. Technology Stack (Locked)

### Platform

- Electron
    
- Vite
    
- TypeScript
    

### Terminal & SSH

- xterm.js
    
- node-pty
    
- ssh2
    

### UI

- React
    
- Tailwind CSS
    
- shadcn/ui
    
- Framer Motion (minimal)
    

### Persistence

- SQLite
    
- better-sqlite3
    

### Tooling

- ESLint
    
- Prettier
    
- Zod
    
- Vitest
    

---

## 8. Open-Source Positioning

- License: MIT or Apache-2.0
    
- Public roadmap focused on:
    
    - Stability
        
    - UX refinement
        
    - Platform parity
        

Keystone is not a company, a service, or a monetisation experiment.  
It is a **tool built to last**.

---

## 9. Success Criteria

Keystone is successful if:

- You replace Termius with it
    
- You open it daily
    
- It feels calm, fast, and predictable
    
- Other developers trust it enough to use it on real machines
    

---

## Next Step

If you want to proceed cleanly, the correct next action is:

**Design the session lifecycle state machine**  
This is the heart of the app, and everything else hangs off it.

Say the word and I’ll draft it formally (states, transitions, failure handling).