import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Course } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, BookOpen, ChevronDown, ChevronUp, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { openWhatsApp } from '@/lib/whatsapp';

interface CourseWithStats extends Course {
  lessonCount?: number;
}

interface CoursesSectionProps {
  title: string;
  subtitle: string;
  courses: CourseWithStats[];
  whatsapp: string;
}

type LevelFilter = 'all' | 'beginner' | 'intermediate' | 'advanced';

const levelColors = {
  beginner: 'bg-emerald-500 text-white border-emerald-600 shadow-lg shadow-emerald-500/30',
  intermediate: 'bg-amber-500 text-white border-amber-600 shadow-lg shadow-amber-500/30',
  advanced: 'bg-rose-500 text-white border-rose-600 shadow-lg shadow-rose-500/30',
};

const levelLabels = {
  beginner: 'Principiante',
  intermediate: 'Intermedio',
  advanced: 'Avanzado',
};

const filterButtons: { value: LevelFilter; label: string; activeClass: string }[] = [
  { value: 'all', label: 'Todos', activeClass: 'bg-primary text-primary-foreground' },
  { value: 'beginner', label: 'Principiante', activeClass: 'bg-emerald-500 text-white' },
  { value: 'intermediate', label: 'Intermedio', activeClass: 'bg-amber-500 text-white' },
  { value: 'advanced', label: 'Avanzado', activeClass: 'bg-rose-500 text-white' },
];

