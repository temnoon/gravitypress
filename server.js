// File: gravitypress/server.js
const express = require('express');
const path = require('path');
const config = require('./src/config/config.json');
//const polarGraphRouter = require('./src/api/polarGraph');
const polarGraphRouter = require('./src/api/polarGraph');
const notebookBuilderRouter = require('./src/api/notebookBuilder');

const app = express();

console.log('Current directory:', __dirname);
console.log('Config file path:', path.join(__dirname, 'src', 'config', 'config.json'));

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
console.log('Static file path:', path.join(__dirname, 'public'));

app.use(config.api.polarGraph, polarGraphRouter);
console.log('polarGraphRouter Initialized', path.join(__dirname, 'public'));
app.use(config.api.notebookBuilder, notebookBuilderRouter);
console.log('notebookBuilderRouterps  Initialized', path.join(__dirname, 'public'));

console.log('Static file path:', path.join(__dirname, 'public'));

const PORT = config.server.port || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});