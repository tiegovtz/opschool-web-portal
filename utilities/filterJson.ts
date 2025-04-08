// 🔍 Filter function
const filterContentBySearch = (content: any[],searchValue:String) => {
    if(content.length == 0 ) return content;
    if(!searchValue.trim()) return content;
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


const extractNestedKeysAndValues = (data: InputObject[]): KeyValues[] =>{
  const map = new Map<string, Set<any>>();

  for (const obj of data) {
    for (const key in obj) {
      if (!map.has(key)) {
        map.set(key, new Set());
      }
      map.get(key)!.add(obj[key]);
    }
  }

  // Convert Map to array of { key, values[] }
  const result: KeyValues[] = [];
  for (const [key, valueSet] of map.entries()) {
    result.push({
      key,
      values: Array.from(valueSet),
    });
  }

  return result;
}


export {
    filterContentBySearch,
    extractNestedKeysAndValues
}
