<script lang="ts">
	import { DropdownMenu } from 'bits-ui';
	import SunIcon from '@lucide/svelte/icons/sun';
	import MoonStarIcon from '@lucide/svelte/icons/moon-star';
	import SunMoonIcon from '@lucide/svelte/icons/sun-moon';
	import ThemeSwitcherItem from './ThemeSwitcherItem.svelte';
	import { ThemeManager } from '../themes.svelte';

  const loadManager = async () => ThemeManager.getInstance();
</script>

<DropdownMenu.Root>
	<DropdownMenu.Trigger>
		<SunIcon class="block dark:hidden" />
		<MoonStarIcon class="hidden dark:block" />
	</DropdownMenu.Trigger>
	<DropdownMenu.Portal>
    {#await loadManager() then manager}
      <DropdownMenu.Content
        class="z-10 w-32 rounded-lg border border-slate-950/20 bg-slate-100 p-1 text-slate-800 not-dark:shadow-md dark:border-white/20 dark:bg-slate-900 dark:text-slate-200"
        sideOffset={8}
      >
        <ThemeSwitcherItem
          isActive={manager.isThemeOverridden && manager.theme === 'light'}
          onclick={() => manager.overrideTheme('light')}
        >
          <SunIcon class="me-2 size-5" />
          Light
        </ThemeSwitcherItem>
        <ThemeSwitcherItem
          isActive={manager.isThemeOverridden && manager.theme === 'dark'}
          onclick={() => manager.overrideTheme('dark')}
        >
          <MoonStarIcon class="me-2 size-5" />
          Dark
        </ThemeSwitcherItem>
        <ThemeSwitcherItem isActive={!manager.isThemeOverridden} onclick={() => manager.resetTheme()}>
          <SunMoonIcon class="me-2 size-5" />
          System
        </ThemeSwitcherItem>
      </DropdownMenu.Content>
    {/await}
	</DropdownMenu.Portal>
</DropdownMenu.Root>

<!--

function DarkModeSwitcher() {
  const { resolvedTheme, setTheme } = useTheme();
  const isMounted = useIsMounted();

  function Item(props: { theme: 'light' | 'dark' | 'system'; children: ReactNode }) {
    return (
      <button
        type="button"
        onClick={() => setTheme(props.theme)}
        className="flex w-full rounded-md items-center gap-2 px-4 py-2 text-slate-700 dark:text-slate-300 data-focus:bg-slate-100 hover:bg-slate-100 dark:data-focus:bg-slate-800 dark:hover:bg-slate-800 data-focus:text-slate-900 hover:text-slate-900 dark:data-focus:text-slate-100 dark:hover:text-slate-100 data-focus:outline-hidden"
      >
        {props.children}
      </button>
    );
  }

  return (
    <Menu>
      <MenuButton>
        {isMounted() &&
          (resolvedTheme === 'dark' ? (
            <MoonStar className="size-5 mx-2" />
          ) : (
            <Sun className="size-5 mx-2" />
          ))}
      </MenuButton>
      <MenuItems
        anchor="bottom"
        className="mt-2 p-1 w-36 z-10 origin-top-right rounded-lg bg-white dark:bg-slate-900 shadow-lg ring-1 ring-black/5 transition focus:outline-hidden data-closed:scale-95 data-closed:transform data-closed:opacity-0 data-enter:duration-100 data-enter:ease-out data-leave:duration-75 data-leave:ease-in"
      >
        <MenuItem>
          <Item theme="light">
            <Sun />
            Light
          </Item>
        </MenuItem>
        <MenuItem>
          <Item theme="dark">
            <MoonStar />
            Dark
          </Item>
        </MenuItem>
        <MenuItem>
          <Item theme="system">
            <Monitor />
            System
          </Item>
        </MenuItem>
      </MenuItems>
    </Menu>
  );
}
-->
