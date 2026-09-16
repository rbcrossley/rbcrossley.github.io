// =============================================================================
// FAQ Content — SINGLE SOURCE OF TRUTH
// -----------------------------------------------------------------------------
// Shown in the homepage FAQ section. Edit this array to add, remove, reorder
// or reword questions — nothing else needs to change. `answer` supports plain
// HTML (used for links/emphasis), since it is rendered with set:html.
// =============================================================================

export interface Faq {
  question: string;
  answer: string;
}

export const faqs: Faq[] = [
  {
    question: 'Who is Berojgar Engineer for?',
    answer:
      'Nepali computer engineering and IT graduates — students figuring out their next step, freshers job-hunting, working engineers picking up Linux/DevOps skills, and Loksewa aspirants preparing for government IT exams.',
  },
  {
    question: 'Does this site cover government IT jobs in Nepal?',
    answer:
      'Yes. There are dedicated guides for Loksewa Computer Engineer/IT Officer, NTC, RBB and other public-sector exams, plus a running vacancy calendar — see the <a href="/blog">Blog</a> and filter by the "Loksewa" category.',
  },
  {
    question: 'Are the technical tutorials tested and verified?',
    answer:
      'Every technical step is run and verified before it is published — not copied from documentation. See the site\'s <a href="/ai-policy">AI Use Policy</a> for exactly how AI is and isn\'t used in writing these guides.',
  },
  {
    question: 'Is this only for Computer Engineering graduates?',
    answer:
      'No — the Linux, DevOps and career guides apply to any IT/CS background (BSc.CSIT, BIT, BCA and similar), even though a lot of the government-exam content is written from a Computer Engineering angle.',
  },
  {
    question: 'How often is new content published?',
    answer:
      'New guides and articles go up regularly. The fastest way to catch new posts is the "Get New Guides in Your Inbox" box below, or checking the Latest Articles section on this page.',
  },
  {
    question: 'Can I suggest a topic or ask a question?',
    answer:
      'Yes — reach out through the <a href="/contact">Contact page</a>. Reader questions are one of the main sources for new guides on this site.',
  },
];
