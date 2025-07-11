import { jest } from '@jest/globals';
import { debounce } from '../../src/utils/debounce.js';

// Tell Jest to use fake timers
jest.useFakeTimers();

describe('debounce', () => {
  let mockFunction;
  let debouncedFunction;

  beforeEach(() => {
    // Clear all timers before each test
    jest.clearAllTimers();
    // Create a fresh mock function for each test
    mockFunction = jest.fn();
  });

  afterEach(() => {
    // Clean up any remaining timers
    jest.clearAllTimers();
  });

  it('should create a debounced function', () => {
    debouncedFunction = debounce(mockFunction, 100);
    expect(typeof debouncedFunction).toBe('function');
  });

  it('should not call the function immediately', () => {
    debouncedFunction = debounce(mockFunction, 100);
    debouncedFunction();
    expect(mockFunction).not.toHaveBeenCalled();
  });

  it('should call the function after the delay', () => {
    debouncedFunction = debounce(mockFunction, 100);
    debouncedFunction('arg1', 'arg2');
    
    // Fast-forward time by 100ms
    jest.advanceTimersByTime(100);
    
    expect(mockFunction).toHaveBeenCalledTimes(1);
    expect(mockFunction).toHaveBeenCalledWith('arg1', 'arg2');
  });

  it('should only call the function once for multiple rapid calls', () => {
    debouncedFunction = debounce(mockFunction, 100);
    
    // Call the debounced function multiple times rapidly
    debouncedFunction('call1');
    debouncedFunction('call2');
    debouncedFunction('call3');
    debouncedFunction('call4');
    
    // Fast-forward time by 100ms
    jest.advanceTimersByTime(100);
    
    // Should only be called once with the last arguments
    expect(mockFunction).toHaveBeenCalledTimes(1);
    expect(mockFunction).toHaveBeenCalledWith('call4');
  });

  it('should reset the timer on subsequent calls', () => {
    debouncedFunction = debounce(mockFunction, 100);
    
    debouncedFunction('first');
    
    // Advance timer by 50ms (not enough to trigger)
    jest.advanceTimersByTime(50);
    expect(mockFunction).not.toHaveBeenCalled();
    
    // Call again, which should reset the timer
    debouncedFunction('second');
    
    // Advance timer by another 50ms (still not enough from the second call)
    jest.advanceTimersByTime(50);
    expect(mockFunction).not.toHaveBeenCalled();
    
    // Advance timer by another 50ms (now 100ms from the second call)
    jest.advanceTimersByTime(50);
    expect(mockFunction).toHaveBeenCalledTimes(1);
    expect(mockFunction).toHaveBeenCalledWith('second');
  });

  it('should allow multiple independent debounced functions', () => {
    const mockFunction2 = jest.fn();
    const debouncedFunction1 = debounce(mockFunction, 100);
    const debouncedFunction2 = debounce(mockFunction2, 200);
    
    debouncedFunction1('func1');
    debouncedFunction2('func2');
    
    // Advance timer by 100ms
    jest.advanceTimersByTime(100);
    
    // Only the first function should have been called
    expect(mockFunction).toHaveBeenCalledTimes(1);
    expect(mockFunction).toHaveBeenCalledWith('func1');
    expect(mockFunction2).not.toHaveBeenCalled();
    
    // Advance timer by another 100ms (total 200ms)
    jest.advanceTimersByTime(100);
    
    // Now both functions should have been called
    expect(mockFunction2).toHaveBeenCalledTimes(1);
    expect(mockFunction2).toHaveBeenCalledWith('func2');
  });

  it('should handle zero delay', () => {
    debouncedFunction = debounce(mockFunction, 0);
    debouncedFunction('immediate');
    
    // Even with 0 delay, it should still be async
    expect(mockFunction).not.toHaveBeenCalled();
    
    // Advance timers by any amount
    jest.advanceTimersByTime(0);
    
    expect(mockFunction).toHaveBeenCalledTimes(1);
    expect(mockFunction).toHaveBeenCalledWith('immediate');
  });

  it('should preserve the context (this)', () => {
    const context = { value: 42 };
    const mockFunctionWithContext = jest.fn(function() {
      return this.value;
    });
    
    debouncedFunction = debounce(mockFunctionWithContext, 100);
    debouncedFunction.call(context);
    
    jest.advanceTimersByTime(100);
    
    expect(mockFunctionWithContext).toHaveBeenCalledTimes(1);
    expect(mockFunctionWithContext.mock.instances[0]).toBe(context);
  });
});