import {
  ActionRow,
  BaseSelectMenuComponent,
  ButtonComponent,
  type ButtonInteraction,
  type ChannelSelectMenuInteraction,
  type ComponentType,
  ContainerComponent,
  type MentionableSelectMenuInteraction,
  type MessageActionRowComponent,
  type MessageComponentInteraction,
  type ModalSubmitInteraction,
  type RoleSelectMenuInteraction,
  SectionComponent,
  type StringSelectMenuInteraction,
  type ThumbnailComponent,
  type TopLevelComponent,
  type UserSelectMenuInteraction,
} from 'discord.js';
import type { TFunction } from 'i18next';
import i18n from 'i18next';
import { nanoid } from 'nanoid';
import invariant from 'tiny-invariant';
import { type InvalidPredicateCallback, Predicate, type PredicateCheck } from './predicate.js';
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

export type ComponentCallback<TInteraction extends ComponentInteraction, TData> = (args: {
  interaction: TInteraction;
  data: TData;
  t: TFunction<'command-content'>;
  drop: () => void;
}) => Promise<void> | void;

export abstract class ComponentInstance<I extends ComponentInteraction, D> {
  public readonly identifier: string;

  protected readonly parent: Component<I, D>;
  public readonly data: D;

  constructor(parent: Component<I, D>, data: D) {
    this.parent = parent;
    this.data = data;
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

  protected dropComponentWithCustomId(id: string) {
    const split = Component.splitCustomId(id);
    if (split.status === 'SUCCESS') {
      registry.dropComponentId(split.instance);
    }
  }
}

export abstract class Component<I extends ComponentInteraction, D> {
  public readonly identifier: string;
  public readonly autoDestroy: boolean;
  public abstract readonly callback: ComponentCallback<I, any>;

  constructor(autoDestroy: boolean) {
    this.identifier = nanoid(20);
    this.autoDestroy = autoDestroy;
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
    | { status: 'INVALID_VERSION'; errorText: string; version: string } {
    if (id === ComponentKey.Throw) return { status: 'SPECIAL_KEY', key: ComponentKey.Throw };
    if (id === ComponentKey.Warn) return { status: 'SPECIAL_KEY', key: ComponentKey.Warn };
    if (id === ComponentKey.Ignore) return { status: 'SPECIAL_KEY', key: ComponentKey.Ignore };

    const [version, component, instance] = id.split(Component.DELIMITER);

    if (version !== Component.COMPONENT_VERSION) {
      return {
        status: 'INVALID_VERSION',
        errorText: `Component with version "${version}" used; expected "${Component.COMPONENT_VERSION}"`,
        version,
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
  public readonly predicate: ComponentPredicateConfig | null;

  constructor(parent: Component<I, D>, data: D, predicate: ComponentPredicateConfig | null) {
    super(parent, data);
    this.predicate = predicate;
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
    let ids: string[] | null = null;
    if (this.parent.autoDestroy) {
      ids = getAllCustomIds(interaction.message.components);
    }

    await this.parent.callback({
      interaction,
      data: this.data,
      drop: this.drop,
      t: i18n.getFixedT([interaction.locale, 'en-US'], 'command-content'),
    });

    if (this.parent.autoDestroy) {
      invariant(ids, '`ids` were set earlier in the function');

      for (const id of ids) {
        this.dropComponentWithCustomId(id);
      }
    }
  }
}

function getAllCustomIds(
  components: (TopLevelComponent | MessageActionRowComponent | ThumbnailComponent)[],
): string[] {
  const customIds: (string | null)[] = [];

  for (const component of components) {
    if (component instanceof ButtonComponent && component.customId) {
      customIds.push(component.customId);
    } else if (component instanceof BaseSelectMenuComponent) {
      customIds.push(component.customId);
    } else if (component instanceof ContainerComponent || component instanceof ActionRow) {
      customIds.push(...getAllCustomIds(component.components));
    } else if (component instanceof SectionComponent) {
      customIds.push(...getAllCustomIds(component.components));
      customIds.push(...getAllCustomIds([component.accessory]));
    }
  }
  return customIds.filter((c) => c !== null);
}

class ModalComponentInstance<
  I extends ModalSubmitInteraction<'cached'>,
  D,
> extends ComponentInstance<I, D> {
  public readonly predicate: ComponentPredicateConfig | null;

  constructor(parent: Component<I, D>, data: D, predicate: ComponentPredicateConfig | null) {
    super(parent, data);
    this.predicate = predicate;
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
      t: i18n.getFixedT([interaction.locale, 'en-US'], 'command-content'),
    });
  }
}

class MessageComponent<I extends MessageComponentInteraction<'cached'>, D> extends Component<I, D> {
  public readonly callback: ComponentCallback<I, any>;

  constructor(callback: ComponentCallback<I, any>, autoDestroy: boolean) {
    super(autoDestroy);
    this.callback = callback;
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
  public readonly callback: ComponentCallback<I, any>;

  constructor(callback: ComponentCallback<I, any>) {
    super(false);
    this.callback = callback;
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
  autoDestroy?: boolean;
  callback: ComponentCallback<ButtonInteraction<'cached'>, D>;
}): Component<ButtonInteraction<'cached'>, D>;
export function component<D = void>(args: {
  type: ComponentType.ChannelSelect;
  autoDestroy?: boolean;
  callback: ComponentCallback<ChannelSelectMenuInteraction<'cached'>, D>;
}): Component<ChannelSelectMenuInteraction<'cached'>, D>;
export function component<D = void>(args: {
  type: ComponentType.MentionableSelect;
  autoDestroy?: boolean;
  callback: ComponentCallback<MentionableSelectMenuInteraction<'cached'>, D>;
}): Component<MentionableSelectMenuInteraction<'cached'>, D>;
export function component<D = void>(args: {
  type: ComponentType.RoleSelect;
  autoDestroy?: boolean;
  callback: ComponentCallback<RoleSelectMenuInteraction<'cached'>, D>;
}): Component<RoleSelectMenuInteraction<'cached'>, D>;
export function component<D = void>(args: {
  type: ComponentType.StringSelect;
  autoDestroy?: boolean;
  callback: ComponentCallback<StringSelectMenuInteraction<'cached'>, D>;
}): Component<StringSelectMenuInteraction<'cached'>, D>;
export function component<D = void>(args: {
  type: ComponentType.UserSelect;
  autoDestroy?: boolean;
  callback: ComponentCallback<UserSelectMenuInteraction<'cached'>, D>;
}): Component<UserSelectMenuInteraction<'cached'>, D>;

export function component<D = void>(args: {
  type: ComponentType;
  autoDestroy?: boolean;
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
    args.autoDestroy ?? false,
  );
}

export function modal<D = void>(args: {
  callback: ComponentCallback<ModalSubmitInteraction<'cached'>, D>;
}) {
  return new ModalComponent(args.callback);
}
