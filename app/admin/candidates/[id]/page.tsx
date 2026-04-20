import { createServiceClient } from '@/lib/supabase'
import CandidateForm from '@/components/CandidateForm'
import { notFound } from 'next/navigation'

export default async function EditCandidate({ params }: { params: { id: string } }) {
  const supabase = createServiceClient()
  const { data } = await supabase.from('candidates').select('*').eq('id', params.id).single()
  if (!data) notFound()
  return <CandidateForm mode="edit" candidate={data} />
}
