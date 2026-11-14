import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStudents, StudentProfile, CourseAssignment } from '@/hooks/useStudents';
import { useCourses } from '@/hooks/useCourses';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Plus, Users } from 'lucide-react';
import { StudentCard } from '@/components/admin/students/StudentCard';
import { StudentFilters } from '@/components/admin/students/StudentFilters';

export const StudentsManager = () => {
  const { data: students = [], isLoading: loadingStudents } = useStudents();
  const { data: courses = [], isLoading: loadingCourses } = useCourses();
  const navigate = useNavigate();

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [courseFilter, setCourseFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  // Filter and sort students
  const filteredStudents = useMemo(() => {
    let result = [...students];

    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(s => 
        s.name.toLowerCase().includes(searchLower) ||
        s.phone?.toLowerCase().includes(searchLower)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter(s => s.status === statusFilter);
    }

    // Course filter
    if (courseFilter === 'none') {
      result = result.filter(s => !s.assigned_courses || s.assigned_courses.length === 0);
    } else if (courseFilter !== 'all') {
      result = result.filter(s => 
        s.assigned_courses?.some((a: CourseAssignment) => a.course_id === courseFilter)
      );
    }

    // Sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'name-asc':
          return a.name.localeCompare(b.name);
        case 'name-desc':
          return b.name.localeCompare(a.name);
        case 'expires-soon':
          return new Date(a.expires_at).getTime() - new Date(b.expires_at).getTime();
        case 'newest':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

    return result;
  }, [students, search, statusFilter, courseFilter, sortBy]);

  const handleOpenCreate = () => navigate('/admin/estudiantes/nuevo');
  const handleOpen = (student: StudentProfile) => navigate(`/admin/estudiantes/${student.id}`);
  const handleOpenAccess = (student: StudentProfile) => navigate(`/admin/estudiantes/${student.id}?tab=acceso`);

  const publishedCourses = courses.filter(c => c.status === 'published');

  if (loadingStudents || loadingCourses) {
    return (
      <div className="p-4 md:p-8 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestión de Estudiantes</h1>
          <p className="text-muted-foreground">
            {students.length} estudiante{students.length !== 1 ? 's' : ''} registrado{students.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button onClick={handleOpenCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Estudiante
        </Button>
      </div>

      {/* Filters */}
      <div className="mb-6">
        <StudentFilters
          search={search}
          onSearchChange={setSearch}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          courseFilter={courseFilter}
          onCourseFilterChange={setCourseFilter}
          sortBy={sortBy}
          onSortByChange={setSortBy}
          courses={publishedCourses}
        />
      </div>

      {/* Students List */}
      <div className="grid gap-4">
        {filteredStudents.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="p-12 text-center">
              <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-medium mb-2">
                {students.length === 0 
                  ? 'No hay estudiantes registrados' 
                  : 'No se encontraron estudiantes'}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {students.length === 0 
                  ? 'Crea tu primer estudiante para comenzar' 
                  : 'Intenta ajustar los filtros de búsqueda'}
              </p>
              {students.length === 0 && (
                <Button onClick={handleOpenCreate}>
                  <Plus className="w-4 h-4 mr-2" />
                  Crear Estudiante
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          filteredStudents.map((student) => (
            <StudentCard
              key={student.id}
              student={student}
              courses={publishedCourses}
              onOpen={handleOpen}
              onEdit={handleOpen}
              onChangePassword={handleOpenAccess}
              onDelete={handleOpenAccess}
            />
          ))
        )}
      </div>
    </div>
  );
};
