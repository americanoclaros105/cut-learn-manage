import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { PaymentMethod } from '@/types';
import { invalidateOperations, operationsKeys } from './operationsQueries';

export interface PaymentRecord {
  id: string;
  enrollment_id: string | null;
  user_id: string | null;
  course_id: string | null;
  student_name: string | null;
  course_title: string | null;
  amount: number;
  method: PaymentMethod;
  paid_at: string;
  reference: string | null;
  notes: string | null;
  created_at: string;
  created_by: string | null;
  voided_at: string | null;
  voided_by: string | null;
  void_reason: string | null;
}

export const toPaymentRecord = (p: object): PaymentRecord => {
  const row = p as PaymentRecord;
  return { ...row, amount: Number(row.amount) };
};

/** Full ledger of a single enrollment, voided payments included (newest first). */
export const useEnrollmentPayments = (enrollmentId: string | null) =>
  useQuery({
    queryKey: operationsKeys.enrollmentPayments(enrollmentId ?? ''),
    enabled: !!enrollmentId,
    queryFn: async (): Promise<PaymentRecord[]> => {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('enrollment_id', enrollmentId as string)
        .order('paid_at', { ascending: false })
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map(toPaymentRecord);
    },
  });

export interface CreatePaymentInput {
  enrollmentId: string;
  courseId?: string | null;
  amount: number;
  method: PaymentMethod;
  paidAt: string;
  reference?: string;
  notes?: string;
  /** Status of the enrollment before the payment, to detect an automatic activation. */
  statusBefore?: string;
}

/** Registers a payment. `activated` is true when the DB flipped the enrollment to active. */
export const useCreatePayment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreatePaymentInput) => {
      const { error } = await supabase.from('payments').insert({
        enrollment_id: input.enrollmentId,
        amount: input.amount,
        method: input.method,
        paid_at: input.paidAt,
        reference: input.reference?.trim() || null,
        notes: input.notes?.trim() || null,
      });
      if (error) throw error;

      const { data, error: readError } = await supabase
        .from('user_course_assignments')
        .select('status')
        .eq('id', input.enrollmentId)
        .single();
      if (readError) throw readError;
      return { activated: input.statusBefore !== 'active' && data.status === 'active' };
    },
    onSuccess: (_result, { courseId }) => invalidateOperations(queryClient, courseId),
  });
};

export interface VoidPaymentInput {
  paymentId: string;
  reason: string;
  courseId?: string | null;
}

/** Payments are never deleted: voiding keeps the row with who/when/why. */
export const useVoidPayment = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ paymentId, reason }: VoidPaymentInput) => {
      const { error } = await supabase
        .from('payments')
        .update({ voided_at: new Date().toISOString(), voided_by: user?.id ?? null, void_reason: reason.trim() })
        .eq('id', paymentId);
      if (error) throw error;
    },
    onSuccess: (_r, { courseId }) => invalidateOperations(queryClient, courseId),
  });
};
