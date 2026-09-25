import { db } from "@/lib/db";
import { chat, type ChatMessage } from "@/lib/ai/gateway";
import { getPrompt } from "@/lib/ai/prompts";
import { log } from "@/lib/logger";
import { audit } from "@/lib/governance/audit";
import { linkTrace } from "@/lib/traceability/trace";

export interface AgentContext { taskId: string; workspaceId: string; agentId: string; }

export abstract class BaseAgent {
  abstract readonly type: string;
  abstract readonly name: string;
  abstract readonly domain: string;
  abstract readonly produces: string;
  abstract readonly promptKey: string;

  async run(ctx: AgentContext, instruction: string): Promise<{ artifactId: string; content: string; }> {
    await db.task.update({ where: { id: ctx.taskId }, data: { status: "running", startedAt: new Date() } });
    const systemPrompt = await getPrompt(this.promptKey as Parameters<typeof getPrompt>[0], "fa");
    const messages: ChatMessage[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: `دستور: ${instruction}` },
    ];
    const { content } = await chat(messages, { temperature: 0.4, agentId: ctx.agentId });
    const artifact = await db.artifact.create({ data: { workspaceId: ctx.workspaceId, taskId: ctx.taskId, type: this.produces, name: instruction.slice(0, 80), content } });
    await linkTrace({ workspaceId: ctx.workspaceId, sourceType: "task", sourceId: ctx.taskId, targetType: "artifact", targetId: artifact.id, relation: "produces", taskId: ctx.taskId });
    await audit({ workspaceId: ctx.workspaceId, actor: this.name, action: "artifact.produced", targetType: "artifact", targetId: artifact.id, meta: { type: this.produces } });
    return { artifactId: artifact.id, content };
  }
}

