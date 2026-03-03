import React, { useState, useEffect } from 'react';
import { AppState, Branding } from '../types';
import { GeminiService } from '../services/geminiService';
import { DriveService } from '../services/driveService';
import { INITIAL_BRANDINGS, DEFAULT_BRANDING, DRIVE_FOLDER_NAME, MAX_FILE_SIZE_BYTES } from '../constants';
import { useTokenRetry } from './useTokenRetry';

export const useContentAnalysis = () => {
  const { withTokenRetry, hasToken } = useTokenRetry();


  const [state, setState] = useState<AppState>(() => {
    const savedBrandings = localStorage.getItem('brandings');
    const savedSelectedId = localStorage.getItem('selectedBrandingId');
    const brandings = savedBrandings ? JSON.parse(savedBrandings) : INITIAL_BRANDINGS;
    return {
      url: '',
      textContent: '',
      imagePreview: null,
      fileData: null,
      fileName: null,
      fileSize: null,
      inputMode: 'url',
      loading: false,
      error: null,
      data: null,
      summaryImageUrl: null,
      mindmapImageUrl: null,
      isGeneratingSummaryImage: false,
      isGeneratingMindmapImage: false,
      imageSize: '2K',
      aspectRatio: '16:9',
      showRawMermaid: false,
      brandings,
      selectedBrandingId: savedSelectedId || DEFAULT_BRANDING.id,
    };
  });

  useEffect(() => {
    localStorage.setItem('brandings', JSON.stringify(state.brandings));
    localStorage.setItem('selectedBrandingId', state.selectedBrandingId);
  }, [state.brandings, state.selectedBrandingId]);

  const getSelectedBranding = () => {
    return state.brandings.find(b => b.id === state.selectedBrandingId) || state.brandings[0] || DEFAULT_BRANDING;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE_BYTES) {
      const maxMB = MAX_FILE_SIZE_BYTES / (1024 * 1024);
      const fileMB = (file.size / (1024 * 1024)).toFixed(1);
      setState(prev => ({
        ...prev,
        error: `File is too large (${fileMB} MB). Maximum allowed size is ${maxMB} MB.`,
        imagePreview: null,
        fileData: null,
        fileName: null,
        fileSize: null,
      }));
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = (reader.result as string).split(',')[1];
      const isImage = file.type.startsWith('image/');
      setState(prev => ({
        ...prev,
        error: null,
        imagePreview: isImage ? (reader.result as string) : null,
        fileData: { data: base64, mimeType: file.type },
        fileName: file.name,
        fileSize: file.size,
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleProcessInput = async (e: React.FormEvent) => {
    e.preventDefault();
    const { inputMode, url, textContent, fileData } = state;
    const input = inputMode === 'url' ? url : textContent;

    if (inputMode === 'file' && !fileData) return;
    if (inputMode !== 'file' && !input) return;

    setState(prev => ({
      ...prev,
      loading: true,
      error: null,
      data: null,
      summaryImageUrl: null,
      mindmapImageUrl: null
    }));

    try {
      const result = await GeminiService.processContent(input, inputMode, fileData || undefined);
      setState(prev => ({ ...prev, data: result, loading: false }));
    } catch (err: any) {
      console.error(err);
      setState(prev => ({
        ...prev,
        error: `Failed to analyze. Please check your input.`,
        loading: false
      }));
    }
  };

  const uploadToDrive = async (base64Data: string, fileName: string) => {
    if (!hasToken) {
      console.warn('No access token available for Drive upload.');
      return null;
    }

    try {
      const folderId = await withTokenRetry((t) => DriveService.findOrCreateFolder(DRIVE_FOLDER_NAME, t));
      const fileData = await withTokenRetry((t) => DriveService.uploadImage(base64Data, fileName, t, folderId));
      return fileData.webViewLink;
    } catch (err) {
      console.error('Failed to upload to Google Drive:', err);
      return null;
    }
  };

  const handleGenerateMindmapImage = async () => {
    if (!state.data) return;
    try {
      setState(prev => ({ ...prev, isGeneratingMindmapImage: true, error: null, mindmapDriveUrl: null }));
      const branding = getSelectedBranding();
      const imageUrl = await GeminiService.generateInfographic(state.data.mermaidCode, state.imageSize, state.aspectRatio, branding.prompt);

      const driveUrl = await uploadToDrive(imageUrl, `Mindmap_${Date.now()}`);
      console.log('Mindmap Drive URL:', driveUrl);

      setState(prev => ({
        ...prev,
        mindmapImageUrl: imageUrl,
        mindmapDriveUrl: driveUrl,
        isGeneratingMindmapImage: false
      }));
    } catch (err: any) {
      console.error(err);
      setState(prev => ({ ...prev, error: "Image generation failed.", isGeneratingMindmapImage: false }));
    }
  };

  const handleGenerateSummaryImage = async () => {
    if (!state.data) return;
    try {
      setState(prev => ({ ...prev, isGeneratingSummaryImage: true, error: null, summaryDriveUrl: null }));
      const branding = getSelectedBranding();
      const imageUrl = await GeminiService.generateDirectInfographic(state.data.summary, state.imageSize, state.aspectRatio, branding.prompt);

      const driveUrl = await uploadToDrive(imageUrl, `Summary_${Date.now()}`);
      console.log('Summary Drive URL:', driveUrl);

      setState(prev => ({
        ...prev,
        summaryImageUrl: imageUrl,
        summaryDriveUrl: driveUrl,
        isGeneratingSummaryImage: false
      }));
    } catch (err: any) {
      console.error(err);
      setState(prev => ({ ...prev, error: "Image generation failed.", isGeneratingSummaryImage: false }));
    }
  };

  return {
    state,
    setState,
    handleFileUpload,
    handleProcessInput,
    handleGenerateMindmapImage,
    handleGenerateSummaryImage
  };
};
