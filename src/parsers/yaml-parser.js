import { parse, stringify, parseDocument } from 'yaml';
import { readYaml } from '../utils/fs.js';

export class YamlParseError extends Error {
  constructor(message, filepath, lineNumber = null, columnNumber = null) {
    super(message);
    this.name = 'YamlParseError';
    this.filepath = filepath;
    this.lineNumber = lineNumber;
    this.columnNumber = columnNumber;
  }
}

export async function parseYamlFile(filepath) {
  try {
    return await readYaml(filepath);
  } catch (error) {
    if (error.message.includes('Failed to read YAML file')) {
      // Extract YAML parse error details if available
      const yamlError = error.message.match(/at line (\d+), column (\d+)/);
      const lineNumber = yamlError ? parseInt(yamlError[1]) : null;
      const columnNumber = yamlError ? parseInt(yamlError[2]) : null;
      
      throw new YamlParseError(
        `Invalid YAML syntax: ${error.message}`,
        filepath,
        lineNumber,
        columnNumber
      );
    }
    throw error;
  }
}

export function parseYamlString(content, filepath = '<string>') {
  try {
    return parse(content);
  } catch (error) {
    const lineNumber = error.linePos?.[0]?.line;
    const columnNumber = error.linePos?.[0]?.col;
    
    throw new YamlParseError(
      `Invalid YAML syntax: ${error.message}`,
      filepath,
      lineNumber,
      columnNumber
    );
  }
}

export function stringifyYaml(data, options = {}) {
  return stringify(data, {
    indent: 2,
    lineWidth: 100,
    ...options
  });
}

export function validateBasicStructure(data) {
  const errors = [];
  
  if (!data || typeof data !== 'object') {
    errors.push('Root must be an object');
    return { valid: false, errors };
  }
  
  // Check for required top-level sections
  // Note: 'personal' section is legacy, replaced by structured sections (professional_background, personality, etc.)
  const requiredSections = ['technical', 'project_defaults'];
  for (const section of requiredSections) {
    if (!data[section]) {
      errors.push(`Missing required section: ${section}`);
    } else if (typeof data[section] !== 'object') {
      errors.push(`Section '${section}' must be an object`);
    }
  }

  // Validate personal section structure (legacy - optional)
  if (data.personal) {
    if (typeof data.personal !== 'object') {
      errors.push(`Section 'personal' must be an object`);
    } else {
      const personalRequired = ['name', 'role'];
      for (const field of personalRequired) {
        if (!data.personal[field]) {
          errors.push(`Missing required field: personal.${field}`);
        }
      }
    }
  }
  
  // Validate technical section arrays
  if (data.technical && typeof data.technical === 'object') {
    const arrayFields = ['preferred_languages', 'frameworks', 'tools', 'platforms'];
    for (const field of arrayFields) {
      if (data.technical[field] && !Array.isArray(data.technical[field])) {
        errors.push(`Field 'technical.${field}' must be an array`);
      }
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

export function preserveComments(originalContent, newData) {
  try {
    // Parse with document to preserve comments
    const doc = parseDocument(originalContent);
    
    // Update the document with new data while preserving structure
    doc.contents = newData;
    
    return doc.toString();
  } catch (_error) {
    // Fallback to regular stringify if comment preservation fails
    return stringifyYaml(newData);
  }
}