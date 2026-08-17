import { v, flattenError, tryCatch, match, Ok, Err } from '@oxog/vld'

export interface ValidationOutput {
  success: boolean
  data?: unknown
  error?: {
    issues: Array<{
      code?: string
      path?: Array<string | number>
      message: string
      expected?: string
      received?: string
    }>
    message: string
  }
  rawMessage: string
  executionTimeMs?: number
}

/**
 * Executes a user-provided VLD schema string against JSON data
 */
export function runVldValidation(schemaCode: string, jsonData: string): ValidationOutput {
  const startTime = performance.now()
  let parsedData: unknown

  try {
    parsedData = JSON.parse(jsonData)
  } catch (err) {
    return {
      success: false,
      rawMessage: `JSON Syntax Error: ${(err as Error).message}`,
      executionTimeMs: 0,
    }
  }

  try {
    // 1. Strip import statements
    let jsCode = schemaCode.replace(/import\s+[\s\S]*?from\s+['"][^'"]+['"];?/g, '')

    // 2. Strip TypeScript type and interface definitions
    jsCode = jsCode.replace(/type\s+\w+\s*=\s*[^;\n]+;?/g, '')
    jsCode = jsCode.replace(/interface\s+\w+\s*\{[\s\S]*?\}/g, '')

    // 3. Strip basic type annotations like (p: string) or (val: unknown)
    jsCode = jsCode.replace(/\((\w+):\s*[a-zA-Z0-9_<>|[\]\s]+\)/g, '($1)')

    // 4. Wrap code to extract the schema object
    const wrappedCode = `
      "use strict";
      let __schema__ = null;
      ${jsCode}

      // Check common variable names
      if (typeof schema !== 'undefined' && schema && typeof schema.safeParse === 'function') {
        __schema__ = schema;
      } else if (typeof userSchema !== 'undefined' && userSchema && typeof userSchema.safeParse === 'function') {
        __schema__ = userSchema;
      } else if (typeof apiResponseSchema !== 'undefined' && apiResponseSchema && typeof apiResponseSchema.safeParse === 'function') {
        __schema__ = apiResponseSchema;
      } else if (typeof productSchema !== 'undefined' && productSchema && typeof productSchema.safeParse === 'function') {
        __schema__ = productSchema;
      } else if (typeof contactFormSchema !== 'undefined' && contactFormSchema && typeof contactFormSchema.safeParse === 'function') {
        __schema__ = contactFormSchema;
      } else if (typeof companySchema !== 'undefined' && companySchema && typeof companySchema.safeParse === 'function') {
        __schema__ = companySchema;
      } else if (typeof addressSchema !== 'undefined' && addressSchema && typeof addressSchema.safeParse === 'function') {
        __schema__ = addressSchema;
      }

      return __schema__;
    `

    // Evaluate user schema with VLD library objects
    const evalFn = new Function('v', 'flattenError', 'tryCatch', 'match', 'Ok', 'Err', wrappedCode)
    const schemaInstance = evalFn(v, flattenError, tryCatch, match, Ok, Err)

    if (!schemaInstance || typeof schemaInstance.safeParse !== 'function') {
      return {
        success: false,
        rawMessage: 'Could not find a valid VLD schema in your code. Make sure you define a schema (e.g. `const schema = v.object({...})` or `const userSchema = ...`).',
        executionTimeMs: Math.round((performance.now() - startTime) * 100) / 100,
      }
    }

    const result = schemaInstance.safeParse(parsedData)
    const endTime = performance.now()
    const execTime = Math.round((endTime - startTime) * 1000) / 1000

    if (result.success) {
      return {
        success: true,
        data: result.data,
        rawMessage: JSON.stringify(
          {
            success: true,
            data: result.data,
          },
          null,
          2
        ),
        executionTimeMs: execTime,
      }
    } else {
      const issues = result.error?.issues || []
      return {
        success: false,
        error: {
          issues,
          message: result.error?.message || 'Validation failed',
        },
        rawMessage: JSON.stringify(
          {
            success: false,
            error: {
              issues,
              message: result.error?.message,
            },
          },
          null,
          2
        ),
        executionTimeMs: execTime,
      }
    }
  } catch (err) {
    return {
      success: false,
      rawMessage: `Schema Execution Error: ${(err as Error).message}`,
      executionTimeMs: Math.round((performance.now() - startTime) * 100) / 100,
    }
  }
}
