import { useState, useMemo, useRef } from 'react';
import { ArrowLeft, Search, BookOpen, Clock, CheckCircle, Play, Pause, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useCursosOrganizados, useProgressoUsuario } from '@/hooks/useCursosPreparatorios';
import { StaggerContainer, StaggerItem } from '@/components/ui/stagger-container';
import { normalizeVideoUrl } from '@/utils/videoHelpers';
import { toast } from 'sonner';
import { LessonActionButtons } from '@/components/Cursos/LessonActionButtons';
import ReactMarkdown from 'react-markdown';
import professoraAvatar from '@/assets/professora-avatar.png';
import { ProfessoraChat } from '@/components/ProfessoraChat';

interface CursosPreparatoriosUltraFastProps {
  onBack: () => void;
}

export function CursosPreparatoriosUltraFast({ onBack }: CursosPreparatoriosUltraFastProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentView, setCurrentView] = useState<'areas' | 'modules' | 'lessons' | 'player'>('areas');
  const [selectedArea, setSelectedArea] = useState<any>(null);
  const [selectedModule, setSelectedModule] = useState<any>(null);
  const [selectedLesson, setSelectedLesson] = useState<any>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isProfessorOpen, setIsProfessorOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const { areas, totalAreas, totalModulos, totalAulas, isLoading } = useCursosOrganizados();
  const { atualizarProgresso, obterProgresso } = useProgressoUsuario();

  // Filtrar áreas por busca
  const filteredAreas = useMemo(() => {
    if (!searchTerm.trim()) return areas;
    const term = searchTerm.toLowerCase();
    return areas.filter(area => 
      area.nome.toLowerCase().includes(term)
    );
  }, [areas, searchTerm]);

  const handleBack = () => {
    if (currentView === 'player') {
      setCurrentView('lessons');
    } else if (currentView === 'lessons') {
      setCurrentView('modules');
    } else if (currentView === 'modules') {
      setCurrentView('areas');
    } else {
      onBack();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Carregando cursos...</p>
        </div>
      </div>
    );
  }

  // Video Player
  if (currentView === 'player' && selectedLesson) {
    const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
          <div className="flex items-center justify-between p-4">
            <Button variant="ghost" onClick={handleBack} className="flex items-center gap-2">
              <ArrowLeft className="h-5 w-5" />
              Voltar
            </Button>
            <h1 className="text-lg font-semibold truncate">{selectedLesson.nome}</h1>
            <div className="w-20" />
          </div>
        </div>

        {/* Video Player */}
        <div className="relative bg-black">
          <video
            ref={videoRef}
            src={normalizeVideoUrl(selectedLesson.video)}
            className="w-full h-auto max-h-[70vh] object-contain"
            onTimeUpdate={(e) => {
              const video = e.currentTarget;
              setCurrentTime(video.currentTime);
              setDuration(video.duration);
              if (video.duration > 0) {
                atualizarProgresso(selectedLesson.id, video.currentTime, video.duration);
              }
            }}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onClick={(e) => {
              const video = e.currentTarget;
              if (playing) video.pause();
              else video.play().catch(() => toast.info('Clique no play'));
            }}
            playsInline
            autoPlay
          />
          
          {/* Progress bar */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted/50">
            <div 
              className="h-full bg-primary transition-all" 
              style={{ width: `${progressPercentage}%` }} 
            />
          </div>

          {/* Controls overlay */}
          {!playing && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <button
                onClick={() => videoRef.current?.play()}
                className="bg-primary hover:bg-primary/90 rounded-full p-6 transition-transform hover:scale-110"
              >
                <Play className="h-12 w-12 text-white" />
              </button>
            </div>
          )}
        </div>

        {/* Lesson Info & Actions */}
        <div className="p-6 space-y-6">
          {/* Lesson Details */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge className="bg-primary">
                Aula {selectedModule.aulas.findIndex((a: any) => a.id === selectedLesson.id) + 1}
              </Badge>
              <Badge variant="outline">{selectedModule.nome}</Badge>
            </div>
            <h2 className="text-2xl font-bold">{selectedLesson.nome}</h2>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {selectedLesson.duracao || 0}min
              </span>
              <span>{Math.round(progressPercentage)}% concluído</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="bg-card rounded-lg p-4 border border-border">
            <h3 className="font-semibold mb-3">Ferramentas de Estudo</h3>
            <LessonActionButtons
              lesson={{
                id: selectedLesson.id,
                area: selectedLesson.area,
                tema: selectedLesson.tema,
                assunto: selectedLesson.nome,
                conteudo: selectedLesson.conteudo || ''
              }}
            />
          </div>

          {/* Content */}
          {selectedLesson.conteudo && (
            <div className="bg-card rounded-lg p-6 border border-border">
              <h3 className="font-semibold mb-4">Conteúdo da Aula</h3>
              <div className="prose prose-sm max-w-none prose-headings:text-primary prose-strong:text-primary prose-p:text-muted-foreground prose-li:text-muted-foreground">
                <ReactMarkdown
                  components={{
                    h1: ({ children }) => <h1 className="text-xl font-bold mb-4 text-primary">{children}</h1>,
                    h2: ({ children }) => <h2 className="text-lg font-bold mb-3 text-primary">{children}</h2>,
                    h3: ({ children }) => <h3 className="text-base font-bold mb-2 text-primary">{children}</h3>,
                    strong: ({ children }) => <strong className="text-primary font-bold">{children}</strong>,
                    p: ({ children }) => <p className="mb-4 leading-relaxed text-muted-foreground">{children}</p>,
                    ul: ({ children }) => <ul className="space-y-2 ml-4 text-muted-foreground">{children}</ul>,
                    ol: ({ children }) => <ol className="space-y-2 ml-4 text-muted-foreground">{children}</ol>,
                    li: ({ children }) => <li className="leading-relaxed">{children}</li>
                  }}
                >
                  {selectedLesson.conteudo}
                </ReactMarkdown>
              </div>
            </div>
          )}

          {/* Floating Professor Button */}
          <div className="fixed bottom-6 right-6 z-50">
            <div className="relative">
              <Button 
                variant="ghost" 
                className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full w-16 h-16 shadow-lg border-4 border-background" 
                onClick={() => setIsProfessorOpen(true)}
                aria-label="Abrir chat da Professora"
              >
                <img 
                  src={professoraAvatar} 
                  alt="Professora" 
                  className="w-full h-full rounded-full object-cover" 
                />
              </Button>
              
              <div className="absolute -top-1 -right-1 bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs">
                <MessageCircle className="h-3 w-3" />
              </div>
            </div>
          </div>

          {/* Professora Chat */}
          <ProfessoraChat 
            isOpen={isProfessorOpen} 
            onClose={() => setIsProfessorOpen(false)}
            context={{
              titulo: selectedLesson.nome,
              area: selectedLesson.area,
              sobre: selectedLesson.conteudo || ''
            }}
          />
        </div>
      </div>
    );
  }

  // Lessons List
  if (currentView === 'lessons' && selectedModule) {
    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
          <div className="flex items-center justify-between p-4">
            <Button variant="ghost" onClick={handleBack} className="flex items-center gap-2">
              <ArrowLeft className="h-5 w-5" />
              Voltar
            </Button>
            <h1 className="text-lg font-semibold">Aulas</h1>
            <div className="w-20" />
          </div>
        </div>

        {/* Module Info */}
        <div className="p-6 border-b border-border bg-gradient-to-br from-primary/5 to-transparent">
          <h2 className="text-2xl font-bold mb-2">{selectedModule.nome}</h2>
          <p className="text-muted-foreground mb-4">{selectedModule.aulas.length} aulas disponíveis</p>
        </div>

        {/* Lessons List */}
        <div className="p-6">
          <StaggerContainer className="space-y-3">
            {selectedModule.aulas.map((lesson: any, index: number) => {
              const progress = obterProgresso(lesson.id);
              
              return (
                <StaggerItem key={lesson.id}>
                  <div
                    onClick={() => {
                      setSelectedLesson(lesson);
                      setCurrentView('player');
                    }}
                    className="group cursor-pointer bg-card hover:bg-card/80 rounded-lg border border-border hover:border-primary/50 transition-all duration-300 p-4"
                  >
                    <div className="flex items-center gap-4">
                      {/* Lesson Number */}
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-primary">
                        {index + 1}
                      </div>

                      {/* Lesson Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold group-hover:text-primary transition-colors line-clamp-1">
                          {lesson.nome}
                        </h3>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {lesson.duracao || 0}min
                          </span>
                          {progress && progress.percentualAssistido > 0 && (
                            <span className="flex items-center gap-1 text-primary">
                              <CheckCircle className="h-3 w-3" />
                              {progress.percentualAssistido}%
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Play Icon */}
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 rounded-full bg-primary/10 group-hover:bg-primary group-hover:text-white flex items-center justify-center transition-all">
                          <Play className="h-5 w-5" />
                        </div>
                      </div>
                    </div>
                  </div>
                </StaggerItem>
              );
            })}
          </StaggerContainer>
        </div>
      </div>
    );
  }

  // Modules View
  if (currentView === 'modules' && selectedArea) {
    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
          <div className="flex items-center justify-between p-4">
            <Button 
              variant="ghost" 
              onClick={handleBack}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-5 w-5" />
              Voltar
            </Button>
            <h1 className="text-lg font-semibold">Módulos</h1>
            <div className="w-20" />
          </div>
        </div>

        {/* Area Info */}
        <div className="p-6 border-b border-border bg-gradient-to-br from-primary/5 to-transparent">
          <h2 className="text-2xl font-bold mb-2">{selectedArea.nome}</h2>
          <p className="text-muted-foreground mb-4">{selectedArea.descricao}</p>
          <div className="flex gap-4 text-sm">
            <Badge variant="secondary">
              {selectedArea.modulos.length} módulos
            </Badge>
            <Badge variant="secondary">
              {selectedArea.modulos.reduce((acc: number, m: any) => acc + m.aulas.length, 0)} aulas
            </Badge>
          </div>
        </div>

        {/* Modules Grid */}
        <div className="p-6">
          <StaggerContainer className="grid gap-4">
            {selectedArea.modulos.map((module: any) => (
              <StaggerItem key={module.id}>
                  <div
                    onClick={() => {
                      setSelectedModule(module);
                      setCurrentView('lessons');
                    }}
                  className="group cursor-pointer bg-card hover:bg-card/80 rounded-lg border border-border hover:border-primary/50 transition-all duration-300 overflow-hidden"
                >
                  <div className="flex gap-4 p-4">
                    {/* Module Image */}
                    <div className="relative w-32 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
                      {module.capa && (
                        <img
                          src={module.capa}
                          alt={module.nome}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <div className="absolute bottom-2 left-2">
                        <Badge className="bg-primary text-xs">
                          {module.aulas.length} aulas
                        </Badge>
                      </div>
                    </div>

                    {/* Module Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                        {module.nome}
                      </h3>
                      {module.descricao && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                          {module.descricao}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {module.aulas.reduce((acc: number, a: any) => acc + (a.duracao || 0), 0)}min
                        </span>
                        <span className="flex items-center gap-1">
                          <BookOpen className="h-3 w-3" />
                          {module.aulas.length} lições
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </div>
    );
  }

  // Areas View
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center justify-between p-4">
          <Button 
            variant="ghost" 
            onClick={onBack}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-5 w-5" />
            Voltar
          </Button>
          <h1 className="text-lg font-semibold">Cursos Preparatórios</h1>
          <div className="w-20" />
        </div>

        {/* Search Bar */}
        <div className="px-4 pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar cursos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-muted/50 border-border"
            />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="px-6 pt-6">
        <div className="bg-gradient-to-br from-primary/10 to-transparent rounded-xl p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Áreas de Conhecimento Jurídico</h2>
          <p className="text-muted-foreground mb-4">
            Selecione uma área para explorar os módulos e aulas especializadas
          </p>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-3xl font-bold text-primary">{totalAreas}</div>
              <div className="text-sm text-muted-foreground">Áreas</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary">{totalModulos}</div>
              <div className="text-sm text-muted-foreground">Módulos</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary">{totalAulas}</div>
              <div className="text-sm text-muted-foreground">Aulas</div>
            </div>
          </div>
        </div>
      </div>

      {/* Areas Grid */}
      <div className="px-6 pb-8">
        <StaggerContainer className="grid gap-4">
          {filteredAreas.map((area, areaIndex) => {
            const totalLessons = area.modulos.reduce((acc: number, m: any) => acc + m.aulas.length, 0);
            const completedLessons = 0; // Pode adicionar lógica de progresso aqui
            
            return (
              <StaggerItem key={area.nome + areaIndex}>
                <div
                  onClick={() => {
                    setSelectedArea(area);
                    setCurrentView('modules');
                  }}
                  className="group cursor-pointer bg-card hover:bg-card/80 rounded-xl border border-border hover:border-primary/50 transition-all duration-300 overflow-hidden"
                >
                  {/* Area Image */}
                  <div className="relative h-48 overflow-hidden">
                    {area.capa && (
                      <img
                        src={area.capa}
                        alt={area.nome}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
                    
                    {/* Title overlay */}
                    <div className="absolute bottom-0 left-0 right-0 p-6">
                      <h3 className="text-xl font-bold text-white mb-2 drop-shadow-lg">
                        {area.nome}
                      </h3>
                    </div>
                  </div>

                  {/* Area Info */}
                  <div className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {area.modulos.length} módulos
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {totalLessons} aulas
                        </Badge>
                      </div>
                      
                      {completedLessons > 0 && (
                        <div className="flex items-center gap-1 text-xs text-primary">
                          <CheckCircle className="h-3 w-3" />
                          {completedLessons}/{totalLessons}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </StaggerItem>
            );
          })}
        </StaggerContainer>
      </div>
    </div>
  );
}
