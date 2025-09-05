/**
 * Plugin Loader
 * Handles discovery, loading, and management of plugins
 */

const fs = require('fs');
const path = require('path');
const { PluginInterface, ServerPlugin, ClientPlugin, ElectronPlugin, HybridPlugin } = require('./plugin-interface');

class PluginLoader {
  constructor(pluginDir = './plugins') {
    this.pluginDir = pluginDir;
    this.loadedPlugins = new Map();
    this.pluginConfigs = new Map();
    this.logger = console;
  }

  /**
   * Discover all available plugins
   * @returns {Array} Array of plugin info objects
   */
  discoverPlugins() {
    const plugins = [];

    try {
      if (!fs.existsSync(this.pluginDir)) {
        this.logger.warn(`Plugin directory ${this.pluginDir} does not exist`);
        return plugins;
      }

      const entries = fs.readdirSync(this.pluginDir, { withFileTypes: true });

      for (const entry of entries) {
        if (entry.isDirectory()) {
          const pluginPath = path.join(this.pluginDir, entry.name);
          const pluginInfo = this.getPluginInfo(pluginPath);

          if (pluginInfo) {
            plugins.push(pluginInfo);
          }
        }
      }
    } catch (error) {
      this.logger.error('Error discovering plugins:', error);
    }

    return plugins;
  }

  /**
   * Get plugin information from package.json
   * @param {string} pluginPath - Path to plugin directory
   * @returns {Object|null} Plugin info or null if invalid
   */
  getPluginInfo(pluginPath) {
    try {
      const packagePath = path.join(pluginPath, 'package.json');

      if (!fs.existsSync(packagePath)) {
        return null;
      }

      const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
      const mainFile = packageJson.main || 'plugin.js';
      const pluginMainPath = path.join(pluginPath, mainFile);

      if (!fs.existsSync(pluginMainPath)) {
        this.logger.warn(`Plugin main file not found: ${pluginMainPath}`);
        return null;
      }

      return {
        name: packageJson.name,
        version: packageJson.version,
        description: packageJson.description,
        author: packageJson.author,
        main: pluginMainPath,
        path: pluginPath,
        dependencies: packageJson.dependencies || {},
        pluginDependencies: packageJson.pluginDependencies || [],
        capabilities: packageJson.capabilities || []
      };
    } catch (error) {
      this.logger.error(`Error reading plugin info from ${pluginPath}:`, error);
      return null;
    }
  }

  /**
   * Load a plugin by name
   * @param {string} pluginName - Name of the plugin to load
   * @returns {Object|null} Loaded plugin instance or null
   */
  loadPlugin(pluginName) {
    try {
      const plugins = this.discoverPlugins();
      const pluginInfo = plugins.find(p => p.name === pluginName);

      if (!pluginInfo) {
        this.logger.error(`Plugin ${pluginName} not found`);
        return null;
      }

      return this.loadPluginFromInfo(pluginInfo);
    } catch (error) {
      this.logger.error(`Error loading plugin ${pluginName}:`, error);
      return null;
    }
  }

  /**
   * Load plugin from plugin info
   * @param {Object} pluginInfo - Plugin information
   * @returns {Object|null} Loaded plugin instance
   */
  loadPluginFromInfo(pluginInfo) {
    try {
      // Clear require cache to allow reloading
      delete require.cache[require.resolve(pluginInfo.main)];

      const PluginClass = require(pluginInfo.main);

      // Handle both class and object exports
      let pluginInstance;
      if (typeof PluginClass === 'function') {
        pluginInstance = new PluginClass();
      } else if (typeof PluginClass === 'object') {
        // Convert plain object to plugin instance
        pluginInstance = this.createPluginFromObject(PluginClass, pluginInfo);
      } else {
        throw new Error('Plugin must export a class or object');
      }

      // Validate plugin interface
      if (!(pluginInstance instanceof PluginInterface)) {
        this.logger.warn(`Plugin ${pluginInfo.name} does not extend PluginInterface`);
      }

      // Store plugin instance
      this.loadedPlugins.set(pluginInfo.name, {
        instance: pluginInstance,
        info: pluginInfo,
        status: 'loaded'
      });

      this.logger.info(`Plugin ${pluginInfo.name} v${pluginInfo.version} loaded successfully`);
      return pluginInstance;
    } catch (error) {
      this.logger.error(`Error loading plugin ${pluginInfo.name}:`, error);
      return null;
    }
  }

  /**
   * Create plugin instance from plain object
   * @param {Object} pluginObject - Plain plugin object
   * @param {Object} pluginInfo - Plugin information
   * @returns {Object} Plugin instance
   */
  createPluginFromObject(pluginObject, pluginInfo) {
    const capabilities = pluginInfo.capabilities || [];

    // Determine plugin type based on capabilities
    let PluginBaseClass;
    if (capabilities.includes('server') && capabilities.includes('client')) {
      PluginBaseClass = HybridPlugin;
    } else if (capabilities.includes('server')) {
      PluginBaseClass = ServerPlugin;
    } else if (capabilities.includes('client')) {
      PluginBaseClass = ClientPlugin;
    } else if (capabilities.includes('electron')) {
      PluginBaseClass = ElectronPlugin;
    } else {
      PluginBaseClass = PluginInterface;
    }

    // Create a dynamic class that extends the base and mixes in the object
    class DynamicPlugin extends PluginBaseClass {
      constructor() {
        super();
        // Copy properties from plugin object
        Object.assign(this, pluginObject);
      }
    }

    return new DynamicPlugin();
  }

