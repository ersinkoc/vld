import { VldBase, ParseResult } from './base';
import { VldError, createIssue } from '../errors';
import { getMessages } from '../locales';

/**
 * Codec transform functions for bidirectional transformations
 */
export interface CodecTransform<TInput, TOutput> {
  decode: (value: TInput) => TOutput | Promise<TOutput>;
  encode: (value: TOutput) => TInput | Promise<TInput>;
}

/**
 * Codec validator for bidirectional transformations
 * Enables converting between different data representations
 */
export class VldCodec<TInput, TOutput> extends VldBase<TInput, TOutput> {
  private readonly inputValidator: VldBase<unknown, TInput>;
  private readonly outputValidator: VldBase<unknown, TOutput>;
  private readonly codecTransform: CodecTransform<TInput, TOutput>;
  
  constructor(
    inputValidator: VldBase<unknown, TInput>,
    outputValidator: VldBase<unknown, TOutput>,
    codecTransform: CodecTransform<TInput, TOutput>
  ) {
    super();
    this.inputValidator = inputValidator;
    this.outputValidator = outputValidator;
    this.codecTransform = codecTransform;
  }
  
  /**
   * Parse (decode) a value from input to output format
   */
  parse(value: unknown): TOutput {
    const result = this.safeParse(value);
    if (!result.success) {
      throw result.error;
    }
    return result.data;
  }
  
  /**
   * Safely parse (decode) a value from input to output format
   */
  safeParse(value: unknown): ParseResult<TOutput> {
    // First validate the input
    const inputResult = this.inputValidator.safeParse(value);
    if (!inputResult.success) {
      return inputResult as ParseResult<TOutput>;
    }
    
    try {
      // Then decode to output
      const decoded = this.codecTransform.decode(inputResult.data);
      
      // Handle async decode
      if (decoded instanceof Promise) {
        throw new VldError([
          createIssue('custom', [], getMessages().codecAsyncNotSupported)
        ]);
      }
      
      // Validate the decoded output
      return this.outputValidator.safeParse(decoded);
    } catch (error) {
      if (error instanceof VldError) {
        return { success: false, error };
      }
      return {
        success: false,
        error: new VldError([
          createIssue('custom', [], getMessages().codecDecodeFailed)
        ])
      };
    }
  }
  
  /**
   * Encode a value from output back to input format
   */
  encode(value: unknown): TInput {
    const result = this.safeEncode(value);
    if (!result.success) {
      throw result.error;
    }
    return result.data;
  }
  
  /**
   * Safely encode a value from output back to input format
   */
  safeEncode(value: unknown): ParseResult<TInput> {
    // First validate the output
    const outputResult = this.outputValidator.safeParse(value);
    if (!outputResult.success) {
      return outputResult as ParseResult<TInput>;
    }
    
    try {
      // Then encode to input
      const encoded = this.codecTransform.encode(outputResult.data);
      
      // Handle async encode
      if (encoded instanceof Promise) {
        throw new VldError([
          createIssue('custom', [], getMessages().codecAsyncNotSupported)
        ]);
      }
      
      // Validate the encoded input
      return this.inputValidator.safeParse(encoded);
    } catch (error) {
      if (error instanceof VldError) {
        return { success: false, error };
      }
      return {
        success: false,
        error: new VldError([
          createIssue('custom', [], getMessages().codecEncodeFailed)
        ])
      };
    }
  }
  
  /**
   * Async version of parse (decode)
   */
  async parseAsync(value: unknown): Promise<TOutput> {
    const result = await this.safeParseAsync(value);
    if (!result.success) {
      throw result.error;
    }
    return result.data;
  }
  
  /**
   * Async version of safeParse (decode)
   */
  async safeParseAsync(value: unknown): Promise<ParseResult<TOutput>> {
    // First validate the input
    const inputResult = this.inputValidator.safeParse(value);
    if (!inputResult.success) {
      return inputResult as ParseResult<TOutput>;
    }
    
    try {
      // Then decode to output (supports async)
      const decoded = await this.codecTransform.decode(inputResult.data);
      
      // Validate the decoded output
      return this.outputValidator.safeParse(decoded);
    } catch (error) {
      if (error instanceof VldError) {
        return { success: false, error };
      }
      return {
        success: false,
        error: new VldError([
          createIssue('custom', [], getMessages().codecDecodeFailed)
        ])
      };
    }
  }
  
  /**
   * Async version of encode
   */
  async encodeAsync(value: unknown): Promise<TInput> {
    const result = await this.safeEncodeAsync(value);
    if (!result.success) {
      throw result.error;
    }
    return result.data;
  }
  
  /**
   * Async version of safeEncode
   */
  async safeEncodeAsync(value: unknown): Promise<ParseResult<TInput>> {
    // First validate the output
    const outputResult = this.outputValidator.safeParse(value);
    if (!outputResult.success) {
      return outputResult as ParseResult<TInput>;
    }
    
    try {
      // Then encode to input (supports async)
      const encoded = await this.codecTransform.encode(outputResult.data);
      
      // Validate the encoded input
      return this.inputValidator.safeParse(encoded);
    } catch (error) {
      if (error instanceof VldError) {
        return { success: false, error };
      }
      return {
        success: false,
        error: new VldError([
          createIssue('custom', [], getMessages().codecEncodeFailed)
        ])
      };
    }
  }
  
  /**
   * Create a codec validator
   */
  static create<TInput, TOutput>(
    inputValidator: VldBase<unknown, TInput>,
    outputValidator: VldBase<unknown, TOutput>,
    codecTransform: CodecTransform<TInput, TOutput>
  ): VldCodec<TInput, TOutput> {
    return new VldCodec(inputValidator, outputValidator, codecTransform);
  }
}