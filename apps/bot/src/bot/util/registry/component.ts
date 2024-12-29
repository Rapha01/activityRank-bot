import type {
  ComponentType,
  ButtonInteraction,
  ChannelSelectMenuInteraction,
  MentionableSelectMenuInteraction,
  RoleSelectMenuInteraction,
  StringSelectMenuInteraction,
  UserSelectMenuInteraction,
  MessageComponentInteraction,
  ModalSubmitInteraction,
} from 'discord.js';
import { Predicate, type InvalidPredicateCallback, type PredicateCheck } from './predicate.js';
import { nanoid } from 'nanoid';
import { registry } from './registry.js';

interface PredicateConfig<I extends ComponentInteraction> {
  validate: (interaction: I) => Predicate;
  invalidCallback: InvalidPredicateCallback<I>;
}

export type ComponentInteraction =
  | MessageComponentInteraction<'cached'>
  | ModalSubmitInteraction<'cached'>;

export type ComponentPredicateConfig = PredicateConfig<ComponentInteraction>;
type ComponentPredicateCheck = PredicateCheck<ComponentInteraction>;

export type ComponentCallback<
  TInteraction extends ComponentInteraction,
  TData,
> = (args: { interaction: TInteraction; data: TData; drop: () => void }) => Promise<void> | void;

export abstract class ComponentInstance<I extends ComponentInteraction, D> {
  public readonly identifier: string;

  constructor(
    protected readonly parent: Component<I, D>,
    public readonly data: D,
  ) {
    this.identifier = nanoid(20);
    registry.registerComponentInstance(this);
  }

  public abstract checkPredicate(
    interaction: MessageComponentInteraction | ModalSubmitInteraction,
  ): ComponentPredicateCheck;

  public abstract execute(
    interaction: MessageComponentInteraction | ModalSubmitInteraction,
  ): Promise<void>;

  // drop() needs to be an arrow function because the scope of `this` is lost (and evaluates to `undefined`) in normal methods.
  public drop = () => {
    registry.dropComponentInstance(this);
  };
}

export abstract class Component<I extends ComponentInteraction, D> {
  public readonly identifier: string;
  public abstract readonly callback: ComponentCallback<I, any>;

  constructor() {
    this.identifier = nanoid(20);
    registry.registerComponent(this);
  }

  /**
   * Create a new instance of the component with a given set of data, and return the assigned customId.
   * @param data The data to store in this component
   * @returns {string} a customId to use in the component.
   */
  public abstract instanceId(
    args: D extends void
      ? { predicate?: PredicateConfig<I> }
      : { data: D; predicate?: PredicateConfig<I> },
  ): string;

