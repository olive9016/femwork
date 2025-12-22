export function generateMicroTasks(mainTask = "") {
  if (!mainTask || typeof mainTask !== "string") return []

  const text = mainTask.toLowerCase()
  const sections = []

  // INSTAGRAM / SOCIAL MEDIA
  if (text.includes("instagram") || text.includes("post")) {
    sections.push({
      title: "Instagram content and scheduling",
      tasks: [
        "Clarify the goal for this week’s posts",
        "Decide how many posts are needed",
        "Choose themes for each post",
        "Select or create visuals",
        "Write captions",
        "Research and choose hashtags",
        "Choose best posting times",
        "Schedule posts",
        "Final review before publishing"
      ].map(t => ({ text: t, done: false }))
    })
  }

  // ACCOUNT SETUP
  if (
    text.includes("sign up") ||
    text.includes("register") ||
    text.includes("account")
  ) {
    sections.push({
      title: "Account setup and registration",
      tasks: [
        "Check what information is required",
        "Prepare email and password",
        "Complete registration form",
        "Verify email or authentication",
        "Confirm account access"
      ].map(t => ({ text: t, done: false }))
    })
  }

  // CONTENT UPLOAD
  if (text.includes("upload")) {
    sections.push({
      title: "Content upload and verification",
      tasks: [
        "Prepare files in correct format",
        "Check platform requirements",
        "Upload content",
        "Review uploaded content",
        "Confirm everything is live"
      ].map(t => ({ text: t, done: false }))
    })
  }

  // FALLBACK
  if (sections.length === 0) {
    sections.push({
      title: "Task breakdown",
      tasks: [
        "Clarify what needs to be done",
        "Gather any required information",
        "Start with the easiest step",
        "Complete the core work",
        "Review and finish"
      ].map(t => ({ text: t, done: false }))
    })
  }

  return sections
}
