import { type ButtonInteraction, ComponentType } from 'discord.js';
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
