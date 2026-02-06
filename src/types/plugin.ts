/**
 * Plugin System with Module Augmentation
 * Demonstrates: Module Augmentation, Generic Constraints, Type-safe Extensibility
 */

import type {
  WorkflowNode,
  NodeCategory,
  InputPort,
  OutputPort,
  NodeId,
} from "./core";

// Plugin metadata
export interface PluginMetadata {
  readonly id: string;
  readonly name: string;
  readonly version: string;
  readonly author: string;
  readonly description: string;
  readonly tags: ReadonlyArray<string>;
}

// Plugin capabilities
export type PluginCapability =
  | "node-provider"
  | "validator"
  | "executor"
  | "transformer"
  | "ui-extension";

// Base plugin interface with generic constraints
export interface Plugin<
  TCapabilities extends PluginCapability = PluginCapability,
> {
  readonly metadata: PluginMetadata;
  readonly capabilities: ReadonlyArray<TCapabilities>;

  initialize(): Promise<void> | void;
  cleanup(): Promise<void> | void;
}

// Node provider plugin
export interface NodeProviderPlugin extends Plugin<"node-provider"> {
  readonly nodeTypes: ReadonlyArray<CustomNodeDefinition>;

  createNode(
    type: string,
    id: NodeId,
    position: { x: number; y: number },
  ): WorkflowNode;
  validateNode(node: WorkflowNode): boolean;
}

// Custom node definition for plugins
export interface CustomNodeDefinition {
  readonly type: string;
  readonly category: NodeCategory;
  readonly label: string;
  readonly description: string;
  readonly icon?: string;
  readonly inputs: ReadonlyArray<InputPort>;
  readonly outputs: ReadonlyArray<OutputPort>;
  readonly defaultData?: Record<string, unknown>;
}

// Validator plugin
export interface ValidatorPlugin extends Plugin<"validator"> {
  validate(graph: any): Promise<ValidationResult>;
}

interface ValidationResult {
  readonly valid: boolean;
  readonly errors: ReadonlyArray<string>;
}

// Executor plugin
export interface ExecutorPlugin extends Plugin<"executor"> {
  execute(
    node: WorkflowNode,
    inputs: Record<string, unknown>,
  ): Promise<Record<string, unknown>>;
  canExecute(nodeType: string): boolean;
}

// Transformer plugin
export interface TransformerPlugin extends Plugin<"transformer"> {
  transform(data: unknown, config: Record<string, unknown>): unknown;
}

// UI extension plugin
export interface UIExtensionPlugin extends Plugin<"ui-extension"> {
  readonly componentName: string;
  renderComponent(): React.ComponentType<any>;
}

// Plugin registry with type safety
export interface PluginRegistry {
  readonly plugins: ReadonlyMap<string, Plugin>;

  register<T extends Plugin>(plugin: T): void;
  unregister(pluginId: string): void;
  get<T extends Plugin>(pluginId: string): T | undefined;
  getByCapability<C extends PluginCapability>(
    capability: C,
  ): ReadonlyArray<Plugin<C>>;
  has(pluginId: string): boolean;
}

// Module augmentation for extending node types
declare module "./core" {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface NodeTypeRegistry {
    // Plugins can augment this interface to add their node types
    // This is intentionally empty to allow module augmentation
  }
}

// Plugin configuration
export interface PluginConfig {
  readonly enabled: boolean;
  readonly settings: Record<string, unknown>;
}

// Plugin lifecycle hooks
export interface PluginLifecycle {
  onBeforeInitialize?(): Promise<void> | void;
  onAfterInitialize?(): Promise<void> | void;
  onBeforeCleanup?(): Promise<void> | void;
  onAfterCleanup?(): Promise<void> | void;
}

// Type-safe plugin factory
export type PluginFactory<T extends Plugin = Plugin> = (
  config?: PluginConfig,
) => T;

// Plugin dependency declaration
export interface PluginDependency {
  readonly pluginId: string;
  readonly version: string;
  readonly optional: boolean;
}

// Advanced plugin with dependencies
export interface AdvancedPlugin extends Plugin {
  readonly dependencies: ReadonlyArray<PluginDependency>;
  readonly lifecycle: PluginLifecycle;
}

// Plugin event system
export type PluginEvent =
  | { readonly type: "node-created"; readonly nodeId: NodeId }
  | { readonly type: "node-deleted"; readonly nodeId: NodeId }
  | { readonly type: "edge-created"; readonly edgeId: string }
  | { readonly type: "edge-deleted"; readonly edgeId: string }
  | { readonly type: "graph-validated"; readonly valid: boolean }
  | { readonly type: "execution-started"; readonly workflowId: string }
  | { readonly type: "execution-completed"; readonly workflowId: string };

export interface PluginEventHandler {
  handleEvent(event: PluginEvent): Promise<void> | void;
}

// Generic plugin with type parameters
export interface GenericPlugin<
  TInput,
  TOutput,
  TConfig = Record<string, unknown>,
> extends Plugin {
  process(input: TInput, config: TConfig): Promise<TOutput> | TOutput;
}

// Constraint-based plugin typing
export type ConstrainedPlugin<T extends Plugin, C extends PluginCapability> =
  T extends Plugin<infer Caps> ? (C extends Caps ? T : never) : never;

// Plugin composition
export type ComposedPlugin<P1 extends Plugin, P2 extends Plugin> = Plugin<
  P1["capabilities"][number] | P2["capabilities"][number]
>;

// Type-safe plugin builder
export interface PluginBuilder<T extends Plugin = Plugin> {
  withMetadata(metadata: PluginMetadata): PluginBuilder<T>;
  withCapability<C extends PluginCapability>(
    capability: C,
  ): PluginBuilder<Plugin<C>>;
  withLifecycle(lifecycle: PluginLifecycle): PluginBuilder<T>;
  build(): T;
}
