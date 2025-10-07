import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Search, ArrowLeft, Scale, BookOpen, ChevronRight, Copy, X, Home, FileText, Scroll, Volume2, Lightbulb, Bookmark, Brain, Plus, Minus, ArrowUp, Square, Loader2, Zap, Swords, Handshake, Building, Briefcase, Shield, DollarSign, Baby, Users, Crown, Gavel, MessageCircle, Play, Pause, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useNavigation } from '@/context/NavigationContext';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { VadeMecumFlashcardsSession } from '@/components/VadeMecumFlashcardsSession';
import { VadeMecumSumulasList } from '@/components/VadeMecumSumulasList';
import ReactMarkdown from 'react-markdown';
import { copyToClipboard } from '@/utils/clipboardUtils';
import { ProgressIndicator } from '@/components/ProgressIndicator';
import { useMediaManager } from '@/context/MediaManagerContext';
import { normalizeVideoUrl } from '@/utils/videoHelpers';
import { StaggerContainer, StaggerItem } from '@/components/ui/stagger-container';
interface VadeMecumLegalCode {
  id: string;
  name: string;
  fullName: string;
  description: string;
  icon: string;
  color: string;
  textColor?: string;
}
interface VadeMecumArticle {
  id: string;
  numero: string;
  conteudo: string;
  codigo_id: string;
  naracao_url?: string | null;
  "Número do Artigo"?: string;
  "Artigo"?: string;
  "Narração"?: string | null;
  "Comentario"?: string | null;
  "Aula"?: string | null;
}

