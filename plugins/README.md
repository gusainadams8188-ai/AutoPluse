# Automotive Dashboard Plugin System

This document describes the modular plugin architecture for the Automotive Diagnostic Dashboard.

## Overview

The plugin system allows developers to extend the functionality of the dashboard without modifying the core codebase. Plugins can add new features, integrate with external services, provide custom visualizations, and extend diagnostic capabilities.

## Plugin Types

### 1. Diagnostic Plugins
- Add new diagnostic commands and protocols
- Extend existing OEM support
- Provide custom diagnostic algorithms

### 2. Visualization Plugins
- Add new chart types and data visualizations
- Create custom dashboard widgets
- Provide specialized data analysis views

### 3. Data Export Plugins
- Support additional export formats (CSV, PDF, etc.)
- Integrate with external data services
- Provide custom data transformation

### 4. Integration Plugins
- Connect to external APIs and services
- Add notification systems
- Provide cloud synchronization

## Plugin Structure

Each plugin must follow this structure:

```
plugins/
├── my-plugin/
│   ├── package.json          # Plugin metadata and dependencies
│   ├── plugin.js            # Main plugin entry point
│   ├── server/              # Server-side code (optional)
│   ├── client/              # Client-side code (optional)
│   ├── electron/            # Electron-specific code (optional)
│   └── config/              # Configuration files (optional)
```

## Plugin Interface

All plugins must export an object with the following structure:

```javascript
module.exports = {
  name: 'My Plugin',
  version: '1.0.0',
  description: 'Plugin description',
  author: 'Plugin Author',

  // Plugin capabilities
  capabilities: ['diagnostic', 'visualization'],

  // Server-side hooks
  server: {
    init: async (app, io, db) => { /* initialization code */ },
    routes: (app) => { /* add API routes */ },
    socketHandlers: (io) => { /* add socket handlers */ }
  },

  // Client-side hooks
  client: {
    init: (app) => { /* client initialization */ },
    components: { /* React components */ },
    routes: [ /* additional routes */ ]
  },

  // Electron hooks
  electron: {
    init: (mainWindow) => { /* electron initialization */ }
  },

  // Plugin configuration
  config: {
    schema: { /* configuration schema */ },
    defaults: { /* default values */ }
  }
}
```

## Plugin Lifecycle

1. **Discovery**: Plugins are discovered from the `plugins/` directory
2. **Loading**: Plugin metadata is loaded and validated
3. **Initialization**: Plugins are initialized in dependency order
4. **Activation**: Plugins are activated and their hooks are executed
5. **Runtime**: Plugins run and provide their functionality
6. **Shutdown**: Plugins are gracefully shut down

## Development

### Creating a Plugin

1. Create a new directory in `plugins/`
2. Add a `package.json` with plugin metadata
3. Implement the plugin interface in `plugin.js`
4. Add server, client, and electron code as needed
5. Test the plugin in development mode

### Plugin Dependencies

Plugins can specify dependencies on other plugins:

```json
{
  "name": "advanced-diagnostics",
  "dependencies": {
    "basic-diagnostics": "^1.0.0"
  }
}
```

## API Reference

### Server API

- `app`: Express application instance
- `io`: Socket.IO instance
- `db`: Database instance

### Client API

- `app`: React application instance
- Component registration
- Route registration

### Electron API

- `mainWindow`: Electron BrowserWindow instance
- IPC communication helpers

## Examples

See the `examples/` directory for complete plugin examples.

## Best Practices

1. Use semantic versioning
2. Provide comprehensive documentation
3. Handle errors gracefully
4. Follow the established code style
5. Test plugins thoroughly
6. Use TypeScript for better development experience