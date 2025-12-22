// src/lib/ollama.js
// Ollama AI Integration for FemWork

const OLLAMA_URL = 'http://localhost:11434/api/generate'

/**
 * Get AI-powered insight for the current cycle phase and tasks
 */
export async function getAIInsight({ cycleDay, phase, energy, tasks, grounding }) {
  try {
    const completedGrounding = Object.entries(grounding || {})
      .filter(([_, done]) => done)
      .map(([key, _]) => key)
    
    const taskSummary = tasks.length > 0 
      ? `Tasks today: ${tasks.slice(0, 3).map(t => t.name).join(', ')}${tasks.length > 3 ? ` and ${tasks.length - 3} more` : ''}`
      : 'No tasks scheduled today'
    
    const prompt = `You are a compassionate cycle-aware productivity coach for menstruating people. 

Current Status:
- Cycle Day: ${cycleDay}
- Phase: ${phase}
- Energy Level: ${energy}
- ${taskSummary}
- Grounding completed: ${completedGrounding.length > 0 ? completedGrounding.join(', ') : 'none yet'}

Give a warm, personalized insight about their work capacity today in 2-3 sentences. Be specific about what types of work suit them today and when to rest. Keep it encouraging and practical.`

    const response = await fetch(OLLAMA_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama3.2',
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.7,
          num_predict: 150
        }
      })
    })

    if (!response.ok) {
      throw new Error('Ollama not responding')
    }

    const data = await response.json()
    return {
      success: true,
      insight: data.response.trim()
    }
  } catch (error) {
    console.error('Ollama error:', error)
    return {
      success: false,
      error: error.message,
      fallback: getFallbackInsight(phase, energy)
    }
  }
}

/**
 * Get AI-powered task breakdown
 */
export async function getAITaskBreakdown({ taskName, phase, priority, deadline }) {
  try {
    const daysUntilDue = deadline ? Math.floor((new Date(deadline) - new Date()) / (1000 * 60 * 60 * 24)) : null
    const urgency = daysUntilDue !== null ? (daysUntilDue <= 1 ? 'urgent' : daysUntilDue <= 3 ? 'soon' : 'later') : 'no deadline'
    
    const prompt = `You are helping someone break down a task into micro-steps. They are in their ${phase} phase of their menstrual cycle.

Task: "${taskName}"
Priority: ${priority}
Deadline: ${urgency}

${phase === 'Menstrual' ? 'They have low energy - keep steps gentle and minimal (3-4 steps).' : ''}
${phase === 'Follicular' ? 'They have rising creative energy - steps can be exploratory (4-5 steps).' : ''}
${phase === 'Ovulatory' ? 'They have peak energy - steps can be comprehensive (5-6 steps).' : ''}
${phase === 'Luteal' ? 'They are detail-focused - steps should be precise (4-5 steps).' : ''}

Break this task into specific, actionable micro-steps. Each step should be something they can complete in one focused session.

Return ONLY the numbered list of steps, nothing else. Be very specific to the actual task, not generic advice.`

    const response = await fetch(OLLAMA_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama3.2',
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.8,
          num_predict: 250
        }
      })
    })

    if (!response.ok) {
      throw new Error('Ollama not responding')
    }

    const data = await response.json()
    
    // Parse numbered list from response
    const steps = data.response
      .split('\n')
      .filter(line => /^\d+\./.test(line.trim()))
      .map(line => line.replace(/^\d+\.\s*/, '').trim())
      .filter(step => step.length > 0)
    
    return {
      success: true,
      steps: steps
    }
  } catch (error) {
    console.error('Ollama task breakdown error:', error)
    return {
      success: false,
      error: error.message,
      steps: null
    }
  }
}

/**
 * Get AI-powered pattern analysis insight
 */
export async function getPatternAnalysis({ avgCycleLength, avgPeriodLength, isRegular, recentCycles }) {
  try {
    const prompt = `You are analyzing menstrual cycle patterns to provide helpful insights.

Pattern Data:
- Average cycle length: ${avgCycleLength} days
- Average period length: ${avgPeriodLength} days
- Cycle regularity: ${isRegular ? 'Regular' : 'Varies'}
- Total cycles tracked: ${recentCycles}

Provide a brief, encouraging insight about what this pattern means for their work planning. One paragraph, 2-3 sentences. Be positive and practical.`

    const response = await fetch(OLLAMA_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama3.2',
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.7,
          num_predict: 120
        }
      })
    })

    if (!response.ok) {
      throw new Error('Ollama not responding')
    }

    const data = await response.json()
    return {
      success: true,
      analysis: data.response.trim()
    }
  } catch (error) {
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * Check if Ollama is running
 */
export async function checkOllamaStatus() {
  try {
    const response = await fetch('http://localhost:11434/api/tags', {
      method: 'GET'
    })
    
    if (response.ok) {
      const data = await response.json()
      return {
        running: true,
        models: data.models || []
      }
    }
    
    return { running: false }
  } catch (error) {
    return { running: false }
  }
}

/**
 * Fallback insights when AI isn't available
 */
function getFallbackInsight(phase, energy) {
  const insights = {
    'Menstrual': {
      'Low': 'Rest is productive too. Focus on gentle tasks and give yourself permission to work slowly today.',
      'Medium': 'Your body is working hard internally. Honour that by choosing lighter tasks and taking breaks.',
      'High': 'Surprising energy today! Use it wisely on tasks you enjoy, but don\'t overcommit.'
    },
    'Follicular': {
      'Low': 'Energy might be building slowly. Start with small wins to build momentum.',
      'Medium': 'Great time for planning and creative thinking. Your ideas are flowing.',
      'High': 'Channel this rising energy into new projects and creative work. Perfect for brainstorming.'
    },
    'Ovulatory': {
      'Low': 'Even peak phase can have off days. Be gentle with yourself.',
      'Medium': 'Good energy for communication and collaboration. Schedule important conversations.',
      'High': 'You\'re at your peak! Perfect for presentations, difficult conversations, and delivering work.'
    },
    'Luteal': {
      'Low': 'Your body is preparing for rest. Honour that by scaling back ambitions today.',
      'Medium': 'Great focus for detail work and completion. Finish what you started.',
      'High': 'Good energy for getting things done. Focus on crossing items off your list.'
    }
  }
  
  return insights[phase]?.[energy] || 'Listen to your body and work at a pace that feels right today.'
}