// Cache em memória global para máxima performance
const articlesCache = new Map<string, VadeMecumArticle[]>();
let isPreloading = false;
const VadeMecumUltraFast: React.FC = () => {
  const [view, setView] = useState<'home' | 'codes' | 'articles'>('home');
  const [categoryType, setCategoryType] = useState<'cf' | 'articles' | 'statutes' | 'sumulas' | null>(null);
  const [selectedCode, setSelectedCode] = useState<VadeMecumLegalCode | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [articles, setArticles] = useState<VadeMecumArticle[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [fontSize, setFontSize] = useState(16);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Ref para virtualização
  const parentRef = useRef<HTMLDivElement>(null);

  // Estados para indicador de progresso
  const [loadingProgress, setLoadingProgress] = useState<{
    [key: string]: number;
  }>({});
  const [activeLoading, setActiveLoading] = useState<{
    [key: string]: boolean;
  }>({});

  // Estado para loading com blur overlay
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingType, setGeneratingType] = useState<'explicar' | 'exemplo' | null>(null);

  // Estados para narração
  const [isNarrating, setIsNarrating] = useState(false);
  const [narrateLoading, setNarrateLoading] = useState(false);
  const [audioInstance, setAudioInstance] = useState<HTMLAudioElement | null>(null);

  // Estados para comentário (áudio)
  const [commentAudio, setCommentAudio] = useState<HTMLAudioElement | null>(null);
  const [isPlayingComment, setIsPlayingComment] = useState(false);
  const [commentProgress, setCommentProgress] = useState(0);
  const [commentDuration, setCommentDuration] = useState(0);
  const [currentCommentId, setCurrentCommentId] = useState<string | null>(null);

  // Estados para aula (vídeo)
  const [videoMode, setVideoMode] = useState(false);
  const [currentVideo, setCurrentVideo] = useState<{
    url: string;
    articleNumber: string;
    articleContent: string;
  } | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Estados para Flashcards
  const [generatedFlashcards, setGeneratedFlashcards] = useState<any[]>([]);
  const [showFlashcardsSession, setShowFlashcardsSession] = useState(false);

  // Estado centralizado para modais de conteúdo gerado
  const [generatedModal, setGeneratedModal] = useState<{
    open: boolean;
    type: 'explicar' | 'exemplo';
    content: string;
    articleNumber: string;
    hasValidNumber: boolean;
  }>({
    open: false,
    type: 'explicar',
    content: '',
    articleNumber: '',
    hasValidNumber: false
  });
  const searchRef = useRef<HTMLInputElement>(null);
  const {
    toast
  } = useToast();
  const {
    setCurrentFunction
  } = useNavigation();
  const {
    user
  } = useAuth();
  const mediaManager = useMediaManager();

  // Controle de scroll otimizado sem piscar
  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          setShowScrollTop(window.scrollY > 300);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', handleScroll, {
      passive: true
    });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  // Sistema de preload agressivo para carregamento instantâneo
  useEffect(() => {
    if (!isPreloading) {
      isPreloading = true;
      const preloadPopular = async () => {
        // Códigos mais acessados primeiro
        const popularCodes = [{
          table: 'CC',
          id: 'cc'
        }, {
          table: 'CF88',
          id: 'cf88'
        }, {
          table: 'CP',
          id: 'cp'
        }, {
          table: 'CPC',
          id: 'cpc'
        }, {
          table: 'CPP',
          id: 'cpp'
        }, {
          table: 'CLT',
          id: 'clt'
        }, {
          table: 'CDC',
          id: 'cdc'
        }];

        // Preload em batches para não sobrecarregar o servidor
        const batchSize = 3;
        for (let i = 0; i < popularCodes.length; i += batchSize) {
          const batch = popularCodes.slice(i, i + batchSize);
          const batchPromises = batch.map(async ({
            table,
            id
          }) => {
            const cacheKey = `articles-${id}`;
            if (!articlesCache.has(cacheKey)) {
              try {
                const {
                  data
                } = await supabase.from(table as any).select('id, "Número do Artigo", Artigo, Narração, Comentario, Aula').order('id', {
                  ascending: true
                }).range(0, 5000);
                if (data) {
                  const transformed = data.map((item: any) => ({
                    id: String(item.id),
                    numero: item["Número do Artigo"] || String(item.id),
                    conteudo: item.Artigo || '',
                    codigo_id: id,
                    naracao_url: item["Narração"] || null,
                    "Número do Artigo": item["Número do Artigo"],
                    "Narração": item["Narração"],
                    "Artigo": item.Artigo,
                    "Comentario": item.Comentario || null,
                    "Aula": item.Aula || null
                  }));
                  articlesCache.set(cacheKey, transformed);
                }
              } catch (e) {
                // Silently fail preload para não interromper UX
              }
            }
          });

          // Processa batch e aguarda antes do próximo
          await Promise.allSettled(batchPromises);

          // Pequeno delay entre batches para otimizar performance
          if (i + batchSize < popularCodes.length) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        }
      };

      // Executa preload em background sem bloquear UI
      requestIdleCallback ? requestIdleCallback(() => preloadPopular()) : setTimeout(preloadPopular, 100);
    }
  }, []);

  // Códigos com layout moderno e gradientes (SEM Constituição Federal)
  const articleCodes = useMemo<VadeMecumLegalCode[]>(() => [{
    id: 'cc',
    name: 'CC',
    fullName: 'Código Civil',
    description: 'Relações civis e direitos privados',
    icon: 'Handshake',
    color: 'bg-gradient-to-br from-blue-500/20 to-blue-700/30 border border-blue-500/20 backdrop-blur-sm',
    textColor: 'text-blue-100'
  }, {
    id: 'cp',
    name: 'CP',
    fullName: 'Código Penal',
    description: 'Crimes e aplicação de penas',
    icon: 'Gavel',
    color: 'bg-gradient-to-br from-red-500/20 to-red-700/30 border border-red-500/20 backdrop-blur-sm',
    textColor: 'text-red-100'
  }, {
    id: 'cpc',
    name: 'CPC',
    fullName: 'Código de Processo Civil',
    description: 'Procedimentos judiciais cíveis',
    icon: 'FileText',
    color: 'bg-gradient-to-br from-purple-500/20 to-purple-700/30 border border-purple-500/20 backdrop-blur-sm',
    textColor: 'text-purple-100'
  }, {
    id: 'cpp',
    name: 'CPP',
    fullName: 'Código de Processo Penal',
    description: 'Procedimentos judiciais penais',
    icon: 'Swords',
    color: 'bg-gradient-to-br from-orange-500/20 to-orange-700/30 border border-orange-500/20 backdrop-blur-sm',
    textColor: 'text-orange-100'
  }, {
    id: 'clt',
    name: 'CLT',
    fullName: 'Consolidação das Leis do Trabalho',
    description: 'Direito trabalhista e sindical',
    icon: 'Briefcase',
    color: 'bg-gradient-to-br from-amber-500/20 to-amber-700/30 border border-amber-500/20 backdrop-blur-sm',
    textColor: 'text-amber-100'
  }, {
    id: 'cdc',
    name: 'CDC',
    fullName: 'Código de Defesa do Consumidor',
    description: 'Proteção aos direitos do consumidor',
    icon: 'Shield',
    color: 'bg-gradient-to-br from-cyan-500/20 to-cyan-700/30 border border-cyan-500/20 backdrop-blur-sm',
    textColor: 'text-cyan-100'
  }, {
    id: 'ctn',
    name: 'CTN',
    fullName: 'Código Tributário Nacional',
    description: 'Sistema tributário e fiscal',
    icon: 'DollarSign',
    color: 'bg-gradient-to-br from-yellow-500/20 to-yellow-700/30 border border-yellow-500/20 backdrop-blur-sm',
    textColor: 'text-yellow-100'
  }, {
    id: 'ca',
    name: 'CA',
    fullName: 'Código de Águas',
    description: 'Legislação sobre recursos hídricos',
    icon: 'Briefcase',
    color: 'bg-gradient-to-br from-blue-400/20 to-blue-600/30 border border-blue-400/20 backdrop-blur-sm',
    textColor: 'text-blue-100'
  }, {
    id: 'cba',
    name: 'CBA',
    fullName: 'Código Brasileiro de Aeronáutica',
    description: 'Legislação aeronáutica',
    icon: 'Briefcase',
    color: 'bg-gradient-to-br from-sky-500/20 to-sky-700/30 border border-sky-500/20 backdrop-blur-sm',
    textColor: 'text-sky-100'
  }, {
    id: 'cbt',
    name: 'CBT',
    fullName: 'Código Brasileiro de Telecomunicações',
    description: 'Legislação de telecomunicações',
    icon: 'Briefcase',
    color: 'bg-gradient-to-br from-violet-500/20 to-violet-700/30 border border-violet-500/20 backdrop-blur-sm',
    textColor: 'text-violet-100'
  }, {
    id: 'ccom',
    name: 'CCOM',
    fullName: 'Código Comercial',
    description: 'Direito comercial',
    icon: 'Briefcase',
    color: 'bg-gradient-to-br from-green-500/20 to-green-700/30 border border-green-500/20 backdrop-blur-sm',
    textColor: 'text-green-100'
  }, {
    id: 'cdm',
    name: 'CDM',
    fullName: 'Código de Minas',
    description: 'Legislação minerária',
    icon: 'Briefcase',
    color: 'bg-gradient-to-br from-stone-500/20 to-stone-700/30 border border-stone-500/20 backdrop-blur-sm',
    textColor: 'text-stone-100'
  }, {
    id: 'ced',
    name: 'CED',
    fullName: 'Código de Ética - OAB',
    description: 'Ética profissional da advocacia',
    icon: 'Scale',
    color: 'bg-gradient-to-br from-amber-500/20 to-amber-700/30 border border-amber-500/20 backdrop-blur-sm',
    textColor: 'text-amber-100'
  }, {
    id: 'cppm',
    name: 'CPPM',
    fullName: 'Código de Processo Penal Militar',
    description: 'Procedimentos penais militares',
    icon: 'Shield',
    color: 'bg-gradient-to-br from-red-600/20 to-red-800/30 border border-red-600/20 backdrop-blur-sm',
    textColor: 'text-red-100'
  }], []);

  // Estatutos com gradientes modernos
  const statuteCodes = useMemo<VadeMecumLegalCode[]>(() => [{
    id: 'estatuto-oab',
    name: 'Estatuto da OAB',
    fullName: 'Estatuto da Advocacia e da OAB',
    description: 'Lei nº 8.906/1994',
    icon: 'Scale',
    color: 'bg-gradient-to-br from-amber-500/20 to-amber-700/30 border border-amber-500/20 backdrop-blur-sm',
    textColor: 'text-amber-100'
  }, {
    id: 'estatuto-eca',
    name: 'ECA',
    fullName: 'Estatuto da Criança e do Adolescente',
    description: 'Lei nº 8.069/1990',
    icon: 'Baby',
    color: 'bg-gradient-to-br from-pink-500/20 to-pink-700/30 border border-pink-500/20 backdrop-blur-sm',
    textColor: 'text-pink-100'
  }, {
    id: 'estatuto-idoso',
    name: 'Estatuto do Idoso',
    fullName: 'Estatuto da Pessoa Idosa',
    description: 'Lei nº 10.741/2003',
    icon: 'Users',
    color: 'bg-gradient-to-br from-violet-500/20 to-violet-700/30 border border-violet-500/20 backdrop-blur-sm',
    textColor: 'text-violet-100'
  }, {
    id: 'estatuto-pcd',
    name: 'Estatuto da Pessoa com Deficiência',
    fullName: 'Estatuto da Pessoa com Deficiência',
    description: 'Lei nº 13.146/2015',
    icon: 'Shield',
    color: 'bg-gradient-to-br from-indigo-500/20 to-indigo-700/30 border border-indigo-500/20 backdrop-blur-sm',
    textColor: 'text-indigo-100'
  }, {
    id: 'estatuto-igualdade-racial',
    name: 'Estatuto da Igualdade Racial',
    fullName: 'Estatuto da Igualdade Racial',
    description: 'Lei nº 12.288/2010',
    icon: 'Handshake',
    color: 'bg-gradient-to-br from-orange-500/20 to-orange-700/30 border border-orange-500/20 backdrop-blur-sm',
    textColor: 'text-orange-100'
  }, {
    id: 'estatuto-cidade',
    name: 'Estatuto da Cidade',
    fullName: 'Estatuto da Cidade',
    description: 'Lei nº 10.257/2001',
    icon: 'Building',
    color: 'bg-gradient-to-br from-slate-500/20 to-slate-700/30 border border-slate-500/20 backdrop-blur-sm',
    textColor: 'text-slate-100'
  }, {
    id: 'estatuto-desarmamento',
    name: 'Estatuto do Desarmamento',
    fullName: 'Estatuto do Desarmamento',
    description: 'Lei nº 10.826/2003',
    icon: 'Shield',
    color: 'bg-gradient-to-br from-red-500/20 to-red-700/30 border border-red-500/20 backdrop-blur-sm',
    textColor: 'text-red-100'
  }, {
    id: 'estatuto-torcedor',
    name: 'Estatuto do Torcedor',
    fullName: 'Estatuto de Defesa do Torcedor',
    description: 'Lei nº 10.671/2003',
    icon: 'Users',
    color: 'bg-gradient-to-br from-green-500/20 to-green-700/30 border border-green-500/20 backdrop-blur-sm',
    textColor: 'text-green-100'
  }], []);
  const currentCodes = useMemo(() => {
    if (categoryType === 'statutes') return statuteCodes;
    if (categoryType === 'sumulas') return []; // Súmulas terão tratamento especial
    return articleCodes;
  }, [categoryType, articleCodes, statuteCodes]);

  // Função para validar se tem número de artigo válido
  const isValidArticleNumber = useCallback((articleNumber: string, articleContent?: string) => {
    // Verifica se tem número e não é apenas texto de seção/capítulo
    if (!articleNumber) return false;

    // Remove caracteres não numéricos e verifica se sobrou algo
    const numbersOnly = articleNumber.replace(/[^\d]/g, '');

    // Se não tem números, não é um artigo numerado
    if (numbersOnly.length === 0) return false;

    // Verifica se é um texto de seção/capítulo comum
    const lowerText = articleNumber.toLowerCase();
    const sectionWords = ['capítulo', 'capitulo', 'seção', 'secao', 'título', 'titulo', 'livro', 'parte'];
    if (sectionWords.some(word => lowerText.includes(word))) return false;

    // Verifica se o conteúdo do artigo contém referência a "Art." em qualquer lugar
    if (articleContent) {
      const contentLower = articleContent.toLowerCase().trim();

      // Para o Código Penal e outros códigos, aceita se:
      // 1. Começa diretamente com "art." ou "artigo"
      // 2. Contém "art. X" onde X corresponde ao número do artigo
      const startsWithArticle = contentLower.startsWith('art.') || contentLower.startsWith('artigo');

      // Ou se contém "Art. [número]" em qualquer lugar do texto
      const articlePattern = new RegExp(`art\\.?\\s*${articleNumber.replace(/[^\w]/g, '')}[^\\w]`, 'i');
      const containsArticleNumber = articlePattern.test(contentLower);

      // Aceita se começa com artigo OU se contém a referência ao artigo no meio do texto
      if (startsWithArticle || containsArticleNumber) {
        return true;
      }

      // Se não encontrou padrão de artigo, não deve mostrar número
      return false;
    }
    return true;
  }, []);

  // Função para simular progresso com porcentagem
  const simulateProgress = useCallback((key: string, duration: number = 3000) => {
    setActiveLoading(prev => ({
      ...prev,
      [key]: true
    }));
    setLoadingProgress(prev => ({
      ...prev,
      [key]: 0
    }));
    const startTime = Date.now();
    const updateProgress = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration * 100, 95);
      setLoadingProgress(prev => ({
        ...prev,
        [key]: progress
      }));
      if (progress < 95) {
        requestAnimationFrame(updateProgress);
      }
    };
    requestAnimationFrame(updateProgress);
  }, []);
  const stopProgress = useCallback((key: string) => {
    setLoadingProgress(prev => ({
      ...prev,
      [key]: 100
    }));
    setTimeout(() => {
      setActiveLoading(prev => ({
        ...prev,
        [key]: false
      }));
      setLoadingProgress(prev => ({
        ...prev,
        [key]: 0
      }));
    }, 500);
  }, []);

  // Sistema de busca otimizado - SEM paginação, virtualização cuida da performance
  const filteredArticles = useMemo(() => {
    // Base de artigos completa para manter preâmbulos e seções
    const allArticles = articles;

    // Subconjunto apenas com artigos numerados (para buscas por número)
    const numberedArticles = articles.filter(article => {
      const articleNumber = article["Número do Artigo"] || article.numero || '';
      const articleContent = article["Artigo"] || article.conteudo || '';
      return isValidArticleNumber(articleNumber, articleContent);
    });

    // Sem busca: retorna todos os registros preservando a ordem original (inclui textos introdutórios)
    if (!searchTerm.trim()) return allArticles;
    const searchLower = searchTerm.toLowerCase().trim();
    const searchNumbers = searchTerm.replace(/[^\d]/g, '');

    // Se buscar por número puro, filtra apenas entre artigos numerados
    if (searchNumbers && searchNumbers === searchTerm) {
      const numberResults = numberedArticles.filter(article => {
        const articleNumber = article["Número do Artigo"] || article.numero || '';
        const numbersInArticle = articleNumber.replace(/[^\d]/g, '');
        return numbersInArticle === searchNumbers;
      });
      if (numberResults.length > 0) return numberResults;
    }

    // Match exato em artigos numerados
    const exactMatch = numberedArticles.find(article => {
      const articleNumber = article["Número do Artigo"] || article.numero || '';
      return articleNumber.toLowerCase() === searchLower;
    });
    if (exactMatch) return [exactMatch];

    // Busca rankeada em todos os artigos (inclui textos introdutórios)
    const results: {
      article: VadeMecumArticle;
      score: number;
    }[] = [];
    for (const article of allArticles) {
      const articleNumber = article["Número do Artigo"] || article.numero || '';
      const articleContent = article["Artigo"] || article.conteudo || '';
      let score = 0;

      // Número puro (apenas se houver número no item)
      if (searchNumbers && articleNumber.replace(/[^\d]/g, '') === searchNumbers) {
        score = 900;
      }
      // Número contém
      else if (articleNumber.toLowerCase().includes(searchLower)) {
        score = 800;
      }
      // Conteúdo contém
      else if (articleContent.toLowerCase().includes(searchLower)) {
        score = 100;
      }
      if (score > 0) {
        results.push({
          article,
          score
        });
      }
    }
    return results.sort((a, b) => b.score - a.score).map(item => item.article);
  }, [articles, searchTerm, isValidArticleNumber]);

  // Configuração do virtualizador
  const virtualizer = useVirtualizer({
    count: filteredArticles.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 200,
    // Altura estimada de cada card
    overscan: 5 // Renderiza 5 itens extras acima/abaixo
  });

  // Ao alterar a busca, garanta que o primeiro resultado fique visível
  useEffect(() => {
    if (!parentRef.current) return;
    parentRef.current.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
    try {
      virtualizer.scrollToIndex(0, {
        align: 'start'
      });
    } catch {/* ignore */}
  }, [searchTerm]);

  // Carregar artigos com cache instantâneo e otimização extrema
  const loadArticles = useCallback(async (code: VadeMecumLegalCode) => {
    const cacheKey = `articles-${code.id}`;
    if (articlesCache.has(cacheKey)) {
      const cachedData = articlesCache.get(cacheKey)!;
      setArticles(cachedData);
      setSelectedCode(code);
      setView('articles');
      setSearchTerm('');

      // Atualização em segundo plano para garantir dataset completo (evita caches antigos com 1000 linhas)
      if (cachedData.length < 2000) {
        const tableMap: Record<string, string> = {
          'cc': 'CC',
          'cdc': 'CDC',
          'cf88': 'CF88',
          'clt': 'CLT',
          'cp': 'CP',
          'cpc': 'CPC',
          'cpp': 'CPP',
          'ctn': 'CTN',
          'ctb': 'CTB',
          'ce': 'CE',
          'ca': 'CA- Código de aguas',
          'cba': 'CBA - Código Brasileiro de Aeronáutica',
          'cbt': 'CBT - Código Brasileiro de Telecomunicações.',
          'ccom': 'CCOM',
          'cdm': 'CDM - Código de Minas',
          'ced': 'CED CÓDIGO DE ETICA - OAB',
          'cppm': 'CPPM - PROCESSO MILITAR',
          'estatuto-oab': 'ESTATUTO - OAB',
          'estatuto-eca': 'ESTATUTO - ECA',
          'estatuto-idoso': 'ESTATUTO - IDOSO',
          'estatuto-pcd': 'ESTATUTO - PESSOA COM DEFICIENCIA',
          'estatuto-igualdade-racial': 'ESTATUTO - IGUALDADE RACIAL',
          'estatuto-cidade': 'ESTATUTO - CIDADE',
          'estatuto-desarmamento': 'ESTATUTO - DESARMAMENTO',
          'estatuto-torcedor': 'ESTATUTO - TORCEDOR'
        };
        const tableName = tableMap[code.id];
        if (tableName) {
          (async () => {
            try {
              const {
                data
              } = await supabase.from(tableName as any).select('id, "Número do Artigo", Artigo, Narração, Comentario, Aula').order('id', {
                ascending: true
              }).range(0, 5000);
              if (data && data.length > cachedData.length) {
                const transformed = data.map((item: any) => ({
                  id: String(item.id),
                  numero: item["Número do Artigo"] || String(item.id),
                  conteudo: item.Artigo || '',
                  codigo_id: code.id,
                  naracao_url: item["Narração"] || null,
                  "Número do Artigo": item["Número do Artigo"],
                  "Narração": item["Narração"],
                  "Artigo": item.Artigo,
                  "Comentario": item.Comentario || null,
                  "Aula": item.Aula || null
                }));
                articlesCache.set(cacheKey, transformed);
                // Atualiza somente se o usuário ainda estiver no mesmo código
                setArticles(prev => selectedCode?.id === code.id ? transformed : prev);
              }
            } catch {/* ignore background refresh errors */}
          })();
        }
      }
      return;
    }

    // Estado de carregamento mínimo para UX responsiva
    setIsLoading(true);
    setSelectedCode(code);
    setView('articles');
    setSearchTerm('');
    try {
      // Mapping otimizado de tabelas
      const tableMap: Record<string, string> = {
        'cc': 'CC',
        'cdc': 'CDC',
        'cf88': 'CF88',
        'clt': 'CLT',
        'cp': 'CP',
        'cpc': 'CPC',
        'cpp': 'CPP',
        'ctn': 'CTN',
        'ctb': 'CTB',
        'ce': 'CE',
        'ca': 'CA- Código de aguas',
        'cba': 'CBA - Código Brasileiro de Aeronáutica',
        'cbt': 'CBT - Código Brasileiro de Telecomunicações.',
        'ccom': 'CCOM',
        'cdm': 'CDM - Código de Minas',
        'ced': 'CED CÓDIGO DE ETICA - OAB',
        'cppm': 'CPPM - PROCESSO MILITAR',
        'estatuto-oab': 'ESTATUTO - OAB',
        'estatuto-eca': 'ESTATUTO - ECA',
        'estatuto-idoso': 'ESTATUTO - IDOSO',
        'estatuto-pcd': 'ESTATUTO - PESSOA COM DEFICIENCIA',
        'estatuto-igualdade-racial': 'ESTATUTO - IGUALDADE RACIAL',
        'estatuto-cidade': 'ESTATUTO - CIDADE',
        'estatuto-desarmamento': 'ESTATUTO - DESARMAMENTO',
        'estatuto-torcedor': 'ESTATUTO - TORCEDOR'
      };
      const tableName = tableMap[code.id];
      if (!tableName) {
        setIsLoading(false);
        return;
      }

      // Query otimizada para máxima velocidade
      const {
        data,
        error
      } = await supabase.from(tableName as any).select('id, "Número do Artigo", Artigo, Narração, Comentario, Aula').order('id', {
        ascending: true
      }).range(0, 5000);
      if (error) throw error;

      // Transformação otimizada de dados
      const transformedArticles = (data || []).map((item: any) => ({
        id: String(item.id),
        numero: item["Número do Artigo"] || String(item.id),
        conteudo: item.Artigo || '',
        naracao_url: item["Narração"] || null,
        "Narração": item["Narração"],
        codigo_id: code.id,
        "Número do Artigo": item["Número do Artigo"],
        "Artigo": item.Artigo,
        "Comentario": item.Comentario || null,
        "Aula": item.Aula || null
      }));

      // Cache triplo para máxima performance
      articlesCache.set(cacheKey, transformedArticles);
      setArticles(transformedArticles);
    } catch (error: any) {
      toast({
        title: "❌ Erro ao carregar artigos",
        description: error.message || "Não foi possível carregar os artigos.",
        variant: "destructive"
      });
      setArticles([]);
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Navegação otimizada
  const handleBack = useCallback(() => {
    if (view === 'articles') {
      setView('codes');
      setArticles([]);
      setSearchTerm('');
    } else if (view === 'codes') {
      setView('home');
      setCategoryType(null);
    } else {
      setCurrentFunction(null);
    }
  }, [view, setCurrentFunction]);
  const selectCategory = useCallback((type: 'cf' | 'articles' | 'statutes' | 'sumulas') => {
    setCategoryType(type);

    // CF vai direto para artigos
    if (type === 'cf') {
      const cfCode = articleCodes.find(c => c.id === 'cf88');
      if (cfCode) {
        loadArticles(cfCode);
      }
    } else if (type === 'sumulas') {
      // Súmulas também vai direto para visualização
      setView('codes');
    } else {
      setView('codes');
    }
  }, [articleCodes, loadArticles]);
  const copyArticle = useCallback(async (content: string) => {
    const success = await copyToClipboard(content);
    if (success) {
      toast({
        title: "✅ Artigo copiado!",
        description: "O conteúdo foi copiado para a área de transferência."
      });
    } else {
      toast({
        title: "❌ Erro ao copiar",
        description: "Não foi possível copiar o conteúdo.",
        variant: "destructive"
      });
    }
  }, [toast]);
  const narrateArticle = useCallback(async (article: VadeMecumArticle, codeName: string) => {
    // Check if audio URL is not available
    if (!article.naracao_url) {
      toast({
        title: "Em breve",
        description: "A narração deste artigo estará disponível em breve."
      });
      return;
    }
    if (isNarrating && audioInstance) {
      // Parar narração
      audioInstance.pause();
      setIsNarrating(false);
      setAudioInstance(null);
      return;
    }
    setNarrateLoading(true);
    try {
      // Use the audio URL directly from the database
      const audio = new Audio(article.naracao_url);
      audio.onended = () => {
        setIsNarrating(false);
        setAudioInstance(null);
      };
      audio.onerror = () => {
        setIsNarrating(false);
        setAudioInstance(null);
        toast({
          title: "❌ Erro",
          description: "Erro ao reproduzir áudio.",
          variant: "destructive"
        });
      };
      setAudioInstance(audio);
      setIsNarrating(true);
      audio.play();
      toast({
        title: "🔊 Narração iniciada",
        description: "O artigo está sendo narrado."
      });
    } catch (error: any) {
      console.error('Erro ao narrar artigo:', error);
      toast({
        title: "❌ Erro ao narrar",
        description: "Erro ao reproduzir áudio. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setNarrateLoading(false);
    }
  }, [isNarrating, audioInstance, toast]);

  // Limpar áudio de comentário ao sair da tela
  useEffect(() => {
    return () => {
      if (commentAudio) {
        commentAudio.pause();
        setCommentAudio(null);
        setIsPlayingComment(false);
        setCurrentCommentId(null);
      }
    };
  }, [view, selectedCode]);

  // Função para tocar comentário (áudio)
  const playComment = useCallback((commentUrl: string, articleId: string) => {
    // Parar qualquer áudio anterior
    if (commentAudio) {
      commentAudio.pause();
      commentAudio.currentTime = 0;
    }

    // Parar narração se estiver tocando
    if (audioInstance) {
      audioInstance.pause();
      setIsNarrating(false);
    }

    // Se for o mesmo comentário, apenas pausar
    if (currentCommentId === articleId && isPlayingComment) {
      setIsPlayingComment(false);
      setCurrentCommentId(null);
      return;
    }
    const audio = new Audio(commentUrl);
    audio.addEventListener('loadedmetadata', () => {
      setCommentDuration(audio.duration);
    });
    audio.addEventListener('timeupdate', () => {
      setCommentProgress(audio.currentTime);
    });
    audio.addEventListener('ended', () => {
      setIsPlayingComment(false);
      setCommentProgress(0);
      setCurrentCommentId(null);
    });
    audio.play().then(() => {
      setCommentAudio(audio);
      setIsPlayingComment(true);
      setCurrentCommentId(articleId);
      toast({
        title: "🎧 Reproduzindo comentário",
        description: "Ouça o comentário sobre este artigo"
      });
    }).catch(error => {
      console.error('Erro ao reproduzir comentário:', error);
      toast({
        title: "Erro ao reproduzir",
        description: "Não foi possível reproduzir o comentário",
        variant: "destructive"
      });
    });
  }, [commentAudio, audioInstance, currentCommentId, isPlayingComment, toast]);

  // Função para abrir modo aula (vídeo)
  const openVideoMode = useCallback((videoUrl: string, articleNumber: string, articleContent: string) => {
    // Parar qualquer áudio
    if (commentAudio) {
      commentAudio.pause();
      setIsPlayingComment(false);
    }
    if (audioInstance) {
      audioInstance.pause();
      setIsNarrating(false);
    }

    // Parar todos os players de mídia
    mediaManager.stopAllMedia();
    setCurrentVideo({
      url: normalizeVideoUrl(videoUrl),
      articleNumber,
      articleContent
    });
    setVideoMode(true);
  }, [commentAudio, audioInstance, mediaManager]);

  // Fechar modo vídeo
  const closeVideoMode = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.pause();
    }
    setVideoMode(false);
    setCurrentVideo(null);
  }, []);

  // Função para sintetizar voz (Web Speech API)
  const speakText = useCallback((text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'pt-BR';
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
      toast({
        title: "🔊 Reproduzindo áudio",
        description: "O texto está sendo reproduzido em voz alta."
      });
    } else {
      toast({
        title: "❌ Recurso não disponível",
        description: "Seu navegador não suporta síntese de voz.",
        variant: "destructive"
      });
    }
  }, [toast]);

  // Função para gerar flashcards
  const generateFlashcards = useCallback(async (articleContent: string, articleNumber: string) => {
    if (!user) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado para gerar flashcards.",
        variant: "destructive"
      });
      return;
    }
    setIsGenerating(true);
    try {
      const {
        data,
        error
      } = await supabase.functions.invoke('generate-vade-mecum-content', {
        body: {
          articleContent,
          articleNumber,
          codeName: selectedCode?.name || 'Código Legal',
          userId: user.id,
          type: 'flashcard'
        }
      });
      if (error) throw error;
      if (data?.flashcards) {
        setGeneratedFlashcards(data.flashcards);
        setShowFlashcardsSession(true);
        toast({
          title: "Sucesso!",
          description: `${data.flashcards.length} flashcards gerados com IA`
        });
      }
    } catch (error) {
      console.error('Erro ao gerar flashcards:', error);
      toast({
        title: "Erro",
        description: "Não foi possível gerar os flashcards. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  }, [user, selectedCode, toast]);

  // Função para formatar texto com estilos específicos
  const formatVademecumText = useCallback((text: string) => {
    if (!text) return text;

    // Aplica formatação para títulos do Código Penal e "Parágrafo único"
    let formattedText = text;

    // Identifica e formata títulos antes de "Art." - Código Penal com cor branca e negrito
    formattedText = formattedText.replace(/^([^A][^r][^t].*?)(?=\n\nArt\.)/gm, '<strong style="font-weight: bold; color: #ffffff;">$1</strong>');

    // Formata títulos que aparecem no início de linhas (sem Art.) com cor branca e negrito
    formattedText = formattedText.replace(/^([A-Z][a-záêôõçã\s]+)(?=\n\nArt\.)/gm, '<strong style="font-weight: bold; color: #ffffff;">$1</strong>');

    // Formata "Parágrafo único" em todos os códigos com cor branca
    formattedText = formattedText.replace(/(Parágrafo único|PARÁGRAFO ÚNICO)/gi, '<strong style="font-weight: bold; color: #ffffff;">$1</strong>');

    // Quebras de linha para HTML
    formattedText = formattedText.replace(/\n/g, '<br>');
    return formattedText;
  }, []);

  // Componente de Card do Artigo
  const VadeMecumArticleCard = ({
    article,
    index
  }: {
    article: VadeMecumArticle;
    index: number;
  }) => {
    const [loadingState, setLoadingState] = useState<{
      explanation: boolean;
      practicalExample: boolean;
    }>({
      explanation: false,
      practicalExample: false
    });
    const articleNumber = article["Número do Artigo"] || article.numero || '';
    const articleContent = article["Artigo"] || article.conteudo || '';
    const commentUrl = article["Comentario"];
    const aulaUrl = article["Aula"];

    // Verifica se tem número válido (contém dígitos após remover caracteres não numéricos)
    const hasValidNumber = isValidArticleNumber(articleNumber, articleContent);
    const isCommentPlaying = currentCommentId === article.id && isPlayingComment;

    // Layout para cards sem número válido - mostra textos introdutórios
    if (!hasValidNumber) {
      const sectionWords = ['capítulo', 'capitulo', 'seção', 'secao', 'título', 'titulo', 'livro', 'parte', 'disposições', 'disposicoes', 'preâmbulo', 'preambulo'];
      const isSection = sectionWords.some(word => articleContent.toLowerCase().includes(word));
      return <div className="mb-3">
          <Card className={isSection ? "bg-muted/30 border-muted/50" : "bg-card/40 border-muted/30"}>
            <CardContent className="p-3">
              <div className={isSection ? "text-center" : ""}>
                <div className={`vademecum-text ${isSection ? 'text-muted-foreground font-medium tracking-wide text-xs' : 'text-foreground/90 text-sm'} leading-relaxed`} style={{
                fontSize: isSection ? '12px' : `${fontSize}px`,
                lineHeight: 1.6
              }} dangerouslySetInnerHTML={{
                __html: formatVademecumText(articleContent)
              }} />
              </div>
            </CardContent>
          </Card>
        </div>;
    }

    // Define keys for loading states
    const explainKey = `explain-${articleNumber}`;
    const exampleKey = `example-${articleNumber}`;
    const handleExplain = async () => {
      const key = explainKey;
      setIsGenerating(true);
      setGeneratingType('explicar');
      simulateProgress(key);
      try {
        console.log('Chamando Gemini API para: explicar');
        const {
          data,
          error
        } = await supabase.functions.invoke('gemini-vademecum', {
          body: {
            action: 'explicar',
            articleNumber: articleNumber,
            codeName: selectedCode?.name || '',
            hasArticle: !!articleContent
          }
        });
        if (error) {
          console.error('Erro na API Gemini:', error);
          throw new Error('Erro ao gerar explicação');
        }
        if (data?.content) {
          console.log('Explicação gerada:', data.content);
          setGeneratedModal({
            open: true,
            type: 'explicar',
            content: data.content,
            articleNumber,
            hasValidNumber: isValidArticleNumber(articleNumber, articleContent)
          });
          toast({
            title: "✅ Explicação gerada!",
            description: "A explicação foi gerada com sucesso."
          });
        }
      } catch (error: any) {
        toast({
          title: "❌ Erro ao gerar explicação",
          description: error.message,
          variant: "destructive"
        });
      } finally {
        setIsGenerating(false);
        setGeneratingType(null);
        stopProgress(key);
      }
    };
    const handleExample = async () => {
      const key = exampleKey;
      setIsGenerating(true);
      setGeneratingType('exemplo');
      simulateProgress(key);
      try {
        const {
          data,
          error
        } = await supabase.functions.invoke('gemini-vademecum', {
          body: {
            action: 'exemplo',
            articleNumber: articleNumber,
            codeName: selectedCode?.name || '',
            hasArticle: !!articleContent
          }
        });
        if (error) {
          console.error('Erro na API Gemini:', error);
          throw new Error('Erro ao gerar exemplo');
        }
        if (data?.content) {
          console.log('Exemplo gerado:', data.content);
          setGeneratedModal({
            open: true,
            type: 'exemplo',
            content: data.content,
            articleNumber,
            hasValidNumber: isValidArticleNumber(articleNumber, articleContent)
          });
          toast({
            title: "✅ Exemplo gerado!",
            description: "O exemplo prático foi gerado com sucesso."
          });
        }
      } catch (error: any) {
        toast({
          title: "❌ Erro ao gerar exemplo",
          description: error.message,
          variant: "destructive"
        });
      } finally {
        setIsGenerating(false);
        setGeneratingType(null);
        stopProgress(key);
      }
    };

    // Layout diferente para cards sem número válido
    if (!hasValidNumber) {
      return <div className="mb-3">
          <Card className="bg-card/50 border-muted">
            <CardContent className="p-3">{/* Removida animação motion */}
                <div className="text-center">
                  <div className="vademecum-text text-foreground/80 text-sm leading-relaxed" style={{
                fontSize: `${fontSize}px`,
                lineHeight: 1.6
              }} dangerouslySetInnerHTML={{
                __html: formatVademecumText(articleContent)
              }} />
                
                {/* Apenas botões de IA para cards sem número */}
                <div className="flex items-center justify-center gap-2 mt-3 pt-3 border-t border-muted">
                  <Button onClick={handleExplain} disabled={loadingState.explanation} variant="outline" size="sm" className="text-xs">
                    {loadingState.explanation ? <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary" /> : <Brain className="h-3 w-3" />}
                    <span className="ml-1">Explicar</span>
                  </Button>
                  <Button onClick={handleExample} disabled={loadingState.practicalExample} variant="outline" size="sm" className="text-xs">
                    {loadingState.practicalExample ? <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary" /> : <Lightbulb className="h-3 w-3" />}
                    <span className="ml-1">Exemplo</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>;
    }

    // Layout para cards com número válido
    return <div key={`${article.id}-${index}`} className="mb-4">
        <Card className="bg-card border">
          <CardContent className="p-4">{/* Removidas animações de hover que causavam piscar */}
            <div className="space-y-3">
              {/* Cabeçalho do Artigo */}
            <div className="flex flex-col gap-2">
  <h3 className="font-bold text-lg text-yellow-400 px-[7px]">
    Art. {articleNumber}
  </h3>
  
  <div className="vademecum-text text-foreground px-2" // <<< padding lateral adicionado
              style={{
                fontSize: `${fontSize}px`,
                lineHeight: 1.6,
                textAlign: "left" // <<< alinhamento justificado
              }} dangerouslySetInnerHTML={{
                __html: formatVademecumText(articleContent)
              }} />
  
  
            </div>

              {/* Ações do Artigo */}
              <div className="pt-3 border-t border-muted">
                {/* Botões alinhados */}
                <div className="flex flex-wrap gap-2">
                  <Button onClick={() => narrateArticle(article, selectedCode?.name || '')} disabled={narrateLoading || !article.naracao_url} variant="outline" size="sm" className={`text-xs ${!article.naracao_url ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    {narrateLoading ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : isNarrating ? <Square className="h-3 w-3 mr-1" /> : <Volume2 className="h-3 w-3 mr-1" />}
                    {narrateLoading ? 'Carregando...' : isNarrating ? 'Parar' : 'Narrar'}
                  </Button>

                  {commentUrl && <Button onClick={() => playComment(commentUrl, article.id)} variant="outline" size="sm" className="text-xs">
                      {isCommentPlaying ? <Pause className="h-3 w-3 mr-1" /> : <MessageCircle className="h-3 w-3 mr-1" />}
                      {isCommentPlaying ? 'Pausar' : 'Comentário'}
                    </Button>}

                  {aulaUrl && <Button onClick={() => openVideoMode(aulaUrl, articleNumber, articleContent)} variant="outline" size="sm" className="text-xs">
                      <Video className="h-3 w-3 mr-1" />
                      Aula
                    </Button>}
                  
                  <Button onClick={handleExplain} disabled={activeLoading[explainKey] || isGenerating} variant="outline" size="sm" className="text-xs">
                    {activeLoading[explainKey] ? <>
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary mr-1" />
                        {loadingProgress[explainKey]?.toFixed(0)}%
                      </> : <>
                        <Brain className="h-3 w-3 mr-1" />
                        Explicar
                      </>}
                  </Button>
                  <Button onClick={handleExample} disabled={activeLoading[exampleKey] || isGenerating} variant="outline" size="sm" className="text-xs">
                    {activeLoading[exampleKey] ? <>
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary mr-1" />
                        {loadingProgress[exampleKey]?.toFixed(0)}%
                      </> : <>
                        <Lightbulb className="h-3 w-3 mr-1" />
                        Exemplo
                      </>}
                  </Button>
                  <Button onClick={() => generateFlashcards(articleContent, articleNumber)} disabled={isGenerating} variant="outline" size="sm" className="text-xs">
                    {isGenerating ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Bookmark className="h-3 w-3 mr-1" />}
                    Flashcards
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>;
  };

  // Tela inicial
  if (view === 'home') {
    return <div className="min-h-screen bg-background">
        <div className="flex items-center justify-between p-4 border-b">
          <Button variant="ghost" size="sm" onClick={() => setCurrentFunction(null)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          
        </div>

        <div className="flex flex-col items-center justify-center p-6 min-h-[calc(100vh-80px)] px-[13px] my-[3px] mx-0 py-[3px]">
          <div className="text-center mb-8 max-w-lg py-[3px] my-0">
            <div className="w-16 h-16 mx-auto bg-gradient-to-br from-primary to-accent-legal rounded-2xl flex items-center justify-center shadow-lg mb-6">
              <Scale className="h-8 w-8 text-primary-foreground" />
            </div>
            
            <h1 className="text-3xl font-bold mb-4 text-primary">Vade Mecum Digital</h1>
            <p className="text-muted-foreground mb-8">
              Acesse os principais códigos jurídicos brasileiros de forma rápida e eficiente
            </p>
          </div>

          <motion.div className="grid gap-4 grid-cols-2 max-w-3xl w-full" initial={{
          opacity: 0,
          y: 20
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          duration: 0.5
        }}>
            {/* Constituição Federal */}
            <motion.div initial={{
            opacity: 0,
            scale: 0.95
          }} animate={{
            opacity: 1,
            scale: 1
          }} transition={{
            duration: 0.3,
            delay: 0.1
          }}>
              <Card className="cursor-pointer group bg-gradient-to-br from-amber-600/80 via-yellow-700/70 to-amber-800/60 border-amber-500/40 hover:border-amber-400/70 hover:shadow-2xl hover:shadow-amber-500/30 hover:scale-[1.02] transition-all duration-300 h-[160px] flex items-center" onClick={() => {
              const cf88Code = {
                id: 'cf88',
                name: 'CF/88',
                fullName: 'Constituição Federal',
                description: 'Carta Magna do Brasil',
                icon: 'Crown',
                color: 'bg-gradient-to-br from-amber-600/80 via-yellow-700/70 to-amber-800/60 border border-amber-500/40 backdrop-blur-sm',
                textColor: 'text-amber-50'
              };
              loadArticles(cf88Code);
            }}>
                <CardContent className="p-4 text-center w-full">
                  <div className="w-10 h-10 mx-auto bg-amber-500/30 rounded-xl flex items-center justify-center mb-2 group-hover:scale-110 group-hover:bg-amber-400/40 transition-all shadow-lg shadow-amber-500/20">
                    <Crown className="h-5 w-5 text-amber-200 drop-shadow-lg" />
                  </div>
                  <h3 className="text-base font-bold text-amber-100 mb-1 line-clamp-1 drop-shadow-md">Constituição</h3>
                  <p className="text-amber-200/80 mb-2 text-xs line-clamp-2">Carta Magna do Brasil - Lei fundamental</p>
                  <div className="flex items-center justify-center text-amber-200/70 group-hover:text-amber-100 transition-colors">
                    <span className="text-xs font-medium">Explore agora</span>
                    <ChevronRight className="h-3 w-3 ml-2 group-hover:translate-x-1 transition-transform" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Códigos & Leis */}
            <motion.div initial={{
            opacity: 0,
            scale: 0.95
          }} animate={{
            opacity: 1,
            scale: 1
          }} transition={{
            duration: 0.3,
            delay: 0.2
          }}>
              <Card className="cursor-pointer group bg-gradient-to-br from-red-800/80 via-red-900/70 to-red-950/60 border-red-700/40 hover:border-red-600/70 hover:shadow-2xl hover:shadow-red-600/30 hover:scale-[1.02] transition-all duration-300 h-[160px] flex items-center" onClick={() => selectCategory('articles')}>
                <CardContent className="p-4 text-center w-full">
                  <div className="w-10 h-10 mx-auto bg-red-700/30 rounded-xl flex items-center justify-center mb-2 group-hover:scale-110 group-hover:bg-red-600/40 transition-all shadow-lg shadow-red-600/20">
                    <BookOpen className="h-5 w-5 text-red-200 drop-shadow-lg" />
                  </div>
                  <h3 className="text-base font-bold text-red-100 mb-1 line-clamp-1 drop-shadow-md">Códigos & Leis</h3>
                  <p className="text-red-200/80 mb-2 text-xs line-clamp-2">Acesse os principais códigos do ordenamento jurídico</p>
                  <div className="flex items-center justify-center text-red-200/70 group-hover:text-red-100 transition-colors">
                    <span className="text-xs font-medium">Explore agora</span>
                    <ChevronRight className="h-3 w-3 ml-2 group-hover:translate-x-1 transition-transform" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Estatutos */}
            <motion.div initial={{
            opacity: 0,
            scale: 0.95
          }} animate={{
            opacity: 1,
            scale: 1
          }} transition={{
            duration: 0.3,
            delay: 0.3
          }}>
              <Card className="cursor-pointer group bg-gradient-to-br from-red-600/80 via-red-700/70 to-red-800/60 border-red-500/40 hover:border-red-400/70 hover:shadow-2xl hover:shadow-red-500/30 hover:scale-[1.02] transition-all duration-300 h-[160px] flex items-center" onClick={() => selectCategory('statutes')}>
                <CardContent className="p-4 text-center w-full">
                  <div className="w-10 h-10 mx-auto bg-red-500/30 rounded-xl flex items-center justify-center mb-2 group-hover:scale-110 group-hover:bg-red-400/40 transition-all shadow-lg shadow-red-500/20">
                    <Scroll className="h-5 w-5 text-red-200 drop-shadow-lg" />
                  </div>
                  <h3 className="text-base font-bold text-red-100 mb-1 line-clamp-1 drop-shadow-md">Estatutos</h3>
                  <p className="text-red-200/80 mb-2 text-xs line-clamp-2">Consulte estatutos e leis especiais</p>
                  <div className="flex items-center justify-center text-red-200/70 group-hover:text-red-100 transition-colors">
                    <span className="text-xs font-medium">Explore agora</span>
                    <ChevronRight className="h-3 w-3 ml-2 group-hover:translate-x-1 transition-transform" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Súmulas */}
            <motion.div initial={{
            opacity: 0,
            scale: 0.95
          }} animate={{
            opacity: 1,
            scale: 1
          }} transition={{
            duration: 0.3,
            delay: 0.4
          }}>
              <Card className="cursor-pointer group bg-gradient-to-br from-purple-600/80 via-purple-700/70 to-purple-800/60 border-purple-500/40 hover:border-purple-400/70 hover:shadow-2xl hover:shadow-purple-500/30 hover:scale-[1.02] transition-all duration-300 h-[160px] flex items-center" onClick={() => selectCategory('sumulas')}>
                <CardContent className="p-4 text-center w-full">
                  <div className="w-10 h-10 mx-auto bg-purple-500/30 rounded-xl flex items-center justify-center mb-2 group-hover:scale-110 group-hover:bg-purple-400/40 transition-all shadow-lg shadow-purple-500/20">
                    <Scale className="h-5 w-5 text-purple-200 drop-shadow-lg" />
                  </div>
                  <h3 className="text-base font-bold text-purple-100 mb-1 line-clamp-1 drop-shadow-md">Súmulas</h3>
                  <p className="text-purple-200/80 mb-2 text-xs line-clamp-2">Súmulas do STF e STJ</p>
                  <div className="flex items-center justify-center text-purple-200/70 group-hover:text-purple-100 transition-colors">
                    <span className="text-xs font-medium">Explore agora</span>
                    <ChevronRight className="h-3 w-3 ml-2 group-hover:translate-x-1 transition-transform" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </div>;
  }

  // Lista de códigos ou súmulas
  if (view === 'codes') {
    // Se for categoria de súmulas, mostrar componente específico
    if (categoryType === 'sumulas') {
      return <VadeMecumSumulasList onBack={handleBack} />;
    }
    return <div className="min-h-screen bg-background">
        <div className="flex items-center justify-between p-4 border-b">
          <Button variant="ghost" size="sm" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <h2 className="text-lg font-bold">
            {categoryType === 'articles' ? 'Códigos & Leis' : 'Estatutos'}
          </h2>
          <div className="w-16" />
        </div>

        <div className="p-4 bg-background min-h-screen">
          {/* Grid responsivo com cards do mesmo tamanho */}
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3">
              {currentCodes.map((code, index) => <motion.div key={code.id} onClick={() => loadArticles(code)} className="cursor-pointer group" initial={{
              opacity: 0,
              y: 20
            }} animate={{
              opacity: 1,
              y: 0
            }} transition={{
              duration: 0.3,
              delay: index * 0.1
            }} whileHover={{
              scale: 1.02
            }} whileTap={{
              scale: 0.98
            }}>
                  <div className={`rounded-xl ${code.color} p-3 sm:p-4 h-[120px] sm:h-[140px] flex flex-col items-center justify-center text-center shadow-lg hover:shadow-xl transition-all duration-300`}>
                    <div className="mb-2 group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
                      {(() => {
                    const iconMap: Record<string, React.ComponentType<any>> = {
                      'Handshake': Handshake,
                      'Building': Building,
                      'Zap': Zap,
                      'Gavel': Gavel,
                      'FileText': FileText,
                      'Swords': Swords,
                      'Briefcase': Briefcase,
                      'Shield': Shield,
                      'DollarSign': DollarSign,
                      'Baby': Baby,
                      'Users': Users,
                      'Scale': Scale,
                      'Crown': Crown
                    };
                    const IconComponent = iconMap[code.icon];
                    return IconComponent ? <IconComponent className="h-7 w-7 sm:h-8 sm:w-8" /> : null;
                  })()}
                    </div>
                    <div className="flex-1 flex flex-col justify-center min-h-0 w-full">
                      <h3 className={`font-bold text-sm sm:text-base mb-1 ${code.textColor} line-clamp-1`}>
                        {code.name}
                      </h3>
                      <p className={`text-[11px] sm:text-xs ${code.textColor} opacity-80 leading-tight line-clamp-2`}>
                        {code.fullName}
                      </p>
                    </div>
                  </div>
                </motion.div>)}
            </div>
          </div>
        </div>
      </div>;
  }

  // Lista de artigos com virtualização
  return <div className="min-h-screen bg-background">
      <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b z-10">
        <div className="flex items-center justify-between p-4">
          <Button variant="ghost" size="sm" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <h2 className="text-lg font-bold truncate">
            {selectedCode?.name} - {selectedCode?.fullName}
          </h2>
          <div className="w-16" />
        </div>
        
        <div className="px-4 pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input ref={searchRef} placeholder="Buscar por artigo ou conteúdo..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
          </div>
        </div>
      </div>

      {isLoading ? <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-3 text-muted-foreground">Carregando artigos...</span>
        </div> : filteredArticles.length === 0 ? <div className="text-center py-12">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            {searchTerm ? 'Nenhum artigo encontrado.' : 'Nenhum artigo disponível.'}
          </p>
        </div> : <div ref={parentRef} className="h-[calc(100vh-180px)] overflow-auto p-4">
          <div className="max-w-4xl mx-auto" style={{
        height: `${virtualizer.getTotalSize()}px`,
        position: 'relative'
      }}>
            {virtualizer.getVirtualItems().map(virtualItem => {
          const article = filteredArticles[virtualItem.index];
          return <div key={virtualItem.key} data-index={virtualItem.index} ref={virtualizer.measureElement} style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            transform: `translateY(${virtualItem.start}px)`
          }}>
                  <VadeMecumArticleCard article={article} index={virtualItem.index} />
                </div>;
        })}
          </div>
        </div>}

      {/* Modal Centralizado para Conteúdo Gerado */}
      <Dialog open={generatedModal.open} onOpenChange={open => setGeneratedModal(prev => ({
      ...prev,
      open
    }))}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto px-0">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              {generatedModal.type === 'explicar' ? <Brain className="h-6 w-6 text-primary" /> : <Lightbulb className="h-6 w-6 text-warning" />}
              {generatedModal.type === 'explicar' ? 'Explicação' : 'Exemplo Prático'}
              {generatedModal.hasValidNumber && ` - Art. ${generatedModal.articleNumber}`}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="prose prose-slate dark:prose-invert max-w-none p-6 bg-muted/30 rounded-lg border">
              {generatedModal.content ? <div className="vademecum-text">
                  <ReactMarkdown components={{
                h1: ({
                  ...props
                }) => <h1 className="text-2xl font-bold mb-4 text-primary" {...props} />,
                h2: ({
                  ...props
                }) => <h2 className="text-xl font-semibold mb-3 text-primary" {...props} />,
                h3: ({
                  ...props
                }) => <h3 className="text-lg font-medium mb-2 text-primary" {...props} />,
                p: ({
                  ...props
                }) => <p className="mb-3 last:mb-0 text-base leading-relaxed" {...props} />,
                ul: ({
                  ...props
                }) => <ul className="list-disc pl-6 mb-3 space-y-1" {...props} />,
                ol: ({
                  ...props
                }) => <ol className="list-decimal pl-6 mb-3 space-y-1" {...props} />,
                li: ({
                  ...props
                }) => <li className="text-base leading-relaxed" {...props} />,
                blockquote: ({
                  ...props
                }) => <blockquote className="border-l-4 border-primary/30 pl-4 italic text-muted-foreground my-4" {...props} />,
                code: ({
                  ...props
                }) => <code className="bg-muted px-2 py-1 rounded text-sm font-mono" {...props} />,
                strong: ({
                  ...props
                }) => <strong className="font-semibold text-primary" {...props} />,
                em: ({
                  ...props
                }) => <em className="italic text-accent-legal" {...props} />
              }}>
                    {generatedModal.content}
                  </ReactMarkdown>
                </div> : <p className="text-muted-foreground">Carregando conteúdo...</p>}
            </div>
            
            <div className="flex flex-wrap gap-3">
              <Button onClick={() => {
              copyToClipboard(generatedModal.content);
              toast({
                title: "Copiado!",
                description: "Copiado para a área de transferência"
              });
            }} variant="outline" size="sm">
                <Copy className="h-4 w-4 mr-2" />
                Copiar {generatedModal.type === 'explicar' ? 'Explicação' : 'Exemplo'}
              </Button>
              <Button onClick={() => setGeneratedModal(prev => ({
              ...prev,
              open: false
            }))} size="sm">
                Fechar
              </Button>
            </div>
            
          </div>
        </DialogContent>
      </Dialog>

      
      {/* Botões Flutuantes */}
      {view === 'articles' && <>
          {/* Controles de Fonte - Canto Inferior Esquerdo */}
          <div className="fixed bottom-6 left-6 flex flex-col gap-2 z-50">
            <Button onClick={() => setFontSize(prev => Math.min(prev + 2, 24))} size="sm" className="w-10 h-10 rounded-full bg-primary hover:bg-primary/90 shadow-lg">
              <Plus className="h-4 w-4" />
            </Button>
            <div className="text-xs text-center text-primary font-medium bg-background/90 rounded px-2 py-1 shadow">
              {fontSize}px
            </div>
            <Button onClick={() => setFontSize(prev => Math.max(prev - 2, 12))} size="sm" className="w-10 h-10 rounded-full bg-primary hover:bg-primary/90 shadow-lg">
              <Minus className="h-4 w-4" />
            </Button>
          </div>

          {/* Botão Scroll to Top - Canto Inferior Direito */}
          {showScrollTop && <div className="fixed bottom-6 right-6 z-50">
              <Button onClick={scrollToTop} size="sm" className="w-12 h-12 rounded-full bg-accent hover:bg-accent/90 shadow-lg">
                <ArrowUp className="h-5 w-5" />
              </Button>
            </div>}
        </>}

      {/* Overlay com blur quando está gerando conteúdo */}
      {isGenerating && <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-8 flex flex-col items-center space-y-4 shadow-2xl">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
            <div className="text-center">
              <p className="text-lg font-semibold text-foreground">
                {generatingType === 'explicar' ? 'Gerando explicação...' : 'Gerando exemplo...'}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                A IA está processando sua solicitação
              </p>
            </div>
          </div>
        </div>}
      
      {/* Indicadores de progresso globais */}
      <div className="fixed top-20 right-4 space-y-2 z-50">
        {Object.entries(activeLoading).map(([key, active]) => active ? <ProgressIndicator key={key} progress={loadingProgress[key] || 0} label={key.includes('explain') ? 'Gerando explicação...' : 'Gerando exemplo...'} /> : null)}
      </div>


      {/* Flashcards Session */}
      {showFlashcardsSession && generatedFlashcards.length > 0 && <VadeMecumFlashcardsSession flashcards={generatedFlashcards} articleNumber="" codeName={selectedCode?.name || 'Código Legal'} onClose={() => {
      setShowFlashcardsSession(false);
      setGeneratedFlashcards([]);
    }} />}

      {/* Player de Comentário Flutuante */}
      {isPlayingComment && commentAudio && <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md px-4">
          <Card className="bg-background/95 backdrop-blur-sm border shadow-2xl">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-2">
                <Button variant="ghost" size="sm" onClick={() => {
              if (commentAudio) {
                commentAudio.pause();
                setIsPlayingComment(false);
                setCurrentCommentId(null);
              }
            }} className="h-8 w-8 p-0">
                  <Pause className="h-4 w-4" />
                </Button>
                <div className="flex-1">
                  <p className="text-sm font-medium">Comentário do Artigo</p>
                  <p className="text-xs text-muted-foreground">
                    {Math.floor(commentProgress / 60)}:{String(Math.floor(commentProgress % 60)).padStart(2, '0')} / {Math.floor(commentDuration / 60)}:{String(Math.floor(commentDuration % 60)).padStart(2, '0')}
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => {
              if (commentAudio) {
                commentAudio.pause();
                commentAudio.currentTime = 0;
                setCommentAudio(null);
                setIsPlayingComment(false);
                setCurrentCommentId(null);
              }
            }} className="h-8 w-8 p-0">
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                <div className="bg-primary h-full transition-all duration-300" style={{
              width: `${commentProgress / commentDuration * 100}%`
            }} />
              </div>
            </CardContent>
          </Card>
        </div>}

      {/* Modo Vídeo Aula */}
      {videoMode && currentVideo && <div className="fixed inset-0 bg-black z-[100] flex flex-col">
          <div className="flex items-center justify-between p-4 bg-black/80 border-b border-white/10">
            <h2 className="text-white font-bold text-lg">
              Aula - Art. {currentVideo.articleNumber}
            </h2>
            <Button variant="ghost" size="sm" onClick={closeVideoMode} className="text-white hover:bg-white/10">
              <X className="h-5 w-5 mr-2" />
              Voltar
            </Button>
          </div>
          
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Vídeo */}
            <div className="bg-black w-full">
              <div className="relative w-full" style={{
            paddingBottom: '56.25%'
          }}>
                {currentVideo.url.includes('youtube.com') || currentVideo.url.includes('youtu.be') ? <iframe src={(() => {
              try {
                const url = new URL(currentVideo.url);
                let videoId = '';
                if (url.hostname.includes('youtu.be')) {
                  videoId = url.pathname.slice(1);
                } else if (url.hostname.includes('youtube.com')) {
                  videoId = url.searchParams.get('v') || '';
                }
                return `https://www.youtube.com/embed/${videoId}?autoplay=1`;
              } catch {
                return currentVideo.url;
              }
            })()} className="absolute top-0 left-0 w-full h-full" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen /> : <video ref={videoRef} src={currentVideo.url} controls autoPlay className="absolute top-0 left-0 w-full h-full object-contain" controlsList="nodownload" />}
              </div>
            </div>

            {/* Artigo embaixo */}
            <div className="flex-1 overflow-y-auto bg-background p-6">
              <Card className="bg-card border">
                <CardContent className="p-6">
                  <h3 className="font-bold text-xl text-yellow-400 mb-4">
                    Art. {currentVideo.articleNumber}
                  </h3>
                  <div className="vademecum-text text-foreground leading-relaxed text-justify" style={{
                fontSize: `${fontSize}px`,
                lineHeight: 1.6
              }} dangerouslySetInnerHTML={{
                __html: formatVademecumText(currentVideo.articleContent)
              }} />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>}
    </div>;
};
export default VadeMecumUltraFast;