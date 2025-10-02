import { loadConfig } from '../config/index.js';
import { createTransformer, getAvailableFormats } from '../transformers/index.js';
import { writeText } from '../utils/fs.js';
import { success, error, info } from '../utils/logger.js';

/**
 * Export preferences in specified format
 * @param {Object} options - Export options
 * @param {string} options.format - Output format (chat, claude-md)
 * @param {string} [options.output] - Output file path (optional, defaults to stdout)
 * @param {string} [options.section] - Specific section to export (optional)
 * @param {string} [options.configPath] - Custom config file path (optional)
 */
export async function exportCmd(options) {
  try {
    // Validate format
    if (!options.format) {
      throw new Error('Format is required. Use --format <format>');
    }

    const availableFormats = getAvailableFormats();
    if (!availableFormats.includes(options.format)) {
      throw new Error(`Unknown format: ${options.format}. Available formats: ${availableFormats.join(', ')}`);
    }

    // Load configuration
    const { config } = await loadConfig(options.configPath);
    
    // Filter by section if specified
    let preferences = config;
    if (options.section) {
      if (!config[options.section]) {
        throw new Error(`Section '${options.section}' not found in preferences`);
      }
      preferences = { [options.section]: config[options.section] };
    }

    // Create transformer and validate
    const transformer = createTransformer(options.format, preferences);
    const validation = transformer.validate();
    
    if (!validation.valid) {
      error(`Validation failed: ${validation.errors.join(', ')}`);
      process.exit(1);
    }

    // Transform
    const output = await transformer.transform();

    // Output to file or stdout
    if (options.output) {
      await writeText(options.output, output);
      success(`Exported to ${options.output}`);
    } else {
      console.log(output);
    }

  } catch (e) {
    error(`Export failed: ${e.message}`);
    process.exit(1);
  }
}

/**
 * Show available export formats
 */
export function showAvailableFormats() {
  const formats = getAvailableFormats();
  info('Available export formats:');
  formats.forEach(format => {
    console.log(`  ${format}`);
  });
}