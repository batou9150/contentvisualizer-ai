import React, { useState, useEffect } from 'react';
import { AppState, Branding } from '../types';
import { GeminiService } from '../services/geminiService';
import { DriveService } from '../services/driveService';
import { INITIAL_BRANDINGS, DEFAULT_BRANDING } from '../constants';
import { useAuth } from '../contexts/useAuth';

export const useContentAnalysis = () => {
  const { token } = useAuth();

  useEffect(() => {
    console.log('Current Auth Token:', token);
  }, [token]);

  const [state, setState] = useState<AppState>(() => {
    const savedBrandings = localStorage.getItem('brandings');
    const savedSelectedId = localStorage.getItem('selectedBrandingId');
    const brandings = savedBrandings ? JSON.parse(savedBrandings) : INITIAL_BRANDINGS;
    return {
      url: '',
      textContent: '',
      imagePreview: null,
      imageData: null,
      inputMode: 'url',
      loading: false,
      error: null,
      data: null,
      summaryImageUrl: null,
      mindmapImageUrl: null,
      isGeneratingSummaryImage: false,
      isGeneratingMindmapImage: false,
      imageSize: '2K',
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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1];
        setState(prev => ({
          ...prev,
          imagePreview: reader.result as string,
          imageData: { data: base64, mimeType: file.type }
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProcessInput = async (e: React.FormEvent) => {
    e.preventDefault();
    const { inputMode, url, textContent, imageData } = state;
    const input = inputMode === 'url' ? url : textContent;

    if (inputMode === 'image' && !imageData) return;
    if (inputMode !== 'image' && !input) return;

    setState(prev => ({
      ...prev,
      loading: true,
      error: null,
      data: null,
      summaryImageUrl: null,
      mindmapImageUrl: null
    }));

    try {
      const result = await GeminiService.processContent(input, inputMode, imageData || undefined);
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
    console.log('Attempting to upload to Drive:', fileName);
    if (!token?.access_token) {
      console.warn('No access token available for Drive upload.');
      return null;
    }
    try {
      const folderId = await DriveService.findOrCreateFolder('Content Visualizer AI', token.access_token);
      console.log('Folder ID:', folderId);
      const fileData = await DriveService.uploadImage(base64Data, fileName, token.access_token, folderId);
      console.log(`Uploaded ${fileName} to Google Drive. Response:`, fileData);
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
      const imageUrl = await GeminiService.generateInfographic(state.data.mermaidCode, state.imageSize, branding.prompt);

      const driveUrl = await uploadToDrive(imageUrl, `Mindmap_${Date.now()}.png`);
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
      const imageUrl = await GeminiService.generateDirectInfographic(state.data.summary, state.imageSize, branding.prompt);

      const driveUrl = await uploadToDrive(imageUrl, `Summary_${Date.now()}.png`);
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
    handleImageUpload,
    handleProcessInput,
    handleGenerateMindmapImage,
    handleGenerateSummaryImage
  };
};

