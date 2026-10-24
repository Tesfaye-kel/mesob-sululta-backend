# Mesob Sululta

This project contains the Mesob Sululta website and related backend services.

## Notes
- Frontend: React + TypeScript + Vite
- Backend: Node.js service
- Content and services are organized by feature folders

## Service requirements
- The backend adds default requirements for existing services on startup and for newly created services.
- Service-specific defaults are provided in English, Amharic, and Afaan Oromo. Existing requirements are preserved; unmatched services receive a general document checklist.
- To fill missing requirements manually, run `node seedRequirements.js` from the `backend` directory.

## Employee first sign-in
- An employee must be approved and assigned an office and weekly schedule before setting an initial password.
- From the Employee Portal, the employee selects the first-time password setup option and enters their registered work email, 12-digit National ID, and a new password (8–128 characters).
- Initial password setup is available in English, Amharic, and Afaan Oromo. It is rate-limited and the employee's identity details are stored as a keyed hash.
- The existing single-use activation link remains available as an optional alternative and expires after 72 hours.
- Employee Portal sign-in does not request an MFA code. Other staff and administrator authentication flows retain their configured MFA checks.

## Office name translations
- Public office cards display the office name in English, Amharic, or Afaan Oromo using the selected portal language.
- The public organization API supplies translations for supported office names, and the organization seed data uses the same translations. To persist them in existing organization records whose English or Amharic names are still duplicated from Afaan Oromo, review the database and run `npm run migrate:organization-translations` from `backend`.
- The migration changes only empty or source-language placeholder values; it preserves English and Amharic translations that are already different from the Afaan Oromo source name.
