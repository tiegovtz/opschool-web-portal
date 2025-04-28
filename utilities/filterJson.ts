// 🔍 Filter function
const filterContentBySearch = (content: any[],searchValue:String) => {
    if(content?.length == 0 ) return content;
    if(!searchValue?.trim()) return content;
    return content.filter(item =>
        Object.values(item).some(val =>
            val && typeof (val) == 'string' && val.toString().toLowerCase().includes(searchValue.toLowerCase())
        )
    )
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
 * const input = {
 *   name: "Alice",
 *   location: {
 *     city: "Paris",
 *     country: {
 *       name: "France",
 *       code: "FR"
 *     }
 *   }
 * };
 *
 * const result = extractNestedKeysAndValues(input);
 * console.log(result);
 * // Output:
 * // [
 * //   { key: "name", value: "Alice" },
 * //   {
 * //     key: "location",
 * //     children: [
 * //       { key: "city", value: "Paris" },
 * //       {
 * //         key: "country",
 * //         children: [
 * //           { key: "name", value: "France" },
 * //           { key: "code", value: "FR" }
 * //         ]
 * //       }
 * //     ]
 * //   }
 * // ]
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
// ////////
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
  return data.filter(item => {
    return Object.entries(filters).every(([key, rawValues]) => {
      const values = rawValues.map(extractFilterValue);

      // If item[key] is an object with _id, compare by _id
      if (typeof item[key] === 'object' && item[key]?._id) {
        return values.some(v => v._id === item[key]._id);
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

export {
    filterContentBySearch,
    extractNestedKeysAndValues,
    filterDataByValues,
    filterKeyDataFromArrayOfJson,
}
