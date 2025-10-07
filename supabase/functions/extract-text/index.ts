import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');

// Helper: converte ArrayBuffer para base64 de forma mais eficiente
const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  let binary = '';
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('=== EXTRACT TEXT FUNCTION STARTED ===');
    
    let fileData: Uint8Array;
    let fileName = '';
    let fileType = '';

    // Verificar se é FormData (upload de arquivo) ou JSON (URL de arquivo)
    const contentType = req.headers.get('content-type') || '';
    
    if (contentType.includes('multipart/form-data')) {
      // Upload de arquivo via FormData
      console.log('Processing FormData upload...');
      const formData = await req.formData();
      const file = formData.get('file') as File;
      
      if (!file) {
        throw new Error('Nenhum arquivo encontrado no FormData');
      }
      
      fileName = file.name;
      fileType = file.type;
      fileData = new Uint8Array(await file.arrayBuffer());
      
      console.log(`File: ${fileName}, Type: ${fileType}, Size: ${fileData.length} bytes`);
    } else {
      // URL de arquivo via JSON
      console.log('Processing file URL...');
      const { fileUrl, fileType: type, fileName: name } = await req.json();
      
      fileName = name || 'arquivo';
      fileType = type || 'application/octet-stream';
      
      const response = await fetch(fileUrl);
      fileData = new Uint8Array(await response.arrayBuffer());
      
      console.log(`File URL: ${fileUrl}, Type: ${fileType}, Size: ${fileData.length} bytes`);
    }

    let extractedText = '';

    if (fileType === 'application/pdf') {
      console.log('Processing PDF file...');
      
      try {
        if (!GEMINI_API_KEY) {
          throw new Error('GEMINI_API_KEY não configurada');
        }

        // Converter PDF para base64 (método otimizado)
        const base64Data = arrayBufferToBase64(fileData.buffer);
        console.log(`PDF converted to base64: ${base64Data.length} chars`);
        
        // Usar Gemini 2.0 Flash Experimental (mais rápido e eficiente para PDFs)
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{
                role: 'user',
                parts: [
                  { 
                    text: `Extraia TODO o texto deste documento PDF de forma completa e precisa.

INSTRUÇÕES:
- Preserve formatação, parágrafos e estrutura
- Extraia tabelas e listas mantendo organização
- Identifique títulos e seções
- Mantenha numeração e bullets
- Retorne APENAS o texto extraído, sem comentários adicionais

Se houver imagens com texto (OCR necessário), extraia também.`
                  },
                  {
                    inline_data: {
                      mime_type: 'application/pdf',
                      data: base64Data
                    }
                  }
                ]
              }],
              generationConfig: {
                temperature: 0.1,
                maxOutputTokens: 8192,
              },
              safetySettings: [
                { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
              ]
            })
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Gemini API error response:', errorText);
          throw new Error(`Gemini API retornou ${response.status}: ${errorText.slice(0, 200)}`);
        }

        const data = await response.json();
        
        if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
          console.error('Resposta vazia do Gemini:', JSON.stringify(data).slice(0, 500));
          throw new Error('Gemini não retornou texto válido');
        }

        extractedText = data.candidates[0].content.parts[0].text;
        
        // Validar texto extraído
        if (!extractedText || extractedText.trim().length < 10) {
          throw new Error('Texto extraído muito curto ou vazio');
        }
        
        console.log(`PDF processado com sucesso: ${extractedText.length} caracteres`);
        
      } catch (pdfError) {
        console.error('Erro ao processar PDF:', pdfError);
        const errorMessage = pdfError instanceof Error ? pdfError.message : String(pdfError);
        
        // Fallback amigável
        extractedText = `❌ Erro ao processar PDF "${fileName}"

Detalhes: ${errorMessage}

**Sugestões:**
1. Verifique se o PDF não está corrompido
2. Tente um PDF menor (máx 10MB)
3. Se o PDF contém apenas imagens, converta para imagens JPG/PNG
4. Tente fazer upload novamente

Você pode tentar enviar o conteúdo como texto ou imagem.`;
      }
    } else if (fileType.startsWith('image/')) {
      console.log('Processing image file...');
      
      try {
        if (!GEMINI_API_KEY) {
          throw new Error('GEMINI_API_KEY não configurada');
        }

        // Converter imagem para base64 (método otimizado)
        const base64Data = arrayBufferToBase64(fileData.buffer);
        console.log(`Image converted to base64: ${base64Data.length} chars`);
        
        // Usar Gemini 2.0 Flash Experimental para melhor OCR
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{
                role: 'user',
                parts: [
                  { 
                    text: `Analise esta imagem e extraia TODO o conteúdo textual e visual.

INSTRUÇÕES:
1. Se houver TEXTO na imagem:
   - Transcreva FIELMENTE todo texto visível (OCR)
   - Preserve formatação, títulos, listas
   - Mantenha ordem de leitura natural
   
2. Se NÃO houver texto ou houver elementos visuais importantes:
   - Descreva detalhadamente o conteúdo visual
   - Identifique diagramas, gráficos, esquemas
   - Explique conceitos apresentados visualmente
   
3. SEMPRE retorne conteúdo útil e completo para estudo jurídico/acadêmico

Retorne APENAS o conteúdo extraído/descrito, sem comentários adicionais.`
                  },
                  {
                    inline_data: {
                      mime_type: fileType,
                      data: base64Data
                    }
                  }
                ]
              }],
              generationConfig: {
                temperature: 0.1,
                maxOutputTokens: 8192,
              },
              safetySettings: [
                { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
              ]
            })
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Gemini API error response:', errorText);
          throw new Error(`Gemini API retornou ${response.status}: ${errorText.slice(0, 200)}`);
        }

        const data = await response.json();
        
        if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
          console.error('Resposta vazia do Gemini:', JSON.stringify(data).slice(0, 500));
          throw new Error('Gemini não retornou conteúdo válido');
        }

        extractedText = data.candidates[0].content.parts[0].text;
        
        // Validar conteúdo extraído
        if (!extractedText || extractedText.trim().length < 5) {
          throw new Error('Conteúdo extraído muito curto ou vazio');
        }
        
        console.log(`Imagem processada com sucesso: ${extractedText.length} caracteres`);
        
      } catch (imageError) {
        console.error('Erro ao processar imagem:', imageError);
        const errorMessage = imageError instanceof Error ? imageError.message : String(imageError);
        
        // Fallback amigável
        extractedText = `❌ Erro ao processar imagem "${fileName}"

Detalhes: ${errorMessage}

**Sugestões:**
1. Verifique se a imagem está legível e não corrompida
2. Tente uma imagem de melhor qualidade (JPG, PNG, WEBP)
3. Reduza o tamanho se a imagem for muito grande (máx 5MB)
4. Se houver texto, tente tirar foto com melhor iluminação/foco
5. Tente fazer upload novamente

Você pode tentar descrever o conteúdo ou enviar outra imagem.`;
      }
    } else {
      throw new Error(`Tipo de arquivo não suportado: ${fileType}`);
    }

    // Validação final
    if (!extractedText || extractedText.trim().length < 5) {
      throw new Error('Nenhum conteúdo válido foi extraído do arquivo');
    }

    console.log('✅ Extração de texto concluída com sucesso');
    console.log(`   Arquivo: ${fileName}`);
    console.log(`   Tipo: ${fileType}`);
    console.log(`   Caracteres extraídos: ${extractedText.length}`);
    
    return new Response(
      JSON.stringify({ 
        success: true,
        text: extractedText,
        fileName: fileName,
        fileType: fileType,
        metadata: {
          length: extractedText.length,
          processedAt: new Date().toISOString()
        }
      }), 
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error: any) {
    console.error('❌ Erro na função extract-text:', error);
    console.error('   Stack:', error?.stack);
    
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: errorMessage,
        text: `❌ Não foi possível processar o arquivo

**Erro:** ${errorMessage}

**O que fazer:**
1. Verifique se o arquivo não está corrompido
2. Tente um arquivo menor ou em outro formato
3. Se for PDF, tente converter para imagens JPG/PNG
4. Para imagens, use boa qualidade e iluminação
5. Digite ou cole o conteúdo manualmente se preferir

**Formatos suportados:**
- PDFs (até 10MB)
- Imagens: JPG, PNG, WEBP (até 5MB)`
      }), 
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );
  }
});