  /**
   * Load all available plugins
   * @returns {Array} Array of loaded plugin instances
   */
  loadAllPlugins() {
    const plugins = this.discoverPlugins();
    const loadedPlugins = [];

    // Sort plugins by dependencies
    const sortedPlugins = this.sortPluginsByDependencies(plugins);

    for (const pluginInfo of sortedPlugins) {
      const plugin = this.loadPluginFromInfo(pluginInfo);
      if (plugin) {
        loadedPlugins.push(plugin);
      }
    }

    return loadedPlugins;
  }

  /**
   * Sort plugins by dependency order
   * @param {Array} plugins - Array of plugin info objects
   * @returns {Array} Sorted array of plugin info objects
   */
  sortPluginsByDependencies(plugins) {
    const pluginMap = new Map();
    const visited = new Set();
    const visiting = new Set();
    const sorted = [];

    // Create plugin map
    plugins.forEach(plugin => {
      pluginMap.set(plugin.name, plugin);
    });

    const visit = (pluginName) => {
      if (visited.has(pluginName)) return;
      if (visiting.has(pluginName)) {
        throw new Error(`Circular dependency detected: ${pluginName}`);
      }

      visiting.add(pluginName);

      const plugin = pluginMap.get(pluginName);
      if (plugin) {
        // Visit dependencies
        const dependencies = plugin.pluginDependencies || [];
        dependencies.forEach(dep => {
          if (pluginMap.has(dep)) {
            visit(dep);
          }
        });
      }

      visiting.delete(pluginName);
      visited.add(pluginName);
      if (plugin) {
        sorted.push(plugin);
      }
    };

    // Visit all plugins
    plugins.forEach(plugin => {
      if (!visited.has(plugin.name)) {
        visit(plugin.name);
      }
    });

    return sorted;
  }

  /**
   * Initialize a plugin with context
   * @param {string} pluginName - Name of the plugin
   * @param {Object} context - Context object (app, io, db, etc.)
   */
  async initializePlugin(pluginName, context) {
    const pluginData = this.loadedPlugins.get(pluginName);
    if (!pluginData) {
      throw new Error(`Plugin ${pluginName} not loaded`);
    }

    try {
      await pluginData.instance.init(context);
      pluginData.status = 'initialized';
      this.logger.info(`Plugin ${pluginName} initialized successfully`);
    } catch (error) {
      this.logger.error(`Error initializing plugin ${pluginName}:`, error);
      pluginData.status = 'error';
      throw error;
    }
  }

  /**
   * Initialize all loaded plugins
   * @param {Object} context - Context object
   */
  async initializeAllPlugins(context) {
    const promises = [];

    for (const [pluginName, pluginData] of this.loadedPlugins) {
      if (pluginData.status === 'loaded') {
        promises.push(this.initializePlugin(pluginName, context));
      }
    }

    await Promise.all(promises);
  }

  /**
   * Get loaded plugin by name
   * @param {string} pluginName - Name of the plugin
   * @returns {Object|null} Plugin instance or null
   */
  getPlugin(pluginName) {
    const pluginData = this.loadedPlugins.get(pluginName);
    return pluginData ? pluginData.instance : null;
  }

  /**
   * Get all loaded plugins
   * @returns {Map} Map of plugin name to plugin data
   */
  getAllPlugins() {
    return this.loadedPlugins;
  }

  /**
   * Unload a plugin
   * @param {string} pluginName - Name of the plugin
   */
  async unloadPlugin(pluginName) {
    const pluginData = this.loadedPlugins.get(pluginName);
    if (!pluginData) {
      return;
    }

    try {
      if (pluginData.instance.shutdown) {
        await pluginData.instance.shutdown();
      }
      this.loadedPlugins.delete(pluginName);
      this.logger.info(`Plugin ${pluginName} unloaded successfully`);
    } catch (error) {
      this.logger.error(`Error unloading plugin ${pluginName}:`, error);
    }
  }

  /**
   * Unload all plugins
   */
  async unloadAllPlugins() {
    const promises = [];

    for (const pluginName of this.loadedPlugins.keys()) {
      promises.push(this.unloadPlugin(pluginName));
    }

    await Promise.all(promises);
  }

  /**
   * Get plugin status
   * @param {string} pluginName - Name of the plugin
   * @returns {string} Plugin status
   */
  getPluginStatus(pluginName) {
    const pluginData = this.loadedPlugins.get(pluginName);
    return pluginData ? pluginData.status : 'not_loaded';
  }

  /**
   * Set logger
   * @param {Object} logger - Logger instance
   */
  setLogger(logger) {
    this.logger = logger;
  }
}

module.exports = PluginLoader;