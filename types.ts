export type ImageSize = '1K' | '2K' | '4K';
export type InputMode = 'url' | 'text' | 'image';

export interface Source {
  url: string;
  title?: string;
}

export interface ProcessedData {
  summary: string;
  mermaidCode: string;
  sources?: Source[];
}

export interface Branding {
  id: string;
  name: string;
  prompt: string;
}

export interface AppState {
  url: string;
  textContent: string;
  imagePreview: string | null;
  imageData: { data: string; mimeType: string } | null;
  inputMode: InputMode;
  loading: boolean;
  error: string | null;
  data: ProcessedData | null;
  summaryImageUrl: string | null;
  mindmapImageUrl: string | null;
  isGeneratingSummaryImage: boolean;
  isGeneratingMindmapImage: boolean;
  imageSize: ImageSize;
  showRawMermaid: boolean;
  // Branding state
  brandings: Branding[];
  selectedBrandingId: string;
}
