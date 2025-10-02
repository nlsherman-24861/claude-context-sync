/**
 * Check if @claude is mentioned outside of code blocks
 * 
 * This prevents documentation and examples from triggering Claude
 * while still allowing legitimate mentions in comments and descriptions.
 * 
 * @param {string} text - The text to check
 * @returns {boolean} - True if @claude is mentioned outside code blocks
 */
function hasClaudeMentionOutsideCode(text) {
  if (!text) return false;

  // First check if @claude exists at all
  if (!text.includes('@claude')) return false;

  let cleaned = text;

  // Remove code blocks (```...```)
  // Match both with and without language specifiers
  cleaned = cleaned.replace(/```[\s\S]*?```/g, '');

  // Remove inline code (`...`)
  cleaned = cleaned.replace(/`[^`]*`/g, '');

  // Remove HTML code tags (<code>...</code>)
  cleaned = cleaned.replace(/<code>[\s\S]*?<\/code>/gi, '');

  // Remove HTML pre tags (<pre>...</pre>)
  cleaned = cleaned.replace(/<pre>[\s\S]*?<\/pre>/gi, '');

  // Now check if @claude still exists
  return cleaned.includes('@claude');
}

// For testing
if (require.main === module) {
  const testCases = [
    {
      input: 'Please @claude help me with this',
      expected: true,
      description: 'Simple mention'
    },
    {
      input: 'Use `@claude` to trigger the bot',
      expected: false,
      description: 'Inline code'
    },
    {
      input: '```\nComment: @claude fix this\n```',
      expected: false,
      description: 'Code block'
    },
    {
      input: 'Example:\n```markdown\n@claude implement this\n```\n\nNow actually @claude do it',
      expected: true,
      description: 'Code block plus real mention'
    },
    {
      input: '<code>@claude</code> is the trigger phrase',
      expected: false,
      description: 'HTML code tag'
    },
    {
      input: 'We use @claude automation here',
      expected: true,
      description: 'Plain text mention'
    },
    {
      input: 'Type `@claude fix bug` then @claude will respond',
      expected: true,
      description: 'Inline code plus real mention'
    }
  ];

  console.log('Running tests...\n');
  let passed = 0;
  let failed = 0;

  testCases.forEach(({ input, expected, description }) => {
    const result = hasClaudeMentionOutsideCode(input);
    const status = result === expected ? '✅ PASS' : '❌ FAIL';
    
    if (result === expected) {
      passed++;
    } else {
      failed++;
      console.log(`${status}: ${description}`);
      console.log(`  Input: ${JSON.stringify(input)}`);
      console.log(`  Expected: ${expected}, Got: ${result}\n`);
    }
  });

  console.log(`\nResults: ${passed}/${testCases.length} passed`);
  process.exit(failed > 0 ? 1 : 0);
}

module.exports = { hasClaudeMentionOutsideCode };
