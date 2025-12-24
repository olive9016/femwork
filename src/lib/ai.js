// src/lib/ai.js
// Cloud AI Integration using Anthropic Claude API

const ANTHROPIC_API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY
const API_URL = 'https://api.anthropic.com/v1/messages'

/**
 * Get AI insight using Anthropic Claude API
 * Works in production for all users
 */
export async function getAIInsight({ cycleDay, phase, energy, tasks, grounding }) {
  // Fallback if no API key
  if (!ANTHROPIC_API_KEY) {
    console.warn('No Anthropic API key found. Using fallback insights.')
    return {
      success: false,
      fallback: getFallbackInsight(phase, energy)
    }
  }

  try {
    const prompt = buildInsightPrompt({ cycleDay, phase, energy, tasks, grounding })
    
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 200,
        temperature: 0.7,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('Anthropic API error:', error)
      return {
        success: false,
        fallback: getFallbackInsight(phase, energy)
      }
    }

    const data = await response.json()
    const insight = data.content[0].text

    return {
      success: true,
      insight: insight,
      source: 'claude'
    }
  } catch (error) {
    console.error('AI insight error:', error)
    return {
      success: false,
      fallback: getFallbackInsight(phase, energy)
    }
  }
}

/**
 * Get AI task breakdown using Claude
 */
export async function getAITaskBreakdown({ taskName, phase, priority, deadline }) {
  console.log("🤖 AI Task Breakdown Called:")
  console.log("  Task:", taskName)
  console.log("  API Key present:", !!ANTHROPIC_API_KEY)
  
  if (!ANTHROPIC_API_KEY) {
    console.error("❌ No API key found! Check .env file")
    return {
      success: false,
      steps: []
    }
  }

  try {
    const prompt = buildTaskBreakdownPrompt({ taskName, phase, priority, deadline })
    console.log("  Sending to Claude API...")
    
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 300,
        temperature: 0.8,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })
    })

    console.log("  Response status:", response.status)

    if (!response.ok) {
      const error = await response.json()
      console.error("❌ API Error:", error)
      return { success: false, steps: [] }
    }

    const data = await response.json()
    console.log("  API Response:", data)
    
    const text = data.content[0].text
    console.log("  AI Generated Text:", text)
    
    // Parse steps from response (expected format: numbered list)
    const steps = text
      .split('\n')
      .filter(line => /^\d+\./.test(line.trim()))
      .map(line => line.replace(/^\d+\.\s*/, '').trim())
      .filter(step => step.length > 0)

    console.log("✅ Parsed Steps:", steps)

    return {
      success: true,
      steps: steps,
      source: 'claude'
    }
  } catch (error) {
    console.error('❌ Task breakdown error:', error)
    return {
      success: false,
      steps: []
    }
  }
}

/**
 * Build prompt for daily insight
 */
function buildInsightPrompt({ cycleDay, phase, energy, tasks, grounding, symptoms }) {
  const taskCount = tasks?.length || 0
  const groundingDone = grounding ? Object.values(grounding).filter(Boolean).length : 0
  const symptomText = symptoms && symptoms.length > 0 
    ? `Current symptoms: ${symptoms.join(', ')}` 
    : 'No symptoms logged today'
  
  return `You are a supportive productivity coach specializing in cycle-aware work planning.

Context:
- Cycle Day: ${cycleDay}
- Phase: ${phase}
- Energy Level: ${energy}
- ${symptomText}
- Tasks Today: ${taskCount}
- Grounding Rituals Done: ${groundingDone}/6

Provide a warm, supportive 2-3 sentence insight about:
1. Their work capacity today based on their cycle phase, energy, AND symptoms
2. One specific suggestion for how to approach their tasks (considering symptoms)
3. Encouragement that validates their current state

Be concise, empathetic, and practical. Acknowledge symptoms if present. No lists or bullet points - just natural, supportive prose.`
}

/**
 * Build prompt for task breakdown
 */
function buildTaskBreakdownPrompt({ taskName, phase, priority, deadline }) {
  return `Break down this work task into 3-5 clear, actionable micro-steps.

Task: "${taskName}"
Cycle Phase: ${phase}
Priority: ${priority}
Deadline: ${deadline}

Consider:
- The person's cycle phase (${phase}) affects their cognitive style
- Steps should be specific and actionable
- Start with preparation/gathering, end with completion/confirmation
- Keep language simple and direct

Provide ONLY a numbered list of steps (e.g., "1. Find X", "2. Prepare Y"). No introduction or explanation.`
}

/**
 * Fallback insights when API unavailable
 */
function getFallbackInsight(phase, energy) {
  const insights = {
    'Menstrual': {
      'Low': "Your body is asking for rest today. One or two gentle tasks are plenty. Honor this slower pace.",
      'Medium': "Day 1-5 energy is naturally gentler. Focus on easier tasks and give yourself permission to move slowly.",
      'High': "Even with decent energy, your body is still menstruating. Balance productivity with extra rest today."
    },
    'Follicular': {
      'Low': "Follicular phase usually brings energy, but today feels different. Start with one small win to build momentum.",
      'Medium': "Your creative energy is rising. Perfect time for planning and fresh starts. Take advantage of this clarity.",
      'High': "This is your power phase! Great time for new projects, learning, and creative work. Channel this energy wisely."
    },
    'Ovulatory': {
      'Low': "Peak energy phase but you're feeling low - listen to your body. Even superheroes need rest days.",
      'Medium': "Solid ovulatory energy. Ideal for communication tasks, meetings, and collaborative work.",
      'High': "You're at peak capacity! Perfect time for important meetings, presentations, or challenging work. Make it count."
    },
    'Luteal': {
      'Low': "Luteal phase + low energy is your body's signal to slow down. Focus on completion rather than starting new things.",
      'Medium': "Great energy for detail work and finishing projects. Your focus is sharp - use it for editing and refinement.",
      'High': "Strong luteal energy is perfect for organizing, reviewing, and crossing things off your list. Channel it into completion."
    }
  }

  return insights[phase]?.[energy] || "Listen to your body today. Work with your energy, not against it."
}

/**
 * Check if API key is configured
 */
export function isAIConfigured() {
  return !!ANTHROPIC_API_KEY
}

/**
 * Get AI status for UI
 */
export function getAIStatus() {
  if (ANTHROPIC_API_KEY) {
    return {
      configured: true,
      provider: 'Anthropic Claude',
      message: '🤖 AI Ready'
    }
  }
  
  return {
    configured: false,
    provider: 'None',
    message: '⚠️ AI Offline (using fallbacks)'
  }
}