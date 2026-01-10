import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCourseWithModules, useCreateCourse, useUpdateCourse, Course } from '@/hooks/useCourses';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { ArrowLeft, Save, Loader2, BookOpen, Image, Palette, Layers } from 'lucide-react';
import { FileUploader } from '@/components/admin/FileUploader';

// HSL conversion helpers
const hslToHex = (hsl: string): string => {
  try {
    const [h, s, l] = hsl.split(' ').map((v, i) => {
      const num = parseFloat(v.replace('%', ''));
      return i === 0 ? num : num / 100;
    });
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = l - c / 2;
    let r = 0, g = 0, b = 0;
    if (h >= 0 && h < 60) { r = c; g = x; b = 0; }
    else if (h >= 60 && h < 120) { r = x; g = c; b = 0; }
    else if (h >= 120 && h < 180) { r = 0; g = c; b = x; }
    else if (h >= 180 && h < 240) { r = 0; g = x; b = c; }
    else if (h >= 240 && h < 300) { r = x; g = 0; b = c; }
    else { r = c; g = 0; b = x; }
    const toHex = (n: number) => {
      const hex = Math.round((n + m) * 255).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  } catch { return '#dc2626'; }
};

const hexToHsl = (hex: string): string => {
  try {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return '0 72% 51%';
    let r = parseInt(result[1], 16) / 255;
    let g = parseInt(result[2], 16) / 255;
    let b = parseInt(result[3], 16) / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0;
    const l = (max + min) / 2;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }
    return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
  } catch { return '0 72% 51%'; }
};
import { ModulesEditor } from '@/components/admin/courses/ModulesEditor';

interface CourseTheme {
  primary: string;
  accent: string;
  background: string;
}

const defaultTheme: CourseTheme = {
  primary: '0 72% 51%',
  accent: '0 0% 10%',
  background: '0 0% 100%',
};

