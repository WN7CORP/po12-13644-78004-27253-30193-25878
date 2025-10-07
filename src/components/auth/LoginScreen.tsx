import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Scale, User, Phone, GraduationCap, Briefcase, BookOpen, Building2, ArrowRight } from 'lucide-react';
import { z } from 'zod';
import { HelpButton } from './HelpButton';

const registrationSchema = z.object({
  nome_completo: z.string().min(3, 'Nome completo obrigatório (mínimo 3 caracteres)'),
  telefone: z.string().min(10, 'Telefone obrigatório (mínimo 10 dígitos)'),
  area: z.string().min(1, 'Área obrigatória')
});

interface LoginScreenProps {
  onSuccess: () => void;
  onForgotPassword: () => void;
  onSignUp: () => void;
}

const areas = [
  { value: 'concurso', label: 'Concurso Público', icon: Building2, color: 'from-blue-500 to-blue-600' },
  { value: 'oab', label: 'Exame OAB', icon: Scale, color: 'from-amber-500 to-orange-600' },
  { value: 'faculdade', label: 'Faculdade de Direito', icon: GraduationCap, color: 'from-purple-500 to-purple-600' },
  { value: 'advogado', label: 'Advogado(a)', icon: Briefcase, color: 'from-green-500 to-green-600' }
];