// 27 agents
class ProductManagerAgent extends BaseAgent { readonly type="product-manager"; readonly name="Product Manager"; readonly domain="product"; readonly produces="requirement"; readonly promptKey="system"; }
class BusinessAnalystAgent extends BaseAgent { readonly type="business-analyst"; readonly name="Business Analyst"; readonly domain="product"; readonly produces="requirement"; readonly promptKey="documentation"; }
class ArchitectAgent extends BaseAgent { readonly type="architect"; readonly name="Solution Architect"; readonly domain="architecture"; readonly produces="design"; readonly promptKey="architecture"; }
class DbArchitectAgent extends BaseAgent { readonly type="db-architect"; readonly name="Database Architect"; readonly domain="data"; readonly produces="sql"; readonly promptKey="sqlAnalysis"; }
class BackendDevAgent extends BaseAgent { readonly type="backend-dev"; readonly name="Backend Developer"; readonly domain="engineering"; readonly produces="code"; readonly promptKey="codeReview"; }
class FrontendDevAgent extends BaseAgent { readonly type="frontend-dev"; readonly name="Frontend Developer"; readonly domain="engineering"; readonly produces="code"; readonly promptKey="codeReview"; }
class DatabaseDevAgent extends BaseAgent { readonly type="db-dev"; readonly name="Database Developer"; readonly domain="data"; readonly produces="sql"; readonly promptKey="sqlAnalysis"; }
class IntegrationAgent extends BaseAgent { readonly type="integrator"; readonly name="Integration Agent"; readonly domain="engineering"; readonly produces="code"; readonly promptKey="codeReview"; }
class SecurityAgent extends BaseAgent { readonly type="security"; readonly name="Security Agent"; readonly domain="verification"; readonly produces="doc"; readonly promptKey="bugAnalysis"; }
class UXUIDesignAgent extends BaseAgent { readonly type="ux-ui-design"; readonly name="UX/UI Design Agent"; readonly domain="product"; readonly produces="design"; readonly promptKey="system"; }
class QAAgent extends BaseAgent { readonly type="qa"; readonly name="QA Agent"; readonly domain="verification"; readonly produces="test"; readonly promptKey="codeReview"; }
class TestEngineeringAgent extends BaseAgent { readonly type="test-engineer"; readonly name="Test Engineering Agent"; readonly domain="engineering"; readonly produces="test"; readonly promptKey="codeReview"; }
class CodeReviewAgent extends BaseAgent { readonly type="code-review"; readonly name="Code Review Agent"; readonly domain="verification"; readonly produces="doc"; readonly promptKey="codeReview"; }
class SupplyChainAgent extends BaseAgent { readonly type="supply-chain"; readonly name="Supply Chain Agent"; readonly domain="engineering"; readonly produces="doc"; readonly promptKey="bugAnalysis"; }
class PerformanceAgent extends BaseAgent { readonly type="performance"; readonly name="Performance Agent"; readonly domain="verification"; readonly produces="doc"; readonly promptKey="codeReview"; }
class BugHunterAgent extends BaseAgent { readonly type="bug-hunter"; readonly name="Bug Hunter Agent"; readonly domain="verification"; readonly produces="doc"; readonly promptKey="bugAnalysis"; }
class DocumentationAgent extends BaseAgent { readonly type="documentation"; readonly name="Documentation Agent"; readonly domain="product"; readonly produces="doc"; readonly promptKey="documentation"; }
class CatalogAgent extends BaseAgent { readonly type="catalog"; readonly name="Catalog Agent"; readonly domain="product"; readonly produces="doc"; readonly promptKey="documentation"; }
class TrainingAgent extends BaseAgent { readonly type="training"; readonly name="Training Agent"; readonly domain="product"; readonly produces="doc"; readonly promptKey="documentation"; }
class DevOpsAgent extends BaseAgent { readonly type="devops"; readonly name="DevOps Agent"; readonly domain="engineering"; readonly produces="doc"; readonly promptKey="system"; }
class MonitoringAgent extends BaseAgent { readonly type="monitoring"; readonly name="Monitoring Agent"; readonly domain="verification"; readonly produces="doc"; readonly promptKey="bugAnalysis"; }
class SRERecoveryAgent extends BaseAgent { readonly type="sre-recovery"; readonly name="SRE / Recovery Agent"; readonly domain="verification"; readonly produces="doc"; readonly promptKey="bugAnalysis"; }
class ReleaseManagerAgent extends BaseAgent { readonly type="release-manager"; readonly name="Release Manager Agent"; readonly domain="engineering"; readonly produces="doc"; readonly promptKey="system"; }
class KnowledgeCuratorAgent extends BaseAgent { readonly type="knowledge-curator"; readonly name="Knowledge Curator Agent"; readonly domain="product"; readonly produces="doc"; readonly promptKey="documentation"; }
class GovernancePolicyAgent extends BaseAgent { readonly type="governance"; readonly name="Governance / Policy Agent"; readonly domain="verification"; readonly produces="doc"; readonly promptKey="architecture"; }
class PlatformArchitectAgent extends BaseAgent { readonly type="platform-architect"; readonly name="Platform Architecture Agent"; readonly domain="architecture"; readonly produces="design"; readonly promptKey="architecture"; }

export const AGENT_REGISTRY: Record<string, BaseAgent> = {
  "product-manager": new ProductManagerAgent(), "business-analyst": new BusinessAnalystAgent(),
  architect: new ArchitectAgent(), "db-architect": new DbArchitectAgent(),
  "backend-dev": new BackendDevAgent(), "frontend-dev": new FrontendDevAgent(),
  "db-dev": new DatabaseDevAgent(), integrator: new IntegrationAgent(),
  security: new SecurityAgent(), "ux-ui-design": new UXUIDesignAgent(),
  qa: new QAAgent(), "test-engineer": new TestEngineeringAgent(),
  "code-review": new CodeReviewAgent(), "supply-chain": new SupplyChainAgent(),
  performance: new PerformanceAgent(), "bug-hunter": new BugHunterAgent(),
  documentation: new DocumentationAgent(), catalog: new CatalogAgent(),
  training: new TrainingAgent(), devops: new DevOpsAgent(),
  monitoring: new MonitoringAgent(), "sre-recovery": new SRERecoveryAgent(),
  "release-manager": new ReleaseManagerAgent(), "knowledge-curator": new KnowledgeCuratorAgent(),
  governance: new GovernancePolicyAgent(), "platform-architect": new PlatformArchitectAgent(),
};
