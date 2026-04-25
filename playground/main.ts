import { Grainient } from '../src';

const canvas = document.getElementById('canvas') as HTMLCanvasElement;
const colorsEl = document.getElementById('colors') as HTMLDivElement;
const addBtn = document.getElementById('add-color') as HTMLButtonElement;
const removeBtn = document.getElementById('remove-color') as HTMLButtonElement;
const speedEl = document.getElementById('speed') as HTMLInputElement;
const grainEl = document.getElementById('grain') as HTMLInputElement;
const scaleEl = document.getElementById('scale') as HTMLInputElement;
const meshEl = document.getElementById('mesh') as HTMLInputElement;
const smoothnessEl = document.getElementById('smoothness') as HTMLInputElement;
const seedEl = document.getElementById('seed') as HTMLInputElement;
const toggleBtn = document.getElementById('toggle') as HTMLButtonElement;

const valueSpans = {
  speed: document.getElementById('speed-v')!,
  grain: document.getElementById('grain-v')!,
  scale: document.getElementById('scale-v')!,
  mesh: document.getElementById('mesh-v')!,
  smoothness: document.getElementById('smoothness-v')!,
  seed: document.getElementById('seed-v')!,
};

let colors = ['#ff008a', '#7928ca', '#2af598', '#009efd'];
let running = true;

const gradient = new Grainient(canvas, { colors });

function renderColorInputs() {
  colorsEl.innerHTML = '';
  colors.forEach((hex, i) => {
    const input = document.createElement('input');
    input.type = 'color';
    input.value = hex;
    input.addEventListener('input', () => {
      colors[i] = input.value;
      gradient.update({ colors });
    });
    colorsEl.appendChild(input);
  });
}
renderColorInputs();

addBtn.addEventListener('click', () => {
  if (colors.length >= 8) return;
  colors = [...colors, '#ffffff'];
  gradient.update({ colors });
  renderColorInputs();
});

removeBtn.addEventListener('click', () => {
  if (colors.length <= 2) return;
  colors = colors.slice(0, -1);
  gradient.update({ colors });
  renderColorInputs();
});

function bind(el: HTMLInputElement, key: 'speed' | 'grain' | 'scale' | 'mesh' | 'smoothness' | 'seed') {
  el.addEventListener('input', () => {
    const v = parseFloat(el.value);
    valueSpans[key].textContent = String(v);
    gradient.update({ [key]: v });
  });
}
bind(speedEl, 'speed');
bind(grainEl, 'grain');
bind(scaleEl, 'scale');
bind(meshEl, 'mesh');
bind(smoothnessEl, 'smoothness');
bind(seedEl, 'seed');

toggleBtn.addEventListener('click', () => {
  running = !running;
  if (running) gradient.start();
  else gradient.pause();
  toggleBtn.textContent = running ? 'Pause' : 'Resume';
});
