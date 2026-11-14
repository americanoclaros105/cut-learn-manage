import { toast } from 'sonner';
import { TransferGroupDialog } from '@/components/admin/groups/TransferGroupDialog';
import { useCourseGroups, useTransferEnrollmentGroup } from '@/hooks/useCourseGroups';
import { groupErrorMessage } from '@/lib/groups';
import { transferOptions } from '@/lib/groupViews';
import type { StudentEnrollmentRow } from '@/lib/studentDetail';

interface ChangeGroupDialogProps {
  studentName: string;
  /** Enrollment being moved; the dialog is closed while null. */
  row: StudentEnrollmentRow | null;
  currentGroupName: string | null;
  onClose: () => void;
}

/** Container: loads the course groups and moves the enrollment with `transfer_enrollment_group`. */
export const ChangeGroupDialog = ({ studentName, row, currentGroupName, onClose }: ChangeGroupDialogProps) => {
  const courseId = row?.enrollment.course_id ?? '';
  const groups = useCourseGroups(courseId);
  const transfer = useTransferEnrollmentGroup();

  return (
    <TransferGroupDialog
      open={!!row}
      onOpenChange={(open) => !open && onClose()}
      studentNames={[studentName]}
      fromGroupName={currentGroupName}
      options={transferOptions(groups.data ?? [], row?.enrollment.group_id ?? null)}
      submitting={transfer.isPending}
      onConfirm={async (groupId) => {
        if (!row) return;
        try {
          await transfer.mutateAsync({ enrollmentId: row.enrollment.id, courseId, groupId });
          toast.success('Grupo actualizado');
          onClose();
        } catch (e) {
          toast.error(groupErrorMessage(e));
        }
      }}
    />
  );
};
