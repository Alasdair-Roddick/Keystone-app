import { motion, AnimatePresence } from 'framer-motion'
import { X, Palette, Sun, Moon, Check } from 'lucide-react'
import { useSettingsStore, AVAILABLE_THEMES, type ThemeId } from '../state/settings'

type Props = {
  isOpen: boolean
  onClose: () => void
}

export default function SettingsModal({ isOpen, onClose }: Props) {
  const { theme, setTheme } = useSettingsStore()

  const lightThemes = AVAILABLE_THEMES.filter((t) => t.type === 'light')
  const darkThemes = AVAILABLE_THEMES.filter((t) => t.type === 'dark')

  const handleThemeChange = (themeId: ThemeId) => {
    setTheme(themeId)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="bg-base-100 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-6 border-b border-base-300 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-primary/10 text-primary">
                  <Palette className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Settings</h3>
                  <p className="text-sm text-base-content/60">Customize your experience</p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="btn btn-ghost btn-sm btn-square"
              >
                <X className="w-5 h-5" />
              </motion.button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(85vh-140px)]">
              {/* Theme Section */}
              <div className="mb-8">
                <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Palette className="w-5 h-5 text-primary" />
                  Theme
                </h4>

                {/* Current theme indicator */}
                <div className="mb-6 p-4 rounded-xl bg-base-200 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-base-content/60">Current theme</p>
                    <p className="font-semibold capitalize">{theme}</p>
                  </div>
                  <div className="flex gap-2">
                    <div className="w-4 h-4 rounded-full bg-primary" title="Primary" />
                    <div className="w-4 h-4 rounded-full bg-secondary" title="Secondary" />
                    <div className="w-4 h-4 rounded-full bg-accent" title="Accent" />
                  </div>
                </div>

                {/* Light Themes */}
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Sun className="w-4 h-4 text-warning" />
                    <span className="text-sm font-medium text-base-content/70">Light Themes</span>
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {lightThemes.map((t) => (
                      <ThemeButton
                        key={t.id}
                        themeId={t.id}
                        name={t.name}
                        isSelected={theme === t.id}
                        onClick={() => handleThemeChange(t.id)}
                      />
                    ))}
                  </div>
                </div>

                {/* Dark Themes */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Moon className="w-4 h-4 text-info" />
                    <span className="text-sm font-medium text-base-content/70">Dark Themes</span>
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {darkThemes.map((t) => (
                      <ThemeButton
                        key={t.id}
                        themeId={t.id}
                        name={t.name}
                        isSelected={theme === t.id}
                        onClick={() => handleThemeChange(t.id)}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-base-300 flex justify-end">
              <button className="btn btn-ghost" onClick={onClose}>
                Done
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Theme preview button component
function ThemeButton({
  themeId,
  name,
  isSelected,
  onClick,
}: {
  themeId: ThemeId
  name: string
  isSelected: boolean
  onClick: () => void
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`
        relative overflow-hidden rounded-xl border-2 transition-colors
        ${isSelected ? 'border-primary ring-2 ring-primary/20' : 'border-base-300 hover:border-base-content/20'}
      `}
    >
      {/* Theme preview using data-theme */}
      <div data-theme={themeId} className="p-3 bg-base-100">
        <div className="flex gap-1 mb-2">
          <div className="w-2 h-2 rounded-full bg-primary" />
          <div className="w-2 h-2 rounded-full bg-secondary" />
          <div className="w-2 h-2 rounded-full bg-accent" />
        </div>
        <div className="space-y-1">
          <div className="h-1.5 w-full rounded bg-base-content/20" />
          <div className="h-1.5 w-2/3 rounded bg-base-content/10" />
        </div>
      </div>
      
      {/* Theme name */}
      <div
        data-theme={themeId}
        className="px-3 py-2 bg-base-200 text-xs font-medium text-base-content truncate flex items-center justify-between"
      >
        <span>{name}</span>
        {isSelected && <Check className="w-3 h-3 text-primary" />}
      </div>
    </motion.button>
  )
}
