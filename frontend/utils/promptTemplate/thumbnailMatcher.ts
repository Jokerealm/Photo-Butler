/**
 * 缩略图匹配器
 * Thumbnail Matcher
 * 
 * 负责根据提示词内容匹配对应的缩略图文件
 */

import { ParsedPromptItem } from '../../types/promptTemplate'

/**
 * 可用的缩略图文件映射
 * 基于image目录中的实际文件
 */
const AVAILABLE_THUMBNAILS: Record<string, string> = {
  '雨夜等车': '/image/film-grid-rainy-night.png',
  '雨夜出逃': '/image/雨夜出逃.png',
  '酒店出浴': '/image/酒店出浴.png',
  '猫咪夕阳': '/image/placeholder.png', // 没有对应图片，使用占位符
  '征服高山': '/image/征服高山.png',
  '草原听风': '/image/草原听风.png',
  '星河听梦': '/image/星河听梦.png',
  '花海听风': '/image/花海听风.png',
  '沙漠星空': '/image/沙漠星空.png',
  '青春校园': '/image/青春校园.png',
  '蕾丝美女': '/image/蕾丝美女.png',
  '圣诞写真': '/image/圣诞写真.png',
  '新年锦鲤': '/image/新年锦鲤.png',
  '职场女生': '/image/职场女生.png',
  '雪景写真': '/image/雪景写真.png',
  '古典旗袍': '/image/古典旗袍.png',
  '室内光影': '/image/室内光影.png'
}

/**
 * 关键词到缩略图的映射
 * 用于模糊匹配
 */
const KEYWORD_MAPPINGS: Record<string, string> = {
  // 雨夜相关
  '雨夜': '/image/雨夜出逃.png',
  '雨': '/image/雨夜出逃.png',
  '等车': '/image/film-grid-rainy-night.png',
  '公交': '/image/film-grid-rainy-night.png',
  '车站': '/image/film-grid-rainy-night.png',
  
  // 酒店相关
  '酒店': '/image/酒店出浴.png',
  '浴室': '/image/酒店出浴.png',
  '浴袍': '/image/酒店出浴.png',
  '出浴': '/image/酒店出浴.png',
  
  // 高山相关
  '高山': '/image/征服高山.png',
  '山峰': '/image/征服高山.png',
  '登山': '/image/征服高山.png',
  '征服': '/image/征服高山.png',
  '云海': '/image/征服高山.png',
  
  // 草原相关
  '草原': '/image/草原听风.png',
  '听风': '/image/草原听风.png',
  '风': '/image/草原听风.png',
  
  // 星空相关
  '星河': '/image/星河听梦.png',
  '星空': '/image/沙漠星空.png',
  '银河': '/image/星河听梦.png',
  '繁星': '/image/沙漠星空.png',
  '听梦': '/image/星河听梦.png',
  
  // 花海相关
  '花海': '/image/花海听风.png',
  '薰衣草': '/image/花海听风.png',
  '紫色': '/image/花海听风.png',
  
  // 沙漠相关
  '沙漠': '/image/沙漠星空.png',
  '沙丘': '/image/沙漠星空.png',
  
  // 校园相关
  '校园': '/image/青春校园.png',
  '青春': '/image/青春校园.png',
  '学院': '/image/青春校园.png',
  '学生': '/image/青春校园.png',
  '栏杆': '/image/青春校园.png',
  
  // 蕾丝相关
  '蕾丝': '/image/蕾丝美女.png',
  '镂空': '/image/蕾丝美女.png',
  '香槟': '/image/蕾丝美女.png',
  
  // 圣诞相关
  '圣诞': '/image/圣诞写真.png',
  '礼物': '/image/圣诞写真.png',
  '圣诞帽': '/image/圣诞写真.png',
  
  // 新年相关
  '新年': '/image/新年锦鲤.png',
  '锦鲤': '/image/新年锦鲤.png',
  '金色': '/image/新年锦鲤.png',
  
  // 职场相关
  '职场': '/image/职场女生.png',
  '衬衫': '/image/职场女生.png',
  '通勤': '/image/职场女生.png',
  '笔电': '/image/职场女生.png',
  
  // 雪景相关
  '雪': '/image/雪景写真.png',
  '雪景': '/image/雪景写真.png',
  '雪地': '/image/雪景写真.png',
  '围巾': '/image/雪景写真.png',
  
  // 旗袍相关
  '旗袍': '/image/古典旗袍.png',
  '古典': '/image/古典旗袍.png',
  '蓝花': '/image/古典旗袍.png',
  
  // 室内相关
  '室内': '/image/室内光影.png',
  '光影': '/image/室内光影.png',
  '逆光': '/image/室内光影.png',
  '轮廓光': '/image/室内光影.png'
}

