/**
 * Filters an array of objects based on a search string.
 *
 * This function scans through every object in the array and checks all of its
 * values. If at least one value is a string and contains the search text
 * (case-insensitive), the object is included in the returned result.
 *
 * @param {any[]} content - The array of objects to be filtered.
 * @param {string} searchValue - The search text used to filter object values.
 * @returns {any[]}
 *   - A filtered array of objects that match the search term.
 *   - If the search text is empty or the content array is empty, the original
 *     array is returned unchanged.
 *
 * @example
 * const items = [
 *   { title: "Introduction to Physics", level: "Form 1" },
 *   { title: "Advanced Chemistry", level: "Form 3" },
 *   { title: "Basic Mathematics", level: "Form 1" },
 * ];
 *
 * const result = filterContentBySearch(items, "chem");
 * console.log(result);
 *
 * // Output:
 * [
 *   { title: "Advanced Chemistry", level: "Form 3" }
 * ]
 *
 * @example
 *  If searchValue is empty, the function returns the original array:
 * filterContentBySearch(items, "");
 *  → returns all items
 *
 * @example
 *  Search works on ANY string property:
 * filterContentBySearch(items, "form 1");
 *  → returns all objects where any field contains "form 1"
 */

const filterContentBySearch = (content: any[], searchValue: String) => {
  if (content?.length == 0) return content;
  if (!searchValue?.trim()) return content;
  return content.filter((item) =>
    Object.values(item).some(
      (val) =>
        val &&
        typeof val == "string" &&
        val.toString().toLowerCase().includes(searchValue.toLowerCase())
    )
  );
};

/**
 * Recursively extracts keys and values from a nested object while preserving the hierarchical structure.
 *
 * @function extractNestedKeysAndValues
 * @param {Object} obj - The input object from which to extract keys and values.
 * @returns {Array<Object>} An array of key-value pairs. If a value is a nested object, it is returned in a `children` array.
 *
 * Each item in the returned array has the shape:
 * ```js
 * {
 *   key: string,           // The property key
 *   value?: any,           // The value (only for primitives)
 *   children?: Array       // Nested key-value pairs (if the value is an object)
 * }
 * ```
 *
 * @example
 * const data = [
 *   { name: "Alice", age: 25, city: "Paris" },
 *   { name: "Bob", age: 30, city: "Paris" },
 *   { name: "Charlie", age: 25, city: "London" }
 * ];
 *
 * const result = extractNestedKeysAndValues(data);
 * console.log(result);
 * 
 *  Output:
 * [
 *   { key: "name", values: ["Alice", "Bob", "Charlie"] },
 *   { key: "age", values: [25, 30] },
 *   { key: "city", values: ["Paris", "London"] }
 * ]
 */
type InputObject = Record<string, any>;

type KeyValues = {
  key: string;
  values: any[];
};

const extractNestedKeysAndValues = (data: InputObject[]): KeyValues[] => {
  const map = new Map<string, Set<string>>();

  for (const obj of data) {
    for (const key in obj) {
      const value = JSON.stringify(obj[key]); // Serialize value
      if (!map.has(key)) {
        map.set(key, new Set());
      }
      map.get(key)!.add(value);
    }
  }

  // Convert Map to array of { key, values[] }
  const result: KeyValues[] = [];
  for (const [key, valueSet] of map.entries()) {
    result.push({
      key,
      values: Array.from(valueSet).map((v) => JSON.parse(v)), // Deserialize back
    });
  }

  return result;
};




type DataItem = Record<string, any>;

type Filters = {
  [key: string]: any[];
};

const extractFilterValue = (value: any): any => {
  // Unwrap Vue Devtools _custom reactive wrapper (if present)
  if (value && value._custom?.value) {
    return value._custom.value;
  }
  return value;
};

const filterDataByValues = <T extends DataItem>(
  data: T[],
  filters: Filters
): T[] => {
  return data.filter((item) => {
    return Object.entries(filters).every(([key, rawValues]) => {
      const values = rawValues.map(extractFilterValue);

      // If item[key] is an object with _id, compare by _id
      if (typeof item[key] === "object" && item[key]?._id) {
        return values.some((v) => v._id === item[key]._id);
      }

      // Otherwise, do a direct match
      return values.includes(item[key]);
    });
  });
};

