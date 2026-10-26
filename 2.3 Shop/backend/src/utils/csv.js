const csvCell = (value) => {
  let text = value === null || value === undefined ? '' : String(value);
  if (/^[\u0000-\u0020]*[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
};

const csvRow = (values) => values.map(csvCell).join(',') + '\r\n';

module.exports = { csvCell, csvRow };