/**
 * 默认占位符图片
 */
const DEFAULT_THUMBNAIL = '/image/placeholder.png'

/**
 * 根据提示词内容匹配缩略图
 * @param item 解析的提示词项目
 * @returns 匹配的缩略图路径
 */
export function matchThumbnail(item: ParsedPromptItem): string {
  if (!item || !item.title || !item.content) {
    return DEFAULT_THUMBNAIL
  }
  
  // 1. 首先尝试精确匹配标题
  const exactMatch = findExactMatch(item.title)
  if (exactMatch) {
    return exactMatch
  }
  
  // 2. 尝试关键词匹配
  const keywordMatch = findKeywordMatch(item.title, item.content)
  if (keywordMatch) {
    return keywordMatch
  }
  
  // 3. 尝试模糊匹配
  const fuzzyMatch = findFuzzyMatch(item.title, item.content)
  if (fuzzyMatch) {
    return fuzzyMatch
  }
  
  // 4. 返回默认占位符
  return DEFAULT_THUMBNAIL
}

/**
 * 精确匹配标题
 * @param title 标题
 * @returns 匹配的缩略图路径或null
 */
function findExactMatch(title: string): string | null {
  // 清理标题，移除标点符号和空格
  const cleanTitle = title.replace(/[：。，、\s]/g, '')
  
  // 检查是否有精确匹配
  for (const [key, path] of Object.entries(AVAILABLE_THUMBNAILS)) {
    const cleanKey = key.replace(/[：。，、\s]/g, '')
    if (cleanTitle.includes(cleanKey) || cleanKey.includes(cleanTitle)) {
      return path
    }
  }
  
  return null
}

/**
 * 关键词匹配
 * @param title 标题
 * @param content 内容
 * @returns 匹配的缩略图路径或null
 */
function findKeywordMatch(title: string, content: string): string | null {
  const searchText = (title + ' ' + content).toLowerCase()
  
  // 按关键词长度排序，优先匹配更具体的关键词
  const sortedKeywords = Object.keys(KEYWORD_MAPPINGS).sort((a, b) => b.length - a.length)
  
  for (const keyword of sortedKeywords) {
    if (searchText.includes(keyword)) {
      return KEYWORD_MAPPINGS[keyword]
    }
  }
  
  return null
}

/**
 * 模糊匹配
 * @param title 标题
 * @param content 内容
 * @returns 匹配的缩略图路径或null
 */
function findFuzzyMatch(title: string, content: string): string | null {
  const searchText = title + ' ' + content
  
  // 定义场景关键词组合
  const scenePatterns: Array<{ keywords: string[], thumbnail: string }> = [
    {
      keywords: ['夜', '城市', '街道', '霓虹'],
      thumbnail: '/image/雨夜出逃.png'
    },
    {
      keywords: ['山', '云', '日出', '登山'],
      thumbnail: '/image/征服高山.png'
    },
    {
      keywords: ['草', '风', '天空', '自然'],
      thumbnail: '/image/草原听风.png'
    },
    {
      keywords: ['星', '夜空', '银河', '宇宙'],
      thumbnail: '/image/沙漠星空.png'
    },
    {
      keywords: ['花', '田野', '紫色', '浪漫'],
      thumbnail: '/image/花海听风.png'
    },
    {
      keywords: ['学校', '青春', '清新', '校服'],
      thumbnail: '/image/青春校园.png'
    },
    {
      keywords: ['优雅', '高贵', '香槟', '室内'],
      thumbnail: '/image/蕾丝美女.png'
    },
    {
      keywords: ['节日', '庆祝', '红色', '装饰'],
      thumbnail: '/image/圣诞写真.png'
    },
    {
      keywords: ['工作', '办公', '专业', '现代'],
      thumbnail: '/image/职场女生.png'
    },
    {
      keywords: ['冬天', '寒冷', '白色', '温暖'],
      thumbnail: '/image/雪景写真.png'
    },
    {
      keywords: ['传统', '东方', '典雅', '文化'],
      thumbnail: '/image/古典旗袍.png'
    },
    {
      keywords: ['光线', '阴影', '艺术', '摄影'],
      thumbnail: '/image/室内光影.png'
    }
  ]
  
  // 计算每个场景的匹配分数
  let bestMatch: string | null = null
  let bestScore = 0
  
  for (const pattern of scenePatterns) {
    let score = 0
    for (const keyword of pattern.keywords) {
      if (searchText.includes(keyword)) {
        score++
      }
    }
    
    // 如果匹配了至少2个关键词，且分数更高
    if (score >= 2 && score > bestScore) {
      bestScore = score
      bestMatch = pattern.thumbnail
    }
  }
  
  return bestMatch
}

