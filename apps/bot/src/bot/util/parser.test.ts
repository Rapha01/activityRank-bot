// @ts-nocheck test

import { afterEach, describe, expect, it, vi } from 'vitest';
import { ParserResponseStatus, parseChannel } from './parser.js';

describe('parseObject', () => {
  const channelObject = Symbol('channel object');

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should parse sets of matching objects correctly', () => {
    const mockGet = vi.fn().mockImplementation(() => channelObject);
    const mockInteraction = {
      options: {
        get: vi.mocked(() => ({ value: '123' })),
        getString: vi.mocked(() => '123'),
      },
      guild: {
        channels: {
          cache: {
            get: mockGet,
          },
        },
      },
    };
    const result = parseChannel(mockInteraction as any);
    expect(result.status).toBe(ParserResponseStatus.Success);
    expect(result.object).toBeDefined();
    expect(result.object).toBe(channelObject);
    expect(result.id).toBe('123');

    expect(mockGet).toHaveBeenCalledWith('123');

    mockGet.mockImplementationOnce(() => undefined);
    const result2 = parseChannel(mockInteraction as any);
    expect(result2.status).toBe(ParserResponseStatus.Success);
    expect(result2.object).toBe(undefined);
    expect(result2.id).toBe('123');
  });

  it('should parse only the object parameter correctly', () => {
    const mockGet = vi.fn().mockImplementation(() => channelObject);
    const mockInteraction = {
      options: {
        get: vi.mocked(() => ({ value: '123' })),
        getString: vi.mocked(() => undefined),
      },
      guild: {
        channels: {
          cache: {
            get: mockGet,
          },
        },
      },
    };
    const result = parseChannel(mockInteraction as any);
    expect(result.status).toBe(ParserResponseStatus.Success);
    expect(result.object).toBeDefined();
    expect(result.object).toBe(channelObject);
    expect(result.id).toBe('123');

    expect(mockGet).toHaveBeenCalledWith('123');

    mockGet.mockImplementationOnce(() => undefined);
    const result2 = parseChannel(mockInteraction as any);
    expect(result2.status).toBe(ParserResponseStatus.Success);
    expect(result2.object).toBe(undefined);
    expect(result2.id).toBe('123');
  });

  it('should parse only the string parameter correctly', () => {
    const mockGet = vi.fn().mockImplementation(() => channelObject);
    const mockInteraction = {
      options: {
        get: vi.mocked(() => ({ value: undefined })),
        getString: vi.mocked(() => '123'),
      },
      guild: {
        channels: {
          cache: {
            get: mockGet,
          },
        },
      },
    };
    const result = parseChannel(mockInteraction as any);
    expect(result.status).toBe(ParserResponseStatus.Success);
    expect(result.object).toBeDefined();
    expect(result.object).toBe(channelObject);
    expect(result.id).toBe('123');

    expect(mockGet).toHaveBeenCalledWith('123');

    mockGet.mockImplementationOnce(() => undefined);
    const result2 = parseChannel(mockInteraction as any);
    expect(result2.status).toBe(ParserResponseStatus.Success);
    expect(result2.object).toBe(undefined);
    expect(result2.id).toBe('123');
  });

  it('should parse conflicting sets of matching objects correctly', () => {
    const mockGet = vi.fn().mockImplementation(() => channelObject);
    const mockInteraction = {
      options: {
        get: vi.mocked(() => ({ value: '456' })),
        getString: vi.mocked(() => '123'),
      },
      guild: {
        channels: {
          cache: {
            get: mockGet,
          },
        },
      },
    };

    const result = parseChannel(mockInteraction as any);
    expect(result.status).toBe(ParserResponseStatus.ConflictingInputs);
    expect(result.object).not.toBeDefined();
    expect(result.id).not.toBeDefined();

    expect(mockGet).not.toHaveBeenCalled();
  });

  it('should parse no parameters correctly', () => {
    const mockGet = vi.fn().mockImplementation(() => channelObject);
    const mockInteraction = {
      options: {
        get: vi.mocked(() => undefined),
        getString: vi.mocked(() => undefined),
      },
      guild: {
        channels: {
          cache: {
            get: mockGet,
          },
        },
      },
    };

    const result = parseChannel(mockInteraction as any);
    expect(result.status).toBe(ParserResponseStatus.NoInput);
    expect(result.object).not.toBeDefined();
    expect(result.id).not.toBeDefined();

    expect(mockGet).not.toHaveBeenCalled();
  });
});
