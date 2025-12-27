<script lang="ts">
  import { DropdownMenu } from 'bits-ui';
  import type { Snippet } from 'svelte';

  interface Props {
    isActive: boolean;
    onclick: () => void;
    children: Snippet;
  }

  const { isActive, onclick, children }: Props = $props();
</script>

<DropdownMenu.Item
	data-active={isActive ? '' : undefined}
	disabled={isActive}
	class="flex cursor-default items-center rounded-md py-1.5 pr-1.5 pl-3 text-slate-700 dark:text-slate-300 hover:text-slate-900 hover:bg-slate-950/5 data-active:text-slate-900 data-active:bg-slate-950/5 dark:hover:text-slate-100 dark:hover:bg-white/10 dark:data-active:text-slate-100 dark:data-active:bg-white/10"
	{onclick}
>
	<div class="flex items-center">
		{@render children()}
	</div>
</DropdownMenu.Item>

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
