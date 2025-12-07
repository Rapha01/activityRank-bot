import { type Attachment, ComponentType, MessageFlags, Routes } from 'discord.js';
import { command } from '#bot/commands.ts';
import { container, section, textDisplay } from '#bot/util/component.ts';
import { PREMIUM_BUTTON } from '#bot/util/constants.ts';
import { modal } from '#bot/util/registry/component.ts';
import { oneline } from '#bot/util/templateStrings.ts';
import { emoji } from '#const/config.ts';
import { hasValidEntitlement } from '#util/fct.ts';

export default command({
  name: 'customize-bot',
  async execute({ interaction }) {
    if (!hasValidEntitlement(interaction)) {
      await interaction.reply({
        components: [
          container(
            [
              textDisplay('## This command requires Premium!'),
              textDisplay(
                oneline`
                  ${interaction.user.toString()}, please consider helping us by becoming a Premium supporter. \
                  The bot is mostly free! Activating Premium for you or your server gives you quality of life \
                  upgrades, like the ability to change your bot's banner and profile picture.`,
              ),
              section(
                {
                  type: ComponentType.TextDisplay,
                  content: `To support a server you love and help us improve the bot for everyone, consider **activating ${emoji('store')} Premium** for your server!`,
                },
                PREMIUM_BUTTON,
              ),
              textDisplay(`### ${emoji('activityrank')} Thank you for your support!`),
            ],
            { accentColor: 0x1c3d9 },
          ),
        ],
        allowedMentions: { parse: [] },
        flags: [MessageFlags.IsComponentsV2, MessageFlags.Ephemeral],
      });
      return;
    }

    await interaction.showModal({
      title: 'Customize Branding',
      custom_id: setModal.instanceId({ data: null }),
      components: [
        {
          type: ComponentType.Label,
          label: 'Profile Picture',
          description: "Edit ActivityRank's avatar in your server.",
          component: {
            type: ComponentType.FileUpload,
            custom_id: 'avatar',
            required: false,
          },
        },
        {
          type: ComponentType.Label,
          label: 'Banner',
          component: {
            type: ComponentType.FileUpload,
            custom_id: 'banner',
            required: false,
          },
        },
      ],
    });
  },
});

const setModal = modal({
  async callback({ interaction }) {
    await interaction.deferUpdate();
    const avatar = interaction.fields.getUploadedFiles('avatar')?.first() ?? null;
    const banner = interaction.fields.getUploadedFiles('banner')?.first() ?? null;

    // `editMe` doesn't allow resetting an image
    // await interaction.guild.members.editMe({ avatar: avatar?.url, banner: banner?.url });

    await interaction.client.rest.patch(Routes.guildMember(interaction.guild.id, '@me'), {
      body: {
        avatar: await resolveImage(avatar),
        banner: await resolveImage(banner),
      },
    });
  },
});

async function resolveImage(image: Attachment | null) {
  if (!image) return null;
  if (!['image/jpg', 'image/jpeg', 'image/png'].includes(image.contentType ?? '')) return null;

  const res = await fetch(image.url);

  const data = Buffer.from(await res.arrayBuffer());
  const contentType = res.headers.get('content-type');

  return `data:${contentType};base64,${data.toString('base64')}`;
}
