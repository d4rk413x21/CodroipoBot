export interface ServiceContact {
  phone?: string;
  email?: string;
  office?: string;
  address?: string;
  bookingUrl?: string;
}

export interface ServiceFaq {
  question: string;
  answer: string;
  tags?: string[];
}

export interface ServiceDocumentRequirement {
  name: string;
  description: string;
  mandatory: boolean;
}

export interface ServiceProcedureStep {
  title: string;
  description: string;
}

export interface CivicService {
  id: string;
  name: string;
  category: string;
  summary: string;
  department: string;
  officeHours: string[];
  contact: ServiceContact;
  procedures: ServiceProcedureStep[];
  requiredDocuments: ServiceDocumentRequirement[];
  faqs: ServiceFaq[];
  bookingNotes?: string;
}

export interface AppointmentSlot {
  start: string;
  end: string;
}

export interface AppointmentRequestBody {
  serviceId: string;
  citizenName: string;
  citizenEmail: string;
  citizenPhone?: string | undefined;
  preferredDate: string;
  preferredSlot: AppointmentSlot;
  notes?: string | undefined;
}

export interface AppointmentConfirmation {
  id: string;
  serviceId: string;
  summary: string;
  start: string;
  end: string;
  calendarEventId?: string;
  notifications: string[];
}
