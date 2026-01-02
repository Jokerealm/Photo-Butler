/**
 * 提示词模板状态管理
 * Prompt Template State Management
 */

import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import {
  PromptTemplate,
  CreateTemplateRequest,
  UpdateTemplateRequest,
  TemplateSearchParams,
  TemplateStore,
  MigrationResult
} from '../types/promptTemplate'
import { TemplateError } from '../types/promptTemplateErrors'
import { templateService } from '../services/TemplateService'

/**
 * 提示词模板Store实现
 */
export const usePromptTemplateStore = create<TemplateStore>()(
  devtools(
    persist(
      (set, get) => ({
        // 状态
        templates: [],
        loading: false,
        error: null,
        searchQuery: '',
        selectedTags: [],
        filteredTemplates: [],
        selectedTemplate: null,

        // 数据加载
        loadTemplates: async () => {
          set({ loading: true, error: null })
          try {
            const templates = await templateService.getAllTemplates()
            set({ 
              templates, 
              filteredTemplates: filterTemplates(templates, get().searchQuery, get().selectedTags),
              loading: false 
            })
          } catch (error) {
            set({ 
              error: error instanceof Error ? error.message : '加载模板失败',
              loading: false 
            })
          }
        },

        refreshTemplates: async () => {
          const { loadTemplates } = get()
          await loadTemplates()
        },

        // 搜索和筛选
        setSearchQuery: (query: string) => {
          set({ searchQuery: query })
          const { templates, selectedTags } = get()
          const filtered = filterTemplates(templates, query, selectedTags)
          set({ filteredTemplates: filtered })
        },

        searchTemplates: async (query: string) => {
          set({ searchQuery: query, loading: true })
          try {
            const searchParams: TemplateSearchParams = { 
              query, 
              tags: get().selectedTags 
            }
            const result = await templateService.searchTemplates(searchParams)
            set({ 
              filteredTemplates: result.templates,
              loading: false 
            })
          } catch (error) {
            set({ 
              error: error instanceof Error ? error.message : '搜索失败',
              loading: false 
            })
          }
        },

        toggleTag: (tag: string) => {
          const { selectedTags, templates, searchQuery } = get()
          const newTags = selectedTags.includes(tag)
            ? selectedTags.filter(t => t !== tag)
            : [...selectedTags, tag]
          
          const filtered = filterTemplates(templates, searchQuery, newTags)
          set({ 
            selectedTags: newTags,
            filteredTemplates: filtered 
          })
        },

        clearTagFilter: () => {
          const { templates, searchQuery } = get()
          const filtered = filterTemplates(templates, searchQuery, [])
          set({ 
            selectedTags: [],
            filteredTemplates: filtered 
          })
        },

        filterByTags: (tags: string[]) => {
          const { templates, searchQuery } = get()
          const filtered = filterTemplates(templates, searchQuery, tags)
          set({ 
            selectedTags: tags,
            filteredTemplates: filtered 
          })
        },

        // CRUD操作
        createTemplate: async (request: CreateTemplateRequest) => {
          set({ loading: true, error: null })
          try {
            const newTemplate = await templateService.createTemplate(request)
            
            const { templates } = get()
            const updatedTemplates = [...templates, newTemplate]
            
            set({ 
              templates: updatedTemplates,
              filteredTemplates: filterTemplates(
                updatedTemplates, 
                get().searchQuery, 
                get().selectedTags
              ),
              loading: false 
            })
            
            return newTemplate
          } catch (error) {
            set({ 
              error: error instanceof Error ? error.message : '创建模板失败',
              loading: false 
            })
            throw error
          }
        },

        updateTemplate: async (id: string, updates: UpdateTemplateRequest) => {
          set({ loading: true, error: null })
          try {
            const updatedTemplate = await templateService.updateTemplate(id, updates)
            
            const { templates } = get()
            const templateIndex = templates.findIndex(t => t.id === id)
            
            if (templateIndex !== -1) {
              const updatedTemplates = [...templates]
              updatedTemplates[templateIndex] = updatedTemplate
              
              set({ 
                templates: updatedTemplates,
                filteredTemplates: filterTemplates(
                  updatedTemplates, 
                  get().searchQuery, 
                  get().selectedTags
                ),
                selectedTemplate: get().selectedTemplate?.id === id ? updatedTemplate : get().selectedTemplate,
                loading: false 
              })
            }
            
            return updatedTemplate
          } catch (error) {
            set({ 
              error: error instanceof Error ? error.message : '更新模板失败',
              loading: false 
            })
            throw error
          }
        },

        deleteTemplate: async (id: string) => {
          set({ loading: true, error: null })
          try {
            await templateService.deleteTemplate(id)
            
            const { templates } = get()
            const updatedTemplates = templates.filter(t => t.id !== id)
            
            set({ 
              templates: updatedTemplates,
              filteredTemplates: filterTemplates(
                updatedTemplates, 
                get().searchQuery, 
                get().selectedTags
              ),
              selectedTemplate: get().selectedTemplate?.id === id ? null : get().selectedTemplate,
              loading: false 
            })
          } catch (error) {
            set({ 
              error: error instanceof Error ? error.message : '删除模板失败',
              loading: false 
            })
            throw error
          }
        },

        // 模板选择
        selectTemplate: (template: PromptTemplate | null) => {
          set({ selectedTemplate: template })
        },

        // 错误处理
        setError: (error: string | null) => {
          set({ error })
        },

        clearError: () => {
          set({ error: null })
        },

        // 数据迁移
        migrateFromTextFile: async (filePath: string) => {
          set({ loading: true, error: null })
          try {
            // TODO: 实现实际的迁移逻辑
            const result: MigrationResult = {
              success: true,
              templatesCreated: 0,
              errors: [],
              templates: []
            }
            
            set({ loading: false })
            return result
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : '数据迁移失败'
            set({ 
              error: errorMessage,
              loading: false 
            })
            
            return {
              success: false,
              templatesCreated: 0,
              errors: [errorMessage],
              templates: []
            }
          }
        }
      }),
      {
        name: 'prompt-template-store',
        partialize: (state) => ({
          templates: state.templates,
          selectedTags: state.selectedTags,
          searchQuery: state.searchQuery
        })
      }
    ),
    {
      name: 'prompt-template-store'
    }
  )
)

