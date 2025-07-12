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
import { component, type ComponentCallback } from './registry/component.js';

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
