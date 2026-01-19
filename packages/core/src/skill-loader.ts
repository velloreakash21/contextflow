/**
 * SkillLoader - Progressive skill loading system
 *
 * Loads skills on-demand to minimize context usage.
 * Supports discovery, caching, and dependency resolution.
 */

import type {
  SkillManifest,
  SkillContent,
  SkillTrigger,
} from './types';
import type { ContextManager } from './context-manager';
import type { EventBus } from './event-bus';

export class SkillLoader {
  private readonly contextManager: ContextManager;
  private readonly eventBus: EventBus;
  private readonly skillsPath: string;
  private readonly manifests: Map<string, SkillManifest> = new Map();
  private readonly loaded: Map<string, SkillContent> = new Map();
  private readonly allocationIds: Map<string, string> = new Map();
  private discovered: boolean = false;

  constructor(
    contextManager: ContextManager,
    eventBus: EventBus,
    skillsPath?: string
  ) {
    this.contextManager = contextManager;
    this.eventBus = eventBus;
    this.skillsPath = skillsPath || '.contextflow/skills';
  }

  /**
   * Discover available skills
   */
  async discover(): Promise<SkillManifest[]> {
    if (this.discovered) {
      return Array.from(this.manifests.values());
    }

    // In a real implementation, this would scan the filesystem
    // For now, we provide built-in skills
    const builtInSkills: SkillManifest[] = [
      {
        id: 'code-standards',
        name: 'Code Standards',
        description: 'Coding conventions and best practices',
        estimatedTokens: 2000,
        dependencies: [],
        triggers: [
          { type: 'task_type', pattern: 'write|implement|code|refactor' },
          { type: 'file_pattern', pattern: '\\.(ts|js|py|go|rs)$' },
        ],
        path: `${this.skillsPath}/code-standards/SKILL.md`,
      },
      {
        id: 'testing',
        name: 'Testing',
        description: 'Test writing and best practices',
        estimatedTokens: 1500,
        dependencies: [],
        triggers: [
          { type: 'task_type', pattern: 'test|spec|coverage' },
          { type: 'file_pattern', pattern: '\\.(test|spec)\\.(ts|js)$' },
        ],
        path: `${this.skillsPath}/testing/SKILL.md`,
      },
      {
        id: 'security',
        name: 'Security',
        description: 'Security best practices and vulnerability prevention',
        estimatedTokens: 1800,
        dependencies: [],
        triggers: [
          { type: 'keyword', pattern: 'auth|security|password|token|secret' },
        ],
        path: `${this.skillsPath}/security/SKILL.md`,
      },
    ];

    for (const skill of builtInSkills) {
      this.manifests.set(skill.id, skill);
    }

    this.discovered = true;
    return builtInSkills;
  }

  /**
   * Load a skill into context
   */
  async load(skillId: string): Promise<SkillContent> {
    // Return if already loaded
    const existing = this.loaded.get(skillId);
    if (existing) return existing;

    // Discover if not done
    if (!this.discovered) {
      await this.discover();
    }

    const manifest = this.manifests.get(skillId);
    if (!manifest) {
      throw new Error(`Skill not found: ${skillId}`);
    }

    // Load dependencies first
    for (const depId of manifest.dependencies) {
      if (!this.loaded.has(depId)) {
        await this.load(depId);
      }
    }

    // Get skill content (in real impl, read from file)
    const content = await this.fetchSkillContent(manifest);

    // Allocate context
    const allocation = this.contextManager.allocate({
      source: 'skill',
      content: content.content,
      label: manifest.name,
      metadata: { skillId, manifest },
    });

    if (!allocation.success) {
      throw new Error(`Failed to load skill ${skillId}: ${allocation.reason}`);
    }

    // Store
    this.loaded.set(skillId, content);
    this.allocationIds.set(skillId, allocation.id);

    this.eventBus.emit({
      type: 'skill.loaded',
      timestamp: Date.now(),
      data: { skillId, manifest, tokens: content.tokens },
      contextSnapshot: this.getSnapshot(),
    });

    return content;
  }

