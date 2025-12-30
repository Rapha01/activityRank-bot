<script lang="ts">
  import XIcon from '@lucide/svelte/icons/x';
  import { Dialog } from 'bits-ui';
  import { type Snippet } from 'svelte';
  import { MediaQuery } from 'svelte/reactivity';

  interface Props {
    open: boolean;
    children: Snippet;
  }
  let { children, open = $bindable() }: Props = $props();

  const MD_BREAKPOINT = '48rem';
  let smallScreen = new MediaQuery(`width <= ${MD_BREAKPOINT}`);

  const getMobileOpen = () => open && smallScreen.current;
  function setMobileOpen(set: boolean) {
    open = set;
  }
  const desktopOpen = $derived(open && !smallScreen.current);
</script>

<Dialog.Root bind:open={getMobileOpen, setMobileOpen}>
	<Dialog.Portal >
		<Dialog.Content interactOutsideBehavior="ignore" class={[
			"flex md:hidden fixed inset-y-2 mx-auto z-50 w-[95vw] flex-1 flex-col overflow-y-auto rounded-md border p-4 shadow-lg focus:outline-none max-sm:inset-x-2 sm:inset-y-2 sm:right-2 sm:max-w-lg sm:p-6",
      "border-gray-200 dark:border-slate-700",
      "bg-white dark:bg-slate-900",
      "data-[state=closed]:animate-out data-[state=open]:animate-in fade-out fade-in slide-out-from-left-10 slide-in-from-left-10",
		]}>
			<Dialog.Title class="sr-only">Sidebar</Dialog.Title>
			<div class="relative flex h-full w-full flex-col">
				<Dialog.Close
					class="absolute right-2 top-4 p-2 text-slate-700 hover:text-slate-900 dark:text-slate-300 hover:dark:text-slate-50"
				>
					<XIcon class="size-5" />
				</Dialog.Close>
				{@render children()}
			</div>
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>
<div
	class="group/sidebar peer hidden md:block"
	data-open={desktopOpen ? '' : null}
	data-closed={!desktopOpen ? '' : null}
>
	<div
		class="group-data-closed/sidebar:w-0 relative h-svh w-64 bg-transparent transition-[width] duration-150 ease-in-out will-change-transform"
	></div>
	<div
		class={[
			'fixed inset-y-0 z-10 hidden h-svh w-64 transition-[left,right,width] duration-150 ease-in-out will-change-transform md:flex',
			'group-data-closed/sidebar:-left-64 left-0',
			'border-r border-slate-300 dark:border-slate-700',
		]}
	>
		<div data-sidebar="sidebar" class="flex h-full w-full flex-col">
			{@render children()}
		</div>
	</div>
</div>

<!-- 
if (isMobile) {
      return (
        <Drawer open={openMobile} onOpenChange={setOpenMobile} {...props}>
          <DrawerContent
            // data-sidebar="sidebar"
            // data-mobile="true"
            className="bg-gray-50 p-0 text-gray-900"
          >
            <VisuallyHidden.Root>
              <DrawerTitle>Sidebar</DrawerTitle>
            </VisuallyHidden.Root>
            <div className="relative flex h-full w-full flex-col">
              <DrawerClose className="absolute right-4 top-4" asChild>
                <Button
                  variant="ghost"
                  className="!p-2 text-gray-700 hover:text-gray-900 dark:text-gray-300 hover:dark:text-gray-50"
                >
                  <RiCloseLine className="size-5 shrink-0" aria-hidden="true" />
                </Button>
              </DrawerClose>
              {children}
            </div>
          </DrawerContent>
        </Drawer>
      )
    }

    return (
      <div
        ref={ref}
        className="group peer hidden md:block"
        data-state={state}
        data-collapsible={state === "collapsed" ? true : false}
      >
        {/* This is what handles the sidebar gap on desktop */}
        <div
          className={cx(
            "relative h-svh w-[--sidebar-width] bg-transparent transition-[width] duration-150 ease-in-out will-change-transform",
            "group-data-[collapsible=true]:w-0",
          )}
        />
        <div
          className={cx(
            "fixed inset-y-0 z-10 hidden h-svh w-[--sidebar-width] transition-[left,right,width] duration-150 ease-in-out will-change-transform md:flex",
            "left-0 group-data-[collapsible=true]:left-[calc(var(--sidebar-width)*-1)]",
            "border-r border-gray-200 dark:border-gray-800",
            className,
          )}
          {...props}
        >
          <div
            data-sidebar="sidebar"
            className="bg-sidebar flex h-full w-full flex-col"
          >
            {children}
          </div>
        </div>
      </div>
    )
-->
