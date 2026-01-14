import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Course } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, BookOpen, ChevronDown, ChevronUp, Filter, ArrowUpDown, Calendar, DollarSign } from 'lucide-react';
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
type SortOption = 'newest' | 'oldest' | 'price-low' | 'price-high';

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

const filterButtons: { value: LevelFilter; label: string; color: string }[] = [
  { value: 'all', label: 'Todos', color: 'primary' },
  { value: 'beginner', label: 'Principiante', color: 'emerald' },
  { value: 'intermediate', label: 'Intermedio', color: 'amber' },
  { value: 'advanced', label: 'Avanzado', color: 'rose' },
];

const sortOptions: { value: SortOption; label: string; icon: typeof Calendar }[] = [
  { value: 'newest', label: 'Más recientes', icon: Calendar },
  { value: 'oldest', label: 'Más antiguos', icon: Calendar },
  { value: 'price-low', label: 'Menor precio', icon: DollarSign },
  { value: 'price-high', label: 'Mayor precio', icon: DollarSign },
];

export const CoursesSection = ({ title, subtitle, courses, whatsapp }: CoursesSectionProps) => {
  const [expandedDescriptions, setExpandedDescriptions] = useState<Record<string, boolean>>({});
  const [showAllCourses, setShowAllCourses] = useState(false);
  const [levelFilter, setLevelFilter] = useState<LevelFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  
  const publishedCourses = courses.filter((c) => c.status === 'published');
  
  // Apply filter and sort
  const processedCourses = useMemo(() => {
    let result = levelFilter === 'all' 
      ? [...publishedCourses] 
      : publishedCourses.filter((c) => c.level === levelFilter);
    
    // Sort courses
    result.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        case 'oldest':
          return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
        case 'price-low':
          return a.price - b.price;
        case 'price-high':
          return b.price - a.price;
        default:
          return 0;
      }
    });
    
    return result;
  }, [publishedCourses, levelFilter, sortBy]);
  
  const displayedCourses = showAllCourses ? processedCourses : processedCourses.slice(0, 3);
  const hasMoreCourses = processedCourses.length > 3;

  const toggleDescription = (courseId: string) => {
    setExpandedDescriptions(prev => ({
      ...prev,
      [courseId]: !prev[courseId]
    }));
  };

  const getFilterButtonClasses = (filter: typeof filterButtons[0], isActive: boolean) => {
    if (!isActive) {
      return 'bg-card hover:bg-card/80 border-border text-foreground';
    }
    switch (filter.color) {
      case 'emerald':
        return 'bg-emerald-500 text-white border-emerald-500 shadow-md';
      case 'amber':
        return 'bg-amber-500 text-white border-amber-500 shadow-md';
      case 'rose':
        return 'bg-rose-500 text-white border-rose-500 shadow-md';
      default:
        return 'bg-primary text-primary-foreground border-primary shadow-md';
    }
  };

  const DESCRIPTION_LIMIT = 100;

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as const }
    },
    exit: { 
      opacity: 0, 
      y: -10, 
      scale: 0.95,
      transition: { duration: 0.3, ease: [0.55, 0.055, 0.675, 0.19] as const }
    }
  };

  return (
    <section id="courses" className="section-padding bg-accent text-accent-foreground">
      <div className="container-custom mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">{title}</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">{subtitle}</p>
        </div>

        {/* Filters and Sort Controls */}
        <div className="bg-card/50 backdrop-blur-sm rounded-xl p-4 mb-8 border border-border/50">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Level Filters */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2 text-muted-foreground mr-1">
                <Filter className="w-4 h-4" />
                <span className="text-sm font-medium">Nivel:</span>
              </div>
              {filterButtons.map((filter) => {
                const isActive = levelFilter === filter.value;
                const count = filter.value === 'all' 
                  ? publishedCourses.length 
                  : publishedCourses.filter(c => c.level === filter.value).length;
                
                return (
                  <Button
                    key={filter.value}
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setLevelFilter(filter.value);
                      setShowAllCourses(false);
                    }}
                    className={`transition-all duration-200 ${getFilterButtonClasses(filter, isActive)}`}
                  >
                    {filter.label}
                    <span className={`ml-1.5 text-xs ${isActive ? 'opacity-80' : 'opacity-60'}`}>
                      ({count})
                    </span>
                  </Button>
                );
              })}
            </div>

            {/* Sort Options */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2 text-muted-foreground mr-1">
                <ArrowUpDown className="w-4 h-4" />
                <span className="text-sm font-medium">Ordenar:</span>
              </div>
              {sortOptions.map((option) => {
                const isActive = sortBy === option.value;
                const Icon = option.icon;
                
                return (
                  <Button
                    key={option.value}
                    variant="outline"
                    size="sm"
                    onClick={() => setSortBy(option.value)}
                    className={`transition-all duration-200 ${
                      isActive 
                        ? 'bg-primary text-primary-foreground border-primary shadow-md' 
                        : 'bg-card hover:bg-card/80 border-border text-foreground'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 mr-1" />
                    {option.label}
                  </Button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Course Grid */}
        <motion.div 
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          key={`${levelFilter}-${sortBy}-${showAllCourses}`}
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
                  <Card className="bg-card border border-border/50 overflow-hidden group hover:shadow-2xl hover:border-primary/20 transition-all duration-300 flex flex-col h-full">
                    <div className="aspect-video overflow-hidden relative flex-shrink-0">
                      <img
                        src={course.coverImage}
                        alt={course.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                      <Badge className={`absolute top-4 left-4 ${levelColors[course.level]} font-semibold px-3 py-1`}>
                        {levelLabels[course.level]}
                      </Badge>
                    </div>
                    <CardContent className="p-6 flex flex-col flex-grow text-left">
                      <h3 className="text-xl font-bold text-card-foreground mb-3 line-clamp-2 leading-tight">
                        {course.title}
                      </h3>
                      
                      {/* Description */}
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
                              <>Ver menos <ChevronUp className="w-3 h-3" /></>
                            ) : (
                              <>Ver más <ChevronDown className="w-3 h-3" /></>
                            )}
                          </button>
                        )}
                      </div>

                      {/* Stats */}
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
                        className="w-full h-11 bg-green-600 hover:bg-green-700 text-white gap-2 mt-auto font-medium"
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

        {/* Empty state */}
        {processedCourses.length === 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <p className="text-muted-foreground text-lg">
              No hay cursos disponibles con estos filtros.
            </p>
          </motion.div>
        )}

        {/* Show more button */}
        {hasMoreCourses && (
          <motion.div 
            className="text-center mt-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <Button
              size="lg"
              onClick={() => setShowAllCourses(!showAllCourses)}
              className={`gap-2 font-medium transition-all ${
                showAllCourses 
                  ? 'bg-muted text-foreground hover:bg-muted/80' 
                  : 'bg-primary text-primary-foreground hover:bg-primary/90'
              }`}
            >
              {showAllCourses ? (
                <>Ver Menos <ChevronUp className="w-5 h-5" /></>
              ) : (
                <>Ver Todos los Cursos ({processedCourses.length}) <ChevronDown className="w-5 h-5" /></>
              )}
            </Button>
          </motion.div>
        )}
      </div>
    </section>
  );
};
