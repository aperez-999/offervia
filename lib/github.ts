// Links to the public repo. No environment needed, so any module can import these.

/** Public source code. Offervia is free and open source. */
export const GITHUB_REPO_URL = "https://github.com/aperez-999/offervia";

/** Questions, ideas, and feedback: GitHub Discussions (enable it in the repo settings). */
export const DISCUSSIONS_URL = `${GITHUB_REPO_URL}/discussions`;

/** A new bug report on GitHub. */
export const NEW_ISSUE_URL = `${GITHUB_REPO_URL}/issues/new`;

/** Pre-filled GitHub issue for suggesting a Student Hub resource or deal. */
export function suggestResourceUrl() {
  const params = new URLSearchParams({
    title: "Student Hub suggestion: ",
    labels: "student-hub",
    body: [
      "**Name:**",
      "**Link (the official page, not an affiliate link):**",
      "**What a student gets:**",
      "**Who it's for (any student, a school email, a certain major):**",
    ].join("\n\n"),
  });
  return `${GITHUB_REPO_URL}/issues/new?${params.toString()}`;
}
