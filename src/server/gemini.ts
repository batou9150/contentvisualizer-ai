import { GoogleGenAI } from '@google/genai';
import { z } from 'zod';
import { env } from './env.ts';
import { AnalysisSchema, type AnalyzeResponse, type AspectRatio, type ImageSize } from '../shared/schemas.ts';
import { cleanMermaid, extractSources } from './parse.ts';

/**
 * All Gemini calls go through the Interactions API (recommended by Google for new development).
 * Runs server-side only: the API key never reaches the browser.
 */
const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });

/** The non-streaming result of interactions.create(). */
type Interaction = Extract<Awaited<ReturnType<typeof ai.interactions.create>>, { id: string }>;

const ANALYSIS_JSON_SCHEMA = z.toJSONSchema(AnalysisSchema);

const ANALYSIS_INSTRUCTIONS = `Your task:
1. Write a well-structured, professional executive summary in GitHub-flavored Markdown.
   - Organize it with "##" and "###" headings.
   - Use "- " bullet points for key takeaways, one per line.
   - Bold (**term**) the important concepts. Tables are allowed when they help.
   - Do NOT add an "Executive Summary" heading; the UI already shows that label.
2. Write a Mermaid.js mindmap of the content's structure.
   - Start with the line "mindmap", then a single root node like: root((Topic)).
   - Use 2-space indentation, 3-4 levels deep, short node labels.
   - Avoid parentheses, brackets, quotes and colons inside labels; they break Mermaid parsing.
3. Give the content a short title.
Answer in the same language as the source content.`;

export type AnalyzeInput =
  | { mode: 'url'; url: string }
  | { mode: 'text'; text: string }
  | { mode: 'file'; data: string; mimeType: string };

function buildInput(input: AnalyzeInput) {
  switch (input.mode) {
    case 'url':
      return `Read the web page at ${input.url} and extract its core concepts and hierarchy.\n\n${ANALYSIS_INSTRUCTIONS}`;
    case 'text':
      return `Analyze the following content and extract its core concepts and hierarchy.\n<content>\n${input.text}\n</content>\n\n${ANALYSIS_INSTRUCTIONS}`;
    case 'file':
      return [
        input.mimeType === 'application/pdf'
          ? { type: 'document' as const, mime_type: input.mimeType, data: input.data }
          : { type: 'image' as const, mime_type: input.mimeType, data: input.data },
        { type: 'text' as const, text:`Analyze the attached file and extract all core concepts, text and hierarchy.\n\n${ANALYSIS_INSTRUCTIONS}` },
      ];
  }
}

export async function analyze(input: AnalyzeInput): Promise<AnalyzeResponse> {
  const interaction = await ai.interactions.create({
    model: env.TEXT_MODEL,
    input: buildInput(input),
    // URL context reads the page itself; Google Search lets the model ground claims and follow references.
    tools: input.mode === 'url' ? [{ type: 'url_context' }, { type: 'google_search' }] : undefined,
    response_format: { type: 'text', mime_type: 'application/json', schema: ANALYSIS_JSON_SCHEMA },
    // Nothing to continue later, so don't keep user content on Google's side.
    store: false,
  });

  const parsed = AnalysisSchema.parse(JSON.parse(outputText(interaction)));
  return { ...parsed, mindmap: cleanMermaid(parsed.mindmap), sources: extractSources(interaction) };
}

export async function improveBrandingPrompt(name: string, prompt: string): Promise<string> {
  const interaction = await ai.interactions.create({
    model: env.TEXT_MODEL,
    input: `You are an expert prompt engineer for AI image generators.
Turn the visual branding concept below into a detailed, professional prompt for generating corporate infographics and slide visuals.
${name ? `Branding name: "${name}".` : ''}
Current description: "${prompt || 'Not provided'}"

If the description is empty or minimal, imagine a cohesive high-end style from the branding name.
Cover: artistic style, a precise color palette, composition and layout, typography, lighting and texture.
Keep it generic enough to apply to any content while preserving the style.
Return ONLY the improved prompt, without preamble or quotes.`,
    store: false,
  });
  return outputText(interaction).trim();
}

export interface GeneratedImage {
  data: string;
  mimeType: string;
  interactionId: string;
}

interface ImageOptions {
  imageSize: ImageSize;
  aspectRatio: AspectRatio;
}

export async function generateVisual(
  source: 'summary' | 'mindmap',
  content: string,
  brandingPrompt: string,
  opts: ImageOptions,
): Promise<GeneratedImage> {
  const body =
    source === 'mindmap'
      ? `Turn this Mermaid mindmap into an infographic slide:\n${content}`
      : `Turn this content into an infographic slide:\n${content}`;
  const input = `${brandingPrompt}\n---\n${body}`;
  // Stored (the API default) so refinements can continue from this exact image via previous_interaction_id.
  return createImage({ input }, opts);
}

/** Edits the previous image in place instead of regenerating from scratch. */
export function refineVisual(previousInteractionId: string, instruction: string, opts: ImageOptions) {
  return createImage(
    {
      input: `${instruction}\nKeep the same content, layout and branding unless the instruction says otherwise.`,
      previous_interaction_id: previousInteractionId,
    },
    opts,
  );
}

async function createImage(
  params: { input: string; previous_interaction_id?: string },
  { imageSize, aspectRatio }: ImageOptions,
): Promise<GeneratedImage> {
  const interaction = await ai.interactions.create({
    model: env.IMAGE_MODEL,
    ...params,
    response_format: { type: 'image', mime_type: 'image/jpeg', aspect_ratio: aspectRatio, image_size: imageSize },
  });

  const image = interaction.output_image;
  if (!image?.data) throw new Error('The model did not return an image');
  return { data: image.data, mimeType: image.mime_type ?? 'image/jpeg', interactionId: interaction.id };
}

function outputText(interaction: Interaction): string {
  const text = interaction.output_text;
  if (!text) throw new Error('The model returned an empty response');
  return text;
}
