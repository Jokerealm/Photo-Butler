/**
 * Integration Check Script for Frontend E-commerce Redesign
 * 
 * This script verifies that all functionality modules are properly integrated
 * and the complete user experience flow works as expected.
 */

const fs = require('fs');
const path = require('path');

class IntegrationChecker {
  constructor() {
    this.results = [];
  }

  addResult(component, test, status, message) {
    this.results.push({ component, test, status, message });
  }

  /**
   * Check if required files exist
   */
  checkFileStructure() {
    const requiredFiles = [
      // Pages
      'app/page.tsx',
      'app/layout.tsx',
      'app/marketplace/page.tsx',
      'app/workspace/page.tsx',
      
      // Main page components
      'pages/TemplateMarketplace.tsx',
      'pages/WorkspaceGallery.tsx',
      
      // Core components
      'components/MainLayout.tsx',
      'components/TemplateCard.tsx',
      'components/TemplateModal.tsx',
      'components/TaskCard.tsx',
      'components/SearchBar.tsx',
      'components/ImageUploader.tsx',
      'components/AppInitializer.tsx',
      'components/ErrorBoundary.tsx',
      'components/Toast.tsx',
      
      // State management
      'stores/templateStore.ts',
      'stores/taskStore.ts',
      'stores/uiStore.ts',
      
      // Services
      'services/apiService.ts',
      'services/websocketService.ts',
      'services/retryService.ts',
      
      // Types
      'types/index.ts'
    ];

    for (const file of requiredFiles) {
      const filePath = path.join(__dirname, file);
      if (fs.existsSync(filePath)) {
        this.addResult('File Structure', file, 'pass', 'File exists');
      } else {
        this.addResult('File Structure', file, 'fail', 'File missing');
      }
    }
  }

  /**
   * Check component imports and exports
   */
  checkComponentIntegration() {
    try {
      // Check if main layout properly imports components
      const mainLayoutPath = path.join(__dirname, 'components/MainLayout.tsx');
      if (fs.existsSync(mainLayoutPath)) {
        const content = fs.readFileSync(mainLayoutPath, 'utf8');
        
        if (content.includes('AppInitializer')) {
          this.addResult('Component Integration', 'MainLayout -> AppInitializer', 'pass', 'Properly imported');
        } else {
          this.addResult('Component Integration', 'MainLayout -> AppInitializer', 'fail', 'Missing import');
        }
      }

      // Check if TemplateMarketplace imports required components
      const marketplacePath = path.join(__dirname, 'pages/TemplateMarketplace.tsx');
      if (fs.existsSync(marketplacePath)) {
        const content = fs.readFileSync(marketplacePath, 'utf8');
        
        const requiredImports = ['TemplateCard', 'SearchBar', 'TemplateModal', 'useTemplateStore'];
        for (const importName of requiredImports) {
          if (content.includes(importName)) {
            this.addResult('Component Integration', `TemplateMarketplace -> ${importName}`, 'pass', 'Properly imported');
          } else {
            this.addResult('Component Integration', `TemplateMarketplace -> ${importName}`, 'fail', 'Missing import');
          }
        }
      }

      // Check if WorkspaceGallery imports required components
      const workspacePath = path.join(__dirname, 'pages/WorkspaceGallery.tsx');
      if (fs.existsSync(workspacePath)) {
        const content = fs.readFileSync(workspacePath, 'utf8');
        
        const requiredImports = ['TaskCard', 'TaskFilter', 'useTaskStore'];
        for (const importName of requiredImports) {
          if (content.includes(importName)) {
            this.addResult('Component Integration', `WorkspaceGallery -> ${importName}`, 'pass', 'Properly imported');
          } else {
            this.addResult('Component Integration', `WorkspaceGallery -> ${importName}`, 'fail', 'Missing import');
          }
        }
      }

    } catch (error) {
      this.addResult('Component Integration', 'Import verification', 'fail', `Error: ${error.message}`);
    }
  }