export const LoginScreen = ({ onSuccess }: LoginScreenProps) => {
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    nome_completo: '',
    telefone: '',
    area: ''
  });

  const goToNextStep = () => {
    if (currentStep === 1 && formData.nome_completo.length < 3) {
      toast({
        title: "Nome muito curto",
        description: "Por favor, digite seu nome completo",
        variant: "destructive"
      });
      return;
    }
    if (currentStep === 2 && formData.telefone.length < 10) {
      toast({
        title: "Telefone inválido",
        description: "Por favor, digite um telefone válido",
        variant: "destructive"
      });
      return;
    }
    setCurrentStep(prev => prev + 1);
  };

  const handleAreaSelect = async (areaValue: string) => {
    setFormData(prev => ({ ...prev, area: areaValue }));
    
    setLoading(true);

    try {
      const dataToInsert = {
        ...formData,
        area: areaValue
      };

      registrationSchema.parse(dataToInsert);

      const { error } = await supabase
        .from('user_registrations')
        .insert([dataToInsert]);

      if (error) {
        console.error('Erro ao salvar:', error);
        throw error;
      }

      // Salvar no localStorage que o usuário está registrado
      localStorage.setItem('user_registered', 'true');
      localStorage.setItem('user_data', JSON.stringify(dataToInsert));

      toast({
        title: "Cadastro realizado!",
        description: "Bem-vindo ao nosso aplicativo de Direito!",
        variant: "default"
      });

      setTimeout(() => {
        onSuccess();
      }, 500);
    } catch (error: any) {
      toast({
        title: "Erro no cadastro",
        description: error.message || "Tente novamente mais tarde",
        variant: "destructive"
      });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-muted/20 flex items-center justify-center p-4 overflow-hidden">
      {/* Animated background icons */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-5">
        <Scale className="absolute top-20 left-10 w-32 h-32 animate-float" />
        <BookOpen className="absolute bottom-20 right-10 w-24 h-24 animate-float-delayed" />
        <GraduationCap className="absolute top-1/2 right-1/4 w-20 h-20 animate-float" />
        <Briefcase className="absolute bottom-1/3 left-1/4 w-16 h-16 animate-float-delayed" />
      </div>

      <Card className="w-full max-w-md shadow-2xl border-border/50 bg-card/95 backdrop-blur-sm relative z-10 min-h-[500px] flex flex-col">
        <CardHeader className="text-center space-y-4 pb-6">
          <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-primary to-accent-legal flex items-center justify-center animate-scale-in shadow-lg">
            <Scale className="w-10 h-10 text-white animate-pulse" />
          </div>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary via-primary/80 to-accent-legal bg-clip-text text-transparent animate-slide-down">
            Bem-vindo ao Direito App
          </CardTitle>
          
          {/* Progress indicator */}
          <div className="flex justify-center gap-2 pt-2">
            {[1, 2, 3].map((step) => (
              <div
                key={step}
                className={`h-2 rounded-full transition-all duration-300 ${
                  step === currentStep
                    ? 'w-8 bg-gradient-to-r from-primary to-accent-legal'
                    : step < currentStep
                    ? 'w-2 bg-primary/50'
                    : 'w-2 bg-border'
                }`}
              />
            ))}
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 flex flex-col justify-center">
          {/* Step 1: Nome */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-fade-in">
              <div className="text-center space-y-2">
                <User className="w-16 h-16 mx-auto text-primary animate-bounce-soft" />
                <h3 className="text-xl font-semibold">Qual é o seu nome?</h3>
                <p className="text-sm text-muted-foreground">Vamos começar nos conhecendo melhor</p>
              </div>
              <div className="space-y-4">
                <Input
                  type="text"
                  value={formData.nome_completo}
                  onChange={(e) => setFormData(prev => ({ ...prev, nome_completo: e.target.value }))}
                  placeholder="Digite seu nome completo"
                  className="text-lg h-14 text-center bg-background/50 border-border/50 focus:border-primary/50 transition-all duration-300"
                  autoFocus
                  onKeyPress={(e) => e.key === 'Enter' && goToNextStep()}
                />
                <Button
                  onClick={goToNextStep}
                  className="w-full h-12 text-base font-semibold bg-gradient-to-r from-primary to-accent-legal hover:from-primary/90 hover:to-accent-legal/90 transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  Continuar
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Telefone */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-fade-in">
              <div className="text-center space-y-2">
                <Phone className="w-16 h-16 mx-auto text-primary animate-bounce-soft" />
                <h3 className="text-xl font-semibold">Qual é o seu telefone?</h3>
                <p className="text-sm text-muted-foreground">Para manter contato com você</p>
              </div>
              <div className="space-y-4">
                <Input
                  type="tel"
                  value={formData.telefone}
                  onChange={(e) => setFormData(prev => ({ ...prev, telefone: e.target.value }))}
                  placeholder="(00) 00000-0000"
                  className="text-lg h-14 text-center bg-background/50 border-border/50 focus:border-primary/50 transition-all duration-300"
                  autoFocus
                  onKeyPress={(e) => e.key === 'Enter' && goToNextStep()}
                />
                <Button
                  onClick={goToNextStep}
                  className="w-full h-12 text-base font-semibold bg-gradient-to-r from-primary to-accent-legal hover:from-primary/90 hover:to-accent-legal/90 transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  Continuar
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button
                  onClick={() => setCurrentStep(1)}
                  variant="ghost"
                  className="w-full text-muted-foreground hover:text-foreground"
                >
                  Voltar
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Área de Interesse */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-fade-in">
              <div className="text-center space-y-2">
                <div className="flex justify-center gap-2">
                  {areas.map((area, index) => {
                    const Icon = area.icon;
                    return (
                      <Icon
                        key={area.value}
                        className="w-8 h-8 text-primary animate-bounce-soft"
                        style={{ animationDelay: `${index * 0.1}s` }}
                      />
                    );
                  })}
                </div>
                <h3 className="text-xl font-semibold">O que você pretende?</h3>
                <p className="text-sm text-muted-foreground">Escolha sua área de interesse</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {areas.map((area) => {
                  const Icon = area.icon;
                  return (
                    <Button
                      key={area.value}
                      onClick={() => handleAreaSelect(area.value)}
                      disabled={loading}
                      className={`h-32 flex flex-col gap-3 bg-gradient-to-br ${area.color} hover:opacity-90 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 text-white border-0`}
                    >
                      <Icon className="w-10 h-10" />
                      <span className="text-sm font-semibold text-center">{area.label}</span>
                    </Button>
                  );
                })}
              </div>
              <Button
                onClick={() => setCurrentStep(2)}
                variant="ghost"
                className="w-full text-muted-foreground hover:text-foreground"
                disabled={loading}
              >
                Voltar
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      <HelpButton />
    </div>
  );
};