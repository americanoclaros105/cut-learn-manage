import { Link } from 'react-router-dom';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

interface GroupsBreadcrumbProps {
  courseId: string;
  courseTitle: string;
  /** Group name; when absent the trail ends at "Grupos". */
  groupName?: string;
  groupId?: string;
  /** Extra last crumb, e.g. "Editar" or "Nuevo grupo". */
  leaf?: string;
}

/** Cursos › {curso} › Grupos › {grupo}. */
export const GroupsBreadcrumb = ({ courseId, courseTitle, groupName, groupId, leaf }: GroupsBreadcrumbProps) => {
  const groupsPath = `/admin/cursos/${courseId}/grupos`;
  const endsAtGroups = !groupName && !leaf;
  const endsAtGroup = !!groupName && !leaf;
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link to="/admin/cursos">Cursos</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link to={`/admin/cursos/${courseId}`} className="max-w-[12rem] truncate">
              {courseTitle}
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          {endsAtGroups ? (
            <BreadcrumbPage>Grupos</BreadcrumbPage>
          ) : (
            <BreadcrumbLink asChild>
              <Link to={groupsPath}>Grupos</Link>
            </BreadcrumbLink>
          )}
        </BreadcrumbItem>
        {groupName && (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              {endsAtGroup ? (
                <BreadcrumbPage>{groupName}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild>
                  <Link to={`${groupsPath}/${groupId}`}>{groupName}</Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </>
        )}
        {leaf && (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{leaf}</BreadcrumbPage>
            </BreadcrumbItem>
          </>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  );
};