/**
 * 过滤模板的辅助函数
 */
function filterTemplates(
  templates: PromptTemplate[], 
  query: string, 
  tags: string[]
): PromptTemplate[] {
  let filtered = templates

  // 按搜索查询过滤
  if (query.trim()) {
    const lowerQuery = query.toLowerCase()
    filtered = filtered.filter(template => 
      template.title.toLowerCase().includes(lowerQuery) ||
      template.description.toLowerCase().includes(lowerQuery) ||
      template.content.toLowerCase().includes(lowerQuery)
    )
  }

  // 按标签过滤
  if (tags.length > 0) {
    filtered = filtered.filter(template =>
      tags.some(tag => template.tags.includes(tag))
    )
  }

  return filtered
}

/**
 * 获取所有可用标签的辅助函数
 */
export function useAvailableTags(): string[] {
  const templates = usePromptTemplateStore(state => state.templates)
  
  const allTags = templates.flatMap(template => template.tags)
  const uniqueTags = Array.from(new Set(allTags))
  
  return uniqueTags.sort()
}

/**
 * 获取模板统计信息的辅助函数
 */
export function useTemplateStats() {
  const templates = usePromptTemplateStore(state => state.templates)
  
  return {
    total: templates.length,
    totalTags: useAvailableTags().length,
    averageTagsPerTemplate: templates.length > 0 
      ? templates.reduce((sum, t) => sum + t.tags.length, 0) / templates.length 
      : 0,
    mostRecentTemplate: templates.length > 0 
      ? templates.reduce((latest, current) => 
          new Date(current.createdAt) > new Date(latest.createdAt) ? current : latest
        )
      : null
  }
}