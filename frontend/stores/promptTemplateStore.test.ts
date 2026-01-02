/**
 * 提示词模板Store测试
 * Prompt Template Store Tests
 */

import { renderHook, act } from '@testing-library/react'
import { usePromptTemplateStore } from './promptTemplateStore'
import { PromptTemplate, CreateTemplateRequest } from '../types/promptTemplate'

// Mock the template service
jest.mock('../services/TemplateService', () => ({
  templateService: {
    getAllTemplates: jest.fn(),
    createTemplate: jest.fn(),
    updateTemplate: jest.fn(),
    deleteTemplate: jest.fn(),
    searchTemplates: jest.fn()
  }
}))

import { templateService } from '../services/TemplateService'

const mockTemplateService = templateService as jest.Mocked<typeof templateService>

describe('PromptTemplateStore', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Reset store state
    const { result } = renderHook(() => usePromptTemplateStore())
    act(() => {
      result.current.templates = []
      result.current.filteredTemplates = []
      result.current.loading = false
      result.current.error = null
      result.current.searchQuery = ''
      result.current.selectedTags = []
      result.current.selectedTemplate = null
    })
  })

  describe('loadTemplates', () => {
    it('should load templates successfully', async () => {
      const mockTemplates: PromptTemplate[] = [
        {
          id: 'template_1',
          title: 'Test Template',
          description: 'Test Description',
          content: 'Test content for prompt',
          tags: ['test', 'example'],
          thumbnailPath: '/test.jpg',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
          version: 1
        }
      ]

      mockTemplateService.getAllTemplates.mockResolvedValue(mockTemplates)

      const { result } = renderHook(() => usePromptTemplateStore())

      await act(async () => {
        await result.current.loadTemplates()
      })

      expect(result.current.templates).toEqual(mockTemplates)
      expect(result.current.filteredTemplates).toEqual(mockTemplates)
      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBe(null)
    })

    it('should handle load error', async () => {
      const errorMessage = 'Failed to load templates'
      mockTemplateService.getAllTemplates.mockRejectedValue(new Error(errorMessage))

      const { result } = renderHook(() => usePromptTemplateStore())

      await act(async () => {
        await result.current.loadTemplates()
      })

      expect(result.current.templates).toEqual([])
      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBe(errorMessage)
    })
  })

  describe('createTemplate', () => {
    it('should create template successfully', async () => {
      const createRequest: CreateTemplateRequest = {
        title: 'New Template',
        description: 'New Description',
        content: 'New content for prompt',
        tags: ['new', 'test']
      }

      const newTemplate: PromptTemplate = {
        id: 'template_new',
        title: createRequest.title,
        description: createRequest.description,
        content: createRequest.content,
        tags: createRequest.tags,
        thumbnailPath: 'placeholder.png',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        version: 1
      }

      mockTemplateService.createTemplate.mockResolvedValue(newTemplate)

      const { result } = renderHook(() => usePromptTemplateStore())

      let createdTemplate: PromptTemplate | undefined
      await act(async () => {
        createdTemplate = await result.current.createTemplate(createRequest)
      })

      expect(createdTemplate).toEqual(newTemplate)
      expect(result.current.templates).toContain(newTemplate)
      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBe(null)
    })

    it('should handle create error', async () => {
      const createRequest: CreateTemplateRequest = {
        title: 'New Template',
        description: 'New Description',
        content: 'New content for prompt',
        tags: ['new', 'test']
      }

      const errorMessage = 'Failed to create template'
      mockTemplateService.createTemplate.mockRejectedValue(new Error(errorMessage))

      const { result } = renderHook(() => usePromptTemplateStore())

      await act(async () => {
        try {
          await result.current.createTemplate(createRequest)
        } catch (error) {
          // Expected to throw
        }
      })

      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBe(errorMessage)
    })
  })

  describe('search and filter', () => {
    it('should filter templates by search query', () => {
      const templates: PromptTemplate[] = [
        {
          id: 'template_1',
          title: 'Nature Photography',
          description: 'Beautiful landscape photos',
          content: 'landscape, nature, mountains',
          tags: ['nature', 'photography'],
          thumbnailPath: '/nature.jpg',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
          version: 1
        },
        {
          id: 'template_2',
          title: 'Portrait Art',
          description: 'Artistic portrait styles',
          content: 'portrait, artistic, people',
          tags: ['portrait', 'art'],
          thumbnailPath: '/portrait.jpg',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
          version: 1
        }
      ]

      const { result } = renderHook(() => usePromptTemplateStore())

      act(() => {
        result.current.templates = templates
        result.current.setSearchQuery('nature')
      })

      expect(result.current.filteredTemplates).toHaveLength(1)
      expect(result.current.filteredTemplates[0].title).toBe('Nature Photography')
    })

    it('should filter templates by tags', () => {
      const templates: PromptTemplate[] = [
        {
          id: 'template_1',
          title: 'Nature Photography',
          description: 'Beautiful landscape photos',
          content: 'landscape, nature, mountains',
          tags: ['nature', 'photography'],
          thumbnailPath: '/nature.jpg',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
          version: 1
        },
        {
          id: 'template_2',
          title: 'Portrait Art',
          description: 'Artistic portrait styles',
          content: 'portrait, artistic, people',
          tags: ['portrait', 'art'],
          thumbnailPath: '/portrait.jpg',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
          version: 1
        }
      ]

      const { result } = renderHook(() => usePromptTemplateStore())

      act(() => {
        result.current.templates = templates
        result.current.toggleTag('photography')
      })

      expect(result.current.selectedTags).toContain('photography')
      expect(result.current.filteredTemplates).toHaveLength(1)
      expect(result.current.filteredTemplates[0].title).toBe('Nature Photography')
    })

    it('should clear tag filter', () => {
      const { result } = renderHook(() => usePromptTemplateStore())

      act(() => {
        result.current.selectedTags = ['nature', 'photography']
        result.current.clearTagFilter()
      })

      expect(result.current.selectedTags).toEqual([])
    })
  })

  describe('template selection', () => {
    it('should select and deselect template', () => {
      const template: PromptTemplate = {
        id: 'template_1',
        title: 'Test Template',
        description: 'Test Description',
        content: 'Test content for prompt',
        tags: ['test'],
        thumbnailPath: '/test.jpg',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        version: 1
      }

      const { result } = renderHook(() => usePromptTemplateStore())

      act(() => {
        result.current.selectTemplate(template)
      })

      expect(result.current.selectedTemplate).toEqual(template)

      act(() => {
        result.current.selectTemplate(null)
      })

      expect(result.current.selectedTemplate).toBe(null)
    })
  })

  describe('error handling', () => {
    it('should set and clear errors', () => {
      const { result } = renderHook(() => usePromptTemplateStore())

      act(() => {
        result.current.setError('Test error')
      })

      expect(result.current.error).toBe('Test error')

      act(() => {
        result.current.clearError()
      })

      expect(result.current.error).toBe(null)
    })
  })
})