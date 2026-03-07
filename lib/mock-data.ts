import { parseISO } from 'date-fns';

export interface CallData {
  id: string;
  agent_username: string;
  tl_name: string;
  outlet_location: string;
  call_duration: number;
  call_time: string;
  final_score: number;
  final_score_tag: 'Excellent' | 'Good' | 'Average' | 'Poor';
  call_category: string;
  major_language_clarity_or_technical_issue: boolean;
  lead_score: number;
  booking_urgency: 'High' | 'Medium' | 'Low';
  crs_booking_status: 'Converted' | 'Non-Converted' | 'Pending';
  initial_intent_tag: 'High Intent' | 'Medium Intent' | 'Low Intent';
  customer_experience_score: number;
  communication_score: number;
  sales_strategy_score: number;
  coaching_feedback: string[];
  department?: 'Food & Beverages' | 'Ambience & Hygiene' | 'Booking & Billing' | 'Staff & Service';
  conversation_summary: string;
  key_highlights: string[];
  areas_of_improvement: string[];
}

export async function fetchCallData(): Promise<CallData[]> {
  try {
    const res = await fetch('/sales_data.json');
    if (!res.ok) throw new Error('Failed to fetch data');
    const rawData = await res.json();

    return rawData.map((row: any) => {
      // Parse nested JSON strings safely
      const transcript = row.transcription ? JSON.parse(row.transcription) : {};
      const analysis = row.analysis ? JSON.parse(row.analysis) : {};
      const intent = row.analysis_intent ? JSON.parse(row.analysis_intent) : {};

      // Parse the scores from formats like "25/25"
      const customer_experience_score = parseInt(row.communication_score?.toString().split('/')[0] || '0');
      const communication_score = parseInt(row.process_adherence_score?.toString().split('/')[0] || '0');
      const sales_strategy_score = parseInt(row.sales_skills_score?.toString().split('/')[0] || '0');

      // Map TL safely
      const tl_name = row.tl_name || 'Vikram Singh'; // fallback if empty

      // Determine department (mocking somewhat since not present in JSON natively, default to Booking)
      const department: CallData['department'] = 'Booking & Billing';

      // Parse urgency
      let booking_urgency: 'High' | 'Medium' | 'Low' = 'Medium';
      if (row.booking_urgency) {
        booking_urgency = row.booking_urgency as 'High' | 'Medium' | 'Low';
      } else if (intent.intent_analysis?.initial_intent_tag) {
        if (intent.intent_analysis.initial_intent_tag.includes('High')) booking_urgency = 'High';
        if (intent.intent_analysis.initial_intent_tag.includes('Low')) booking_urgency = 'Low';
      }

      // Initial Intent
      const initial_intent_tag = intent.intent_analysis?.initial_intent_tag || 'Medium Intent';

      // Coaching feedback array (keeping for raw data compatibility, but merging for display)
      const coaching_feedback = analysis.coaching_feedback ? [analysis.coaching_feedback] : [];

      // Highlights and areas of improvement
      const conversation_summary = intent.intent_analysis?.intent_transition_summary || '';
      const key_highlights = intent.retargeting_and_conversion_strategy?.retargeting_efforts?.map((e: any) => e.tag) || [];

      const areas_of_improvement: string[] = [];
      if (analysis.elite_improvement_suggestions) areas_of_improvement.push(analysis.elite_improvement_suggestions);
      if (analysis.coaching_feedback) areas_of_improvement.push(analysis.coaching_feedback);

      // Infer outlet from the transcript text as a fallback
      let outlet = row.outlet_location;
      if (!outlet) {
        const text = transcript.transcript_text || '';
        if (text.includes('Chandigarh')) outlet = 'Chandigarh';
        else if (text.includes('Noida')) outlet = 'Noida';
        else if (text.includes('Thane')) outlet = 'Thane';
        else if (text.includes('Muzaffarpur')) outlet = 'Muzaffarpur';
        else if (text.includes('Worli') || text.includes('Mumbai')) outlet = 'Mumbai';
        else outlet = 'Unknown';
      }

      return {
        id: row.id || Math.random().toString(),
        agent_username: row.agent_username || 'Unknown',
        tl_name,
        outlet_location: outlet,
        call_duration: parseInt(row.call_duration?.toString() || '0'),
        call_time: row.call_time || new Date().toISOString(),
        final_score: parseInt(row.final_score?.toString() || '0'),
        final_score_tag: (row.final_score_tag as 'Excellent' | 'Good' | 'Average' | 'Poor') || 'Average',
        call_category: row.call_category || transcript.call_category || 'New Booking Related Call',
        major_language_clarity_or_technical_issue: row.major_language_clarity_or_technical_issue || transcript.major_language_clarity_or_technical_issue || false,
        lead_score: parseFloat(row.lead_score?.toString() || '0'),
        booking_urgency,
        crs_booking_status: (row.crs_booking_status as 'Converted' | 'Non-Converted' | 'Pending') || intent.intent_analysis?.final_intent_status || 'Pending',
        initial_intent_tag,
        customer_experience_score: isNaN(customer_experience_score) ? 0 : customer_experience_score,
        communication_score: isNaN(communication_score) ? 0 : communication_score,
        sales_strategy_score: isNaN(sales_strategy_score) ? 0 : sales_strategy_score,
        coaching_feedback,
        department,
        conversation_summary,
        key_highlights,
        areas_of_improvement
      };
    });
  } catch (error) {
    console.error('Error fetching real data:', error);
    return [];
  }
}
