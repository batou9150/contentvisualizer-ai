
import React, { useEffect, useRef } from 'react';

declare var mermaid: any;

interface MermaidRendererProps {
  chart: string;
}

const MermaidRenderer: React.FC<MermaidRendererProps> = ({ chart }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current && chart) {
      mermaid.initialize({ startOnLoad: true, theme: 'neutral', securityLevel: 'loose' });
      // Clear previous rendering
      ref.current.removeAttribute('data-processed');
      ref.current.innerHTML = chart;
      try {
        mermaid.contentLoaded();
      } catch (e) {
        console.error("Mermaid rendering error:", e);
      }
    }
  }, [chart]);

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm overflow-hidden flex justify-center">
      <div className="mermaid w-full text-center" ref={ref}>
        {chart}
      </div>
    </div>
  );
};

export default MermaidRenderer;
