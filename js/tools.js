const $ = id => document.getElementById(id);

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

function fmtBytes(n) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}

function loadImageFromFile(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };

    img.onerror = err => {
      URL.revokeObjectURL(url);
      reject(err);
    };

    img.src = url;
  });
}

function setupDrop(dropEl, inputEl, onFiles) {
  dropEl.addEventListener('click', () => inputEl.click());
  inputEl.addEventListener('change', e => {
    if (e.target.files.length) onFiles(e.target.files);
  });

  ['dragover', 'dragenter'].forEach(eventName => {
    dropEl.addEventListener(eventName, e => {
      e.preventDefault();
      dropEl.classList.add('drag');
    });
  });

  ['dragleave', 'drop'].forEach(eventName => {
    dropEl.addEventListener(eventName, e => {
      e.preventDefault();
      dropEl.classList.remove('drag');
    });
  });

  dropEl.addEventListener('drop', e => {
    if (e.dataTransfer.files.length) onFiles(e.dataTransfer.files);
  });
}

function createImageResizerTool() {
  const drop = $('t01drop');
  const input = $('t01input');
  const work = $('t01work');
  const canvas = $('t01canvas');
  const wI = $('t01w');
  const hI = $('t01h');
  const lock = $('t01lock');
  const stat = $('t01stat');
  const ctx = canvas.getContext('2d');
  let ratio = 1;
  let srcImg = null;
  let origFile = null;

  function reset() {
    ratio = 1;
    srcImg = null;
    origFile = null;
    work.hidden = true;
    input.value = '';
    wI.value = '';
    hI.value = '';
    lock.checked = true;
    stat.textContent = '';
    canvas.width = 1;
    canvas.height = 1;
    ctx.clearRect(0, 0, 1, 1);
  }

  setupDrop(drop, input, async files => {
    origFile = files[0];
    srcImg = await loadImageFromFile(origFile);
    ratio = srcImg.width / srcImg.height;
    wI.value = srcImg.width;
    hI.value = srcImg.height;
    canvas.width = srcImg.width;
    canvas.height = srcImg.height;
    ctx.drawImage(srcImg, 0, 0);
    work.hidden = false;
    stat.textContent = `Loaded: ${srcImg.width}×${srcImg.height} — ${fmtBytes(origFile.size)}`;
  });

  wI.addEventListener('input', () => {
    if (lock.checked) hI.value = Math.round(wI.value / ratio);
  });

  hI.addEventListener('input', () => {
    if (lock.checked) wI.value = Math.round(hI.value * ratio);
  });

  $('t01go').addEventListener('click', () => {
    if (!srcImg) {
      stat.textContent = 'Load an image first.';
      return;
    }

    const w = parseInt(wI.value, 10);
    const h = parseInt(hI.value, 10);

    if (!Number.isFinite(w) || !Number.isFinite(h) || w < 1 || h < 1) {
      stat.textContent = 'Enter valid width and height.';
      return;
    }

    canvas.width = w;
    canvas.height = h;
    ctx.drawImage(srcImg, 0, 0, w, h);
    canvas.toBlob(blob => {
      if (!blob) {
        stat.textContent = 'Could not create resized image.';
        return;
      }

      downloadBlob(blob, `resized-${origFile?.name || 'image.png'}`);
      stat.textContent = `Resized to ${w}×${h} — ${fmtBytes(blob.size)} — downloaded`;
    });
  });

  return { reset };
}

function createFormatConverterTool() {
  const drop = $('t02drop');
  const input = $('t02input');
  const work = $('t02work');
  const canvas = $('t02canvas');
  const fmt = $('t02fmt');
  const quality = $('t02q');
  const stat = $('t02stat');
  const ctx = canvas.getContext('2d');
  let origFile = null;

  function reset() {
    origFile = null;
    work.hidden = true;
    input.value = '';
    stat.textContent = '';
    canvas.width = 1;
    canvas.height = 1;
    ctx.clearRect(0, 0, 1, 1);
    fmt.value = 'image/png';
    quality.value = 90;
  }

  setupDrop(drop, input, async files => {
    origFile = files[0];
    const img = await loadImageFromFile(origFile);
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);
    work.hidden = false;
  });

  $('t02go').addEventListener('click', () => {
    if (!origFile) {
      stat.textContent = 'Load an image first.';
      return;
    }

    const format = fmt.value;
    const q = Number(quality.value) / 100;

    canvas.toBlob(blob => {
      if (!blob) {
        stat.textContent = 'Could not convert image.';
        return;
      }

      const ext = format.split('/')[1];
      downloadBlob(blob, `converted.${ext}`);
      stat.textContent = `${origFile.name} (${fmtBytes(origFile.size)}) → .${ext} (${fmtBytes(blob.size)})`;
    }, format, q);
  });

  return { reset };
}

function createJsonFormatterTool() {
  const input = $('t03in');
  const output = $('t03out');
  const stat = $('t03stat');

  function reset() {
    input.value = '';
    output.value = '';
    stat.className = 'stat';
    stat.textContent = '';
  }

  function run(minify) {
    try {
      const parsed = JSON.parse(input.value);
      output.value = minify ? JSON.stringify(parsed) : JSON.stringify(parsed, null, 2);
      stat.className = 'stat';
      stat.innerHTML = '<b>valid JSON</b>';
    } catch (error) {
      stat.className = 'stat warn';
      stat.textContent = `Invalid JSON: ${error.message}`;
      output.value = '';
    }
  }

  $('t03fmt').addEventListener('click', () => run(false));
  $('t03min').addEventListener('click', () => run(true));

  return { reset };
}

