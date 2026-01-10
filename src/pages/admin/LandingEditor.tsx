import { useState, useEffect } from 'react';
import { getLandingContent, saveLandingContent } from '@/lib/storage';
import { LandingContent } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Save } from 'lucide-react';

export const LandingEditor = () => {
  const [content, setContent] = useState<LandingContent | null>(null);

  useEffect(() => {
    setContent(getLandingContent());
  }, []);

  const handleSave = () => {
    if (content) {
      saveLandingContent(content);
      toast.success('Cambios guardados correctamente');
    }
  };

  if (!content) return null;

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Editor de Landing</h1>
          <p className="text-muted-foreground">Personaliza el contenido de tu página principal</p>
        </div>
        <Button onClick={handleSave} className="gap-2">
          <Save className="w-4 h-4" />
          Guardar Cambios
        </Button>
      </div>

      <Tabs defaultValue="hero" className="space-y-6">
        <TabsList className="bg-secondary">
          <TabsTrigger value="hero">Hero</TabsTrigger>
          <TabsTrigger value="about">Nosotros</TabsTrigger>
          <TabsTrigger value="contact">Contacto</TabsTrigger>
          <TabsTrigger value="social">Redes</TabsTrigger>
        </TabsList>

        <TabsContent value="hero">
          <Card>
            <CardHeader>
              <CardTitle>Sección Hero</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Título</label>
                <Input
                  value={content.hero.title}
                  onChange={(e) =>
                    setContent({ ...content, hero: { ...content.hero, title: e.target.value } })
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium">Subtítulo</label>
                <Textarea
                  value={content.hero.subtitle}
                  onChange={(e) =>
                    setContent({ ...content, hero: { ...content.hero, subtitle: e.target.value } })
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium">Texto del Botón CTA</label>
                <Input
                  value={content.hero.ctaText}
                  onChange={(e) =>
                    setContent({ ...content, hero: { ...content.hero, ctaText: e.target.value } })
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium">URL de Imagen de Fondo</label>
                <Input
                  value={content.hero.backgroundImage}
                  onChange={(e) =>
                    setContent({
                      ...content,
                      hero: { ...content.hero, backgroundImage: e.target.value },
                    })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="about">
          <Card>
            <CardHeader>
              <CardTitle>Sección Nosotros</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Título</label>
                <Input
                  value={content.about.title}
                  onChange={(e) =>
                    setContent({ ...content, about: { ...content.about, title: e.target.value } })
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium">Descripción</label>
                <Textarea
                  value={content.about.description}
                  onChange={(e) =>
                    setContent({
                      ...content,
                      about: { ...content.about, description: e.target.value },
                    })
                  }
                  rows={4}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Misión</label>
                <Textarea
                  value={content.about.mission}
                  onChange={(e) =>
                    setContent({ ...content, about: { ...content.about, mission: e.target.value } })
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium">Visión</label>
                <Textarea
                  value={content.about.vision}
                  onChange={(e) =>
                    setContent({ ...content, about: { ...content.about, vision: e.target.value } })
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium">URL de Imagen</label>
                <Input
                  value={content.about.image}
                  onChange={(e) =>
                    setContent({ ...content, about: { ...content.about, image: e.target.value } })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contact">
          <Card>
            <CardHeader>
              <CardTitle>Información de Contacto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Teléfono</label>
                  <Input
                    value={content.contact.phone}
                    onChange={(e) =>
                      setContent({
                        ...content,
                        contact: { ...content.contact, phone: e.target.value },
                      })
                    }
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">WhatsApp (solo números)</label>
                  <Input
                    value={content.contact.whatsapp}
                    onChange={(e) =>
                      setContent({
                        ...content,
                        contact: { ...content.contact, whatsapp: e.target.value },
                      })
                    }
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Mensaje predefinido de WhatsApp</label>
                <Textarea
                  value={content.contact.whatsappMessage}
                  onChange={(e) =>
                    setContent({
                      ...content,
                      contact: { ...content.contact, whatsappMessage: e.target.value },
                    })
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium">Email</label>
                <Input
                  value={content.contact.email}
                  onChange={(e) =>
                    setContent({
                      ...content,
                      contact: { ...content.contact, email: e.target.value },
                    })
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium">Dirección</label>
                <Input
                  value={content.contact.address}
                  onChange={(e) =>
                    setContent({
                      ...content,
                      contact: { ...content.contact, address: e.target.value },
                    })
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium">Horarios</label>
                <Input
                  value={content.contact.hours}
                  onChange={(e) =>
                    setContent({
                      ...content,
                      contact: { ...content.contact, hours: e.target.value },
                    })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="social">
          <Card>
            <CardHeader>
              <CardTitle>Redes Sociales</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Instagram</label>
                <Input
                  value={content.socialLinks.instagram || ''}
                  onChange={(e) =>
                    setContent({
                      ...content,
                      socialLinks: { ...content.socialLinks, instagram: e.target.value },
                    })
                  }
                  placeholder="https://instagram.com/..."
                />
              </div>
              <div>
                <label className="text-sm font-medium">Facebook</label>
                <Input
                  value={content.socialLinks.facebook || ''}
                  onChange={(e) =>
                    setContent({
                      ...content,
                      socialLinks: { ...content.socialLinks, facebook: e.target.value },
                    })
                  }
                  placeholder="https://facebook.com/..."
                />
              </div>
              <div>
                <label className="text-sm font-medium">TikTok</label>
                <Input
                  value={content.socialLinks.tiktok || ''}
                  onChange={(e) =>
                    setContent({
                      ...content,
                      socialLinks: { ...content.socialLinks, tiktok: e.target.value },
                    })
                  }
                  placeholder="https://tiktok.com/..."
                />
              </div>
              <div>
                <label className="text-sm font-medium">YouTube</label>
                <Input
                  value={content.socialLinks.youtube || ''}
                  onChange={(e) =>
                    setContent({
                      ...content,
                      socialLinks: { ...content.socialLinks, youtube: e.target.value },
                    })
                  }
                  placeholder="https://youtube.com/..."
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};