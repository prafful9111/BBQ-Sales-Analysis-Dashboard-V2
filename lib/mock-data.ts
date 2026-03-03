import { subDays, format, parseISO } from 'date-fns';

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
  communication_score: number;
  process_adherence_score: number;
  sales_skills_score: number;
}

const AGENTS_WITH_TLS = [
  { name: 'AdityaR', tl: 'Vikram Singh' },
  { name: 'ArfaR', tl: 'Vikram Singh' },
  { name: 'SumanK', tl: 'Priya Sharma' },
  { name: 'GazalaS', tl: 'Priya Sharma' },
  { name: 'SufiyanA', tl: 'Rahul Verma' },
  { name: 'Vidyashree', tl: 'Rahul Verma' },
  { name: 'SayedaS', tl: 'Anjali Gupta' },
  { name: 'KrishnaM', tl: 'Anjali Gupta' },
  { name: 'SurbhiJ', tl: 'Suresh Kumar' },
  { name: 'RichaP', tl: 'Suresh Kumar' }
];

const OUTLETS = [
  'Garia', 'Jaipur', 'Bangalore', 'Noida', 'Pune', 'Hyderabad', 'Chennai', 'Kolkata', 'Mumbai', 'Delhi'
];

const CATEGORIES = [
  'New Booking Related Call',
  'Existing Reservation',
  'Food Delivery & Takeaway',
  'Unrelated / Miscellaneous / Feedback'
];

export function generateMockData(): CallData[] {
  const data: CallData[] = [];
  const totalRows = 1126;
  const now = new Date();

  for (let i = 0; i < totalRows; i++) {
    const isExcellent = i < 510;
    const isGood = i >= 510 && i < 914;
    const isAverage = i >= 914 && i < 1064;
    
    let tag: 'Excellent' | 'Good' | 'Average' | 'Poor';
    let score: number;

    if (isExcellent) {
      tag = 'Excellent';
      score = Math.floor(Math.random() * 11) + 90;
    } else if (isGood) {
      tag = 'Good';
      score = Math.floor(Math.random() * 10) + 80;
    } else if (isAverage) {
      tag = 'Average';
      score = Math.floor(Math.random() * 20) + 60;
    } else {
      tag = 'Poor';
      score = Math.floor(Math.random() * 60);
    }

    const category = i < 1017 ? 'New Booking Related Call' : CATEGORIES[Math.floor(Math.random() * 3) + 1];
    const agentObj = AGENTS_WITH_TLS[Math.floor(Math.random() * AGENTS_WITH_TLS.length)];
    const outlet = OUTLETS[Math.floor(Math.random() * OUTLETS.length)];
    const callTime = subDays(now, Math.random() * 30); // Last 30 days for MoM/WoW
    const duration = Math.floor(Math.random() * (580 - 18 + 1)) + 18;
    const hasIssue = Math.random() < 0.04;
    
    const convertedRand = Math.random();
    const crs_booking_status = convertedRand > 0.6 ? 'Converted' : (convertedRand > 0.3 ? 'Non-Converted' : 'Pending');
    
    const intentRand = Math.random();
    const initial_intent_tag = intentRand > 0.7 ? 'High Intent' : (intentRand > 0.3 ? 'Medium Intent' : 'Low Intent');

    data.push({
      id: `call-${i}`,
      agent_username: agentObj.name,
      tl_name: agentObj.tl,
      outlet_location: outlet,
      call_duration: duration,
      call_time: format(callTime, 'yyyy-MM-dd HH:mm:ss'),
      final_score: score,
      final_score_tag: tag,
      call_category: category,
      major_language_clarity_or_technical_issue: hasIssue,
      lead_score: Math.floor(Math.random() * 101),
      booking_urgency: Math.random() > 0.7 ? 'High' : (Math.random() > 0.4 ? 'Medium' : 'Low'),
      crs_booking_status,
      initial_intent_tag,
      communication_score: Math.floor(Math.random() * 26),
      process_adherence_score: Math.floor(Math.random() * 41),
      sales_skills_score: Math.floor(Math.random() * 51),
    });
  }

  return data.sort((a, b) => parseISO(a.call_time).getTime() - parseISO(b.call_time).getTime());
}
