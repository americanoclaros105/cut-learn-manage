import { Navigate, useParams } from 'react-router-dom';

/** The old course roster route now lives in the groups hub. */
export const LegacyGroupRedirect = () => {
  const { courseId = '' } = useParams<{ courseId: string }>();
  return <Navigate to={`/admin/cursos/${courseId}/grupos`} replace />;
};
