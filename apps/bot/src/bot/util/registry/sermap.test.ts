import { describe, expect, it } from 'vitest';
import { type Serializable, SerializableMap } from './serializableMap';

// Mock Serializable class
class Key implements Serializable {
  constructor(private numbers: number[]) {}

  get serialized() {
    return this.numbers.join(' ');
  }
}

describe('SerializableMap', () => {
  it('should set and get values correctly', () => {
    const smap = new SerializableMap<Key, string>();
    const key1 = new Key([1, 2, 3]);
    const key2 = new Key([4, 5, 6]);

    smap.set(key1, 'value1');
    smap.set(key2, 'value2');

    expect(smap.get(key1)).toBe('value1');
    expect(smap.get(key2)).toBe('value2');
  });

  it('should treat different keys of the same serialization as identical', () => {
    const smap = new SerializableMap<Key, string>();
    const key1 = new Key([1, 2, 3]); // same values in array: both Keys serialize to '1 2 3'
    const key2 = new Key([1, 2, 3]);

    smap.set(key1, 'value1');
    expect(smap.get(key2)).toBe('value1');

    smap.set(key2, 'value2');
    expect(smap.get(key1)).toBe('value2');
  });

  it('should handle has correctly', () => {
    const smap = new SerializableMap<Key, string>();
    const key1 = new Key([1, 2, 3]);
    const key2 = new Key([4, 5, 6]);

    smap.set(key1, 'value1');

    expect(smap.has(key1)).toBe(true);
    expect(smap.has(key2)).toBe(false);
  });

  it('should delete entries correctly', () => {
    const smap = new SerializableMap<Key, string>();
    const key1 = new Key([1, 2, 3]);
    const key2 = new Key([4, 5, 6]);

    smap.set(key1, 'value1');
    smap.set(key2, 'value2');

    expect(smap.delete(key1)).toBe(true);
    expect(smap.get(key1)).toBeUndefined();
    expect(smap.has(key1)).toBe(false);
    expect(smap.has(key2)).toBe(true);

    expect(smap.delete(key1)).toBe(false); // Key1 is already deleted
  });

  it('should clear all entries', () => {
    const smap = new SerializableMap<Key, string>();
    const key1 = new Key([1, 2, 3]);
    const key2 = new Key([4, 5, 6]);

    smap.set(key1, 'value1');
    smap.set(key2, 'value2');

    smap.clear();

    expect(smap.get(key1)).toBeUndefined();
    expect(smap.get(key2)).toBeUndefined();
    expect(smap.has(key1)).toBe(false);
    expect(smap.has(key2)).toBe(false);
  });

  it('should return correct size', () => {
    const smap = new SerializableMap<Key, string>();
    const key1 = new Key([1, 2, 3]);
    const key2 = new Key([4, 5, 6]);

    expect(smap.size).toBe(0);

    smap.set(key1, 'value1');
    expect(smap.size).toBe(1);

    smap.set(key2, 'value2');
    expect(smap.size).toBe(2);

    smap.delete(key1);
    expect(smap.size).toBe(1);

    smap.clear();
    expect(smap.size).toBe(0);
  });
});
