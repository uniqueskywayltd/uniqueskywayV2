# SPRINT_G3_CERTIFICATION.md

## Result

**PASS — Sprint G3 Learning Experience certified**

Date: 2026-07-13  
Branch: `milestone-6-sprint-g3-education` (merged to `main`)  
Authority: `LEARNING_EXPERIENCE_PRINCIPLES.md` (**DEC-0052**), `DEC-0054`, `DEC-0056`, `CUSTOMER_EDUCATION_GUIDE.md`, `GROWTH_EXPERIENCE_SPECIFICATION.md`, `EP-029`  
Consultancy score: **100 / 100**

## Scope completed

Education answering **What should I learn next?**

| Deliverable | Status |
| --- | --- |
| Learn home with recommended next lesson | PASS |
| Learning paths (Getting Started → Referrals) | PASS |
| Lesson detail (time, body, related, mark as read) | PASS |
| Progress (completed / in progress / recommended) | PASS |
| Search across catalog | PASS |
| No LMS / quizzes / certificates / points / streaks | PASS |
| Money actions remain unblocked | PASS |

## Explicitly out of scope

- Hosted video platform (text-first; principles allow optional video later)  
- Quizzes / certificates  
- Referral invite polish (G4)  
- Statement redesign (G2 frozen)  

## Architecture

- Static glossary-safe catalog: `learning-catalog.ts`  
- `CustomerLearningService` + audit-backed completion (`customer.lesson_completed`)  
- Routes: `GET /api/customer/learn`, `GET …/[slug]`, `POST …/complete`  
- UI: `/account/learn`, `/account/learn/[slug]`  

## Verification

| Gate | Result |
| --- | --- |
| Lint | PASS |
| Typecheck | PASS |
| Unit `learning-catalog.test.ts` | PASS (3) |
| E2E learning + success hub | PASS (5) |

## Stop

Do not start G4 until consultancy accepts this sprint and merges to `main`.
