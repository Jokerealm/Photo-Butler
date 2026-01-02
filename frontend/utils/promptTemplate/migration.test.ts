/**
 * 数据迁移功能测试
 * Data Migration Functionality Tests
 */

import { executeFullMigration, handleMigrationExceptions } from './executeMigration'
import { migrationService } from './migrationService'

// Mock localStorage for testing
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString()
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    }
  }
})()

// Mock fetch for testing
const fetchMock = jest.fn()

// Setup mocks
beforeAll(() => {
  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock
  })
  
  global.fetch = fetchMock
})

beforeEach(() => {
  localStorageMock.clear()
  fetchMock.mockClear()
})

describe('Migration Service', () => {
  describe('getMigrationStatus', () => {
    it('should return correct status when no data exists', async () => {
      const status = await migrationService.getMigrationStatus()
      
      expect(status.hasMigrated).toBe(false)
      expect(status.templateCount).toBe(0)
      expect(status.lastMigrationTime).toBeUndefined()
    })
    
    it('should return correct status when data exists', async () => {
      const mockData = {
        version: '1.0.0',
        generatedAt: '2024-01-01T00:00:00.000Z',
        totalTemplates: 2,
        templates: [
          { id: 'test1', title: 'Test 1', content: 'Content 1', tags: [], thumbnailPath: '/test1.png', createdAt: '2024-01-01T00:00:00.000Z', updatedAt: '2024-01-01T00:00:00.000Z', version: 1, description: 'Test description 1' },
          { id: 'test2', title: 'Test 2', content: 'Content 2', tags: [], thumbnailPath: '/test2.png', createdAt: '2024-01-01T00:00:00.000Z', updatedAt: '2024-01-01T00:00:00.000Z', version: 1, description: 'Test description 2' }
        ]
      }
      
      localStorageMock.setItem('promptTemplates', JSON.stringify(mockData))
      
      const status = await migrationService.getMigrationStatus()
      
      expect(status.hasMigrated).toBe(true)
      expect(status.templateCount).toBe(2)
      expect(status.lastMigrationTime).toBe('2024-01-01T00:00:00.000Z')
    })
  })
  
  describe('needsMigration', () => {
    it('should return true when no data exists', async () => {
      const needsMigration = await migrationService.needsMigration()
      expect(needsMigration).toBe(true)
    })
    
    it('should return false when valid data exists', async () => {
      const mockData = {
        templates: [
          { id: 'test1', title: 'Test 1', content: 'Content 1' }
        ]
      }
      
      localStorageMock.setItem('promptTemplates', JSON.stringify(mockData))
      
      const needsMigration = await migrationService.needsMigration()
      expect(needsMigration).toBe(false)
    })
  })
  
  describe('validateMigration', () => {
    it('should validate correct template data', async () => {
      const mockData = {
        templates: [
          {
            id: 'test1',
            title: 'Test Template',
            description: 'Test description',
            content: 'This is test content for validation',
            tags: ['test'],
            thumbnailPath: '/test.png',
            createdAt: '2024-01-01T00:00:00.000Z',
            updatedAt: '2024-01-01T00:00:00.000Z',
            version: 1
          }
        ]
      }
      
      localStorageMock.setItem('promptTemplates', JSON.stringify(mockData))
      
      const validation = await migrationService.validateMigration()
      
      expect(validation.isValid).toBe(true)
      expect(validation.errors).toHaveLength(0)
      expect(validation.templateCount).toBe(1)
    })
    
    it('should detect invalid template data', async () => {
      const mockData = {
        templates: [
          {
            id: 'test1',
            // Missing required fields
            content: 'Test content'
          }
        ]
      }
      
      localStorageMock.setItem('promptTemplates', JSON.stringify(mockData))
      
      const validation = await migrationService.validateMigration()
      
      expect(validation.isValid).toBe(false)
      expect(validation.errors.length).toBeGreaterThan(0)
      expect(validation.templateCount).toBe(1)
    })
  })
  
  describe('clearMigrationData', () => {
    it('should clear all migration data', async () => {
      // Set up some data
      localStorageMock.setItem('promptTemplates', 'test data')
      localStorageMock.setItem('promptTemplates_backup_123', 'backup data')
      
      const success = await migrationService.clearMigrationData()
      
      expect(success).toBe(true)
      expect(localStorageMock.getItem('promptTemplates')).toBeNull()
      expect(localStorageMock.getItem('promptTemplates_backup_123')).toBeNull()
    })
  })
})