/**
 * Groups an array of objects by a specific key and structures the result.
 *
 * @template T - The type of the objects inside the array.
 * @param {T[]} data - Array of objects to group.
 * @param {keyof T} key - The key to group the objects by.
 * @returns {Array<{ dataOfKey: Pick<T, keyof T>; data: T[] }>}
 *   - Each grouped object contains:
 *     - `dataOfKey`: the key and its value.
 *     - `data`: an array of all objects matching that key.
 *
 * @example
 * const students = [
 *   { name: "Baraka", age: 20 },
 *   { name: "George", age: 21 },
 *   { name: "Elisante", age: 20 },
 *   { name: "Xyden", age: 22 },
 * ];
 *
 * const result = fillterKeyDataFromArrayOfJson(students, "age");
 * console.log(result);
 *
 * // Output:
 * [
 *   { dataOfKey: { age: 20 }, data: [{...}, {...}] },
 *   { dataOfKey: { age: 21 }, data: [{...}] },
 *   { dataOfKey: { age: 22 }, data: [{...}] }
 * ]
 */
const filterKeyDataFromArrayOfJson = <T>(
  data: T[],
  key: string,
  order: string[] = []
): { dataOfKey: any; data: T[] }[] => {
  if (!Array.isArray(data) || !key) return [];

  const groupedMap = new Map<string, T[]>();

  for (const item of data) {
    const keys = key.split(".");
    let keyValue: any = item;

    for (const k of keys) {
      keyValue = keyValue?.[k];
    }

    if (keyValue !== undefined) {
      const keyStr = String(keyValue); // always use string as map key
      if (!groupedMap.has(keyStr)) {
        groupedMap.set(keyStr, []);
      }
      groupedMap.get(keyStr)!.push(item);
    }
  }

  // Convert Map to array
  let result = Array.from(groupedMap.entries()).map(([keyStr, items]) => ({
    dataOfKey: keyStr,
    data: items,
  }));

  // Sort based on custom order array
  result.sort((a, b) => {
    const indexA = order.indexOf(a.dataOfKey.toLowerCase());
    const indexB = order.indexOf(b.dataOfKey.toLowerCase());

    // If both found in order array, sort by their index
    if (indexA !== -1 && indexB !== -1) {
      return indexA - indexB;
    }
    // If only A found, A comes first
    if (indexA !== -1) return -1;
    // If only B found, B comes first
    if (indexB !== -1) return 1;
    // Otherwise sort alphabetically
    return a.dataOfKey.localeCompare(b.dataOfKey);
  });

  return result;
};

/**
 * Removes objects from an array where the given key matches one or more specified values.
 *
 * @template T - The type of the array elements.
 * @param {T[]} array - The array of objects to filter.
 * @param {keyof T} key - The key to check in each object.
 * @param {any | any[]} values - A single value or an array of values to remove.
 * @returns {T[]} - A new array without the matching objects.
 *
 * @example
 * const students = [
 *   { name: "Baraka", age: 20 },
 *   { name: "George", age: 21 },
 *   { name: "Elisante", age: 22 },
 *   { name: "Xyden", age: 20 },
 * ];
 *
 * const result = removeDataFromArrayOfJson(students, "age", [20, 22]);
 * console.log(result);
 *
 *  Output:
 * [
 *   { name: "George", age: 21 }
 * ]
 */
const removeDataFromArrayOfJson = <T>(
  array: T[],
  key: string,
  value: any
): T[] => {
  if (!Array.isArray(array) || !key) return array;

  return array.filter((item) => {
    const keys = key.split(".");
    let target: any = item;

    for (const k of keys) {
      if (target && typeof target === "object" && k in target) {
        target = target[k];
      } else {
        // Key not found → KEEP the item
        return true;
      }
    }

    // Key found, now compare value
    return target !== value;
  });
};

export {
  filterContentBySearch,
  extractNestedKeysAndValues,
  filterDataByValues,
  filterKeyDataFromArrayOfJson,
  removeDataFromArrayOfJson,
};
