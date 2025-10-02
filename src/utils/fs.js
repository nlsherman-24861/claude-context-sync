import { promises as fs } from 'fs';
import { dirname } from 'path';
import { parse, stringify } from 'yaml';

export async function ensureDir(path) {
  try {
    await fs.mkdir(path, { recursive: true });
    return true;
  } catch (error) {
    throw new Error(`Failed to create directory ${path}: ${error.message}`);
  }
}

export async function fileExists(path) {
  try {
    await fs.access(path);
    return true;
  } catch {
    return false;
  }
}

export async function readYaml(path) {
  try {
    const content = await fs.readFile(path, 'utf-8');
    return parse(content);
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error(`File not found: ${path}`);
    }
    throw new Error(`Failed to read YAML file ${path}: ${error.message}`);
  }
}

export async function writeYaml(path, data, options = {}) {
  try {
    // Ensure directory exists
    const dir = dirname(path);
    await ensureDir(dir);
    
    const yamlContent = stringify(data, {
      indent: 2,
      lineWidth: 100,
      ...options
    });
    
    await fs.writeFile(path, yamlContent, 'utf-8');
    return true;
  } catch (error) {
    throw new Error(`Failed to write YAML file ${path}: ${error.message}`);
  }
}

export async function readText(path) {
  try {
    return await fs.readFile(path, 'utf-8');
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error(`File not found: ${path}`);
    }
    throw new Error(`Failed to read file ${path}: ${error.message}`);
  }
}

export async function writeText(path, content) {
  try {
    // Ensure directory exists
    const dir = dirname(path);
    await ensureDir(dir);
    
    await fs.writeFile(path, content, 'utf-8');
    return true;
  } catch (error) {
    throw new Error(`Failed to write file ${path}: ${error.message}`);
  }
}