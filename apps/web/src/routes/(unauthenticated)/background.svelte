<script lang="ts">
  import darkBg from '$lib/assets/backgrounds/dark.svg';
  import lightBg from '$lib/assets/backgrounds/light.svg';
</script>

<img
	src={lightBg}
	alt=""
	class="fixed top-0 left-0 -z-10 block h-full w-full dark:hidden"
	style:filter="opacity(25%) blur(60px)"
/>
<img
	src={darkBg}
	alt=""
	class="fixed top-0 left-0 -z-10 hidden h-full w-full dark:block"
	style:filter="opacity(25%) blur(60px)"
/>
