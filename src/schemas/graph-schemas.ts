/**
 * Graph Validation Schemas
 * Demonstrates: Complex Schema Composition, Recursive Validation
 */
import { z } from 'zod'
import { workflowNodeSchema } from './node-schemas'

// edge schema
export const 