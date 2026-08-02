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