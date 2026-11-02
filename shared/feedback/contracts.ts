import { feedbackQuestions } from './questions.ts';
import { z } from 'zod';
export const contactSchema = z.object({ name: z.string().trim().max(100).default(''), email: z.union([z.literal(''), z.string().trim().email().max(254)]).default(''), phone: z.string().trim().max(30).regex(/^[+()\d\s.-]*$/).default('') });
export const attachmentSchema = z.object({ name: z.string().max(150), type: z.enum(['image/png', 'image/jpeg', 'image/webp']), data: z.string().max(2800000) }).superRefine((file, ctx) => {
  const prefix = `data:${file.type};base64,`;
  const content = file.data.slice(prefix.length);
  const signature = file.type === 'image/png' ? 'iVBORw0KGgo' : file.type === 'image/jpeg' ? '/9j/' : 'UklGR';
  if (!file.data.startsWith(prefix) || !/^[A-Za-z0-9+/]+={0,2}$/.test(content) || !content.startsWith(signature)) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Invalid screenshot.' });
});
export const feedbackSchema = z.object({ language: z.enum(['en', 'sw']), educationLevel: z.enum(['primary', 'secondary']), answers: z.array(z.object({ question: z.string().max(1000), answer: z.string().trim().max(5000) })).min(9).max(10), contact: contactSchema }).superRefine((input, ctx) => {
  const questions = feedbackQuestions[input.language].slice(0, input.language === 'sw' ? 10 : 9);
  if (input.answers.length !== questions.length) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Invalid survey answers.' });
  questions.forEach((question,index) => {
    const answer = input.answers[index]?.answer;
    const issueAnswer = input.answers[3]?.answer;
    const required = question.required && (index !== 4 || issueAnswer === feedbackQuestions[input.language][3].options[0]);
    if (required && !answer) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Complete the required questions.' });
    if (answer && question.options.length && !(question.options as readonly string[]).includes(answer)) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Invalid survey choice.' });
  });
});
