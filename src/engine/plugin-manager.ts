/**
 * Plugin Manager
 * Demonstrates: Dynamic Plugin Loading, Type-safe Plugin System
 */

import type {
  Plugin,
  PluginMetadata,
  PluginCapability,
  PluginRegistry,
  NodeProviderPlugin,
  ValidatorPlugin,
  ExecutorPlugin
} from '../types/plugin';

export class PluginManager implements PluginRegistry {
  readonly plugins: Map<string, Plugin>;
  private capabilityIndex: Map<PluginCapability, Set<string>>;

  constructor() {
    this.plugins = new Map();
    this.capabilityIndex = new Map();
  }

  /**
   * Register a plugin
   */
  register<T extends Plugin>(plugin: T): void {
    if (this.plugins.has(plugin.metadata.id)) {
      throw new Error(`Plugin already registered: ${plugin.metadata.id}`);
    }

    // Initialize plugin
    const initResult = plugin.initialize();
    if (initResult instanceof Promise) {
      initResult.catch(err => {
        console.error(`Failed to initialize plugin ${plugin.metadata.id}:`, err);
      });
    }

    // Register plugin
    this.plugins.set(plugin.metadata.id, plugin);

    // Index by capabilities
    for (const capability of plugin.capabilities) {
      if (!this.capabilityIndex.has(capability)) {
        this.capabilityIndex.set(capability, new Set());
      }
      this.capabilityIndex.get(capability)!.add(plugin.metadata.id);
    }

    console.log(`Plugin registered: ${plugin.metadata.name} v${plugin.metadata.version}`);
  }

  /**
   * Unregister a plugin
   */
  unregister(pluginId: string): void {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      return;
    }

    // Cleanup plugin
    const cleanupResult = plugin.cleanup();
    if (cleanupResult instanceof Promise) {
      cleanupResult.catch(err => {
        console.error(`Failed to cleanup plugin ${pluginId}:`, err);
      });
    }

    // Remove from capability index
    for (const capability of plugin.capabilities) {
      this.capabilityIndex.get(capability)?.delete(pluginId);
    }

    // Remove plugin
    this.plugins.delete(pluginId);
    console.log(`Plugin unregistered: ${pluginId}`);
  }

  /**
   * Get a specific plugin
   */
  get<T extends Plugin>(pluginId: string): T | undefined {
    return this.plugins.get(pluginId) as T | undefined;
  }

  /**
   * Get all plugins with a specific capability
   */
  getByCapability<C extends PluginCapability>(capability: C): ReadonlyArray<Plugin<C>> {
    const pluginIds = this.capabilityIndex.get(capability) || new Set();
    const plugins: Plugin<C>[] = [];

    for (const id of pluginIds) {
      const plugin = this.plugins.get(id);
      if (plugin?.capabilities.includes(capability)) {
        plugins.push(plugin as Plugin<C>);
      }
    }

    return plugins;
  }

  /**
   * Check if a plugin is registered
   */
  has(pluginId: string): boolean {
    return this.plugins.has(pluginId);
  }

  /**
   * Get all registered plugins
   */
  getAllPlugins(): ReadonlyArray<Plugin> {
    return Array.from(this.plugins.values());
  }

  /**
   * Get plugin metadata
   */
  getMetadata(pluginId: string): PluginMetadata | undefined {
    return this.plugins.get(pluginId)?.metadata;
  }

  /**
   * List all plugins with their capabilities
   */
  listPlugins(): Array<{ metadata: PluginMetadata; capabilities: ReadonlyArray<PluginCapability> }> {
    return Array.from(this.plugins.values()).map(plugin => ({
      metadata: plugin.metadata,
      capabilities: plugin.capabilities
    }));
  }

  /**
   * Clear all plugins
   */
  clear(): void {
    for (const pluginId of Array.from(this.plugins.keys())) {
      this.unregister(pluginId);
    }
  }
}

// Global plugin manager instance
export const globalPluginManager = new PluginManager();