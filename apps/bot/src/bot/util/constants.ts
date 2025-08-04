import {
  type APIActionRowComponent,
  type APIComponentInActionRow,
  ButtonStyle,
  ComponentType,
} from 'discord.js';

export const PATREON_URL = 'https://www.patreon.com/rapha01';

export const PATREON_BUTTON: APIComponentInActionRow = {
  type: ComponentType.Button,
  style: ButtonStyle.Link,
  url: PATREON_URL,
  label: 'Support us on Patreon!',
};

export const PATREON_ACTION_ROW: APIActionRowComponent<APIComponentInActionRow> = {
  type: ComponentType.ActionRow,
  components: [PATREON_BUTTON],
};

export const PATREON_COMPONENTS = [PATREON_ACTION_ROW];
