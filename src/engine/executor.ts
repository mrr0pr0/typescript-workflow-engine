/**
 * Workflow Execution Engine
 * Demonstrates: Type-safe Execution, Error Handling
 */

import type { WorkflowGraph, WorkflowNode, NodeId, ExecutionContext, ExecutionResult } from '../types/core';
import { GraphVisitor } from './graph-validator';
import { TypeInferenceEngine } from './type-inference';

