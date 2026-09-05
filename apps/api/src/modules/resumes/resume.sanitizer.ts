const EMAIL_REGEX =
  /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;

const GREEK_PHONE_REGEX =
  /(?:\+?30[\s.-]?)?(?:69\d{8}|2\d{9})/g;

const PAGE_MARKER_REGEX =
  /^\s*--\s*\d+\s+of\s+\d+\s*--\s*$/i;

const PERSONAL_SECTION_REGEX =
  /^\s*(?:προσωπικά στοιχεία|personal details|personal information)\s*$/i;

const SENSITIVE_LABEL_REGEX =
  /^\s*(?:[•●▪◦*+-]\s*)?(?:όνομα|ονομα|επώνυμο|επωνυμο|ονοματεπώνυμο|name|surname|full\s+name|ημερομηνία\s+γέννησης|ημερομηνια\s+γεννησης|ημ\.?\s*γέννησης|date\s+of\s+birth|dob|ηλικία|ηλικια|age|ταχυδρομική\s+διεύθυνση|ταχυδρομικη\s+διευθυνση|διεύθυνση|διευθυνση|address|email|e-mail|ηλεκτρονικό\s+ταχυδρομείο|ηλεκτρονικο\s+ταχυδρομειο|τηλέφωνο|τηλεφωνο|κινητό|κινητο|phone|mobile|φύλο|φυλο|gender|sex|οικογενειακή\s+κατάσταση|οικογενειακη\s+κατασταση|marital\s+status|θρήσκευμα|θρησκευμα|religion|εθνικότητα|εθνικοτητα|υπηκοότητα|υπηκοοτητα|nationality|citizenship|αφμ|α\.?φ\.?μ\.?|αμκα|α\.?μ\.?κ\.?α\.?|tax\s+id|social\s+security)\s*[:\-–—]/i;

export function sanitizeResumeText(
  originalText: string
): string {
  const normalizedText =
    originalText
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n");

  const lines =
    normalizedText.split("\n");

  const sanitizedLines =
    lines
      .filter((line) => {
        const trimmed =
          line.trim();

        if (!trimmed) {
          return true;
        }

        if (
          PAGE_MARKER_REGEX.test(
            trimmed
          )
        ) {
          return false;
        }

        if (
          PERSONAL_SECTION_REGEX.test(
            trimmed
          )
        ) {
          return false;
        }

        if (
          SENSITIVE_LABEL_REGEX.test(
            trimmed
          )
        ) {
          return false;
        }

        return true;
      })
      .map((line) => {
        return line
          .replace(
            EMAIL_REGEX,
            "[REDACTED_EMAIL]"
          )
          .replace(
            GREEK_PHONE_REGEX,
            "[REDACTED_PHONE]"
          );
      });

  return sanitizedLines
    .join("\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}