import { z } from 'zod';
import { Branding } from '../../shared/schemas.ts';
import { useStoredState } from './storage.ts';

export const DEFAULT_BRANDINGS: Branding[] = [
  {
    id: 'corporate',
    name: 'Corporate',
    prompt:
      'Create a modern, clean corporate infographic slide on a pure white background. Tech-oriented, professional and airy. Use vibrant periwinkle/violet-blue for titles and diagram outlines, deep navy blue for solid accent blocks, and dark gray for body text. Clean geometric sans-serif typography throughout.',
  },
  {
    id: 'chibi',
    name: 'Chibi',
    prompt: 'Create an infographic in a Chibi-style corporate sketchnoting look: cute chibi characters, hand-drawn icons, marker lettering and soft pastel colors on an off-white paper background.',
  },
  {
    id: 'agentic',
    name: 'Agentic',
    prompt:
      'A futuristic 3D isometric infographic on a deep navy background. Glowing electric-violet nodes travel along crystalline cyan pathways connecting floating glass panels that hold the content. Clean vectors, high-tech, kinetic energy, depth of field, precise lighting.',
  },
  {
    id: 'educational',
    name: 'Educational',
    prompt:
      'An educational whiteboard-style illustration laid out as a numbered step-by-step guide. Cute thick-lined doodles and schematic drawings, bright primary colors on a clean white background. Playful and clear.',
  },
];

export function useBrandings() {
  const [brandings, setBrandings] = useStoredState('cv.brandings', z.array(Branding).min(1), DEFAULT_BRANDINGS);
  const [selectedId, setSelectedId] = useStoredState('cv.brandingId', z.string(), DEFAULT_BRANDINGS[0]!.id);
  const selected = brandings.find((b) => b.id === selectedId) ?? brandings[0]!;

  return {
    brandings,
    selected,
    select: setSelectedId,
    save(branding: Branding) {
      setBrandings((list) => (list.some((b) => b.id === branding.id) ? list.map((b) => (b.id === branding.id ? branding : b)) : [...list, branding]));
      setSelectedId(branding.id);
    },
    remove(id: string) {
      setBrandings((list) => (list.length > 1 ? list.filter((b) => b.id !== id) : list));
    },
    reset() {
      setBrandings(DEFAULT_BRANDINGS);
      setSelectedId(DEFAULT_BRANDINGS[0]!.id);
    },
  };
}

export type BrandingsApi = ReturnType<typeof useBrandings>;