/**
 * 批量匹配缩略图
 * @param items 解析的提示词项目数组
 * @returns 带有缩略图路径的项目数组
 */
export function batchMatchThumbnails(items: ParsedPromptItem[]): Array<ParsedPromptItem & { thumbnailPath: string }> {
  return items.map(item => ({
    ...item,
    thumbnailPath: matchThumbnail(item)
  }))
}

/**
 * 获取所有可用的缩略图
 * @returns 可用缩略图的数组
 */
export function getAvailableThumbnails(): Array<{ name: string, path: string }> {
  return Object.entries(AVAILABLE_THUMBNAILS).map(([name, path]) => ({
    name,
    path
  }))
}

/**
 * 验证缩略图路径是否有效
 * @param path 缩略图路径
 * @returns 是否有效
 */
export function isValidThumbnailPath(path: string): boolean {
  if (!path || typeof path !== 'string') {
    return false
  }
  
  // 检查是否是已知的缩略图路径
  const allPaths = Object.values(AVAILABLE_THUMBNAILS)
  return allPaths.includes(path) || path === DEFAULT_THUMBNAIL
}

/**
 * 获取缩略图的显示名称
 * @param path 缩略图路径
 * @returns 显示名称
 */
export function getThumbnailDisplayName(path: string): string {
  for (const [name, thumbnailPath] of Object.entries(AVAILABLE_THUMBNAILS)) {
    if (thumbnailPath === path) {
      return name
    }
  }
  
  if (path === DEFAULT_THUMBNAIL) {
    return '默认图片'
  }
  
  // 从路径中提取文件名
  const fileName = path.split('/').pop()
  if (fileName) {
    return fileName.replace(/\.(png|jpg|jpeg)$/i, '')
  }
  
  return '未知图片'
}

/**
 * 生成缩略图匹配报告
 * @param items 解析的提示词项目数组
 * @returns 匹配报告
 */
export function generateMatchingReport(items: ParsedPromptItem[]): {
  totalItems: number
  matchedItems: number
  unmatchedItems: number
  matchingRate: number
  details: Array<{
    index: number
    title: string
    thumbnailPath: string
    matchType: 'exact' | 'keyword' | 'fuzzy' | 'default'
  }>
} {
  const details = items.map(item => {
    const thumbnailPath = matchThumbnail(item)
    let matchType: 'exact' | 'keyword' | 'fuzzy' | 'default' = 'default'
    
    if (thumbnailPath !== DEFAULT_THUMBNAIL) {
      if (findExactMatch(item.title)) {
        matchType = 'exact'
      } else if (findKeywordMatch(item.title, item.content)) {
        matchType = 'keyword'
      } else {
        matchType = 'fuzzy'
      }
    }
    
    return {
      index: item.index,
      title: item.title,
      thumbnailPath,
      matchType
    }
  })
  
  const matchedItems = details.filter(d => d.matchType !== 'default').length
  const totalItems = items.length
  
  return {
    totalItems,
    matchedItems,
    unmatchedItems: totalItems - matchedItems,
    matchingRate: totalItems > 0 ? (matchedItems / totalItems) * 100 : 0,
    details
  }
}