

export interface DexCache {
    
    set(key: string): void;

    exists(key: string): Promise<boolean>;
}