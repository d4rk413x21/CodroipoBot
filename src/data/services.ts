import servicesJson from '../../data/services/services.json' with { type: 'json' };
import type { CivicService, ServiceFaq } from '../types/services.js';

const services = servicesJson as unknown as CivicService[];

export function listServices(): CivicService[] {
  return services;
}

export function findServiceById(serviceId: string): CivicService | undefined {
  return services.find((service) => service.id === serviceId);
}

export function getFaqsByService(serviceId: string): ServiceFaq[] {
  return findServiceById(serviceId)?.faqs ?? [];
}

export function searchFaqs(keyword: string): ServiceFaq[] {
  const lowerKeyword = keyword.toLowerCase();
  return services
    .flatMap((service) => service.faqs)
    .filter((faq) =>
      faq.question.toLowerCase().includes(lowerKeyword) ||
      faq.answer.toLowerCase().includes(lowerKeyword) ||
      faq.tags?.some((tag) => tag.toLowerCase().includes(lowerKeyword))
    );
}
