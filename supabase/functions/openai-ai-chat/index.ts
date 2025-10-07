import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ChatMessage {
  role: string;
  content: string;
  fileData?: {
    data: string;
    mimeType: string;
    name: string;
  };
}

interface OpenAIRequest {
  message: string;
  fileData?: {
    data: string;
    mimeType: string;
    name: string;
  };
  conversationHistory?: ChatMessage[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { message, fileData, conversationHistory = [] }: OpenAIRequest = await req.json()
    
    // Get OpenAI API key from secrets
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    console.log('Available env vars:', Object.keys(Deno.env.toObject()))
    console.log('OPENAI_API_KEY exists:', !!openaiApiKey)
    
    if (!openaiApiKey) {
      console.error('OPENAI_API_KEY not found in environment variables')
      console.error('Available environment variables:', Object.keys(Deno.env.toObject()))
      throw new Error('Configuração do assistente IA não encontrada. Entre em contato com o suporte.')
    }

    console.log('OpenAI API Key found:', openaiApiKey.substring(0, 10) + '...');

    // Prepare messages for OpenAI
    const messages = []

    // System message for legal professor
    messages.push({
      role: 'system',
      content: `Você é uma professora especializada em Direito Brasileiro, experiente e muito prática. Sua abordagem é:

PERSONALIDADE:
- Professora dinâmica, didática e acessível
- Explica conceitos complexos de forma simples
- Usa exemplos práticos do dia a dia
- Sempre encoraja e motiva o aluno
- Tem paciência para explicar quantas vezes for necessário

METODOLOGIA DE ENSINO:
- Explique conceitos passo a passo
- Use analogias e exemplos concretos
- Cite artigos de lei quando relevante
- Forneça casos práticos para fixação
- Sempre termine com dicas de como aplicar na prática

ESPECIALIDADES:
- Direito Constitucional, Civil, Penal, Administrativo, Trabalhista
- Análise de documentos legais (contratos, petições, pareceres)
- Preparação para OAB e concursos públicos
- Jurisprudência dos tribunais superiores
- Procedimentos práticos do dia a dia jurídico

FORMATO DAS RESPOSTAS:
- Use emojis para tornar mais didático (📚 📖 ⚖️ 📝 💡)
- Estruture com tópicos quando necessário
- Seja clara e objetiva
- Sempre pergunte se o aluno tem dúvidas
- Adapte a linguagem ao nível do estudante

Para documentos em imagem/PDF: 
1. PRIMEIRO: Faça um resumo breve (2-3 frases) do que é o documento
2. SEGUNDO: Pergunte "O que você gostaria de saber sobre este documento?"
3. TERCEIRO: Adicione no final: "ANALYSIS_COMPLETE:SHOW_OPTIONS" (exatamente assim)

IMPORTANTE PARA PRIMEIRA ANÁLISE: Seja concisa no primeiro resumo! O usuário poderá pedir análise detalhada depois.

Seja sempre encorajadora: "Você consegue!" "Ótima pergunta!" "Vamos juntos!"

IMPORTANTE: Baseie-se sempre na legislação brasileira vigente e jurisprudência atualizada.`
    });

    // Add conversation history
    conversationHistory.forEach((msg) => {
      if (msg.fileData) {
        messages.push({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: [
            { type: 'text', text: msg.content },
            {
              type: 'image_url',
              image_url: {
                url: `data:${msg.fileData.mimeType};base64,${msg.fileData.data}`
              }
            }
          ]
        });
      } else {
        messages.push({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.content
        });
      }
    });

    // Add current message
    if (fileData) {
      messages.push({
        role: 'user',
        content: [
          { type: 'text', text: message },
          {
            type: 'image_url',
            image_url: {
              url: `data:${fileData.mimeType};base64,${fileData.data}`
            }
          }
        ]
      });
    } else {
      messages.push({
        role: 'user',
        content: message
      });
    }

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-5-nano-2025-08-07',
        messages,
        max_completion_tokens: 4000,
        // Note: temperature not supported for newer models
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('OpenAI API error:', response.status, errorText)
      
      let userMessage = 'Erro interno do assistente IA. Tente novamente.'
      
      if (response.status === 401 || response.status === 403) {
        userMessage = 'Problema de autenticação com o serviço IA. Entre em contato com o suporte.'
      } else if (response.status === 429) {
        // Parse error to check if it's billing or rate limiting
        try {
          const errorData = JSON.parse(errorText)
          if (errorData.error?.code === 'billing_not_active') {
            userMessage = 'Conta OpenAI inativa. Verifique os detalhes de cobrança da sua conta OpenAI.'
          } else {
            userMessage = 'Muitas requisições. Aguarde um momento e tente novamente.'
          }
        } catch {
          userMessage = 'Muitas requisições. Aguarde um momento e tente novamente.'
        }
      } else if (response.status >= 500) {
        userMessage = 'Serviço temporariamente indisponível. Tente novamente em alguns minutos.'
      }
      
      throw new Error(userMessage)
    }

    const data = await response.json()
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Invalid response from OpenAI API')
    }

    const aiResponse = data.choices[0].message.content

    return new Response(
      JSON.stringify({ 
        response: aiResponse,
        success: true 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error: any) {
    console.error('Error in openai-ai-chat function:', error)
    
    return new Response(
      JSON.stringify({ 
        error: error?.message || 'Internal server error',
        success: false 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})