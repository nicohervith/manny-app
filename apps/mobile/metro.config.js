const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../.."); // Sube a la raíz del monorepo

const config = getDefaultConfig(projectRoot);

// 1. Vigilar la raíz para encontrar node_modules
config.watchFolders = [workspaceRoot];

// 2. Priorizar node_modules local y luego el de la raíz
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];

module.exports = config;
