import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// DaisyUI themes (excluding cyberpunk as requested)
export const AVAILABLE_THEMES = [
  // Light themes
  { id: 'light', name: 'Light', type: 'light' },
  { id: 'cupcake', name: 'Cupcake', type: 'light' },
  { id: 'bumblebee', name: 'Bumblebee', type: 'light' },
  { id: 'emerald', name: 'Emerald', type: 'light' },
  { id: 'corporate', name: 'Corporate', type: 'light' },
  { id: 'retro', name: 'Retro', type: 'light' },
  { id: 'valentine', name: 'Valentine', type: 'light' },
  { id: 'garden', name: 'Garden', type: 'light' },
  { id: 'lofi', name: 'Lo-Fi', type: 'light' },
  { id: 'pastel', name: 'Pastel', type: 'light' },
  { id: 'fantasy', name: 'Fantasy', type: 'light' },
  { id: 'wireframe', name: 'Wireframe', type: 'light' },
  { id: 'cmyk', name: 'CMYK', type: 'light' },
  { id: 'autumn', name: 'Autumn', type: 'light' },
  { id: 'acid', name: 'Acid', type: 'light' },
  { id: 'lemonade', name: 'Lemonade', type: 'light' },
  { id: 'winter', name: 'Winter', type: 'light' },
  { id: 'nord', name: 'Nord', type: 'light' },
  // Dark themes
  { id: 'dark', name: 'Dark', type: 'dark' },
  { id: 'synthwave', name: 'Synthwave', type: 'dark' },
  { id: 'halloween', name: 'Halloween', type: 'dark' },
  { id: 'forest', name: 'Forest', type: 'dark' },
  { id: 'aqua', name: 'Aqua', type: 'dark' },
  { id: 'black', name: 'Black', type: 'dark' },
  { id: 'luxury', name: 'Luxury', type: 'dark' },
  { id: 'dracula', name: 'Dracula', type: 'dark' },
  { id: 'business', name: 'Business', type: 'dark' },
  { id: 'night', name: 'Night', type: 'dark' },
  { id: 'coffee', name: 'Coffee', type: 'dark' },
  { id: 'dim', name: 'Dim', type: 'dark' },
  { id: 'sunset', name: 'Sunset', type: 'dark' },
] as const

export type ThemeId = (typeof AVAILABLE_THEMES)[number]['id']

interface SettingsState {
  theme: ThemeId
  setTheme: (theme: ThemeId) => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: 'coffee',
      setTheme: (theme) => {
        // Update the HTML data-theme attribute
        document.documentElement.setAttribute('data-theme', theme)
        set({ theme })
      },
    }),
    {
      name: 'keystone-settings',
      onRehydrateStorage: () => (state) => {
        // Apply theme on app load
        if (state?.theme) {
          document.documentElement.setAttribute('data-theme', state.theme)
        }
      },
    }
  )
)
