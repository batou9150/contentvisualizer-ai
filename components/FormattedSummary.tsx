import React from 'react';

interface FormattedSummaryProps {
  text: string;
}

const FormattedSummary: React.FC<FormattedSummaryProps> = ({ text }) => {
  const lines = text.split('
');
  const elements: React.ReactNode[] = [];

  const parseInline = (content: string) => {
    const parts = content.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, j) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={j} className="text-gray-900 dark:text-white font-bold">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  let i = 0;
  while (i < lines.length) {
    const line = lines[i].trim();
    if (!line) {
      elements.push(<div key={`empty-${i}`} className="h-2" />);
      i++;
      continue;
    }

    const headerMatch = line.match(/^(#{1,6})\s+(.*)$/);
    if (headerMatch) {
      const level = headerMatch[1].length;
      const content = headerMatch[2];
      const renderedHeaderContent = parseInline(content);
      if (level === 1) elements.push(<h1 key={i} className="text-3xl font-bold text-gray-900 dark:text-white mt-8 mb-4">{renderedHeaderContent}</h1>);
      else if (level === 2) elements.push(<h2 key={i} className="text-2xl font-bold text-gray-900 dark:text-white mt-6 mb-3">{renderedHeaderContent}</h2>);
      else if (level === 3) elements.push(<h3 key={i} className="text-xl font-bold text-indigo-700 dark:text-indigo-400 mt-6 mb-2">{renderedHeaderContent}</h3>);
      else if (level === 4) elements.push(<h4 key={i} className="text-lg font-bold text-gray-800 dark:text-slate-200 mt-4 mb-2 border-l-4 border-indigo-200 dark:border-indigo-900 pl-3">{renderedHeaderContent}</h4>);
      else elements.push(<h5 key={i} className="text-base font-bold text-gray-700 dark:text-slate-400 mt-3 mb-1 uppercase tracking-wide">{renderedHeaderContent}</h5>);
      i++;
      continue;
    }

    if (line.startsWith('|')) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        tableLines.push(lines[i].trim());
        i++;
      }
      if (tableLines.length >= 2) {
        const hasDivider = tableLines[1].includes('---');
        const startIdx = hasDivider ? 2 : 1;
        const getCells = (row: string) => row.split('|').map(c => c.trim()).filter((c, idx, arr) => (idx > 0 && idx < arr.length - 1) || (idx === 0 && c !== "") || (idx === arr.length - 1 && c !== ""));
        const headers = getCells(tableLines[0]);
        const bodyRows = tableLines.slice(startIdx).map(row => getCells(row));
        elements.push(
          <div key={`table-${i}`} className="my-6 overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
              <thead className="bg-gray-50 dark:bg-slate-800">
                <tr>
                  {headers.map((h, hidx) => (
                    <th key={hidx} className="px-4 py-3 text-left font-bold text-gray-900 dark:text-white uppercase tracking-wider">{parseInline(h)}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-900 divide-y divide-gray-100 dark:divide-gray-800">
                {bodyRows.map((row, ridx) => (
                  <tr key={ridx} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                    {row.map((cell, cidx) => (
                      <td key={cidx} className="px-4 py-3 text-gray-600 dark:text-slate-300 whitespace-nowrap">{parseInline(cell)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        continue;
      }
    }

    const isBullet = line.startsWith('* ') || line.startsWith('- ');
    if (isBullet) {
      const content = line.slice(2);
      elements.push(
        <div key={i} className="flex gap-3 pl-2 group">
          <span className="text-indigo-500 dark:text-indigo-400 font-bold mt-1 flex-shrink-0 transition-transform group-hover:scale-125">•</span>
          <span className="text-gray-600 dark:text-slate-300 leading-relaxed">{parseInline(content)}</span>
        </div>
      );
      i++;
      continue;
    }

    elements.push(<p key={i} className="text-gray-600 dark:text-slate-300 leading-relaxed">{parseInline(line)}</p>);
    i++;
  }
  return <div className="space-y-4">{elements}</div>;
};

export default FormattedSummary;
