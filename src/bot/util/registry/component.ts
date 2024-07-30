import type {
  ComponentType,
  ButtonInteraction,
  ChannelSelectMenuInteraction,
  MentionableSelectMenuInteraction,
  RoleSelectMenuInteraction,
  StringSelectMenuInteraction,
  UserSelectMenuInteraction,
  MessageComponentInteraction,
} from 'discord.js';
import { Predicate, type InvalidPredicateCallback, type PredicateCheck } from './predicate.js';
import { nanoid } from 'nanoid';
import { registry } from './registry.js';

export interface ComponentPredicateConfig {
  validate: (interaction: MessageComponentInteraction) => Predicate;
  invalidCallback: InvalidPredicateCallback<MessageComponentInteraction>;
}

type ComponentPredicateCheck = PredicateCheck<MessageComponentInteraction>;

export type ComponentCallback<
  TInteraction extends MessageComponentInteraction<'cached'>,
  TData extends unknown,
> = (args: { interaction: TInteraction; data: TData; drop: () => void }) => Promise<void> | void;

export class ComponentInstance<D extends unknown> {
  public readonly identifier: string;

  constructor(
    private readonly parent: Component<D>,
    public readonly data: unknown,
    public readonly predicate: ComponentPredicateConfig | null,
  ) {
    this.identifier = nanoid(20);
    registry.registerComponentInstance(this);
  }

  public checkPredicate(interaction: MessageComponentInteraction): ComponentPredicateCheck {
    if (!this.predicate) return { status: Predicate.Allow };

    const status = this.predicate.validate(interaction);

    return status === Predicate.Allow
      ? { status }
      : { status, callback: this.predicate.invalidCallback };
  }

  // this needs to be an arrow function because the scope of `this` is lost (and evaluates to `undefined`) in normal methods.
  public drop = () => {
    registry.dropComponentInstance(this);
  };

  async execute(interaction: MessageComponentInteraction<'cached'>): Promise<void> {
    await this.parent.callback({
      interaction,
      data: this.data,
      drop: this.drop,
    });
  }
}

export class Component<D extends unknown> {
  public readonly identifier: string;
  constructor(
    public readonly componentType: ComponentType,
    public readonly callback: ComponentCallback<MessageComponentInteraction<'cached'>, any>,
  ) {
    this.identifier = nanoid(20);
    registry.registerComponent(this);
  }

  /**
   * Create a new instance of the component with a given set of data, and return the assigned customId.
   * @param data The data to store in this component
   * @returns {string} a customId to use in the component.
   */
  public instanceId(
    args: D extends void
      ? { predicate?: ComponentPredicateConfig }
      : { data: D; predicate?: ComponentPredicateConfig },
  ): string {
    const component = new ComponentInstance<D>(
      this,
      'data' in args ? args.data : undefined,
      args?.predicate ?? null,
    );
    return this.constructCustomId(component.identifier);
  }

  private constructCustomId(instance: string): string {
    return Component.constructCustomId(this.identifier, instance);
  }

  static COMPONENT_VERSION = '1.0';
  static DELIMITER = '#';

  static constructCustomId(component: string, instance: string): string {
    return [Component.COMPONENT_VERSION, component, instance].join(Component.DELIMITER);
  }

  static splitCustomId(
    id: string,
  ):
    | { status: 'SUCCESS'; component: string; instance: string }
    | { status: 'SPECIAL_KEY'; key: ComponentKey }
    | { status: 'INVALID_VERSION'; errorText: string } {
    if (id === ComponentKey.Throw) return { status: 'SPECIAL_KEY', key: ComponentKey.Throw };
    if (id === ComponentKey.Warn) return { status: 'SPECIAL_KEY', key: ComponentKey.Warn };
    if (id === ComponentKey.Ignore) return { status: 'SPECIAL_KEY', key: ComponentKey.Ignore };

    const [version, component, instance] = id.split(Component.DELIMITER);

    if (version !== Component.COMPONENT_VERSION) {
      return {
        status: 'INVALID_VERSION',
        errorText: `Component with version "${version}" used; expected "${Component.COMPONENT_VERSION}"`,
      };
    }

    return { status: 'SUCCESS', component, instance };
  }
}

export enum ComponentKey {
  Throw = '__THROW_IF_PRESSED__',
  Warn = '__WARN_IF_PRESSED__',
  Ignore = '__IGNORE_IF_PRESSED__',
}

export function component<D extends unknown = void>(args: {
  type: ComponentType.Button;
  callback: ComponentCallback<ButtonInteraction<'cached'>, D>;
}): Component<D>;
export function component<D extends unknown = void>(args: {
  type: ComponentType.ChannelSelect;
  callback: ComponentCallback<ChannelSelectMenuInteraction<'cached'>, D>;
}): Component<D>;
export function component<D extends unknown = void>(args: {
  type: ComponentType.MentionableSelect;
  callback: ComponentCallback<MentionableSelectMenuInteraction<'cached'>, D>;
}): Component<D>;
export function component<D extends unknown = void>(args: {
  type: ComponentType.RoleSelect;
  callback: ComponentCallback<RoleSelectMenuInteraction<'cached'>, D>;
}): Component<D>;
export function component<D extends unknown = void>(args: {
  type: ComponentType.StringSelect;
  callback: ComponentCallback<StringSelectMenuInteraction<'cached'>, D>;
}): Component<D>;
export function component<D extends unknown = void>(args: {
  type: ComponentType.UserSelect;
  callback: ComponentCallback<UserSelectMenuInteraction<'cached'>, D>;
}): Component<D>;

export function component<D extends unknown = void>(args: {
  type: ComponentType;
  callback:
    | ComponentCallback<ButtonInteraction<'cached'>, D>
    | ComponentCallback<ChannelSelectMenuInteraction<'cached'>, D>
    | ComponentCallback<MentionableSelectMenuInteraction<'cached'>, D>
    | ComponentCallback<RoleSelectMenuInteraction<'cached'>, D>
    | ComponentCallback<StringSelectMenuInteraction<'cached'>, D>
    | ComponentCallback<UserSelectMenuInteraction<'cached'>, D>;
}): Component<D> {
  // Type-checking is only needed for the function, not the Component class constructor;
  // therefore this coersion is safe.
  return new Component(
    args.type,
    args.callback as ComponentCallback<MessageComponentInteraction<'cached'>, D>,
  );
}
