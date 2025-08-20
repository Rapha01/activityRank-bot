import {
  type APIActionRowComponent,
  type APIButtonComponent,
  type APIButtonComponentWithSKUId,
  type APIButtonComponentWithURL,
  ButtonStyle,
  ComponentType,
} from 'discord.js';
import { emojiId, isProduction } from '#const/config.js';
import { ComponentKey } from './registry/component.js';

export const PREMIUM_SKU_ID = '1393334749568696361';

// Premiium buttons cannot be sent by non-premium bots, so we use a placeholder button in development
// and a real premium button in production.
export const PREMIUM_BUTTON: APIButtonComponentWithSKUId = isProduction
  ? {
      type: ComponentType.Button,
      style: ButtonStyle.Premium,
      sku_id: PREMIUM_SKU_ID,
    }
  : ({
      type: ComponentType.Button,
      style: ButtonStyle.Primary,
      label: 'SAMPLE PREMIUM BUTTON',
      emoji: { id: emojiId('store') },
      custom_id: ComponentKey.Ignore,
    } as APIButtonComponent as APIButtonComponentWithSKUId);

export const PREMIUM_ACTION_ROW: APIActionRowComponent<APIButtonComponentWithSKUId> = {
  type: ComponentType.ActionRow,
  components: [PREMIUM_BUTTON],
};

export const PREMIUM_COMPONENTS = [PREMIUM_ACTION_ROW];

export const PATREON_URL = 'https://www.patreon.com/rapha01';

export const PATREON_BUTTON: APIButtonComponentWithURL = {
  type: ComponentType.Button,
  style: ButtonStyle.Link,
  url: PATREON_URL,
  label: 'Support us on Patreon!',
};

export const PATREON_ACTION_ROW: APIActionRowComponent<APIButtonComponentWithURL> = {
  type: ComponentType.ActionRow,
  components: [PATREON_BUTTON],
};

export const PATREON_COMPONENTS = [PATREON_ACTION_ROW];