export const CourseEditor = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const isEditing = !!courseId;

  const { data: existingCourse, isLoading: loadingCourse } = useCourseWithModules(courseId || '');
  const createCourse = useCreateCourse();
  const updateCourse = useUpdateCourse();

  const [course, setCourse] = useState<Partial<Course>>({
    title: '',
    description: '',
    cover_image: '',
    duration: '',
    level: 'beginner',
    price: 0,
    status: 'draft',
    category: '',
    tags: [],
  });
  const [theme, setTheme] = useState<CourseTheme>(defaultTheme);
  const [activeTab, setActiveTab] = useState('general');

  useEffect(() => {
    if (existingCourse) {
      setCourse(existingCourse);
      if ((existingCourse as any).theme_colors) {
        setTheme((existingCourse as any).theme_colors);
      }
    }
  }, [existingCourse]);

  const handleSave = async () => {
    if (!course.title?.trim()) {
      toast.error('El título es requerido');
      return;
    }

    try {
      const courseData = {
        ...course,
        theme_colors: theme,
      };

      if (isEditing && courseId) {
        await updateCourse.mutateAsync({ id: courseId, ...courseData } as any);
        toast.success('Curso actualizado');
      } else {
        const newCourse = await createCourse.mutateAsync(courseData as any);
        toast.success('Curso creado');
        // Navigate to edit mode for the new course
        navigate(`/admin/cursos/${newCourse.id}`);
      }
    } catch (error) {
      toast.error('Error al guardar el curso');
    }
  };

  const handleThemeChange = (key: keyof CourseTheme, value: string) => {
    setTheme((prev) => ({ ...prev, [key]: value }));
  };

  if (loadingCourse && isEditing) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin/cursos')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              {isEditing ? 'Editar Curso' : 'Nuevo Curso'}
            </h1>
            <p className="text-muted-foreground">
              {isEditing
                ? 'Modifica el contenido y estructura del curso'
                : 'Crea un nuevo curso con módulos y lecciones'}
            </p>
          </div>
        </div>
        <Button
          onClick={handleSave}
          disabled={createCourse.isPending || updateCourse.isPending}
          className="gap-2"
        >
          {(createCourse.isPending || updateCourse.isPending) ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          Guardar Curso
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 mb-8">
          <TabsTrigger value="general" className="gap-2">
            <BookOpen className="w-4 h-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="cover" className="gap-2">
            <Image className="w-4 h-4" />
            Portada
          </TabsTrigger>
          <TabsTrigger value="theme" className="gap-2">
            <Palette className="w-4 h-4" />
            Tema
          </TabsTrigger>
          <TabsTrigger value="content" className="gap-2" disabled={!isEditing}>
            <Layers className="w-4 h-4" />
            Contenido
          </TabsTrigger>
        </TabsList>

        {/* General Tab */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>Información General</CardTitle>
              <CardDescription>
                Datos básicos del curso que verán los estudiantes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Título *</label>
                  <Input
                    value={course.title || ''}
                    onChange={(e) => setCourse({ ...course, title: e.target.value })}
                    placeholder="Nombre del curso"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Categoría</label>
                  <Input
                    value={course.category || ''}
                    onChange={(e) => setCourse({ ...course, category: e.target.value })}
                    placeholder="ej: Maquillaje, Uñas, etc."
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Descripción</label>
                <Textarea
                  value={course.description || ''}
                  onChange={(e) => setCourse({ ...course, description: e.target.value })}
                  placeholder="Describe el contenido y objetivos del curso..."
                  rows={4}
                />
              </div>

              <div className="grid md:grid-cols-4 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Nivel</label>
                  <Select
                    value={course.level || 'beginner'}
                    onValueChange={(value: 'beginner' | 'intermediate' | 'advanced') =>
                      setCourse({ ...course, level: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Principiante</SelectItem>
                      <SelectItem value="intermediate">Intermedio</SelectItem>
                      <SelectItem value="advanced">Avanzado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Estado</label>
                  <Select
                    value={course.status || 'draft'}
                    onValueChange={(value: 'published' | 'draft' | 'archived') =>
                      setCourse({ ...course, status: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Borrador</SelectItem>
                      <SelectItem value="published">Publicado</SelectItem>
                      <SelectItem value="archived">Archivado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Duración</label>
                  <Input
                    value={course.duration || ''}
                    onChange={(e) => setCourse({ ...course, duration: e.target.value })}
                    placeholder="ej: 8 horas"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Precio ($)</label>
                  <Input
                    type="number"
                    value={course.price || 0}
                    onChange={(e) => setCourse({ ...course, price: parseFloat(e.target.value) || 0 })}
                    min={0}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Etiquetas</label>
                <Input
                  value={(course.tags || []).join(', ')}
                  onChange={(e) =>
                    setCourse({
                      ...course,
                      tags: e.target.value.split(',').map((t) => t.trim()).filter(Boolean),
                    })
                  }
                  placeholder="Separadas por comas: técnica, profesional, básico"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cover Tab */}
        <TabsContent value="cover">
          <Card>
            <CardHeader>
              <CardTitle>Imagen de Portada</CardTitle>
              <CardDescription>
                Esta imagen se mostrará en la lista de cursos y en la página del curso
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FileUploader
                value={course.cover_image || ''}
                onChange={(url) => setCourse({ ...course, cover_image: url })}
                contentType="image"
                courseId={courseId}
                placeholder="Portada del curso"
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Theme Tab */}
        <TabsContent value="theme">
          <Card>
            <CardHeader>
              <CardTitle>Personalización del Tema</CardTitle>
              <CardDescription>
                Colores personalizados para este curso (se aplicarán en el visor del curso)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Color Primario</label>
                  <input
                    type="color"
                    value={hslToHex(theme.primary)}
                    onChange={(e) => handleThemeChange('primary', hexToHsl(e.target.value))}
                    className="w-full h-10 rounded-lg border cursor-pointer"
                  />
                  <p className="text-xs text-muted-foreground">
                    Botones, enlaces y elementos destacados
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Color de Acento</label>
                  <input
                    type="color"
                    value={hslToHex(theme.accent)}
                    onChange={(e) => handleThemeChange('accent', hexToHsl(e.target.value))}
                    className="w-full h-10 rounded-lg border cursor-pointer"
                  />
                  <p className="text-xs text-muted-foreground">
                    Elementos secundarios y hover
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Color de Fondo</label>
                  <input
                    type="color"
                    value={hslToHex(theme.background)}
                    onChange={(e) => handleThemeChange('background', hexToHsl(e.target.value))}
                    className="w-full h-10 rounded-lg border cursor-pointer"
                  />
                  <p className="text-xs text-muted-foreground">
                    Fondo general del visor del curso
                  </p>
                </div>
              </div>

              {/* Preview */}
              <div className="mt-8">
                <h4 className="text-sm font-medium mb-3">Vista Previa</h4>
                <div
                  className="rounded-lg border p-6"
                  style={{ backgroundColor: `hsl(${theme.background})` }}
                >
                  <h3
                    className="text-lg font-semibold mb-2"
                    style={{ color: `hsl(${theme.accent})` }}
                  >
                    {course.title || 'Título del Curso'}
                  </h3>
                  <p className="text-sm mb-4" style={{ color: `hsl(${theme.accent} / 0.7)` }}>
                    {course.description || 'Descripción del curso...'}
                  </p>
                  <button
                    className="px-4 py-2 rounded-lg text-sm font-medium"
                    style={{
                      backgroundColor: `hsl(${theme.primary})`,
                      color: 'white',
                    }}
                  >
                    Comenzar Curso
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Content Tab */}
        <TabsContent value="content">
          {isEditing && courseId ? (
            <ModulesEditor courseId={courseId} modules={existingCourse?.modules || []} />
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Layers className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Guarda el curso primero para agregar módulos y lecciones
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
