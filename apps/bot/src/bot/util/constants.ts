import {
  ButtonStyle,
  ComponentType,
  type APIActionRowComponent,
  type APIMessageActionRowComponent,
} from 'discord.js';

export const PATREON_URL = 'https://www.patreon.com/rapha01';

export const PATREON_BUTTON: APIMessageActionRowComponent = {
  type: ComponentType.Button,
  style: ButtonStyle.Link,
  url: PATREON_URL,
  label: 'Support us on Patreon!',
};

export const PATREON_ACTION_ROW: APIActionRowComponent<APIMessageActionRowComponent> = {
  type: ComponentType.ActionRow,
  components: [PATREON_BUTTON],
};

export const PATREON_COMPONENTS = [PATREON_ACTION_ROW];