export const CoursesSection = ({ title, subtitle, courses, whatsapp }: CoursesSectionProps) => {
  const navigate = useNavigate();
  const [expandedDescriptions, setExpandedDescriptions] = useState<Record<string, boolean>>({});
  const [showAllCourses, setShowAllCourses] = useState(false);
  const [levelFilter, setLevelFilter] = useState<LevelFilter>('all');
  
  const publishedCourses = courses.filter((c) => c.status === 'published');
  
  // Apply level filter
  const filteredCourses = levelFilter === 'all' 
    ? publishedCourses 
    : publishedCourses.filter((c) => c.level === levelFilter);
  
  const displayedCourses = showAllCourses ? filteredCourses : filteredCourses.slice(0, 3);
  const hasMoreCourses = filteredCourses.length > 3;

  const toggleDescription = (courseId: string) => {
    setExpandedDescriptions(prev => ({
      ...prev,
      [courseId]: !prev[courseId]
    }));
  };

  const DESCRIPTION_LIMIT = 100;

  // Animation variants
  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const cardVariants = {
    hidden: { 
      opacity: 0, 
      y: 20,
      scale: 0.95
    },
    visible: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      transition: {
        duration: 0.4,
        ease: [0.25, 0.46, 0.45, 0.94] as const
      }
    },
    exit: { 
      opacity: 0, 
      y: -10,
      scale: 0.95,
      transition: {
        duration: 0.3,
        ease: [0.55, 0.055, 0.675, 0.19] as const
      }
    }
  };

  return (
    <section id="courses" className="section-padding bg-accent text-accent-foreground">
      <div className="container-custom mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">{title}</h2>
          <p className="text-accent-foreground/70 max-w-2xl mx-auto">{subtitle}</p>
        </div>

        {/* Level Filters */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          <div className="flex items-center gap-2 mr-2 text-muted-foreground">
            <Filter className="w-4 h-4" />
            <span className="text-sm font-medium hidden sm:inline">Filtrar:</span>
          </div>
          {filterButtons.map((filter) => (
            <Button
              key={filter.value}
              variant="outline"
              size="sm"
              onClick={() => {
                setLevelFilter(filter.value);
                setShowAllCourses(false);
              }}
              className={`transition-all duration-300 ${
                levelFilter === filter.value 
                  ? filter.activeClass + ' border-transparent shadow-md' 
                  : 'bg-card/50 hover:bg-card border-border'
              }`}
            >
              {filter.label}
              {filter.value !== 'all' && (
                <span className="ml-1.5 text-xs opacity-70">
                  ({publishedCourses.filter(c => c.level === filter.value).length})
                </span>
              )}
            </Button>
          ))}
        </div>

        <motion.div 
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          key={`${levelFilter}-${showAllCourses}`}
        >
          <AnimatePresence mode="popLayout">
            {displayedCourses.map((course) => {
              const isExpanded = expandedDescriptions[course.id];
              const isLongDescription = course.description.length > DESCRIPTION_LIMIT;

              return (
                <motion.div
                  key={course.id}
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  layout
                >
                  <Card className="bg-card border-0 overflow-hidden group hover:shadow-2xl transition-all duration-300 flex flex-col h-full">
                    <div className="aspect-video overflow-hidden relative flex-shrink-0">
                      <img
                        src={course.coverImage}
                        alt={course.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                      <Badge className={`absolute top-4 left-4 ${levelColors[course.level]} font-semibold px-3 py-1`}>
                        {levelLabels[course.level]}
                      </Badge>
                    </div>
                    <CardContent className="p-6 flex flex-col flex-grow text-left">
                      <h3 className="text-xl font-bold text-card-foreground mb-3 line-clamp-2 leading-tight">
                        {course.title}
                      </h3>
                      
                      {/* Description with expand/collapse */}
                      <div className="mb-4">
                        <p className={`text-muted-foreground text-sm leading-relaxed ${!isExpanded && isLongDescription ? 'line-clamp-2' : ''}`}>
                          {course.description}
                        </p>
                        {isLongDescription && (
                          <button 
                            onClick={() => toggleDescription(course.id)}
                            className="text-primary text-sm font-medium hover:underline mt-2 flex items-center gap-1 transition-colors"
                          >
                            {isExpanded ? (
                              <>
                                Ver menos <ChevronUp className="w-3 h-3" />
                              </>
                            ) : (
                              <>
                                Ver más <ChevronDown className="w-3 h-3" />
                              </>
                            )}
                          </button>
                        )}
                      </div>

                      {/* Stats: duration and lessons */}
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                        {course.duration && (
                          <span className="flex items-center gap-1.5">
                            <Clock className="w-4 h-4 text-primary" />
                            {course.duration}
                          </span>
                        )}
                        <span className="flex items-center gap-1.5">
                          <BookOpen className="w-4 h-4 text-primary" />
                          {course.lessonCount || 0} lecciones
                        </span>
                      </div>

                      {/* Price */}
                      <div className="mb-4">
                        {course.price > 0 ? (
                          <span className="text-2xl font-bold text-primary">${course.price}</span>
                        ) : (
                          <span className="text-xl font-bold text-rose-500 bg-rose-500/10 px-3 py-1 rounded-full uppercase tracking-wide">
                            ¡Gratis!
                          </span>
                        )}
                      </div>

                      <Button
                        onClick={() => openWhatsApp(whatsapp, course.title, 'curso')}
                        className="w-full h-11 bg-green-500 hover:bg-green-600 text-white gap-2 mt-auto"
                      >
                        <i className="fab fa-whatsapp text-lg" />
                        Inscribirme
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>

        {/* Empty state when no courses match filter */}
        {filteredCourses.length === 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <p className="text-muted-foreground text-lg">
              No hay cursos disponibles en este nivel.
            </p>
          </motion.div>
        )}

        {hasMoreCourses && (
          <motion.div 
            className="text-center mt-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <Button
              size="lg"
              variant="outline"
              onClick={() => setShowAllCourses(!showAllCourses)}
              className="gap-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-all"
            >
              {showAllCourses ? (
                <>
                  Ver Menos <ChevronUp className="w-5 h-5" />
                </>
              ) : (
                <>
                  Ver Todos los Cursos ({filteredCourses.length}) <ChevronDown className="w-5 h-5" />
                </>
              )}
            </Button>
          </motion.div>
        )}
      </div>
    </section>
  );
};
