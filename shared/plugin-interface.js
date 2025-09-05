/**
 * Plugin Interface Definition
 * Defines the contract that all plugins must implement
 */

class PluginInterface {
  constructor() {
    if (this.constructor === PluginInterface) {
      throw new Error('PluginInterface is an abstract class and cannot be instantiated directly');
    }
  }

  /**
   * Get plugin metadata
   * @returns {Object} Plugin metadata
   */
  getMetadata() {
    return {
      name: this.name,
      version: this.version,
      description: this.description,
      author: this.author,
      capabilities: this.capabilities || []
    };
  }

  /**
   * Initialize the plugin
   * @param {Object} context - Plugin context containing app, io, db, etc.
   */
  async init(context) {
    throw new Error('init() method must be implemented by plugin');
  }

  /**
   * Shutdown the plugin
   */
  async shutdown() {
    // Default implementation - override if needed
  }

  /**
   * Get plugin configuration schema
   * @returns {Object} JSON Schema for plugin configuration
   */
  getConfigSchema() {
    return null;
  }

  /**
   * Validate plugin configuration
   * @param {Object} config - Configuration object
   * @returns {boolean} True if valid
   */
  validateConfig(config) {
    return true;
  }
}

/**
 * Server Plugin Interface
 */
class ServerPlugin extends PluginInterface {
  constructor() {
    super();
    this.capabilities = ['server'];
  }

  /**
   * Initialize server-side plugin
   * @param {Object} context - Server context
   * @param {Express} context.app - Express application
   * @param {SocketIO} context.io - Socket.IO instance
   * @param {Database} context.db - Database instance
   */
  async init(context) {
    const { app, io, db } = context;

    // Setup API routes
    if (this.setupRoutes) {
      this.setupRoutes(app);
    }

    // Setup socket handlers
    if (this.setupSocketHandlers) {
      this.setupSocketHandlers(io);
    }

    // Setup database extensions
    if (this.setupDatabase) {
      this.setupDatabase(db);
    }
  }

  /**
   * Setup API routes for the plugin
   * @param {Express} app - Express application
   */
  setupRoutes(app) {
    // Override in subclass
  }

  /**
   * Setup Socket.IO handlers
   * @param {SocketIO} io - Socket.IO instance
   */
  setupSocketHandlers(io) {
    // Override in subclass
  }

  /**
   * Setup database extensions
   * @param {Database} db - Database instance
   */
  setupDatabase(db) {
    // Override in subclass
  }
}

/**
 * Client Plugin Interface
 */
class ClientPlugin extends PluginInterface {
  constructor() {
    super();
    this.capabilities = ['client'];
  }

  /**
   * Initialize client-side plugin
   * @param {Object} context - Client context
   * @param {React} context.React - React instance
   * @param {Object} context.app - Application instance
   */
  async init(context) {
    const { React, app } = context;

    // Register components
    if (this.getComponents) {
      const components = this.getComponents(React);
      this.registerComponents(app, components);
    }

    // Register routes
    if (this.getRoutes) {
      const routes = this.getRoutes(React);
      this.registerRoutes(app, routes);
    }

    // Setup event handlers
    if (this.setupEventHandlers) {
      this.setupEventHandlers(app);
    }
  }

  /**
   * Get React components provided by this plugin
   * @param {React} React - React instance
   * @returns {Object} Component map
   */
  getComponents(React) {
    return {};
  }

  /**
   * Get routes provided by this plugin
   * @param {React} React - React instance
   * @returns {Array} Route array
   */
  getRoutes(React) {
    return [];
  }

  /**
   * Register components with the application
   * @param {Object} app - Application instance
   * @param {Object} components - Component map
   */
  registerComponents(app, components) {
    if (app.registerComponents) {
      app.registerComponents(components);
    }
  }

  /**
   * Register routes with the application
   * @param {Object} app - Application instance
   * @param {Array} routes - Route array
   */
  registerRoutes(app, routes) {
    if (app.registerRoutes) {
      app.registerRoutes(routes);
    }
  }

  /**
   * Setup event handlers
   * @param {Object} app - Application instance
   */
  setupEventHandlers(app) {
    // Override in subclass
  }
}

/**
 * Electron Plugin Interface
 */
class ElectronPlugin extends PluginInterface {
  constructor() {
    super();
    this.capabilities = ['electron'];
  }

  /**
   * Initialize electron plugin
   * @param {Object} context - Electron context
   * @param {BrowserWindow} context.mainWindow - Main window instance
   * @param {App} context.app - Electron app instance
   */
  async init(context) {
    const { mainWindow, app } = context;

    // Setup IPC handlers
    if (this.setupIPCHandlers) {
      this.setupIPCHandlers(mainWindow);
    }

    // Setup menu extensions
    if (this.setupMenus) {
      this.setupMenus(app, mainWindow);
    }

    // Setup window extensions
    if (this.setupWindows) {
      this.setupWindows(app, mainWindow);
    }
  }

  /**
   * Setup IPC handlers
   * @param {BrowserWindow} mainWindow - Main window instance
   */
  setupIPCHandlers(mainWindow) {
    // Override in subclass
  }

  /**
   * Setup menu extensions
   * @param {App} app - Electron app instance
   * @param {BrowserWindow} mainWindow - Main window instance
   */
  setupMenus(app, mainWindow) {
    // Override in subclass
  }

  /**
   * Setup window extensions
   * @param {App} app - Electron app instance
   * @param {BrowserWindow} mainWindow - Main window instance
   */
  setupWindows(app, mainWindow) {
    // Override in subclass
  }
}

/**
 * Hybrid Plugin Interface (Server + Client)
 */
class HybridPlugin extends PluginInterface {
  constructor() {
    super();
    this.capabilities = ['server', 'client'];
  }

  /**
   * Initialize hybrid plugin
   * @param {Object} context - Combined context
   */
  async init(context) {
    const { server, client } = context;

    // Initialize server part
    if (server && this.initServer) {
      await this.initServer(server);
    }

    // Initialize client part
    if (client && this.initClient) {
      await this.initClient(client);
    }
  }

  /**
   * Initialize server-side functionality
   * @param {Object} context - Server context
   */
  async initServer(context) {
    // Override in subclass
  }

  /**
   * Initialize client-side functionality
   * @param {Object} context - Client context
  */
  async initClient(context) {
    // Override in subclass
  }
}

module.exports = {
  PluginInterface,
  ServerPlugin,
  ClientPlugin,
  ElectronPlugin,
  HybridPlugin
};