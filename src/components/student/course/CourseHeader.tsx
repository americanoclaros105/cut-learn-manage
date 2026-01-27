import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Clock, BookOpen, Award, ChevronDown, ChevronUp } from 'lucide-react';
import { Course } from '@/hooks/useCourses';
import { useState } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface CourseHeaderProps {
  course: Course;
  progressPercentage: number;
  totalLessons: number;
  completedCount: number;
}

export const CourseHeader = ({
  course,
  progressPercentage,
  totalLessons,
  completedCount,
}: CourseHeaderProps) => {
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-b">
      <div className="p-3 lg:p-4">
        {/* Compact Header - Always visible */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/estudiante')}
            className="shrink-0 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>

          {/* Course Cover - Small */}
          {course.cover_image && (
            <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-lg overflow-hidden shadow flex-shrink-0">
              <img
                src={course.cover_image}
                alt={course.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className="flex-1 min-w-0">
            <h1 className="text-sm lg:text-base font-semibold text-foreground truncate">
              {course.title}
            </h1>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{completedCount}/{totalLessons} lecciones</span>
              <span>•</span>
              <span className="font-medium text-primary">{progressPercentage}%</span>
            </div>
          </div>

          {/* Progress bar - compact */}
          <div className="hidden sm:flex items-center gap-2 w-32">
            <Progress value={progressPercentage} className="h-2" />
          </div>

          {/* Expand button - mobile/tablet */}
          <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden shrink-0">
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </Button>
            </CollapsibleTrigger>
          </Collapsible>
        </div>

        {/* Expanded Details - Desktop always visible, mobile collapsible */}
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <div className="hidden lg:block mt-3 pl-[52px]">
            <ExpandedContent 
              course={course} 
              totalLessons={totalLessons} 
              completedCount={completedCount} 
            />
          </div>
          
          <CollapsibleContent className="lg:hidden">
            <div className="mt-3 pl-[52px]">
              <ExpandedContent 
                course={course} 
                totalLessons={totalLessons} 
                completedCount={completedCount} 
              />
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  );
};

const ExpandedContent = ({ 
  course, 
  totalLessons, 
  completedCount 
}: { 
  course: Course; 
  totalLessons: number; 
  completedCount: number;
}) => (
  <>
    <div className="flex flex-wrap items-center gap-2 mb-2">
      <Badge variant="secondary" className="text-xs">
        {course.level === 'beginner'
          ? 'Principiante'
          : course.level === 'intermediate'
          ? 'Intermedio'
          : 'Avanzado'}
      </Badge>
      {course.category && (
        <Badge variant="outline" className="text-xs">{course.category}</Badge>
      )}
    </div>

    {course.description && (
      <p className="text-muted-foreground text-xs line-clamp-2 mb-2">
        {course.description}
      </p>
    )}

    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
      {course.duration && (
        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          <span>{course.duration}</span>
        </div>
      )}
      <div className="flex items-center gap-1">
        <BookOpen className="w-3 h-3" />
        <span>{totalLessons} lecciones</span>
      </div>
      <div className="flex items-center gap-1">
        <Award className="w-3 h-3" />
        <span>{completedCount} completadas</span>
      </div>
    </div>
  </>
);
