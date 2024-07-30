import {
  type ActionRowData,
  type ButtonInteraction,
  ComponentType,
  type MessageActionRowComponentBuilder,
  type MessageActionRowComponentData,
  type ModalActionRowComponentData,
} from 'discord.js';
import { component, type ComponentCallback } from './registry/component.js';

type CallbackFn<D> = ComponentCallback<ButtonInteraction<'cached'>, D>;

export const useConfirm = <D extends unknown = void>(args: {
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
