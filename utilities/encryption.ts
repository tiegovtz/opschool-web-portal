const secretKey = '1234567890123456'; // Must be 16 characters for AES-128
const iv = crypto.getRandomValues(new Uint8Array(16)); // Random IV (Initialization Vector)

 const dataEncrypt=async(text: string): Promise<string> =>{
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secretKey),
    { name: "AES-CBC" },
    false,
    ["encrypt"]
  );

  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-CBC", iv },
    key,
    encoder.encode(text)
  );

  const buffer = new Uint8Array([...iv, ...new Uint8Array(ciphertext)]);
  return btoa(String.fromCharCode(...buffer));
}

const  dataDecrypt= async(encrypted: string): Promise<string> =>{
  const data = Uint8Array.from(atob(encrypted), c => c.charCodeAt(0));
  const decoder = new TextDecoder();

  const iv = data.slice(0, 16);
  const ciphertext = data.slice(16);

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secretKey),
    { name: "AES-CBC" },
    false,
    ["decrypt"]
  );

  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-CBC", iv },
    key,
    ciphertext
  );

  return decoder.decode(plaintext);
}


export {
  dataEncrypt,
  dataDecrypt
}