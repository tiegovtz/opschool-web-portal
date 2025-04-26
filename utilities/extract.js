/**
 * Extracts the value of a specified key from each object in an array of JSON objects.
 * 
 * This function iterates through the array and retrieves the value associated with the 
 * provided key from each object. If the key does not exist in an object, it is ignored 
 * in the returned array.
 * 
 * @param {Array} array - The array of JSON objects to search through.
 * @param {string} key - The key whose value needs to be extracted from each object.
 * 
 * @returns {Array} - An array of values corresponding to the provided key from each object in the input array.
 *                     If the key does not exist in an object, that object is skipped.
 * 
 * @example
 * const data = [
 *   { id: 1, name: "Alice", age: 25 },
 *   { id: 2, name: "Bob", age: 30 },
 *   { id: 3, name: "Charlie", age: 35 }
 * ];
 * const names = extractValueFromArray(data, "name");
 * console.log(names); // Output: ["Alice", "Bob", "Charlie"]
 */
function extractValueFromArray(array, key) {
    return array.map(item => item[key]).filter(value => value !== undefined);
  }
  
  /**
   * Extracts the value of a specified key from a JSON object.
   * 
   * This function checks whether the provided key exists in the given JSON object. If the key 
   * is found, its corresponding value is returned. Otherwise, it returns `undefined`.
   * 
   * @param {Object} json - The JSON object to search through.
   * @param {string} key - The key whose value needs to be extracted from the JSON object.
   * 
   * @returns {*} - The value corresponding to the specified key if it exists, otherwise `undefined`.
   * 
   * @example
   * const data = { id: 1, name: "Alice", age: 25 };
   * const name = extractValueFromJson(data, "name");
   * console.log(name); // Output: "Alice"
   * 
   * const country = extractValueFromJson(data, "country");
   * console.log(country); // Output: undefined
   */
  function extractJsonFromJson(json, key) {
    return json.hasOwnProperty(key) ? json[key] : undefined;
  }
  
  /**
 * Extracts the value of a specified key (or a subkey within an object) from a JSON object.
 * 
 * This function checks whether the provided key exists in the given JSON object. If the key's value is an object,
 * you can specify a `subKey` to extract a specific value from that object. If the key or subkey does not exist,
 * it returns `undefined`.
 * 
 * @param {Object} json - The JSON object to search through.
 * @param {string} key - The key whose value needs to be extracted from the JSON object.
 * @param {string} [subKey] - Optional. The key whose value should be extracted from the nested object (if the value of the main key is an object).
 * 
 * @returns {*} - The value corresponding to the specified key or subkey if it exists, otherwise `undefined`.
 * 
 * @example
 * const data = { id: 1, name: "Alice", address: { city: "New York", zip: "10001" } };
 * const city = extractValueFromJson(data, "address", "city");
 * console.log(city); // Output: "New York"
 * 
 * const zip = extractValueFromJson(data, "address", "zip");
 * console.log(zip); // Output: "10001"
 * 
 * const country = extractValueFromJson(data, "address", "country");
 * console.log(country); // Output: undefined
 */
function extractValueFromJson(json, key, subKey) {
    const value = json[key];
    if (value && typeof value === "object" && subKey) {
      return value[subKey];
    }
    return value;
  }
  
  export {
    extractValueFromArray,
    extractValueFromJson,
    extractJsonFromJson
  }