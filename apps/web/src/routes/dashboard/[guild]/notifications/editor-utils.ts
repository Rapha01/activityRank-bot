import type { Completion, CompletionContext, CompletionResult } from '@codemirror/autocomplete';
import { HighlightStyle } from '@codemirror/language';
import type { RangeSet } from '@codemirror/state';
import {
  Decoration,
  EditorView,
  MatchDecorator,
  ViewPlugin,
  type ViewUpdate,
  WidgetType,
} from '@codemirror/view';
import { tags as stdTag, Tag } from '@lezer/highlight';
import type { MarkdownConfig } from '@lezer/markdown';

export const underlineTag = Tag.define();

export const markdownPreviewStyle = HighlightStyle.define([
  { tag: stdTag.heading1, fontSize: '1.5em', fontWeight: 'bold' },
  { tag: stdTag.heading2, fontSize: '1.25em', fontWeight: 'bold' },
  { tag: stdTag.heading3, fontWeight: 'bold' },
  { tag: stdTag.emphasis, fontStyle: 'italic' },
  { tag: stdTag.strong, fontWeight: 'bold' },
  { tag: stdTag.strikethrough, textDecoration: 'line-through' },
  { tag: stdTag.link, color: '#0969da', textDecoration: 'underline' },
  { tag: underlineTag, textDecoration: 'underline' },
  { tag: stdTag.monospace, backgroundColor: '#f3f3f3', padding: '2px 4px', borderRadius: '4px' },
]);

export const underlineMarkdownExtension: MarkdownConfig = {
  defineNodes: [
    { name: 'Underline', style: underlineTag },
    { name: 'UnderlineMark', style: stdTag.processingInstruction },
  ],
  parseInline: [
    {
      name: 'Underline',
      parse(cx, next, pos) {
        // Check for double underscore __ (ASCII 95)
        if (next !== 95 || cx.char(pos + 1) !== 95) return -1;

        // Scan for the closing __
        for (let i = pos + 2; i < cx.end; i++) {
          const char = cx.char(i);

          // Handle escaped characters: \__
          if (char === 92 /* backslash */) {
            i++;
            continue;
          }

          if (char === 95 && cx.char(i + 1) === 95) {
            // Found it!
            return cx.addElement(
              cx.elt('Underline', pos, i + 2, [
                cx.elt('UnderlineMark', pos, pos + 2),
                // This allows other markdown (like italics) inside the underline
                ...cx.parser.parseInline(cx.slice(pos + 2, i), pos + 2),
                cx.elt('UnderlineMark', i, i + 2),
              ]),
            );
          }
        }
        return -1;
      },
      before: 'Emphasis', // Runs before default bold logic
    },
  ],
};

function getCachedUser(userId: string): string | null {
  const users = [
    { name: 'piemot', username: 'piemot', discordId: '774660568728469585' },
    { name: 'Rapha', username: 'rapha01', discordId: '370650814223482880' },
    { name: 'GeheimerWolf', username: 'geheimerwolf', discordId: '270273690074087427' },
    { name: 'LiviD', username: 'reezilo', discordId: '181725637940084736' },
    { name: 'RyXy', username: 'ryxy._.', discordId: '686422759365935105' },
  ];

  return users.find((user) => user.discordId === userId)?.name ?? null;
}

export async function userMentionAutocomplete(
  context: CompletionContext,
): Promise<CompletionResult | null> {
  // Check if the cursor is currently after an '@'
  const word = context.matchBefore(/@\w*/);

  // If no match or the match is just empty space, don't show anything
  if (!word || (word.from === word.to && !context.explicit)) {
    return null;
  }

  const users = [
    { name: 'piemot', username: 'piemot', discordId: '774660568728469585' },
    { name: 'Rapha', username: 'rapha01', discordId: '370650814223482880' },
    { name: 'GeheimerWolf', username: 'geheimerwolf', discordId: '270273690074087427' },
    { name: 'LiviD', username: 'reezilo', discordId: '181725637940084736' },
    { name: 'RyXy', username: 'ryxy._.', discordId: '686422759365935105' },
  ];

  function applyUserMention(userId: string) {
    const apply: Completion['apply'] = (view, _completion, from, to) => {
      view.dispatch({
        changes: { from, to, insert: `<@${userId}>` },
        // Update the position of the cursor
        selection: { anchor: from + `<@${userId}>`.length },
      });
    };
    return apply;
  }

  return {
    from: word.from,
    validFor: /^@\w*$/,
    options: users.map((user) => ({
      label: `@${user.name}`,
      detail: user.username,
      apply: applyUserMention(user.discordId),
    })),
  };
}

const userMentionMatcher = new MatchDecorator({
  regexp: /<@(\d+)>/g,
  decoration: (match) => {
    return Decoration.replace({
      widget: new UserMentionWidget(match[1]),
    });
  },
});

export const userMentionPlugin = ViewPlugin.fromClass(
  class {
    public decorations: RangeSet<Decoration>;
    constructor(view: EditorView) {
      this.decorations = userMentionMatcher.createDeco(view);
    }
    update(update: ViewUpdate) {
      this.decorations = userMentionMatcher.updateDeco(update, this.decorations);
    }
  },
  {
    decorations: (instance) => instance.decorations,
    provide: (plugin) => {
      return EditorView.atomicRanges.of((view) => {
        return view.plugin(plugin)?.decorations || Decoration.none;
      });
    },
  },
);

export class UserMentionWidget extends WidgetType {
  public userId: string;
  constructor(userId: string) {
    super();
    this.userId = userId;
  }

  toDOM() {
    const span = document.createElement('span');
    span.textContent = getCachedUser(this.userId) ?? 'Unknown User';
    span.className = 'cm-mention';

    // icon (todo: replace w/ avatar)
    const icon = document.createElement('span');
    icon.textContent = '👤';
    span.prepend(icon);

    return span;
  }

  // Helps CodeMirror decide if it needs to redraw
  eq(other: UserMentionWidget) {
    return other.userId === this.userId;
  }

  // Ensure the cursor treats it as one unit
  ignoreEvent() {
    return false;
  }
}
