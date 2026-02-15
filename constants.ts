import { Branding } from './types';

export const DEFAULT_BRANDING: Branding = {
  id: 'default',
  name: 'CORPORATE',
  prompt: `Create a modern, clean corporate infographic slide visual on a pure white background. The aesthetic is tech-oriented, professional, and airy. The color palette must strictly use vibrant periwinkle/violet-blue for main titles and diagram outlines, a deep navy blue for solid accent blocks, and dark gray for body text. Use a clean, geometric sans-serif typography throughout.`
};

export const CHIBI_BRANDING: Branding = {
  id: 'chibi-style',
  name: 'CHIBI',
  prompt: 'Create an infographic with Chibi-style Corporate Sketchnoting'
};

export const AGENTIC_BRANDING: Branding = {
  id: 'agentic-style',
  name: 'AGENTIC',
  prompt: 'A futuristic 3D abstract composition representing Agentic AI. Sharp isometric view. A glowing electric violet node moves along a crystalline cyan pathway, connecting floating glass squares that represent data tasks. Deep navy background. Clean vectors, high-tech, kinetic energy, depth of field, 8k resolution, precise lighting.'
};

export const EDUCATIONAL_BRANDING: Branding = {
  id: 'educational-style',
  name: 'EDUCATIONAL',
  prompt: 'An educational whiteboard-style illustration. The layout is a step-by-step vertical guide numbered. Features cute, thick-lined doodles and schematic drawings. specific visual focus on [Specific Items, e.g., plants and sun]. Bright primary colors against a clean white background. playful and clear.'
};

export const INITIAL_BRANDINGS: Branding[] = [DEFAULT_BRANDING, CHIBI_BRANDING, AGENTIC_BRANDING, EDUCATIONAL_BRANDING];