  protected constructCustomId(instanceIdentifier: string): string {
    return Component.constructCustomId(this.identifier, instanceIdentifier);
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

class MessageComponentInstance<
  I extends MessageComponentInteraction<'cached'>,
  D,
> extends ComponentInstance<I, D> {
  constructor(
    parent: Component<I, D>,
    data: D,
    public readonly predicate: ComponentPredicateConfig | null,
  ) {
    super(parent, data);
  }

  public checkPredicate(
    interaction: MessageComponentInteraction<'cached'>,
  ): ComponentPredicateCheck {
    if (!this.predicate) return { status: Predicate.Allow };

    const status = this.predicate.validate(interaction);

    return status === Predicate.Allow
      ? { status }
      : { status, callback: this.predicate.invalidCallback };
  }

  public async execute(interaction: I): Promise<void> {
    await this.parent.callback({
      interaction,
      data: this.data,
      drop: this.drop,
    });
  }
}

class ModalComponentInstance<
  I extends ModalSubmitInteraction<'cached'>,
  D,
> extends ComponentInstance<I, D> {
  constructor(
    parent: Component<I, D>,
    data: D,
    public readonly predicate: ComponentPredicateConfig | null,
  ) {
    super(parent, data);
  }

  public checkPredicate(interaction: ModalSubmitInteraction<'cached'>): ComponentPredicateCheck {
    if (!this.predicate) return { status: Predicate.Allow };

    const status = this.predicate.validate(interaction);

    return status === Predicate.Allow
      ? { status }
      : { status, callback: this.predicate.invalidCallback };
  }

  public async execute(interaction: I): Promise<void> {
    await this.parent.callback({
      interaction,
      data: this.data,
      drop: this.drop,
    });
  }
}

class MessageComponent<I extends MessageComponentInteraction<'cached'>, D> extends Component<I, D> {
  constructor(public readonly callback: ComponentCallback<I, any>) {
    super();
  }

  public instanceId(
    args: D extends void
      ? { predicate?: ComponentPredicateConfig }
      : { data: D; predicate?: ComponentPredicateConfig },
  ): string {
    const component = new MessageComponentInstance(
      this,
      'data' in args ? args.data : undefined,
      args?.predicate ?? null,
    );
    return this.constructCustomId(component.identifier);
  }
}

class ModalComponent<I extends ModalSubmitInteraction<'cached'>, D> extends Component<I, D> {
  constructor(public readonly callback: ComponentCallback<I, any>) {
    super();
  }

  public instanceId(
    args: D extends void
      ? { predicate?: ComponentPredicateConfig }
      : { data: D; predicate?: ComponentPredicateConfig },
  ): string {
    const component = new ModalComponentInstance(
      this,
      'data' in args ? args.data : undefined,
      args?.predicate ?? null,
    );
    return this.constructCustomId(component.identifier);
  }
}

export function component<D = void>(args: {
  type: ComponentType.Button;
  callback: ComponentCallback<ButtonInteraction<'cached'>, D>;
}): Component<ButtonInteraction<'cached'>, D>;
export function component<D = void>(args: {
  type: ComponentType.ChannelSelect;
  callback: ComponentCallback<ChannelSelectMenuInteraction<'cached'>, D>;
}): Component<ChannelSelectMenuInteraction<'cached'>, D>;
export function component<D = void>(args: {
  type: ComponentType.MentionableSelect;
  callback: ComponentCallback<MentionableSelectMenuInteraction<'cached'>, D>;
}): Component<MentionableSelectMenuInteraction<'cached'>, D>;
export function component<D = void>(args: {
  type: ComponentType.RoleSelect;
  callback: ComponentCallback<RoleSelectMenuInteraction<'cached'>, D>;
}): Component<RoleSelectMenuInteraction<'cached'>, D>;
export function component<D = void>(args: {
  type: ComponentType.StringSelect;
  callback: ComponentCallback<StringSelectMenuInteraction<'cached'>, D>;
}): Component<StringSelectMenuInteraction<'cached'>, D>;
export function component<D = void>(args: {
  type: ComponentType.UserSelect;
  callback: ComponentCallback<UserSelectMenuInteraction<'cached'>, D>;
}): Component<UserSelectMenuInteraction<'cached'>, D>;

export function component<D = void>(args: {
  type: ComponentType;
  callback:
    | ComponentCallback<ButtonInteraction<'cached'>, D>
    | ComponentCallback<ChannelSelectMenuInteraction<'cached'>, D>
    | ComponentCallback<MentionableSelectMenuInteraction<'cached'>, D>
    | ComponentCallback<RoleSelectMenuInteraction<'cached'>, D>
    | ComponentCallback<StringSelectMenuInteraction<'cached'>, D>
    | ComponentCallback<UserSelectMenuInteraction<'cached'>, D>;
}): Component<MessageComponentInteraction<'cached'>, D> {
  // Type-checking is only needed for the function, not the Component class constructor;
  // therefore this coersion is safe.
  return new MessageComponent(
    args.callback as ComponentCallback<MessageComponentInteraction<'cached'>, D>,
  );
}

export function modal<D = void>(args: {
  callback: ComponentCallback<ModalSubmitInteraction<'cached'>, D>;
}) {
  return new ModalComponent(args.callback);
}
