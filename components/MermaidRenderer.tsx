import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

interface MermaidRendererProps {
  chart: string;
}

const MermaidRenderer: React.FC<MermaidRendererProps> = ({ chart }) => {
  const [svg, setSvg] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    mermaid.initialize({ startOnLoad: false, theme: 'neutral', securityLevel: 'loose' });
  }, []);

  useEffect(() => {
    const renderChart = async () => {
      if (chart) {
        try {
          const id = `mermaid-${Math.random().toString(36).substring(2, 9)}`;
          const { svg } = await mermaid.render(id, chart);
          setSvg(svg);
          setError(null);
        } catch (e: any) {
          console.error("Mermaid rendering error:", e);
          setError("Failed to render diagram. Please check the Mermaid code.");
        }
      }
    };
    renderChart();
  }, [chart]);

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm overflow-hidden flex justify-center">
      {error ? (
        <div className="text-red-500 text-sm font-mono whitespace-pre-wrap">{error}</div>
      ) : (
        <div 
          className="w-full text-center" 
          dangerouslySetInnerHTML={{ __html: svg }} 
        />
      )}
    </div>
  );
};

export default MermaidRenderer;
