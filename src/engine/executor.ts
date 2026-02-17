/**
 * Workflow Execution Engine
 * Demonstrates: Type-safe Execution, Error Handling
 */
import type {
  WorkflowGraph,
  WorkflowNode,
  NodeId,
  ExecutionContext,
  ExecutionResult
} from '../types/core';
import { GraphValidator } from './graph-validator';
import { TypeInferenceEngine } from './type-inference';

export interface ExecutionState {
  readonly nodeOutputs: Map<string, unknown>;
  readonly executedNodes: Set<NodeId>;
  readonly logs: string[];
}

export class WorkflowExecutor {
  private validator: GraphValidator;
  private typeInference: TypeInferenceEngine;
  private state: ExecutionState;

  constructor(private graph: WorkflowGraph) {
    this.validator = new GraphValidator(graph);
    this.typeInference = new TypeInferenceEngine(graph);
    this.state = {
      nodeOutputs: new Map(),
      executedNodes: new Set(),
      logs: []
    };
  }

  /**
   * Execute the workflow
   */
  async execute(context: ExecutionContext): Promise<ExecutionResult> {
    try {
      // Validate graph
      const validation = this.validator.validate();
      if (!validation.valid) {
        return {
          success: false,
          error: new Error(`Graph validation failed: ${validation.errors.length} errors`),
          logs: this.state.logs
        };
      }

      // Infer types
      this.typeInference.inferTypes();
      this.log('Type inference complete');

      // Get execution order
      const topSort = this.validator.topologicalSort();
      if (!topSort.success) {
        return {
          success: false,
          error: new Error('Cannot execute: graph contains cycles'),
          logs: this.state.logs
        };
      }

      // Execute nodes in order
      for (const nodeId of topSort.order) {
        await this.executeNode(nodeId, context);
      }

      // Collect final outputs
      const outputs = this.collectOutputs();

      return {
        success: true,
        output: outputs,
        logs: this.state.logs
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
        logs: this.state.logs
      };
    }
  }

  /**
   * Execute a single node
   */
  private async executeNode(nodeId: NodeId, context: ExecutionContext): Promise<void> {
    const node = this.graph.nodes.find(n => n.id === nodeId);
    if (!node) {
      throw new Error(`Node not found: ${nodeId}`);
    }

    this.log(`Executing node: ${node.label} (${node.type})`);

    // Gather inputs
    const inputs = this.gatherInputs(node);

    // Execute based on node type
    const outputs = await this.executeNodeLogic(node, inputs, context);

    // Store outputs
    for (const [portId, value] of Object.entries(outputs)) {
      this.state.nodeOutputs.set(this.makeKey(nodeId, portId), value);
    }

    this.state.executedNodes.add(nodeId);
    this.log(`Node executed: ${node.label}`);
  }

  /**
   * Gather inputs for a node from connected outputs
   */
  private gatherInputs(node: WorkflowNode): Record<string, unknown> {
    const inputs: Record<string, unknown> = {};

    for (const input of node.inputs) {
      const edge = this.graph.edges.find(
        e => e.target === node.id && e.targetPort === input.id
      );

      if (edge) {
        const key = this.makeKey(edge.source, edge.sourcePort);
        const value = this.state.nodeOutputs.get(key);
        inputs[input.id] = value;
      } else if (input.required) {
        throw new Error(`Required input not connected: ${node.id}:${input.id}`);
      }
    }

    return inputs;
  }

  /**
   * Execute node-specific logic
   */
  private async executeNodeLogic(
    node: WorkflowNode,
    inputs: Record<string, unknown>,
    context: ExecutionContext
  ): Promise<Record<string, unknown>> {
    // This is a simplified execution - in a real system, this would
    // delegate to node-specific executors or plugins

    const category = node.category;
    
    if (category === 'trigger') {
      return this.executeTrigger(node, context);
    } else if (category === 'logic') {
      return this.executeLogic(node, inputs);
    } else if (category === 'transform') {
      return this.executeTransform(node, inputs);
    } else if (category === 'effect') {
      return await this.executeEffect(node, inputs);
    } else if (category === 'data') {
      return this.executeData(node);
    } else {
      const _exhaustive: never = category;
      throw new Error(`Unknown node category: ${_exhaustive}`);
    }
  }

