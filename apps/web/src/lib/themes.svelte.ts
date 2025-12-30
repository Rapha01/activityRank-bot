// Documentation comments generated with GitHub Copilot

/**
 * Represents the available visual themes for the application.
 * - 'dark': The dark color scheme.
 * - 'light': The light color scheme.
 */
export type Theme = 'dark' | 'light';

/**
 * ThemeManager is a singleton class responsible for managing the application's theme (light or dark).
 *
 * Responsibilities:
 * - Determines the initial theme based on user preference or system settings.
 * - Handles theme overrides and persistence via localStorage.
 * - Responds to changes in the system's preferred color scheme.
 * - Applies the selected theme to the document root.
 *
 * ## Usage:
 * Apply the theme on mount:
 * ```
 * import { onMount } from "svelte";
 * onMount(() => {
 *     ThemeManager.getInstance();
 * })
 * ```
 * Set a theme:
 * ```
 * const themeManager = ThemeManager.getInstance();
 * themeManager.setTheme('dark');
 * ```
 */
export class ThemeManager {
  /**
   * The singleton instance of ThemeManager.
   */
  static #instance: ThemeManager;

  /** @internal */
  #theme = $state<Theme>('light');
  /** @internal Flag indicating if the theme is manually overridden by the user. */
  #overridden = $state(false);

  /**
   * Private constructor for singleton usage.
   * Initializes the theme and override state, applies the theme,
   * and sets up system theme listeners.
   */
  private constructor() {
    const init = this.getInitial();
    this.#theme = init.theme;
    this.#overridden = init.overridden;

    this.applyTheme(this.#theme);
    this.listenToSystemThemeChanges();
  }

  /**
   * Returns the singleton instance of ThemeManager.
   * If it does not exist, it creates a new instance.
   */
  static getInstance(): ThemeManager {
    if (!ThemeManager.#instance) {
      ThemeManager.#instance = new ThemeManager();
    }
    return ThemeManager.#instance;
  }

  /**
   * Determines the initial theme and override state.
   * Checks for a stored theme in localStorage;
   * if not present, uses the system theme.
   * @returns An object containing the initial theme and override flag.
   */
  private getInitial(): { theme: Theme; overridden: boolean } {
    const storedTheme = this.getStoredTheme();
    return { theme: storedTheme ?? this.getSystemTheme(), overridden: storedTheme !== null };
  }

  /**
   * Retrieves the user's saved theme preference from localStorage, if any.
   * @returns The stored theme ('light' or 'dark'), or null if not set.
   */
  private getStoredTheme(): Theme | null {
    const storedTheme = localStorage.getItem('theme');
    if (storedTheme === 'light' || storedTheme === 'dark') {
      return storedTheme;
    }
    return null;
  }

  /**
   * Detects the current system theme from the user's OS/browser.
   * @returns The system's preferred theme ('light' or 'dark').
   */
  private getSystemTheme(): Theme {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  /**
   * Applies the specified theme to the document root element.
   * @param theme - The theme to apply ('light' or 'dark').
   */
  private applyTheme(theme: 'light' | 'dark'): void {
    document.documentElement.dataset.theme = theme;
  }

  /**
   * Gets the currently active theme.
   */
  public get theme(): 'light' | 'dark' {
    return this.#theme;
  }

  /**
   * Indicates whether the current theme is manually overridden by the user.
   */
  public get isThemeOverridden(): boolean {
    return this.#overridden;
  }

  /**
   * Sets the application's theme.
   * If the new theme matches the system theme, the override is cleared.
   * Otherwise, the override is set and the preference is saved.
   * @param newTheme - The theme to set ('light' or 'dark').
   */
  public setTheme(newTheme: 'light' | 'dark'): void {
    const systemTheme = this.getSystemTheme();
    this.#overridden = newTheme !== systemTheme;

    if (this.#overridden) {
      localStorage.setItem('theme', newTheme);
    } else {
      localStorage.removeItem('theme');
    }

    this.#theme = newTheme;
    this.applyTheme(this.#theme);
  }

  /**
   * Resets the theme to follow the system's preferred color scheme.
   * Clears any manual override and removes the saved preference.
   */
  public resetTheme(): void {
    const systemTheme = this.getSystemTheme();

    localStorage.removeItem('theme');
    this.#overridden = false;

    this.#theme = systemTheme;
    this.applyTheme(this.#theme);
  }

  /**
   * Forces the theme to the specified value and sets the override flag.
   * Saves the preference in localStorage.
   * @param newTheme - The theme to override with ('light' or 'dark').
   */
  public overrideTheme(newTheme: 'light' | 'dark'): void {
    this.#overridden = true;

    localStorage.setItem('theme', newTheme);

    this.#theme = newTheme;
    this.applyTheme(this.#theme);
  }

  /**
   * Sets up an event listener for changes in the system's preferred color scheme.
   * When the system theme changes, updates the application theme if not manually overridden.
   * @internal
   */
  private listenToSystemThemeChanges(): void {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!this.#overridden) {
        this.#theme = e.matches ? 'dark' : 'light';
        this.applyTheme(this.#theme);
      }
    });
  }
}
