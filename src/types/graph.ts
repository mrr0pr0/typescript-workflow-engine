/**
 * Graph Validation and Type Inference
 * Demonstrates: Recursive Types, Phantom Types, Advanced Type Inference
 */

import type { NodeId, EdgeId, WorkflowNode, Edge, WorkflowGraph, ValidationError } from './core';

// Phantom type for graph validation states
export type GraphState = 'unvalidated' | 'validated' | 'invalid';

export interface TypedWorkflowGraph<State extends GraphState = 'unvalidated'> extends WorkflowGraph {
    readonly _state: State;
}

// Recursive type for graph traversal
export type NodePath<N extends WorkflowNode = WorkflowNode> = {
    readonly node: N;
    readonly depth: number;
    readonly parent?: NodePath<WorkflowNode>;
    readonly children: ReadonlyArray<NodePath<WorkflowNode>>;
};

// Cycle detection result
export type CycleDetectionResult =
    | { readonly hasCycle: false }
    | { readonly hasCycle: true; readonly cycle: ReadonlyArray<NodeId> };

// Input satisfaction checking
export interface InputSatisfaction {
    readonly nodeId: NodeId;
    readonly portId: string;
    readonly satisfied: boolean;
    readonly sourceNodeId?: NodeId;
    readonly sourcePortId?: string;
}

// Graph validation state
export interface GraphValidationState {
    readonly nodes: ReadonlyMap<NodeId, WorkflowNode>;
    readonly edges: ReadonlyMap<EdgeId, Edge>;
    readonly adjacencyList: ReadonlyMap<NodeId, ReadonlyArray<NodeId>>;
    readonly reverseAdjacencyList: ReadonlyMap<NodeId, ReadonlyArray<NodeId>>;
    readonly inputSatisfaction: ReadonlyMap<NodeId, ReadonlyArray<InputSatisfaction>>;
    readonly cycles: ReadonlyArray<ReadonlyArray<NodeId>>;
    readonly topologicalOrder: ReadonlyArray<NodeId> | null;
}

// Type-level graph properties
export type GraphProperties = {
    readonly isAcyclic: boolean;
    readonly isConnected: boolean;
    readonly hasOrphanNodes: boolean;
    readonly allInputsSatisfied: boolean;
};

// Recursive type for output type inference through graph
export type InferGraphOutput<
    G extends WorkflowGraph,
    StartNodeId extends NodeId
> = {
    readonly nodeId: StartNodeId;
    readonly outputType: unknown;
    readonly downstream: ReadonlyArray<InferGraphOutput<G, NodeId>>;
};

// Topological sort result
export type TopologicalSort =
    | { readonly success: true; readonly order: ReadonlyArray<NodeId> }
    | { readonly success: false; readonly reason: string; readonly problematicNodes: ReadonlyArray<NodeId> };

// Graph traversal visitor pattern
export interface GraphVisitor<TResult> {
    visitNode(node: WorkflowNode, depth: number): TResult;
    visitEdge(edge: Edge, sourceNode: WorkflowNode, targetNode: WorkflowNode): TResult;
    combine(results: ReadonlyArray<TResult>): TResult;
}

// Strongly connected components
export interface StronglyConnectedComponent {
    readonly id: string;
    readonly nodes: ReadonlyArray<NodeId>;
    readonly isLoop: boolean;
}

// Graph metrics
export interface GraphMetrics {
    readonly nodeCount: number;
    readonly edgeCount: number;
    readonly averageDegree: number;
    readonly maxDepth: number;
    readonly connectedComponents: number;
    readonly cyclomaticComplexity: number;
}

// Reachability matrix (for large graphs, use sparse representation)
export type ReachabilityMatrix = ReadonlyMap<NodeId, ReadonlySet<NodeId>>;

// Path finding result
export type PathResult =
    | { readonly found: true; readonly path: ReadonlyArray<NodeId>; readonly length: number }
    | { readonly found: false };

// Graph diff for versioning
export interface GraphDiff {
    readonly addedNodes: ReadonlyArray<WorkflowNode>;
    readonly removedNodes: ReadonlyArray<NodeId>;
    readonly modifiedNodes: ReadonlyArray<{ readonly old: WorkflowNode; readonly new: WorkflowNode }>;
    readonly addedEdges: ReadonlyArray<Edge>;
    readonly removedEdges: ReadonlyArray<EdgeId>;
}

// Immutable graph operations
export interface GraphOperations {
    addNode(graph: WorkflowGraph, node: WorkflowNode): WorkflowGraph;
    removeNode(graph: WorkflowGraph, nodeId: NodeId): WorkflowGraph;
    addEdge(graph: WorkflowGraph, edge: Edge): WorkflowGraph;
    removeEdge(graph: WorkflowGraph, edgeId: EdgeId): WorkflowGraph;
    updateNode(graph: WorkflowGraph, nodeId: NodeId, updates: Partial<WorkflowNode>): WorkflowGraph;
}

// Type guard for validated graph
export const isValidatedGraph = (
    graph: TypedWorkflowGraph<GraphState>
): graph is TypedWorkflowGraph<'validated'> => {
    return graph._state === 'validated';
};

// Exhaustiveness check helper
export const assertNever = (value: never): never => {
    throw new Error(`Unexpected value: ${value}`);
};

// Graph validation errors with discriminated union
export type GraphValidationError =
    | { readonly type: 'cycle'; readonly nodes: ReadonlyArray<NodeId> }
    | { readonly type: 'unsatisfied-input'; readonly nodeId: NodeId; readonly portId: string }
    | { readonly type: 'invalid-connection'; readonly edgeId: EdgeId; readonly reason: string }
    | { readonly type: 'orphan-node'; readonly nodeId: NodeId }
    | { readonly type: 'duplicate-node-id'; readonly nodeId: NodeId }
    | { readonly type: 'duplicate-edge-id'; readonly edgeId: EdgeId }
    | { readonly type: 'missing-node'; readonly nodeId: NodeId; readonly referencedBy: EdgeId };

// Compile-time graph constraints
export type ValidGraph<G extends WorkflowGraph> = G extends WorkflowGraph
    ? GraphProperties extends { isAcyclic: true; allInputsSatisfied: true }
        ? G
        : never
    : never;

// Higher-kinded type pattern for graph transformations
export interface GraphTransformer<F> {
    map<A, B>(graph: WorkflowGraph, f: (node: A) => B): WorkflowGraph;
    filter(graph: WorkflowGraph, predicate: (node: WorkflowNode) => boolean): WorkflowGraph;
    reduce<A>(graph: WorkflowGraph, f: (acc: A, node: WorkflowNode) => A, initial: A): A;
}

// Recursive type for nested graph structures (subgraphs)
export interface SubGraph {
    readonly id: string;
    readonly parent?: SubGraph;
    readonly graph: WorkflowGraph;
    readonly children: ReadonlyArray<SubGraph>;
}

// Type-safe graph query builder
export interface GraphQuery<T extends WorkflowNode = WorkflowNode> {
    where(predicate: (node: WorkflowNode) => node is T): GraphQuery<T>;
    select<K extends keyof T>(key: K): ReadonlyArray<T[K]>;
    orderBy<K extends keyof T>(key: K): GraphQuery<T>;
    take(count: number): GraphQuery<T>;
    execute(): ReadonlyArray<T>;
}