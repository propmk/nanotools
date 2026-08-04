import { TOOLS } from './tools.js';

const $ = id => document.getElementById(id);
const toolByCode = new Map(TOOLS.map(tool => [tool.code, tool]));
const toolPanes = new Map(TOOLS.map(tool => [tool.code, document.getElementById(`tool-${tool.code.toLowerCase()}`)]));

function resetAllTools() {
  TOOLS.forEach(tool => tool.reset?.());
}

function hideAllPanes() {
  toolPanes.forEach(pane => {
    pane.hidden = true;
  });
}

function openTool(code) {
  const tool = toolByCode.get(code);
  const pane = toolPanes.get(code);

  if (!tool || !pane) {
    return;
  }

  resetAllTools();
  hideAllPanes();

  $('benchCode').textContent = tool.code;
  $('benchName').textContent = tool.name;
  pane.hidden = false;
  $('bench').classList.add('open');
  pane.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function closeTool() {
  $('bench').classList.remove('open');
  hideAllPanes();
  $('toolboard').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

document.querySelectorAll('[data-tool]').forEach(button => {
  button.addEventListener('click', () => openTool(button.dataset.tool));
});

$('backBtn').addEventListener('click', closeTool);

TOOLS.forEach(tool => tool.init?.());
resetAllTools();
hideAllPanes();