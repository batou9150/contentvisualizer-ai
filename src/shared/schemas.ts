import { z } from 'zod';

/** Shared between browser and server so both validate against the same contract. */

export const IMAGE_SIZES = ['512', '1K', '2K', '4K'] as const;
export const ASPECT_RATIOS = ['1:1', '2:3', '3:2', '3:4', '4:3', '4:5', '5:4', '9:16', '16:9', '21:9'] as const;
export const MAX_FILE_BYTES = 20 * 1024 * 1024;
export const ACCEPTED_FILE_TYPES = ['application/pdf', 'image/png', 'image/jpeg', 'image/webp', 'image/heic', 'image/heif'];

export const ImageSize = z.enum(IMAGE_SIZES);
export const AspectRatio = z.enum(ASPECT_RATIOS);
export type ImageSize = z.infer<typeof ImageSize>;
export type AspectRatio = z.infer<typeof AspectRatio>;

export const AnalyzeJsonBody = z.discriminatedUnion('mode', [
  z.object({ mode: z.literal('url'), url: z.url({ protocol: /^https?$/ }) }),
  z.object({ mode: z.literal('text'), text: z.string().trim().min(1).max(200_000) }),
]);

/** What Gemini must return (also used as the JSON schema sent to the model). */
export const AnalysisSchema = z.object({
  title: z.string().describe('A short title (max 8 words) for the content.'),
  summary: z.string().describe('Executive summary in GitHub-flavored Markdown.'),
  mindmap: z.string().describe('Mermaid.js mindmap source, starting with the line "mindmap". No code fences.'),
});
export type Analysis = z.infer<typeof AnalysisSchema>;

export interface Source {
  url: string;
  title?: string;
}

export interface AnalyzeResponse extends Analysis {
  sources: Source[];
}

export const VisualBody = z.object({
  source: z.enum(['summary', 'mindmap']),
  content: z.string().min(1).max(100_000),
  brandingPrompt: z.string().max(10_000),
  title: z.string().max(200).optional(),
  imageSize: ImageSize,
  aspectRatio: AspectRatio,
});

export const RefineBody = z.object({
  /** Opaque signed reference to the previous image interaction. */
  ref: z.string().min(1),
  instruction: z.string().trim().min(1).max(2_000),
  imageSize: ImageSize,
  aspectRatio: AspectRatio,
  title: z.string().max(200).optional(),
});

export interface VisualResponse {
  /** data: URL of the image. */
  image: string;
  /** Signed reference to pass back for refinements. */
  ref: string;
  drive?: { id: string; webViewLink?: string };
  driveError?: string;
}

export const ImprovePromptBody = z.object({
  name: z.string().max(200).default(''),
  prompt: z.string().max(10_000).default(''),
});

export const Branding = z.object({
  id: z.string(),
  name: z.string(),
  prompt: z.string(),
});
export type Branding = z.infer<typeof Branding>;

export interface HistoryItem {
  id: string;
  name: string;
  createdTime: string;
  webViewLink?: string;
  hasThumbnail: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  picture?: string;
}
