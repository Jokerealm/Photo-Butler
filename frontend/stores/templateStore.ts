import { create } from 'zustand';
import { Template, TemplateListResponse, TemplateSearchResponse } from '../types';

interface TemplateStore {
  // State
  templates: Template[];
  filteredTemplates: Template[];
  searchQuery: string;
  loading: boolean;
  error: string | null;
  selectedTemplate: Template | null;
  showModal: boolean;

  // Actions
  setTemplates: (templates: Template[]) => void;
  setFilteredTemplates: (templates: Template[]) => void;
  setSearchQuery: (query: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSelectedTemplate: (template: Template | null) => void;
  setShowModal: (show: boolean) => void;
  searchTemplates: (query: string) => void;
  clearSearch: () => void;
  selectTemplate: (template: Template) => void;
  closeModal: () => void;
}

export const useTemplateStore = create<TemplateStore>((set, get) => ({
  // Initial state
  templates: [],
  filteredTemplates: [],
  searchQuery: '',
  loading: false,
  error: null,
  selectedTemplate: null,
  showModal: false,

  // Actions
  setTemplates: (templates) => set({ templates, filteredTemplates: templates }),
  
  setFilteredTemplates: (filteredTemplates) => set({ filteredTemplates }),
  
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  
  setLoading: (loading) => set({ loading }),
  
  setError: (error) => set({ error }),
  
  setSelectedTemplate: (selectedTemplate) => set({ selectedTemplate }),
  
  setShowModal: (showModal) => set({ showModal }),
  
  searchTemplates: (query) => {
    const { templates } = get();
    const filtered = query.trim() === '' 
      ? templates 
      : templates.filter(template => 
          template.name.toLowerCase().includes(query.toLowerCase()) ||
          (template.description && template.description.toLowerCase().includes(query.toLowerCase())) ||
          template.prompt.toLowerCase().includes(query.toLowerCase()) ||
          (template.tags && template.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase())))
        );
    
    set({ 
      searchQuery: query, 
      filteredTemplates: filtered 
    });
  },
  
  clearSearch: () => {
    const { templates } = get();
    set({ 
      searchQuery: '', 
      filteredTemplates: templates 
    });
  },
  
  selectTemplate: (template) => set({ 
    selectedTemplate: template, 
    showModal: true 
  }),
  
  closeModal: () => set({ 
    selectedTemplate: null, 
    showModal: false 
  }),
}));