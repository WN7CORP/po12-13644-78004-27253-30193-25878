// Helpers para compressão e otimização de dados

// Comprimir string para armazenamento
export const compressString = async (str: string): Promise<string> => {
  if (!str) return '';
  
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(data);
        controller.close();
      }
    });
    
    const compressed = await new Response(
      stream.pipeThrough(new CompressionStream('gzip'))
    ).blob();
    
    const buffer = await compressed.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    return btoa(String.fromCharCode(...bytes));
  } catch (e) {
    console.warn('Compression failed, returning original:', e);
    return str;
  }
};

// Descomprimir string
export const decompressString = async (compressed: string): Promise<string> => {
  if (!compressed) return '';
  
  try {
    const bytes = Uint8Array.from(atob(compressed), c => c.charCodeAt(0));
    
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(bytes);
        controller.close();
      }
    });
    
    const decompressed = await new Response(
      stream.pipeThrough(new DecompressionStream('gzip'))
    ).text();
    
    return decompressed;
  } catch (e) {
    console.warn('Decompression failed, returning original:', e);
    return compressed;
  }
};

// Otimizar objeto para armazenamento
export const optimizeForStorage = (obj: any): any => {
  if (!obj) return obj;
  
  // Remove funções e símbolos
  return JSON.parse(JSON.stringify(obj, (key, value) => {
    if (typeof value === 'function' || typeof value === 'symbol') {
      return undefined;
    }
    return value;
  }));
};

// Calcular tamanho de objeto em bytes
export const getObjectSize = (obj: any): number => {
  const str = JSON.stringify(obj);
  return new Blob([str]).size;
};

// Verificar se deve comprimir baseado no tamanho
export const shouldCompress = (data: any, threshold = 1024): boolean => {
  return getObjectSize(data) > threshold;
};
