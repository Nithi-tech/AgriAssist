// /src/lib/fsio.ts

import { promises as fs } from 'fs';
import path from 'path';

const DATA_ROOT = path.join(process.cwd(), 'data');
const PRICES_DIR = path.join(DATA_ROOT, 'prices');
const META_DIR = path.join(DATA_ROOT, 'meta');
const POPULAR_DIR = path.join(META_DIR, 'popular');

/**
 * Ensure directory exists
 */
export async function ensureDir(dirPath: string): Promise<void> {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch (error: any) {
    if (error.code !== 'EEXIST') {
      throw error;
    }
  }
}

/**
 * Initialize data directory structure
 */
export async function initDataDirectories(): Promise<void> {
  await ensureDir(DATA_ROOT);
  await ensureDir(PRICES_DIR);
  await ensureDir(META_DIR);
  await ensureDir(POPULAR_DIR);
}

/**
 * Safely read JSON file
 */
export async function readJSONFile<T>(filePath: string): Promise<T | null> {
  try {
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data) as T;
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      return null; // File doesn't exist
    }
    console.error(`Error reading JSON file ${filePath}:`, error);
    throw error;
  }
}

/**
 * Safely write JSON file with atomic operation (temp file + rename)
 */
export async function writeJSONFile(filePath: string, data: any): Promise<void> {
  const tempFilePath = `${filePath}.tmp`;
  const dirPath = path.dirname(filePath);
  
  try {
    // Ensure directory exists
    await ensureDir(dirPath);
    
    // Write to temp file first
    await fs.writeFile(tempFilePath, JSON.stringify(data, null, 2), 'utf8');
    
    // Atomically move temp file to final location
    await fs.rename(tempFilePath, filePath);
  } catch (error) {
    // Clean up temp file on error
    try {
      await fs.unlink(tempFilePath);
    } catch (cleanupError) {
      // Ignore cleanup errors
    }
    throw error;
  }
}

/**
 * Get file path for daily state data
 */
export function getDailyStateFilePath(date: string, state: string): string {
  const stateFileName = state.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '.json';
  return path.join(PRICES_DIR, date, stateFileName);
}

/**
 * Get file path for meta index
 */
export function getMetaIndexFilePath(): string {
  return path.join(META_DIR, 'index.json');
}

/**
 * Get file path for popular commodities by state
 */
export function getPopularCommoditiesFilePath(state: string): string {
  const stateFileName = state.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '.json';
  return path.join(POPULAR_DIR, stateFileName);
}

/**
 * List all available dates with price data
 */
export async function getAvailableDates(): Promise<string[]> {
  try {
    const entries = await fs.readdir(PRICES_DIR, { withFileTypes: true });
    const dates = entries
      .filter(entry => entry.isDirectory())
      .map(entry => entry.name)
      .filter(name => /^\d{4}-\d{2}-\d{2}$/.test(name)) // ISO date format
      .sort()
      .reverse(); // Most recent first
    
    return dates;
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      return []; // Directory doesn't exist yet
    }
    throw error;
  }
}

/**
 * List all available states for a given date
 */
export async function getAvailableStates(date: string): Promise<string[]> {
  try {
    const dateDir = path.join(PRICES_DIR, date);
    const entries = await fs.readdir(dateDir, { withFileTypes: true });
    const states = entries
      .filter(entry => entry.isFile() && entry.name.endsWith('.json'))
      .map(entry => {
        // Convert kebab-case filename back to state name
        const baseName = path.basename(entry.name, '.json');
        return baseName
          .split('-')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
      })
      .sort();
    
    return states;
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      return []; // Directory doesn't exist
    }
    throw error;
  }
}

/**
 * Read daily state file
 */
export async function readDailyStateFile(date: string, state: string): Promise<any> {
  const filePath = getDailyStateFilePath(date, state);
  return readJSONFile(filePath);
}

/**
 * Write daily state file
 */
export async function writeDailyStateFile(date: string, state: string, data: any): Promise<void> {
  const filePath = getDailyStateFilePath(date, state);
  await writeJSONFile(filePath, data);
}

/**
 * Read meta index file
 */
export async function readMetaIndex(): Promise<any> {
  const filePath = getMetaIndexFilePath();
  return readJSONFile(filePath);
}

/**
 * Write meta index file
 */
export async function writeMetaIndex(data: any): Promise<void> {
  const filePath = getMetaIndexFilePath();
  await writeJSONFile(filePath, data);
}

/**
 * Read popular commodities file for a state
 */
export async function readPopularCommodities(state: string): Promise<any> {
  const filePath = getPopularCommoditiesFilePath(state);
  return readJSONFile(filePath);
}

/**
 * Write popular commodities file for a state
 */
export async function writePopularCommodities(state: string, data: any): Promise<void> {
  const filePath = getPopularCommoditiesFilePath(state);
  await writeJSONFile(filePath, data);
}

/**
 * Check if file exists
 */
export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get file stats (size, modified time, etc.)
 */
export async function getFileStats(filePath: string): Promise<any> {
  try {
    return await fs.stat(filePath);
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      return null;
    }
    throw error;
  }
}

/**
 * Clean up old data files (keep only last N days)
 */
export async function cleanupOldDataFiles(keepDays: number = 30): Promise<number> {
  try {
    const availableDates = await getAvailableDates();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - keepDays);
    const cutoffISO = cutoffDate.toISOString().split('T')[0];
    
    let deletedCount = 0;
    
    for (const date of availableDates) {
      if (date < cutoffISO) {
        const dateDir = path.join(PRICES_DIR, date);
        await fs.rmdir(dateDir, { recursive: true });
        deletedCount++;
      }
    }
    
    return deletedCount;
  } catch (error) {
    console.error('Error cleaning up old data files:', error);
    return 0;
  }
}

/**
 * Get total size of data directory in bytes
 */
export async function getDataDirectorySize(): Promise<number> {
  async function getDirectorySize(dirPath: string): Promise<number> {
    let totalSize = 0;
    
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        
        if (entry.isFile()) {
          const stats = await fs.stat(fullPath);
          totalSize += stats.size;
        } else if (entry.isDirectory()) {
          totalSize += await getDirectorySize(fullPath);
        }
      }
    } catch (error: any) {
      if (error.code !== 'ENOENT') {
        console.error(`Error reading directory ${dirPath}:`, error);
      }
    }
    
    return totalSize;
  }
  
  return getDirectorySize(DATA_ROOT);
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}
