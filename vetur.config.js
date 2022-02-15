// vetur.config.js
/** @type {import('vls').VeturConfig} */
module.exports = {
  // **optional** default: `{}`
  // override vscode settings
  // Notice: It only affects the settings used by Vetur.
  settings: {
    "vetur.useWorkspaceDependencies": true,
    "vetur.experimental.templateInterpolationService": true
  },
  // **optional** default: `[{ root: './' }]`
  // support monorepos
  projects: [
    './backend', // Shorthand for specifying only the project root location
    './ui.admin', // Shorthand for specifying only the project root location
    './ui.overlay', // Shorthand for specifying only the project root location
    './ui.login', // Shorthand for specifying only the project root location
  ]
}