  /**
   * Execute trigger node
   */
  private executeTrigger(node: WorkflowNode, context: ExecutionContext): Record<string, unknown> {
    if (node.type === 'trigger.http') {
      return { request: { method: 'GET', url: '/', timestamp: context.timestamp } };
    } else if (node.type === 'trigger.timer') {
      return { timestamp: context.timestamp };
    } else if (node.type === 'trigger.manual') {
      return { data: context.variables.get('triggerData') };
    }
    return {};
  }

  /**
   * Execute logic node
   */
  private executeLogic(node: WorkflowNode, inputs: Record<string, unknown>): Record<string, unknown> {
    if (node.type === 'logic.if') {
      const condition = Boolean(inputs.condition);
      return { true: condition, false: !condition };
    } else if (node.type === 'logic.compare') {
      const result = inputs.a === inputs.b;
      return { result };
    } else if (node.type === 'logic.switch') {
      // Simplified switch logic
      return { case1: true, case2: false, default: false };
    }
    return {};
  }

  /**
   * Execute transform node
   */
  private executeTransform(node: WorkflowNode, inputs: Record<string, unknown>): Record<string, unknown> {
    const input = inputs.input;

    if (node.type === 'transform.map') {
      if (Array.isArray(input)) {
        // In a real system, this would use the configured map function
        return { output: input.map(x => x) };
      }
    } else if (node.type === 'transform.filter') {
      if (Array.isArray(input)) {
        return { output: input.filter(() => true) };
      }
    } else if (node.type === 'transform.reduce') {
      if (Array.isArray(input)) {
        return { output: input.reduce((acc, x) => acc + x, inputs.initial || 0) };
      }
    }

    return { output: input };
  }

  /**
   * Execute effect node (async)
   */
  private async executeEffect(node: WorkflowNode, inputs: Record<string, unknown>): Promise<Record<string, unknown>> {
    if (node.type === 'effect.http') {
      // Simulate HTTP request
      this.log(`HTTP Request: ${inputs.url}`);
      return { response: { status: 200, data: {} } };
    } else if (node.type === 'effect.email') {
      this.log(`Email sent to: ${inputs.to}`);
      return { result: { sent: true } };
    } else if (node.type === 'effect.db') {
      this.log(`DB Write: ${inputs.collection}`);
      return { result: { written: true } };
    }
    return {};
  }

  /**
   * Execute data node
   */
  private executeData(node: WorkflowNode): Record<string, unknown> {
    if (node.type === 'data.constant') {
      return { value: node.data?.value };
    } else if (node.type === 'data.variable') {
      return { value: node.data?.variableName };
    }
    return {};
  }

  /**
   * Collect final outputs from terminal nodes
   */
  private collectOutputs(): Record<string, unknown> {
    const outputs: Record<string, unknown> = {};
    
    // Find terminal nodes
    const terminalNodes = this.graph.nodes.filter(node => {
      return !this.graph.edges.some(e => e.source === node.id);
    });

    for (const node of terminalNodes) {
      const nodeOutputs: Record<string, unknown> = {};
      for (const output of node.outputs) {
        const key = this.makeKey(node.id, output.id);
        nodeOutputs[output.id] = this.state.nodeOutputs.get(key);
      }
      outputs[node.id] = nodeOutputs;
    }

    return outputs;
  }

  private log(message: string): void {
    this.state.logs.push(`[${new Date().toISOString()}] ${message}`);
  }

  private makeKey(nodeId: NodeId, portId: string): string {
    return `${nodeId}:${portId}`;
  }

  /**
   * Get execution state
   */
  getState(): ExecutionState {
    return this.state;
  }
}