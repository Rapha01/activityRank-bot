import {
  type ActionRowData,
  type ButtonComponentData,
  type ButtonInteraction,
  type ComponentInContainerData,
  ComponentType,
  type ContainerComponentData,
  type MessageActionRowComponentBuilder,
  type MessageActionRowComponentData,
  type ModalActionRowComponentData,
  type SectionComponentData,
  type TextDisplayComponentData,
  type ThumbnailComponentData,
} from 'discord.js';
import { type ComponentCallback, component } from './registry/component.js';

type CallbackFn<D> = ComponentCallback<ButtonInteraction<'cached'>, D>;

export const useConfirm = <D = void>(args: {
  confirmFn: CallbackFn<D>;
  denyFn: CallbackFn<void>;
}) => {
  const confirmButton = component<D>({ type: ComponentType.Button, callback: args.confirmFn });
  const denyButton = component<void>({ type: ComponentType.Button, callback: args.denyFn });
  return { confirmButton, denyButton };
};

/**
 * Create an action row for use in a modal.
 * @param components The components to add to the action row.
 */
export function actionrow(
  components: ModalActionRowComponentData[],
): ActionRowData<ModalActionRowComponentData>;
/**
 * Create an action row for use in a component response.
 * @param components The components to add to the action row.
 */
export function actionrow(
  components: (MessageActionRowComponentData | MessageActionRowComponentBuilder)[],
): ActionRowData<MessageActionRowComponentData | MessageActionRowComponentBuilder>;
export function actionrow(
  components:
    | (MessageActionRowComponentData | MessageActionRowComponentBuilder)[]
    | ModalActionRowComponentData[],
):
  | ActionRowData<MessageActionRowComponentData | MessageActionRowComponentBuilder>
  | ActionRowData<ModalActionRowComponentData> {
  // the function overrides do all necessary type validation; coersion is fine here.
  return { type: ComponentType.ActionRow, components } as any;
}

export function container(
  components: ComponentInContainerData[],
  opts?: Omit<ContainerComponentData, 'type' | 'components'>,
): ContainerComponentData {
  return { type: ComponentType.Container, components, ...opts };
}

export function section(
  _components: TextDisplayComponentData | TextDisplayComponentData[],
  accessory: ButtonComponentData | ThumbnailComponentData,
): SectionComponentData {
  let components: TextDisplayComponentData[];

  if (Array.isArray(_components)) {
    components = _components;
  } else {
    components = [_components];
  }

  return { type: ComponentType.Section, components, accessory };
}

/**
 * Create a button that deletes the current message when pressed.
 */
export const closeButton = component({
  type: ComponentType.Button,
  async callback({ interaction, drop }) {
    await interaction.deferUpdate();
    await interaction.deleteReply();
    drop();
  },
});

/**
 * Create a custom ID string that will not be picked up by the
 * component management system (in `bot/util/registry`)
 */
export const makeCustomId2 = (customId: string): string => `2.0#${customId}`;

const CUSTOM_ID_2 = /^2.0#(?<id>.*)/;

/**
 * Parse a custom ID string that was constructed by the {@link makeCustomId2} function.
 * Returns only the `customId` string provided to that function.
 */
export const parseCustomId2 = (givenId: string): string => {
  const parse = CUSTOM_ID_2.exec(givenId);
  const id = parse?.groups?.id;
  return id ?? '';
};

export const makeCID2 = makeCustomId2;
export const parseCID2 = parseCustomId2;
