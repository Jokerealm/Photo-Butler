/**
 * 提示词模板服务测试
 * Template Service Tests
 */

import { TemplateService } from './TemplateService'
import { CreateTemplateRequest, PromptTemplate } from '../types/promptTemplate'

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

describe('TemplateService', () => {
  let service: TemplateService

  beforeEach(() => {
    localStorageMock.getItem.mockClear()
    localStorageMock.setItem.mockClear()
    service = new TemplateService()
  })

  describe('createTemplate', () => {
    it('should create a valid template', async () => {
      const request: CreateTemplateRequest = {
        title: 'Test Template',
        description: 'A test template for unit testing',
        content: 'This is a test prompt content that is long enough to pass validation',
        tags: ['test', 'unit-test']
      }

      const template = await service.createTemplate(request)

      expect(template.id).toBeDefined()
      expect(template.title).toBe(request.title)
      expect(template.description).toBe(request.description)
      expect(template.content).toBe(request.content)
      expect(template.tags).toEqual(request.tags)
      expect(template.createdAt).toBeDefined()
      expect(template.updatedAt).toBeDefined()
      expect(template.version).toBe(1)
    })

    it('should reject invalid template data', async () => {
      const request: CreateTemplateRequest = {
        title: '', // Invalid: empty title
        description: 'A test template',
        content: 'Test content',
        tags: []
      }

      await expect(service.createTemplate(request)).rejects.toThrow()
    })

    it('should sanitize input data', async () => {
      const request: CreateTemplateRequest = {
        title: '  Test Template  ',
        description: '  A test template  ',
        content: '  This is a test prompt content that is long enough  ',
        tags: ['  test  ', '  unit-test  ', '']
      }

      const template = await service.createTemplate(request)

      expect(template.title).toBe('Test Template')
      expect(template.description).toBe('A test template')
      expect(template.content).toBe('This is a test prompt content that is long enough')
      expect(template.tags).toEqual(['test', 'unit-test'])
    })
  })

  describe('getAllTemplates', () => {
    it('should return all templates', async () => {
      const request: CreateTemplateRequest = {
        title: 'Test Template',
        description: 'A test template',
        content: 'This is a test prompt content that is long enough',
        tags: ['test']
      }

      await service.createTemplate(request)
      const templates = await service.getAllTemplates()

      expect(templates).toHaveLength(1)
      expect(templates[0].title).toBe(request.title)
    })
  })

  describe('getTemplateById', () => {
    it('should return template by id', async () => {
      const request: CreateTemplateRequest = {
        title: 'Test Template',
        description: 'A test template',
        content: 'This is a test prompt content that is long enough',
        tags: ['test']
      }

      const created = await service.createTemplate(request)
      const found = await service.getTemplateById(created.id)

      expect(found).not.toBeNull()
      expect(found!.id).toBe(created.id)
      expect(found!.title).toBe(request.title)
    })

    it('should return null for non-existent id', async () => {
      const found = await service.getTemplateById('non-existent-id')
      expect(found).toBeNull()
    })
  })

  describe('updateTemplate', () => {
    it('should update template successfully', async () => {
      const request: CreateTemplateRequest = {
        title: 'Original Title',
        description: 'Original description',
        content: 'This is original content that is long enough',
        tags: ['original']
      }

      const created = await service.createTemplate(request)
      
      // Add a small delay to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 10))
      
      const updates = {
        title: 'Updated Title',
        tags: ['updated', 'modified']
      }

      const updated = await service.updateTemplate(created.id, updates)

      expect(updated.title).toBe(updates.title)
      expect(updated.description).toBe(request.description) // unchanged
      expect(updated.tags).toEqual(updates.tags)
      expect(new Date(updated.updatedAt).getTime()).toBeGreaterThan(new Date(created.updatedAt).getTime())
    })

    it('should reject updates to non-existent template', async () => {
      await expect(service.updateTemplate('non-existent-id', { title: 'New Title' }))
        .rejects.toThrow()
    })
  })

  describe('deleteTemplate', () => {
    it('should delete template successfully', async () => {
      const request: CreateTemplateRequest = {
        title: 'Test Template',
        description: 'A test template',
        content: 'This is a test prompt content that is long enough',
        tags: ['test']
      }

      const created = await service.createTemplate(request)
      await service.deleteTemplate(created.id)

      const found = await service.getTemplateById(created.id)
      expect(found).toBeNull()
    })

    it('should reject deletion of non-existent template', async () => {
      await expect(service.deleteTemplate('non-existent-id')).rejects.toThrow()
    })
  })

  describe('searchTemplates', () => {
    beforeEach(async () => {
      // Create test templates
      await service.createTemplate({
        title: 'Nature Photography',
        description: 'Beautiful landscape photos',
        content: 'A stunning landscape with mountains and rivers, professional photography',
        tags: ['nature', 'landscape', 'photography']
      })

      await service.createTemplate({
        title: 'Portrait Art',
        description: 'Artistic portrait paintings',
        content: 'A detailed portrait painting in renaissance style, oil on canvas',
        tags: ['portrait', 'art', 'painting']
      })

      await service.createTemplate({
        title: 'Urban Photography',
        description: 'City street photography',
        content: 'Urban street scene with modern architecture and people walking',
        tags: ['urban', 'street', 'photography']
      })
    })

    it('should search by query in title', async () => {
      const result = await service.searchTemplates({ query: 'Photography' })
      expect(result.templates).toHaveLength(2)
      expect(result.total).toBe(2)
    })

    it('should search by query in description', async () => {
      const result = await service.searchTemplates({ query: 'portrait' })
      expect(result.templates).toHaveLength(1)
      expect(result.templates[0].title).toBe('Portrait Art')
    })

    it('should filter by tags', async () => {
      const result = await service.searchTemplates({ tags: ['photography'] })
      expect(result.templates).toHaveLength(2)
    })

    it('should handle pagination', async () => {
      const result = await service.searchTemplates({ limit: 2, offset: 0 })
      expect(result.templates).toHaveLength(2)
      expect(result.hasMore).toBe(true)
    })
  })

  describe('filterByTags', () => {
    beforeEach(async () => {
      await service.createTemplate({
        title: 'Test 1',
        description: 'Description 1',
        content: 'Content 1 that is long enough for validation',
        tags: ['tag1', 'tag2']
      })

      await service.createTemplate({
        title: 'Test 2',
        description: 'Description 2',
        content: 'Content 2 that is long enough for validation',
        tags: ['tag2', 'tag3']
      })
    })

    it('should filter templates by tags', async () => {
      const filtered = await service.filterByTags(['tag1'])
      expect(filtered).toHaveLength(1)
      expect(filtered[0].title).toBe('Test 1')
    })

    it('should return templates with any of the specified tags', async () => {
      const filtered = await service.filterByTags(['tag1', 'tag3'])
      expect(filtered).toHaveLength(2)
    })

    it('should return all templates when no tags specified', async () => {
      const filtered = await service.filterByTags([])
      expect(filtered).toHaveLength(2)
    })
  })

  describe('getAvailableTags', () => {
    beforeEach(async () => {
      await service.createTemplate({
        title: 'Test 1',
        description: 'Description 1',
        content: 'Content 1 that is long enough for validation',
        tags: ['alpha', 'beta']
      })

      await service.createTemplate({
        title: 'Test 2',
        description: 'Description 2',
        content: 'Content 2 that is long enough for validation',
        tags: ['beta', 'gamma']
      })
    })

    it('should return all unique tags sorted', async () => {
      const tags = await service.getAvailableTags()
      expect(tags).toEqual(['alpha', 'beta', 'gamma'])
    })
  })

  describe('validateTemplate', () => {
    it('should validate correct template', async () => {
      const template: PromptTemplate = {
        id: 'test-id',
        title: 'Test Template',
        description: 'A test template',
        content: 'This is a test prompt content that is long enough',
        tags: ['test'],
        thumbnailPath: 'path/to/thumbnail.jpg',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: 1
      }

      const isValid = await service.validateTemplate(template)
      expect(isValid).toBe(true)
    })

    it('should reject invalid template', async () => {
      const template: PromptTemplate = {
        id: '',
        title: '',
        description: '',
        content: '',
        tags: [],
        thumbnailPath: '',
        createdAt: '',
        updatedAt: '',
        version: 0
      }

      const isValid = await service.validateTemplate(template)
      expect(isValid).toBe(false)
    })
  })

  describe('sanitizeTemplateData', () => {
    it('should sanitize valid data', () => {
      const data = {
        id: 'test-id',
        title: '  Test Template  ',
        description: '  A test template  ',
        content: '  This is a test prompt content that is long enough  ',
        tags: ['  test  ', '  unit-test  ', ''],
        thumbnailPath: 'path/to/thumbnail.jpg',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: 1
      }

      const sanitized = service.sanitizeTemplateData(data)

      expect(sanitized).not.toBeNull()
      expect(sanitized!.title).toBe('Test Template')
      expect(sanitized!.tags).toEqual(['test', 'unit-test'])
    })

    it('should return null for invalid data', () => {
      const data = {
        id: '',
        title: '',
        description: '',
        content: ''
      }

      const sanitized = service.sanitizeTemplateData(data)
      expect(sanitized).toBeNull()
    })
  })
})