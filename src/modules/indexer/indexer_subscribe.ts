import { QueryOptions } from 'winston';
import IndexerWrapper from "./indexer";


export interface IndexerSubscribe {
    subscribe(queryOptions: QueryOptions, listener: (...args: any[]) => void): void;
}