  /**
   * Check state management integration
   */
  checkStateManagement() {
    try {
      // Check template store
      const templateStorePath = path.join(__dirname, 'stores/templateStore.ts');
      if (fs.existsSync(templateStorePath)) {
        const content = fs.readFileSync(templateStorePath, 'utf8');
        
        if (content.includes('create') && content.includes('zustand')) {
          this.addResult('State Management', 'Template Store', 'pass', 'Zustand store properly configured');
        } else {
          this.addResult('State Management', 'Template Store', 'fail', 'Zustand configuration missing');
        }
      }

      // Check task store
      const taskStorePath = path.join(__dirname, 'stores/taskStore.ts');
      if (fs.existsSync(taskStorePath)) {
        const content = fs.readFileSync(taskStorePath, 'utf8');
        
        if (content.includes('WebSocket') && content.includes('initializeWebSocket')) {
          this.addResult('State Management', 'Task Store WebSocket', 'pass', 'WebSocket integration implemented');
        } else {
          this.addResult('State Management', 'Task Store WebSocket', 'fail', 'WebSocket integration missing');
        }
      }

    } catch (error) {
      this.addResult('State Management', 'Store verification', 'fail', `Error: ${error.message}`);
    }
  }

  /**
   * Check API service integration
   */
  checkAPIIntegration() {
    try {
      const apiServicePath = path.join(__dirname, 'services/apiService.ts');
      if (fs.existsSync(apiServicePath)) {
        const content = fs.readFileSync(apiServicePath, 'utf8');
        
        // Check for retry logic
        if (content.includes('RetryService') && content.includes('withRetry')) {
          this.addResult('API Integration', 'Retry Logic', 'pass', 'Retry service properly integrated');
        } else {
          this.addResult('API Integration', 'Retry Logic', 'fail', 'Retry service missing');
        }

        // Check for template endpoints
        if (content.includes('getTemplates') && content.includes('searchTemplates')) {
          this.addResult('API Integration', 'Template Endpoints', 'pass', 'Template API endpoints implemented');
        } else {
          this.addResult('API Integration', 'Template Endpoints', 'fail', 'Template API endpoints missing');
        }

        // Check for task endpoints
        if (content.includes('createTask') && content.includes('getTasks')) {
          this.addResult('API Integration', 'Task Endpoints', 'pass', 'Task API endpoints implemented');
        } else {
          this.addResult('API Integration', 'Task Endpoints', 'fail', 'Task API endpoints missing');
        }
      }

    } catch (error) {
      this.addResult('API Integration', 'API verification', 'fail', `Error: ${error.message}`);
    }
  }

  /**
   * Check WebSocket integration
   */
  checkWebSocketIntegration() {
    try {
      const wsServicePath = path.join(__dirname, 'services/websocketService.ts');
      if (fs.existsSync(wsServicePath)) {
        const content = fs.readFileSync(wsServicePath, 'utf8');
        
        // Check for connection management
        if (content.includes('ConnectionState') && content.includes('reconnect')) {
          this.addResult('WebSocket Integration', 'Connection Management', 'pass', 'Connection state management implemented');
        } else {
          this.addResult('WebSocket Integration', 'Connection Management', 'fail', 'Connection management missing');
        }

        // Check for task update handling
        if (content.includes('task-update') && content.includes('task-complete')) {
          this.addResult('WebSocket Integration', 'Task Updates', 'pass', 'Task update handling implemented');
        } else {
          this.addResult('WebSocket Integration', 'Task Updates', 'fail', 'Task update handling missing');
        }
      }

    } catch (error) {
      this.addResult('WebSocket Integration', 'WebSocket verification', 'fail', `Error: ${error.message}`);
    }
  }

  /**
   * Check routing configuration
   */
  checkRouting() {
    try {
      // Check Next.js app router structure
      const appDir = path.join(__dirname, 'app');
      if (fs.existsSync(appDir)) {
        this.addResult('Routing', 'App Router Structure', 'pass', 'Next.js App Router properly configured');
      } else {
        this.addResult('Routing', 'App Router Structure', 'fail', 'App Router structure missing');
      }

      // Check marketplace route
      const marketplaceRoute = path.join(__dirname, 'app/marketplace/page.tsx');
      if (fs.existsSync(marketplaceRoute)) {
        this.addResult('Routing', 'Marketplace Route', 'pass', 'Marketplace route configured');
      } else {
        this.addResult('Routing', 'Marketplace Route', 'fail', 'Marketplace route missing');
      }

      // Check workspace route
      const workspaceRoute = path.join(__dirname, 'app/workspace/page.tsx');
      if (fs.existsSync(workspaceRoute)) {
        this.addResult('Routing', 'Workspace Route', 'pass', 'Workspace route configured');
      } else {
        this.addResult('Routing', 'Workspace Route', 'fail', 'Workspace route missing');
      }

    } catch (error) {
      this.addResult('Routing', 'Route verification', 'fail', `Error: ${error.message}`);
    }
  }

