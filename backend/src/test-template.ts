/**
 * Test script for template service
 * 模板服务测试脚本
 */

import { templateService } from './services/templateService';

async function testTemplateService() {
  console.log('Testing Template Service...');
  console.log('测试模板服务...');

  try {
    // Test parseTemplateName
    console.log('\n1. Testing parseTemplateName:');
    const testFilenames = ['日常快照.jpg', '三宫格胶片雨夜.png', '屋顶猫咪.jpg'];
    for (const filename of testFilenames) {
      const parsed = templateService.parseTemplateName(filename);
      console.log(`${filename} -> ${parsed}`);
    }

    // Test readTemplateFiles
    console.log('\n2. Testing readTemplateFiles:');
    const templateFiles = await templateService.readTemplateFiles();
    console.log('Template files found:', templateFiles.length);
    templateFiles.forEach((file, index) => {
      console.log(`${index + 1}. ${file.name} (${file.filename})`);
    });

    // Test parsePrompts
    console.log('\n3. Testing parsePrompts:');
    const promptConfig = await templateService.parsePrompts();
    console.log('Prompts found:', promptConfig.prompts.length);
    promptConfig.prompts.forEach((prompt, index) => {
      console.log(`${index + 1}. ${prompt.substring(0, 50)}...`);
    });

    // Test getTemplates
    console.log('\n4. Testing getTemplates:');
    const templates = await templateService.getTemplates();
    console.log('Templates generated:', templates.length);
    templates.forEach((template, index) => {
      console.log(`${index + 1}. ID: ${template.id}, Name: ${template.name}`);
      console.log(`   Preview: ${template.previewUrl}`);
      console.log(`   Prompt: ${template.prompt.substring(0, 50)}...`);
    });

    // Test getTemplateById
    console.log('\n5. Testing getTemplateById:');
    if (templates.length > 0) {
      const firstTemplate = await templateService.getTemplateById(templates[0].id);
      if (firstTemplate) {
        console.log(`Found template: ${firstTemplate.name}`);
      } else {
        console.log('Template not found');
      }
    }

    console.log('\n✅ All tests completed successfully!');
    console.log('✅ 所有测试成功完成！');

  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('❌ 测试失败:', error);
  }
}

// Run the test
testTemplateService();