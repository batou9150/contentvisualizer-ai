export type ImageSize = '1K' | '2K' | '4K';
export type AspectRatio = '1:1' | '2:3' | '3:2' | '3:4' | '4:3' | '4:5' | '5:4' | '9:16' | '16:9' | '21:9';
export type InputMode = 'url' | 'text' | 'file';

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
  fileData: { data: string; mimeType: string } | null;
  inputMode: InputMode;
  loading: boolean;
  error: string | null;
  data: ProcessedData | null;
  summaryImageUrl: string | null;
  mindmapImageUrl: string | null;
  summaryDriveUrl: string | null;
  mindmapDriveUrl: string | null;
  isGeneratingSummaryImage: boolean;
  isGeneratingMindmapImage: boolean;
  imageSize: ImageSize;
  aspectRatio: AspectRatio;
  showRawMermaid: boolean;
  // Branding state
  brandings: Branding[];
  selectedBrandingId: string;
}
