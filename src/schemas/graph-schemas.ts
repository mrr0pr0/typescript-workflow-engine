/**
 * Graph Validation Schemas
 * Demonstrates: Complex Schema Composition, Recursive Validation
 */
import { z } from 'zod'
import { workflowNodeSchema } from './node-schemas'

// edge schema
export const edgeSchema = z.object({
  id: z.string(),
  source: z.string(),
  sourcePort: z.string(),
  target: z.string(),
  targetPort: z.string(),
  valid: z.boolean(),
  errorMessage: z.string().optional()
});

// Graph metadata schema
export const graphMetadataSchema = z.object({
  createdAt: z.string(),
  updatedAt: z.string(),
  version: z.string()
});

// Complete workflow graph schema
export const workflowGraphSchema = z.object({
  id: z.string(),
  name: z.string(),
  nodes: z.array(workflowNodeSchema),
  edges: z.array(edgeSchema),
  metadata: graphMetadataSchema.optional()
});

// Infer TypeScript types from schemas
export type InferredEdge = z.infer<typeof edgeSchema>;
export type InferredGraphMetadata = z.infer<typeof graphMetadataSchema>;
export type InferredWorkflowGraph = z.infer<typeof workflowGraphSchema>;

// --- Edge Validation ---

/** Validate an unknown value as an Edge */
export const validateEdge = (data: unknown): data is InferredEdge => {
  return edgeSchema.safeParse(data).success;
};

/** Parse and validate an edge with detailed errors */
export const parseEdge = (data: unknown) => {
  return edgeSchema.safeParse(data);
};

// --- Graph Validation ---

/** Validate an unknown value as a WorkflowGraph */
export const validateGraph = (data: unknown): data is InferredWorkflowGraph => {
  return workflowGraphSchema.safeParse(data).success;
};

/** Parse and validate a graph with detailed errors */
export const parseGraph = (data: unknown) => {
  return workflowGraphSchema.safeParse(data);
};

// --- Structural Validation (beyond shape checking) ---

/**
 * Validate that every edge references nodes that exist in the graph.
 * Returns a list of error messages (empty if valid).
 */
export const validateEdgeReferences = (graph: InferredWorkflowGraph): string[] => {
  const nodeIds = new Set(graph.nodes.map(n => n.id));
  const errors: string[] = [];

  for (const edge of graph.edges) {
    if (!nodeIds.has(edge.source)) {
      errors.push(`Edge "${edge.id}" references missing source node "${edge.source}"`);
    }
    if (!nodeIds.has(edge.target)) {
      errors.push(`Edge "${edge.id}" references missing target node "${edge.target}"`);
    }
  }

  return errors;
};

/**
 * Validate that there are no duplicate node IDs in the graph.
 * Returns a list of duplicated IDs (empty if valid).
 */
export const validateUniqueNodeIds = (graph: InferredWorkflowGraph): string[] => {
  const seen = new Set<string>();
  const duplicates: string[] = [];

  for (const node of graph.nodes) {
    if (seen.has(node.id)) {
      duplicates.push(node.id);
    }
    seen.add(node.id);
  }

  return duplicates;
};

/**
 * Validate that there are no duplicate edge IDs in the graph.
 * Returns a list of duplicated IDs (empty if valid).
 */
export const validateUniqueEdgeIds = (graph: InferredWorkflowGraph): string[] => {
  const seen = new Set<string>();
  const duplicates: string[] = [];

  for (const edge of graph.edges) {
    if (seen.has(edge.id)) {
      duplicates.push(edge.id);
    }
    seen.add(edge.id);
  }

  return duplicates;
};

/**
 * Validate that every edge connects to ports that actually exist
 * on the referenced source/target nodes.
 * Returns a list of error messages (empty if valid).
 */
export const validatePortReferences = (graph: InferredWorkflowGraph): string[] => {
  const nodeMap = new Map(graph.nodes.map(n => [n.id, n]));
  const errors: string[] = [];

  for (const edge of graph.edges) {
    const sourceNode = nodeMap.get(edge.source);
    const targetNode = nodeMap.get(edge.target);

    if (sourceNode) {
      const hasSourcePort = sourceNode.outputs.some(p => p.id === edge.sourcePort);
      if (!hasSourcePort) {
        errors.push(
          `Edge "${edge.id}": source node "${edge.source}" has no output port "${edge.sourcePort}"`
        );
      }
    }

    if (targetNode) {
      const hasTargetPort = targetNode.inputs.some(p => p.id === edge.targetPort);
      if (!hasTargetPort) {
        errors.push(
          `Edge "${edge.id}": target node "${edge.target}" has no input port "${edge.targetPort}"`
        );
      }
    }
  }

  return errors;
};

/**
 * Perform a full structural validation of a workflow graph.
 * Combines schema validation with reference and uniqueness checks.
 */
export const validateWorkflowGraph = (data: unknown): {
  valid: boolean;
  errors: string[];
} => {
  // 1. Schema-level parse
  const parseResult = workflowGraphSchema.safeParse(data);
  if (!parseResult.success) {
    return {
      valid: false,
      errors: parseResult.error.issues.map(
        issue => `[${issue.path.join('.')}] ${issue.message}`
      )
    };
  }

  const graph = parseResult.data;
  const errors: string[] = [];

  // 2. Unique IDs
  const dupNodes = validateUniqueNodeIds(graph);
  for (const id of dupNodes) {
    errors.push(`Duplicate node ID: "${id}"`);
  }

  const dupEdges = validateUniqueEdgeIds(graph);
  for (const id of dupEdges) {
    errors.push(`Duplicate edge ID: "${id}"`);
  }

  // 3. Edge → node references
  errors.push(...validateEdgeReferences(graph));

  // 4. Edge → port references
  errors.push(...validatePortReferences(graph));

  return {
    valid: errors.length === 0,
    errors
  };
};

// --- Refinement schema (graph schema with structural checks baked in) ---

/** A stricter graph schema that also validates structural integrity via Zod `.superRefine`. */
export const strictWorkflowGraphSchema = workflowGraphSchema.superRefine((graph, ctx) => {
  // Unique node IDs
  const nodeIdSet = new Set<string>();
  for (let i = 0; i < graph.nodes.length; i++) {
    const id = graph.nodes[i].id;
    if (nodeIdSet.has(id)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Duplicate node ID: "${id}"`,
        path: ['nodes', i, 'id']
      });
    }
    nodeIdSet.add(id);
  }

  // Unique edge IDs
  const edgeIdSet = new Set<string>();
  for (let i = 0; i < graph.edges.length; i++) {
    const id = graph.edges[i].id;
    if (edgeIdSet.has(id)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Duplicate edge ID: "${id}"`,
        path: ['edges', i, 'id']
      });
    }
    edgeIdSet.add(id);
  }

  // Edge references
  for (let i = 0; i < graph.edges.length; i++) {
    const edge = graph.edges[i];
    if (!nodeIdSet.has(edge.source)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Edge references missing source node "${edge.source}"`,
        path: ['edges', i, 'source']
      });
    }
    if (!nodeIdSet.has(edge.target)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Edge references missing target node "${edge.target}"`,
        path: ['edges', i, 'target']
      });
    }
  }
});

export type StrictWorkflowGraph = z.infer<typeof strictWorkflowGraphSchema>;

/** Parse with strict structural validation */
export const parseStrictGraph = (data: unknown) => {
  return strictWorkflowGraphSchema.safeParse(data);
};