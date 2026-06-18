import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useRealtimeAttendance(sessionId: string) {
  const [records, setRecords] = useState<any[]>([])
  const [count, setCount] = useState(0)

  const fetchRecords = useCallback(async () => {
    const { data } = await supabase
      .from('attendance_records')
      .select('*, students(student_number, full_name, email)')
      .eq('session_id', sessionId)
      .order('attendance_time', { ascending: false })

    setRecords(data || [])
    setCount(data?.length || 0)
  }, [sessionId])

  useEffect(() => {
    fetchRecords()

    const channel = supabase
      .channel(`attendance_${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'attendance_records',
          filter: `session_id=eq.${sessionId}`,
        },
        () => { fetchRecords() }
      )
      .subscribe()

    return () => { channel.unsubscribe() }
  }, [fetchRecords, sessionId])

  return { records, count, refetch: fetchRecords }
}
