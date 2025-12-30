<script lang="ts">
  import MoonStarIcon from '@lucide/svelte/icons/moon-star';
  import SunIcon from '@lucide/svelte/icons/sun';
  import SunMoonIcon from '@lucide/svelte/icons/sun-moon';
  import { DropdownMenu } from 'bits-ui';
  import type { ThemeManager } from '$lib/themes.svelte';

  interface Props {
    themeManager: ThemeManager;
  }
  const { themeManager: manager }: Props = $props();

  const getRadioValue = () => (manager.isThemeOverridden ? manager.theme : 'system');
  const setRadioValue = (value: 'system' | 'dark' | 'light') =>
    value === 'system' ? manager.resetTheme() : manager.overrideTheme(value);
</script>

<DropdownMenu.SubContent class={[
	"relative z-50 rounded-md border p-1 shadow-xl min-w-32",
	"bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-50 border-slate-200 dark:border-slate-800",
	"will-change-[opacity] data-[state=open]:animate-in data-[state=closed]:animate-out fade-in fade-out duration-150",
]}>
	<DropdownMenu.RadioGroup bind:value={getRadioValue, setRadioValue}>
		<DropdownMenu.RadioItem 
			class={[
				"flex cursor-default items-center rounded-md py-1.5 pr-1.5 pl-3",
				"text-slate-700 dark:text-slate-300 hover:text-slate-900 hover:bg-slate-950/5 data-[state=checked]:text-slate-900 data-[state=checked]:bg-slate-950/5",
				"dark:hover:text-slate-100 dark:hover:bg-white/10 dark:data-[state=checked]:text-slate-100 dark:data-[state=checked]:bg-white/10"
			]} 
			value="light"
		>
			<SunIcon class="me-2 size-5" />
			Light
		</DropdownMenu.RadioItem>
		<DropdownMenu.RadioItem 
			class={[
				"flex cursor-default items-center rounded-md py-1.5 pr-1.5 pl-3",
				"text-slate-700 dark:text-slate-300 hover:text-slate-900 hover:bg-slate-950/5 data-[state=checked]:text-slate-900 data-[state=checked]:bg-slate-950/5",
				"dark:hover:text-slate-100 dark:hover:bg-white/10 dark:data-[state=checked]:text-slate-100 dark:data-[state=checked]:bg-white/10"
			]} 
			value="dark"
		>
			<MoonStarIcon class="me-2 size-5" />
			Dark
		</DropdownMenu.RadioItem>
		<DropdownMenu.RadioItem 
			class={[
				"flex cursor-default items-center rounded-md py-1.5 pr-1.5 pl-3",
				"text-slate-700 dark:text-slate-300 hover:text-slate-900 hover:bg-slate-950/5 data-[state=checked]:text-slate-900 data-[state=checked]:bg-slate-950/5",
				"dark:hover:text-slate-100 dark:hover:bg-white/10 dark:data-[state=checked]:text-slate-100 dark:data-[state=checked]:bg-white/10"
			]} 
			value="system"
		>
			<SunMoonIcon class="me-2 size-5" />
			System
		</DropdownMenu.RadioItem>
	</DropdownMenu.RadioGroup>
</DropdownMenu.SubContent>
