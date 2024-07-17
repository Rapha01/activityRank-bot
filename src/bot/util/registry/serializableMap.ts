/**
 * Interface representing an object that can be serialized to a string.
 * @example
 * class Key implements Serializable {
 *    constructor (private numbers: number[]) {}
 *    get serialized() {
 *        return this.numbers.join(' ');
 *    }
 * }
 */
export interface Serializable {
  /**
   * Must be implemented to provide the serialized representation of the object.
   * @returns A string representation of the object.
   */
  get serialized(): string;
}

/**
 * A specialized Map that uses Serializable objects as keys and allows the same operations as the native Map class.
 * This is useful in instances where an array or object should be used as the key to a Map, but should be compared with equality rather than Object.is()
 *
 * @example
 * class Key implements Serializable {
 *    constructor (private numbers: number[]) {}
 *    get serialized() {
 *        return this.numbers.join(' ');
 *    }
 * }
 *
 * const obj1 = new Key([1, 2, 3]);
 * const obj2 = new Key([1, 2, 3]);
 *
 * const map = new Map();
 * map.set(obj1, true);
 * map.has(obj1) // true
 * map.has(obj2) // false
 *
 * const smap = new SerializableMap();
 * smap.set(obj1, true);
 * smap.has(obj1) // true
 * smap.has(obj2) // true
 * @typeParam K - The type of keys which must extend Serializable.
 * @typeParam V - The type of values stored in the map.
 */
export class SerializableMap<K extends Serializable, V> {
  private map = new Map<string, V>();

  /**
   * Retrieves the value associated with the specified key.
   * @param key - The Serializable key to retrieve the value for.
   * @returns The value associated with the key, or undefined if the key is not found.
   */
  get(key: K): V | undefined {
    return this.map.get(key.serialized);
  }

  /**
   * Sets a key-value pair in the map.
   * @param key - The Serializable key for the entry.
   * @param value - The value associated with the key.
   * @returns The updated SerializableMap instance.
   */
  set(key: K, value: V) {
    this.map.set(key.serialized, value);
    return this;
  }

  /**
   * Removes all entries from the map.
   */
  clear() {
    this.map.clear();
  }

  /**
   * Deletes the entry associated with the specified key.
   * @param key - The Serializable key to delete.
   * @returns True if the key exists and has been removed, false otherwise.
   */
  delete(key: K) {
    return this.map.delete(key.serialized);
  }

  /**
   * Checks if the map contains an entry with the specified key.
   * @param key - The Serializable key to check for.
   * @returns True if the map contains the key, false otherwise.
   */
  has(key: K) {
    return this.map.has(key.serialized);
  }

  /**
   * @returns the number of elements in the map.
   */
  get size() {
    return this.map.size;
  }
}
