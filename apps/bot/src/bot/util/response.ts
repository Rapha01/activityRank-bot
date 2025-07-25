import {
  MessageFlags,
  ComponentType,
  type AutocompleteInteraction,
  type Interaction,
} from 'discord.js';
import { container } from './component.js';
import i18next from 'i18next';
import { emoji } from '#const/config.js';

class Response {
  constructor(readonly content: string) {}

  async replyTo(interaction: Exclude<Interaction, AutocompleteInteraction>): Promise<void> {
    const t = i18next.getFixedT([interaction.locale, 'en-US'], 'command-content');
    await interaction.reply({
      components: [
        container(
          [
            {
              type: ComponentType.TextDisplay,
              content: `## ${emoji('no')} ${t('generic.errorHeader')}`,
            },
            { type: ComponentType.TextDisplay, content: this.content },
          ],
          { accentColor: 0xe7000b },
        ),
      ],
      flags: [MessageFlags.IsComponentsV2],
    });
  }

  async followUpTo(interaction: Exclude<Interaction, AutocompleteInteraction>): Promise<void> {
    const t = i18next.getFixedT([interaction.locale, 'en-US'], 'command-content');
    await interaction.followUp({
      components: [
        container(
          [
            {
              type: ComponentType.TextDisplay,
              content: `## ${emoji('no')} ${t('generic.errorHeader')}`,
            },
            { type: ComponentType.TextDisplay, content: this.content },
          ],
          { accentColor: 0xe7000b },
        ),
      ],
      flags: [MessageFlags.IsComponentsV2],
    });
  }
}

export const error = (content: string) => new Response(content);
