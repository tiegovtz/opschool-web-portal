import type { AdtCatalogue } from '../../shared/adt/catalogue';

// Automated-test fixture only. Application endpoints never import this catalogue.
export const adtPreviewCatalogue: AdtCatalogue = {
  configured: false, preview: true,
  levels: [
    { id: 'primary', name: 'Primary', classIds: ['p3', 'p4'], subjectIds: ['science', 'math', 'sw'] },
    { id: 'preprimary', name: 'Pre-primary', classIds: ['p0'], subjectIds: ['sw'] },
    { id: 'ordinary', name: 'Ordinary Secondary', classIds: ['f1', 'f2'], subjectIds: ['science', 'math', 'english'] },
    { id: 'advanced', name: 'Advanced Secondary', classIds: ['f5'], subjectIds: ['science'] },
  ],
  classes: [
    { id: 'p0', name: 'Darasa la Awali', levelIds: ['preprimary'], subjectIds: ['sw'] },
    { id: 'p3', name: 'Darasa la 3', levelIds: ['primary'], subjectIds: ['science', 'sw'] },
    { id: 'p4', name: 'Darasa la 4', levelIds: ['primary'], subjectIds: ['math'] },
    { id: 'f1', name: 'Form 1', levelIds: ['ordinary'], subjectIds: ['science', 'english'] },
    { id: 'f2', name: 'Form 2', levelIds: ['ordinary'], subjectIds: ['math'] },
    { id: 'f5', name: 'Form 5', levelIds: ['advanced'], subjectIds: ['science'] },
  ],
  subjects: [
    { id: 'science', name: 'Science', levelIds: ['primary', 'ordinary', 'advanced'], classIds: ['p3', 'f1', 'f5'] },
    { id: 'math', name: 'Mathematics', levelIds: ['primary', 'ordinary'], classIds: ['p4', 'f2'] },
    { id: 'sw', name: 'Kiswahili', levelIds: ['primary', 'preprimary'], classIds: ['p0', 'p3'] },
    { id: 'english', name: 'English', levelIds: ['ordinary'], classIds: ['f1'] },
  ],
  languages: [{ id: 'sw', name: 'Kiswahili' }, { id: 'en', name: 'English' }],
  curricula: [{ id: '2023', name: '2023 Curriculum' }],
  books: [
    ['p-science', 'Sayansi na Teknolojia', 'primary', 'p3', 'science', 'sw'],
    ['p-math', 'Hisabati', 'primary', 'p4', 'math', 'sw'],
    ['p-language', 'Kusoma na Kuandika', 'primary', 'p3', 'sw', 'sw'],
    ['p-early', 'Hatua za Mwanzo', 'preprimary', 'p0', 'sw', 'sw'],
    ['s-science', 'Exploring Science', 'ordinary', 'f1', 'science', 'en'],
    ['s-math', 'Basic Mathematics', 'ordinary', 'f2', 'math', 'en'],
    ['s-english', 'English for Secondary Schools', 'ordinary', 'f1', 'english', 'en'],
    ['s-advanced', 'Advanced Science', 'advanced', 'f5', 'science', 'en'],
  ].map(([id, title, level, classId, subject, languageId]) => ({
    id, title, levelIds: [level], classIds: [classId], subjectIds: [subject],
    curriculumIds: ['2023'], languageId, language: languageId === 'sw' ? 'Kiswahili' : 'English',
    coverUrl: null, features: ['Audio', 'Interactive activities'], pages: 64,
  })),
};
