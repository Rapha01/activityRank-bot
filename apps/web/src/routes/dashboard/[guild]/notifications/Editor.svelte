<script lang="ts">
  import { autocompletion, completionKeymap } from '@codemirror/autocomplete';
  import { history, historyKeymap, standardKeymap } from '@codemirror/commands';
  import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
  import { syntaxHighlighting } from '@codemirror/language';
  import { EditorState } from '@codemirror/state';
  import { drawSelection, dropCursor, EditorView, keymap } from '@codemirror/view';
  import { onMount } from 'svelte';
  import {
    markdownPreviewStyle,
    underlineMarkdownExtension,
    userMentionAutocomplete,
    userMentionPlugin,
  } from './editor-utils';

  let editorContainer = $state<HTMLDivElement>();
  let editorView = $state<EditorView>();

  let { value = $bindable(), maxChars }: { value: string; maxChars?: number } = $props();

  onMount(() => {
    const startState = EditorState.create({
      doc: value,
      extensions: [
        history(), // Enable Undo/Redo
        drawSelection(), // Better text selection visuals
        dropCursor(), // Visual cursor when dragging text
        keymap.of([
          ...completionKeymap, // keymap for autocomplete menu
          ...standardKeymap, // Essential keyboard commands
          ...historyKeymap, // Essential shortcuts like Ctrl+Z
        ]),

        markdown({ base: markdownLanguage, extensions: [underlineMarkdownExtension] }),
        syntaxHighlighting(markdownPreviewStyle),
        autocompletion({
          override: [userMentionAutocomplete],
          icons: false,

          // DEBUG OPTIONS: uncomment to allow selecting the tooltip in devtools
          // closeOnBlur: false,
          // activateOnCompletion: () => true,
        }),
        userMentionPlugin,
        EditorView.lineWrapping,

        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            value = update.state.doc.toString();
          }
        }),
      ],
    });

    editorView = new EditorView({
      state: startState,
      parent: editorContainer,
    });

    return () => editorView?.destroy();
  });

  // Keep editor in sync if 'value' is changed from outside
  $effect(() => {
    if (editorView && value !== editorView.state.doc.toString()) {
      editorView.dispatch({
        changes: { from: 0, to: editorView.state.doc.length, insert: value },
      });
    }
  });

  const charCount = $derived(value?.length ?? 0);
  const charsRemaining = $derived(maxChars ? maxChars - charCount : Infinity);
</script>

<div class="editor relative">
  <div bind:this={editorContainer}></div>
  {#if maxChars !== undefined && charsRemaining <= (maxChars * 0.2)}
    <div data-overlimit={charsRemaining < 0 ? "" : null} class={["absolute bottom-2 right-2 text-slate-500 dark:text-slate-400", charsRemaining <= 0 && "data-overlimit:text-red-700/60 data-overlimit:dark:text-red-300/60"]}>{charsRemaining}</div>
  {/if}
</div>

<style>
  @reference "tailwindcss";
  @reference "../../../../app.css";

  :global(.cm-editor) {
    @apply border border-slate-300 dark:border-slate-700 rounded-lg p-1;
    &.cm-focused {
      @apply outline-none border-slate-500;
    }
  }

  :global(.cm-content) { 
    min-height: 200px !important;
    font-family: var(--font-sans);
    /* Space for the counter */
    padding-bottom: 20px !important;
  }

  :global(.cm-cursor) {
    @apply border-slate-900! dark:border-slate-100!;
  }

  :global(.cm-editor.cm-focused .cm-selectionBackground) {
    @apply bg-slate-300! dark:bg-slate-700!;
  }

  /* The main container of the dropdown */
  :global(.cm-tooltip.cm-tooltip-autocomplete) {
    border: none !important;
    border-radius: 12px;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
    overflow: hidden;
    padding: 4px;

    @apply bg-white! dark:bg-slate-900!;
  }

  /* Each list item */
  :global(.cm-tooltip-autocomplete ul li) {
    padding: 8px 12px !important;
    border-radius: 8px;
    font-size: 14px;
    font-family: var(--font-sans);

    @apply text-slate-800! dark:text-slate-200!;
  }

  /* The selected/active item */
  :global(.cm-tooltip-autocomplete ul li[aria-selected]) {
    /* the default bg colour is a harsh blue, using soft gray instead */
    @apply bg-slate-200! text-slate-900! dark:bg-slate-800! dark:text-slate-100!;
  }

  /* Style the "detail" text (the description) */
  :global(.cm-completionDetail) {
    margin-left: 10px;
    font-size: 12px;
    font-style: italic;

    @apply text-slate-600 dark:text-slate-400;
  }

  /* Hide the default code-matching bolding if you want it extra clean */
  :global(.cm-completionMatchedText) {
    text-decoration: none;
    font-weight: 600;
    color: var(--color-teal-500); /* highlight the matched part */
  }

	:global(.cm-mention) {
    color: var(--color-teal-500);
    background-color: color-mix(in oklab, var(--color-teal-500) 10%, transparent);
    padding: 2px 4px;
    border-radius: 4px;
    font-weight: 500;
  }
</style>
