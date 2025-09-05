/**
 * Client-side Plugin Loader
 * Handles loading and managing plugins in the React application
 */

import React from 'react';

class ClientPluginLoader {
  constructor() {
    this.loadedPlugins = new Map();
    this.pluginComponents = new Map();
    this.pluginRoutes = new Map();
    this.eventHandlers = new Map();
    this.logger = console;
  }

  /**
   * Discover available plugins from server
   * @returns {Promise<Array>} Array of plugin info objects
   */
  async discoverPlugins() {
    try {
      const response = await fetch('http://localhost:3001/api/plugins');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const plugins = await response.json();
      return plugins;
    } catch (error) {
      this.logger.error('Error discovering plugins:', error);
      return [];
    }
  }

  /**
   * Load plugin components dynamically
   * @param {string} pluginName - Name of the plugin
   * @returns {Promise<Object|null>} Loaded plugin components or null
   */
  async loadPluginComponents(pluginName) {
    try {
      // Try to load plugin from different possible locations
      const possiblePaths = [
        `/plugins/${pluginName}/client/index.js`,
        `/plugins/${pluginName}/client/plugin.js`,
        `/plugins/${pluginName}/index.js`
      ];

      for (const path of possiblePaths) {
        try {
          const module = await import(path);
          return module.default || module;
        } catch {
          // Continue to next path
        }
      }

      this.logger.warn(`Could not load components for plugin ${pluginName}`);
      return null;
    } catch (error) {
      this.logger.error(`Error loading plugin components ${pluginName}:`, error);
      return null;
    }
  }

  /**
   * Register plugin components
   * @param {string} pluginName - Name of the plugin
   * @param {Object} components - Component map
   */
  registerComponents(pluginName, components) {
    this.pluginComponents.set(pluginName, components);
    this.logger.info(`Registered components for plugin ${pluginName}`);
  }

  /**
   * Register plugin routes
   * @param {string} pluginName - Name of the plugin
   * @param {Array} routes - Route array
   */
  registerRoutes(pluginName, routes) {
    this.pluginRoutes.set(pluginName, routes);
    this.logger.info(`Registered routes for plugin ${pluginName}`);
  }

  /**
   * Register event handlers
   * @param {string} pluginName - Name of the plugin
   * @param {Object} handlers - Event handler map
   */
  registerEventHandlers(pluginName, handlers) {
    this.eventHandlers.set(pluginName, handlers);
    this.logger.info(`Registered event handlers for plugin ${pluginName}`);
  }

  /**
   * Get all registered components
   * @returns {Map} Map of plugin name to components
   */
  getAllComponents() {
    return this.pluginComponents;
  }

  /**
   * Get all registered routes
   * @returns {Map} Map of plugin name to routes
   */
  getAllRoutes() {
    return this.pluginRoutes;
  }

  /**
   * Get component by plugin and component name
   * @param {string} pluginName - Name of the plugin
   * @param {string} componentName - Name of the component
   * @returns {React.Component|null} Component or null
   */
  getComponent(pluginName, componentName) {
    const components = this.pluginComponents.get(pluginName);
    return components ? components[componentName] : null;
  }

  /**
   * Render plugin component
   * @param {string} pluginName - Name of the plugin
   * @param {string} componentName - Name of the component
   * @param {Object} props - Props to pass to component
   * @returns {React.Element|null} Rendered component or null
   */
  renderComponent(pluginName, componentName, props = {}) {
    const Component = this.getComponent(pluginName, componentName);
    if (!Component) {
      this.logger.warn(`Component ${componentName} not found in plugin ${pluginName}`);
      return null;
    }

    return React.createElement(Component, props);
  }

  /**
   * Initialize plugin on client side
   * @param {string} pluginName - Name of the plugin
   * @param {Object} context - Client context
   */
  async initializePlugin(pluginName, context = {}) {
    try {
      const components = await this.loadPluginComponents(pluginName);
      if (!components) {
        this.logger.warn(`No components found for plugin ${pluginName}`);
        return;
      }

      // Initialize plugin if it has an init function
      if (typeof components.init === 'function') {
        await components.init({
          ...context,
          registerComponents: (comps) => this.registerComponents(pluginName, comps),
          registerRoutes: (routes) => this.registerRoutes(pluginName, routes),
          registerEventHandlers: (handlers) => this.registerEventHandlers(pluginName, handlers)
        });
      }

      // Auto-register components and routes if they exist
      if (components.components) {
        this.registerComponents(pluginName, components.components);
      }

      if (components.routes) {
        this.registerRoutes(pluginName, components.routes);
      }

      this.loadedPlugins.set(pluginName, {
        components,
        status: 'initialized'
      });

      this.logger.info(`Plugin ${pluginName} initialized on client`);
    } catch (error) {
      this.logger.error(`Error initializing plugin ${pluginName} on client:`, error);
    }
  }

  /**
   * Load and initialize all available plugins
   * @param {Object} context - Client context
   */
  async loadAllPlugins(context = {}) {
    try {
      const plugins = await this.discoverPlugins();

      for (const plugin of plugins) {
        if (plugin.capabilities && plugin.capabilities.includes('client')) {
          await this.initializePlugin(plugin.name, context);
        }
      }
    } catch (error) {
      this.logger.error('Error loading plugins on client:', error);
    }
  }

  /**
   * Unload plugin
   * @param {string} pluginName - Name of the plugin
   */
  unloadPlugin(pluginName) {
    this.pluginComponents.delete(pluginName);
    this.pluginRoutes.delete(pluginName);
    this.eventHandlers.delete(pluginName);
    this.loadedPlugins.delete(pluginName);
    this.logger.info(`Plugin ${pluginName} unloaded from client`);
  }

  /**
   * Get plugin status
   * @param {string} pluginName - Name of the plugin
   * @returns {string} Plugin status
   */
  getPluginStatus(pluginName) {
    const plugin = this.loadedPlugins.get(pluginName);
    return plugin ? plugin.status : 'not_loaded';
  }

  /**
   * Emit event to plugin handlers
   * @param {string} eventName - Name of the event
   * @param {Object} data - Event data
   */
  emitEvent(eventName, data = {}) {
    for (const [pluginName, handlers] of this.eventHandlers) {
      if (handlers[eventName]) {
        try {
          handlers[eventName](data);
        } catch (error) {
          this.logger.error(`Error in event handler ${eventName} for plugin ${pluginName}:`, error);
        }
      }
    }
  }

  /**
   * Set logger
   * @param {Object} logger - Logger instance
   */
  setLogger(logger) {
    this.logger = logger;
  }
}

// Create singleton instance
const clientPluginLoader = new ClientPluginLoader();

export default clientPluginLoader;