  /**
   * Unload a skill from context
   */
  unload(skillId: string): boolean {
    const content = this.loaded.get(skillId);
    if (!content) return false;

    const allocationId = this.allocationIds.get(skillId);
    if (allocationId) {
      this.contextManager.release(allocationId);
    }

    this.loaded.delete(skillId);
    this.allocationIds.delete(skillId);

    this.eventBus.emit({
      type: 'skill.unloaded',
      timestamp: Date.now(),
      data: { skillId },
      contextSnapshot: this.getSnapshot(),
    });

    return true;
  }

  /**
   * Unload all skills
   */
  unloadAll(): void {
    for (const skillId of this.loaded.keys()) {
      this.unload(skillId);
    }
  }

  /**
   * Check if skill is loaded
   */
  isLoaded(skillId: string): boolean {
    return this.loaded.has(skillId);
  }

  /**
   * Get loaded skills
   */
  getLoadedSkills(): SkillManifest[] {
    return Array.from(this.loaded.values()).map(c => c.manifest);
  }

  /**
   * Get total tokens used by loaded skills
   */
  getLoadedTokens(): number {
    return Array.from(this.loaded.values())
      .reduce((sum, c) => sum + c.tokens, 0);
  }

  /**
   * Find skills matching triggers
   */
  findMatchingSkills(context: {
    taskType?: string;
    filePath?: string;
    keywords?: string[];
  }): SkillManifest[] {
    const matches: SkillManifest[] = [];

    for (const manifest of this.manifests.values()) {
      if (this.matchesTriggers(manifest.triggers, context)) {
        matches.push(manifest);
      }
    }

    return matches;
  }

  /**
   * Preload skills based on context
   */
  async preload(skillIds: string[], priority: 'high' | 'low'): Promise<void> {
    if (priority === 'high') {
      // Load immediately
      await Promise.all(skillIds.map(id => this.load(id)));
    } else {
      // Load in background with delay
      setTimeout(() => {
        skillIds.forEach(id => this.load(id).catch(() => {}));
      }, 100);
    }
  }

  /**
   * Register a custom skill
   */
  registerSkill(manifest: SkillManifest, content: string): void {
    this.manifests.set(manifest.id, manifest);
  }

  private async fetchSkillContent(manifest: SkillManifest): Promise<SkillContent> {
    // In real implementation, read from file system
    // For now, return template content
    const content = this.getBuiltInContent(manifest.id);
    const tokens = this.contextManager.countTokens(content);

    return { manifest, content, tokens };
  }

  private getBuiltInContent(skillId: string): string {
    const contents: Record<string, string> = {
      'code-standards': `# Code Standards
- Use TypeScript strict mode
- Max 20 lines per function
- camelCase for variables, PascalCase for classes
- No any types, use unknown
- Document public APIs with JSDoc
- Handle all errors explicitly`,

      'testing': `# Testing Guidelines
- Use AAA pattern: Arrange, Act, Assert
- One assertion per test when practical
- Name tests: test_[function]_[scenario]_[expected]
- Mock external dependencies
- Aim for 80% coverage on critical paths`,

      'security': `# Security Guidelines
- Never hardcode secrets
- Validate all user input
- Use parameterized queries for SQL
- Encode output to prevent XSS
- Use secure defaults for configurations
- Log security events without sensitive data`,
    };

    return contents[skillId] || `# ${skillId}\nNo content available.`;
  }

  private matchesTriggers(
    triggers: SkillTrigger[],
    context: { taskType?: string; filePath?: string; keywords?: string[] }
  ): boolean {
    for (const trigger of triggers) {
      const pattern = new RegExp(trigger.pattern, 'i');

      switch (trigger.type) {
        case 'task_type':
          if (context.taskType && pattern.test(context.taskType)) return true;
          break;
        case 'file_pattern':
          if (context.filePath && pattern.test(context.filePath)) return true;
          break;
        case 'keyword':
          if (context.keywords?.some(k => pattern.test(k))) return true;
          break;
        case 'manual':
          // Manual triggers don't auto-match
          break;
      }
    }

    return false;
  }

  private getSnapshot() {
    const usage = this.contextManager.getCurrentUsage();
    return {
      used: usage.totalTokens,
      capacity: 200000, // Should get from budget tracker
      efficiency: usage.efficiency,
    };
  }
}