function createHashGeneratorTool() {
  const alg = $('t04alg');
  const text = $('t04text');
  const output = $('t04out');

  function reset() {
    alg.value = 'SHA-256';
    text.value = '';
    output.value = '';
  }

  async function hashBuffer(buf, algorithm) {
    const hashBuf = await crypto.subtle.digest(algorithm, buf);
    return Array.from(new Uint8Array(hashBuf)).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  $('t04hashtext').addEventListener('click', async () => {
    output.value = await hashBuffer(new TextEncoder().encode(text.value), alg.value);
  });

  setupDrop($('t04drop'), $('t04input'), async files => {
    output.value = await hashBuffer(await files[0].arrayBuffer(), alg.value);
  });

  $('t04copy').addEventListener('click', () => {
    if (output.value) navigator.clipboard.writeText(output.value);
  });

  return { reset };
}

function parseCSV(csv) {
  const lines = csv.trim().split(/\r?\n/).filter(line => line.trim().length);
  if (!lines.length) return [];

  const headers = lines[0].split(',').map(header => header.trim());
  return lines.slice(1).map(line => {
    const values = line.split(',');
    const item = {};
    headers.forEach((header, index) => {
      item[header] = (values[index] || '').trim();
    });
    return item;
  });
}

function toCSV(arr) {
  if (!Array.isArray(arr) || !arr.length) {
    throw new Error('Expected a non-empty JSON array of objects');
  }

  const headers = Object.keys(arr[0]);
  const rows = arr.map(item => headers.map(header => (item[header] ?? '').toString()).join(','));
  return [headers.join(','), ...rows].join('\n');
}

function createCsvJsonTool() {
  const input = $('t05in');
  const output = $('t05out');

  function reset() {
    input.value = '';
    output.value = '';
  }

  $('t05toJson').addEventListener('click', () => {
    try {
      output.value = JSON.stringify(parseCSV(input.value || ''), null, 2);
    } catch (error) {
      output.value = `Error: ${error.message}`;
    }
  });

  $('t05toCsv').addEventListener('click', () => {
    try {
      output.value = toCSV(JSON.parse(input.value || ''));
    } catch (error) {
      output.value = `Error: ${error.message}`;
    }
  });

  $('t05dl').addEventListener('click', () => {
    const trimmed = output.value.trim();
    if (!trimmed) return;

    const isJson = trimmed.startsWith('[') || trimmed.startsWith('{');
    const blob = new Blob([output.value], { type: isJson ? 'application/json' : 'text/csv' });
    downloadBlob(blob, isJson ? 'output.json' : 'output.csv');
  });

  return { reset };
}

function createTextInspectorTool() {
  const text = $('t06in');

  function update() {
    const value = text.value;
    $('t06chars').textContent = value.length;
    $('t06words').textContent = (value.trim().match(/\S+/g) || []).length;
    $('t06sent').textContent = (value.match(/[.!?]+(\s|$)/g) || []).length;
    $('t06lines').textContent = value.split(/\r?\n/).length;
  }

  function reset() {
    text.value = '';
    update();
  }

  text.addEventListener('input', update);
  $('t06upper').addEventListener('click', () => {
    text.value = text.value.toUpperCase();
    update();
  });
  $('t06lower').addEventListener('click', () => {
    text.value = text.value.toLowerCase();
    update();
  });
  $('t06title').addEventListener('click', () => {
    text.value = text.value.replace(/\w\S*/g, word => word[0].toUpperCase() + word.slice(1).toLowerCase());
    update();
  });
  $('t06sentence').addEventListener('click', () => {
    const lower = text.value.toLowerCase();
    text.value = lower.replace(/(^\s*\w|[.!?]\s*\w)/g, character => character.toUpperCase());
    update();
  });

  return { reset };
}

const TOOLS = [
  { code: 'T01', name: 'Image Resizer', desc: 'Scale an image to exact dimensions or by percentage.', init: createImageResizerTool },
  { code: 'T02', name: 'Format Converter', desc: 'Convert between PNG, JPEG and WebP.', init: createFormatConverterTool },
  { code: 'T03', name: 'JSON Formatter', desc: 'Validate, pretty-print, or minify JSON.', init: createJsonFormatterTool },
  { code: 'T04', name: 'Hash Generator', desc: 'SHA-1 / SHA-256 / SHA-384 / SHA-512 for files or text.', init: createHashGeneratorTool },
  { code: 'T05', name: 'CSV ⇄ JSON', desc: 'Convert tabular CSV to JSON and back.', init: createCsvJsonTool },
  { code: 'T06', name: 'Text Inspector', desc: 'Word/char counts and case conversion.', init: createTextInspectorTool }
].map(tool => {
  const instance = tool.init();
  return {
    code: tool.code,
    name: tool.name,
    desc: tool.desc,
    reset: instance.reset
  };
});

export { TOOLS };