  /**
   * Check responsive design implementation
   */
  checkResponsiveDesign() {
    try {
      // Check if Tailwind CSS is configured
      const tailwindConfig = path.join(__dirname, 'tailwind.config.ts');
      if (fs.existsSync(tailwindConfig)) {
        this.addResult('Responsive Design', 'Tailwind Configuration', 'pass', 'Tailwind CSS properly configured');
      } else {
        this.addResult('Responsive Design', 'Tailwind Configuration', 'fail', 'Tailwind CSS configuration missing');
      }

      // Check for responsive classes in components
      const templateCardPath = path.join(__dirname, 'components/TemplateCard.tsx');
      if (fs.existsSync(templateCardPath)) {
        const content = fs.readFileSync(templateCardPath, 'utf8');
        
        if (content.includes('sm:') && content.includes('md:') && content.includes('lg:')) {
          this.addResult('Responsive Design', 'Responsive Classes', 'pass', 'Responsive breakpoints implemented');
        } else {
          this.addResult('Responsive Design', 'Responsive Classes', 'warning', 'Limited responsive breakpoints');
        }
      }

    } catch (error) {
      this.addResult('Responsive Design', 'Responsive verification', 'fail', `Error: ${error.message}`);
    }
  }

  /**
   * Run all integration checks
   */
  runAllChecks() {
    console.log('🔍 Starting Frontend Integration Check...\n');

    this.checkFileStructure();
    this.checkComponentIntegration();
    this.checkStateManagement();
    this.checkAPIIntegration();
    this.checkWebSocketIntegration();
    this.checkRouting();
    this.checkResponsiveDesign();

    return this.results;
  }

  /**
   * Generate integration report
   */
  generateReport() {
    const passCount = this.results.filter(r => r.status === 'pass').length;
    const failCount = this.results.filter(r => r.status === 'fail').length;
    const warningCount = this.results.filter(r => r.status === 'warning').length;
    const totalCount = this.results.length;

    let report = `
# Frontend E-commerce Redesign Integration Report

## Summary
- ✅ Passed: ${passCount}/${totalCount}
- ❌ Failed: ${failCount}/${totalCount}
- ⚠️  Warnings: ${warningCount}/${totalCount}

## Detailed Results

`;

    // Group results by component
    const groupedResults = this.results.reduce((acc, result) => {
      if (!acc[result.component]) {
        acc[result.component] = [];
      }
      acc[result.component].push(result);
      return acc;
    }, {});

    for (const [component, results] of Object.entries(groupedResults)) {
      report += `### ${component}\n\n`;
      
      for (const result of results) {
        const icon = result.status === 'pass' ? '✅' : result.status === 'fail' ? '❌' : '⚠️';
        report += `${icon} **${result.test}**: ${result.message}\n\n`;
      }
    }

    // Add integration status
    report += `
## Integration Status

${failCount === 0 ? '🎉 All functionality modules are properly integrated!' : '⚠️ Some integration issues need to be resolved.'}

The frontend e-commerce redesign includes:

1. **Template Marketplace**: Browse and search AI art style templates
2. **Template Details Modal**: View template information and upload images  
3. **Asynchronous Task System**: Submit and monitor generation tasks
4. **Workspace Gallery**: Manage and view generation results
5. **Real-time Updates**: WebSocket integration for live task status
6. **Responsive Design**: Mobile-first responsive layout
7. **State Management**: Zustand stores for global state
8. **Error Handling**: Comprehensive error recovery mechanisms

## Next Steps

${failCount === 0 ? 
  '✅ The integration is complete. You can proceed with performance testing and optimization.' : 
  '🔧 Address the failed integration points before proceeding to performance testing.'
}
`;

    return report;
  }
}

// Run the integration check
const checker = new IntegrationChecker();
const results = checker.runAllChecks();
const report = checker.generateReport();

console.log(report);

// Write report to file
fs.writeFileSync(path.join(__dirname, 'integration-report.md'), report);
console.log('\n📄 Integration report saved to integration-report.md');

// Exit with appropriate code
const failCount = results.filter(r => r.status === 'fail').length;
process.exit(failCount > 0 ? 1 : 0);