describe('Migration Execution', () => {
  describe('handleMigrationExceptions', () => {
    it('should detect localStorage issues', async () => {
      // Mock localStorage to throw error
      const originalSetItem = localStorageMock.setItem
      localStorageMock.setItem = jest.fn(() => {
        throw new Error('Storage quota exceeded')
      })
      
      const result = await handleMigrationExceptions()
      
      expect(result.success).toBe(false)
      expect(result.recoveryActions).toContain(
        expect.stringContaining('localStorage不可用')
      )
      
      // Restore original function
      localStorageMock.setItem = originalSetItem
    })
    
    it('should detect file access issues', async () => {
      fetchMock.mockRejectedValue(new Error('Network error'))
      
      const result = await handleMigrationExceptions()
      
      expect(result.success).toBe(false)
      expect(result.recoveryActions.length).toBeGreaterThan(0)
    })
    
    it('should pass when no issues detected', async () => {
      // Mock successful responses
      fetchMock.mockResolvedValue({
        ok: true,
        status: 200
      })
      
      const result = await handleMigrationExceptions()
      
      expect(result.success).toBe(true)
      expect(result.recoveryActions).toHaveLength(0)
    })
  })
  
  describe('executeFullMigration', () => {
    it('should handle validation-only mode', async () => {
      const mockData = {
        templates: [
          {
            id: 'test1',
            title: 'Test Template',
            description: 'Test description',
            content: 'This is test content for validation',
            tags: ['test'],
            thumbnailPath: '/test.png',
            createdAt: '2024-01-01T00:00:00.000Z',
            updatedAt: '2024-01-01T00:00:00.000Z',
            version: 1
          }
        ]
      }
      
      localStorageMock.setItem('promptTemplates', JSON.stringify(mockData))
      
      const result = await executeFullMigration({
        validateOnly: true
      })
      
      expect(result.success).toBe(true)
      expect(result.validationResult).toBeDefined()
      expect(result.validationResult.isValid).toBe(true)
      expect(result.result).toBeUndefined() // No migration should be performed
    })
    
    it('should handle migration when no data exists', async () => {
      // Mock successful file fetch
      const mockPromptContent = `1. 测试模板：这是一个测试提示词内容，用于验证迁移功能。
2. 另一个测试：这是第二个测试模板，包含更多内容。`
      
      fetchMock.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(mockPromptContent)
      })
      
      const result = await executeFullMigration({
        filePath: '/prompt/prompt.txt'
      })
      
      expect(result.success).toBe(true)
      expect(result.result).toBeDefined()
      expect(result.result!.success).toBe(true)
      expect(result.result!.templatesCreated).toBeGreaterThan(0)
    })
    
    it('should handle file access errors gracefully', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      })
      
      const result = await executeFullMigration({
        filePath: '/nonexistent/file.txt'
      })
      
      expect(result.success).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })
  })
})

describe('Integration Tests', () => {
  it('should perform complete migration workflow', async () => {
    // Mock successful file fetch with real prompt content
    const mockPromptContent = `1. 雨夜等车：将图片编辑为三宫格胶片质感艺术感写真。场景为雨夜的城市街道、公交车站，人物（女性）。
2. 酒店出浴：日常人像摄影，气质御姐浴袍自拍风格，酒店浴室场景。`
    
    fetchMock.mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(mockPromptContent)
    })
    
    // Execute full migration
    const result = await executeFullMigration({
      filePath: '/prompt/prompt.txt',
      forceRemigration: true
    })
    
    expect(result.success).toBe(true)
    expect(result.result).toBeDefined()
    expect(result.result!.success).toBe(true)
    expect(result.result!.templatesCreated).toBe(2)
    
    // Verify templates were created correctly
    const templates = result.result!.templates
    expect(templates).toHaveLength(2)
    
    const firstTemplate = templates[0]
    expect(firstTemplate.title).toContain('雨夜等车')
    expect(firstTemplate.content).toContain('三宫格胶片质感')
    expect(firstTemplate.tags).toContain('雨夜')
    expect(firstTemplate.thumbnailPath).toBeDefined()
    
    // Verify data was saved to localStorage
    const savedData = localStorageMock.getItem('promptTemplates')
    expect(savedData).toBeDefined()
    
    const parsedData = JSON.parse(savedData!)
    expect(parsedData.templates).toHaveLength(2)
    expect(parsedData.totalTemplates).toBe(2)
    expect(parsedData.version).toBe('1.0.0')
    
    // Verify validation passes
    const validation = await migrationService.validateMigration()
    expect(validation.isValid).toBe(true)
    expect(validation.templateCount).toBe(2)
  })
})