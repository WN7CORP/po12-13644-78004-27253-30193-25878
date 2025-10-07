import React, { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Search, Scale, Star, ArrowLeft, Volume2, Copy, Lightbulb, BookOpen, Play, Square, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useSumulasPorTribunal } from '@/hooks/useSumulas';
import { useToast } from '@/hooks/use-toast';
import { copyToClipboard } from '@/utils/clipboardUtils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import ReactMarkdown from 'react-markdown';
interface VadeMecumSumulasListProps {
  onBack: () => void;
}
export const VadeMecumSumulasList: React.FC<VadeMecumSumulasListProps> = ({
  onBack
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | 'STF' | 'STF_VINCULANTE'>('all');
  const {
    sumulasPorTribunal,
    isLoading
  } = useSumulasPorTribunal();
  const {
    toast
  } = useToast();
  const {
    user
  } = useAuth();

  // Estados para funcionalidades adicionais
  const [isNarrating, setIsNarrating] = useState(false);
  const [narrateLoading, setNarrateLoading] = useState(false);
  const [audioInstance, setAudioInstance] = useState<HTMLAudioElement | null>(null);
  const [currentNarratingId, setCurrentNarratingId] = useState<number | null>(null);
  const [loadingAI, setLoadingAI] = useState<{
    [key: string]: boolean;
  }>({});
  const [aiModal, setAiModal] = useState<{
    open: boolean;
    type: 'explicar' | 'exemplo';
    content: string;
    title: string;
  }>({
    open: false,
    type: 'explicar',
    content: '',
    title: ''
  });
  const filteredSumulas = useMemo(() => {
    // STJ não possui súmulas ainda, apenas STF e STF_VINCULANTE
    let sumulas = selectedType === 'all' ? [...sumulasPorTribunal.STF, ...sumulasPorTribunal.STF_VINCULANTE] : sumulasPorTribunal[selectedType];
    if (!searchTerm.trim()) return sumulas;
    const searchLower = searchTerm.toLowerCase();
    return sumulas.filter(sumula => sumula.titulo.toLowerCase().includes(searchLower) || sumula.texto.toLowerCase().includes(searchLower));
  }, [sumulasPorTribunal, selectedType, searchTerm]);
  const handleCopy = async (text: string) => {
    const success = await copyToClipboard(text);
    if (success) {
      toast({
        title: "✅ Súmula copiada!",
        description: "O conteúdo foi copiado para a área de transferência."
      });
    }
  };
  const handleNarrate = useCallback(async (sumula: any) => {
    if (!sumula.naracao) {
      toast({
        title: "Em breve",
        description: "A narração desta súmula estará disponível em breve."
      });
      return;
    }

    // Se já está narrando esta súmula, parar
    if (isNarrating && currentNarratingId === sumula.id && audioInstance) {
      audioInstance.pause();
      setIsNarrating(false);
      setAudioInstance(null);
      setCurrentNarratingId(null);
      return;
    }

    // Parar áudio anterior se existir
    if (audioInstance) {
      audioInstance.pause();
      setAudioInstance(null);
    }
    setNarrateLoading(true);
    try {
      const audio = new Audio(sumula.naracao);
      audio.onended = () => {
        setIsNarrating(false);
        setAudioInstance(null);
        setCurrentNarratingId(null);
      };
      audio.onerror = () => {
        setIsNarrating(false);
        setAudioInstance(null);
        setCurrentNarratingId(null);
        toast({
          title: "Erro",
          description: "Erro ao reproduzir áudio.",
          variant: "destructive"
        });
      };
      setAudioInstance(audio);
      setIsNarrating(true);
      setCurrentNarratingId(sumula.id);
      audio.play();
      toast({
        title: "🔊 Narração iniciada",
        description: "A súmula está sendo narrada."
      });
    } catch (error) {
      console.error('Erro ao narrar súmula:', error);
      toast({
        title: "Erro",
        description: "Erro ao reproduzir áudio.",
        variant: "destructive"
      });
    } finally {
      setNarrateLoading(false);
    }
  }, [isNarrating, audioInstance, currentNarratingId, toast]);
  const handleAIAction = useCallback(async (sumula: any, action: 'explicar' | 'exemplo') => {
    if (!user) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado para usar esta funcionalidade.",
        variant: "destructive"
      });
      return;
    }
    const loadingKey = `${action}-${sumula.id}`;
    setLoadingAI(prev => ({
      ...prev,
      [loadingKey]: true
    }));
    try {
      const {
        data,
        error
      } = await supabase.functions.invoke('generate-vade-mecum-content', {
        body: {
          articleContent: sumula.texto,
          articleNumber: sumula.titulo,
          codeName: sumula.tipo === 'STF_VINCULANTE' ? 'Súmula Vinculante STF' : `Súmula ${sumula.tribunal}`,
          userId: user.id,
          type: action
        }
      });
      if (error) throw error;
      setAiModal({
        open: true,
        type: action,
        content: data.content || '',
        title: sumula.titulo
      });
      toast({
        title: "Sucesso!",
        description: `${action === 'explicar' ? 'Explicação' : 'Exemplo'} gerado com IA`
      });
    } catch (error) {
      console.error(`Erro ao gerar ${action}:`, error);
      toast({
        title: "Erro",
        description: `Não foi possível gerar ${action === 'explicar' ? 'a explicação' : 'o exemplo'}. Tente novamente.`,
        variant: "destructive"
      });
    } finally {
      setLoadingAI(prev => ({
        ...prev,
        [loadingKey]: false
      }));
    }
  }, [user, toast]);
  return <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b z-10">
        <div className="flex items-center justify-between p-4">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <h2 className="text-lg font-bold">Súmulas</h2>
          <div className="w-16" />
        </div>

        {/* Search */}
        <div className="px-4 pb-4">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar súmula..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
          </div>

          {/* Filters */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            <Button variant={selectedType === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setSelectedType('all')}>
              Todas
            </Button>
            <Button variant={selectedType === 'STF' ? 'default' : 'outline'} size="sm" onClick={() => setSelectedType('STF')}>
              <Scale className="h-3 w-3 mr-1" />
              STF
              <Badge variant="secondary" className="ml-2">{sumulasPorTribunal.STF.length}</Badge>
            </Button>
            <Button variant={selectedType === 'STF_VINCULANTE' ? 'default' : 'outline'} size="sm" onClick={() => setSelectedType('STF_VINCULANTE')}>
              <Star className="h-3 w-3 mr-1" />
              Vinculantes
              <Badge variant="secondary" className="ml-2">{sumulasPorTribunal.STF_VINCULANTE.length}</Badge>
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4 max-w-4xl mx-auto">
        {isLoading ? <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-3 text-muted-foreground">Carregando súmulas...</span>
          </div> : filteredSumulas.length === 0 ? <div className="text-center py-12">
            <Scale className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              {searchTerm ? 'Nenhuma súmula encontrada.' : 'Nenhuma súmula disponível.'}
            </p>
          </div> : filteredSumulas.map((sumula, index) => <motion.div key={sumula.id} initial={{
        opacity: 0,
        y: 20
      }} animate={{
        opacity: 1,
        y: 0
      }} transition={{
        delay: index * 0.05
      }}>
              <Card className="hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant={sumula.tipo === 'STF_VINCULANTE' ? 'default' : 'secondary'}>
                          {sumula.tipo === 'STF_VINCULANTE' ? <>
                              <Star className="h-3 w-3 mr-1" />
                              Vinculante
                            </> : sumula.tribunal}
                        </Badge>
                        {sumula.data_aprovacao && <span className="text-xs text-muted-foreground">
                            {sumula.data_aprovacao}
                          </span>}
                      </div>
                      <h3 className="font-semibold text-lg mb-2">{sumula.titulo}</h3>
                      <p className="text-muted-foreground leading-relaxed">{sumula.texto}</p>
                    </div>
                  </div>

                  {/* Ações principais - cores idênticas aos artigos */}
                  <div className="grid grid-cols-3 gap-2 mt-4">
                    

                    

                    
                  </div>

                  {/* Ação secundária */}
                  <div className="flex gap-2 mt-2">
                    <Button variant="outline" size="sm" onClick={() => handleCopy(sumula.texto)} className="flex-1">
                      <Copy className="h-3 w-3 mr-1" />
                      Copiar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>)}
      </div>

      {/* Modal de conteúdo gerado por IA - estilo idêntico aos artigos */}
      <Dialog open={aiModal.open} onOpenChange={open => setAiModal(prev => ({
      ...prev,
      open
    }))}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {aiModal.type === 'explicar' ? <>
                  <BookOpen className="h-5 w-5 text-yellow-600" />
                  💡 Explicação - {aiModal.title}
                </> : <>
                  <Lightbulb className="h-5 w-5 text-green-600" />
                  🔍 Exemplo Prático - {aiModal.title}
                </>}
            </DialogTitle>
          </DialogHeader>
          <div className={`prose prose-sm dark:prose-invert max-w-none p-4 rounded-lg ${aiModal.type === 'explicar' ? 'bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800' : 'bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800'}`}>
            <ReactMarkdown>{aiModal.content}</ReactMarkdown>
          </div>
        </DialogContent>
      </Dialog>
    </div>;
};