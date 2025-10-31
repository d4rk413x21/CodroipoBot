import { findServiceById, listServices, searchFaqs } from '../data/services.js';
import type { CivicService, ServiceFaq } from '../types/services.js';

function scoreFaqMatch(question: string, faq: ServiceFaq) {
  const questionTerms = question.toLowerCase().split(/\W+/).filter(Boolean);
  const answerText = `${faq.question} ${faq.answer}`.toLowerCase();

  let score = 0;

  for (const term of questionTerms) {
    if (answerText.includes(term)) {
      score += 1;
    }
  }

  if (faq.tags) {
    for (const term of questionTerms) {
      if (faq.tags.some((tag) => tag.toLowerCase() === term)) {
        score += 2;
      }
    }
  }

  return score;
}

export class KnowledgeBaseService {
  listServices(): CivicService[] {
    return listServices();
  }

  getService(serviceId: string) {
    return findServiceById(serviceId);
  }

  answerQuestion(question: string, serviceId?: string) {
    const faqs: ServiceFaq[] = serviceId
      ? findServiceById(serviceId)?.faqs ?? []
      : searchFaqs(question);

    if (!faqs.length) {
      return undefined;
    }

    const sorted = [...faqs].sort((a, b) => scoreFaqMatch(question, b) - scoreFaqMatch(question, a));
    return sorted[0];
  }
}
